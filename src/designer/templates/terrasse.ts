import * as THREE from 'three'
import type { Bom, Byggeregler, BuildOptions, DesignConfig, ProductTemplate, Tegning2D } from '../types'
import type { Beregningsgrunnlag, BomLinePlan, Form2DPlan, KapplisteDelPlan, MonteringSteg, Riss2DPlan } from '../plan-typer'
import { TRESLAG, treslagValg, fargeValg } from '../materials'
import { PRISER } from '../priser'
import { frostsoneForConfig, grunnForConfig, snolastForConfig } from '../byggested'
import { NYTTELAST, fmt } from '../laster'
import {
  BJELKER_C24,
  DOBLE_C24,
  dimensjonerDrager,
  dimensjonerGulvbjelke,
  dimensjonerStolpe,
  gulvlaster,
  kontrollerRekkverkstolpe,
  maksGulvbjelkeSpenn,
  tverrsnitt,
  type Dimensjonering,
  type Medlemskontroll,
  type Tverrsnitt,
} from '../dimensjonering'
import { fmtGrader, rundOppKapp, trappGeometri, type TrappGeometri } from '../geometri'
import { FROSTSONER, GRUNN, betongvekt, dimensjonerPunktfundament, frostdybde, type Frostresultat, type Frostsone, type Fundamentresultat, type Grunn } from '../fundament'
import { tilByggeregler, vurderByggesak, type ByggesakResultat } from '../byggesak'
import { lagBeregningsrapport, tilPlanVedlegg } from '../beregningsgrunnlag'
import { boks, byggGruppe, cross, flytt, kapplisteFra, lopemeter, norm, projiser, r1, unikeKappnavn, utstrekning, type Del, type Prisme, type Stav, type V3 } from './deler3d'

/**
 * Terrasse – parametrisk byggeplan etter norsk praksis (SINTEF Byggforsk
 * 517.xxx/522.xxx, Treindustriens monteringsanvisninger, TEK17 § 12-16/12-17).
 *
 * Oppbygging nedenfra:
 *  - Betongpilar (pilarrør) til frostfri dybde (`frostdybde`) + justerbar stolpesko.
 *  - Stolper 98×98 (eller 148×148) – `dimensjonerStolpe`. Høye terrasser får
 *    skråstag i begge retninger.
 *  - Dragere langs husveggen (x) oppå stolpene – `dimensjonerDrager`. Lave
 *    plattinger: drager rett på pilar, eller innfelt bjelkelag i bjelkesko.
 *  - Bjelkelag vinkelrett på huset (z), c/c 600 for 28 mm bord / 400 for 21 mm
 *    – `dimensjonerGulvbjelke` for faktisk spenn. Kantbjelker foran/bak, dobbel
 *    bjelke (skjøtebjelke) der terrassebordene skjøtes.
 *  - Terrassebord parallelt med huset, 4–5 mm fuge, forskjøvne skjøter over
 *    dobbel bjelke, hele bord ytterst og siste bord rippet inn mot vegg/skjøt.
 *  - Kantbord (dekkbord) med 45° gjæring i hjørnene.
 *  - Rekkverk automatisk der fallhøyden > 0,5 m (TEK17 § 12-17: ≥ 1,0 m,
 *    åpninger ≤ 100 mm, loddrette spiler – ikke klatrevennlig).
 *  - Trapp etter `trappGeometri` (stigning ≤ 180 mm, 2s + i ≈ 620 mm).
 *
 * ALT (3D, materialliste, kappliste, tegninger, bounds) bygges fra den samme
 * dellista i `modell(c)` – ingen drift mellom 3D og byggeplan.
 *
 * Koordinater (lokalt, før sentrering): x langs huset, z ut fra huset (front =
 * +z), y opp. Husveggen ligger ved z < 0 (rektangel) / i hakket (L/U).
 */

export interface TerrasseConfig {
  form: string // 'rektangel' | 'lForm' | 'lFormSpeil' | 'uForm'
  lengde: number // cm (x)
  bredde: number // cm (z)
  hovedLengde: number // cm (z)
  hovedBredde: number // cm (x)
  floyLengde: number // cm (z)
  floyBredde: number // cm (x)
  ytreLengde: number // cm (z)
  ytreBredde: number // cm (x)
  armBredde: number // cm
  hoyde: number // cm – overkant dekke ved husveggen (høyeste punkt)
  plassering: string // 'vegg' | 'frittstaende'
  fall: string // '0' | '1' (% fall ut fra huset)
  bord: string // '28x120' | '28x145' | '21x95'
  bjelkeDim: string // 'auto' | '48x148' | '48x198' | '48x223'
  kantbord: string // 'ja' | 'nei'
  rekkverk: string // 'auto' | 'alle' | 'ingen'
  gjerdeType: string // 'spiler' | 'bord' | 'tett'
  gjerdeHoyde: number // cm (overkant håndlist over dekket)
  trapp: string // 'ingen' | 'front'
  trappBredde: number // cm
  visning: string // 'overflate' | 'begge' | 'konstruksjon'
  treslag: string
  farge: string
  [key: string]: DesignConfig[string]
}

// ── Konstanter ─────────────────────────────────────────────────────

const SVINN = 1.1
const MAKS_LAGER = 5.4 // lengste standard lagerlengde (m) for bord/bjelker
const PILAR_OVER = 0.05 // pilartopp over terreng (m)
const SKO = 0.025 // stolpesko: endeved løftet over betong (m)
const PILAR_MIN = 0.03 // laveste tillatte pilartopp over terreng ved lav platting
const KB_T = 0.021 // kantbord-tykkelse
const KB_H = 0.145 // kantbord-høyde
const VEGG_LUFT = 0.02 // luftespalte mot husvegg (m)
const RP_N = 0.098 // rekkverksstolpe dybde (ut fra kanten)
const RP_CC_MAKS = 1.2 // maks c/c rekkverksstolper (praktisk); reduseres til kontrollen holder
const HL_T = 0.028 // håndlist 28 × 120
const HL_B = 0.12
const SPILE_T = 0.036
const SPILE_B = 0.048
const MAKS_AAPNING = 0.095 // < 100 mm åpning (TEK17), litt margin
const TRINN_B = 0.145
const TRINN_T = 0.028
const TRINN_NESE = 0.02
const VANGE_H = 0.248
const ANLEGG_H = 0.223
const SKRAA_MIN_STOLPE = 0.6 // stolper lengre enn dette får skråstag
const RAD = Math.PI / 180

interface BordType {
  id: string
  t: number
  b: number
  cc: number
  profil: string
  prisId: string
  reservePris: number
  dekke: 'terrassebord-28' | 'terrassebord-21'
}
const BORD: Record<string, BordType> = {
  '28x120': { id: '28x120', t: 0.028, b: 0.12, cc: 0.6, profil: '28 × 120 mm', prisId: 'terrassebord-28x120', reservePris: 30, dekke: 'terrassebord-28' },
  '28x145': { id: '28x145', t: 0.028, b: 0.145, cc: 0.6, profil: '28 × 145 mm', prisId: 'terrassebord-28x145', reservePris: 38, dekke: 'terrassebord-28' },
  '21x95': { id: '21x95', t: 0.021, b: 0.095, cc: 0.4, profil: '21 × 95 mm', prisId: 'terrassebord-21x95', reservePris: 19, dekke: 'terrassebord-21' },
}

const pris = (id: string, reserve = 0) => PRISER[id]?.pris ?? reserve
const mm = (m: number) => Math.round(m * 1000)
const P48 = (h: number) => `48 × ${h} mm`

// ── Lest og normalisert config ─────────────────────────────────────

interface T {
  form: string
  L: number
  B: number
  hL: number
  hB: number
  fL: number
  fB: number
  yL: number
  yB: number
  a: number
  H: number
  vegg: boolean
  fall: number
  bord: BordType
  bjelke: string
  kantbord: boolean
  rekkverk: 'auto' | 'alle' | 'ingen'
  gjerde: 'spiler' | 'bord' | 'tett'
  Hr: number
  trapp: boolean
  trappB: number
  grunn: Grunn
  sone: Frostsone
  sk: number
  treslag: string
}

const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d)
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

function les(c: TerrasseConfig): T {
  const cmv = (k: string, d: number, lo: number, hi: number) => clamp(num(c[k], d), lo, hi) / 100
  const form = ['rektangel', 'lForm', 'lFormSpeil', 'uForm'].includes(c.form) ? c.form : 'rektangel'
  const hL = cmv('hovedLengde', 600, 150, 1200)
  const yL = cmv('ytreLengde', 600, 300, 1000)
  const yB = cmv('ytreBredde', 700, 300, 1000)
  // Eldre lagrede design: bordbredde/gjerdeType/gjerdeSider.
  const legacyBord = c.bordbredde === '90' ? '21x95' : c.bordbredde === '145' ? '28x145' : undefined
  const bordId = typeof c.bord === 'string' && BORD[c.bord] ? c.bord : legacyBord ?? '28x120'
  const gt = String(c.gjerdeType ?? 'spiler')
  const gjerde: T['gjerde'] = gt === 'tett' || gt === 'hel' ? 'tett' : gt === 'bord' || gt === 'loddrett' || gt === 'vannrett' ? 'bord' : 'spiler'
  const rk = String(c.rekkverk ?? '')
  const rekkverk: T['rekkverk'] = rk === 'alle' || rk === 'ingen' || rk === 'auto' ? rk : gt === 'ingen' ? 'ingen' : c.gjerdeSider === 'alle' ? 'alle' : 'auto'
  const grunn = grunnForConfig(c)
  const sone = frostsoneForConfig(c).sone
  return {
    form,
    L: cmv('lengde', 500, 150, 1200),
    B: cmv('bredde', 300, 150, 800),
    hL,
    hB: cmv('hovedBredde', 300, 150, 900),
    fL: Math.min(cmv('floyLengde', 300, 100, 800), hL - 0.5),
    fB: cmv('floyBredde', 250, 100, 600),
    yL,
    yB,
    a: Math.min(cmv('armBredde', 200, 100, 400), yB / 2 - 0.5, yL - 0.5),
    H: cmv('hoyde', 50, 25, 250),
    vegg: c.plassering !== 'frittstaende',
    fall: c.fall === '0' ? 0 : 0.01,
    bord: BORD[bordId],
    bjelke: ['48x148', '48x198', '48x223'].includes(String(c.bjelkeDim)) ? String(c.bjelkeDim) : 'auto',
    kantbord: c.kantbord !== 'nei',
    rekkverk,
    gjerde,
    Hr: cmv('gjerdeHoyde', 100, 90, 120),
    trapp: c.trapp === 'front',
    trappB: cmv('trappBredde', 120, 80, 200),
    grunn,
    sone,
    sk: snolastForConfig(c).sk,
    treslag: typeof c.treslag === 'string' && TRESLAG[c.treslag] ? c.treslag : 'impregnert',
  }
}

// ── Form: rektangler, omriss, vegger ───────────────────────────────

interface Rekt {
  id: string
  x: number
  z: number
  w: number
  d: number
}
type P2 = [number, number]

function rekter(t: T): Rekt[] {
  switch (t.form) {
    case 'lForm':
      return [
        { id: 'hoved', x: 0, z: 0, w: t.hB, d: t.hL },
        { id: 'floy', x: t.hB, z: t.hL - t.fL, w: t.fB, d: t.fL },
      ]
    case 'lFormSpeil':
      return [
        { id: 'hoved', x: t.fB, z: 0, w: t.hB, d: t.hL },
        { id: 'floy', x: 0, z: t.hL - t.fL, w: t.fB, d: t.fL },
      ]
    case 'uForm':
      return [
        { id: 'front', x: 0, z: t.yL - t.a, w: t.yB, d: t.a },
        { id: 'arm-v', x: 0, z: 0, w: t.a, d: t.yL - t.a },
        { id: 'arm-h', x: t.yB - t.a, z: 0, w: t.a, d: t.yL - t.a },
      ]
    default:
      return [{ id: 'rekt', x: 0, z: 0, w: t.L, d: t.B }]
  }
}

function omriss(t: T): P2[] {
  const { hL, hB, fL, fB, yL, yB, a } = t
  switch (t.form) {
    case 'lForm':
      return [[0, 0], [hB, 0], [hB, hL - fL], [hB + fB, hL - fL], [hB + fB, hL], [0, hL]]
    case 'lFormSpeil':
      return [[fB, 0], [fB + hB, 0], [fB + hB, hL], [0, hL], [0, hL - fL], [fB, hL - fL]]
    case 'uForm':
      return [[0, 0], [a, 0], [a, yL - a], [yB - a, yL - a], [yB - a, 0], [yB, 0], [yB, yL], [0, yL]]
    default:
      return [[0, 0], [t.L, 0], [t.L, t.B], [0, t.B]]
  }
}

/** Husvegger terrassen ligger inntil (kun ved plassering «vegg»). */
function vegger(t: T): Array<[P2, P2]> {
  if (!t.vegg) return []
  const { hL, hB, fL, fB, yL, yB, a } = t
  switch (t.form) {
    case 'lForm':
      return [[[hB, 0], [hB, hL - fL]], [[hB, hL - fL], [hB + fB, hL - fL]]]
    case 'lFormSpeil':
      return [[[fB, 0], [fB, hL - fL]], [[0, hL - fL], [fB, hL - fL]]]
    case 'uForm':
      return [[[a, 0], [a, yL - a]], [[a, yL - a], [yB - a, yL - a]], [[yB - a, 0], [yB - a, yL - a]]]
    default:
      return [[[0, 0], [t.L, 0]]]
  }
}

interface Kant {
  i: number
  a: P2
  b: P2
  /** Enhetsretning a → b (i plan). */
  r: P2
  /** Utovervendt normal. */
  n: P2
  L: number
  vegg: boolean
}

const EPS = 1e-6
const iRekt = (rs: Rekt[], x: number, z: number) => rs.some((r) => x > r.x + EPS && x < r.x + r.w - EPS && z > r.z + EPS && z < r.z + r.d - EPS)

/** Overlapp (m) mellom to kolineære akseparallelle segmenter, 0 hvis ikke på samme linje. */
function overlapp(a1: P2, b1: P2, a2: P2, b2: P2): number {
  const horis1 = Math.abs(a1[1] - b1[1]) < EPS
  const horis2 = Math.abs(a2[1] - b2[1]) < EPS
  if (horis1 !== horis2) return 0
  if (horis1) {
    if (Math.abs(a1[1] - a2[1]) > 1e-4) return 0
    return Math.max(0, Math.min(Math.max(a1[0], b1[0]), Math.max(a2[0], b2[0])) - Math.max(Math.min(a1[0], b1[0]), Math.min(a2[0], b2[0])))
  }
  if (Math.abs(a1[0] - a2[0]) > 1e-4) return 0
  return Math.max(0, Math.min(Math.max(a1[1], b1[1]), Math.max(a2[1], b2[1])) - Math.max(Math.min(a1[1], b1[1]), Math.min(a2[1], b2[1])))
}

function kanter(t: T): Kant[] {
  const pts = omriss(t)
  const rs = rekter(t)
  const vs = vegger(t)
  return pts.map((a, i) => {
    const b = pts[(i + 1) % pts.length]
    const L = Math.hypot(b[0] - a[0], b[1] - a[1])
    const r: P2 = [(b[0] - a[0]) / L, (b[1] - a[1]) / L]
    let n: P2 = [r[1], -r[0]]
    const mx = (a[0] + b[0]) / 2 + n[0] * 0.01
    const mz = (a[1] + b[1]) / 2 + n[1] * 0.01
    if (iRekt(rs, mx, mz)) n = [-n[0], -n[1]]
    const vegg = vs.some(([va, vb]) => overlapp(a, b, va, vb) > L - 1e-4)
    return { i, a, b, r, n, L, vegg }
  })
}

type Sidetype = 'eksponert' | 'vegg' | 'intern'
type Side = 'v' | 'h' | 'b' | 'f'

function sidetype(r: Rekt, side: Side, ks: Kant[]): Sidetype {
  const seg: [P2, P2] =
    side === 'v' ? [[r.x, r.z], [r.x, r.z + r.d]] : side === 'h' ? [[r.x + r.w, r.z], [r.x + r.w, r.z + r.d]] : side === 'b' ? [[r.x, r.z], [r.x + r.w, r.z]] : [[r.x, r.z + r.d], [r.x + r.w, r.z + r.d]]
  let vegg = false
  for (const k of ks) {
    const o = overlapp(seg[0], seg[1], k.a, k.b)
    if (o > 1e-3) {
      if (!k.vegg) return 'eksponert'
      vegg = true
    }
  }
  return vegg ? 'vegg' : 'intern'
}

// ── Konstruksjonssystem (dimensjonering) ───────────────────────────

type Modus = 'stolper' | 'innfelt'

interface RektSystem {
  r: Rekt
  sider: Record<Side, Sidetype>
  kb: Record<Side, number>
  /** Ytre flater av bjelkelaget (rammen). */
  xl: number
  xr: number
  zb: number
  zf: number
  /** Senterlinjer for bjelker (z-retning) langs x. */
  bjelkeX: number[]
  /** Senter for dragerrader (z). */
  rader: number[]
  /** Senter for stolper/pilarer langs x (samme i alle rader). */
  stolpeX: number[]
  drager: Dimensjonering
  dragerSpenn: number
  lastbredde: number
  radSpenn: number
  utkrag: number
}

interface System {
  modus: Modus
  bjelke: Tverrsnitt
  bjelkeDim: Dimensjonering
  cc: number
  rekter: RektSystem[]
  stolpe: Dimensjonering | null
  stolpeB: number
  stolpeMaksL: number
  avstivet: boolean
  frost: Frostresultat
  fundDybde: number
  fund: Fundamentresultat
  bruk: 'A-gulv' | 'A-balkong'
  meldinger: string[]
  kostnad: number
}

const yTopp = (t: T, z: number) => t.H - t.fall * z

function jevnt(a: number, b: number, n: number): number[] {
  if (n <= 1) return [(a + b) / 2]
  return Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1))
}

const systemCache = new Map<string, System | null>()

function systemFor(t: T, ks: Kant[]): System | null {
  const key = JSON.stringify(t)
  const hit = systemCache.get(key)
  if (hit !== undefined) return hit
  const s = beregnSystem(t, ks)
  if (systemCache.size > 200) systemCache.clear()
  systemCache.set(key, s)
  return s
}

function rammeFor(r: Rekt, ks: Kant[], t: T) {
  const sider: Record<Side, Sidetype> = { v: sidetype(r, 'v', ks), h: sidetype(r, 'h', ks), b: sidetype(r, 'b', ks), f: sidetype(r, 'f', ks) }
  const kbv = (s: Side) => (t.kantbord && sider[s] === 'eksponert' ? KB_T : 0)
  const kb: Record<Side, number> = { v: kbv('v'), h: kbv('h'), b: kbv('b'), f: kbv('f') }
  return { sider, kb, xl: r.x + kb.v, xr: r.x + r.w - kb.h, zb: r.z + kb.b, zf: r.z + r.d - kb.f }
}

function beregnSystem(t: T, ks: Kant[]): System | null {
  const maksH = t.H
  const bruk: System['bruk'] = maksH > 0.5 ? 'A-balkong' : 'A-gulv'
  const cc = t.bord.cc
  const flater = gulvlaster({ bruk, dekke: t.bord.dekke, sk: t.sk })
  const kandidater = t.bjelke === 'auto' ? BJELKER_C24.filter((b) => b.h >= 148) : BJELKER_C24.filter((b) => `48x${b.h}` === t.bjelke)
  // Høyt dekke holder snøen borte fra bakken under → snøfri frostdybde.
  const frost = frostdybde({ sone: t.sone, grunn: t.grunn, snofri: t.H > 0.5 })
  const fundDybde = t.grunn === 'fjell' ? 0.3 : Math.max(0.6, frost.anbefaltDybdeM)
  const rs = rekter(t)
  const meldinger: string[] = []

  type Forsok = Omit<System, 'stolpe' | 'stolpeB' | 'stolpeMaksL' | 'avstivet' | 'frost' | 'fundDybde' | 'fund' | 'bruk' | 'meldinger' | 'kostnad'> & { kostnad: number }
  const prov = (bj: Tverrsnitt, modus: Modus): Forsok | null => {
    const jh = bj.h / 1000
    const maksS = maksGulvbjelkeSpenn(bj, { ccM: cc, bruk, sk: t.sk, dekke: t.bord.dekke, opplegglengdeMm: 48 })
    if (maksS < 0.5) return null
    const out: RektSystem[] = []
    let kost = 0
    for (const r of rs) {
      const ramme = rammeFor(r, ks, t)
      const { xl, xr, zb, zf } = ramme
      const D = zf - zb
      const W = xr - xl
      // Bjelker langs x: c/c ≤ cc.
      const nb = Math.max(2, Math.ceil((W - 0.048) / cc - 1e-9) + 1)
      const bjelkeX = jevnt(xl + 0.024, xr - 0.024, nb)
      const ax = W >= 1.5 ? 0.3 : Math.max(0.1, W * 0.15)
      let funnet: RektSystem | null = null
      // Dragerbredde avhenger av valgt drager → prøv kandidater, verifiser høyde.
      for (let m = 2; m <= 20 && !funnet; m++) {
        const sp = m === 1 ? W : (W - 2 * ax) / (m - 1)
        if (m > 2 && sp < 0.6) break
        const stolpeX = jevnt(xl + ax, xr - ax, m)
        for (const dragerKand of [[...BJELKER_C24.filter((b) => b.h >= 148), ...DOBLE_C24.filter((b) => b.antall === 2)]]) {
          const kand = modus === 'innfelt' ? dragerKand.filter((b) => b.h >= bj.h) : dragerKand
          // Rader: avhenger av dragerbredden i innfelt modus – bruk 96 mm konservativt.
          let rader: number[]
          let radSpenn: number
          let utkrag: number
          if (modus === 'stolper') {
            utkrag = D >= 1.2 ? 0.3 : Math.max(0.1, D * 0.2)
            const n = Math.max(2, Math.ceil((D - 2 * utkrag) / maksS - 1e-9) + 1)
            rader = jevnt(zb + utkrag, zf - utkrag, n)
            radSpenn = (D - 2 * utkrag) / (n - 1)
          } else {
            utkrag = 0
            const dw = 0.096
            const n = Math.max(2, Math.ceil((D - dw) / maksS - 1e-9) + 1)
            rader = jevnt(zb + dw / 2, zf - dw / 2, n)
            radSpenn = (D - dw) / (n - 1)
          }
          const lastbredde = rader.length > 2 ? radSpenn : radSpenn / 2 + utkrag
          const egenBjelke = (5 * 0.048 * (bj.h / 1000)) / cc
          const drager = dimensjonerDrager({
            spennM: sp,
            lastbreddeM: lastbredde,
            flatelaster: flater,
            ekstraLinjelaster: [{ navn: `Egenvekt bjelkelag ${bj.profil}`, type: 'egen', qk: egenBjelke * lastbredde }],
            tjenesteklasse: 3,
            kombinerVariable: false,
            sidestottet: true,
            opplegglengdeMm: 98,
            kandidater: kand,
          })
          if (!drager.ok) continue
          const dh = drager.valgt.h / 1000
          const lavesteRad = Math.min(...rader.map((z) => yTopp(t, z)))
          const klaring = modus === 'stolper' ? lavesteRad - t.bord.t - jh - dh - SKO : lavesteRad - t.bord.t - Math.max(jh, dh) - SKO
          if (klaring < PILAR_MIN - 1e-9) continue
          funnet = { r, ...ramme, bjelkeX, rader, stolpeX, drager, dragerSpenn: sp, lastbredde, radSpenn, utkrag }
        }
      }
      if (!funnet) return null
      out.push(funnet)
      const antallStolper = funnet.rader.length * funnet.stolpeX.length
      const dragerLm = funnet.rader.length * W * funnet.drager.valgt.antall
      kost += antallStolper * (450 + ((Math.PI * 0.01 * (fundDybde + PILAR_OVER)) / 0.0125) * 95) + dragerLm * pris(funnet.drager.valgt.pris ?? 'bjelke-48x198', 65) + funnet.bjelkeX.length * D * pris(bj.pris ?? 'bjelke-48x198', 65)
    }
    // Endelig bjelkekontroll med faktisk største spenn og c/c.
    const spenn = Math.max(...out.map((o) => o.radSpenn - (modus === 'innfelt' ? o.drager.valgt.b * o.drager.valgt.antall / 1000 : 0)))
    const ccFakt = Math.max(...out.map((o) => (o.bjelkeX.length > 1 ? o.bjelkeX[1] - o.bjelkeX[0] : cc)))
    const opplegg = modus === 'innfelt' ? 48 : Math.min(...out.map((o) => o.drager.valgt.b * o.drager.valgt.antall))
    const bjelkeDim = dimensjonerGulvbjelke({ spennM: spenn, ccM: ccFakt, bruk, sk: t.sk, dekke: t.bord.dekke, opplegglengdeMm: opplegg, kandidater: [bj] })
    if (!bjelkeDim.ok) return null
    return { modus, bjelke: bj, bjelkeDim, cc, rekter: out, kostnad: kost }
  }

  let beste: Forsok | null = null
  for (const modus of ['stolper', 'innfelt'] as Modus[]) {
    for (const bj of kandidater) {
      const f = prov(bj, modus)
      if (f && (!beste || f.kostnad < beste.kostnad - 1)) beste = f
    }
    if (beste) break
  }
  if (!beste && t.bjelke !== 'auto') {
    meldinger.push(`Valgt bjelkelag ${t.bjelke.replace('x', ' × ')} mm får ikke plass/holder ikke ved denne høyden – beregnet bjelkelag er brukt i stedet.`)
    for (const modus of ['stolper', 'innfelt'] as Modus[]) {
      for (const bj of BJELKER_C24.filter((b) => b.h >= 148)) {
        const f = prov(bj, modus)
        if (f && (!beste || f.kostnad < beste.kostnad - 1)) beste = f
      }
      if (beste) break
    }
  }
  if (!beste) return null
  const sys = beste

  // Stolper: lengde og last.
  const jh = sys.bjelke.h / 1000
  let maksL = 0
  let maksA = 0
  let dragerG = 0
  for (const o of sys.rekter) {
    const dh = o.drager.valgt.h / 1000
    for (const z of o.rader) {
      const L = yTopp(t, z) - t.bord.t - (sys.modus === 'stolper' ? jh + dh : Math.max(jh, dh)) - SKO - PILAR_OVER
      maksL = Math.max(maksL, L)
    }
    maksA = Math.max(maksA, o.dragerSpenn * o.lastbredde)
    dragerG = Math.max(dragerG, 5 * (o.drager.valgt.b * o.drager.valgt.antall * o.drager.valgt.h * 1e-6) * o.dragerSpenn)
  }
  const harStolper = sys.modus === 'stolper' && maksL >= 0.15
  const avstivet = harStolper && maksL > SKRAA_MIN_STOLPE
  const egenBjelke = (5 * 0.048 * jh) / sys.cc
  const stolpe = harStolper
    ? dimensjonerStolpe({
        lengdeM: maksL,
        belastningsarealM2: maksA,
        flatelaster: [...flater, { navn: 'Egenvekt bjelkelag', type: 'egen', qk: egenBjelke }],
        ekstraNGk: dragerG,
        tjenesteklasse: 3,
        knekklengdefaktor: avstivet ? 1.0 : 2.0,
        kombinerVariable: false,
        kandidater: [tverrsnitt(98, 98, 1, 'C24', 'stolpe-98x98'), tverrsnitt(148, 148, 1, 'C24', 'stolpe-148x148')],
      })
    : null
  if (stolpe && !stolpe.ok) meldinger.push(`Stolpe: ${stolpe.melding}`)
  const stolpeB = stolpe ? stolpe.valgt.b / 1000 : 0.098

  // Fundament (verste stolpe): egenlast + største av nyttelast/snø (ikke samtidig).
  const gFlate = flater.filter((f) => f.type === 'egen').reduce((s, f) => s + f.qk, 0) + egenBjelke
  const nytte = flater.find((f) => f.type === 'nytte')?.qk ?? 0
  const sno = flater.find((f) => f.type === 'sno')?.qk ?? 0
  const NGk = gFlate * maksA + dragerG + (harStolper ? 5 * stolpeB * stolpeB * maksL : 0)
  const fund = dimensjonerPunktfundament({
    NGk,
    NQk: [nytte >= sno ? { type: 'nytte', Nk: nytte * maksA } : { type: 'sno', Nk: sno * maksA }],
    grunn: t.grunn,
    dybdeM: fundDybde,
  })
  if (!fund.ok) meldinger.push(...fund.merknader)
  for (const o of sys.rekter) if (!o.drager.ok) meldinger.push(`Drager: ${o.drager.melding}`)

  return { ...sys, stolpe, stolpeB, stolpeMaksL: Math.max(0, maksL), avstivet, frost, fundDybde, fund, bruk, meldinger }
}

// ── Modell: alle deler ─────────────────────────────────────────────

interface Modell {
  t: T
  sys: System
  ks: Kant[]
  deler: Del[]
  trapp: (TrappGeometri & { xc: number; bredde: number; z0: number; Hf: number; vanger: number; trinnBord: number }) | null
  /** Forskyvning lokal → sentrert (legges til lokale koordinater). */
  forskyv: V3
  /** Sentrert boks over alle deler. */
  min: V3
  max: V3
  rekkverkKanter: number[]
  rekkverkHoyde: number
  /** Største c/c mellom rekkverksstolper (fra kontrollen). */
  rekkverkCC: number
  skjoter: number
  bjelkeskjoter: number
  arealM2: number
}

const POS: Record<string, string> = {
  Stolpe: 'A',
  Drager: 'B',
  Kantbjelke: 'C',
  Bjelke: 'D',
  Skjøtebjelke: 'E',
  Skjøtelask: 'F',
  Skråstag: 'G',
  Terrassebord: 'H',
  Kantbord: 'K',
  Rekkverksstolpe: 'L',
  Hjørnestolpe: 'M',
  Rekke: 'N',
  Spile: 'P',
  Rekkverksbord: 'P',
  Håndlist: 'R',
  Trappeanlegg: 'S',
  Trappevange: 'T',
  Trinnbord: 'U',
}

/** Navn uten kappvinkel-suffiks. */
const grunnNavn = (n: string) => n.replace(/ \(.*\)$/, '')

const modellCache = new Map<string, Modell>()

function modell(c: TerrasseConfig): Modell {
  const t = les(c)
  const key = JSON.stringify(t)
  const hit = modellCache.get(key)
  if (hit) return hit
  const m = byggModell(t)
  if (modellCache.size > 100) modellCache.clear()
  modellCache.set(key, m)
  return m
}

function byggModell(t0: T): Modell {
  let t = t0
  const ks = kanter(t)
  let sys0 = systemFor(t, ks)
  if (!sys0 && t.fall > 0) {
    // Lav og dyp terrasse: fallet spiser byggehøyden – legg den i vater.
    t = { ...t, fall: 0 }
    sys0 = systemFor(t, ks)
    if (sys0) sys0 = { ...sys0, meldinger: [...sys0.meldinger, 'Terrassen er for lav til fall 1:100 over hele dybden – den er lagt i vater. Åpne fuger drenerer dekket.'] }
  }
  if (!sys0) throw new Error('Terrasse: ingen gyldig konstruksjon for disse målene')
  const sys: System = sys0
  const rs = rekter(t)
  const deler: Del[] = []
  const T_ = t.bord.t
  const jh = sys.bjelke.h / 1000
  const bjProfil = sys.bjelke.boardProfil
  const yT = (z: number) => yTopp(t, z)
  let skjoter = 0
  let bjelkeskjoter = 0

  const stav = (d: Omit<Stav, 'type'>): Stav => {
    const s: Stav = { type: 'stav', ...d }
    deler.push(s)
    return s
  }
  const prisme = (d: Omit<Prisme, 'type'>): Prisme => {
    const p: Prisme = { type: 'prisme', ...d }
    deler.push(p)
    return p
  }

  /**
   * Pilarer: to dragere tett inntil hverandre (innfelt bjelkelag der to
   * delflater møtes) får én felles, større pilar i stedet for to som overlapper.
   */
  const leggPilar = (pid: string, x: number, z: number, r: number, h: number) => {
    for (const d of deler) {
      if (d.type !== 'sylinder' || d.navn !== 'Betongpilar') continue
      const dist = Math.hypot(d.c[0] - x, d.c[2] - z)
      if (dist < d.r + r + 0.05) {
        const nr = Math.max(d.r, r, dist / 2 + 0.07)
        d.c = [(d.c[0] + x) / 2, 0, (d.c[2] + z) / 2]
        d.r = nr
        d.h = Math.min(d.h, h)
        d.profil = `Ø${Math.round(nr * 2000)} felles pilar`
        return
      }
    }
    deler.push({ type: 'sylinder', pid, part: 'fundament', navn: 'Betongpilar', profil: `Ø${Math.round(r * 2000)} pilar`, lengdeMm: mm(h + sys.fundDybde), kapp: false, farge: 'betong', c: [x, 0, z], r, h, explode: [0, -0.5, 0] })
  }

  /** Del et emne [a, b] i biter ≤ maks ved gitte mulige skjøtepunkter (velg lengst mulig). */
  const delOpp = (a: number, b: number, punkter: number[], maks: number, forste = maks): number[] => {
    const kutt: number[] = []
    let s = a
    let grense = forste
    while (b - s > maks + 1e-9) {
      const kand = punkter.filter((p) => p > s + 0.3 && p <= s + grense + 1e-9 && p < b - 0.3)
      if (!kand.length) break
      const p = Math.max(...kand)
      kutt.push(p)
      s = p
      grense = maks
    }
    return kutt
  }

  for (const o of sys.rekter) {
    const { r, xl, xr, zb, zf } = o
    const dragerTv = o.drager.valgt
    const dh = dragerTv.h / 1000
    const dw = (dragerTv.b * dragerTv.antall) / 1000
    const innfelt = sys.modus === 'innfelt'
    // ── Fundament, stolper, dragere ──
    for (const zr of o.rader) {
      const dragerTopp = innfelt ? yT(zr) - T_ : yT(zr) - T_ - jh
      const dragerBunn = dragerTopp - dh
      const stolpeL = dragerBunn - SKO - PILAR_OVER
      const medStolpe = sys.modus === 'stolper' && sys.stolpe !== null && stolpeL >= 0.15
      const pilarTopp = medStolpe ? PILAR_OVER : dragerBunn - SKO
      const pr = pilarRadius(sys)
      const sb = medStolpe ? sys.stolpeB : dw
      o.stolpeX.forEach((x, i) => {
        const id = `${r.id}-${mm(zr)}-${i}`
        leggPilar(`pilar-${id}`, x, zr, pr, pilarTopp)
        stav({ pid: `sko-${id}`, part: 'fundament', navn: 'Stolpesko (justerbar)', profil: 'varmforsinket', lengdeMm: 120, kapp: false, farge: 'stal', a: [x - (medStolpe ? sb + 0.012 : 0.11) / 2, pilarTopp + SKO / 2, zr], b: [x + (medStolpe ? sb + 0.012 : 0.11) / 2, pilarTopp + SKO / 2, zr], bredde: medStolpe ? sb + 0.012 : dw, hoyde: SKO, explode: [0, -0.4, 0] })
        if (medStolpe) {
          stav({ pid: `stolpe-${id}`, part: 'stolpe', navn: 'Stolpe', profil: sys.stolpe!.valgt.boardProfil, lengdeMm: (dragerBunn - pilarTopp - SKO) * 1000, kapp: true, kategori: 'konstruksjon', kvalitet: 'C24 NTR AB', farge: 'impregnert', darken: 0.95, a: [x, pilarTopp + SKO, zr], b: [x, dragerBunn, zr], bredde: sb, hoyde: sb, opp: [0, 0, 1], explode: [0, -0.3, 0] })
        }
      })
      // Drager (lag side om side langs z), skjøtes over stolpe, forskjøvet per lag.
      for (let k = 0; k < dragerTv.antall; k++) {
        const zc = zr + (k - (dragerTv.antall - 1) / 2) * (dragerTv.b / 1000)
        const kutt = delOpp(xl, xr, o.stolpeX, MAKS_LAGER, k % 2 === 1 ? MAKS_LAGER - (o.dragerSpenn || 0) : MAKS_LAGER)
        const grenser = [xl, ...kutt, xr]
        for (let s = 0; s < grenser.length - 1; s++) {
          stav({ pid: `drager-${r.id}-${mm(zr)}-${k}-${s}`, part: 'bjelkelag', navn: 'Drager', profil: dragerTv.boardProfil, lengdeMm: (grenser[s + 1] - grenser[s]) * 1000, kapp: true, kategori: 'bjelkelag', kvalitet: 'C24 NTR AB', farge: 'impregnert', darken: 0.9, a: [grenser[s], dragerBunn + dh / 2, zc], b: [grenser[s + 1], dragerBunn + dh / 2, zc], bredde: dragerTv.b / 1000, hoyde: dh, merknad: kutt.length ? 'Skjøtes midt over stolpe' : undefined, explode: [0, -0.18, 0] })
        }
      }
      // Skråstag langs raden (ytterste felt i hver ende) når stolpene er høye.
      if (medStolpe && sys.avstivet && o.stolpeX.length >= 2) {
        const felt = o.stolpeX.length > 2 ? [0, o.stolpeX.length - 2] : [0]
        felt.forEach((f, fi) => {
          const x1 = o.stolpeX[f]
          const x2 = o.stolpeX[f + 1]
          const zFace = zr + sys.stolpeB / 2 + 0.024
          skraastag(`${r.id}-${mm(zr)}-${fi}`, [x1, zFace], [x2, zFace], 'x', fi === 1, pilarTopp + SKO, dragerBunn)
        })
      }
    }
    // Skråstag mellom radene (i z-retning) ved første og siste stolpelinje.
    if (sys.modus === 'stolper' && sys.avstivet && o.rader.length >= 2) {
      const linjer = o.stolpeX.length > 1 ? [0, o.stolpeX.length - 1] : [0]
      for (const li of linjer) {
        const x = o.stolpeX[li] + (li === 0 ? -1 : 1) * (sys.stolpeB / 2 + 0.024)
        for (let ri = 0; ri < o.rader.length - 1; ri++) {
          if (o.rader.length > 2 && ri > 0 && ri < o.rader.length - 2) continue
          const za = o.rader[ri]
          const zbb = o.rader[ri + 1]
          const dTopp = Math.min(yT(za), yT(zbb)) - T_ - jh - dh
          skraastag(`${r.id}-z-${li}-${ri}`, [x, za], [x, zbb], 'z', ri % 2 === 1, PILAR_OVER + SKO, dTopp)
        }
      }
    }

    // ── Bjelkelag ──
    const bjelkeZ0 = innfelt ? null : zb + 0.048
    const bjelkeZ1 = innfelt ? null : zf - 0.048
    // Skjøtelinjer for terrassebordene (forskjøvet mønster A/B) → skjøtebjelker.
    const bx0 = r.x
    const bx1 = r.x + r.w
    const indre = o.bjelkeX.slice(1, -1).map((x) => x + 0.024)
    const skjotA = bx1 - bx0 > MAKS_LAGER ? delOpp(bx0, bx1, indre, MAKS_LAGER) : []
    let skjotB = bx1 - bx0 > MAKS_LAGER ? delOpp(bx0, bx1, indre, MAKS_LAGER, MAKS_LAGER * 0.55) : []
    skjotB = skjotB.filter((x) => !skjotA.some((y) => Math.abs(x - y) < 1e-6))
    const skjotLinjer = [...skjotA, ...skjotB]
    const bjelkeLinjer: Array<{ x: number; navn: string }> = [...o.bjelkeX.map((x) => ({ x, navn: 'Bjelke' })), ...skjotLinjer.map((x) => ({ x: x + 0.024, navn: 'Skjøtebjelke' }))]
    bjelkeLinjer.forEach((bl, bi) => {
      const spenn: Array<[number, number]> = []
      if (innfelt) {
        for (let ri = 0; ri < o.rader.length - 1; ri++) spenn.push([o.rader[ri] + dw / 2, o.rader[ri + 1] - dw / 2])
      } else {
        // Skjøt i bjelkelaget (over drager) når bjelken blir lengre enn lagerlengden.
        const kutt = delOpp(bjelkeZ0!, bjelkeZ1!, o.rader.slice(1, -1).length ? o.rader : [], MAKS_LAGER)
        const g = [bjelkeZ0!, ...kutt, bjelkeZ1!]
        for (let s = 0; s < g.length - 1; s++) spenn.push([g[s], g[s + 1]])
        if (kutt.length) {
          bjelkeskjoter += kutt.length
          for (const zk of kutt) {
            const sideX = bl.navn === 'Skjøtebjelke' || bi === 0 ? bl.x + 0.048 : bl.x - 0.048
            const yk = yT(zk) - T_ - jh / 2
            stav({ pid: `lask-${r.id}-${bi}-${mm(zk)}`, part: 'bjelkelag', navn: 'Skjøtelask', profil: bjProfil, lengdeMm: 600, kapp: true, kategori: 'bjelkelag', kvalitet: 'C24 NTR AB', farge: 'impregnert', darken: 0.88, a: [sideX, yk + 0.0 - 0, zk - 0.3], b: [sideX, yk, zk + 0.3], bredde: 0.048, hoyde: jh, merknad: 'Skrus/boltes på siden av bjelkeskjøten over drager', explode: [0, -0.1, 0] })
          }
        }
      }
      spenn.forEach(([z0, z1], si) => {
        stav({ pid: `bjelke-${r.id}-${bi}-${si}`, part: 'bjelkelag', navn: bl.navn, profil: bjProfil, lengdeMm: (z1 - z0) * 1000, kapp: true, kategori: 'bjelkelag', kvalitet: 'C24 NTR AB', farge: 'impregnert', darken: bl.navn === 'Skjøtebjelke' ? 0.93 : 1, a: [bl.x, yT(z0) - T_ - jh / 2, z0], b: [bl.x, yT(z1) - T_ - jh / 2, z1], bredde: 0.048, hoyde: jh, merknad: bl.navn === 'Skjøtebjelke' ? 'Dobbel bjelke under bordskjøt' : undefined, explode: [0, -0.1, 0] })
      })
    })
    // Kantbjelker foran/bak (ikke i innfelt modus – der er dragerne kantbjelker).
    if (!innfelt) {
      for (const [zk, nav] of [[zb + 0.024, 'b'], [zf - 0.024, 'f']] as Array<[number, string]>) {
        const kutt = delOpp(xl, xr, o.bjelkeX.slice(1, -1), MAKS_LAGER)
        const g = [xl, ...kutt, xr]
        for (let s = 0; s < g.length - 1; s++) {
          stav({ pid: `kant-${r.id}-${nav}-${s}`, part: 'bjelkelag', navn: 'Kantbjelke', profil: bjProfil, lengdeMm: (g[s + 1] - g[s]) * 1000, kapp: true, kategori: 'bjelkelag', kvalitet: 'C24 NTR AB', farge: 'impregnert', darken: 0.95, a: [g[s], yT(zk) - T_ - jh / 2, zk], b: [g[s + 1], yT(zk) - T_ - jh / 2, zk], bredde: 0.048, hoyde: jh, merknad: kutt.length ? 'Skjøtes midt på bjelkeende' : undefined, explode: [0, -0.1, 0] })
        }
      }
    }

    // ── Terrassebord ──
    const bw = t.bord.b
    const gap = TRESLAG_GAP(t)
    const D = r.d
    const ripBak = !(o.sider.f !== 'eksponert' && o.sider.b === 'eksponert')
    const bredder: number[] = []
    const n = Math.floor((D + gap) / (bw + gap) + 1e-9)
    for (let i = 0; i < n; i++) bredder.push(bw)
    const rest = D - n * (bw + gap)
    if (rest >= 0.03) bredder.push(rest)
    else if (rest > 0.003 && n >= 2) {
      bredder.pop()
      const del = (bw + rest) / 2
      bredder.push(del, del)
    }
    // Rekkefølge: start med hele bord på den synlige siden.
    let z = ripBak ? r.z + r.d : r.z
    const kantX0 = bx0 + (o.sider.v === 'intern' ? 0.0015 : 0)
    const kantX1 = bx1 - (o.sider.h === 'intern' ? 0.0015 : 0)
    bredder.forEach((bb, i) => {
      const zc = ripBak ? z - bb / 2 : z + bb / 2
      z = ripBak ? z - bb - gap : z + bb + gap
      const skjot = i % 2 === 0 ? skjotA : skjotB.length ? skjotB : skjotA
      const g = [kantX0, ...skjot, kantX1]
      skjoter += skjot.length
      for (let s = 0; s < g.length - 1; s++) {
        const a0 = g[s] + (s > 0 ? 0.0015 : 0)
        const a1 = g[s + 1] - (s < g.length - 2 ? 0.0015 : 0)
        const rippet = bb < bw - 1e-4
        stav({ pid: `bord-${r.id}-${i}-${s}`, part: 'gulv', navn: 'Terrassebord', profil: t.bord.profil, lengdeMm: (a1 - a0) * 1000, kapp: true, kategori: 'dekke', kvalitet: TRESLAG[TRESLAG_ID(t)]?.label, farge: 'tre', a: [a0, yT(zc) - T_ / 2, zc], b: [a1, yT(zc) - T_ / 2, zc], bredde: bb, hoyde: T_, merknad: rippet ? `Rippes til ${mm(bb)} mm bredde` : undefined, explode: [0, 0.45, 0] })
      }
    })
  }

  // Skråstag: bord 48×98 boltet på stolpesiden, loddrette endekutt i stolpenes ytterkant.
  function skraastag(id: string, p1: P2, p2: P2, akse: 'x' | 'z', speil: boolean, yBunn: number, yTop: number) {
    const s = sys.stolpeB
    const along = akse === 'x' ? p2[0] - p1[0] : p2[1] - p1[1]
    const run = Math.abs(along) + s // fra ytterkant til ytterkant
    const lav = yBunn + 0.1
    const hoy = yTop - 0.05
    const rise = hoy - lav
    const B = 0.098
    // Aksevinkel φ: senterlinja går fra (0, lav + hv/2) til (run, hoy − hv/2), hv = B / cos φ.
    let phi = Math.atan2(rise, run)
    for (let k = 0; k < 30; k++) phi = Math.atan2(rise - B / Math.cos(phi), run)
    const hv = B / Math.cos(phi)
    if (rise - hv < 0.15 || run < 0.4) return
    const pts: Array<[number, number]> = speil
      ? [[0, hoy - hv], [0, hoy], [run, lav + hv], [run, lav]]
      : [[0, lav], [run, hoy - hv], [run, hoy], [0, lav + hv]]
    const start = akse === 'x' ? Math.min(p1[0], p2[0]) - s / 2 : Math.min(p1[1], p2[1]) - s / 2
    const o: V3 = akse === 'x' ? [start, 0, p1[1]] : [p1[0], 0, start]
    const u: V3 = akse === 'x' ? [1, 0, 0] : [0, 0, 1]
    const dir: [number, number] = speil ? [run, -(rise - hv)] : [run, rise - hv]
    const vinkel = phi / RAD
    prisme({ pid: `skraastag-${id}`, part: 'stolpe', navn: 'Skråstag', profil: P48(98), lengdeMm: utstrekning(pts, dir) * 1000, kapp: true, kategori: 'konstruksjon', kvalitet: 'C24 NTR AB', farge: 'impregnert', darken: 0.85, endeA: { vinkel, type: 'gjaering', merknad: 'loddrett kutt mot stolpe' }, endeB: { vinkel, type: 'gjaering', merknad: 'loddrett kutt mot stolpe' }, merknad: 'Boltes med M12 i hver stolpe', pts, o, u, v: [0, 1, 0], tykk: 0.048, explode: akse === 'x' ? [0, 0, 0.25] : [0.25, 0, 0] })
  }

  // ── Kantbord med 45° gjæring i hjørnene ──
  if (t.kantbord) {
    const harKb = (k: Kant) => !k.vegg
    ks.forEach((k, i) => {
      if (!harKb(k)) return
      const prev = ks[(i - 1 + ks.length) % ks.length]
      const next = ks[(i + 1) % ks.length]
      const konveks = (a: Kant, b: Kant) => a.r[0] * b.r[1] - a.r[1] * b.r[0]
      // Gjæring ved konvekse hjørner der nabokanten også har kantbord.
      const sgn = Math.sign(konveks(ks[0], ks[1]) || 1)
      const gjA = harKb(prev) && Math.sign(konveks(prev, k)) === sgn
      const gjB = harKb(next) && Math.sign(konveks(k, next)) === sgn
      const lengde = k.L
      const biter = Math.max(1, Math.ceil(lengde / MAKS_LAGER - 1e-9))
      for (let s = 0; s < biter; s++) {
        const u0 = (lengde * s) / biter
        const u1 = (lengde * (s + 1)) / biter
        const ga = s === 0 && gjA
        const gb = s === biter - 1 && gjB
        const pa: V3 = [k.a[0] + k.r[0] * u0, 0, k.a[1] + k.r[1] * u0]
        const pb: V3 = [k.a[0] + k.r[0] * u1, 0, k.a[1] + k.r[1] * u1]
        pa[1] = yT(pa[2]) - T_
        pb[1] = yT(pb[2]) - T_
        const L = Math.hypot(pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2])
        const u = norm([pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]])
        const v = norm(cross([0, 1, 0], u))
        // v-retning: ytterflate er der v·n > 0?
        const ut = v[0] * k.n[0] + v[2] * k.n[1] > 0 ? 1 : -1
        const ytre = 0
        const indre = -KB_T * ut
        const pts: Array<[number, number]> = [
          [0, ytre],
          [L, ytre],
          [L - (gb ? KB_T : 0), indre],
          [ga ? KB_T : 0, indre],
        ]
        // Ekstruderes nedover: w = u × v peker opp → senter KB_H/2 under overkant.
        const w = cross(u, v)
        const o: V3 = [pa[0] - w[0] * (KB_H / 2), pa[1] - w[1] * (KB_H / 2), pa[2] - w[2] * (KB_H / 2)]
        prisme({ pid: `kantbord-${i}-${s}`, part: 'kantbord', navn: 'Kantbord', profil: '21 × 145 mm', lengdeMm: L * 1000, kapp: true, kategori: 'dekke', kvalitet: TRESLAG[TRESLAG_ID(t)]?.label, farge: 'tre', darken: 0.97, endeA: ga ? { vinkel: 45, type: 'gjaering' } : undefined, endeB: gb ? { vinkel: 45, type: 'gjaering' } : undefined, pts, o, u, v, tykk: KB_H, explode: [k.n[0] * 0.3, 0, k.n[1] * 0.3] })
      }
    })
  }

  // ── Trapp ──
  let trapp: Modell['trapp'] = null
  const front = frontKant(t, ks)
  if (t.trapp && front) {
    const Hf = yT(front.z)
    const tg = trappGeometri({ hoydeMm: Hf * 1000 })
    if (tg.antallOpptrinn >= 2) {
      const W = Math.min(t.trappB, front.maksB)
      const xs0 = front.xc - W / 2
      const xs1 = front.xc + W / 2
      const z0 = front.z + 0.048
      const s = tg.stigningMm / 1000
      const i = tg.inntrinnMm / 1000
      const n = tg.antallOpptrinn
      const th = Math.atan2(s, i)
      const nVanger = Math.max(2, Math.ceil((W - 0.048) / 0.6 - 1e-9) + 1)
      // Trappeanlegg på kantbjelken/kantbordet.
      // Anlegget må gå klar av pilarene under fremre drager (lav platting).
      const frontPilar = Math.max(0.03, ...deler.filter((d) => d.type === 'sylinder' && Math.abs(d.c[2] - front.z) < d.r + 0.05).map((d) => (d.type === 'sylinder' ? d.c[1] + d.h + SKO + 0.005 : 0)))
      const anleggH = [ANLEGG_H, 0.198, 0.148, 0.098].find((h) => Hf - T_ - h >= frontPilar) ?? 0.098
      stav({ pid: 'trappeanlegg', part: 'trapp', navn: 'Trappeanlegg', profil: P48(Math.round(anleggH * 1000)), lengdeMm: W * 1000, kapp: true, kategori: 'konstruksjon', kvalitet: 'C24 NTR AB', farge: 'impregnert', darken: 0.9, a: [xs0, Hf - T_ - anleggH / 2, front.z + 0.024], b: [xs1, Hf - T_ - anleggH / 2, front.z + 0.024], bredde: 0.048, hoyde: anleggH, merknad: 'Boltes til kantbjelken; vangene henges i vinkelbeslag', explode: [0, 0, 0.3] })
      // Vanger: hel (ikke utfrest) 48 × 248 med påskrudde trinnklosser – full
      // bæredybde i vangen. Overkant vange = linja gjennom trinnenes bakkant.
      const yS = (k: number) => Hf - k * s - TRINN_T // underkant trinn k
      const cosT = Math.cos(th)
      const yLinje = (u: number) => yS(1) - (u * s) / i // overkant vange
      const yBot = (u: number) => yLinje(u) - VANGE_H / cosT
      const uTopp0 = (yS(1) * i) / s // overkant vange treffer bakken
      const uf = ((yS(1) - VANGE_H / cosT) * i) / s // underkant vange treffer bakken
      const pts: Array<[number, number]> = [[0, yS(1)], [uTopp0, 0]]
      if (uf > 0) pts.push([uf, 0], [0, yBot(0)])
      else pts.push([0, 0])
      const vangeL = utstrekning(pts, [cosT, -Math.sin(th)])
      // Trinnklosser (trekanter av 48 × 148) under hvert trinn.
      const klosser: Array<Array<[number, number]>> = []
      for (let k = 1; k <= n - 1; k++) {
        const u0 = (k - 1) * i
        const u1 = k * i
        const y1 = yLinje(u1)
        if (y1 >= 0) klosser.push([[u0, yS(k)], [u1, yS(k)], [u1, y1]])
        else klosser.push([[u0, yS(k)], [u1, yS(k)], [u1, 0], [Math.max(u0, uTopp0), 0]])
      }
      for (let v = 0; v < nVanger; v++) {
        const x = xs0 + 0.024 + ((W - 0.048) * v) / (nVanger - 1)
        prisme({ pid: `vange-${v}`, part: 'trapp', navn: 'Trappevange', profil: P48(248), lengdeMm: vangeL * 1000, kapp: true, kategori: 'konstruksjon', kvalitet: 'C24 NTR AB', farge: 'impregnert', darken: 0.9, endeA: { vinkel: tg.vangeToppkutt.gjaeringGrader, type: 'gjaering', merknad: 'loddkutt mot trappeanlegg' }, endeB: { vinkel: tg.vangeFotkutt.gjaeringGrader, type: 'gjaering', merknad: 'vannrett fotkutt' }, merknad: `Hel vange. Trinnklosser: ${n - 1} per vange, sages diagonalt (${fmtGrader(th / RAD)}) av 48 × 198-emner à ${mm(i)} mm (to klosser per emne), ${mm(i)} × ${mm(s)} mm`, pts, o: [x, 0, z0], u: [0, 0, 1], v: [0, 1, 0], tykk: 0.048, explode: [0, 0.1, 0.4] })
        klosser.forEach((kp, ki) => {
          prisme({ pid: `trinnkloss-${v}-${ki}`, part: 'trapp', navn: 'Trinnkloss', profil: 'trekantkloss', lengdeMm: utstrekning(kp, [1, 0]) * 1000, kapp: false, kategori: 'konstruksjon', kvalitet: 'C24 NTR AB', farge: 'impregnert', darken: 0.86, merknad: `Emne ${mm(i)} mm sages diagonalt (${fmtGrader(th / RAD)}) til to trekantklosser ${mm(i)} × ${mm(s)} mm; skrus og limes på vangen`, pts: kp, o: [x, 0, z0], u: [0, 0, 1], v: [0, 1, 0], tykk: 0.048, explode: [0, 0.2, 0.45] })
        })
      }
      // Trinn: bord 28 × 145 på tvers, hele bord foran (nese 20 mm), bakerste rippes.
      const dybde = i + TRINN_NESE
      const nb = Math.ceil((dybde + 0.005) / (TRINN_B + 0.005) - 1e-9)
      let trinnBord = 0
      for (let k = 1; k <= n - 1; k++) {
        let zf = z0 + k * i + TRINN_NESE
        for (let b = 0; b < nb; b++) {
          const bb = b < nb - 1 ? TRINN_B : dybde - (nb - 1) * (TRINN_B + 0.005)
          const zc = zf - bb / 2
          zf -= bb + 0.005
          trinnBord++
          stav({ pid: `trinn-${k}-${b}`, part: 'trapp', navn: 'Trinnbord', profil: '28 × 145 mm', lengdeMm: W * 1000, kapp: true, kategori: 'dekke', kvalitet: TRESLAG[TRESLAG_ID(t)]?.label, farge: 'tre', a: [xs0, Hf - k * s - TRINN_T / 2, zc], b: [xs1, Hf - k * s - TRINN_T / 2, zc], bredde: bb, hoyde: TRINN_T, merknad: bb < TRINN_B - 1e-4 ? `Rippes til ${mm(bb)} mm` : undefined, explode: [0, 0.3, 0.4] })
        }
      }
      trapp = { ...tg, xc: front.xc, bredde: W, z0, Hf, vanger: nVanger, trinnBord }
    }
  }

  // ── Rekkverk ──
  const rekkverkKanter: number[] = []
  const Hr = t.Hr
  const kreves = (k: Kant) => !k.vegg && Math.max(yT(k.a[1]), yT(k.b[1])) > 0.5 + 1e-9
  ks.forEach((k) => {
    if (k.vegg) return
    if (kreves(k) || t.rekkverk === 'alle') rekkverkKanter.push(k.i)
  })
  const effHr = rekkverkKanter.some((i) => kreves(ks[i])) ? Math.max(1.0, Hr) : Hr
  const rekkverkCC = rekkverkCCFor(effHr)
  if (rekkverkKanter.length) byggRekkverk(t, ks, rekkverkKanter, effHr, trapp, sys, rekkverkCC, stav, prisme)

  // ── Sentrering og boks ──
  unikeKappnavn(deler)
  const bb0 = boks(deler)
  const forskyv: V3 = [-(bb0.min[0] + bb0.max[0]) / 2, 0, -(bb0.min[2] + bb0.max[2]) / 2]
  flytt(deler, forskyv)
  const bb = boks(deler)
  const arealM2 = rs.reduce((s, r) => s + r.w * r.d, 0)
  return { t, sys, ks, deler, trapp, forskyv, min: bb.min, max: bb.max, rekkverkKanter, rekkverkHoyde: rekkverkKanter.length ? effHr : 0, rekkverkCC, skjoter, bjelkeskjoter, arealM2 }
}

const TRESLAG_ID = (t: T) => t.treslag
/** Fuge mellom terrassebord: fuktig impregnert krymper → 4 mm; tørre/modifiserte bord 5 mm (4–6 mm anbefalt). */
const TRESLAG_GAP = (t: T) => (t.treslag === 'impregnert' ? 0.004 : 0.005)

/** Fronten trappa går ut fra: kanten med størst z i hovedrektangelet. */
function frontKant(t: T, ks: Kant[]): { z: number; xc: number; maksB: number } | null {
  const rs = rekter(t)
  const hoved = t.form === 'uForm' ? rs[0] : rs[0]
  const z = hoved.z + hoved.d
  const xc = hoved.x + hoved.w / 2
  const kant = ks.find((k) => Math.abs(k.a[1] - z) < 1e-6 && Math.abs(k.b[1] - z) < 1e-6 && k.n[1] > 0 && !k.vegg)
  if (!kant) return null
  return { z, xc, maksB: Math.max(0.8, hoved.w - 0.6) }
}

// ── Rekkverk ───────────────────────────────────────────────────────

function byggRekkverk(
  t: T,
  ks: Kant[],
  valgte: number[],
  Hr: number,
  trapp: Modell['trapp'],
  sys: System,
  cc: number,
  stav: (d: Omit<Stav, 'type'>) => Stav,
  prisme: (d: Omit<Prisme, 'type'>) => Prisme,
) {
  const yT = (z: number) => yTopp(t, z)
  const jh = sys.bjelke.h / 1000
  const T_ = t.bord.t
  const valgt = new Set(valgte)
  // Kjeder av sammenhengende kanter med rekkverk.
  const kjeder: number[][] = []
  const start = ks.findIndex((k) => !valgt.has(k.i))
  if (start < 0) {
    kjeder.push(ks.map((k) => k.i))
  } else {
    let cur: number[] = []
    for (let j = 1; j <= ks.length; j++) {
      const i = (start + j) % ks.length
      if (valgt.has(i)) cur.push(i)
      else if (cur.length) {
        kjeder.push(cur)
        cur = []
      }
    }
    if (cur.length) kjeder.push(cur)
  }
  const lukket = start < 0
  let nr = 0

  // Segmenter langs senterlinja (offset 49 mm ut). Hvert segment har endetype.
  interface Seg {
    k: Kant
    u0: number // langs kanten (m fra k.a)
    u1: number
    gA: boolean // gjæring/hjørne i start
    gB: boolean
  }
  const segs: Seg[] = []
  for (const kj of kjeder) {
    kj.forEach((ki, j) => {
      const k = ks[ki]
      const forsteIKjede = j === 0 && !lukket
      const sisteIKjede = j === kj.length - 1 && !lukket
      // Hjørne: senterlinja forlenges 49 mm forbi omrisspunktet (konvekst) eller kortes (konkavt).
      const prev = ks[(ki - 1 + ks.length) % ks.length]
      const next = ks[(ki + 1) % ks.length]
      const kryss = (a: Kant, b: Kant) => a.r[0] * b.r[1] - a.r[1] * b.r[0]
      const sgn = Math.sign(kryss(ks[0], ks[1]) || 1)
      const ekstA = forsteIKjede ? 0 : Math.sign(kryss(prev, k)) === sgn ? RP_N / 2 : -RP_N / 2
      const ekstB = sisteIKjede ? 0 : Math.sign(kryss(k, next)) === sgn ? RP_N / 2 : -RP_N / 2
      let u0 = -ekstA
      let u1 = k.L + ekstB
      // Trappeåpning på denne kanten?
      if (trapp && Math.abs(k.a[1] - k.b[1]) < 1e-6 && Math.abs(k.a[1] - (trapp.z0 - 0.048)) < 1e-6 && k.n[1] > 0) {
        const ua = (trapp.xc - trapp.bredde / 2 - k.a[0]) * k.r[0]
        const ub = (trapp.xc + trapp.bredde / 2 - k.a[0]) * k.r[0]
        const lo = Math.min(ua, ub)
        const hi = Math.max(ua, ub)
        segs.push({ k, u0, u1: lo, gA: !forsteIKjede, gB: false })
        segs.push({ k, u0: hi, u1, gA: false, gB: !sisteIKjede })
        u0 = u1 = NaN
      }
      if (!Number.isNaN(u0)) segs.push({ k, u0, u1, gA: !forsteIKjede, gB: !sisteIKjede })
    })
  }

  const punkt = (k: Kant, u: number, ut: number): V3 => {
    const x = k.a[0] + k.r[0] * u + k.n[0] * ut
    const z = k.a[1] + k.r[1] * u + k.n[1] * ut
    return [x, 0, z]
  }

  for (const sg of segs) {
    const { k } = sg
    const lengde = sg.u1 - sg.u0
    if (lengde < 0.2) continue
    nr++
    // Stolper: hjørne-/endestolper 98×98 og mellomstolper 48×98.
    // Endestolpe (ikke gjæret ende) ligger helt innenfor segmentet [u0, u0+98].
    const cA = sg.gA ? sg.u0 + 0 : sg.u0 + RP_N / 2
    const cB = sg.gB ? sg.u1 - 0 : sg.u1 - RP_N / 2
    // Hjørnestolpen ved gjæret ende eies av segmentet som starter der (unngå dobbel).
    const stolper: Array<{ u: number; hj: boolean; eier: boolean }> = [{ u: cA, hj: true, eier: true }, { u: cB, hj: true, eier: !sg.gB }]
    const span = cB - cA
    const nMellom = Math.max(0, Math.ceil(span / cc - 1e-9) - 1)
    for (let j = 1; j <= nMellom; j++) stolper.push({ u: cA + (span * j) / (nMellom + 1), hj: false, eier: true })
    stolper.sort((a, b) => a.u - b.u)
    const yBunn = (p: V3) => Math.max(0.03, yT(p[2]) - T_ - jh) // aldri ned i terrenget
    const yTopP = (p: V3) => yT(p[2]) + Hr - HL_T
    for (const st of stolper) {
      if (!st.eier) continue
      const p = punkt(k, st.u, RP_N / 2)
      const b = RP_N
      const navn = st.hj ? 'Hjørnestolpe' : 'Rekkverksstolpe'
      const profil = '98 × 98 mm'
      stav({ pid: `rstolpe-${nr}-${mm(st.u)}`, part: 'rekkverk', navn, profil, lengdeMm: (yTopP(p) - yBunn(p)) * 1000, kapp: true, kategori: 'konstruksjon', kvalitet: 'C24 NTR AB', farge: 'tre', darken: 0.96, merknad: 'Boltes med 2 × M12 gjennom kantbjelken', a: [p[0], yBunn(p), p[2]], b: [p[0], yTopP(p), p[2]], bredde: st.hj ? RP_N : RP_N, hoyde: b, opp: [k.r[0], 0, k.r[1]], explode: [k.n[0] * 0.35, 0.15, k.n[1] * 0.35] })
    }
    // Felt mellom stolper: rekker + spiler/bord.
    for (let j = 0; j < stolper.length - 1; j++) {
      const sa = stolper[j]
      const sb2 = stolper[j + 1]
      const fa = sa.u + RP_N / 2
      const fb = sb2.u - RP_N / 2
      const Lc = fb - fa
      if (Lc < 0.03) continue
      const pa = punkt(k, fa, RP_N - 0.024)
      const pb = punkt(k, fb, RP_N - 0.024)
      for (const [nv, dy] of [['bunn', 0.1 + 0.049], ['topp', Hr - HL_T - 0.049]] as Array<[string, number]>) {
        stav({ pid: `rekke-${nv}-${nr}-${j}`, part: 'rekkverk', navn: 'Rekke', profil: P48(98), lengdeMm: Lc * 1000, kapp: true, kategori: 'konstruksjon', kvalitet: 'C24 NTR AB', farge: 'tre', darken: 0.93, a: [pa[0], yT(pa[2]) + dy, pa[2]], b: [pb[0], yT(pb[2]) + dy, pb[2]], bredde: 0.048, hoyde: 0.098, explode: [k.n[0] * 0.35, 0.15, k.n[1] * 0.35] })
      }
      // Spiler/bord på innsiden av rekkene, jevnt fordelt med åpning ≤ 95 mm.
      const [fyllB, fyllT, maxGap, navnF, profilF] = t.gjerde === 'spiler' ? [SPILE_B, SPILE_T, MAKS_AAPNING, 'Spile', '36 × 48 mm'] : t.gjerde === 'bord' ? [0.095, 0.021, 0.03, 'Rekkverksbord', '21 × 95 mm'] : [0.095, 0.021, 0.006, 'Rekkverksbord', '21 × 95 mm']
      const nF = Math.max(1, Math.ceil((Lc - maxGap) / (fyllB + maxGap) - 1e-9))
      const gapF = (Lc - nF * fyllB) / (nF + 1)
      const ut = RP_N - 0.048 - fyllT / 2
      for (let f = 0; f < nF; f++) {
        const u = fa + gapF + fyllB / 2 + f * (fyllB + gapF)
        const p = punkt(k, u, ut)
        const y0 = yT(p[2]) + 0.05
        const y1 = yT(p[2]) + Hr - HL_T
        stav({ pid: `fyll-${nr}-${j}-${f}`, part: 'rekkverk', navn: navnF, profil: profilF, lengdeMm: (y1 - y0) * 1000, kapp: true, kategori: 'kledning', kvalitet: TRESLAG[TRESLAG_ID(t)]?.label, farge: 'tre', a: [p[0], y0, p[2]], b: [p[0], y1, p[2]], bredde: fyllT, hoyde: fyllB, opp: [k.r[0], 0, k.r[1]], explode: [k.n[0] * 0.35, 0.15, k.n[1] * 0.35] })
      }
    }
    // Håndlist 28 × 120 oppå stolpene, 45° gjæring i hjørner, skjøtes over stolpe.
    const hlA = sg.u0
    const hlB = sg.u1
    const mellom = stolper.filter((s) => !s.hj).map((s) => s.u)
    const kutt: number[] = []
    let s0 = hlA
    while (hlB - s0 > MAKS_LAGER) {
      const kand = mellom.filter((u) => u > s0 + 0.3 && u <= s0 + MAKS_LAGER)
      if (!kand.length) break
      s0 = Math.max(...kand)
      kutt.push(s0)
    }
    const g = [hlA, ...kutt, hlB]
    for (let s = 0; s < g.length - 1; s++) {
      const ga = s === 0 && sg.gA
      const gb = s === g.length - 2 && sg.gB
      const pa = punkt(k, g[s], RP_N / 2)
      const pb = punkt(k, g[s + 1], RP_N / 2)
      pa[1] = yT(pa[2]) + Hr - HL_T / 2
      pb[1] = yT(pb[2]) + Hr - HL_T / 2
      const L = Math.hypot(pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2])
      const u = norm([pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]])
      const v = norm(cross([0, 1, 0], u))
      const sUt = v[0] * k.n[0] + v[2] * k.n[1] > 0 ? 1 : -1
      const ytre = (HL_B / 2) * sUt
      const indre = -ytre
      // Konvekst hjørne: ytterkant lengst. Konkavt: innerkant lengst.
      const kryssEnde = (ende: 'A' | 'B') => {
        const kj = ende === 'A' ? ks[(k.i - 1 + ks.length) % ks.length] : ks[(k.i + 1) % ks.length]
        const kr = (a: Kant, b: Kant) => a.r[0] * b.r[1] - a.r[1] * b.r[0]
        const sgn = Math.sign(kr(ks[0], ks[1]) || 1)
        return ende === 'A' ? Math.sign(kr(kj, k)) === sgn : Math.sign(kr(k, kj)) === sgn
      }
      const dA = ga ? HL_B / 2 : 0
      const dB = gb ? HL_B / 2 : 0
      const kvA = ga && kryssEnde('A')
      const kvB = gb && kryssEnde('B')
      const pts: Array<[number, number]> = [
        [kvA || !ga ? -dA : dA, ytre],
        [kvB || !gb ? L + dB : L - dB, ytre],
        [kvB || !gb ? L - dB : L + dB, indre],
        [kvA || !ga ? dA : -dA, indre],
      ]
      const lengdeMaks = Math.max(...pts.map((p) => p[0])) - Math.min(...pts.map((p) => p[0]))
      prisme({ pid: `handlist-${nr}-${s}`, part: 'rekkverk', navn: 'Håndlist', profil: '28 × 120 mm', lengdeMm: lengdeMaks * 1000, kapp: true, kategori: 'kledning', kvalitet: TRESLAG[TRESLAG_ID(t)]?.label, farge: 'tre', endeA: ga ? { vinkel: 45, type: 'gjaering' } : undefined, endeB: gb ? { vinkel: 45, type: 'gjaering' } : undefined, merknad: kutt.length ? 'Skjøtes midt over mellomstolpe' : undefined, pts, o: pa, u, v, tykk: HL_T, explode: [k.n[0] * 0.35, 0.3, k.n[1] * 0.35] })
    }
  }

  // Rekkverk i trapp (begge sider) når trappa har fallhøyde > 0,5 m.
  // Stolper 98 × 98: toppstolpen er hjørnestolpen ved åpningen, mellomstolper
  // boltes på vangens utside (c/c langs trappa ≤ rekkverkets c/c), bunnstolpen
  // står på pilar ved nederste trinn.
  if (trapp && trapp.Hf > 0.5 && valgt.size) {
    const s = trapp.stigningMm / 1000
    const i = trapp.inntrinnMm / 1000
    const th = Math.atan2(s, i)
    const cosT = Math.cos(th)
    const n = trapp.antallOpptrinn
    const yNese = (u: number) => trapp.Hf - (u * s) / i
    const yVangeBunn = (u: number) => trapp.Hf - s - TRINN_T - (u * s) / i - VANGE_H / cosT
    const zU = (u: number) => trapp.z0 + u
    const Htr = 0.9 // håndlist 0,9 m over trinnforkant (TEK17 § 12-16)
    const yTopp = (u: number) => yNese(u) + Htr - HL_T
    const vink = th / RAD
    const ua = RP_N - 0.048 // toppstolpens forkant (relativt z0)
    const ubFor = (n - 1) * i - RP_N // bunnstolpens bakkant
    // Mellomstolper: senter-senter langs skråningen ≤ cc.
    const cTopp = ua - RP_N / 2
    const cBunn = ubFor + RP_N / 2
    const nMid = Math.max(0, Math.ceil((cBunn - cTopp) / (cc * cosT) - 1e-9) - 1)
    const midt = Array.from({ length: nMid }, (_, k) => cTopp + ((cBunn - cTopp) * (k + 1)) / (nMid + 1))
    const felt: Array<[number, number]> = []
    let f0 = ua
    for (const m of midt) {
      felt.push([f0, m - RP_N / 2])
      f0 = m + RP_N / 2
    }
    felt.push([f0, ubFor])
    for (const side of [-1, 1]) {
      const xc = side < 0 ? trapp.xc - trapp.bredde / 2 - RP_N / 2 : trapp.xc + trapp.bredde / 2 + RP_N / 2
      const ex: V3 = [side * 0.35, 0.1, 0.3]
      // Bunnstolpe på pilar.
      trappPilar(stav, `trapp-${side}`, [xc, 0, zU(ubFor + RP_N / 2)])
      const pb: Array<[number, number]> = [[0, PILAR_OVER + SKO], [RP_N, PILAR_OVER + SKO], [RP_N, yTopp(ubFor + RP_N)], [0, yTopp(ubFor)]]
      prisme({ pid: `trappstolpe-${side}`, part: 'rekkverk', navn: 'Rekkverksstolpe', profil: '98 × 98 mm', lengdeMm: utstrekning(pb, [0, 1]) * 1000, kapp: true, kategori: 'konstruksjon', kvalitet: 'C24 NTR AB', farge: 'tre', darken: 0.96, endeB: { vinkel: vink, type: 'gjaering', merknad: 'skrå topp etter trappehelning' }, pts: pb, o: [xc, 0, zU(ubFor)], u: [0, 0, 1], v: [0, 1, 0], tykk: RP_N, explode: ex })
      // Mellomstolper boltet til vangen (skrå topp og bunn).
      midt.forEach((m, k) => {
        const u0 = m - RP_N / 2
        const u1 = m + RP_N / 2
        const pm: Array<[number, number]> = [[0, Math.max(0.03, yVangeBunn(u0))], [RP_N, Math.max(0.03, yVangeBunn(u1))], [RP_N, yTopp(u1)], [0, yTopp(u0)]]
        prisme({ pid: `trappmidtstolpe-${side}-${k}`, part: 'rekkverk', navn: 'Rekkverksstolpe', profil: '98 × 98 mm', lengdeMm: utstrekning(pm, [0, 1]) * 1000, kapp: true, kategori: 'konstruksjon', kvalitet: 'C24 NTR AB', farge: 'tre', darken: 0.96, endeA: { vinkel: vink, type: 'gjaering' }, endeB: { vinkel: vink, type: 'gjaering' }, merknad: 'Boltes 2 × M12 gjennom vangen', pts: pm, o: [xc, 0, zU(u0)], u: [0, 0, 1], v: [0, 1, 0], tykk: RP_N, explode: ex })
      })
      // Felt: rekker og spiler.
      felt.forEach(([fa, fb], fi) => {
        const runL = fb - fa
        if (runL < 0.05) return
        const hv = 0.098 / cosT
        for (const [nv, dy] of [['bunn', 0.1], ['topp', Htr - HL_T - hv]] as Array<[string, number]>) {
          const pr: Array<[number, number]> = [[0, yNese(fa) + dy], [runL, yNese(fb) + dy], [runL, yNese(fb) + dy + hv], [0, yNese(fa) + dy + hv]]
          prisme({ pid: `trapprekke-${nv}-${side}-${fi}`, part: 'rekkverk', navn: 'Rekke', profil: P48(98), lengdeMm: utstrekning(pr, [runL, -runL * Math.tan(th)]) * 1000, kapp: true, kategori: 'konstruksjon', kvalitet: 'C24 NTR AB', farge: 'tre', darken: 0.93, endeA: { vinkel: vink, type: 'gjaering' }, endeB: { vinkel: vink, type: 'gjaering' }, pts: pr, o: [xc + side * (RP_N / 2 - 0.024), 0, zU(fa)], u: [0, 0, 1], v: [0, 1, 0], tykk: 0.048, explode: ex })
        }
        const nF = Math.max(1, Math.ceil((runL - MAKS_AAPNING) / (SPILE_B + MAKS_AAPNING) - 1e-9))
        const gapF = (runL - nF * SPILE_B) / (nF + 1)
        for (let f = 0; f < nF; f++) {
          const u0 = fa + gapF + f * (SPILE_B + gapF)
          const u1 = u0 + SPILE_B
          const p: Array<[number, number]> = [[0, yNese(u0) + 0.05], [SPILE_B, yNese(u1) + 0.05], [SPILE_B, yTopp(u1)], [0, yTopp(u0)]]
          prisme({ pid: `trappspile-${side}-${fi}-${f}`, part: 'rekkverk', navn: 'Spile', profil: '36 × 48 mm', lengdeMm: utstrekning(p, [0, 1]) * 1000, kapp: true, kategori: 'kledning', kvalitet: TRESLAG[TRESLAG_ID(t)]?.label, farge: 'tre', endeA: { vinkel: vink, type: 'gjaering' }, endeB: { vinkel: vink, type: 'gjaering' }, pts: p, o: [xc - side * (RP_N / 2 - 0.048 + SPILE_T / 2), 0, zU(u0)], u: [0, 0, 1], v: [0, 1, 0], tykk: SPILE_T, explode: ex })
        }
      })
      // Håndlist (skrå) over alle stolpene, loddrett kutt mot toppstolpen.
      const L = ubFor + RP_N - ua
      const hvH = HL_T / cosT
      const ph: Array<[number, number]> = [[0, yTopp(ua)], [L, yTopp(ua + L)], [L, yTopp(ua + L) + hvH], [0, yTopp(ua) + hvH]]
      prisme({ pid: `trapphandlist-${side}`, part: 'rekkverk', navn: 'Håndlist', profil: '28 × 120 mm', lengdeMm: utstrekning(ph, [L, -L * Math.tan(th)]) * 1000, kapp: true, kategori: 'kledning', kvalitet: TRESLAG[TRESLAG_ID(t)]?.label, farge: 'tre', endeA: { vinkel: vink, type: 'gjaering' }, endeB: { vinkel: vink, type: 'gjaering' }, pts: ph, o: [xc, 0, zU(ua)], u: [0, 0, 1], v: [0, 1, 0], tykk: HL_B, explode: [side * 0.35, 0.3, 0.3] })
    }
  }
}

function pilarRadius(sys: System): number {
  const m = sys.fund.valgt.navn.match(/Ø(\d+)/)
  return m ? Number(m[1]) / 2000 : 0.1
}

function trappPilar(stav: (d: Omit<Stav, 'type'>) => Stav, id: string, c: V3) {
  stav({ pid: `trappilar-${id}`, part: 'fundament', navn: 'Betongpilar', profil: 'Ø200 pilar', lengdeMm: 0, kapp: false, farge: 'betong', a: [c[0], 0, c[2]], b: [c[0], PILAR_OVER, c[2]], bredde: 0.2, hoyde: 0.2, opp: [0, 0, 1], explode: [0, -0.5, 0] })
  stav({ pid: `trappsko-${id}`, part: 'fundament', navn: 'Stolpesko (justerbar)', profil: 'varmforsinket', lengdeMm: 120, kapp: false, farge: 'stal', a: [c[0], PILAR_OVER, c[2]], b: [c[0], PILAR_OVER + SKO, c[2]], bredde: 0.11, hoyde: 0.11, opp: [0, 0, 1], explode: [0, -0.4, 0] })
}

// ── 3D ─────────────────────────────────────────────────────────────

function husvolum(t: T): Array<{ x0: number; x1: number; z0: number; z1: number }> {
  if (!t.vegg) return []
  const { hL, hB, fL, fB, yL, yB, a } = t
  switch (t.form) {
    case 'lForm':
      return [{ x0: hB + VEGG_LUFT, x1: hB + fB, z0: -1.2, z1: hL - fL - VEGG_LUFT }]
    case 'lFormSpeil':
      return [{ x0: 0, x1: fB - VEGG_LUFT, z0: -1.2, z1: hL - fL - VEGG_LUFT }]
    case 'uForm':
      return [{ x0: a + VEGG_LUFT, x1: yB - a - VEGG_LUFT, z0: -1.2, z1: yL - a - VEGG_LUFT }]
    default:
      return [{ x0: -0.6, x1: t.L + 0.6, z0: -0.3 - VEGG_LUFT, z1: -VEGG_LUFT }]
  }
}

function buildMesh(c: TerrasseConfig, opts?: BuildOptions): THREE.Group {
  const m = modell(c)
  const visning = String(c.visning ?? 'overflate')
  const skjul = new Set(visning === 'konstruksjon' ? ['gulv', 'kantbord', 'rekkverk'] : [])
  const deler = m.deler
    .filter((d) => !skjul.has(d.part))
    .map((d) => (visning === 'begge' && (d.part === 'gulv' || d.part === 'kantbord') ? { ...d, gjennomsiktig: 0.35 } : d))
  const group = byggGruppe(deler, { treslag: m.t.treslag, farge: String(c.farge ?? 'ubehandlet'), opts })
  // Husvegg/husvolum som kontekst (medfølger ikke). Ikke med i bounds.
  const hoydeHus = m.t.H + 1.9
  husvolum(m.t).forEach((h, i) => {
    const geo = new THREE.BoxGeometry(h.x1 - h.x0, hoydeHus, h.z1 - h.z0)
    const mat = new THREE.MeshStandardMaterial({ color: 0x9fb0c2, transparent: true, opacity: 0.16, roughness: 0.95, metalness: 0, side: THREE.DoubleSide, depthWrite: false })
    const ghost = new THREE.Mesh(geo, mat)
    ghost.position.set((h.x0 + h.x1) / 2 + m.forskyv[0], hoydeHus / 2, (h.z0 + h.z1) / 2 + m.forskyv[2])
    ghost.renderOrder = -1
    ghost.userData.part = 'husvegg'
    ghost.userData.kontekst = true
    ghost.userData.pid = `husvegg-${i}`
    ghost.userData.info = { navn: 'Husvegg (medfølger ikke)', profil: 'eksisterende vegg', lengdeCm: Math.round((h.x1 - h.x0) * 100) }
    ghost.userData.explode = new THREE.Vector3(0, 0, -0.5)
    group.add(ghost)
  })
  return group
}

// ── Materialliste ──────────────────────────────────────────────────

/** Pris-id og enhet for en trelastprofil. */
function prisForProfil(t: T, d: Del): { id: string; reserve: number } {
  if (grunnNavn(d.navn) === 'Terrassebord') return { id: t.bord.prisId, reserve: t.bord.reservePris }
  const p = d.profil
  if (p === '98 × 98 mm') return { id: 'stolpe-98x98', reserve: 75 }
  if (p === '148 × 148 mm') return { id: 'stolpe-148x148', reserve: 135 }
  if (p === '48 × 98 mm') return { id: 'stolpe-48x98', reserve: 22 }
  if (p === '36 × 48 mm') return { id: 'stolpe-36x48', reserve: 12 }
  if (p === '21 × 95 mm') return { id: 'bord-21x98', reserve: 15 }
  if (p === '21 × 145 mm') return { id: 'bord-19x148', reserve: 25 }
  if (p === '28 × 120 mm') return { id: 'terrassebord-28x120', reserve: 30 }
  if (p === '28 × 145 mm') return { id: 'terrassebord-28x145', reserve: 38 }
  const mt = p.match(/^48 × (\d+) mm$/)
  if (mt) return { id: `bjelke-48x${mt[1]}`, reserve: 80 }
  return { id: '', reserve: 0 }
}

interface Telling {
  skruerDekke: number
  skruerKonstr: number
  bolter: number
  vinkelbeslag: number
  bjelkesko: number
  pilarer: number
  stolpesko: number
  betongSekker: number
}

function telling(m: Modell): Telling {
  const { deler, sys } = m
  const bjelker = deler.filter((d): d is Stav => d.type === 'stav' && (grunnNavn(d.navn) === 'Bjelke' || grunnNavn(d.navn) === 'Skjøtebjelke'))
  let skruerDekke = 0
  for (const b of deler) {
    if (b.type !== 'stav' || (b.navn !== 'Terrassebord' && b.navn !== 'Trinnbord')) continue
    if (grunnNavn(b.navn) === 'Trinnbord') {
      skruerDekke += 2 * (m.trapp?.vanger ?? 2)
      continue
    }
    const x0 = Math.min(b.a[0], b.b[0])
    const x1 = Math.max(b.a[0], b.b[0])
    const z = b.a[2]
    const kryss = bjelker.filter((j) => j.a[0] > x0 - 0.01 && j.a[0] < x1 + 0.01 && z >= Math.min(j.a[2], j.b[2]) - 0.06 && z <= Math.max(j.a[2], j.b[2]) + 0.06).length
    skruerDekke += 2 * Math.max(2, kryss)
  }
  const pilarer = deler.filter((d) => grunnNavn(d.navn) === 'Betongpilar').length
  const stolpesko = deler.filter((d) => grunnNavn(d.navn) === 'Stolpesko (justerbar)').length
  const rstolper = deler.filter((d) => grunnNavn(d.navn) === 'Rekkverksstolpe' || grunnNavn(d.navn) === 'Hjørnestolpe').length
  const skraa = deler.filter((d) => grunnNavn(d.navn) === 'Skråstag').length
  const lasker = deler.filter((d) => grunnNavn(d.navn) === 'Skjøtelask').length
  const fyll = deler.filter((d) => grunnNavn(d.navn) === 'Spile' || grunnNavn(d.navn) === 'Rekkverksbord').length
  const rekker = deler.filter((d) => grunnNavn(d.navn) === 'Rekke').length
  const bjelkeEnder = bjelker.length * 2
  const rader = sys.rekter.reduce((s, o) => s + o.rader.length, 0)
  const kryssBjelkeDrager = sys.modus === 'stolper' ? sys.rekter.reduce((s, o) => s + o.rader.length * o.bjelkeX.length, 0) : 0
  const stolper = deler.filter((d) => grunnNavn(d.navn) === 'Stolpe').length
  // Betong: pilarrør fylt fra fundamentdybde til topp.
  const vol = deler.reduce((v, d) => (d.type === 'sylinder' ? v + betongvekt(sys.fund.valgt, sys.fundDybde) / 24 + Math.PI * d.r * d.r * d.h : v), 0)
  void rader
  return {
    skruerDekke: Math.ceil(skruerDekke / 50) * 50,
    skruerKonstr: Math.ceil((bjelkeEnder * 3 + fyll * 4 + rekker * 4 + lasker * 8) / 50) * 50,
    bolter: rstolper * 2 + skraa * 2 + lasker * 2 + (m.trapp ? 2 : 0),
    vinkelbeslag: kryssBjelkeDrager + stolper * 2 + (m.trapp ? m.trapp.vanger * 2 : 0),
    bjelkesko: sys.modus === 'innfelt' ? bjelkeEnder : 0,
    pilarer,
    stolpesko,
    betongSekker: Math.ceil(vol / 0.0125), // 25 kg tørrbetong ≈ 12,5 liter
  }
}

function beregn(c: TerrasseConfig): Bom {
  const m = modell(c)
  const { t, sys, deler } = m
  const faktor = TRESLAG[t.treslag]?.prisFaktor ?? 1
  const linjer: BomLinePlan[] = []
  let sum = 0
  // Trelast gruppert per navn + profil.
  const grupper = new Map<string, { d: Del; lm: number; n: number }>()
  for (const d of deler) {
    if (!d.kapp) continue
    const k = `${grunnNavn(d.navn)}|${d.profil}`
    const g = grupper.get(k) ?? { d, lm: 0, n: 0 }
    g.lm += d.lengdeMm / 1000
    g.n++
    grupper.set(k, g)
  }
  const sortert = [...grupper.values()].sort((a, b) => (POS[grunnNavn(a.d.navn)] ?? 'Z').localeCompare(POS[grunnNavn(b.d.navn)] ?? 'Z'))
  for (const g of sortert) {
    const p = prisForProfil(t, g.d)
    const f = g.d.farge === 'tre' ? faktor : 1
    const lm = g.lm * SVINN
    const kr = lm * pris(p.id, p.reserve) * f
    sum += kr
    linjer.push({ navn: grunnNavn(g.d.navn), spesifikasjon: g.d.profil, antall: r1(lm), enhet: 'lm', kategori: g.d.kategori, kvalitet: g.d.kvalitet, prisId: p.id || undefined, prisKr: Math.round(kr), kommentar: `${g.n} stk · inkl. 10 % svinn` })
  }
  const tl = telling(m)
  const hw = (navn: string, spes: string, antall: number, enhet: string, id: string, reserve: number, kategori: BomLinePlan['kategori'], kommentar?: string) => {
    if (antall <= 0) return
    const kr = antall * pris(id, reserve)
    sum += kr
    linjer.push({ navn, spesifikasjon: spes, antall, enhet, kategori, prisId: PRISER[id] ? id : undefined, prisKr: Math.round(kr), kommentar })
  }
  const klosser = deler.filter((d) => d.navn === 'Trinnkloss').length
  if (klosser && m.trapp) {
    const lm = Math.ceil(klosser / 2) * (m.trapp.inntrinnMm / 1000) * SVINN
    const kr = lm * pris('bjelke-48x198', 65)
    sum += kr
    linjer.push({ navn: 'Trinnklosser', spesifikasjon: '48 × 198 mm', antall: r1(lm), enhet: 'lm', kategori: 'konstruksjon', kvalitet: 'C24 NTR AB', prisId: 'bjelke-48x198', prisKr: Math.round(kr), kommentar: `${klosser} trekantklosser, to per emne` })
  }
  hw('Punktfundament', `${sys.fund.valgt.navn} · ${fmt(sys.fundDybde + PILAR_OVER, 2)} m`, tl.pilarer, 'stk', 'pilarror', 140, 'fundament', `fundamentdybde ${fmt(sys.fundDybde, 1)} m (frostfritt)`)
  hw('Tørrbetong B30', '25 kg sekk', tl.betongSekker, 'stk', 'betong-25kg', 95, 'fundament')
  hw(PRISER['stolpesko']?.navn ?? 'Stolpesko (justerbar)', 'varmforsinket', tl.stolpesko, 'stk', 'stolpesko', 149, 'beslag')
  hw(PRISER['vinkelbeslag']?.navn ?? 'Vinkelbeslag', 'varmforsinket', tl.vinkelbeslag, 'stk', 'vinkelbeslag', 19, 'beslag', 'bjelke–drager, drager–stolpe')
  hw('Bjelkesko', `${sys.bjelke.boardProfil}, varmforsinket`, tl.bjelkesko, 'stk', 'bjelkesko', 29, 'beslag', 'innfelt bjelkelag')
  hw('Bolt M12 m/ mutter og skiver', 'varmforsinket', tl.bolter, 'stk', 'bolt-m12', 25, 'festemidler', 'rekkverksstolper, skråstag, skjøtelasker')
  hw('Terrasseskruer', 'rustfri A4, 2 per bjelkekryss', tl.skruerDekke, 'stk', 'skrue', 1.5, 'festemidler')
  hw('Konstruksjonsskruer', 'A4 / varmforsinket', tl.skruerKonstr, 'stk', 'skrue', 1.5, 'festemidler')
  const estimatKr = Math.round(sum / 10) * 10
  const ov = { w: m.max[0] - m.min[0], d: m.max[2] - m.min[2] }
  const omr = boks(m.deler, (d) => d.part === 'gulv')
  const ww = omr.max[0] - omr.min[0]
  const dd = omr.max[2] - omr.min[2]
  void ov
  const rekkverkLm = lopemeter(deler, (d) => grunnNavn(d.navn) === 'Håndlist')
  const arbeidstimer = Math.round(m.arealM2 * 1.1 + tl.pilarer * 0.8 + rekkverkLm * 0.9 + (m.trapp ? 6 : 0) + 4)
  const sammendrag = `${formNavn(t.form)} · ${fmt(m.arealM2, 1)} m² · ${Math.round(t.H * 100)} cm høyde · bjelkelag ${sys.bjelke.boardProfil} c/c ${mm(sys.cc)} · ${t.bord.profil} ${TRESLAG[t.treslag]?.label ?? t.treslag}${m.rekkverkHoyde ? ` · rekkverk ${Math.round(m.rekkverkHoyde * 100)} cm` : ''}${m.trapp ? ` · trapp ${m.trapp.antallOpptrinn} opptrinn` : ''}`
  return { linjer, estimatKr, sammendrag, arealM2: Math.round(m.arealM2 * 10) / 10, maal: `${Math.round(ww * 100)} × ${Math.round(dd * 100)} cm`, arbeidstimer }
}

function formNavn(f: string): string {
  return f === 'lForm' ? 'Hjørneterrasse (L)' : f === 'lFormSpeil' ? 'Hjørneterrasse (L, speilet)' : f === 'uForm' ? 'U-terrasse' : 'Rektangulær terrasse'
}

function kappliste(c: TerrasseConfig): KapplisteDelPlan[] {
  const m = modell(c)
  return kapplisteFra(m.deler, (d) => POS[grunnNavn(d.navn)]).sort((a, b) => (a.pos ?? 'Z').localeCompare(b.pos ?? 'Z') || b.lengdeCm - a.lengdeCm)
}

// ── Byggesak og statikk ────────────────────────────────────────────

function byggesak(c: TerrasseConfig): ByggesakResultat {
  const m = modell(c)
  return vurderByggesak({
    tiltak: 'terrasse',
    byaM2: m.arealM2,
    hoydeOverTerrengM: m.t.H,
    fallhoydeM: m.t.H,
    rekkverkHoydeM: m.rekkverkHoyde,
  })
}

function byggeregler(c: TerrasseConfig): Byggeregler {
  const m = modell(c)
  const r = tilByggeregler(byggesak(c))
  const ekstra: string[] = []
  if (m.t.vegg) ekstra.push(`Terrassen står selvbærende ${Math.round(VEGG_LUFT * 1000)} mm fra husveggen (luftespalte) – ikke fest bjelkelaget i bindingsverket uten fuktsikring.`)
  if (m.rekkverkHoyde > 0) ekstra.push(`Rekkverket i planen er ${Math.round(m.rekkverkHoyde * 100)} cm høyt med loddrette ${m.t.gjerde === 'spiler' ? 'spiler' : 'bord'} og maks ${Math.round(MAKS_AAPNING * 1000)} mm åpning.`)
  return { ...r, punkter: [...r.punkter, ...ekstra] }
}

const RP_TV = tverrsnitt(98, 98, 1, 'C24', 'stolpe-98x98')
/** Arm fra øverste bolt (≈ 50 mm under dekket) til overkant håndlist. */
const rekkverkArm = (Hr: number) => Hr + 0.05

/** Største c/c (5 cm-trinn) der 98 × 98-stolpen holder for horisontal last (core-kontroll). */
function rekkverkCCFor(Hr: number): number {
  for (let cc = RP_CC_MAKS; cc >= 0.4; cc -= 0.05) {
    if (kontrollerRekkverkstolpe({ tverrsnitt: RP_TV, ccM: cc, armM: rekkverkArm(Hr) }).maksUtnyttelse <= 1) return Math.round(cc * 100) / 100
  }
  return 0.4
}

function rekkverkKontroll(m: Modell): Medlemskontroll | null {
  if (!m.rekkverkHoyde) return null
  return kontrollerRekkverkstolpe({ tverrsnitt: RP_TV, ccM: m.rekkverkCC, armM: rekkverkArm(m.rekkverkHoyde) })
}

function beregningsgrunnlag(c: TerrasseConfig): Beregningsgrunnlag {
  const m = modell(c)
  const { t, sys } = m
  const sk = snolastForConfig(c)
  const styrende = sys.rekter.reduce((a, b) => (b.drager.kontroll.maksUtnyttelse > a.drager.kontroll.maksUtnyttelse ? b : a))
  const deler: Record<string, Dimensjonering | Medlemskontroll> = { Bjelkelag: sys.bjelkeDim, Drager: styrende.drager }
  const pos: Record<string, string> = { Bjelkelag: 'D', Drager: 'B', Stolpe: 'A', Rekkverksstolpe: 'L' }
  if (sys.stolpe) deler.Stolpe = sys.stolpe
  const rk = rekkverkKontroll(m)
  if (rk) deler.Rekkverksstolpe = rk
  const n = NYTTELAST[sys.bruk]
  const rapport = lagBeregningsrapport({
    produkt: 'terrasse',
    tittel: `${formNavn(t.form)} ${fmt(m.arealM2, 1)} m²`,
    forutsetninger: [
      { navn: 'Bruk', verdi: n.navn, kilde: n.kilde, usikker: sys.bruk === 'A-balkong' },
      { navn: 'Nyttelast', verdi: `${fmt(n.qk, 1)} kN/m² / ${fmt(n.Qk, 1)} kN`, kilde: n.kilde },
      { navn: 'Tjenesteklasse', verdi: '3 (værutsatt)', kilde: 'NS-EN 1995-1-1' },
      { navn: 'Terrassebord', verdi: `${t.bord.profil}, bjelker c/c ${mm(sys.cc)} mm`, kilde: 'Treindustrien / Byggforsk' },
      { navn: 'Konstruksjonssystem', verdi: sys.modus === 'stolper' ? 'Bjelkelag oppå dragere på stolper/pilarer' : 'Innfelt bjelkelag i bjelkesko mellom dragere (lav platting)' },
      { navn: 'Grunn', verdi: GRUNN[t.grunn].navn, kilde: t.grunn === 'ukjent' ? 'Ikke oppgitt – konservativ antakelse (Byggested)' : 'Valgt i Byggested – kontroller på tomta', usikker: true },
      { navn: 'Frostsone', verdi: FROSTSONER[t.sone].navn, kilde: frostsoneForConfig(c).merknad, usikker: true },
    ],
    snolast: { mark: sk },
    deler,
    pos,
    frost: sys.frost,
    fundament: sys.fund,
    byggesak: byggesak(c),
    merknader: [
      'Snø og nyttelast på terrassen virker ikke samtidig (NS-EN 1991-1-1 3.3.2) – største av dem er dimensjonerende.',
      `Bjelkelag: største spenn ${fmt(sys.bjelkeDim.kontroll.spennMm / 1000, 2)} m mellom dragere, utkraging ≤ ${mm(Math.max(...sys.rekter.map((o) => o.utkrag)))} mm.`,
      `Drager: største stolpeavstand ${fmt(styrende.dragerSpenn, 2)} m, lastbredde ${fmt(styrende.lastbredde, 2)} m.`,
      ...(sys.avstivet ? ['Stolpene er høyere enn 0,6 m og avstives med skråstag i begge retninger (knekklengde = stolpelengden).'] : sys.stolpe ? ['Korte stolper uten skråstag: kontrollert som fritt innspent (knekklengde 2 × stolpelengden).'] : []),
      ...m.sys.meldinger,
    ],
  })
  return tilPlanVedlegg(rapport)
}

// ── Tegninger ──────────────────────────────────────────────────────

type Riss = Riss2DPlan
const cm1 = (v: number) => Math.round(v * 1000) / 10

function tegninger(c: TerrasseConfig): Tegning2D {
  const m = modell(c)
  const { t, sys } = m
  const ref = { minX: m.min[0], minZ: m.min[2], maxZ: m.max[2], topY: m.max[1] }
  const W = cm1(m.max[0] - m.min[0])
  const D = cm1(m.max[2] - m.min[2])
  const Htop = cm1(m.max[1])
  const poly = (pts: Array<[number, number]>, ekstra: Partial<Form2DPlan> = {}): Form2DPlan => ({ type: 'poly', points: [...pts, pts[0]], ...ekstra })
  const lok = (x: number, z: number): [number, number] => [cm1(x + m.forskyv[0] - ref.minX), cm1(z + m.forskyv[2] - ref.minZ)]

  // Plan
  const plan: Form2DPlan[] = []
  plan.push(poly(omriss(t).map(([x, z]) => lok(x, z))))
  for (const d of m.deler) {
    if (d.part === 'gulv') continue
    if (grunnNavn(d.navn) === 'Bjelke' || grunnNavn(d.navn) === 'Skjøtebjelke' || grunnNavn(d.navn) === 'Kantbjelke' || grunnNavn(d.navn) === 'Drager') plan.push(poly(projiser(d, 'plan', ref), { dashed: true, tynn: true }))
    else if (grunnNavn(d.navn) === 'Stolpe' || grunnNavn(d.navn) === 'Betongpilar' || d.part === 'rekkverk' || d.part === 'trapp' || grunnNavn(d.navn) === 'Kantbord') plan.push(poly(projiser(d, 'plan', ref), { tynn: d.navn !== 'Stolpe' }))
  }
  for (const [a, b] of vegger(t)) plan.push({ type: 'line', points: [lok(a[0], a[1] - (a[1] === b[1] ? VEGG_LUFT : 0)), lok(b[0], b[1] - (a[1] === b[1] ? VEGG_LUFT : 0))] })
  const ov = omriss(t)
  const planMaal: Riss['maal'] = []
  const xs = ov.map((p) => p[0])
  const zs = ov.map((p) => p[1])
  const [px0, pz0] = lok(Math.min(...xs), Math.min(...zs))
  const [px1, pz1] = lok(Math.max(...xs), Math.max(...zs))
  planMaal.push({ x1: px0, y1: pz1, x2: px1, y2: pz1, label: `${Math.round(px1 - px0)}`, offset: 30 })
  planMaal.push({ x1: px0, y1: pz0, x2: px0, y2: pz1, label: `${Math.round(pz1 - pz0)}`, offset: 30 })
  // c/c bjelker i hovedrektangelet (første felt).
  const o0 = sys.rekter[0]
  if (o0.bjelkeX.length > 1) {
    const [a] = lok(o0.bjelkeX[0], 0)
    const [b] = lok(o0.bjelkeX[1], 0)
    planMaal.push({ x1: a, y1: pz0, x2: b, y2: pz0, label: `c/c ${Math.round((b - a) * 10)}`, offset: 16 })
  }
  if (o0.rader.length > 1) {
    const [, a] = lok(0, o0.rader[0])
    const [, b] = lok(0, o0.rader[1])
    planMaal.push({ x1: px1, y1: a, x2: px1, y2: b, label: `${Math.round((b - a) * 10)}`, offset: 18 })
  }
  const tekstPlan: Riss['tekster'] = [
    { x: (px0 + px1) / 2, y: (pz0 + pz1) / 2, tekst: `Bjelkelag ${sys.bjelke.boardProfil} c/c ${mm(sys.cc)}` },
    { x: (px0 + px1) / 2, y: (pz0 + pz1) / 2 + 14, tekst: `Terrassebord ${t.bord.profil}` },
  ]
  if (t.vegg) tekstPlan.push({ x: (px0 + px1) / 2, y: pz0 - 8, tekst: 'Husvegg (luftespalte 20 mm)' })
  const planRiss: Riss = { id: 'plan', navn: 'Plan – bjelkelag og fundamenter', bredde: W, hoyde: D, former: plan, maal: planMaal, tekster: tekstPlan, type: 'plan' }

  // Fasader
  const fasade = (v: 'front' | 'hoyre', id: string, navn: string): Riss => {
    const former: Form2DPlan[] = []
    for (const d of m.deler) {
      if (grunnNavn(d.navn) === 'Bjelke' || grunnNavn(d.navn) === 'Skjøtebjelke' || grunnNavn(d.navn) === 'Skjøtelask') continue
      if (d.part === 'gulv' && v === 'front') continue
      former.push(poly(projiser(d, v, ref), { tynn: d.part === 'rekkverk' || d.part === 'gulv' }))
    }
    const bredde = v === 'front' ? W : D
    const deckY = cm1(m.max[1] - t.H)
    const maal: Riss['maal'] = [
      { x1: 0, y1: Htop, x2: bredde, y2: Htop, label: `${Math.round(bredde)}`, offset: 26 },
      { x1: 0, y1: deckY, x2: 0, y2: Htop, label: `${Math.round(t.H * 100)}`, offset: 24 },
    ]
    if (m.rekkverkHoyde) maal.push({ x1: bredde, y1: cm1(m.max[1] - t.H - m.rekkverkHoyde), x2: bredde, y2: deckY, label: `${Math.round(m.rekkverkHoyde * 100)}`, offset: 22 })
    return { id, navn, bredde, hoyde: Htop, former, maal, type: 'fasade' }
  }

  // Snitt gjennom første stolperad (x = første stolpe i hovedrektangelet).
  const xs0 = o0.stolpeX[0] + m.forskyv[0]
  const snittFormer: Form2DPlan[] = []
  for (const d of m.deler) {
    const b = boks([d])
    if (b.min[0] - 1e-6 <= xs0 && b.max[0] + 1e-6 >= xs0) {
      const kuttet = d.navn !== 'Stolpe' && d.navn !== 'Betongpilar' && d.navn !== 'Stolpesko (justerbar)' && d.part !== 'rekkverk'
      snittFormer.push(poly(projiser(d, 'hoyre', ref), kuttet && d.type === 'stav' && Math.abs(d.a[0] - d.b[0]) > 0.2 ? { snittet: true, fyll: 'tre' } : { tynn: d.part === 'rekkverk' }))
    }
  }
  // Nærmeste bjelke bak snittet (som riss).
  const nb = m.deler.find((d): d is Stav => d.type === 'stav' && grunnNavn(d.navn) === 'Bjelke' && Math.abs(d.a[0] - xs0) < sys.cc)
  if (nb) snittFormer.push(poly(projiser(nb, 'hoyre', ref), { tynn: true }))
  const deckY = cm1(m.max[1] - t.H)
  const snittTekst: Riss['tekster'] = [
    { x: D / 2, y: deckY - 8, tekst: `Bord ${t.bord.profil.replace(' mm', '')}` },
    { x: D / 2, y: deckY + cm1(t.bord.t + sys.bjelke.h / 1000) + 10, tekst: `Bjelke ${sys.bjelke.boardProfil.replace(' mm', '')} c/c ${mm(sys.cc)}` },
    { x: D / 2, y: Htop + 14, tekst: `Pilar ${pilarRadius(sys) * 2000 > 0 ? `Ø${Math.round(pilarRadius(sys) * 2000)}` : ''} til ${fmt(sys.fundDybde, 1)} m` },
  ]
  const snitt: Riss = { id: 'snitt', navn: 'Snitt A–A (gjennom stolperad)', bredde: D, hoyde: Htop, former: snittFormer, maal: [{ x1: 0, y1: deckY, x2: 0, y2: Htop, label: `${Math.round(t.H * 100)}`, offset: 24 }, { x1: 0, y1: Htop, x2: D, y2: Htop, label: `${Math.round(D)}`, offset: 26 }], tekster: snittTekst, type: 'snitt' }

  return { riss: [planRiss, fasade('front', 'fasade-forfra', 'Fasade forfra'), fasade('hoyre', 'fasade-siden', 'Fasade fra høyre'), snitt] }
}

// ── Montering ──────────────────────────────────────────────────────

function pilarTekst(m: Modell): string {
  const h = m.deler.filter((d) => d.type === 'sylinder' && d.navn === 'Betongpilar').map((d) => (d.type === 'sylinder' ? mm(d.h) : 0))
  const lo = Math.min(...h)
  const hi = Math.max(...h)
  return hi - lo < 3 ? `${lo} mm` : `${lo}–${hi} mm (lavest ytterst pga. fallet)`
}

function monteringPlan(c: TerrasseConfig): MonteringSteg[] {
  const m = modell(c)
  const { t, sys } = m
  const steg: MonteringSteg[] = []
  const rs = rekter(t)
  const diag = rs.map((r) => `${r.id === 'rekt' ? '' : `${r.id}: `}${mm(r.w)} × ${mm(r.d)} mm → diagonal ${mm(Math.hypot(r.w, r.d))} mm`).join('; ')
  const tl = telling(m)
  const o0 = sys.rekter[0]
  const stolpeCC = o0.stolpeX.length > 1 ? mm(o0.stolpeX[1] - o0.stolpeX[0]) : 0
  steg.push({ tittel: 'Sett ut terrassen', trinn: 'fundament', tekst: `Sett ut hjørnene med snorer og profiler. Kontroller at alt er i vinkel med diagonalmål: ${diag}.${t.vegg ? ` Hold terrassen ${Math.round(VEGG_LUFT * 1000)} mm fra husveggen (luftespalte) og pass på drenering/isolasjon ved grunnmuren.` : ''}`, verktoy: ['snor', 'målebånd', 'laser/vater'] })
  steg.push({ tittel: 'Fundamenter', trinn: 'fundament', tekst: `Grav ${tl.pilarer} hull til ${fmt(sys.fundDybde, 1)} m dybde (frostfritt, ${GRUNN[t.grunn].navn.toLowerCase()}). Stolperadene ligger ${o0.rader.map((z) => `${mm(z - o0.r.z)}`).join(' / ')} mm fra bakkant${o0.stolpeX.length > 1 ? `, stolper c/c ${stolpeCC} mm langs radene (første ${mm(o0.stolpeX[0] - o0.r.x)} mm inn fra kanten)` : ''}. Sett ${sys.fund.valgt.navn.toLowerCase()}, fyll betong og sett stolpeskoene i snor og høyde. Pilartopp ${pilarTekst(m)} over terreng.`, advarsel: 'Pilarrør skal ha glatt utside / folie så telen ikke griper tak. Kontroller grunnen – bløt leire/fylling krever geoteknisk vurdering.', tidTimer: Math.round(tl.pilarer * 0.8) })
  if (sys.stolpe) {
    const lengder = [...new Set(m.deler.filter((d) => grunnNavn(d.navn) === 'Stolpe').map((d) => rundOppKapp(d.lengdeMm)))].sort((a, b) => b - a)
    steg.push({ tittel: 'Stolper', trinn: 'fundament', tekst: `Kapp stolpene ${sys.stolpe.valgt.profil} til ${lengder.join(' / ')} mm${t.fall ? ' (radene blir lavere utover pga. fallet)' : ''}. Sett dem i stolpeskoene, lodd i begge retninger og avstiv midlertidig.`, verktoy: ['vater', 'kappsag'] })
  }
  const dr = o0.drager.valgt
  steg.push({ tittel: 'Dragere', trinn: 'bjelkelag', tekst: `Legg dragerne ${dr.profil} ${sys.modus === 'innfelt' ? 'på stolpeskoene (dragerne er også kantbjelker)' : sys.stolpe ? 'oppå stolpene' : 'rett på stolpeskoene'} langs husveggen. ${dr.antall > 1 ? 'Lagene spikres/skrus sammen med forskjøvne skjøter, alltid midt over en stolpe. ' : ''}Fest med 2 vinkelbeslag per stolpe. Kontroller at overkant ligger i ${t.fall ? `fall 1:100 ut fra huset (${mm(t.fall * (o0.rader[o0.rader.length - 1] - o0.rader[0]))} mm lavere på ytterste rad)` : 'vater'}.` })
  if (sys.avstivet) steg.push({ tittel: 'Skråstag', trinn: 'bjelkelag', tekst: 'Monter skråstag 48 × 98 mm på stolpesidene i ytterfeltene – både langs dragerne og mellom radene. Endene kappes loddrett (se vinkel i kapplista) og boltes med M12 i hver stolpe.' })
  const skjot = m.deler.filter((d) => grunnNavn(d.navn) === 'Skjøtebjelke').length
  steg.push({ tittel: 'Bjelkelag', trinn: 'bjelkelag', tekst: `${sys.modus === 'stolper' ? `Monter kantbjelkene foran og bak, og legg bjelkene ${sys.bjelke.boardProfil} c/c ${mm(sys.cc)} mm oppå dragerne. Fest hver bjelke til drageren med vinkelbeslag og skru kantbjelken inn i bjelkeendene (3 skruer).` : `Heng bjelkene ${sys.bjelke.boardProfil} c/c ${mm(sys.cc)} mm i bjelkesko mellom dragerne – overkant bjelke i flukt med overkant drager.`}${skjot ? ` Legg en ekstra skjøtebjelke (${skjot} stk) tett inntil bjelken der terrassebordene skal skjøtes, så hver bordende får 48 mm opplegg.` : ''}${m.bjelkeskjoter ? ' Bjelker som skjøtes over drager får skjøtelask 600 mm på siden.' : ''} Kontroller diagonalene igjen før dekket legges.`, tidTimer: Math.round(m.arealM2 * 0.4) })
  const rip = m.deler.filter((d) => grunnNavn(d.navn) === 'Terrassebord' && d.merknad).map((d) => d.merknad as string)
  steg.push({ tittel: 'Terrassebord', trinn: 'kledning', tekst: `Start med et helt bord ytterst (synlig kant) og legg ${t.bord.profil} parallelt med huset med ${mm(TRESLAG_GAP(t))} mm fuge (bruk avstandsklosser). Margsiden (kuven) ned. To skruer i hvert bjelkekryss, ca. 20 mm fra kanten; forbor i bordendene. ${m.skjoter ? 'Skjøtene forskyves rad for rad og ligger alltid over dobbel bjelke, med 2–3 mm endeluft.' : 'Bordene går i hele lengder uten skjøt.'}${rip.length ? ` Siste bord inn mot ${t.vegg ? 'veggen' : 'kanten'}: ${[...new Set(rip)].join(', ').toLowerCase()}.` : ''}`, verktoy: ['skrumaskin', 'avstandsklosser', 'kappsag'], tidTimer: Math.round(m.arealM2 * 0.5) })
  if (t.kantbord) steg.push({ tittel: 'Kantbord', trinn: 'kledning', tekst: 'Skru kantbord 21 × 145 mm på kantbjelkene, overkant tett under terrassebordene. Hjørnene gjæres 45,0° og limes/skrus i gjæringen.' })
  if (m.rekkverkHoyde) steg.push({ tittel: 'Rekkverk', trinn: 'kledning', tekst: `Bolt rekkverksstolpene 98 × 98 (c/c ≤ ${mm(m.rekkverkCC)} mm) til kantbjelken med 2 × M12. Monter rekker 48 × 98 mellom stolpene og ${t.gjerde === 'spiler' ? 'spiler 36 × 48' : 'bord 21 × 95'} på innsiden med maks ${Math.round(MAKS_AAPNING * 1000)} mm åpning og 50 mm klaring over dekket. Håndlist 28 × 120 oppå, gjæret 45,0° i hjørnene. Overkant håndlist ${Math.round(m.rekkverkHoyde * 100)} cm over dekket.`, advarsel: 'TEK17 § 12-17: ingen vannrette deler som gjør rekkverket lett å klatre i.' })
  if (m.trapp) {
    const tg = m.trapp
    steg.push({ tittel: 'Trapp', trinn: 'kledning', tekst: `${tg.antallOpptrinn} opptrinn à ${Math.round(tg.stigningMm)} mm og ${tg.antallInntrinn} inntrinn à ${Math.round(tg.inntrinnMm)} mm (2s + i = ${Math.round(tg.trinnformelMm)} mm, helning ${fmtGrader(tg.vinkelGrader)}). Skru trappeanlegget til kantbjelken, kapp ${tg.vanger} hele vanger 48 × 248 (loddkutt ${fmtGrader(tg.vangeToppkutt.gjaeringGrader)}, fotkutt ${fmtGrader(tg.vangeFotkutt.gjaeringGrader)}) med påskrudde trinnklosser, og heng dem i vinkelbeslag. Vangefoten står på heller/betong – ikke på jord. Trinnbord 28 × 145 med ${Math.round(TRINN_NESE * 1000)} mm nese.${tg.Hf > 0.5 ? ' Rekkverk på begge sider av trappa, håndlist 0,9 m over trinnforkant.' : ''}`, tidTimer: 6 })
  }
  steg.push({ tittel: 'Kontroll og overflate', trinn: 'ferdig', tekst: 'Ettertrekk bolter og beslag, kontroller vater og at alle åpninger i rekkverket er under 100 mm. La impregnert virke tørke en sesong før beis/olje.' })
  return steg
}

// ── Template ───────────────────────────────────────────────────────

const harRekkverk = (c: DesignConfig) => c.rekkverk !== 'ingen' || num(c.hoyde, 50) > 50

export const terrasse: ProductTemplate<TerrasseConfig> & {
  beregningsgrunnlag: (c: TerrasseConfig) => Beregningsgrunnlag
  monteringPlan: (c: TerrasseConfig) => MonteringSteg[]
} = {
  id: 'terrasse',
  navn: 'Terrasse',
  ikon: 'faBorderAll',
  beskrivelse: 'Tegn terrassen i 3D – rektangel, hjørne eller U-form, inntil vegg eller frittstående. Bjelkelag, dragere, stolper og fundamenter dimensjoneres etter Eurokode, med rekkverk og trapp etter TEK17.',
  bilde: '/images/products/terrasse-3d.webp',
  tilgjengelig: true,
  fraPris: 349,
  // Terrasse er ikke et lite prosjekt – kun byggeplan, ingen bygging.
  leveranser: ['plan'],
  defaultConfig: {
    form: 'rektangel',
    lengde: 500,
    bredde: 350,
    hovedLengde: 600,
    hovedBredde: 300,
    floyLengde: 300,
    floyBredde: 300,
    ytreLengde: 600,
    ytreBredde: 800,
    armBredde: 250,
    hoyde: 60,
    plassering: 'vegg',
    fall: '1',
    bord: '28x120',
    bjelkeDim: 'auto',
    kantbord: 'ja',
    rekkverk: 'auto',
    gjerdeType: 'spiler',
    gjerdeHoyde: 100,
    trapp: 'front',
    trappBredde: 120,
    visning: 'overflate',
    treslag: 'impregnert',
    farge: 'ubehandlet',
  },
  presets: [
    { id: 'platting', navn: 'Lav platting', beskrivelse: '30 cm over terreng – søknadsfri, uten rekkverk', config: { form: 'rektangel', lengde: 400, bredde: 300, hoyde: 30, plassering: 'vegg', rekkverk: 'auto', trapp: 'ingen', bord: '28x120' } },
    { id: 'klassisk', navn: 'Klassisk terrasse', beskrivelse: '60 cm høy med spilerekkverk og trapp', config: { form: 'rektangel', lengde: 500, bredde: 350, hoyde: 60, plassering: 'vegg', rekkverk: 'auto', gjerdeType: 'spiler', gjerdeHoyde: 100, trapp: 'front', trappBredde: 120 } },
    { id: 'hjorne', navn: 'Rundt hjørnet', beskrivelse: 'L-form langs to husvegger', config: { form: 'lForm', hovedLengde: 600, hovedBredde: 300, floyLengde: 300, floyBredde: 350, hoyde: 45, plassering: 'vegg', rekkverk: 'auto', trapp: 'front', trappBredde: 120 } },
    { id: 'hevet', navn: 'Hevet terrasse', beskrivelse: '1,5 m høy – skråstag, rekkverk og trapp', config: { form: 'rektangel', lengde: 400, bredde: 300, hoyde: 150, plassering: 'vegg', rekkverk: 'auto', gjerdeType: 'spiler', gjerdeHoyde: 100, trapp: 'front', trappBredde: 100 } },
    { id: 'familie', navn: 'Stor familieterrasse', beskrivelse: '8 × 4 m med bred trapp', config: { form: 'rektangel', lengde: 800, bredde: 400, hoyde: 70, plassering: 'vegg', bord: '28x145', rekkverk: 'auto', gjerdeType: 'spiler', trapp: 'front', trappBredde: 160 } },
    { id: 'hestesko', navn: 'U-terrasse', beskrivelse: 'Rundt tre sider av et tilbygg', config: { form: 'uForm', ytreLengde: 600, ytreBredde: 800, armBredde: 250, hoyde: 50, plassering: 'vegg', rekkverk: 'auto', trapp: 'front', trappBredde: 120 } },
    { id: 'hage', navn: 'Frittstående hageplatting', beskrivelse: 'Kebony 21 × 95 – i hagen', config: { form: 'rektangel', lengde: 360, bredde: 360, hoyde: 30, plassering: 'frittstaende', fall: '0', bord: '21x95', treslag: 'kebony', rekkverk: 'auto', trapp: 'ingen' } },
  ],
  dimensjoner: [
    { key: 'lengde', label: 'Lengde (langs huset)', min: 150, max: 1200, step: 10, axis: 'x', visibleWhen: (c) => c.form === 'rektangel' },
    { key: 'bredde', label: 'Dybde (ut fra huset)', min: 150, max: 800, step: 10, axis: 'z', visibleWhen: (c) => c.form === 'rektangel' },
    { key: 'hovedBredde', label: 'Hoveddel bredde', min: 150, max: 900, step: 10, axis: 'x', visibleWhen: (c) => c.form === 'lForm' || c.form === 'lFormSpeil' },
    { key: 'hovedLengde', label: 'Hoveddel dybde', min: 150, max: 1200, step: 10, axis: 'z', visibleWhen: (c) => c.form === 'lForm' || c.form === 'lFormSpeil' },
    { key: 'floyBredde', label: 'Fløy bredde', min: 100, max: 600, step: 10, axis: 'x', handle: false, visibleWhen: (c) => c.form === 'lForm' || c.form === 'lFormSpeil' },
    { key: 'floyLengde', label: 'Fløy dybde', min: 100, max: 800, step: 10, axis: 'z', handle: false, visibleWhen: (c) => c.form === 'lForm' || c.form === 'lFormSpeil' },
    { key: 'ytreBredde', label: 'Ytre bredde', min: 300, max: 1000, step: 10, axis: 'x', visibleWhen: (c) => c.form === 'uForm' },
    { key: 'ytreLengde', label: 'Ytre dybde', min: 300, max: 1000, step: 10, axis: 'z', visibleWhen: (c) => c.form === 'uForm' },
    { key: 'armBredde', label: 'Armbredde', min: 100, max: 400, step: 10, axis: 'x', handle: false, visibleWhen: (c) => c.form === 'uForm' },
    { key: 'hoyde', label: 'Høyde over terreng', min: 25, max: 250, step: 5, axis: 'y', markers: [30, 50, 100, 150] },
    { key: 'gjerdeHoyde', label: 'Rekkverkshøyde', min: 90, max: 120, step: 5, axis: 'y', handle: false, visibleWhen: harRekkverk, markers: [100] },
    { key: 'trappBredde', label: 'Trappebredde', min: 80, max: 200, step: 10, axis: 'x', handle: false, visibleWhen: (c) => c.trapp === 'front' },
  ],
  materialer: [
    { key: 'treslag', label: 'Treslag (dekke og rekkverk)', choices: treslagValg(['impregnert', 'royal', 'lerk', 'kebony']) },
    { key: 'farge', label: 'Farge / beis', asSwatches: true, choices: fargeValg(['ubehandlet', 'klar', 'hvit', 'lysgra', 'morkegra', 'sort', 'brun', 'gronn']) },
  ],
  alternativer: [
    {
      key: 'form',
      label: 'Form',
      choices: [
        { id: 'rektangel', label: 'Rektangel', note: 'Langs én husvegg.' },
        { id: 'lForm', label: 'Hjørne høyre', note: 'L-form rundt et hushjørne.' },
        { id: 'lFormSpeil', label: 'Hjørne venstre', note: 'L-form rundt et hushjørne.' },
        { id: 'uForm', label: 'U-form', note: 'Rundt tre sider av et tilbygg.' },
      ],
    },
    {
      key: 'plassering',
      label: 'Plassering',
      choices: [
        { id: 'vegg', label: 'Inntil husvegg', note: 'Selvbærende, 20 mm luftespalte mot veggen.' },
        { id: 'frittstaende', label: 'Frittstående', note: 'I hagen – frie kanter rundt.', patch: { fall: '0' } },
      ],
    },
    {
      key: 'bord',
      label: 'Terrassebord',
      choices: [
        { id: '28x120', label: '28 × 120', note: 'Standard. Bjelker c/c 600.' },
        { id: '28x145', label: '28 × 145', note: 'Bredere bord. Bjelker c/c 600.' },
        { id: '21x95', label: '21 × 95', note: 'Tynne bord. Bjelker c/c 400.' },
      ],
    },
    {
      key: 'bjelkeDim',
      label: 'Bjelkelag',
      choices: [
        { id: 'auto', label: 'Beregnet', note: 'Rimeligste løsning som holder.' },
        { id: '48x148', label: '48 × 148' },
        { id: '48x198', label: '48 × 198' },
        { id: '48x223', label: '48 × 223' },
      ],
    },
    {
      key: 'rekkverk',
      label: 'Rekkverk',
      choices: [
        { id: 'auto', label: 'Der det kreves', note: 'Automatisk når fallhøyden > 0,5 m (TEK17).' },
        { id: 'alle', label: 'Alle frie kanter' },
        { id: 'ingen', label: 'Uten', note: 'Bare mulig når terrassen er ≤ 0,5 m høy.' },
      ],
    },
    {
      key: 'gjerdeType',
      label: 'Rekkverkstype',
      visibleWhen: harRekkverk,
      choices: [
        { id: 'spiler', label: 'Spiler', note: 'Loddrette spiler 36 × 48, åpning < 100 mm.' },
        { id: 'bord', label: 'Bord', note: 'Loddrette bord 21 × 95 med luft.' },
        { id: 'tett', label: 'Tett', note: 'Tette loddrette bord (le).' },
      ],
    },
    {
      key: 'trapp',
      label: 'Trapp',
      choices: [
        { id: 'ingen', label: 'Ingen' },
        { id: 'front', label: 'Foran', note: 'Sentrert på fronten.' },
      ],
    },
    {
      key: 'kantbord',
      label: 'Kantbord',
      choices: [
        { id: 'ja', label: 'Med kantbord', note: '21 × 145, gjæret i hjørnene.' },
        { id: 'nei', label: 'Uten' },
      ],
    },
    {
      key: 'fall',
      label: 'Fall',
      choices: [
        { id: '1', label: '1 : 100', note: 'Svakt fall ut fra huset.' },
        { id: '0', label: 'Vater' },
      ],
    },
    {
      key: 'visning',
      label: 'Visning',
      choices: [
        { id: 'overflate', label: 'Ferdig', note: 'Slik terrassen blir.' },
        { id: 'begge', label: 'Gjennomsiktig dekke', note: 'Se bjelkelaget gjennom bordene.' },
        { id: 'konstruksjon', label: 'Konstruksjon', note: 'Kun bjelkelag, dragere og fundamenter.' },
      ],
    },
  ],
  parts: [
    { key: 'gulv', label: 'Terrassebord' },
    { key: 'kantbord', label: 'Kantbord' },
    { key: 'bjelkelag', label: 'Bjelkelag og dragere' },
    { key: 'stolpe', label: 'Stolper og skråstag' },
    { key: 'fundament', label: 'Fundamenter' },
    { key: 'rekkverk', label: 'Rekkverk' },
    { key: 'trapp', label: 'Trapp' },
  ],
  beregn,
  kappliste,
  tegning2D: tegninger,
  soknadTegning: tegninger,
  byggeregler,
  beregningsgrunnlag,
  monteringPlan,
  montering: (c) => monteringPlan(c).map((s) => `${s.tittel}: ${s.tekst}${s.advarsel ? ` (${s.advarsel})` : ''}`),
  raad: (c) => {
    const m = modell(c)
    const r = [
      'Bjelkelag, dragere og stolper skal være trykkimpregnert C24 (NTR klasse AB) – også under kebony/lerk-dekke.',
      `Fuge ${mm(TRESLAG_GAP(m.t))} mm mellom bordene og 2–3 mm i endeskjøter. Legg bordene med margsiden (kuven) ned.`,
      'Bruk rustfrie A4-skruer i terrassebordene og varmforsinkede beslag/bolter i konstruksjonen. Forbor nær bordendene.',
      'Stolpesko og pilarer holder endeveden over betong og jord – trevirke skal aldri stå direkte i bakken.',
      'Legg fiberduk og et lag pukk under terrassen for å hindre ugress og gi lufting.',
    ]
    if (m.t.vegg) r.push('Ikke fest terrassen i husets bindingsverk/kledning. Den står selvbærende med luftespalte, så vann og luft slipper fritt bak.')
    if (m.rekkverkHoyde) r.push('Rekkverksstolpene skal boltes gjennom kantbjelken – skruer i endeved holder ikke for horisontal last.')
    if (m.sys.modus === 'innfelt') r.push('Lav platting: bjelkene henger i bjelkesko mellom dragerne for å få lav byggehøyde. Sørg for minst 30 mm lufting under dragerne.')
    r.push(...m.sys.meldinger)
    return r
  },
  buildMesh,
  bounds: (c) => {
    const m = modell(c)
    return { x: m.max[0] - m.min[0], y: m.max[1], z: m.max[2] - m.min[2] }
  },
}

/** QA/test: den beregnede modellen (deler, system) for en config. */
export const terrasseModell = (c: TerrasseConfig) => modell(c)
