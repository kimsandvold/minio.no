import * as THREE from 'three'
import type { Bom, Byggeregler, BuildOptions, DesignConfig, ProductTemplate, Tegning2D } from '../types'
import type { Beregningsgrunnlag, BomLinePlan, Form2DPlan, KapplisteDelPlan, MonteringSteg, Riss2DPlan } from '../plan-typer'
import { TRESLAG, treslagValg, fargeValg } from '../materials'
import { PRISER } from '../priser'
import { frostsoneForConfig, grunnForConfig, snolastForConfig } from '../byggested'
import { TAKTEKKE, VB0_STANDARD, fmt, snolastTak, vindHorisontal, vindOppdrift, vindlast } from '../laster'
import { BJELKER_C24, DOBLE_C24, dimensjonerDrager, dimensjonerSperre, dimensjonerStolpe, kontrollerSoyle, taklaster, tverrsnitt, type Dimensjonering, type Medlemskontroll, type Tverrsnitt } from '../dimensjonering'
import { fmtGrader, rundOppKapp, sperreGeometri, type SperreGeometri } from '../geometri'
import { FROSTSONER, FUNDAMENTER_MED_BLOKKER, GRUNN, betongvekt, dimensjonerPunktfundament, forankringsraad, frostdybde, type Frostresultat, type Frostsone, type Fundamentresultat, type Grunn } from '../fundament'
import { tilByggeregler, vurderByggesak, type ByggesakResultat } from '../byggesak'
import { lagBeregningsrapport, tilPlanVedlegg } from '../beregningsgrunnlag'
import { boks, byggGruppe, flytt, kapplisteFra, projiser, r1, unikeKappnavn, utstrekning, type Del, type Prisme, type Stav, type V3 } from './deler3d'

/**
 * Pergola – parametrisk byggeplan (norsk praksis, Eurokode 5).
 *
 * Oppbygging:
 *  - Betongpilar til frostfri dybde + justerbar stolpesko (forankret mot oppløft).
 *  - Stolper 98×98 / 148×148 (`dimensjonerStolpe`), knebånd 48×98 i 45° i
 *    begge retninger (avstivning mot vind).
 *  - Dragere oppå stolpene langs bredden (`dimensjonerDrager`), enkle eller
 *    doble 48-bjelker, pyntekappet 30° i endene. Veggmontert: veggbjelke på
 *    husveggen i stedet for bakre drager.
 *  - Sperrer langs dybden c/c ≤ 600 oppå dragerne, alltid én sperre over hver
 *    stolpe (knebåndet går opp til den). `dimensjonerSperre` for snølast.
 *  - Tak: åpent, lekter (solskjerm), lameller (skråstilte) eller tett tak av
 *    16 mm kanalplater i polykarbonat med fall (fuglemunn etter
 *    `sperreGeometri`).
 *  - Valgfri sideskjerm under knebåndene.
 *
 * Alt (3D, materialliste, kappliste, tegninger, bounds) kommer fra samme
 * dellister i `modell(c)`.
 *
 * Koordinater lokalt: x langs bredden, z fra baksiden (husveggen) mot fronten,
 * y opp. Bredde × dybde = utvendig mål over stolpene (veggmontert: fra veggen).
 */

export interface PergolaConfig {
  montering: string // 'frittstående' | 'veggmontert'
  bredde: number // cm (x)
  dybde: number // cm (z)
  hoyde: number // cm – fri høyde under drager (front)
  stolpeDim: string // 'auto' | '98x98' | '148x148'
  bjelkeDim: string // 'auto' | '48x148' | '48x198' | '48x223' (sperrer)
  taktype: string // 'åpen' | 'lekter' | 'spjeld' | 'tett'
  lektAvstand: number // cm c/c lekter/lameller
  takvinkel: number // grader (tett tak)
  skjermtype: string // 'ingen' | 'spalér' | 'horisontal' | 'tett'
  skjermSider: string // 'bak' | 'bak+sider' | 'alle'
  treslag: string
  farge: string
  [key: string]: DesignConfig[string]
}

const SVINN = 1.1
const MAKS_LAGER = 5.4
const PILAR_OVER = 0.05
const SKO = 0.025
const OH_Z = 0.3 // utstikk sperrer foran/bak
const OH_X = 0.3 // utstikk dragere i endene
const PYNT = 30 // pyntekapp i endene (grader fra loddrett)
const KB_B = 0.098 // knebånd 48 × 98
const KB_T = 0.048
const LEKT = 0.048
const VEGG_LUFT = 0.01
const PLATE_T = 0.016
const RAD = Math.PI / 180

const pris = (id: string, reserve = 0) => PRISER[id]?.pris ?? reserve
const mm = (m: number) => Math.round(m * 1000)
const P48 = (h: number) => `48 × ${h} mm`
const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d)
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const grunnNavn = (n: string) => n.replace(/ \(.*\)$/, '')

interface T {
  vegg: boolean
  W: number
  D: number
  H: number
  stolpe: string
  sperre: string
  tak: 'åpen' | 'lekter' | 'spjeld' | 'tett'
  lektCC: number
  vinkel: number
  skjerm: 'ingen' | 'spalér' | 'horisontal' | 'tett'
  sider: Array<'front' | 'bak' | 'venstre' | 'høyre'>
  grunn: Grunn
  sone: Frostsone
  sk: number
  treslag: string
}

function les(c: PergolaConfig): T {
  const vegg = c.montering === 'veggmontert'
  const tak = (['åpen', 'lekter', 'spjeld', 'tett'] as const).includes(c.taktype as T['tak']) ? (c.taktype as T['tak']) : 'lekter'
  const skjerm = (['ingen', 'spalér', 'horisontal', 'tett'] as const).includes(c.skjermtype as T['skjerm']) ? (c.skjermtype as T['skjerm']) : 'ingen'
  const sv = String(c.skjermSider ?? 'bak+sider')
  const alle: T['sider'] = sv === 'bak' ? ['bak'] : sv === 'alle' ? ['front', 'bak', 'venstre', 'høyre'] : ['bak', 'venstre', 'høyre']
  return {
    vegg,
    W: clamp(num(c.bredde, 360), 150, 1000) / 100,
    D: clamp(num(c.dybde, 300), 150, 800) / 100,
    H: clamp(num(c.hoyde, 240), 200, 320) / 100,
    stolpe: ['98x98', '148x148'].includes(String(c.stolpeDim)) ? String(c.stolpeDim) : 'auto',
    sperre: ['48x148', '48x198', '48x223'].includes(String(c.bjelkeDim)) ? String(c.bjelkeDim) : 'auto',
    tak,
    lektCC: clamp(num(c.lektAvstand, 30), 10, 60) / 100,
    vinkel: tak === 'tett' ? clamp(num(c.takvinkel, 7), 5, 15) : 0,
    skjerm,
    // Veggmontert: baksiden er husveggen – ingen skjerm der.
    sider: skjerm === 'ingen' ? [] : vegg ? alle.filter((s) => s !== 'bak') : alle,
    grunn: grunnForConfig(c),
    sone: frostsoneForConfig(c).sone,
    sk: snolastForConfig(c).sk,
    treslag: typeof c.treslag === 'string' && TRESLAG[c.treslag] ? c.treslag : 'impregnert',
  }
}

const jevnt = (a: number, b: number, n: number) => (n <= 1 ? [(a + b) / 2] : Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1)))

// ── Konstruksjonssystem ────────────────────────────────────────────

interface System {
  stolpeTv: Tverrsnitt
  s: number // stolpebredde (m)
  stolpeX: number[]
  /** Dragerrader (senter z). Veggmontert: uten bakre rad (veggbjelke). */
  rader: number[]
  sperre: Dimensjonering
  sperreSpenn: number
  sperreX: number[]
  sperreCC: number
  drager: Dimensjonering
  dragerSpenn: number
  lastbredde: number
  stolpeDim: Dimensjonering
  stolpeL: number
  geo: SperreGeometri | null
  /** Overkant drager i front (m over terreng). */
  yDragerTopp: number
  /** Overkant bakre støtte (drager/veggbjelke) – lik front for flatt tak. */
  yBakTopp: number
  frost: Frostresultat
  fundDybde: number
  fund: Fundamentresultat
  oppdriftPerStolpe: number
  qp: number
  meldinger: string[]
}

const systemCache = new Map<string, System>()

function systemFor(t: T): System {
  const key = JSON.stringify(t)
  const hit = systemCache.get(key)
  if (hit) return hit
  const s = beregnSystem(t)
  if (systemCache.size > 200) systemCache.clear()
  systemCache.set(key, s)
  return s
}

function beregnSystem(t: T): System {
  const meldinger: string[] = []
  const tk = t.tak === 'tett' ? 2 : 3
  const tekke = 'polykarbonat' as const
  const ekstra = t.tak === 'lekter' || t.tak === 'spjeld' ? 0.08 : 0 // lekter/lameller, kN/m²
  const flater = taklaster({ sk: t.sk, vinkelGrader: t.vinkel, tekke, ekstraEgenvekt: t.tak === 'tett' ? 0 : ekstra - TAKTEKKE[tekke].gk })
  const sperreKand = t.sperre === 'auto' ? BJELKER_C24.filter((b) => b.h >= 148) : BJELKER_C24.filter((b) => `48x${b.h}` === t.sperre)
  const stolpeKand = t.stolpe === '148x148' ? [tverrsnitt(148, 148, 1, 'C24', 'stolpe-148x148')] : t.stolpe === '98x98' ? [tverrsnitt(98, 98, 1, 'C24', 'stolpe-98x98')] : [tverrsnitt(98, 98, 1, 'C24', 'stolpe-98x98'), tverrsnitt(148, 148, 1, 'C24', 'stolpe-148x148')]
  // Tett tak holder snøen borte → snøfri frostdybde. Åpne tak: naturlig snødekke.
  const frost = frostdybde({ sone: t.sone, grunn: t.grunn, snofri: t.tak === 'tett' })
  const fundDybde = t.grunn === 'fjell' ? 0.3 : Math.max(0.6, frost.anbefaltDybdeM)

  let beste: System | null = null
  for (const stolpeTv of stolpeKand) {
    const s = stolpeTv.b / 1000
    // Dragerrader og sperrespenn (dybde).
    const zFront = t.D - s / 2
    const zBak = t.vegg ? VEGG_LUFT + 0.024 : s / 2 // veggbjelkens senter / bakre stolperad
    const sperreDim = (spenn: number, cc: number) => dimensjonerSperre({ spennHorisontalM: spenn, vinkelGrader: t.vinkel, ccM: cc, tekke, sk: t.sk, tjenesteklasse: tk, kandidater: sperreKand })
    let rader: number[] = []
    let sperre: Dimensjonering | null = null
    let sperreSpenn = 0
    for (let n = 2; n <= 5; n++) {
      const sp = (zFront - zBak) / (n - 1)
      const d = sperreDim(sp, 0.6)
      if (d.ok) {
        rader = jevnt(zBak, zFront, n)
        sperre = d
        sperreSpenn = sp
        break
      }
    }
    if (!sperre) continue
    if (t.vegg) rader = rader.slice(1) // bakerste «rad» er veggbjelken
    // Stolper langs x: velg færrest stolper der drager og stolpe holder.
    const sh = sperre.valgt.h / 1000
    for (let m = 2; m <= 8; m++) {
      const stolpeX = jevnt(s / 2, t.W - s / 2, m)
      const sp = stolpeX[1] - stolpeX[0]
      if (sp > 4.2) continue
      // Sperrer: én over hver stolpe + jevnt mellom, c/c ≤ 600.
      const sperreX: number[] = []
      for (let i = 0; i < stolpeX.length - 1; i++) {
        const k = Math.max(1, Math.ceil(sp / 0.6 - 1e-9))
        for (let j = 0; j < k; j++) sperreX.push(stolpeX[i] + (sp * j) / k)
      }
      sperreX.push(stolpeX[stolpeX.length - 1])
      const sperreCC = sperreX[1] - sperreX[0]
      const sperreSjekk = sperreDim(sperreSpenn, sperreCC)
      if (!sperreSjekk.ok) continue
      // Lastbredde for verste dragerrad.
      const lbFront = sperreSpenn / 2 + OH_Z
      const lastbredde = rader.length > (t.vegg ? 1 : 2) ? sperreSpenn : lbFront
      const egenSperre = (5 * 0.048 * sh) / sperreCC
      const drager = dimensjonerDrager({
        spennM: sp,
        lastbreddeM: lastbredde,
        flatelaster: flater,
        ekstraLinjelaster: [{ navn: `Egenvekt sperrer ${sperreSjekk.valgt.profil}`, type: 'egen', qk: egenSperre * lastbredde }],
        tjenesteklasse: tk,
        sidestottet: true,
        opplegglengdeMm: stolpeTv.b,
        kandidater: [...BJELKER_C24.filter((b) => b.h >= 148), ...DOBLE_C24.filter((b) => b.antall * b.b <= stolpeTv.b), ...(stolpeTv.b >= 144 ? DOBLE_C24.filter((b) => b.antall === 3) : [])],
      })
      if (!drager.ok) continue
      const dh = drager.valgt.h / 1000
      // Sperregeometri (tett tak med fall, fuglemunn på begge opplegg).
      const dw = (drager.valgt.b * drager.valgt.antall) / 1000
      let geo: SperreGeometri | null = null
      let yBakTopp = t.H + dh
      if (t.tak === 'tett') {
        const lop = zFront + dw / 2 - (t.vegg ? VEGG_LUFT : zBak - dw / 2)
        geo = sperreGeometri({ vinkelGrader: t.vinkel, sperreHoydeMm: sperreSjekk.valgt.h, svillBreddeMm: dw * 1000, utstikkMm: OH_Z * 1000, topp: { type: 'vegg', lopMm: lop * 1000, svillBreddeMm: t.vegg ? 48 : dw * 1000, utstikkMm: t.vegg ? 0 : OH_Z * 1000 } })
        yBakTopp = t.H + dh + (geo.ovreSvillHoydeMm ?? 0) / 1000
      }
      const stolpeL = (t.vegg ? t.H : yBakTopp - dh) - PILAR_OVER - SKO
      const A = sp * lastbredde
      const stolpeDim = dimensjonerStolpe({ lengdeM: stolpeL, belastningsarealM2: A, flatelaster: flater, ekstraNGk: 5 * dw * dh * sp + egenSperre * A, tjenesteklasse: 3, knekklengdefaktor: 1.0, kandidater: [stolpeTv] })
      if (!stolpeDim.ok) continue
      // Vind: oppløft per stolpe (åpent tak – konservativt også for lekter).
      const vind = vindlast(VB0_STANDARD, 2, yBakTopp + sh)
      const gPerStolpe = flater.filter((f) => f.type === 'egen').reduce((a, f) => a + f.qk, 0) * A + egenSperre * A + 5 * dw * dh * sp
      // Åpne tak: vinden går gjennom – oppløftet regnes på den tette andelen φ av takflaten.
      const phi = t.tak === 'tett' ? 1 : Math.min(1, 0.048 / sperreCC + (t.tak === 'lekter' ? LEKT / t.lektCC : t.tak === 'spjeld' ? (0.095 * Math.sin(30 * RAD) + 0.021 * Math.cos(30 * RAD)) / t.lektCC : 0))
      const oppdrift = Math.max(0, vindOppdrift(vind.qp, A * phi, gPerStolpe))
      const NGk = gPerStolpe + 5 * stolpeTv.b * stolpeTv.h * 1e-6 * stolpeL
      const sno = flater.find((f) => f.type === 'sno')?.qk ?? 0
      const fund = dimensjonerPunktfundament({ NGk, NQk: [{ type: 'sno', Nk: sno * A }], grunn: t.grunn, dybdeM: fundDybde, oppdriftKN: oppdrift, kandidater: FUNDAMENTER_MED_BLOKKER })
      beste = { stolpeTv, s, stolpeX, rader, sperre: sperreSjekk, sperreSpenn, sperreX, sperreCC, drager, dragerSpenn: sp, lastbredde, stolpeDim, stolpeL, geo, yDragerTopp: t.H + dh, yBakTopp, frost, fundDybde, fund, oppdriftPerStolpe: oppdrift, qp: vind.qp, meldinger }
      break
    }
    if (beste) break
  }
  if (!beste) {
    meldinger.push('Ingen standardløsning holder for disse målene – reduser bredde/dybde eller velg kraftigere stolper. Vist løsning er IKKE godkjent.')
    // Vis likevel en modell (største standarddimensjoner) slik at UI-et ikke krasjer.
    const stolpeTv = tverrsnitt(148, 148, 1, 'C24', 'stolpe-148x148')
    const s = 0.148
    const stolpeX = jevnt(s / 2, t.W - s / 2, Math.max(2, Math.ceil((t.W - s) / 2.4) + 1))
    const zFront = t.D - s / 2
    const zBak = t.vegg ? VEGG_LUFT + 0.024 : s / 2
    const n = Math.max(2, Math.ceil((zFront - zBak) / 3) + 1)
    let rader = jevnt(zBak, zFront, n)
    const sp = rader[1] - rader[0]
    if (t.vegg) rader = rader.slice(1)
    const sperre = dimensjonerSperre({ spennHorisontalM: sp, vinkelGrader: t.vinkel, ccM: 0.6, tekke, sk: t.sk, tjenesteklasse: tk })
    const drager = dimensjonerDrager({ spennM: stolpeX[1] - stolpeX[0], lastbreddeM: sp, flatelaster: flater, tjenesteklasse: tk, sidestottet: true, kandidater: DOBLE_C24 })
    const dh = drager.valgt.h / 1000
    const stolpeDim = dimensjonerStolpe({ lengdeM: t.H, belastningsarealM2: sp * (stolpeX[1] - stolpeX[0]), flatelaster: flater, kandidater: [stolpeTv] })
    const fund = dimensjonerPunktfundament({ NGk: 5, NQk: [], grunn: t.grunn, dybdeM: fundDybde })
    const sperreX = jevnt(s / 2, t.W - s / 2, Math.ceil((t.W - s) / 0.6) + 1)
    beste = { stolpeTv, s, stolpeX, rader, sperre, sperreSpenn: sp, sperreX, sperreCC: sperreX[1] - sperreX[0], drager, dragerSpenn: stolpeX[1] - stolpeX[0], lastbredde: sp, stolpeDim, stolpeL: t.H - 0.075, geo: null, yDragerTopp: t.H + dh, yBakTopp: t.H + dh, frost, fundDybde, fund, oppdriftPerStolpe: 0, qp: 0, meldinger }
  }
  if (!beste.fund.ok) meldinger.push(...beste.fund.merknader)
  return beste
}

// ── Modell ─────────────────────────────────────────────────────────

interface Modell {
  t: T
  sys: System
  deler: Del[]
  forskyv: V3
  min: V3
  max: V3
  kneband: { lengdeMm: number; antall: number; arm: number }
  vegghoyde: number
}

const POS: Record<string, string> = {
  Stolpe: 'A',
  Drager: 'B',
  Veggbjelke: 'C',
  Sperre: 'D',
  Knebånd: 'E',
  Takplate: 'F',
  Lekt: 'G',
  Lamell: 'G',
  Skjermstender: 'H',
  Skjermbord: 'K',
  Spalérlekt: 'K',
  Skjermrekke: 'L',
  Veggstender: 'M',
}

const modellCache = new Map<string, Modell>()
function modell(c: PergolaConfig): Modell {
  const t = les(c)
  const key = JSON.stringify(t)
  const hit = modellCache.get(key)
  if (hit) return hit
  const m = byggModell(t)
  if (modellCache.size > 100) modellCache.clear()
  modellCache.set(key, m)
  return m
}

/** Pyntekappet bjelkeprofil i (u, v): topp full lengde, underkant kortere (PYNT° fra loddrett). */
function pyntProfil(L: number, h: number, a: boolean, b: boolean): Array<[number, number]> {
  const k = h * Math.tan(PYNT * RAD)
  return [[a ? k : 0, 0], [b ? L - k : L, 0], [L, h], [0, h]]
}

function byggModell(t: T): Modell {
  const sys = systemFor(t)
  const deler: Del[] = []
  const { s, stolpeX, rader } = sys
  const dr = sys.drager.valgt
  const dh = dr.h / 1000
  const dw = (dr.b * dr.antall) / 1000
  const sp = sys.sperre.valgt
  const sh = sp.h / 1000
  const tre = 'tre' as const
  const stav = (d: Omit<Stav, 'type'>) => {
    deler.push({ type: 'stav', ...d })
  }
  const prisme = (d: Omit<Prisme, 'type'>) => {
    deler.push({ type: 'prisme', ...d })
  }
  const kval = 'C24 NTR AB'
  const pr = (() => {
    if (sys.fund.valgt.id.startsWith('blokk')) return Math.sqrt(sys.fund.valgt.arealM2 / Math.PI)
    const mt = sys.fund.valgt.navn.match(/Ø(\d+)/)
    return mt ? Number(mt[1]) / 2000 : 0.1
  })()

  // Høyde på drageroverkant per rad (tett tak: bakre rader høyere).
  const yRad = (z: number) => {
    if (!sys.geo) return sys.yDragerTopp
    // Bakre drager (frittstående): sperras øvre fuglemunn-sete.
    if (!t.vegg && rader.length > 1 && Math.abs(z - rader[0]) < 1e-9) return sys.yBakTopp
    // Mellomrader: sperras underkant ved dragerens forkant (laveste punkt) – ingen overlapp.
    const zF = rader[rader.length - 1] + dw / 2
    const x = zF - (z + dw / 2)
    const a = t.vinkel * RAD
    return sys.yDragerTopp + Math.max(0, (x - sys.geo.fuglemunn.seteMm / 1000) * Math.tan(a))
  }

  // ── Fundament, stolper, dragere ──
  for (const zr of rader) {
    const yDT = yRad(zr)
    const yDB = yDT - dh
    stolpeX.forEach((x, i) => {
      const id = `${mm(zr)}-${i}`
      deler.push({ type: 'sylinder', pid: `pilar-${id}`, part: 'fundament', navn: 'Betongpilar', profil: `Ø${Math.round(pr * 2000)} pilar`, lengdeMm: mm(PILAR_OVER + sys.fundDybde), kapp: false, farge: 'betong', c: [x, 0, zr], r: pr, h: PILAR_OVER, explode: [0, -0.5, 0] })
      stav({ pid: `sko-${id}`, part: 'fundament', navn: 'Stolpesko (justerbar)', profil: 'varmforsinket', lengdeMm: 150, kapp: false, farge: 'stal', a: [x - (s + 0.012) / 2, PILAR_OVER + SKO / 2, zr], b: [x + (s + 0.012) / 2, PILAR_OVER + SKO / 2, zr], bredde: s + 0.012, hoyde: SKO, explode: [0, -0.4, 0] })
      stav({ pid: `stolpe-${id}`, part: 'stolpe', navn: 'Stolpe', profil: sys.stolpeTv.boardProfil, lengdeMm: (yDB - PILAR_OVER - SKO) * 1000, kapp: true, kategori: 'konstruksjon', kvalitet: kval, farge: tre, a: [x, PILAR_OVER + SKO, zr], b: [x, yDB, zr], bredde: s, hoyde: s, opp: [0, 0, 1], explode: [0, -0.3, 0] })
    })
    // Drager (lag side om side), pyntekapp i endene, skjøt over stolpe.
    const x0 = stolpeX[0] - s / 2 - OH_X
    const x1 = stolpeX[stolpeX.length - 1] + s / 2 + OH_X
    for (let k = 0; k < dr.antall; k++) {
      const zc = zr + (k - (dr.antall - 1) / 2) * (dr.b / 1000)
      const grenser = [x0]
      let a0 = x0
      const indre = stolpeX.slice(1, -1)
      while (x1 - a0 > MAKS_LAGER) {
        const kand = indre.filter((x) => x > a0 + 0.5 && x <= a0 + MAKS_LAGER - (k % 2 === 1 && grenser.length === 1 ? sys.dragerSpenn : 0))
        if (!kand.length) break
        a0 = Math.max(...kand)
        grenser.push(a0)
      }
      grenser.push(x1)
      for (let g = 0; g < grenser.length - 1; g++) {
        const L = grenser[g + 1] - grenser[g]
        const ea = g === 0
        const eb = g === grenser.length - 2
        prisme({ pid: `drager-${mm(zr)}-${k}-${g}`, part: 'drager', navn: 'Drager', profil: dr.boardProfil, lengdeMm: L * 1000, kapp: true, kategori: 'konstruksjon', kvalitet: kval, farge: tre, darken: 0.97, endeA: ea ? { vinkel: PYNT, type: 'gjaering', merknad: 'pyntekapp' } : undefined, endeB: eb ? { vinkel: PYNT, type: 'gjaering', merknad: 'pyntekapp' } : undefined, merknad: grenser.length > 2 ? 'Skjøtes midt over stolpe, forskjøvet mellom lagene' : undefined, pts: pyntProfil(L, dh, ea, eb), o: [grenser[g], yDB, zc], u: [1, 0, 0], v: [0, 1, 0], tykk: dr.b / 1000, explode: [0, 0.2, 0] })
      }
    }
  }

  // ── Veggbjelke ──
  if (t.vegg) {
    const x0 = stolpeX[0] - s / 2 - OH_X
    const x1 = stolpeX[stolpeX.length - 1] + s / 2 + OH_X
    const yTop = sys.yBakTopp
    const deler2 = Math.max(1, Math.ceil((x1 - x0) / MAKS_LAGER - 1e-9))
    for (let g = 0; g < deler2; g++) {
      const a = x0 + ((x1 - x0) * g) / deler2
      const b = x0 + ((x1 - x0) * (g + 1)) / deler2
      stav({ pid: `veggbjelke-${g}`, part: 'drager', navn: 'Veggbjelke', profil: P48(Math.max(198, sp.h)), lengdeMm: (b - a) * 1000, kapp: true, kategori: 'konstruksjon', kvalitet: kval, farge: tre, darken: 0.95, merknad: 'Boltes til husveggen c/c 600 (gjennom kledning til stender/mur) med beslag/vannbrett over', a: [a, yTop - Math.max(0.198, sh) / 2, VEGG_LUFT + 0.024], b: [b, yTop - Math.max(0.198, sh) / 2, VEGG_LUFT + 0.024], bredde: 0.048, hoyde: Math.max(0.198, sh), explode: [0, 0, -0.3] })
    }
  }

  // ── Sperrer ──
  const zFrontFace = rader[rader.length - 1] + dw / 2
  sys.sperreX.forEach((x, i) => {
    if (sys.geo) {
      const g = sys.geo
      const pts = g.omriss.map(([gx, gy]) => [gx / 1000, gy / 1000] as [number, number])
      const a = t.vinkel * RAD
      prisme({ pid: `sperre-${i}`, part: 'spaer', navn: 'Sperre', profil: sp.boardProfil, lengdeMm: g.lengdeMm, kapp: true, kategori: 'tak', kvalitet: kval, farge: tre, endeA: { vinkel: g.loddkutt.gjaeringGrader, type: 'gjaering', merknad: 'loddkutt' }, endeB: { vinkel: g.loddkutt.gjaeringGrader, type: 'gjaering', merknad: 'loddkutt' }, merknad: `Fuglemunn: sete ${mm(g.fuglemunn.seteMm / 1000)} mm, hæl ${Math.round(g.fuglemunn.haelMm)} mm (${fmtGrader(t.vinkel)})`, pts, o: [x, sys.yDragerTopp, zFrontFace], u: [0, 0, -1], v: [0, 1, 0], tykk: 0.048, explode: [0, 0.4, 0] })
      void a
    } else {
      const zA = t.vegg ? VEGG_LUFT : -OH_Z
      const zB = t.D + OH_Z
      const L = zB - zA
      prisme({ pid: `sperre-${i}`, part: 'spaer', navn: 'Sperre', profil: sp.boardProfil, lengdeMm: L * 1000, kapp: true, kategori: 'tak', kvalitet: kval, farge: tre, endeA: t.vegg ? undefined : { vinkel: PYNT, type: 'gjaering', merknad: 'pyntekapp' }, endeB: { vinkel: PYNT, type: 'gjaering', merknad: 'pyntekapp' }, merknad: 'Festes med sperrebeslag til drager/veggbjelke (oppløft)', pts: pyntProfil(L, sh, !t.vegg, true), o: [x, sys.yDragerTopp, zA], u: [0, 0, 1], v: [0, 1, 0], tykk: 0.048, explode: [0, 0.4, 0] })
    }
  })

  // ── Tak / solskjerm ──
  const xs0 = sys.sperreX[0] - 0.024 - 0.15
  const xs1 = sys.sperreX[sys.sperreX.length - 1] + 0.024 + 0.15
  const yTak = sys.yDragerTopp + sh
  if (t.tak === 'lekter' || t.tak === 'spjeld') {
    const zA = (t.vegg ? VEGG_LUFT : -OH_Z) + 0.06
    const zB = t.D + OH_Z - 0.06
    const n = Math.max(2, Math.round((zB - zA) / t.lektCC) + 1)
    const zs = jevnt(zA, zB, n)
    const biter = Math.max(1, Math.ceil((xs1 - xs0) / MAKS_LAGER - 1e-9))
    zs.forEach((z, i) => {
      for (let b = 0; b < biter; b++) {
        // Skjøt midt over en sperre.
        const a0 = b === 0 ? xs0 : sys.sperreX[Math.round((sys.sperreX.length - 1) * (b / biter))]
        const a1 = b === biter - 1 ? xs1 : sys.sperreX[Math.round((sys.sperreX.length - 1) * ((b + 1) / biter))]
        if (t.tak === 'lekter') {
          stav({ pid: `lekt-${i}-${b}`, part: 'tak', navn: 'Lekt', profil: '48 × 48 mm', lengdeMm: (a1 - a0) * 1000, kapp: true, kategori: 'tak', kvalitet: TRESLAG[t.treslag]?.label, farge: tre, a: [a0, yTak + LEKT / 2, z], b: [a1, yTak + LEKT / 2, z], bredde: LEKT, hoyde: LEKT, explode: [0, 0.6, 0] })
        } else {
          // Lamell 21 × 95 skråstilt 30° fra loddrett, nederste kant på sperra.
          const v = 30 * RAD
          const hy = 0.095 * Math.cos(v) + 0.021 * Math.sin(v)
          stav({ pid: `lamell-${i}-${b}`, part: 'tak', navn: 'Lamell', profil: '21 × 95 mm', lengdeMm: (a1 - a0) * 1000, kapp: true, kategori: 'tak', kvalitet: TRESLAG[t.treslag]?.label, farge: tre, merknad: 'Skråstilles 30° i lamellholder/vinkelbeslag', a: [a0, yTak + hy / 2, z], b: [a1, yTak + hy / 2, z], bredde: 0.021, hoyde: 0.095, opp: [0, Math.cos(v), Math.sin(v)], explode: [0, 0.6, 0] })
        }
      }
    })
  } else if (t.tak === 'tett' && sys.geo) {
    // 16 mm kanalplate i polykarbonat på sperrene, fra fot til topp.
    const g = sys.geo
    const a = t.vinkel * RAD
    const h = sh
    const s0 = g.fuglemunn.seteMm / 1000
    const topp = (x: number) => (x - s0) * Math.tan(a) + h / Math.cos(a)
    const xf = -OH_Z
    const xb = (g.omriss.reduce((m2, p) => Math.max(m2, p[0]), 0)) / 1000
    const off = PLATE_T / 2 / Math.cos(a)
    const pA: V3 = [(xs0 + xs1) / 2, sys.yDragerTopp + topp(xf) + off, zFrontFace - xf]
    const pB: V3 = [(xs0 + xs1) / 2, sys.yDragerTopp + topp(xb) + off, zFrontFace - xb]
    stav({ pid: 'takplate', part: 'tak', navn: 'Takplate polykarbonat 16 mm', profil: 'kanalplate 16 mm', lengdeMm: Math.hypot(pB[1] - pA[1], pB[2] - pA[2]) * 1000, kapp: false, farge: 'poly', a: pA, b: pB, bredde: xs1 - xs0, hoyde: PLATE_T, explode: [0, 0.7, 0] })
  }

  // ── Knebånd 45° (48 × 98) ──
  const hvDiag = KB_B * Math.SQRT2
  const kbArm = clamp(Math.min(0.6, sys.dragerSpenn / 2 - 0.1, (sys.yDragerTopp - dh) * 0.28), 0.35, 0.6)
  let kbAntall = 0
  let kbLengde = 0
  const kneband = (id: string, o: V3, u: V3, yTop: number, ex: V3) => {
    const a = kbArm
    const y0 = yTop - a
    const pts: Array<[number, number]> = [[0, y0], [a, yTop], [a - hvDiag, yTop], [0, y0 + hvDiag]]
    const L = utstrekning(pts, [1, 1])
    kbLengde = L
    kbAntall++
    prisme({ pid: `kneband-${id}`, part: 'kneband', navn: 'Knebånd', profil: P48(98), lengdeMm: L * 1000, kapp: true, kategori: 'konstruksjon', kvalitet: kval, farge: tre, darken: 0.93, endeA: { vinkel: 45, type: 'gjaering' }, endeB: { vinkel: 45, type: 'gjaering' }, merknad: 'Boltes M12 i stolpe og drager/sperre', pts, o, u, v: [0, 1, 0], tykk: KB_T, explode: ex })
  }
  rader.forEach((zr, ri) => {
    const yDB = yRad(zr) - dh
    stolpeX.forEach((x, i) => {
      // I dragerplanet mot nabostolpene.
      for (const dir of [-1, 1]) {
        if ((dir < 0 && i === 0) || (dir > 0 && i === stolpeX.length - 1)) continue
        kneband(`x-${ri}-${i}-${dir}`, [x + dir * (s / 2), 0, zr], [dir, 0, 0], yDB, [dir * 0.25, 0, 0])
      }
      // Vinkelrett på dragerne, opp til sperra over stolpen.
      const dirs: number[] = []
      if (ri < rader.length - 1 || (rader.length === 1 && !t.vegg)) dirs.push(1)
      if (ri > 0 || t.vegg || rader.length === 1) dirs.push(-1)
      const dirsZ = rader.length === 1 && !t.vegg ? [] : [...new Set(dirs)].filter((d) => (ri === rader.length - 1 ? d < 0 : ri === 0 && !t.vegg ? d > 0 : true))
      for (const dir of dirsZ) {
        // Sperrens underkant der knebåndet treffer (flatt: drageroverkant).
        // Toppkuttet ligger mellom arm − h√2 og arm fra stolpen; mot skrå sperre brukes laveste punkt.
        const zA = zr + dir * (s / 2 + kbArm - hvDiag)
        const zB = zr + dir * (s / 2 + kbArm)
        const yS = sys.geo ? Math.min(sperreBunn(zA), sperreBunn(zB)) : yRad(zr)
        kneband(`z-${ri}-${i}-${dir}`, [x, 0, zr + dir * (s / 2)], [0, 0, dir], yS, [0, 0, dir * 0.25])
      }
    })
  })
  function sperreBunn(z: number): number {
    const g = sys.geo!
    const xg = zFrontFace - z
    return sys.yDragerTopp + (xg - g.fuglemunn.seteMm / 1000) * Math.tan(t.vinkel * RAD)
  }

  // ── Sideskjerm ──
  const kbBunn = Math.min(...rader.map((z) => yRad(z))) - dh - kbArm - 0.05
  if (t.skjerm !== 'ingen' && t.sider.length) {
    const y0 = 0.1
    const y1 = Math.max(y0 + 0.5, kbBunn)
    const zFront = rader[rader.length - 1]
    const zBakRad = t.vegg ? null : rader[0]
    const sider: Array<{ navn: string; felt: Array<[V3, V3]>; n: V3 }> = []
    const xL = stolpeX[0]
    const xR = stolpeX[stolpeX.length - 1]
    const langsX = (z: number) => stolpeX.slice(0, -1).map((x, i) => [[x + s / 2, 0, z], [stolpeX[i + 1] - s / 2, 0, z]] as [V3, V3])
    for (const side of t.sider) {
      if (side === 'front') sider.push({ navn: side, felt: langsX(zFront), n: [0, 0, 1] })
      else if (side === 'bak' && zBakRad !== null) sider.push({ navn: side, felt: langsX(zBakRad), n: [0, 0, -1] })
      else if (side === 'venstre' || side === 'høyre') {
        const x = side === 'venstre' ? xL : xR
        const felt: Array<[V3, V3]> = []
        if (t.vegg) {
          // Veggstender på husveggen som festepunkt.
          stav({ pid: `veggstender-${side}`, part: 'skjerm', navn: 'Veggstender', profil: P48(98), lengdeMm: (y1 - PILAR_OVER) * 1000, kapp: true, kategori: 'kledning', kvalitet: kval, farge: tre, a: [x, PILAR_OVER, VEGG_LUFT + 0.049], b: [x, y1, VEGG_LUFT + 0.049], bredde: 0.048, hoyde: 0.098, opp: [0, 0, 1], explode: [side === 'venstre' ? -0.3 : 0.3, 0, 0] })
          felt.push([[x, 0, VEGG_LUFT + 0.098], [x, 0, rader[0] - s / 2]])
        }
        for (let r = 0; r < rader.length - 1; r++) felt.push([[x, 0, rader[r] + s / 2], [x, 0, rader[r + 1] - s / 2]])
        sider.push({ navn: side, felt, n: [side === 'venstre' ? -1 : 1, 0, 0] })
      }
    }
    for (const sd of sider) {
      sd.felt.forEach(([a, b], fi) => {
        const ax = b[0] - a[0]
        const az = b[2] - a[2]
        const L = Math.hypot(ax, az)
        if (L < 0.1) return
        const r: V3 = [ax / L, 0, az / L]
        const n = sd.n
        const p = (u: number, ut: number, y: number): V3 => [a[0] + r[0] * u + n[0] * ut, y, a[2] + r[2] * u + n[2] * ut]
        const ex: V3 = [n[0] * 0.3, 0, n[2] * 0.3]
        const id = `${sd.navn}-${fi}`
        // Mellomstendere 48 × 48 c/c ≤ 1,2 m (vannrette bord). Tett skjerm bæres av rekker, spalér av vannrette lekter.
        const nm = t.skjerm === 'horisontal' ? Math.max(0, Math.ceil(L / 1.2 - 1e-9) - 1) : 0
        for (let j = 1; j <= nm; j++) {
          const u = (L * j) / (nm + 1)
          stav({ pid: `skjermstender-${id}-${j}`, part: 'skjerm', navn: 'Skjermstender', profil: '48 × 48 mm', lengdeMm: (y1 - PILAR_OVER - SKO) * 1000, kapp: true, kategori: 'kledning', kvalitet: kval, farge: tre, darken: 0.93, merknad: 'Står i stolpesko på pilar/heller', a: p(u, 0, PILAR_OVER + SKO), b: p(u, 0, y1), bredde: 0.048, hoyde: 0.048, opp: r, explode: ex })
        }
        if (t.skjerm === 'horisontal') {
          const nb = Math.floor((y1 - y0 + 0.02) / 0.115)
          for (let k = 0; k < nb; k++) {
            const y = y0 + 0.0475 + k * 0.115
            stav({ pid: `skjermbord-${id}-${k}`, part: 'skjerm', navn: 'Skjermbord', profil: '21 × 95 mm', lengdeMm: L * 1000, kapp: true, kategori: 'kledning', kvalitet: TRESLAG[t.treslag]?.label, farge: tre, a: p(0, 0.035, y), b: p(L, 0.035, y), bredde: 0.021, hoyde: 0.095, explode: ex })
          }
        } else if (t.skjerm === 'tett') {
          for (const [k, y] of [[0, y0 + 0.049], [1, y1 - 0.049]] as Array<[number, number]>) {
            stav({ pid: `skjermrekke-${id}-${k}`, part: 'skjerm', navn: 'Skjermrekke', profil: P48(98), lengdeMm: L * 1000, kapp: true, kategori: 'kledning', kvalitet: kval, farge: tre, darken: 0.93, a: p(0, -0.025, y), b: p(L, -0.025, y), bredde: 0.048, hoyde: 0.098, explode: ex })
          }
          const nb = Math.max(1, Math.floor((L + 0.005) / 0.1))
          const w = (L - (nb - 1) * 0.005) / nb
          for (let k = 0; k < nb; k++) {
            const u = k * (w + 0.005) + w / 2
            stav({ pid: `skjermbord-${id}-${k}`, part: 'skjerm', navn: 'Skjermbord', profil: '21 × 95 mm', lengdeMm: (y1 - y0) * 1000, kapp: true, kategori: 'kledning', kvalitet: TRESLAG[t.treslag]?.label, farge: tre, merknad: w < 0.0945 ? `Rippes til ${mm(w)} mm` : undefined, a: p(u, 0.0115, y0), b: p(u, 0.0115, y1), bredde: 0.021, hoyde: w, opp: r, explode: ex })
          }
        } else {
          // Spalér: loddrette og vannrette lekter 28 × 48, rutenett ca. 150 mm.
          const nv = Math.max(1, Math.round(L / 0.15) - 1)
          for (let k = 1; k <= nv; k++) {
            const u = (L * k) / (nv + 1)
            stav({ pid: `spaler-v-${id}-${k}`, part: 'skjerm', navn: 'Spalérlekt', profil: '28 × 48 mm', lengdeMm: (y1 - y0) * 1000, kapp: true, kategori: 'kledning', kvalitet: TRESLAG[t.treslag]?.label, farge: tre, a: p(u, -0.014, y0), b: p(u, -0.014, y1), bredde: 0.028, hoyde: 0.048, opp: r, explode: ex })
          }
          const nh = Math.max(2, Math.round((y1 - y0) / 0.15) + 1)
          for (let k = 0; k < nh; k++) {
            const y = y0 + 0.024 + ((y1 - y0 - 0.048) * k) / (nh - 1)
            stav({ pid: `spaler-h-${id}-${k}`, part: 'skjerm', navn: 'Spalérlekt', profil: '28 × 48 mm', lengdeMm: L * 1000, kapp: true, kategori: 'kledning', kvalitet: TRESLAG[t.treslag]?.label, farge: tre, a: p(0, 0.014, y), b: p(L, 0.014, y), bredde: 0.028, hoyde: 0.048, explode: ex })
          }
        }
      })
    }
  }

  unikeKappnavn(deler)
  const bb0 = boks(deler)
  const forskyv: V3 = [-(bb0.min[0] + bb0.max[0]) / 2, 0, -(bb0.min[2] + bb0.max[2]) / 2]
  flytt(deler, forskyv)
  const bb = boks(deler)
  return { t, sys, deler, forskyv, min: bb.min, max: bb.max, kneband: { lengdeMm: kbLengde * 1000, antall: kbAntall, arm: kbArm }, vegghoyde: sys.yBakTopp + sh + 0.4 }
}

// ── 3D ─────────────────────────────────────────────────────────────

function buildMesh(c: PergolaConfig, opts?: BuildOptions): THREE.Group {
  const m = modell(c)
  const group = byggGruppe(m.deler, { treslag: m.t.treslag, farge: String(c.farge ?? 'ubehandlet'), opts })
  if (m.t.vegg) {
    const w = m.max[0] - m.min[0] + 0.8
    const h = m.vegghoyde
    const ghost = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x9fb0c2, transparent: true, opacity: 0.16, roughness: 0.95, metalness: 0, side: THREE.DoubleSide, depthWrite: false }),
    )
    ghost.position.set((m.min[0] + m.max[0]) / 2, h / 2, m.forskyv[2] - 0.1)
    ghost.renderOrder = -1
    ghost.userData.part = 'husvegg'
    ghost.userData.kontekst = true
    ghost.userData.pid = 'husvegg'
    ghost.userData.info = { navn: 'Husvegg (medfølger ikke)', profil: 'eksisterende vegg', lengdeCm: Math.round(w * 100) }
    ghost.userData.explode = new THREE.Vector3(0, 0, -0.5)
    group.add(ghost)
  }
  return group
}

// ── Materialliste og kappliste ─────────────────────────────────────

function prisForProfil(d: Del): { id: string; reserve: number } {
  const p = d.profil
  if (p === '98 × 98 mm') return { id: 'stolpe-98x98', reserve: 75 }
  if (p === '148 × 148 mm') return { id: 'stolpe-148x148', reserve: 135 }
  if (p === '48 × 98 mm') return { id: 'stolpe-48x98', reserve: 22 }
  if (p === '48 × 48 mm') return { id: 'stolpe-48x48', reserve: 15 }
  if (p === '28 × 48 mm') return { id: 'spile-28x48', reserve: 12 }
  if (p === '21 × 95 mm') return { id: 'bord-21x98', reserve: 15 }
  const mt = p.match(/^48 × (\d+) mm$/)
  if (mt) return { id: `bjelke-48x${mt[1]}`, reserve: 80 }
  return { id: '', reserve: 0 }
}

function beregn(c: PergolaConfig): Bom {
  const m = modell(c)
  const { t, sys, deler } = m
  const faktor = TRESLAG[t.treslag]?.prisFaktor ?? 1
  const linjer: BomLinePlan[] = []
  let sum = 0
  const grupper = new Map<string, { d: Del; lm: number; n: number }>()
  for (const d of deler) {
    if (!d.kapp) continue
    const k = `${grunnNavn(d.navn)}|${d.profil}`
    const g = grupper.get(k) ?? { d, lm: 0, n: 0 }
    g.lm += d.lengdeMm / 1000
    g.n++
    grupper.set(k, g)
  }
  for (const g of [...grupper.values()].sort((a, b) => (POS[grunnNavn(a.d.navn)] ?? 'Z').localeCompare(POS[grunnNavn(b.d.navn)] ?? 'Z'))) {
    const p = prisForProfil(g.d)
    const lm = g.lm * SVINN
    const kr = lm * pris(p.id, p.reserve) * faktor
    sum += kr
    linjer.push({ navn: grunnNavn(g.d.navn), spesifikasjon: g.d.profil, antall: r1(lm), enhet: 'lm', kategori: g.d.kategori, kvalitet: g.d.kvalitet, prisId: p.id || undefined, prisKr: Math.round(kr), kommentar: `${g.n} stk · inkl. 10 % svinn` })
  }
  const hw = (navn: string, spes: string, antall: number, enhet: string, id: string, reserve: number, kategori: BomLinePlan['kategori'], kommentar?: string) => {
    if (antall <= 0) return
    const kr = antall * pris(id, reserve)
    sum += kr
    linjer.push({ navn, spesifikasjon: spes, antall, enhet, kategori, prisId: PRISER[id] ? id : undefined, prisKr: Math.round(kr), kommentar })
  }
  const pilarer = deler.filter((d) => d.navn === 'Betongpilar').length
  const stolper = deler.filter((d) => d.navn === 'Stolpe').length
  const sperrer = deler.filter((d) => grunnNavn(d.navn) === 'Sperre').length
  const kb = m.kneband.antall
  const vol = deler.reduce((v, d) => (d.type === 'sylinder' ? v + betongvekt(sys.fund.valgt, sys.fundDybde) / 24 + Math.PI * d.r * d.r * d.h : v), 0)
  hw('Punktfundament', `${sys.fund.valgt.navn} · ${fmt(sys.fundDybde + PILAR_OVER, 2)} m`, pilarer, 'stk', 'pilarror', 140, 'fundament', `frostfri dybde ${fmt(sys.fundDybde, 1)} m`)
  hw('Tørrbetong B30', '25 kg sekk', Math.ceil(vol / 0.0125), 'stk', 'betong-25kg', 95, 'fundament')
  hw(PRISER['stolpesko']?.navn ?? 'Stolpesko (justerbar)', 'varmforsinket, med strekkapasitet mot oppløft', pilarer + deler.filter((d) => d.navn === 'Skjermstender').length, 'stk', 'stolpesko', 149, 'beslag')
  hw('Stolpetoppbeslag / vinkelbeslag', 'drager–stolpe, 2 per stolpe', stolper * 2, 'stk', 'vinkelbeslag', 19, 'beslag')
  hw('Sperrebeslag', 'sperre–drager/veggbjelke', sperrer * (sys.rader.length + (t.vegg ? 1 : 0)), 'stk', 'vinkelbeslag', 19, 'beslag', 'mot vindoppløft')
  hw('Bolt M12 m/ mutter og skiver', 'varmforsinket', kb * 2 + (t.vegg ? Math.ceil((m.max[0] - m.min[0]) / 0.6) + 1 : 0), 'stk', 'bolt-m12', 25, 'festemidler', t.vegg ? 'knebånd + veggbjelke' : 'knebånd')
  if (t.tak === 'tett') {
    const plate = deler.find((d) => d.navn.startsWith('Takplate'))
    const areal = plate && plate.type === 'stav' ? (plate.lengdeMm / 1000) * plate.bredde : 0
    hw('Kanalplate polykarbonat 16 mm', 'UV-beskyttet, m/ alu-profiler og endelister', r1(areal * 1.05), 'm²', 'taktekke-polykarbonat', 320, 'tak')
  }
  const lekter = deler.filter((d) => d.part === 'tak' && d.kapp).length
  const skjerm = deler.filter((d) => d.part === 'skjerm').length
  hw('Konstruksjonsskruer', 'A4 / varmforsinket', Math.ceil((lekter * 2 * Math.max(2, sys.sperreX.length) + skjerm * 4 + sperrer * 4) / 50) * 50, 'stk', 'skrue', 1.5, 'festemidler')
  const estimatKr = Math.round(sum / 10) * 10
  const areal = (m.max[0] - m.min[0]) * (m.max[2] - m.min[2])
  const arbeidstimer = Math.round(pilarer * 1.2 + stolper * 0.5 + sperrer * 0.4 + kb * 0.3 + lekter * 0.15 + skjerm * 0.1 + (t.tak === 'tett' ? areal * 0.6 : 0) + 4)
  const sammendrag = `${t.vegg ? 'Veggmontert' : 'Frittstående'} pergola ${Math.round(t.W * 100)} × ${Math.round(t.D * 100)} cm · fri høyde ${Math.round(t.H * 100)} cm · ${t.tak === 'tett' ? `tett tak ${fmtGrader(t.vinkel)}` : t.tak === 'åpen' ? 'åpne sperrer' : t.tak} · stolper ${sys.stolpeTv.profil}, drager ${sys.drager.valgt.profil}, sperrer ${sys.sperre.valgt.profil} · ${TRESLAG[t.treslag]?.label ?? t.treslag}`
  return { linjer, estimatKr, sammendrag, arealM2: Math.round(t.W * t.D * 10) / 10, maal: `${Math.round(t.W * 100)} × ${Math.round(t.D * 100)} cm`, arbeidstimer }
}

function kappliste(c: PergolaConfig): KapplisteDelPlan[] {
  const m = modell(c)
  return kapplisteFra(m.deler, (d) => POS[grunnNavn(d.navn)]).sort((a, b) => (a.pos ?? 'Z').localeCompare(b.pos ?? 'Z') || b.lengdeCm - a.lengdeCm)
}

// ── Byggesak og statikk ────────────────────────────────────────────

function byggesak(c: PergolaConfig): ByggesakResultat {
  const m = modell(c)
  const { t } = m
  // BYA: takutstikk ≤ 1,0 m teller ikke (H-2300 / NS 3940) – arealet innenfor stolper/vegg.
  const bya = t.W * t.D
  const topp = m.max[1]
  if (t.tak === 'tett') {
    return vurderByggesak({ tiltak: t.vegg ? 'tilbygg' : 'frittliggende', byaM2: bya, moneHoydeM: topp, gesimsHoydeM: m.sys.yDragerTopp + m.sys.sperre.valgt.h / 1000 })
  }
  return vurderByggesak({ tiltak: 'pergola', byaM2: t.W * t.D, moneHoydeM: topp, gesimsHoydeM: topp })
}

function byggeregler(c: PergolaConfig): Byggeregler {
  return tilByggeregler(byggesak(c))
}

/** Knebånd: trykk/strekk fra horisontal vindlast på taket. */
function knebandKontroll(m: Modell): Medlemskontroll | null {
  const { t, sys } = m
  if (!m.kneband.antall || sys.qp <= 0) return null
  // Vind mot langsiden: flate = (drager + sperre + tak) × bredde + ev. skjerm.
  const takH = sys.drager.valgt.h / 1000 + sys.sperre.valgt.h / 1000 + (t.tak === 'lekter' ? LEKT : t.tak === 'spjeld' ? 0.09 : t.tak === 'tett' ? (sys.yBakTopp - sys.yDragerTopp) : 0)
  const skjermH = t.skjerm === 'tett' || t.skjerm === 'horisontal' ? 1.5 : 0
  const flate = (takH + skjermH * 0.5) * (m.max[0] - m.min[0])
  const F = vindHorisontal(sys.qp, flate) // kN, bruddgrense
  // Kreftene tas av knebåndene vinkelrett på dragerne (én retning virker i trykk).
  const nKb = Math.max(1, sys.stolpeX.length * Math.max(1, sys.rader.length))
  const NEd = F / nKb / Math.cos(45 * RAD)
  const Nk = NEd / 1.5
  const k = kontrollerSoyle(tverrsnitt(48, 98, 1, 'C24', 'stolpe-48x98'), { lengdeM: m.kneband.lengdeMm / 1000, NGk: 0, NQk: [{ type: 'vind', Nk, navn: 'Vind via knebånd' }], tjenesteklasse: 3 })
  k.navn = 'Knebånd'
  k.forutsetninger = [...k.forutsetninger, `Horisontal vindkraft ${fmt(F, 2)} kN (qp = ${fmt(sys.qp, 2)} kN/m², cf = 1,3) fordelt på ${nKb} knebånd i 45°.`]
  return k
}

function beregningsgrunnlag(c: PergolaConfig): Beregningsgrunnlag {
  const m = modell(c)
  const { t, sys } = m
  const sk = snolastForConfig(c)
  const deler: Record<string, Dimensjonering | Medlemskontroll> = { Sperre: sys.sperre, Drager: sys.drager, Stolpe: sys.stolpeDim }
  const kb = knebandKontroll(m)
  if (kb) deler['Knebånd'] = kb
  const rapport = lagBeregningsrapport({
    produkt: 'pergola',
    tittel: `${t.vegg ? 'Veggmontert' : 'Frittstående'} pergola ${fmt(t.W, 1)} × ${fmt(t.D, 1)} m`,
    forutsetninger: [
      { navn: 'Tak', verdi: t.tak === 'tett' ? `Tett tak, 16 mm polykarbonat, ${fmtGrader(t.vinkel)}` : t.tak === 'åpen' ? 'Åpne sperrer' : t.tak === 'lekter' ? `Lekter 48 × 48 c/c ${mm(t.lektCC)}` : `Lameller 21 × 95 c/c ${mm(t.lektCC)}` },
      { navn: 'Snø', verdi: t.tak === 'tett' ? 'Full snølast på taket' : 'Full snølast (konservativt – snø/is kan bygge seg opp på lekter og sperrer)' },
      { navn: 'Tjenesteklasse', verdi: t.tak === 'tett' ? '2 (overdekket)' : '3 (værutsatt)', kilde: 'NS-EN 1995-1-1' },
      { navn: 'Vind', verdi: `vb,0 = ${VB0_STANDARD} m/s, terrengkategori II`, kilde: 'NS-EN 1991-1-4 NA (standardverdi)', usikker: true },
      { navn: 'Grunn', verdi: GRUNN[t.grunn].navn, kilde: t.grunn === 'ukjent' ? 'Ikke oppgitt – konservativ antakelse (Byggested)' : 'Valgt i Byggested – kontroller på tomta', usikker: true },
      { navn: 'Frostsone', verdi: FROSTSONER[t.sone].navn, kilde: frostsoneForConfig(c).merknad, usikker: true },
    ],
    snolast: { mark: sk, tak: snolastTak(sk.sk, t.vinkel) },
    deler,
    pos: { Stolpe: 'A', Drager: 'B', Sperre: 'D', Knebånd: 'E' },
    frost: sys.frost,
    fundament: sys.fund,
    byggesak: byggesak(c),
    merknader: [
      `Sperrer c/c ${mm(sys.sperreCC)} mm, spenn ${fmt(sys.sperreSpenn, 2)} m. Dragere: stolpeavstand ${fmt(sys.dragerSpenn, 2)} m, lastbredde ${fmt(sys.lastbredde, 2)} m.`,
      `Netto vindoppløft ca. ${fmt(sys.oppdriftPerStolpe, 1)} kN per stolpe (bruddgrense).`,
      ...forankringsraad({ aapentTak: t.tak !== 'tett', oppdriftPerStolpeKN: sys.oppdriftPerStolpe }),
      ...(sys.geo?.merknader ?? []),
      ...sys.meldinger,
    ],
  })
  return tilPlanVedlegg(rapport)
}

// ── Tegninger ──────────────────────────────────────────────────────

const cm1 = (v: number) => Math.round(v * 1000) / 10

function tegninger(c: PergolaConfig): Tegning2D {
  const m = modell(c)
  const { t, sys } = m
  const ref = { minX: m.min[0], minZ: m.min[2], maxZ: m.max[2], topY: m.max[1] }
  const W = cm1(m.max[0] - m.min[0])
  const D = cm1(m.max[2] - m.min[2])
  const Htop = cm1(m.max[1])
  const poly = (pts: Array<[number, number]>, ekstra: Partial<Form2DPlan> = {}): Form2DPlan => ({ type: 'poly', points: [...pts, pts[0]], ...ekstra })
  const lok = (x: number, z: number): [number, number] => [cm1(x + m.forskyv[0] - ref.minX), cm1(z + m.forskyv[2] - ref.minZ)]

  const plan: Form2DPlan[] = []
  for (const d of m.deler) {
    if (d.part === 'tak' || d.part === 'skjerm') continue
    plan.push(poly(projiser(d, 'plan', ref), { tynn: d.part !== 'stolpe', dashed: d.part === 'kneband' }))
  }
  const [ax0] = lok(sys.stolpeX[0] - sys.s / 2, 0)
  const [ax1] = lok(sys.stolpeX[sys.stolpeX.length - 1] + sys.s / 2, 0)
  const zRad = sys.rader.map((z) => lok(0, z)[1])
  const planMaal: Riss2DPlan['maal'] = [
    { x1: ax0, y1: D, x2: ax1, y2: D, label: `${Math.round(t.W * 100)}`, offset: 26 },
    { x1: 0, y1: 0, x2: W, y2: 0, label: `${Math.round(W)}`, offset: 26 },
  ]
  if (sys.stolpeX.length > 1) {
    const [a] = lok(sys.stolpeX[0], 0)
    const [b] = lok(sys.stolpeX[1], 0)
    planMaal.push({ x1: a, y1: D, x2: b, y2: D, label: `c/c ${Math.round((b - a) * 10)}`, offset: 14 })
  }
  if (zRad.length > 1) planMaal.push({ x1: W, y1: zRad[0], x2: W, y2: zRad[zRad.length - 1], label: `${Math.round((zRad[zRad.length - 1] - zRad[0]) * 10)}`, offset: 22 })
  const planRiss: Riss2DPlan = { id: 'plan', navn: 'Plan – stolper, dragere og sperrer', bredde: W, hoyde: D, former: plan, maal: planMaal, tekster: [{ x: W / 2, y: D / 2, tekst: `Sperrer ${sys.sperre.valgt.boardProfil.replace(' mm', '')} c/c ${mm(sys.sperreCC)}` }], type: 'plan' }

  const fasade = (v: 'front' | 'hoyre', id: string, navn: string): Riss2DPlan => {
    const former = m.deler.filter((d) => d.part !== 'skjerm' || v === 'front').map((d) => poly(projiser(d, v, ref), { tynn: d.part === 'tak' || d.part === 'skjerm' }))
    const bredde = v === 'front' ? W : D
    const yUK = cm1(m.max[1] - (sys.yDragerTopp - sys.drager.valgt.h / 1000))
    return {
      id,
      navn,
      bredde,
      hoyde: Htop,
      former,
      maal: [
        { x1: 0, y1: Htop, x2: bredde, y2: Htop, label: `${Math.round(bredde)}`, offset: 26 },
        { x1: 0, y1: yUK, x2: 0, y2: Htop, label: `${Math.round(t.H * 100)}`, offset: 24 },
        { x1: bredde, y1: 0, x2: bredde, y2: Htop, label: `${Math.round(Htop)}`, offset: 22 },
      ],
      tekster: v === 'hoyre' && t.tak === 'tett' ? [{ x: bredde / 2, y: -8, tekst: `Takfall ${fmtGrader(t.vinkel)}` }] : undefined,
      type: 'fasade',
    }
  }
  return { riss: [planRiss, fasade('front', 'fasade-forfra', 'Fasade forfra'), fasade('hoyre', 'fasade-siden', 'Fasade fra høyre')] }
}

// ── Montering ──────────────────────────────────────────────────────

function monteringPlan(c: PergolaConfig): MonteringSteg[] {
  const m = modell(c)
  const { t, sys } = m
  const steg: MonteringSteg[] = []
  const pilarer = m.deler.filter((d) => d.navn === 'Betongpilar').length
  const diag = Math.hypot(sys.stolpeX[sys.stolpeX.length - 1] - sys.stolpeX[0], (sys.rader[sys.rader.length - 1] - sys.rader[0]) || 0)
  const stolpeCC = sys.stolpeX.length > 1 ? mm(sys.stolpeX[1] - sys.stolpeX[0]) : 0
  const stolpeLengder = [...new Set(m.deler.filter((d) => d.navn === 'Stolpe').map((d) => rundOppKapp(d.lengdeMm)))].sort((a, b) => b - a)
  steg.push({ tittel: 'Sett ut stolpene', trinn: 'fundament', tekst: `Merk opp ${pilarer} stolpepunkter: c/c ${stolpeCC} mm langs bredden${sys.rader.length > 1 ? `, rader c/c ${mm(sys.rader[1] - sys.rader[0])} mm i dybden` : t.vegg ? `, stolperaden ${mm(sys.rader[0])} mm fra husveggen (senter)` : ''}.${sys.rader.length > 1 ? ` Kontroller diagonalen mellom ytterstolpene: ${mm(diag)} mm.` : ''}` })
  steg.push({ tittel: 'Fundamenter', trinn: 'fundament', tekst: `Grav til ${fmt(sys.fundDybde, 1)} m (frostfritt), sett ${sys.fund.valgt.navn.toLowerCase()} og støp. Støp inn stolpeskoene i snor og høyde, pilartopp ${mm(PILAR_OVER)} mm over terreng.`, advarsel: `Vindoppløft ca. ${fmt(sys.oppdriftPerStolpe, 1)} kN per stolpe – stolpeskoen må være støpt inn/forankret, ikke bare lagt på.` })
  if (t.vegg) steg.push({ tittel: 'Veggbjelke', trinn: 'reisverk', tekst: `Bolt veggbjelken ${P48(Math.max(198, sys.sperre.valgt.h))} vannrett til husveggen med overkant ${mm(sys.yBakTopp)} mm over terreng, bolter c/c 600 inn i stender/mur. Legg beslag/vannbrett over og 10 mm avstand bak for lufting.` })
  steg.push({ tittel: 'Stolper', trinn: 'reisverk', tekst: `Kapp stolpene ${sys.stolpeTv.profil} til ${stolpeLengder.join(' / ')} mm, sett dem i skoene, lodd i begge retninger og stiv av midlertidig.` })
  steg.push({ tittel: 'Dragere', trinn: 'reisverk', tekst: `Kapp dragerne ${sys.drager.valgt.profil} med ${PYNT}° pyntekapp i endene og ${mm(OH_X)} mm utstikk utenfor stolpene. Legg dem oppå stolpene${sys.drager.valgt.antall > 1 ? ', skru lagene sammen' : ''} og fest med 2 vinkelbeslag per stolpe.` })
  steg.push({ tittel: 'Sperrer', trinn: 'tak', tekst: t.tak === 'tett' && sys.geo ? `Kapp sperrene ${sys.sperre.valgt.boardProfil} til ${rundOppKapp(sys.geo.lengdeMm)} mm med loddkutt ${fmtGrader(sys.geo.loddkutt.gjaeringGrader)} i begge ender og fuglemunn (sete ${Math.round(sys.geo.fuglemunn.seteMm)} mm) over dragerne. Legg dem c/c ${mm(sys.sperreCC)} mm – alltid én over hver stolpe – og fest med sperrebeslag.` : `Kapp sperrene ${sys.sperre.valgt.boardProfil} med ${PYNT}° pyntekapp, legg dem c/c ${mm(sys.sperreCC)} mm oppå dragerne${t.vegg ? ' og veggbjelken' : ''} med ${mm(OH_Z)} mm utstikk – alltid én sperre over hver stolpe – og fest med sperrebeslag.` })
  steg.push({ tittel: 'Knebånd', trinn: 'reisverk', tekst: `Kapp ${m.kneband.antall} knebånd 48 × 98 til ${rundOppKapp(m.kneband.lengdeMm)} mm med 45,0° i begge ender (armlengde ${mm(m.kneband.arm)} mm). Monter dem fra stolpen opp til drageren og opp til sperra over stolpen, og bolt med M12 i begge ender.`, advarsel: 'Knebåndene er avstivningen mot vind – monter alle før taket legges.' })
  if (t.tak === 'lekter') steg.push({ tittel: 'Lekter', trinn: 'tak', tekst: `Legg lekter 48 × 48 på tvers av sperrene c/c ${mm(t.lektCC)} mm, skjøt midt på sperre. To skruer i hvert kryss.` })
  if (t.tak === 'spjeld') steg.push({ tittel: 'Lameller', trinn: 'tak', tekst: `Monter lameller 21 × 95 c/c ${mm(t.lektCC)} mm, skråstilt 30° i lamellholdere på sperrene. Vend dem mot sør/vest for skygge midt på dagen.` })
  if (t.tak === 'tett') steg.push({ tittel: 'Takplater', trinn: 'tak', tekst: `Monter 16 mm kanalplater med kanalene i fallretningen (${fmtGrader(t.vinkel)}), UV-siden opp, i alu-profiler over sperrene. Tett endene med ventilerende endeteip og endeprofil. Sett opp takrenne i lavkant.` })
  if (t.skjerm !== 'ingen' && t.sider.length) steg.push({ tittel: 'Sideskjerm', trinn: 'kledning', tekst: `Monter ${t.skjerm === 'spalér' ? 'spalér av lekter 28 × 48' : t.skjerm === 'horisontal' ? 'vannrette bord 21 × 95 med 20 mm luft' : 'tette loddrette bord 21 × 95 på rekker'} mellom stolpene på valgte sider, fra 100 mm over terreng opp til under knebåndene. Mellomstendere c/c ≤ 1,2 m.` })
  steg.push({ tittel: 'Kontroll', trinn: 'ferdig', tekst: 'Ettertrekk bolter, kontroller lodd og vater og at alle sperrer er festet med beslag. Behandle virket når det er tørt.' })
  return steg
}

// ── Template ───────────────────────────────────────────────────────

export const pergola: ProductTemplate<PergolaConfig> & {
  beregningsgrunnlag: (c: PergolaConfig) => Beregningsgrunnlag
  monteringPlan: (c: PergolaConfig) => MonteringSteg[]
} = {
  id: 'pergola',
  navn: 'Pergola',
  ikon: 'faBorderNone',
  beskrivelse: 'Tegn pergolaen i 3D – frittstående eller mot husveggen, med lekter, lameller eller tett tak. Stolper, dragere og sperrer dimensjoneres for snø og vind, med knebånd og forankring.',
  seoBeskrivelse: 'Tegn pergolaen i 3D – frittstående eller mot husvegg, med lekter eller lameller. Få materialliste, prisestimat og byggeplan for snø og vind.',
  bilde: '/images/products/pergola-3d.webp',
  tilgjengelig: true,
  fraPris: 249,
  // Pergola er ikke et lite prosjekt – kun byggeplan, ingen bygging.
  leveranser: ['plan'],
  defaultConfig: {
    montering: 'frittstående',
    bredde: 360,
    dybde: 300,
    hoyde: 240,
    stolpeDim: 'auto',
    bjelkeDim: 'auto',
    taktype: 'lekter',
    lektAvstand: 30,
    takvinkel: 7,
    skjermtype: 'ingen',
    skjermSider: 'bak+sider',
    treslag: 'impregnert',
    farge: 'ubehandlet',
  },
  presets: [
    { id: 'klassisk', navn: 'Klassisk pergola', beskrivelse: 'Frittstående 3 × 3 m med lekter', config: { montering: 'frittstående', bredde: 300, dybde: 300, hoyde: 240, taktype: 'lekter', lektAvstand: 30, skjermtype: 'ingen' } },
    { id: 'solskjerm-vegg', navn: 'Solskjerm mot veggen', beskrivelse: 'Veggmontert med tette lekter', config: { montering: 'veggmontert', bredde: 450, dybde: 300, hoyde: 250, taktype: 'lekter', lektAvstand: 15, skjermtype: 'ingen' } },
    { id: 'lukket-tak', navn: 'Overbygd uteplass', beskrivelse: 'Tett tak i polykarbonat mot veggen', config: { montering: 'veggmontert', bredde: 400, dybde: 300, hoyde: 240, taktype: 'tett', takvinkel: 7, skjermtype: 'ingen' } },
    { id: 'lameller', navn: 'Lamelltak med le', beskrivelse: 'Skråstilte lameller og spalér', config: { montering: 'frittstående', bredde: 360, dybde: 300, hoyde: 240, taktype: 'spjeld', lektAvstand: 15, skjermtype: 'spalér', skjermSider: 'bak' } },
    { id: 'stor', navn: 'Stor uteplass-pergola', beskrivelse: '6 × 4 m – plass til langbord', config: { montering: 'frittstående', bredde: 600, dybde: 400, hoyde: 250, taktype: 'lekter', lektAvstand: 30, skjermtype: 'ingen' } },
  ],
  dimensjoner: [
    { key: 'bredde', label: 'Bredde', min: 150, max: 1000, step: 10, axis: 'x' },
    { key: 'dybde', label: 'Dybde', min: 150, max: 800, step: 10, axis: 'z' },
    { key: 'hoyde', label: 'Fri høyde', min: 200, max: 320, step: 5, axis: 'y', markers: [220, 240, 260] },
    { key: 'lektAvstand', label: 'Lekter c/c', min: 10, max: 60, step: 5, unit: 'cm', axis: 'z', handle: false, visibleWhen: (c) => c.taktype === 'lekter' || c.taktype === 'spjeld' },
    { key: 'takvinkel', label: 'Takfall', min: 5, max: 15, step: 1, unit: '°', axis: 'y', handle: false, visibleWhen: (c) => c.taktype === 'tett', markers: [7, 10] },
  ],
  materialer: [
    { key: 'treslag', label: 'Treslag', choices: treslagValg(['impregnert', 'royal', 'lerk', 'kebony']) },
    { key: 'farge', label: 'Farge / beis', asSwatches: true, choices: fargeValg(['ubehandlet', 'klar', 'hvit', 'lysgra', 'morkegra', 'sort', 'brun', 'gronn']) },
  ],
  alternativer: [
    {
      key: 'montering',
      label: 'Montering',
      choices: [
        { id: 'frittstående', label: 'Frittstående', note: 'Stolper i alle hjørner.' },
        { id: 'veggmontert', label: 'Mot husveggen', note: 'Veggbjelke bak, stolper foran.' },
      ],
    },
    {
      key: 'taktype',
      label: 'Tak / solskjerm',
      choices: [
        { id: 'åpen', label: 'Åpen', note: 'Kun sperrer.' },
        { id: 'lekter', label: 'Lekter', note: 'Solskjerm av 48 × 48.' },
        { id: 'spjeld', label: 'Lameller', note: 'Skråstilte 21 × 95.' },
        { id: 'tett', label: 'Tett tak', note: '16 mm polykarbonat med fall.' },
      ],
    },
    {
      key: 'stolpeDim',
      label: 'Stolper',
      choices: [
        { id: 'auto', label: 'Beregnet' },
        { id: '98x98', label: '98 × 98' },
        { id: '148x148', label: '148 × 148', note: 'Kraftigere uttrykk.' },
      ],
    },
    {
      key: 'bjelkeDim',
      label: 'Sperrer',
      choices: [
        { id: 'auto', label: 'Beregnet' },
        { id: '48x148', label: '48 × 148' },
        { id: '48x198', label: '48 × 198' },
        { id: '48x223', label: '48 × 223' },
      ],
    },
    {
      key: 'skjermtype',
      label: 'Sideskjerm',
      choices: [
        { id: 'ingen', label: 'Ingen' },
        { id: 'spalér', label: 'Spalér', note: 'Rutenett for klatreplanter.' },
        { id: 'horisontal', label: 'Vannrett', note: 'Bord med luft.' },
        { id: 'tett', label: 'Tett', note: 'Le for vind og innsyn.' },
      ],
    },
    {
      key: 'skjermSider',
      label: 'Skjerm på',
      visibleWhen: (c) => c.skjermtype !== 'ingen',
      choices: [
        { id: 'bak', label: 'Bak' },
        { id: 'bak+sider', label: 'Bak + sider' },
        { id: 'alle', label: 'Alle sider' },
      ],
    },
  ],
  parts: [
    { key: 'stolpe', label: 'Stolper' },
    { key: 'drager', label: 'Dragere' },
    { key: 'spaer', label: 'Sperrer' },
    { key: 'kneband', label: 'Knebånd' },
    { key: 'tak', label: 'Tak / solskjerm' },
    { key: 'skjerm', label: 'Sideskjerm' },
    { key: 'fundament', label: 'Fundamenter' },
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
      'Stolpene skal stå i støpte stolpesko på frostfrie fundamenter – aldri med endeved i jord eller betong.',
      'Fest hver sperre til drageren med sperrebeslag: et åpent tak får stort oppløft i vind.',
      'Knebåndene gjør pergolaen stiv. Bolt dem – skruer alene løsner over tid.',
      'Bruk varmforsinkede beslag/bolter og rustfrie skruer utendørs, og forbor nær endene.',
    ]
    if (m.t.vegg) r.push('Veggbjelken boltes inn i bærende stender/mur. Legg beslag over så vann ikke renner inn bak kledningen.')
    if (m.t.tak === 'tett') r.push('Kanalplater: kanalene i fallretningen, ventilerende teip i nedre ende og tett teip øverst. Ikke gå på platene.')
    if (m.t.tak === 'lekter') r.push('Tettere lekter (10–15 cm) gir mer skygge; 30 cm gir lett, luftig skygge.')
    r.push(...m.sys.meldinger)
    return r
  },
  buildMesh,
  bounds: (c) => {
    const m = modell(c)
    return { x: m.max[0] - m.min[0], y: m.max[1], z: m.max[2] - m.min[2] }
  },
}

/** QA/test: den beregnede modellen. */
export const pergolaModell = (c: PergolaConfig) => modell(c)
