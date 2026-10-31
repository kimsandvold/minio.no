/**
 * Småhus-modellen – felles, REN modell for vedskjul, utedo og søppelbod.
 *
 * ÉN funksjon (`lagModell`) regner ut hvert eneste trestykke i bygget med
 * eksakt geometri (mm). Fra denne lista lages:
 *  - 3D-modellen (`mesh.ts`)            – samme punkter
 *  - materialliste og kappliste (`plan.ts`) – samme lengder og kappvinkler
 *  - 2D-tegninger og beregningsvedlegg  – samme dimensjoner
 * Derfor kan 3D, kappliste og tegninger ikke drifte fra hverandre.
 *
 * Konstruksjon (SINTEF Byggforsk / NS-EN 1995-1-1):
 *  - Punktfundament (pilarrør til frostfri dybde) → bjelkelag i flukt
 *    (kantbjelker + gulvbjelker i bjelkesko, ev. midtdrager) → gulvbord.
 *  - Stenderverk 48×98 C24: bunnsvill, stendere c/c ≤ 600 under hver sperre,
 *    doble hjørnestendere (L), dobbel toppsvill (overlapp i hjørnene på valm),
 *    losholter c/c 600 (spikerslag for stående kledning).
 *  - Hver åpning: overligger (2 × 48 × h, dimensjonert) på bærestender i hver
 *    side + karmstender, kortstendere over, brystning under hevede åpninger.
 *  - Tak: sperrer med fuglemunn (≤ h/3) på dobbel toppsvill. Pulttak: fuglemunn
 *    på begge vegger, øvre vegg hevet nøyaktig `ovreSvillHoydeMm`. Saltak:
 *    sperrepar mot mønebord + sperrebind (bindbjelke) på toppsvillnivå.
 *    Valmtak: gratsperrer (senket, kinnkuttet), skiftesperrer med kinnkutt,
 *    valmsperrer og mønebord/toppkloss. Gavlutstikk med gavlstige.
 *  - Sutak 18 mm kryssfiner (+ takpapp), vannbord/vindski, lufting med
 *    insektnett i sperrefeltene.
 */
import { kinnkutt, loddkutt, rundOppKapp, fmtGrader, sperreGeometri, valmGeometri, type SperreGeometri, type ValmGeometri } from '../../geometri'
import {
  DOBLE_C24,
  dimensjonerDrager,
  dimensjonerGulvbjelke,
  dimensjonerSperre,
  dimensjonerStender,
  gulvlaster,
  taklaster,
  tverrsnitt,
  type Dimensjonering,
  type Flatelast,
  type Linjelast,
} from '../../dimensjonering'
import { snolastTak, vindlast, vindOppdrift, type Nyttelastkategori, type SnolastTak, type Taktekke, type Vindlast } from '../../laster'
import { frostForConfig, grunnForConfig, snolastForConfig } from '../../byggested'
import { FUNDAMENTER, dimensjonerPunktfundament, type Frostresultat, type Fundamentresultat } from '../../fundament'
import type { SnolastPaMark } from '../../snolast-data'
import type { DesignConfig } from '../../types'
import type { KappEnde, Materialkategori } from '../../plan-typer'
import {
  add,
  boks,
  dot,

  konvekstSkall,
  mul,
  norm,
  overkant,
  prisme,
  punkter,
  snittLinje,
  trimAlle,
  trimTilPlan,
  utstrekning,
  type Geo,
  type P2,
  type Plan,
  type Prisme,
  type V3,
} from './geo'

// ── Inndata ────────────────────────────────────────────────────────

export type Veggside = 'front' | 'bak' | 'venstre' | 'hoyre'
export type Taktype = 'pulttak' | 'saltak' | 'valmtak'

export interface ApningInn {
  side: Veggside
  navn: string
  /** Senter langs veggen i verdenskoordinat (x for front/bak, z for sidene), mm. */
  senter?: number
  /** Ønsket råbredde (mellom bærestenderne), mm. */
  bredde?: number
  /** Hele veggens bredde (mellom hjørnestenderne). */
  full?: boolean
  /** Åpning midt i fag nr. i av n like fag langs veggen (vedskjul-dører). */
  fag?: { i: number; n: number }
  /** Underkant over dekket, mm (0 = fra gulvet). */
  bunn: number
  /** Ønsket overkant (= underkant overligger) over dekket, mm. Stor verdi = høyest mulig. */
  topp: number
  /** Bunnsvillen går gjennom åpningen (terskel). */
  terskel: boolean
  blad: 'dor' | 'luke' | null
  hengsel?: 'venstre' | 'hoyre' | 'topp'
  /** Del åpningen med mellomstolper hvis overliggeren ikke holder. */
  splitt?: boolean
  /** Dørbladets bord med spalte (vedskjul). */
  bladSpalte?: number
}

export interface SmahusInput {
  produkt: string
  B: number
  D: number
  H: number
  taktype: Taktype
  vinkel: number
  /** Takutstikk målt fra utside kledning, mm. */
  utstikk: number
  retning: string
  moneretning: string
  takpapp: boolean
  gulvbord: string
  kledning: string
  /** Luft mellom kledningsbord (spalte/spile), mm. */
  spalte: number
  dekkeSprekk: number
  /** Synlig høyde av fundamentet over terreng, mm. */
  fundSynlig: number
  bruk: Nyttelastkategori
  lagerKN?: number
  apninger: ApningInn[]
  /** Skillevegger (x-koordinat), går fra bakvegg til frontvegg. */
  skillevegger?: number[]
  utstyr?: { benk?: boolean; dunker?: boolean; ved?: boolean }
  config: DesignConfig
  lufting: boolean
}

// ── Utdata ─────────────────────────────────────────────────────────

export interface Del {
  pid: string
  navn: string
  profil: string
  mat: string
  part: string
  kategori: Materialkategori
  geo: Geo
  /** Skal i kapplista (trelast med A × B-profil). */
  tre: boolean
  akse: V3
  lengdeMm: number
  kappMm: number
  lengdeCm: number
  endeA?: KappEnde
  endeB?: KappEnde
  merknad?: string
  farge?: number
  darken?: number
  opasitet?: number
  m2?: number
  stk?: boolean
  kvalitet?: string
  /** Monteringsgruppe (fundament, bjelkelag, dekke, vegg, tak, kledning, dor, utstyr). */
  gruppe: string
}

export interface ApningR {
  navn: string
  vegg: string
  side?: Veggside
  x0: number
  x1: number
  nB: number
  hh: number
  dim: Dimensjonering
  spennMm: number
  bunnAbs: number
  toppAbs: number
  terskel: boolean
  blad: 'dor' | 'luke' | null
  hengsel: 'venstre' | 'hoyre' | 'topp'
  bladSpalte?: number
  karmV: boolean
  karmH: boolean
}

export interface Vegg {
  id: string
  navn: string
  side?: Veggside
  ytter: boolean
  /** Tak-ramme-koordinater (u, v) for s = 0, t = 0 (utside). */
  start: [number, number]
  dir: [number, number]
  nrm: [number, number]
  len: number
  toppAbs: (s: number) => number
  brudd: number[]
  flat: boolean
  dobbel: boolean
  lap?: 'inn' | 'ut'
  lastbreddeM: number
  foretrukne: number[]
  tvungne: number[]
  apninger: ApningR[]
  /** Vegg-type i taket: takfot (A/C), gavl eller valmende. */
  rolle: 'takfotA' | 'takfotC' | 'gavl' | 'valmende' | 'skille'
}

export interface Statikk {
  sk: SnolastPaMark
  snoTak: SnolastTak
  tekke: Taktekke
  taklast: Flatelast[]
  gulvbjelke: Dimensjonering
  kantbjelke: Dimensjonering
  sidekant: Dimensjonering
  midtdrager?: Dimensjonering
  sperre: Dimensjonering
  grat?: Dimensjonering
  mDrager?: Dimensjonering
  overliggere: Array<{ navn: string; dim: Dimensjonering; spennMm: number }>
  stender: Dimensjonering
  frost: Frostresultat
  fundament: Fundamentresultat
  vind: Vindlast
  merknader: string[]
}

export interface Modell {
  inn: SmahusInput
  deler: Del[]
  vegger: Vegg[]
  apninger: ApningR[]
  statikk: Statikk
  sg: SperreGeometri
  valm?: ValmGeometri
  /** Nivåer (mm over terreng). */
  niva: { fund: number; bjelke: number; dekke: number; svill: number; plate: number; plateHoy: number; mone: number; topp: number; kledBunn: number }
  ramme: { L: number; M: number; O: [number, number]; uAx: [number, number]; vAx: [number, number] }
  kt: number
  ohU: number
  gOh: number
  sperreV: number[]
  gulv: { cc: number; hJ: number; hK: number; padX: number[]; padZ: number[]; midt: boolean; bjelkeX: number[]; dia: number; dybde: number }
  vinkel: number
  /** Gratvinkel (valm). */
  beta?: number
  /** Mønehøyde og gesimshøyde over terreng (m) – til byggesak. */
  moneHoydeM: number
  gesimsHoydeM: number
  byaM2: number
  takArealM2: number
  advarsler: string[]
  hv: number
  hvv: number
  hb: number
  hg?: number
  tg?: number
  /** Senter for åpning i bakvegg etc. – til tegninger. */
  dorer: number
}

const T = 48
const SB = 98
const RAD = Math.PI / 180
const STD = [98, 148, 198, 223]
const bordMat = (h: number) => `bord-19x${h}`
const KV = '48 × 98 mm'
const KVMAT = 'bjelke-48x98'
const sq2 = Math.SQRT2

export function kledSpec(id: string, spalte: number) {
  if (id === '19x148')
    return {
      type: 'tommermann' as const,
      kt: 38,
      lag: [
        { t0: 0, t1: 19, w: 148, gap: 50, profil: '19 × 148 mm', mat: 'bord-19x148', navn: 'Kledning, underligger' },
        { t0: 19, t1: 38, w: 98, gap: 0, profil: '19 × 98 mm', mat: 'bord-19x98', navn: 'Kledning, overligger' },
      ],
      navn: 'Tømmermannskledning 19 × 148 / 19 × 98 mm',
    }
  if (id === 'lekt')
    return {
      type: 'spalte' as const,
      kt: 23,
      lag: [{ t0: 0, t1: 23, w: 48, gap: spalte, profil: '23 × 48 mm', mat: 'lekt-23x48', navn: 'Kledning, spile' }],
      navn: `Spilekledning 23 × 48 mm med ${spalte} mm luft`,
    }
  return {
    type: 'spalte' as const,
    kt: 19,
    lag: [{ t0: 0, t1: 19, w: 98, gap: spalte, profil: '19 × 98 mm', mat: 'bord-19x98', navn: 'Kledning, bord' }],
    navn: `Stående kledning 19 × 98 mm med ${spalte} mm spalte`,
  }
}

export function gulvSpec(id: string) {
  return id === '21x98'
    ? { t: 21, w: 98, profil: '21 × 98 mm', mat: 'bord-21x98', cc: 450, dekke: 'terrassebord-21' as const }
    : { t: 28, w: 120, profil: '28 × 120 mm', mat: 'terrassebord-28x120', cc: 600, dekke: 'terrassebord-28' as const }
}

/** Fordel bord med fast bredde w over [a, b] med tilnærmet spalte g. */
export function fordelBord(a: number, b: number, w: number, g: number): Array<[number, number]> {
  const L = b - a
  if (L < 15) return []
  if (L <= w + 1) return [[a, b]]
  const n = Math.floor((L + g + 0.5) / (w + g))
  const res: Array<[number, number]> = []
  if (n <= 0) return [[a, b]]
  const rest = L - n * w - (n - 1) * g
  let gap = g
  let ripp = 0
  if (rest > 0.5) {
    if (n >= 2 && rest / (n - 1) <= Math.max(g, 6) * 0.9) gap = g + rest / (n - 1)
    else if (rest - g > 15) ripp = rest - g
    else if (n >= 2) gap = g + rest / (n - 1)
  }
  for (let i = 0; i < n; i++) {
    const s0 = a + i * (w + gap)
    res.push([s0, s0 + w])
  }
  if (ripp > 0) res.push([b - ripp, b])
  return res
}

function dekkePosisjoner(d: number, bw: number, gap: number) {
  const res: Array<{ z0: number; z1: number }> = []
  let z0 = -d / 2
  while (z0 < d / 2 - 5) {
    const wdt = Math.min(bw, d / 2 - z0)
    res.push({ z0, z1: z0 + wdt })
    z0 += wdt + gap
  }
  return res
}

const finnStd = (min: number) => STD.find((h) => h >= min - 0.5) ?? 223

// ── Hovedfunksjon ──────────────────────────────────────────────────

export function lagModell(inn: SmahusInput): Modell {
  const { B, D, H } = inn
  const advarsler: string[] = []
  const merknader: string[] = []
  const a = Math.max(3, Math.min(50, inn.vinkel))
  const ar = a * RAD
  const tan = Math.tan(ar)
  const cos = Math.cos(ar)
  const ks = kledSpec(inn.kledning, inn.spalte)
  const kt = ks.kt
  const gs = gulvSpec(inn.gulvbord)
  const ohU = kt + inn.utstikk
  const gOh = inn.taktype === 'valmtak' ? 0 : kt + inn.utstikk

  // ── Tak-ramme (u = fallretning / tverrs møne, v = langs takfot) ──
  let O: [number, number]
  let uAx: [number, number]
  let vAx: [number, number]
  const langsZ = () => {
    O = [0, -D / 2]
    uAx = [0, 1]
    vAx = [1, 0]
  }
  const langsX = () => {
    O = [-B / 2, 0]
    uAx = [1, 0]
    vAx = [0, 1]
  }
  if (inn.taktype === 'pulttak') {
    if (inn.retning === 'front') {
      O = [0, D / 2]
      uAx = [0, -1]
      vAx = [1, 0]
    } else if (inn.retning === 'venstre') langsX()
    else if (inn.retning === 'hoyre') {
      O = [B / 2, 0]
      uAx = [-1, 0]
      vAx = [0, 1]
    } else langsZ()
  } else if (inn.taktype === 'saltak') {
    if (inn.moneretning === 'dybde') langsX()
    else langsZ()
  } else if (B >= D) langsZ()
  else langsX()
  O = O!
  uAx = uAx!
  vAx = vAx!
  const L = Math.abs(uAx[1]) > 0.5 ? D : B
  const M = Math.abs(uAx[1]) > 0.5 ? B : D
  const W = (p: V3): V3 => [O[0] + p[0] * uAx[0] + p[2] * vAx[0], p[1], O[1] + p[0] * uAx[1] + p[2] * vAx[1]]
  const Wd = (d: V3): V3 => [d[0] * uAx[0] + d[2] * vAx[0], d[1], d[0] * uAx[1] + d[2] * vAx[1]]
  const tilR = (x: number, z: number): [number, number] => [(x - O[0]) * uAx[0] + (z - O[1]) * uAx[1], (x - O[0]) * vAx[0] + (z - O[1]) * vAx[1]]
  const tilRd = (dx: number, dz: number): [number, number] => [dx * uAx[0] + dz * uAx[1], dx * vAx[0] + dz * vAx[1]]
  const sideFor = (nu: number, nv: number): Veggside => {
    // utadvendt normal i tak-ramme → verden
    const w = Wd([nu, 0, nv])
    if (w[2] > 0.5) return 'front'
    if (w[2] < -0.5) return 'bak'
    if (w[0] < -0.5) return 'venstre'
    return 'hoyre'
  }
  const mapGeo = (g: Geo): Geo => {
    if (g.type === 'prisme') return { ...g, a: g.a.map(W), b: g.b.map(W) }
    return { ...g, c: W(g.c), akse: g.akse ? Wd(g.akse) : undefined }
  }

  // ── Laster ──
  const sk = snolastForConfig(inn.config)
  const tekke: Taktekke = inn.takpapp ? 'takpapp' : 'kryssfiner'
  const tl = taklaster({ sk: sk.sk, vinkelGrader: a, tekke })
  const snoTak = snolastTak(sk.sk, a)

  // ── Sperre: dimensjonering ↔ geometri (fuglemunn gir opplegglengden) ──
  const spennSperre = inn.taktype === 'pulttak' ? (L - SB) / 1000 : (L / 2 - SB / 2) / 1000
  const toppFor = (): Parameters<typeof sperreGeometri>[0]['topp'] =>
    inn.taktype === 'pulttak' ? { type: 'vegg', lopMm: L, svillBreddeMm: SB, utstikkMm: ohU } : { type: 'mone', lopMm: L / 2, moneTykkelseMm: inn.taktype === 'valmtak' && M - L < 250 ? 98 : 48 }
  let sperre = dimensjonerSperre({ spennHorisontalM: spennSperre, vinkelGrader: a, ccM: 0.6, tekke, sk: sk.sk, opplegglengdeMm: 70 })
  let sg = sperreGeometri({ vinkelGrader: a, sperreHoydeMm: sperre.valgt.h, svillBreddeMm: SB, utstikkMm: ohU, topp: toppFor() })
  for (let it = 0; it < 3; it++) {
    const d2 = dimensjonerSperre({ spennHorisontalM: spennSperre, vinkelGrader: a, ccM: 0.6, tekke, sk: sk.sk, opplegglengdeMm: sg.fuglemunn.seteMm })
    if (d2.valgt.h === sperre.valgt.h) {
      sperre = d2
      break
    }
    sperre = d2
    sg = sperreGeometri({ vinkelGrader: a, sperreHoydeMm: sperre.valgt.h, svillBreddeMm: SB, utstikkMm: ohU, topp: toppFor() })
  }
  // Pulttak med for langt fall: drager midt under sperrene (opplegg i gavlene).
  let mDrager: Dimensjonering | undefined
  if (inn.taktype === 'pulttak' && !sperre.ok) {
    const halv = (L / 2 - SB / 2) / 1000
    let s2 = dimensjonerSperre({ spennHorisontalM: halv, vinkelGrader: a, ccM: 0.6, tekke, sk: sk.sk, opplegglengdeMm: 70 })
    let g2 = sperreGeometri({ vinkelGrader: a, sperreHoydeMm: s2.valgt.h, svillBreddeMm: SB, utstikkMm: ohU, topp: toppFor() })
    s2 = dimensjonerSperre({ spennHorisontalM: halv, vinkelGrader: a, ccM: 0.6, tekke, sk: sk.sk, opplegglengdeMm: g2.fuglemunn.seteMm })
    g2 = sperreGeometri({ vinkelGrader: a, sperreHoydeMm: s2.valgt.h, svillBreddeMm: SB, utstikkMm: ohU, topp: toppFor() })
    sperre = s2
    sg = g2
    mDrager = dimensjonerDrager({
      spennM: (M - SB) / 1000,
      lastbreddeM: (1.25 * L) / 2 / 1000,
      flatelaster: tl,
      sidestottet: true,
      opplegglengdeMm: 96,
      nedboyning: 'tak',
      kandidater: [...[148, 198, 223].map((x) => tverrsnitt(48, x, 1, 'C24', `bjelke-48x${x}`)), ...DOBLE_C24],
    })
    mDrager.kontroll.navn = 'Drager under sperrene'
    if (!mDrager.ok) advarsler.push(`Drager under sperrene: ${mDrager.melding}`)
    merknader.push(`Fallengden ${Math.round(L)} mm er for lang for sperrene alene – en drager midt under sperrene (opplegg på dobbel stender i gavlveggene) halverer spennet.`)
  }
  if (!sperre.ok) advarsler.push(`Sperre: ${sperre.melding}`)
  merknader.push(...sg.merknader)
  const h = sperre.valgt.h
  const seat = sg.fuglemunn.seteMm
  const topp = (x: number) => (x - seat) * tan + h / cos
  const bunn = (x: number) => (x - seat) * tan
  const ovre = sg.ovreSvillHoydeMm ?? 0

  // ── Nivåer ──
  const lastbreddeTak: Record<string, number> = {}
  const egenVegg = 0.35 // kN/m² vegg (stenderverk + kledning)
  const rolleLast = (rolle: Vegg['rolle']): number => {
    if (rolle === 'takfotA' || rolle === 'takfotC') return (inn.taktype === 'pulttak' ? L / 2 : L / 2) / 1000 + ohU / 1000
    if (rolle === 'valmende') return (L / 2 + ohU) / 1000
    if (rolle === 'gavl') return (gOh + 300) / 1000
    return 0
  }
  // Verden-side → rolle
  const rolleForSide = (side: Veggside): Vegg['rolle'] => {
    const n = side === 'front' ? [0, 1] : side === 'bak' ? [0, -1] : side === 'venstre' ? [-1, 0] : [1, 0]
    const [nu] = tilRd(n[0], n[1])
    if (Math.abs(nu) > 0.5) return nu < 0 ? 'takfotA' : 'takfotC'
    return inn.taktype === 'valmtak' ? 'valmende' : 'gavl'
  }
  for (const s of ['front', 'bak', 'venstre', 'hoyre'] as Veggside[]) lastbreddeTak[s] = rolleLast(rolleForSide(s))

  // ── Bjelkelag (dimensjonering) ──
  // Gulvbjelker i bjelkesko (opplegg 48 mm): prøv standard c/c, så tettere
  // c/c, så midtdrager – første løsning som holder (≤ 48 × 198) velges.
  const floorLast = gulvlaster({ bruk: inn.bruk, dekke: gs.dekke, lagerKN: inn.lagerKN })
  const gulvInn = (spennM: number, cc: number) => dimensjonerGulvbjelke({ spennM, ccM: cc / 1000, bruk: inn.bruk, dekke: gs.dekke, lagerKN: inn.lagerKN, tjenesteklasse: 2, opplegglengdeMm: 48 })
  const spennFor = (m: boolean, tF: number) => (m ? (D - 2 * tF - T) / 2 : D - 2 * tF)
  const forsok: Array<[boolean, number]> = [[false, gs.cc], [false, 400], [true, gs.cc], [true, 400], [false, 300], [true, 300]]
  let midt = false
  let ccG = gs.cc
  let gulvbjelke = gulvInn(spennFor(false, T) / 1000, gs.cc)
  for (const [mm, cc] of forsok) {
    if (cc > gs.cc) continue
    const d = gulvInn(spennFor(mm, T) / 1000, cc)
    if (d.ok && d.valgt.h <= 198) {
      midt = mm
      ccG = cc
      gulvbjelke = d
      break
    }
    if (mm && cc === 300) {
      midt = true
      ccG = 300
      gulvbjelke = d
    }
  }
  const veggLinje = (side: Veggside, ekstraVegg = 0): Linjelast[] => {
    const lb = lastbreddeTak[side]
    const res: Linjelast[] = tl.map((f) => ({ navn: `${f.navn} × ${lb.toFixed(2)} m`, type: f.type, qk: f.qk * lb }))
    res.push({ navn: 'Vegg (stenderverk + kledning)', type: 'egen', qk: (egenVegg * (H + ekstraVegg)) / 1000 })
    return res
  }
  const kandidat = (hh: number) => [tverrsnitt(48, hh, 1, 'C24', `bjelke-48x${hh}`), tverrsnitt(48, hh, 2, 'C24', `bjelke-48x${hh}`)]
  let hJ = gulvbjelke.valgt.h
  let padXn = 2
  const fbSide: Veggside = lastbreddeTak.front >= lastbreddeTak.bak ? 'front' : 'bak'
  const sideSide: Veggside = lastbreddeTak.venstre >= lastbreddeTak.hoyre ? 'venstre' : 'hoyre'
  const ekstraHoy = inn.taktype === 'pulttak' ? ovre : 0
  const kantSjekk = (hh: number, n: number) =>
    dimensjonerDrager({
      spennM: Math.max(0.3, (B - 200) / (n - 1) / 1000),
      lastbreddeM: spennFor(midt, T) / 2000,
      flatelaster: floorLast,
      ekstraLinjelaster: veggLinje(fbSide, ekstraHoy),
      sidestottet: true,
      opplegglengdeMm: 150,
      kandidater: kandidat(hh),
    })
  // Færrest mulig fundamenter: prøv 2, 3, … per rad og velg minste kantbjelke som holder.
  let kant: Dimensjonering | undefined
  let hK = hJ
  outer: for (let n = 2; n <= 10; n++) {
    const sx = (B - 200) / (n - 1)
    if (n > 2 && sx < 700) break
    for (const hh of STD.filter((x) => x >= hJ)) {
      const d = kantSjekk(hh, n)
      kant = d
      if (d.ok && d.valgt.antall === 1) {
        hK = hh
        padXn = n
        break outer
      }
    }
  }
  if (!kant!.ok || kant!.valgt.antall > 1) {
    // dobbel kantbjelke med tettest fundamentavstand
    padXn = Math.max(2, Math.floor((B - 200) / 700) + 1)
    hK = 223
    kant = kantSjekk(hK, padXn)
    if (!kant.ok) advarsler.push(`Kantbjelke front/bak: ${kant.melding}`)
  }
  kant = kant!
  kant.kontroll.navn = 'Kantbjelke front/bak'
  const sideKantSjekk = (rader: number) =>
    dimensjonerDrager({
      spennM: Math.max(0.3, (D - 200) / (rader - 1) / 1000),
      lastbreddeM: ccG / 2000,
      flatelaster: floorLast,
      ekstraLinjelaster: veggLinje(sideSide, ekstraHoy),
      sidestottet: true,
      opplegglengdeMm: 150,
      kandidater: kandidat(hK),
    })
  let sidekant = sideKantSjekk(midt ? 3 : 2)
  if (!sidekant.ok && !midt) {
    midt = true
    sidekant = sideKantSjekk(3)
    gulvbjelke = gulvInn(spennFor(true, T) / 1000, ccG)
  }
  sidekant.kontroll.navn = 'Kantbjelke side'
  if (!sidekant.ok) advarsler.push(`Kantbjelke side: ${sidekant.melding}`)
  const tF = kant.valgt.antall * T
  const tS = sidekant.valgt.antall * T
  gulvbjelke = gulvInn(spennFor(midt, tF) / 1000, ccG)
  gulvbjelke.kontroll.navn = 'Gulvbjelke'
  let midtdrager: Dimensjonering | undefined
  if (midt) {
    midtdrager = dimensjonerDrager({
      spennM: Math.max(0.3, (B - 200) / (padXn - 1) / 1000),
      lastbreddeM: spennFor(true, tF) / 1000,
      flatelaster: floorLast,
      sidestottet: true,
      opplegglengdeMm: 150,
      kandidater: kandidat(hK),
    })
    midtdrager.kontroll.navn = 'Midtdrager'
    if (!midtdrager.ok) advarsler.push(`Midtdrager: ${midtdrager.melding}`)
  }
  if (!gulvbjelke.ok) advarsler.push(`Gulvbjelke: ${gulvbjelke.melding}`)
  hJ = Math.max(hJ, gulvbjelke.valgt.h)
  if (hJ > hK) hK = hJ

  const yF = inn.fundSynlig
  const yJ = yF + hK
  const yD = yJ + gs.t
  const yP = yD + H
  const kledBunn = yF - 15

  // ── Deler ──
  const deler: Del[] = []
  const pidN = new Map<string, number>()
  const pid = (p: string) => {
    const n = (pidN.get(p) ?? 0) + 1
    pidN.set(p, n)
    return `${p}-${n}`
  }
  interface Meta {
    navn: string
    profil: string
    mat: string
    part: string
    kategori: Materialkategori
    gruppe: string
    p?: string
    endeA?: KappEnde
    endeB?: KappEnde
    merknad?: string
    tre?: boolean
    farge?: number
    darken?: number
    opasitet?: number
    m2?: number
    stk?: boolean
    kvalitet?: string
  }
  const legg = (m: Meta, geo: Geo, akse: V3, iRamme = true): Del => {
    const g = iRamme ? mapGeo(geo) : geo
    const ak = norm(iRamme ? Wd(akse) : akse)
    const ut = utstrekning(g, ak)
    const lengde = ut.max - ut.min
    const tre = m.tre ?? /\d+\s*×\s*\d+/.test(m.profil)
    const kapp = rundOppKapp(lengde)
    const d: Del = {
      pid: pid(m.p ?? m.navn.toLowerCase().replace(/[^a-zæøå0-9]+/g, '-')),
      navn: m.navn,
      profil: m.profil,
      mat: m.mat,
      part: m.part,
      kategori: m.kategori,
      geo: g,
      tre,
      akse: ak,
      lengdeMm: lengde,
      kappMm: kapp,
      lengdeCm: Math.round(lengde / 10),
      endeA: m.endeA,
      endeB: m.endeB,
      merknad: m.merknad,
      farge: m.farge,
      darken: m.darken,
      opasitet: m.opasitet,
      m2: m.m2,
      stk: m.stk,
      kvalitet: m.kvalitet ?? (tre && /^48 ×|^98 ×/.test(m.profil) ? 'C24' : undefined),
      gruppe: m.gruppe,
    }
    deler.push(d)
    return d
  }
  // Takelementers fotavtrykk (u, v) – til lufting og rørgjennomføring.
  const takFot: P2[][] = []
  const fotavtrykk = (g: Prisme) => konvekstSkall([...g.a, ...g.b].map((p) => [p[0], p[2]] as P2))

  // ════════════════════════════════════════════════════════════════
  // FUNDAMENT + BJELKELAG (verdenskoordinater)
  // ════════════════════════════════════════════════════════════════
  const padX: number[] = []
  for (let i = 0; i < padXn; i++) padX.push(-B / 2 + 100 + (i * (B - 200)) / (padXn - 1))
  let padZ = midt ? [D / 2 - 100, 0, -D / 2 + 100] : [D / 2 - 100, -D / 2 + 100]
  const hjStr = `48 × ${hK} mm`
  const hjMat = `bjelke-48x${hK}`
  const G = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) => boks([x0, y0, z0], [x1, y1, z1])
  const bjMeta = (navn: string, merknad?: string): Meta =>
    navn === 'Gulvbjelke'
      ? { navn, profil: `48 × ${hJ} mm`, mat: `bjelke-48x${hJ}`, part: 'konstruksjon', kategori: 'bjelkelag', gruppe: 'bjelkelag', merknad: hK > hJ ? `${merknad} Overkant i flukt med kantbjelkene.` : merknad }
      : { navn, profil: hjStr, mat: hjMat, part: 'konstruksjon', kategori: 'bjelkelag', gruppe: 'bjelkelag', merknad }
  for (let k = 0; k < tF / T; k++) {
    const merk = tF > T ? 'Dobbel – skrus sammen. Gulvbjelkene henges i bjelkesko.' : 'Rett kapp. Gulvbjelkene henges i bjelkesko.'
    legg(bjMeta('Kantbjelke front/bak', merk), G(-B / 2, yF, D / 2 - (k + 1) * T, B / 2, yJ, D / 2 - k * T), [1, 0, 0], false)
    legg(bjMeta('Kantbjelke front/bak', merk), G(-B / 2, yF, -D / 2 + k * T, B / 2, yJ, -D / 2 + (k + 1) * T), [1, 0, 0], false)
  }
  for (let k = 0; k < tS / T; k++) {
    const merk = tS > T ? 'Dobbel – skrus sammen. Mellom front- og bakkantbjelken.' : 'Mellom front- og bakkantbjelken.'
    legg(bjMeta('Kantbjelke side', merk), G(-B / 2 + k * T, yF, -D / 2 + tF, -B / 2 + (k + 1) * T, yJ, D / 2 - tF), [0, 0, 1], false)
    legg(bjMeta('Kantbjelke side', merk), G(B / 2 - (k + 1) * T, yF, -D / 2 + tF, B / 2 - k * T, yJ, D / 2 - tF), [0, 0, 1], false)
  }
  if (midt) {
    const lag = midtdrager?.valgt.antall ?? 1
    for (let k = 0; k < lag; k++) {
      const z0 = -(lag * T) / 2 + k * T
      legg(bjMeta('Midtdrager', lag > 1 ? 'Dobbel – spikres/skrus sammen. Ligger på midtre fundamentrekke.' : 'Ligger på midtre fundamentrekke.'), G(-B / 2 + tS, yF, z0, B / 2 - tS, yJ, z0 + T), [1, 0, 0], false)
    }
  }
  const midtHalv = midt ? ((midtdrager?.valgt.antall ?? 1) * T) / 2 : 0
  const bjelkeX: number[] = []
  {
    const x0 = -B / 2 + tS - T / 2
    const x1 = B / 2 - tS + T / 2
    const n = Math.max(1, Math.ceil((x1 - x0) / ccG - 1e-9))
    for (let i = 1; i < n; i++) bjelkeX.push(x0 + (i * (x1 - x0)) / n)
  }
  for (const x of bjelkeX) {
    if (midt) {
      legg(bjMeta('Gulvbjelke', 'I bjelkesko mot kantbjelke og midtdrager.'), G(x - T / 2, yJ - hJ, -D / 2 + tF, x + T / 2, yJ, -midtHalv), [0, 0, 1], false)
      legg(bjMeta('Gulvbjelke', 'I bjelkesko mot kantbjelke og midtdrager.'), G(x - T / 2, yJ - hJ, midtHalv, x + T / 2, yJ, D / 2 - tF), [0, 0, 1], false)
    } else legg(bjMeta('Gulvbjelke', 'I bjelkesko i begge ender.'), G(x - T / 2, yJ - hJ, -D / 2 + tF, x + T / 2, yJ, D / 2 - tF), [0, 0, 1], false)
  }
  // Gulvbord
  for (const p of dekkePosisjoner(D, gs.w, inn.dekkeSprekk)) {
    const ripp = p.z1 - p.z0 < gs.w - 1
    legg(
      { navn: 'Gulvbord', profil: gs.profil, mat: gs.mat, part: 'gulv', kategori: 'dekke', gruppe: 'dekke', merknad: ripp ? `Rippes til ${Math.round(p.z1 - p.z0)} mm bredde.` : undefined, kvalitet: 'NTR AB' },
      G(-B / 2, yJ, p.z0, B / 2, yD, p.z1),
      [1, 0, 0],
      false,
    )
  }

  // ════════════════════════════════════════════════════════════════
  // VEGGER (tak-ramme-koordinater)
  // ════════════════════════════════════════════════════════════════
  const ridgeBotRel = (hb: number) => topp(L / 2 - 24) - hb
  const hb = finnStd(Math.max(h, h / cos + (inn.taktype === 'saltak' ? 51 * tan : 0) - 6))
  // Gavlens skrå toppsvill = sperrenes underkant; flate soner under mønebord/drager.
  const gavlSoner: Array<{ u0: number; u1: number; y: number }> = []
  const dTyk = (mDrager?.valgt.antall ?? 1) * T
  const dU0 = L / 2 - dTyk / 2
  const dBot = mDrager ? bunn(dU0) - mDrager.valgt.h : 0
  if (inn.taktype === 'saltak') {
    const rb = ridgeBotRel(hb)
    const ua = seat + rb / tan
    if (ua - SB < 150) gavlSoner.push({ u0: SB, u1: L - SB, y: Math.min(bunn(SB), rb) })
    else if (L - 2 * ua < 150) gavlSoner.push({ u0: L / 2 - 75, u1: L / 2 + 75, y: Math.min(rb, bunn(L / 2 - 75)) })
    else gavlSoner.push({ u0: ua, u1: L - ua, y: rb })
  } else if (mDrager) gavlSoner.push({ u0: L / 2 - 75, u1: L / 2 + 75, y: dBot })
  const gavlTopRel = (u: number) => {
    let y = inn.taktype === 'pulttak' ? bunn(u) : Math.min(bunn(u), bunn(L - u))
    for (const z of gavlSoner) if (u >= z.u0 - 1e-6 && u <= z.u1 + 1e-6) y = Math.min(y, z.y)
    return y
  }
  const vegger: Vegg[] = []
  const mkVegg = (v: Omit<Vegg, 'side' | 'apninger' | 'lastbreddeM'> & { side?: Veggside }): Vegg => {
    const side = v.ytter ? sideFor(-v.nrm[0], -v.nrm[1]) : undefined
    const w: Vegg = { ...v, side, apninger: [], lastbreddeM: rolleLast(v.rolle) }
    vegger.push(w)
    return w
  }
  const valm = inn.taktype === 'valmtak'
  const vA = mkVegg({ id: 'A', navn: '', ytter: true, start: [0, -M / 2], dir: [0, 1], nrm: [1, 0], len: M, toppAbs: () => yP, brudd: [], flat: true, dobbel: true, lap: valm ? 'inn' : undefined, foretrukne: [], tvungne: [], rolle: 'takfotA' })
  const yC = inn.taktype === 'pulttak' ? yP + ovre : yP
  const vC = mkVegg({ id: 'C', navn: '', ytter: true, start: [L, -M / 2], dir: [0, 1], nrm: [-1, 0], len: M, toppAbs: () => yC, brudd: [], flat: true, dobbel: true, lap: valm ? 'inn' : undefined, foretrukne: [], tvungne: [], rolle: 'takfotC' })
  const gavlBrudd: number[] = []
  for (const z of gavlSoner) for (const u of [z.u0, z.u1]) if (u > SB + 1 && u < L - SB - 1) gavlBrudd.push(u - SB)
  if (inn.taktype === 'saltak' && !gavlSoner.some((z) => z.u0 <= L / 2 && z.u1 >= L / 2)) gavlBrudd.push(L / 2 - SB)
  const gavlTopp = (s: number) => yP + gavlTopRel(s + SB)
  const ePar = valm
    ? { toppAbs: () => yP, brudd: [] as number[], flat: true, dobbel: true, lap: 'ut' as const, rolle: 'valmende' as const }
    : { toppAbs: gavlTopp, brudd: gavlBrudd, flat: false, dobbel: false, lap: undefined, rolle: 'gavl' as const }
  const eM = mkVegg({ id: 'E-', navn: '', ytter: true, start: [SB, -M / 2], dir: [1, 0], nrm: [0, 1], len: L - 2 * SB, foretrukne: [], tvungne: [], ...ePar })
  const eP = mkVegg({ id: 'E+', navn: '', ytter: true, start: [SB, M / 2], dir: [1, 0], nrm: [0, -1], len: L - 2 * SB, foretrukne: [], tvungne: [], ...ePar })
  const VEGGNAVN: Record<Veggside, string> = { front: 'Frontvegg', bak: 'Bakvegg', venstre: 'Venstre sidevegg', hoyre: 'Høyre sidevegg' }
  for (const v of vegger) v.navn = VEGGNAVN[v.side as Veggside]

  // Skillevegger (vedskjul): fra bakveggens til frontveggens innside.
  const skille: Vegg[] = []
  for (const xk of inn.skillevegger ?? []) {
    const [su, sv] = tilR(xk - SB / 2, -D / 2 + SB)
    const d = tilRd(0, 1)
    const n = tilRd(1, 0)
    const w = mkVegg({ id: `S${skille.length}`, navn: 'Skillevegg', ytter: false, start: [su, sv], dir: d, nrm: n, len: D - 2 * SB, toppAbs: () => yP + Math.min(0, mDrager ? dBot : 0), brudd: [], flat: true, dobbel: false, foretrukne: [], tvungne: [], rolle: 'skille' })
    skille.push(w)
  }
  // s-parameter for et verdenspunkt på en vegg.
  const sFor = (v: Vegg, x: number, z: number) => {
    const [u, vv] = tilR(x, z)
    return (u - v.start[0]) * v.dir[0] + (vv - v.start[1]) * v.dir[1]
  }
  const veggAkse = (side: Veggside) => (side === 'front' || side === 'bak' ? 'x' : 'z')
  const sAvVerden = (v: Vegg, c: number) => {
    const side = v.side as Veggside
    const x = veggAkse(side) === 'x' ? c : side === 'venstre' ? -B / 2 : B / 2
    const z = veggAkse(side) === 'z' ? c : side === 'front' ? D / 2 : -D / 2
    return sFor(v, x, z)
  }
  // Tvungne stendere der skilleveggene møter yttervegg.
  for (const w of skille) {
    for (const v of vegger) {
      if (!v.ytter) continue
      const [cu, cv] = [w.start[0] + w.nrm[0] * SB / 2, w.start[1] + w.nrm[1] * SB / 2]
      // skilleveggens ender
      for (const end of [0, w.len]) {
        const pu = cu + w.dir[0] * end
        const pv = cv + w.dir[1] * end
        // punkt like innenfor ytterveggens innside
        const tt = (pu - v.start[0]) * v.nrm[0] + (pv - v.start[1]) * v.nrm[1]
        if (Math.abs(tt - SB) < 2) v.tvungne.push((pu - v.start[0]) * v.dir[0] + (pv - v.start[1]) * v.dir[1])
      }
    }
  }

  // ── Plate-underkant for en vegg ──
  const plateBunn = (v: Vegg) => (s: number): number => {
    if (v.flat) return v.toppAbs(s) - (v.dobbel ? 2 * T : T)
    const bp = [0, ...v.brudd.filter((b) => b > 1 && b < v.len - 1).sort((p, q) => p - q), v.len]
    let best = Infinity
    for (let i = 0; i < bp.length - 1; i++) {
      const sa = bp[i]
      const sb = bp[i + 1]
      if (s < sa - 1e-6 || s > sb + 1e-6) continue
      const ya = v.toppAbs(sa + 0.01)
      const yb = v.toppAbs(sb - 0.01)
      const k = (yb - ya) / Math.max(1, sb - sa)
      const y = ya + k * (Math.min(sb, Math.max(sa, s)) - sa)
      best = Math.min(best, y - T * Math.sqrt(1 + k * k))
    }
    return Number.isFinite(best) ? best : v.toppAbs(s) - T
  }
  const linjePkt = (s0: number, s1: number, f: (s: number) => number, brudd: number[]): P2[] => {
    const xs = [s1, ...brudd.filter((b) => b > s0 + 0.5 && b < s1 - 0.5).sort((p, q) => q - p), s0]
    return xs.map((x) => [x, f(x)] as P2)
  }

  // ── Åpninger: dimensjoner overligger, del ved behov ──
  const overliggere: Statikk['overliggere'] = []
  const alleApninger: ApningR[] = []
  for (const ai of inn.apninger) {
    const v = vegger.find((w) => w.ytter && w.side === ai.side)
    if (!v) continue
    const pb = plateBunn(v)
    let zone: [number, number]
    if (ai.full) zone = [T, v.len - T]
    else if (ai.fag) {
      const sa = sAvVerden(v, (veggAkse(ai.side) === 'x' ? -B / 2 : -D / 2) + (ai.fag.i * (veggAkse(ai.side) === 'x' ? B : D)) / ai.fag.n)
      const sb = sAvVerden(v, (veggAkse(ai.side) === 'x' ? -B / 2 : -D / 2) + ((ai.fag.i + 1) * (veggAkse(ai.side) === 'x' ? B : D)) / ai.fag.n)
      const lo = Math.min(sa, sb)
      const hi = Math.max(sa, sb)
      zone = [lo < T + 1 ? T : lo + T / 2, hi > v.len - T - 1 ? v.len - T : hi - T / 2]
    } else {
      const c = sAvVerden(v, ai.senter ?? 0)
      const w = ai.bredde ?? 800
      zone = [Math.max(T, c - w / 2 - 2 * T - 2 * T), Math.min(v.len - T, c + w / 2 + 2 * T + 2 * T)]
    }
    const lb = v.lastbreddeM
    const kand = [tverrsnitt(48, 98, 2, 'C24', 'bjelke-48x98'), ...DOBLE_C24.filter((d) => d.antall === 2)]
    let valgt: { subs: Array<[number, number]>; nB: number; dims: Dimensjonering[] } | undefined
    let siste: typeof valgt
    for (const nB of [1, 2]) {
      for (let k = 1; k <= (ai.splitt ? 6 : 1); k++) {
        const kant = nB * T + T
        const tot = zone[1] - zone[0] - 2 * kant
        const post = 2 * nB * T + T
        let w = (tot - (k - 1) * post) / k
        if (!ai.full && !ai.fag && ai.bredde) w = Math.min(w, ai.bredde)
        if (ai.fag && ai.bredde) w = Math.min(w, ai.bredde)
        if (w < 300) break
        const subs: Array<[number, number]> = []
        const start = (zone[0] + zone[1]) / 2 - (k * w + (k - 1) * post) / 2
        for (let i = 0; i < k; i++) subs.push([start + i * (w + post), start + i * (w + post) + w])
        const dims = subs.map(() =>
          dimensjonerDrager({
            spennM: (w + nB * T) / 1000,
            lastbreddeM: lb,
            flatelaster: tl,
            ekstraLinjelaster: [{ navn: 'Vegg over åpning', type: 'egen', qk: 0.15 }],
            sidestottet: false,
            opplegglengdeMm: nB * T,
            kandidater: kand,
          }),
        )
        siste = { subs, nB, dims }
        if (dims.every((d) => d.ok)) {
          valgt = siste
          break
        }
      }
      if (valgt) break
    }
    if (!valgt) {
      valgt = siste
      if (valgt) advarsler.push(`Overligger ${ai.navn.toLowerCase()} (${v.navn.toLowerCase()}): ${valgt.dims[0].melding}`)
    }
    if (!valgt) {
      advarsler.push(`${ai.navn} i ${v.navn.toLowerCase()} får ikke plass og er utelatt.`)
      continue
    }
    valgt.subs.forEach(([x0, x1], i) => {
      const d = valgt!.dims[i]
      d.kontroll.navn = `Overligger ${ai.navn.toLowerCase()}`
      const hh = d.valgt.h
      const nB = valgt!.nB
      let pbMin = Infinity
      for (const s of [x0 - nB * T, x1 + nB * T, ...v.brudd.filter((b) => b > x0 - nB * T && b < x1 + nB * T)]) pbMin = Math.min(pbMin, pb(s))
      const onsket = yD + ai.topp
      let hTop = Math.min(onsket + hh, pbMin)
      if (pbMin - hTop < 100) hTop = pbMin
      const toppAbs = hTop - hh
      const bunnAbs = ai.bunn <= 0 ? (ai.terskel ? yD + T : yD) : yD + ai.bunn
      if (toppAbs - bunnAbs < 250) {
        advarsler.push(`${ai.navn} i ${v.navn.toLowerCase()} blir for lav og er utelatt – øk vegghøyden.`)
        return
      }
      const r: ApningR = {
        navn: valgt!.subs.length > 1 ? `${ai.navn} ${i + 1}` : ai.navn,
        vegg: v.id,
        side: v.side,
        x0,
        x1,
        nB,
        hh,
        dim: d,
        spennMm: x1 - x0 + nB * T,
        bunnAbs,
        toppAbs,
        terskel: ai.terskel,
        blad: ai.blad,
        hengsel: ai.hengsel ?? 'venstre',
        bladSpalte: ai.bladSpalte,
        karmV: i === 0,
        karmH: i === valgt!.subs.length - 1,
      }
      v.apninger.push(r)
      alleApninger.push(r)
      overliggere.push({ navn: `Overligger ${r.navn.toLowerCase()} (${v.navn.toLowerCase()})`, dim: d, spennMm: r.spennMm })
    })
  }

  // ── Stender-dimensjonering ──
  const maksVeggH = H + ekstraHoy
  const stender = dimensjonerStender({ hoydeM: maksVeggH / 1000, ccM: 0.6, lastbreddeM: Math.max(...vegger.map((v) => v.lastbreddeM)), flatelaster: tl, losholtM: 0.6 })
  stender.kontroll.navn = 'Stender'
  if (!stender.ok) advarsler.push(`Stender: ${stender.melding}`)

  // ── Tak: sperreposisjoner (trengs til stenderplassering) ──
  const sperreV: number[] = []
  const nSp = Math.max(2, Math.ceil((M - T) / 600 - 1e-9) + 1)
  for (let i = 0; i < nSp; i++) sperreV.push(-M / 2 + T / 2 + (i * (M - T)) / (nSp - 1))
  // valmtak-layout
  const vR = valm ? (M - L) / 2 : 0
  const harMone = valm && M - L >= 250
  const vEnd = harMone ? vR : Math.max(49, vR)
  const hw = harMone ? 24 : 49
  const vanlige: number[] = [] // valm: vanlige sperrer (v)
  const skifteA: number[] = [] // valm: skiftesperrer på A/C – avstand fra hjørnet
  const skifteE: number[] = [] // valm: skiftesperrer på endene – u
  if (valm) {
    if (harMone) {
      const n = Math.max(2, Math.ceil((2 * vR - T) / 600 - 1e-9) + 1)
      for (let i = 0; i < n; i++) vanlige.push(-vR + T / 2 + (i * (2 * vR - T)) / (n - 1))
      const span = L / 2 + T / 2
      const n2 = Math.ceil(span / 600 - 1e-9)
      for (let k = 1; k < n2; k++) skifteA.push((k * span) / n2)
    } else {
      vanlige.push(0)
      const span = M / 2
      const n2 = Math.ceil(span / 600 - 1e-9)
      for (let k = 1; k < n2; k++) if ((k * span) / n2 < L / 2 - 60) skifteA.push((k * span) / n2)
    }
    const n3 = Math.ceil(L / 2 / 600 - 1e-9)
    for (let k = 1; k < n3; k++) skifteE.push((k * (L / 2)) / n3)
  }
  const skifteAok = skifteA.filter((d) => d >= 120)
  const skifteEok = skifteE.filter((d) => d >= 120)
  if (valm) {
    const vs = [...vanlige, ...skifteAok.map((d) => -M / 2 + d), ...skifteAok.map((d) => M / 2 - d)]
    vA.foretrukne = vs.map((v) => v + M / 2)
    vC.foretrukne = vA.foretrukne
    const us = [L / 2, ...skifteEok, ...skifteEok.map((d) => L - d)]
    eM.foretrukne = us.map((u) => u - SB)
    eP.foretrukne = eM.foretrukne
  } else {
    vA.foretrukne = sperreV.map((v) => v + M / 2)
    if (inn.taktype === 'pulttak') vC.foretrukne = vA.foretrukne
    else vC.foretrukne = vA.foretrukne
    if (inn.taktype === 'saltak') {
      eM.tvungne.push(L / 2 - SB)
      eP.tvungne.push(L / 2 - SB)
    }
    if (mDrager) {
      eM.tvungne.push(L / 2 - SB - 25, L / 2 - SB + 25)
      eP.tvungne.push(L / 2 - SB - 25, L / 2 - SB + 25)
    }
  }

  // ── Bygg vegg ──
  const byggVegg = (v: Vegg) => {
    const pfx = v.ytter ? '' : 'Skillevegg – '
    const O3: V3 = [v.start[0], 0, v.start[1]]
    const ex: V3 = [v.dir[0], 0, v.dir[1]]
    const ez: V3 = [v.nrm[0], 0, v.nrm[1]]
    const ey: V3 = [0, 1, 0]
    const poly = (m: Meta, p: P2[], t0: number, t1: number, akse: V3) => legg(m, prisme(O3, ex, ey, ez, p, t0, t1), akse)
    const rekt = (m: Meta, s0: number, s1: number, y0: number, y1: number, t0 = 0, t1 = SB) =>
      poly(m, [[s0, y0], [s1, y0], [s1, y1], [s0, y1]], t0, t1, s1 - s0 >= y1 - y0 ? ex : ey)
    const km = (navn: string, merknad?: string, ekstra: Partial<Meta> = {}): Meta => ({ navn: pfx + navn, profil: KV, mat: KVMAT, part: 'konstruksjon', kategori: 'konstruksjon', gruppe: v.ytter ? 'vegg' : 'skillevegg', merknad, ...ekstra })
    const svTop = yD + T
    const pb = plateBunn(v)
    // Svill (kuttes i åpninger uten terskel)
    const kutt = v.apninger.filter((o) => !o.terskel && o.bunnAbs < svTop - 1).map((o) => [o.x0, o.x1] as [number, number]).sort((p, q) => p[0] - q[0])
    let s = 0
    for (const [k0, k1] of [...kutt, [v.len, v.len] as [number, number]]) {
      if (k0 - s > 10) rekt(km('Bunnsvill', kutt.length ? 'Kappes i døråpning (ingen terskel).' : 'Rett kapp. Skrus/forankres til bjelkelaget.'), s, k0, yD, svTop)
      s = Math.max(s, k1)
    }
    // Toppsvill
    if (v.flat) {
      const T0 = v.toppAbs(0)
      if (v.dobbel) {
        rekt(km('Toppsvill, nedre', v.lap === 'ut' ? 'Mellom takfotveggene.' : 'Rett kapp.'), 0, v.len, T0 - 2 * T, T0 - T)
        const [u0, u1] = v.lap === 'inn' ? [SB, v.len - SB] : v.lap === 'ut' ? [-SB, v.len + SB] : [0, v.len]
        rekt(km('Toppsvill, øvre', v.lap ? 'Legges omlagt i hjørnene (binder veggene sammen).' : 'Skjøtes forskjøvet fra nedre toppsvill.'), u0, u1, T0 - T, T0)
      } else rekt(km('Toppsvill'), 0, v.len, T0 - T, T0)
    } else {
      const bp = [0, ...v.brudd.filter((b) => b > 1 && b < v.len - 1).sort((p, q) => p - q), v.len]
      for (let i = 0; i < bp.length - 1; i++) {
        const sa = bp[i]
        const sb = bp[i + 1]
        const ya = v.toppAbs(sa + 0.01)
        const yb = v.toppAbs(sb - 0.01)
        const k = (yb - ya) / (sb - sa)
        const dy = T * Math.sqrt(1 + k * k)
        const ang = Math.abs(Math.atan(k) / RAD)
        const skra = ang > 0.2
        poly(
          km(skra ? 'Toppsvill, skrå' : 'Toppsvill', skra ? `Følger takfallet ${fmtGrader(ang)}. Loddrett kapp i endene.` : 'Under mønebordet.', skra ? { endeA: { vinkel: ang, type: 'gjaering', merknad: 'loddkapp' }, endeB: { vinkel: ang, type: 'gjaering', merknad: 'loddkapp' } } : {}),
          [[sa, ya - dy], [sb, yb - dy], [sb, yb], [sa, ya]],
          0,
          SB,
          norm([v.dir[0], k, v.dir[1]]),
        )
      }
    }
    // Vertikale elementer
    interface Vert { s0: number; s1: number; y0: number; y1: number }
    const vert: Vert[] = []
    const stav = (navn: string, s0: number, s1: number, y0: number, toppF: ((s: number) => number) | number, merknad?: string, ekstra: Partial<Meta> = {}) => {
      const top = typeof toppF === 'number' ? () => toppF : toppF
      const pts = linjePkt(s0, s1, top, v.brudd)
      const ya = pts[pts.length - 1][1]
      const yb = pts[0][1]
      const skra = Math.abs(yb - ya) > 0.5 && pts.length === 2
      const ang = skra ? Math.abs(Math.atan((yb - ya) / (s1 - s0)) / RAD) : 0
      poly(
        km(navn, merknad ?? (skra ? `Toppkapp ${fmtGrader(ang)} (takfall).` : undefined), skra ? { endeB: { vinkel: ang, type: 'gjaering', merknad: 'toppkapp' }, ...ekstra } : ekstra),
        [[s0, y0], [s1, y0], ...pts],
        0,
        SB,
        ey,
      )
      vert.push({ s0, s1, y0, y1: Math.min(...pts.map((p) => p[1])) })
    }
    const opptatt: Array<[number, number]> = []
    const iApning = (c: number) => v.apninger.some((o) => c > o.x0 - o.nB * T - T - 5 && c < o.x1 + o.nB * T + T + 5)
    // Endestendere
    const endeNavn = v.ytter ? (v.rolle === 'gavl' ? 'Gavlstender' : 'Hjørnestender') : 'Stender'
    stav(endeNavn, 0, T, svTop, pb, v.ytter ? 'Danner hjørnet (L) sammen med naboveggens endestender.' : undefined)
    stav(endeNavn, v.len - T, v.len, svTop, pb, v.ytter ? 'Danner hjørnet (L) sammen med naboveggens endestender.' : undefined)
    opptatt.push([0, T], [v.len - T, v.len])
    // Åpninger
    for (const o of v.apninger) {
      const nB = o.nB
      for (let k = 0; k < nB; k++) {
        stav('Bærestender', o.x0 - (k + 1) * T, o.x0 - k * T, svTop, o.toppAbs, 'Bærer overliggeren.')
        stav('Bærestender', o.x1 + k * T, o.x1 + (k + 1) * T, svTop, o.toppAbs, 'Bærer overliggeren.')
      }
      opptatt.push([o.x0 - nB * T, o.x0], [o.x1, o.x1 + nB * T])
      if (o.karmV) {
        stav('Karmstender', o.x0 - nB * T - T, o.x0 - nB * T, svTop, pb, 'Gjennomgående ved siden av åpningen.')
        opptatt.push([o.x0 - nB * T - T, o.x0 - nB * T])
      }
      if (o.karmH) {
        stav('Karmstender', o.x1 + nB * T, o.x1 + nB * T + T, svTop, pb, 'Gjennomgående ved siden av åpningen.')
        opptatt.push([o.x1 + nB * T, o.x1 + nB * T + T])
      } else {
        // midtpost: karmstender mellom to delåpninger
        const nx = v.apninger.find((p) => p.x0 > o.x1 && p.x0 - o.x1 < 4 * T * 2 + T + 1)
        if (nx) {
          const c = (o.x1 + nB * T + nx.x0 - nx.nB * T) / 2
          stav('Karmstender', c - T / 2, c + T / 2, svTop, pb, 'Midtpost mellom to åpninger.')
          opptatt.push([c - T / 2, c + T / 2])
        }
      }
      // Overligger (dobbel, på høykant)
      const sa = o.x0 - nB * T
      const sb = o.x1 + nB * T
      for (const [t0, t1] of [[1, 1 + T], [1 + T, 1 + 2 * T]] as Array<[number, number]>) {
        rekt(
          { navn: pfx + 'Overligger', profil: `48 × ${o.hh} mm`, mat: `bjelke-48x${o.hh}`, part: 'konstruksjon', kategori: 'konstruksjon', gruppe: 'vegg', merknad: `Dobbel (2 stk) over ${o.navn.toLowerCase()} – spikres sammen, opplegg på bærestendere.` },
          sa,
          sb,
          o.toppAbs,
          o.toppAbs + o.hh,
          t0,
          t1,
        )
      }
      // Indre posisjoner (kortstendere / brystning)
      const inner: number[] = []
      const n = Math.ceil((o.x1 - o.x0) / 600 - 1e-9)
      for (let k = 1; k < n; k++) inner.push(o.x0 + (k * (o.x1 - o.x0)) / n)
      // Kortstendere over overligger
      const hTop = o.toppAbs + o.hh
      for (const c of [o.x0 - nB * T + T / 2, ...inner, o.x1 + nB * T - T / 2]) {
        const f = (s2: number) => pb(s2)
        if (Math.min(f(c - T / 2), f(c + T / 2)) - hTop > 100) stav('Kortstender', c - T / 2, c + T / 2, hTop, f, 'Over overliggeren.')
      }
      // Brystning
      if (o.bunnAbs > svTop + 60) {
        rekt(km('Brystningsrem', 'Underkant åpning. Mellom bærestenderne.'), o.x0, o.x1, o.bunnAbs - T, o.bunnAbs)
        for (const c of inner) stav('Brystningsstender', c - T / 2, c + T / 2, svTop, o.bunnAbs - T, 'Under brystningsremmen.')
        if (inner.length === 0 && o.x1 - o.x0 > 400) stav('Brystningsstender', (o.x0 + o.x1) / 2 - T / 2, (o.x0 + o.x1) / 2 + T / 2, svTop, o.bunnAbs - T)
      }
    }
    // Tvungne (skillevegg-tilslutning)
    for (const c of v.tvungne) {
      if (iApning(c) || opptatt.some(([p, q]) => c + T / 2 > p - 2 && c - T / 2 < q + 2)) continue
      stav(v.rolle === 'gavl' ? 'Gavlstender' : 'Stender, tilslutning', c - T / 2, c + T / 2, svTop, pb, v.rolle === 'gavl' ? (mDrager ? 'Dobbel stender under drageren.' : 'Under mønebordet (mønestender).') : 'Skilleveggen skrus til denne.')
      opptatt.push([c - T / 2, c + T / 2])
    }
    // Foretrukne (sperreposisjoner)
    for (const c of v.foretrukne) {
      if (iApning(c)) continue
      if (opptatt.some(([p, q]) => c + T / 2 > p - 5 && c - T / 2 < q + 5)) continue
      stav(v.rolle === 'gavl' ? 'Gavlstender' : 'Stender', c - T / 2, c + T / 2, svTop, pb, v.ytter && v.rolle !== 'gavl' ? 'c/c ≤ 600, rett under sperrene.' : undefined)
      opptatt.push([c - T / 2, c + T / 2])
    }
    // Fyll så c/c ≤ 600
    for (let pass = 0; pass < 3; pass++) {
      const sorted = [...opptatt].sort((p, q) => p[0] - q[0])
      for (let i = 0; i < sorted.length - 1; i++) {
        const c0 = (sorted[i][0] + sorted[i][1]) / 2
        const c1 = (sorted[i + 1][0] + sorted[i + 1][1]) / 2
        const mid = (sorted[i][1] + sorted[i + 1][0]) / 2
        if (v.apninger.some((o) => mid > o.x0 - o.nB * T - T && mid < o.x1 + o.nB * T + T)) continue
        if (c1 - c0 <= 600 + 0.5) continue
        const n = Math.ceil((c1 - c0) / 600 - 1e-9)
        for (let k = 1; k < n; k++) {
          const c = c0 + (k * (c1 - c0)) / n
          stav(v.rolle === 'gavl' ? 'Gavlstender' : 'Stender', c - T / 2, c + T / 2, svTop, pb, v.ytter && v.rolle !== 'gavl' ? 'c/c ≤ 600, rett under sperrene.' : undefined)
          opptatt.push([c - T / 2, c + T / 2])
        }
      }
    }
    // Losholter c/c 600 (spikerslag for stående kledning)
    for (let y = svTop + 600 - T / 2; ; y += 600) {
      const dekk = vert.filter((m) => m.y0 <= y + 1 && m.y1 >= y + T + 40).sort((p, q) => p.s0 - q.s0)
      if (dekk.length < 2) break
      let lagt = false
      for (let i = 0; i < dekk.length - 1; i++) {
        const s0 = dekk[i].s1
        const s1 = dekk[i + 1].s0
        if (s1 - s0 < 100) continue
        if (Math.min(pb(s0), pb(s1), ...v.brudd.filter((b) => b > s0 && b < s1).map((b) => pb(b))) < y + T + 10) continue
        const mid = (s0 + s1) / 2
        if (v.apninger.some((o) => mid > o.x0 - 1 && mid < o.x1 + 1 && y + T > o.bunnAbs - T - 1 && y < o.toppAbs + o.hh + 1)) continue
        if (v.apninger.some((o) => mid > o.x0 - o.nB * T && mid < o.x1 + o.nB * T && y + T > o.toppAbs && y < o.toppAbs + o.hh)) continue
        rekt(km('Losholt', 'Spikerslag for kledningen. Rett kapp, innfelt mellom stenderne.'), s0, s1, y, y + T)
        lagt = true
      }
      if (!lagt && y > Math.max(yP, yC) + 3000) break
    }
  }
  for (const v of vegger) byggVegg(v)

  // ════════════════════════════════════════════════════════════════
  // TAK (tak-ramme-koordinater)
  // ════════════════════════════════════════════════════════════════
  /** Stikkerne i gavlstigen – senterposisjoner langs u, holdt innenfor sperreendene/mønet. */
  const stikkerU = (xEnd: number) => {
    const fra = -ohU + 24 * cos + 2
    const til = xEnd - 24 * cos - SB * Math.sin(ar) - 2
    const n = Math.max(2, Math.ceil((til - fra) / 600 - 1e-9) + 1)
    const res: number[] = []
    for (let k = 0; k < n; k++) res.push(fra + (k * (til - fra)) / (n - 1))
    return res
  }
  /** Sperrebind: på toppsvillen, endene skråkappet i takfallet. */
  const cA = yP - seat * tan + h / cos - 3
  const cC = yP + (L - seat) * tan + h / cos - 3
  const bindTopp = (ht: number) => (u: number) => Math.min(yP + ht, cA + tan * u, cC - tan * u)
  const bindProfil = (ht: number) => {
    const f = bindTopp(ht)
    const uk = (yP + ht - cA) / tan
    const brudd = [uk, L - uk, L / 2].filter((u) => u > 0.5 && u < L - 0.5)
    const p: P2[] = [[0, yP], [L, yP], ...linjePkt(0, L, f, brudd)]
    return { p, skraa: f(0) < yP + ht - 0.5 }
  }
  /** Mønebord (v, y) med utsparing i underkant der sperrebindene går under. */
  const moneProfil = (va: number, vb: number, top: number, binds: Array<[number, number]>, ht: number): P2[] => {
    const bot = top - hb
    const opp = bindTopp(ht)(L / 2 - 24) + 3
    const pts: P2[] = [[va, bot]]
    if (opp > bot + 1) {
      for (const [b0, b1] of [...binds].sort((p, q) => p[0] - q[0])) {
        if (b1 < va || b0 > vb) continue
        pts.push([b0 - 2, bot], [b0 - 2, Math.min(opp, top - 20)], [b1 + 2, Math.min(opp, top - 20)], [b1 + 2, bot])
      }
    }
    pts.push([vb, bot], [vb, top], [va, top])
    return pts
  }
  const ex: V3 = [1, 0, 0]
  const ey: V3 = [0, 1, 0]
  const ez: V3 = [0, 0, 1]
  const sperreAkse = (dir: V3): V3 => norm(add(mul(dir, cos), [0, Math.sin(ar), 0]))
  const tm = (navn: string, profil: string, mat: string, ekstra: Partial<Meta> = {}): Meta => ({ navn, profil, mat, part: 'konstruksjon', kategori: 'tak', gruppe: 'tak', ...ekstra })
  const spProfil = `48 × ${h} mm`
  const spMat = `bjelke-48x${h}`
  const fmLodd: KappEnde = { vinkel: a, type: 'gjaering', merknad: 'loddkutt' }
  const fuglemunnTekst = (g: SperreGeometri) =>
    `Fuglemunn: sete ${Math.round(g.fuglemunn.seteMm)} mm, hæl ${Math.round(g.fuglemunn.haelMm)} mm (dybde ${Math.round(g.fuglemunn.dybdeMm)} ≤ h/3 = ${Math.round(g.fuglemunn.maksDybdeMm)} mm). Kutt: loddkutt ${fmtGrader(a)}, setekutt ${fmtGrader(90 - a)}.`
  const yOff = (pts: Array<[number, number]>, dy = yP): P2[] => pts.map(([x, y]) => [x, y + dy] as P2)
  const sperreProfil = (g: SperreGeometri) => yOff(g.omriss)
  // Sperre i u-retning ved v (side A, eller C speilet)
  const leggSperre = (navn: string, g: SperreGeometri, v: number, speil: boolean, merknad: string, endeB: KappEnde, trim?: Plan[]) => {
    const O3: V3 = speil ? [L, 0, 0] : [0, 0, 0]
    const ex2: V3 = speil ? [-1, 0, 0] : ex
    const pr = prisme(O3, ex2, ey, ez, sperreProfil(g), v - T / 2, v + T / 2)
    const ak = sperreAkse(ex2)
    for (const p of trim ?? []) trimTilPlan(pr, 'maks', p, ak)
    takFot.push(fotavtrykk(pr))
    return legg(tm(navn, spProfil, spMat, { endeA: fmLodd, endeB, merknad }), pr, ak)
  }
  // Sperre i v-retning ved u (valmende)
  const leggSperreV = (navn: string, g: SperreGeometri, u: number, vSide: -1 | 1, merknad: string, endeB: KappEnde, trim?: Plan[]) => {
    const O3: V3 = [0, 0, vSide * (M / 2)]
    const ex2: V3 = [0, 0, -vSide]
    const pr = prisme(O3, ex2, ey, ex, sperreProfil(g), u - T / 2, u + T / 2)
    const ak = sperreAkse(ex2)
    for (const p of trim ?? []) trimTilPlan(pr, 'maks', p, ak)
    takFot.push(fotavtrykk(pr))
    return legg(tm(navn, spProfil, spMat, { endeA: fmLodd, endeB, merknad }), pr, ak)
  }
  const plan = (n: V3, d: number): Plan => ({ n, d })
  /** Plan langs grat-sidens flate: behold sperrens side, `off` fra senterlinja. */
  const gratSidePlan = (C: [number, number], dir: [number, number], ref: [number, number], off: number): Plan => {
    const nh: [number, number] = [dir[1], -dir[0]]
    const sd = nh[0] * (ref[0] - C[0]) + nh[1] * (ref[1] - C[1])
    const sign = sd < 0 ? -1 : 1
    const n: V3 = [-sign * nh[0], 0, -sign * nh[1]]
    return plan(n, n[0] * C[0] + n[2] * C[1] - off)
  }
  const plateY = (u: number, v: number) => {
    // Sutakets underkant (= sperrenes overkant) over (u, v) – relativt yP.
    if (inn.taktype === 'pulttak') return topp(u)
    if (inn.taktype === 'saltak') return Math.min(topp(u), topp(L - u))
    return Math.min(topp(u), topp(L - u), topp(v + M / 2), topp(M / 2 - v))
  }
  const takflate = (navn: string, profil: string, mat: string, polyUV: P2[], yb: (u: number, v: number) => number, t: number, farge: number | undefined, part: string, merk?: string) => {
    const tv = t / cos
    const a3: V3[] = polyUV.map(([u, v]) => [u, yP + yb(u, v), v])
    const b3: V3[] = a3.map((p) => [p[0], p[1] + tv, p[2]])
    let ar2 = 0
    for (let i = 0; i < polyUV.length; i++) {
      const p = polyUV[i]
      const q = polyUV[(i + 1) % polyUV.length]
      ar2 += p[0] * q[1] - q[0] * p[1]
    }
    const m2 = Math.abs(ar2) / 2 / 1e6 / cos
    const g: Prisme = { type: 'prisme', a: a3, b: b3, p2: polyUV, ytre: polyUV.length }
    legg({ navn, profil, mat, part, kategori: 'tak', gruppe: 'tekking', tre: false, farge, m2, merknad: merk }, g, [1, 0, 0])
  }

  // Vannbord-/vindski-dimensjoner
  const hv = finnStd(h / cos + 2)
  const hvv = finnStd(h + 20)
  const vbMeta = (navn: string, hh: number, merknad: string, ekstra: Partial<Meta> = {}): Meta => ({ navn, profil: `19 × ${hh} mm`, mat: bordMat(hh), part: 'tak', kategori: 'tak', gruppe: 'tekking', merknad, ...ekstra })
  const e = ohU + 19

  let beta: number | undefined
  let valmG: ValmGeometri | undefined
  let grat: Dimensjonering | undefined
  let hg: number | undefined
  let tg: number | undefined

  const moneTop = yP + (inn.taktype === 'pulttak' ? topp(L + ohU) : topp(L / 2))

  if (inn.taktype === 'pulttak' || inn.taktype === 'saltak') {
    const pult = inn.taktype === 'pulttak'
    // Sperrer
    sperreV.forEach((v, i) => {
      const gavl = i === 0 || i === sperreV.length - 1
      const mTxt = fuglemunnTekst(sg) + (pult ? ' Fuglemunn på begge vegger.' : '') + (gavl ? ' Ytterste sperre står på gavlveggens skrå toppsvill.' : '')
      if (pult) leggSperre('Sperre', sg, v, false, mTxt, fmLodd)
      else {
        leggSperre('Sperre', sg, v, false, mTxt, { vinkel: a, type: 'gjaering', merknad: 'loddkutt mot mønebord' })
        leggSperre('Sperre', sg, v, true, mTxt, { vinkel: a, type: 'gjaering', merknad: 'loddkutt mot mønebord' })
      }
    })
    // Gavlsperrer (i utstikket) – rett underkant, båret av gavlstigen
    const xEnd = pult ? L + ohU : L / 2 - 24
    const band = (x0: number, x1: number, hh: number): P2[] => [
      [x0, yP + topp(x0)],
      [x1, yP + topp(x1)],
      [x1, yP + topp(x1) - hh / cos],
      [x0, yP + topp(x0) - hh / cos],
    ]
    const vg = M / 2 + gOh - T / 2
    for (const sv of [-1, 1]) {
      const sider = pult ? [false] : [false, true]
      for (const speil of sider) {
        const O3: V3 = speil ? [L, 0, 0] : [0, 0, 0]
        const ex2: V3 = speil ? [-1, 0, 0] : ex
        const pr = prisme(O3, ex2, ey, ez, band(-ohU, xEnd, h), sv * vg - T / 2, sv * vg + T / 2)
        takFot.push(fotavtrykk(pr))
        legg(tm('Gavlsperre', spProfil, spMat, { endeA: fmLodd, endeB: fmLodd, merknad: 'Ytterst i gavlutstikket, uten fuglemunn – bæres av stikkerne i gavlstigen.' }), pr, sperreAkse(ex2))
        // Stikkere (gavlstige)
        const v0 = sv > 0 ? M / 2 : -(M / 2 + gOh - T)
        const v1 = sv > 0 ? M / 2 + gOh - T : -M / 2
        if (v1 - v0 > 20) {
          for (const uc of stikkerU(xEnd)) {
            const Tt: P2 = [uc, yP + topp(uc)]
            const av: P2 = [cos, Math.sin(ar)]
            const nv: P2 = [-Math.sin(ar), cos]
            const pts: P2[] = [
              [Tt[0] - av[0] * 24, Tt[1] - av[1] * 24],
              [Tt[0] + av[0] * 24, Tt[1] + av[1] * 24],
              [Tt[0] + av[0] * 24 - nv[0] * SB, Tt[1] + av[1] * 24 - nv[1] * SB],
              [Tt[0] - av[0] * 24 - nv[0] * SB, Tt[1] - av[1] * 24 - nv[1] * SB],
            ]
            const pr2 = prisme(O3, ex2, ey, ez, pts, v0, v1)
            legg(tm('Stikker (gavlstige)', KV, KVMAT, { merknad: 'Rett kapp. Spikres mellom ytterste sperre og gavlsperra, overkant i flukt med sperrene.' }), pr2, ez)
          }
        }
        // Vindski
        const xa = -e
        const xb = pult ? L + e : L / 2
        const pv = prisme(O3, ex2, ey, ez, band(xa, xb, hvv), sv > 0 ? M / 2 + gOh : -(M / 2 + gOh + 19), sv > 0 ? M / 2 + gOh + 19 : -(M / 2 + gOh))
        legg(vbMeta('Vindski', hvv, pult ? `Følger takfallet. Loddkutt ${fmtGrader(a)} i begge ender.` : `Loddkutt ${fmtGrader(a)}; møtes i mønet.`, { endeA: fmLodd, endeB: fmLodd }), pv, sperreAkse(ex2))
      }
    }
    // Vannbord
    const vbLen = M / 2 + gOh
    const vannbord = (u0: number, u1: number, top: number, navn: string) => {
      const g = boks([u0, top - hv, -vbLen], [u1, top, vbLen])
      legg(vbMeta(navn, hv, 'Spikres i sperreendene (loddkutt). Overkant i flukt med sperrene.'), g, ez)
    }
    vannbord(-e, -ohU, yP + topp(-e), 'Vannbord')
    if (pult) vannbord(L + ohU, L + e, yP + topp(L + ohU), 'Vannbord')
    else vannbord(L + ohU, L + e, yP + topp(-e), 'Vannbord')
    // Drager under sperrene (pulttak med langt fall)
    if (mDrager) {
      for (let k = 0; k < mDrager.valgt.antall; k++) {
        const ua2 = dU0 + k * T
        const ub2 = ua2 + T
        const p: P2[] = [[ua2, yP + dBot], [ub2, yP + dBot], [ub2, yP + bunn(ub2)], [ua2, yP + bunn(ua2)]]
        const pr = prisme([0, 0, 0], ex, ey, ez, p, -M / 2, M / 2)
        takFot.push(fotavtrykk(pr))
        legg(tm('Drager under sperrene', `48 × ${mDrager.valgt.h} mm`, `bjelke-48x${mDrager.valgt.h}`, { merknad: `${mDrager.valgt.antall > 1 ? 'Dobbel (2 stk). ' : ''}Overkant skråhøvles/-kappes ${fmtGrader(a)} så sperrene ligger an i hele bredden. Opplegg på dobbel stender i gavlveggene.` }), pr, ez)
      }
    }
    // Mønebord + sperrebind (saltak)
    if (!pult) {
      const top = yP + topp(L / 2 - 24)
      const ht = L > 3600 ? 148 : 98
      const binds = sperreV.slice(1, -1).map((v) => {
        const sd = v < 0 ? 1 : -1
        const v0 = v + sd * (T / 2)
        return [Math.min(v0, v0 + sd * T), Math.max(v0, v0 + sd * T)] as [number, number]
      })
      const g = prisme([0, 0, 0], ez, ey, ex, moneProfil(-vbLen, vbLen, top, binds, ht), L / 2 - 24, L / 2 + 24)
      const hakk = bindTopp(ht)(L / 2 - 24) + 3 > top - hb + 1
      legg(tm('Mønebord', `48 × ${hb} mm`, `bjelke-48x${hb}`, { merknad: `Sperrene spikres parvis mot mønebordet. Bæres av mønestender i gavlene.${hakk ? ' Utsparing i underkant for sperrebindene.' : ''}` }), g, ez)
      sperreV.forEach((v, i) => {
        if (i === 0 || i === sperreV.length - 1) return
        const side = v < 0 ? 1 : -1
        const { p, skraa } = bindProfil(ht)
        const v0 = v + side * (T / 2)
        const pr = prisme([0, 0, 0], ex, ey, ez, p, Math.min(v0, v0 + side * T), Math.max(v0, v0 + side * T))
        takFot.push(fotavtrykk(pr))
        legg(tm('Sperrebind', `48 × ${ht} mm`, `bjelke-48x${ht}`, { merknad: `Bindbjelke på toppsvillen, spikres til sperra (tar skyvekraften).${skraa ? ` Endene skråkappes ${fmtGrader(a)} i takfallet.` : ''}`, endeA: skraa ? { vinkel: a, type: 'gjaering' } : undefined, endeB: skraa ? { vinkel: a, type: 'gjaering' } : undefined }), pr, ex)
      })
    }
    // Sutak + takpapp
    const Vg = M / 2 + gOh + 19
    const faces: Array<{ poly: P2[] }> = pult
      ? [{ poly: [[-e, -Vg], [L + e, -Vg], [L + e, Vg], [-e, Vg]] }]
      : [{ poly: [[-e, -Vg], [L / 2, -Vg], [L / 2, Vg], [-e, Vg]] }, { poly: [[L / 2, -Vg], [L + e, -Vg], [L + e, Vg], [L / 2, Vg]] }]
    faces.forEach((f) => {
      takflate('Sutak, 18 mm kryssfiner', '18 mm', 'kryssfiner-18', f.poly, plateY, 18, undefined, 'tak', 'Skrus til sperrene c/c 150 i kant, 300 i felt. Plateskjøter på sperre.')
      if (inn.takpapp) takflate('Takpapp (2-lags)', '', 'taktekke-takpapp', f.poly, (u, v) => plateY(u, v) + 18 / cos, 4, 0x2a2c2e, 'tak', 'Underlag + overlag, klemt med takpappspiker. Brettes over vannbord og vindski.')
    })
  } else {
    // ── VALMTAK ──
    valmG = valmGeometri({ vinkelGrader: a, lopMm: L / 2, ccMm: 600, gratTykkelseMm: 48, utstikkMm: ohU })
    beta = valmG.gratVinkelGrader
    const tb = Math.tan(beta * RAD)
    const cb = Math.cos(beta * RAD)
    // Grat-dimensjon
    const lop = L / 2
    const sr = SB * sq2 + 24
    const gratKand = [...[98, 148, 198, 223].map((x) => tverrsnitt(48, x, 1, 'C24', `bjelke-48x${x}`)), ...DOBLE_C24.filter((d) => d.antall === 2)]
    const hgMin = (tgx: number) => {
      const senk = (tgx / 2) * tb
      return Math.max(h + 48, (topp(sr / sq2) - senk) * cb + 10)
    }
    grat = dimensjonerDrager({ spennM: (lop * sq2) / 1000, lastbreddeM: (0.4 * lop) / 1000, flatelaster: tl, sidestottet: true, opplegglengdeMm: 98, nedboyning: 'tak', kandidater: gratKand.filter((k) => k.h >= hgMin(k.antall * 48) - 0.5) })
    grat.kontroll.navn = 'Gratsperre'
    if (!grat.ok) advarsler.push(`Gratsperre: ${grat.melding}`)
    hg = grat.valgt.h
    tg = grat.valgt.antall * 48
    const senk = (tg / 2) * tb
    const gratProfil = `48 × ${hg} mm`
    // Sperrer
    const sgK = harMone ? sg : sperreGeometri({ vinkelGrader: a, sperreHoydeMm: h, svillBreddeMm: SB, utstikkMm: ohU, topp: { type: 'mone', lopMm: L / 2, moneTykkelseMm: 98 } })
    for (const v of vanlige) {
      const mTxt = fuglemunnTekst(sgK)
      leggSperre('Sperre', sgK, v, false, mTxt, { vinkel: a, type: 'gjaering', merknad: harMone ? 'loddkutt mot mønebord' : 'loddkutt mot toppkloss' })
      leggSperre('Sperre', sgK, v, true, mTxt, { vinkel: a, type: 'gjaering', merknad: harMone ? 'loddkutt mot mønebord' : 'loddkutt mot toppkloss' })
    }
    // Valmsperrer
    const sgV = sperreGeometri({ vinkelGrader: a, sperreHoydeMm: h, svillBreddeMm: SB, utstikkMm: ohU, topp: { type: 'mone', lopMm: L / 2, moneTykkelseMm: 2 * (vEnd - vR) + 48 } })
    for (const vs of [-1, 1] as const) leggSperreV('Valmsperre', sgV, L / 2, vs, fuglemunnTekst(sgV) + ' Midt på valmenden; toppen stopper 24 mm før mønet der gratene møtes.', { vinkel: a, type: 'gjaering', merknad: harMone ? 'loddkutt mot mønebordets ende' : 'loddkutt mot toppkloss' })
    // Grater
    const kinnG = valmG.gratKinnkutt
    const hjorner: Array<[number, number]> = [[0, -M / 2], [L, -M / 2], [0, M / 2], [L, M / 2]]
    const Ytop = (s: number) => yP + topp(s / sq2)
    for (const [u0, v0] of hjorner) {
      const du = u0 === 0 ? 1 : -1
      const dv = v0 < 0 ? 1 : -1
      const exG: V3 = [du / sq2, 0, dv / sq2]
      const ezG: V3 = [-dv / sq2, 0, du / sq2]
      const sTail = -ohU * sq2 + tg / 2
      const sTop = lop * sq2 + 60
      const Tl = (s: number) => Ytop(s) - senk
      const Bn = (s: number) => Tl(s) - hg! / cb
      const cp = (s: number) => yP + (s / sq2 - seat) * tan + senk + 3
      const prof: P2[] = [[sTail, Tl(sTail)], [sTop, Tl(sTop)], [sTop, Bn(sTop)]]
      if (Bn(sr) < yP - 1) prof.push([sr, Bn(sr)])
      prof.push([sr, yP], [0, yP])
      if (cp(0) < yP - 1) prof.push([0, cp(0)])
      prof.push([sTail, Math.min(cp(sTail), Tl(sTail) - 20)])
      const ak = norm(add(exG, [0, tb, 0]))
      for (let k = 0; k < grat.valgt.antall; k++) {
        const pr = prisme([u0, 0, v0], exG, ey, ezG, prof, -tg / 2 + k * T, -tg / 2 + (k + 1) * T)
        trimTilPlan(pr, 'maks', plan(v0 < 0 ? [0, 0, 1] : [0, 0, -1], -vEnd), ak)
        trimTilPlan(pr, 'maks', plan(u0 === 0 ? [1, 0, 0] : [-1, 0, 0], u0 === 0 ? L / 2 - hw : -(L / 2 + hw)), ak)
        takFot.push(fotavtrykk(pr))
        legg(
          tm('Gratsperre', gratProfil, `bjelke-48x${hg}`, {
            endeA: { vinkel: beta, type: 'gjaering', merknad: 'loddkutt grat' },
            endeB: { vinkel: beta, type: 'gjaering', merknad: `kinnkutt (skråsnitt ${fmtGrader(kinnG.skraasnittGrader)})` },
            merknad: `Gratvinkel ${fmtGrader(beta)}. Senkes ${Math.round(senk)} mm (overkant under takflatene). Fuglemunn på hjørnet av toppsvillene${grat.valgt.antall > 1 ? '. DOBBEL: to stk spikres sammen.' : ''}. Kinnkutt på overkant ${fmtGrader(kinnG.overkantGrader)}.`,
            p: 'grat',
          }),
          pr,
          ak,
        )
      }
    }
    // Skiftesperrer
    const kinnS = valmG.skiftesperreKinnkutt
    const skifteEnde: KappEnde = { vinkel: a, type: 'gjaering', merknad: `kinnkutt mot grat (skråsnitt ${fmtGrader(kinnS.skraasnittGrader)})` }
    const skMerk = (d: number) => `Skiftesperre: løp ${Math.round(d)} mm til gratens senterlinje. Fuglemunn som vanlige sperrer. Kinnkutt på overkant ${fmtGrader(kinnS.overkantGrader)}.`
    for (const d of skifteAok) {
      for (const [u0, v0] of hjorner) {
        const du = u0 === 0 ? 1 : -1
        const dv = v0 < 0 ? 1 : -1
        const vj = v0 + dv * d
        const gj = sperreGeometri({ vinkelGrader: a, sperreHoydeMm: h, svillBreddeMm: SB, utstikkMm: ohU, topp: { type: 'mone', lopMm: d, moneTykkelseMm: 0 } })
        const pl = gratSidePlan([u0, v0], [du / sq2, dv / sq2], [u0, vj], tg / 2)
        leggSperre('Skiftesperre', gj, vj, u0 !== 0, skMerk(d), skifteEnde, [pl])
      }
    }
    for (const d of skifteEok) {
      for (const [u0, v0] of hjorner) {
        const du = u0 === 0 ? 1 : -1
        const dv = v0 < 0 ? 1 : -1
        const uj = u0 + du * d
        const gj = sperreGeometri({ vinkelGrader: a, sperreHoydeMm: h, svillBreddeMm: SB, utstikkMm: ohU, topp: { type: 'mone', lopMm: d, moneTykkelseMm: 0 } })
        const pl = gratSidePlan([u0, v0], [du / sq2, dv / sq2], [uj, v0], tg / 2)
        leggSperreV('Skiftesperre', gj, uj, v0 < 0 ? -1 : 1, skMerk(d), skifteEnde, [pl])
      }
    }
    // Mønebord / toppkloss
    if (harMone) {
      const top = yP + topp(L / 2 - 24)
      const ht = L > 3600 ? 148 : 98
      const binds = vanlige.map((v) => {
        const sd = v <= 0 ? 1 : -1
        const v0 = v + sd * (T / 2)
        return [Math.min(v0, v0 + sd * T), Math.max(v0, v0 + sd * T)] as [number, number]
      })
      const g = prisme([0, 0, 0], ez, ey, ex, moneProfil(-vR, vR, top, binds, ht), L / 2 - 24, L / 2 + 24)
      legg(tm('Mønebord', `48 × ${hb} mm`, `bjelke-48x${hb}`, { merknad: 'Sperrene spikres parvis mot mønebordet; valmsperrer og grater mot endene.' }), g, ez)
      // Sperrebind på de vanlige sperrene
      vanlige.forEach((v) => {
        const side = v <= 0 ? 1 : -1
        const { p, skraa } = bindProfil(ht)
        const v0 = v + side * (T / 2)
        const pr = prisme([0, 0, 0], ex, ey, ez, p, Math.min(v0, v0 + side * T), Math.max(v0, v0 + side * T))
        takFot.push(fotavtrykk(pr))
        legg(tm('Sperrebind', `48 × ${ht} mm`, `bjelke-48x${ht}`, { merknad: `Bindbjelke på toppsvillen, spikres til sperra.${skraa ? ` Endene skråkappes ${fmtGrader(a)}.` : ''}`, endeA: skraa ? { vinkel: a, type: 'gjaering' } : undefined, endeB: skraa ? { vinkel: a, type: 'gjaering' } : undefined }), pr, ex)
      })
    } else {
      const top = yP + topp(L / 2 - 49)
      const hk = rundOppKapp(Math.max(hg / cb, h / cos, 2 * vEnd + 30) + 40)
      const kort = vEnd <= 49.5
      legg(tm('Toppkloss', kort ? '98 × 98 mm' : `98 × ${Math.round(2 * vEnd)} mm`, 'stolpe-98x98', { merknad: kort ? 'Loddrett kloss i toppen der gratene og valmsperrene møtes.' : 'Loddrett kloss (2 × 48 mm skrudd sammen) under det korte mønet; gratene og valmsperrene møtes her.' }), boks([L / 2 - 49, top - hk, -vEnd], [L / 2 + 49, top, vEnd]), ey)
    }
    // Vannbord (gjæret 45° i hjørnene)
    const top = yP + topp(-e)
    const mitre = (Pc: [number, number], Pi: [number, number], inni: [number, number]): Plan => {
      const d: [number, number] = [Pi[0] - Pc[0], Pi[1] - Pc[1]]
      const nh: [number, number] = [d[1], -d[0]]
      const sgn = nh[0] * (inni[0] - Pc[0]) + nh[1] * (inni[1] - Pc[1]) > 0 ? -1 : 1
      const n: V3 = [sgn * nh[0], 0, sgn * nh[1]]
      return plan(n, n[0] * Pc[0] + n[2] * Pc[1])
    }
    const Vy = M / 2 + e
    const lang = (uo: number, ui: number) => {
      const g = prisme([0, 0, 0], ez, ey, ex, [[-Vy, top - hv], [Vy, top - hv], [Vy, top], [-Vy, top]], Math.min(uo, ui), Math.max(uo, ui))
      const inni: [number, number] = [(uo + ui) / 2, 0]
      trimAlle(g, mitre([uo, -Vy], [ui, -(M / 2 + ohU)], inni), ez)
      trimAlle(g, mitre([uo, Vy], [ui, M / 2 + ohU], inni), [0, 0, -1])
      legg(vbMeta('Vannbord', hv, 'Gjæres 45° i hjørnene. Overkant i flukt med sperrene.', { endeA: { vinkel: 45, type: 'fas', merknad: 'gjæring 45°' }, endeB: { vinkel: 45, type: 'fas', merknad: 'gjæring 45°' } }), g, ez)
    }
    lang(-e, -ohU)
    lang(L + e, L + ohU)
    const ende = (vo: number, vi: number) => {
      const Uy = L / 2 + e
      const g = prisme([L / 2, 0, 0], ex, ey, ez, [[-Uy, top - hv], [Uy, top - hv], [Uy, top], [-Uy, top]], Math.min(vo, vi), Math.max(vo, vi))
      const inni: [number, number] = [L / 2, (vo + vi) / 2]
      trimAlle(g, mitre([-e, vo], [-ohU, vi], inni), [1, 0, 0])
      trimAlle(g, mitre([L + e, vo], [L + ohU, vi], inni), [-1, 0, 0])
      legg(vbMeta('Vannbord', hv, 'Gjæres 45° i hjørnene. Overkant i flukt med sperrene.', { endeA: { vinkel: 45, type: 'fas', merknad: 'gjæring 45°' }, endeB: { vinkel: 45, type: 'fas', merknad: 'gjæring 45°' } }), g, ex)
    }
    ende(-(M / 2 + e), -(M / 2 + ohU))
    ende(M / 2 + e, M / 2 + ohU)
    // Sutak + papp (4 flater)
    const fl: P2[][] = [
      [[-e, -M / 2 - e], [L / 2, -vR], [L / 2, vR], [-e, M / 2 + e]],
      [[L + e, M / 2 + e], [L / 2, vR], [L / 2, -vR], [L + e, -M / 2 - e]],
      [[L + e, -M / 2 - e], [L / 2, -vR], [-e, -M / 2 - e]],
      [[-e, M / 2 + e], [L / 2, vR], [L + e, M / 2 + e]],
    ].map((p) => p.filter((q, i, arr) => i === 0 || Math.hypot(q[0] - arr[i - 1][0], q[1] - arr[i - 1][1]) > 0.5) as P2[])
    const flY = [(u: number) => topp(u), (u: number) => topp(L - u), (_u: number, v: number) => topp(v + M / 2), (_u: number, v: number) => topp(M / 2 - v)]
    fl.forEach((p, i) => {
      takflate('Sutak, 18 mm kryssfiner', '18 mm', 'kryssfiner-18', p, flY[i], 18, undefined, 'tak', 'Kappes langs grat og møne. Skrus c/c 150/300.')
      if (inn.takpapp) takflate('Takpapp (2-lags)', '', 'taktekke-takpapp', p, (u, v) => flY[i](u, v) + 18 / cos, 4, 0x2a2c2e, 'tak', 'Underlag + overlag; ekstra strimmel over grater og møne.')
    })
  }

  // ════════════════════════════════════════════════════════════════
  // KLEDNING, LUFTING, ÅPNINGER, DØRER
  // ════════════════════════════════════════════════════════════════
  const takfotTopp = (rolle: Vegg['rolle'], t: number) => {
    // laveste sperre-underkant i planet t mm utenfor veggen
    if (rolle === 'takfotC' && inn.taktype === 'pulttak') return yP + bunn(L + t)
    return yP + bunn(-t)
  }
  // Hindringer i gavlplanet (stikkere + mønebord) i (u, y)
  const gavlHindringer: P2[][] = []
  if (!valm) {
    const pult = inn.taktype === 'pulttak'
    const xEnd = pult ? L + ohU : L / 2 - 24
    const sidene = pult ? [false] : [false, true]
    for (const speil of sidene) {
      for (const uc0 of stikkerU(xEnd)) {
        const Tt: P2 = [uc0, yP + topp(uc0)]
        const av: P2 = [cos, Math.sin(ar)]
        const nv: P2 = [-Math.sin(ar), cos]
        let pts: P2[] = [
          [Tt[0] - av[0] * 24, Tt[1] - av[1] * 24],
          [Tt[0] + av[0] * 24, Tt[1] + av[1] * 24],
          [Tt[0] + av[0] * 24 - nv[0] * SB, Tt[1] + av[1] * 24 - nv[1] * SB],
          [Tt[0] - av[0] * 24 - nv[0] * SB, Tt[1] - av[1] * 24 - nv[1] * SB],
        ]
        if (speil) pts = pts.map(([x, y]) => [L - x, y] as P2)
        gavlHindringer.push(pts)
      }
    }
    if (!pult) {
      const top = yP + topp(L / 2 - 24)
      gavlHindringer.push([[L / 2 - 24, top - hb], [L / 2 + 24, top - hb], [L / 2 + 24, top], [L / 2 - 24, top]])
    }
  }
  const nettDeler: Array<{ v: Vegg; s0: number; s1: number; y0: number; y1: number }> = []
  const kledVegg = (v: Vegg) => {
    const O3: V3 = [v.start[0], 0, v.start[1]]
    const exw: V3 = [v.dir[0], 0, v.dir[1]]
    const ezw: V3 = [v.nrm[0], 0, v.nrm[1]]
    const erTakfot = v.rolle !== 'gavl'
    const run: [number, number] = v.rolle === 'takfotA' || v.rolle === 'takfotC' ? [-kt, v.len + kt] : [-SB, v.len + SB]
    // u for s (gavl/valmende): u = s + SB
    const takFn = (lagT1: number, lagT0: number) => {
      if (erTakfot) {
        const y = takfotTopp(v.rolle, v.rolle === 'takfotC' && inn.taktype === 'pulttak' ? lagT0 : lagT1) - 10
        return { tak: () => y, hind: [] as P2[][] }
      }
      return { tak: (s: number) => yP + Math.min(plateY(s + SB, 0), inn.taktype === 'saltak' ? topp(L - s - SB) : Infinity) - 10, hind: gavlHindringer.map((p) => p.map(([u, y]) => [u - SB, y] as P2)) }
    }
    const aps = [...v.apninger].sort((p, q) => p.x0 - q.x0)
    const segs: Array<{ a: number; b: number; ap?: ApningR }> = []
    let cur = run[0]
    for (const o of aps) {
      if (o.x0 > cur) segs.push({ a: cur, b: o.x0 })
      segs.push({ a: o.x0, b: o.x1, ap: o })
      cur = o.x1
    }
    if (run[1] > cur) segs.push({ a: cur, b: run[1] })
    for (const lag of ks.lag) {
      const { tak, hind } = takFn(lag.t1, lag.t0)
      const lagBord = (s0: number, s1: number, yb: number, ytFlat?: number, merk?: string) => {
        let top: P2[]
        if (ytFlat !== undefined) top = [[s1, ytFlat], [s0, ytFlat]]
        else top = overkant(s0, s1, tak, hind, 8)
        if (Math.min(...top.map((p) => p[1])) - yb < 25) return
        const ripp = s1 - s0 < lag.w - 1
        const ang = top.length === 2 ? Math.abs(Math.atan((top[0][1] - top[1][1]) / (s1 - s0)) / RAD) : 0
        const notch = top.length > 2
        const merknad = [merk, ripp ? `Rippes til ${Math.round(s1 - s0)} mm.` : undefined, ang > 0.2 ? `Toppkapp ${fmtGrader(ang)} (takfall).` : undefined, notch ? 'Utsparing for stikker/mønebord – merk av på stedet.' : undefined].filter(Boolean).join(' ') || undefined
        const pr = prisme(O3, exw, ey, ezw, [[s0, yb], [s1, yb], ...top], -lag.t1, -lag.t0)
        legg({ navn: lag.navn, profil: lag.profil, mat: lag.mat, part: 'kledning', kategori: 'kledning', gruppe: 'kledning', merknad, endeB: ang > 0.2 ? { vinkel: ang, type: 'gjaering' } : undefined, kvalitet: 'Kledningsbord' }, pr, ey)
      }
      for (const sg2 of segs) {
        let bord: Array<[number, number]>
        if (ks.type === 'tommermann' && lag.t0 > 0) {
          const under = fordelBord(sg2.a, sg2.b, ks.lag[0].w, ks.lag[0].gap)
          bord = []
          for (let i = 0; i < under.length - 1; i++) {
            const c = (under[i][1] + under[i + 1][0]) / 2
            bord.push([c - lag.w / 2, c + lag.w / 2])
          }
        } else bord = fordelBord(sg2.a, sg2.b, lag.w, lag.gap)
        // Lave felt over/under en åpning kles med liggende bord (overstykke).
        let horisO = false
        let horisU = false
        const forsteLag = lag === ks.lag[0]
        const liggende = (y0: number, y1: number, navn: string) => {
          if (!forsteLag) return
          const hh = Math.min(y1 - y0, ks.lag[0].w)
          if (hh < 15) return
          const merk = hh < ks.lag[0].w - 1 ? `Liggende, rippes til ${Math.round(hh)} mm.` : 'Liggende bord.'
          legg({ navn, profil: ks.lag[0].profil, mat: ks.lag[0].mat, part: 'kledning', kategori: 'kledning', gruppe: 'kledning', merknad: merk, kvalitet: 'Kledningsbord' }, prisme(O3, exw, ey, ezw, [[sg2.a, y0], [sg2.b, y0], [sg2.b, y0 + hh], [sg2.a, y0 + hh]], -ks.lag[0].t1, -ks.lag[0].t0), exw)
        }
        if (sg2.ap) {
          const o = sg2.ap
          const hO = Math.min(...overkant(sg2.a, sg2.b, tak, hind, 8).map((p) => p[1])) - o.toppAbs
          const wRef = ks.lag[0].w
          if (hO < wRef + 10) {
            horisO = true
            liggende(o.toppAbs, o.toppAbs + hO, 'Kledning, overstykke')
          }
          const hU = o.bunnAbs - kledBunn
          if (hU < wRef + 10) {
            horisU = true
            liggende(kledBunn, o.bunnAbs, 'Kledning, understykke')
          }
        }
        for (const [s0, s1] of bord) {
          if (!sg2.ap) lagBord(s0, s1, kledBunn)
          else {
            const o = sg2.ap
            if (!horisU && o.bunnAbs - kledBunn > 25) lagBord(s0, s1, kledBunn, o.bunnAbs, 'Under åpningen.')
            if (!horisO) lagBord(s0, s1, o.toppAbs, undefined, 'Over åpningen.')
          }
        }
      }
    }
    // Lufting: insektnett mellom sperrene i takfoten
    if (inn.lufting && erTakfot) {
      const tN = kt - 1
      const yb = takfotTopp(v.rolle, v.rolle === 'takfotC' && inn.taktype === 'pulttak' ? ks.lag[ks.lag.length - 1].t0 : kt) - 10
      const intervaller: Array<[number, number]> = []
      for (const f of takFot) {
        // linje i planet: u- eller v-konstant
        let r: [number, number] | undefined
        if (v.rolle === 'takfotA') r = snittLinje(f.map(([u, vv]) => [u, vv] as P2), -tN)
        else if (v.rolle === 'takfotC') r = snittLinje(f, L + tN)
        else {
          const vline = v.start[1] < 0 ? -M / 2 - tN : M / 2 + tN
          const rr = snittLinje(f.map(([u, vv]) => [vv, u] as P2), vline)
          r = rr ? [rr[0] - SB, rr[1] - SB] : undefined
          if (r && v.start[1] > 0) r = [r[0], r[1]]
        }
        if (!r) continue
        if (v.rolle === 'takfotA' || v.rolle === 'takfotC') intervaller.push([r[0] + M / 2 - 2, r[1] + M / 2 + 2])
        else intervaller.push([r[0] - 2, r[1] + 2])
      }
      intervaller.sort((p, q) => p[0] - q[0])
      let c2 = run[0]
      const stykker: Array<[number, number]> = []
      for (const [p, q] of intervaller) {
        if (q < run[0] || p > run[1]) continue
        if (p > c2 + 10) stykker.push([c2, Math.min(p, run[1])])
        c2 = Math.max(c2, q)
      }
      if (run[1] > c2 + 10) stykker.push([c2, run[1]])
      for (const [s0, s1] of stykker) {
        const uv = (s: number): [number, number] => [v.start[0] + v.dir[0] * s - v.nrm[0] * tN, v.start[1] + v.dir[1] * s - v.nrm[1] * tN]
        const yt = yP + Math.min(plateY(...uv(s0)), plateY(...uv(s1))) - 2
        if (yt - yb < 15) continue
        nettDeler.push({ v, s0, s1, y0: yb, y1: yt })
        const pr = prisme(O3, exw, ey, ezw, [[s0, yb], [s1, yb], [s1, yt], [s0, yt]], -kt, -kt + 2)
        legg({ navn: 'Insektnett (lufting)', profil: '', mat: 'insektnett', part: 'kledning', kategori: 'kledning', gruppe: 'kledning', tre: false, farge: 0x2b2f33, opasitet: 0.55, m2: ((s1 - s0) * (yt - yb)) / 1e6, merknad: 'Lufting av sperrefeltene. Stiftes til sperrene/kledningen.' }, pr, exw)
      }
    }
    // Gerikt + blad
    const geriktMeta = (bredde: number): Meta => ({ navn: 'Gerikt', profil: `19 × ${bredde > 98 ? 148 : 98} mm`, mat: bordMat(bredde > 98 ? 148 : 98), part: 'kledning', kategori: 'kledning', gruppe: 'kledning', merknad: bredde < 97 || (bredde > 99 && bredde < 147) ? `Rippes til ${Math.round(bredde)} mm.` : undefined })
    const gT0 = -kt - 19
    const gT1 = -kt
    const takMin = (s: number) => takFn(ks.lag[ks.lag.length - 1].t1, ks.lag[ks.lag.length - 1].t0).tak(s)
    for (let i = 0; i < aps.length; i++) {
      const o = aps[i]
      const nest = aps[i + 1]
      const forrige = aps[i - 1]
      const gb = 98
      const gapN = nest ? nest.x0 - o.x1 : Infinity
      const gapF = forrige ? o.x0 - forrige.x1 : Infinity
      const delt = gapN <= 150
      const deltF = gapF <= 150
      const wR = delt ? gapN : Math.min(gb, gapN / 2)
      const wL = Math.min(gb, gapF / 2)
      const toppY = o.toppAbs + gb
      const room = Math.min(takMin(o.x0 - wL), takMin(o.x1 + wR)) - 8
      const harTopp = room - o.toppAbs > 30
      const sideTop = harTopp ? o.toppAbs : Math.min(toppY, room)
      const yb0 = o.bunnAbs
      const poly2 = (m: Meta, s0: number, s1: number, y0: number, y1: number, akse: V3) => legg(m, prisme(O3, exw, ey, ezw, [[s0, y0], [s1, y0], [s1, y1], [s0, y1]], gT0, gT1), akse)
      if (!deltF) poly2(geriktMeta(wL), o.x0 - wL, o.x0, yb0, sideTop, ey)
      poly2(geriktMeta(wR), o.x1, o.x1 + wR, yb0, sideTop, ey)
      const s0g = deltF ? o.x0 : o.x0 - wL
      const s1g = o.x1 + wR
      if (harTopp) poly2(geriktMeta(Math.min(gb, room - o.toppAbs)), s0g, s1g, o.toppAbs, Math.min(toppY, room), exw)
      if (o.bunnAbs > yD + T + 1) poly2(geriktMeta(gb), s0g, s1g, o.bunnAbs - gb, o.bunnAbs, exw)
      // Dør/luke-blad
      if (o.blad) {
        const luke = o.blad === 'luke'
        const sp = o.bladSpalte ?? 3
        const l0 = o.x0 + 5
        const l1 = o.x1 - 5
        const yb = o.bunnAbs + (o.terskel ? 5 : 10)
        const yt = o.toppAbs - 5
        const bt0 = -kt
        const bt1 = -kt + 19
        const bNavn = luke ? 'Lukebord' : 'Dørbord'
        const bw = ks.lag[ks.lag.length - 1].w >= 98 ? 98 : 48
        const bProf = bw === 98 ? '19 × 98 mm' : '23 × 48 mm'
        const bMat = bw === 98 ? 'bord-19x98' : 'lekt-23x48'
        for (const [s0, s1] of fordelBord(l0, l1, bw, sp)) {
          const ripp = s1 - s0 < bw - 1
          legg({ navn: bNavn, profil: bProf, mat: bMat, part: 'dor', kategori: 'kledning', gruppe: 'dor', merknad: ripp ? `Rippes til ${Math.round(s1 - s0)} mm.` : undefined }, prisme(O3, exw, ey, ezw, [[s0, yb], [s1, yb], [s1, yt], [s0, yt]], bw === 98 ? bt0 : -kt, bw === 98 ? bt1 : -kt + 23), ey)
        }
        const bakT0 = bw === 98 ? bt1 : -kt + 23
        const ins = 20
        const tvH = 98
        const nTv = yt - yb > 1500 ? 3 : 2
        const tvY: number[] = []
        for (let k = 0; k < nTv; k++) tvY.push(yb + 60 + (k * (yt - yb - 120 - tvH)) / (nTv - 1))
        const navnTv = luke ? 'Tverrtre (luke)' : 'Tverrtre (dør)'
        for (const y of tvY) legg({ navn: navnTv, profil: KV, mat: KVMAT, part: 'dor', kategori: 'kledning', gruppe: 'dor', merknad: 'Liggende (flatt) på innsiden av bladet.' }, prisme(O3, exw, ey, ezw, [[l0 + ins, y], [l1 - ins, y], [l1 - ins, y + tvH], [l0 + ins, y + tvH]], bakT0, bakT0 + T), exw)
        // Skråbånd: fra hengselsiden nede til låssiden oppe
        const hengV = o.hengsel !== 'hoyre'
        for (let k = 0; k < nTv - 1; k++) {
          const yA = tvY[k] + tvH
          const yB = tvY[k + 1]
          const xa = l0 + ins
          const xb = l1 - ins
          if (yB - yA < 150 || xb - xa < 200) continue
          let wh = tvH
          let th = Math.atan2(yB - yA, xb - xa - wh)
          for (let it = 0; it < 6; it++) {
            wh = tvH / Math.sin(th)
            th = Math.atan2(yB - yA, Math.max(10, xb - xa - wh))
          }
          let p: P2[] = [[xa, yA], [xa + wh, yA], [xb, yB], [xb - wh, yB]]
          if (!hengV) p = p.map(([x, y]) => [l0 + l1 - x, y] as P2).reverse()
          const dirx = hengV ? 1 : -1
          const vinkelKutt = 90 - th / RAD
          legg({ navn: luke ? 'Skråbånd (luke)' : 'Skråbånd (dør)', profil: KV, mat: KVMAT, part: 'dor', kategori: 'kledning', gruppe: 'dor', merknad: `Fra hengselsiden nede til låssiden oppe. Endekapp ${fmtGrader(vinkelKutt)}.`, endeA: { vinkel: vinkelKutt, type: 'gjaering' }, endeB: { vinkel: vinkelKutt, type: 'gjaering' } }, prisme(O3, exw, ey, ezw, p, bakT0, bakT0 + T), norm([v.dir[0] * Math.cos(th) * dirx, Math.sin(th), v.dir[1] * Math.cos(th) * dirx]))
        }
        // Hengsler og vrider
        const metall = 0x3a3d40
        const hT0 = -kt - 4
        const hT1 = -kt
        if (o.hengsel === 'topp') {
          for (const sx of [l0 + 80, l1 - 140]) legg({ navn: 'T-hengsel', profil: '', mat: 'hengsel', part: 'beslag', kategori: 'beslag', gruppe: 'dor', tre: false, farge: metall, stk: true }, prisme(O3, exw, ey, ezw, [[sx, yt - 260], [sx + 60, yt - 260], [sx + 60, yt - 8], [sx, yt - 8]], hT0, hT1), ey)
        } else {
          for (const y of [tvY[0], tvY[tvY.length - 1]]) {
            const s0 = hengV ? l0 + 5 : l1 - 395
            legg({ navn: 'T-hengsel', profil: '', mat: 'hengsel', part: 'beslag', kategori: 'beslag', gruppe: 'dor', tre: false, farge: metall, stk: true }, prisme(O3, exw, ey, ezw, [[s0, y + 30], [s0 + 390, y + 30], [s0 + 390, y + 68], [s0, y + 68]], hT0, hT1), exw)
          }
        }
        const vx = o.hengsel === 'topp' ? (l0 + l1) / 2 : hengV ? l1 - 70 : l0 + 40
        const vy = o.hengsel === 'topp' ? yb + 60 : Math.min(yb + 1050, (yb + yt) / 2 + 100)
        legg({ navn: luke ? 'Hasp (luke)' : 'Vrider/hasp', profil: '', mat: luke ? 'hasp' : 'vrider', part: 'beslag', kategori: 'beslag', gruppe: 'dor', tre: false, farge: metall, stk: true }, prisme(O3, exw, ey, ezw, [[vx, vy], [vx + 30, vy], [vx + 30, vy + 140], [vx, vy + 140]], -kt - 25, -kt), ey)
      }
    }
  }
  for (const v of vegger) if (v.ytter) kledVegg(v)

  // ════════════════════════════════════════════════════════════════
  // FUNDAMENT (statikk + 3D)
  // ════════════════════════════════════════════════════════════════
  const nPad = padX.length * padZ.length
  const takPlanM2 = ((L + 2 * ohU) * (M + 2 * (gOh || ohU))) / 1e6
  const gTak = tl.filter((f) => f.type === 'egen').reduce((s, f) => s + f.qk, 0)
  const sTak = tl.filter((f) => f.type === 'sno').reduce((s, f) => s + f.qk, 0)
  const gulvM2 = (B * D) / 1e6
  const gGulv = (floorLast.filter((f) => f.type === 'egen').reduce((s, f) => s + f.qk, 0) + 0.15) * gulvM2
  const qN = floorLast.filter((f) => f.type === 'nytte').reduce((s, f) => s + f.qk, 0) * gulvM2
  const qL = floorLast.filter((f) => f.type === 'lager').reduce((s, f) => s + f.qk, 0) * gulvM2
  const gVegg = (2 * (B + D) / 1000) * (H / 1000) * egenVegg
  const Gtot = gTak * takPlanM2 + gGulv + gVegg
  const fak = 1.3 / nPad
  const grunn = grunnForConfig(inn.config)
  const frost = frostForConfig(inn.config, { snofri: false })
  const vind = vindlast(28, 2, Math.max(2, (moneTop - 0) / 1000))
  const oppdrift = vindOppdrift(vind.qp, takPlanM2, Gtot, 0.6)
  const NQk: Array<{ type: 'sno' | 'nytte' | 'lager'; Nk: number }> = [{ type: 'sno', Nk: sTak * takPlanM2 * fak }]
  if (qN > 0 && !(qL > 0)) NQk.push({ type: 'nytte', Nk: qN * fak }) // lager og nyttelast virker ikke samtidig
  if (qL > 0) NQk.push({ type: 'lager', Nk: qL * fak })
  const kandidater = ['ror-200', 'saale-400', 'ror-250', 'saale-500', 'saale-600', 'saale-800'].map((id) => FUNDAMENTER.find((f) => f.id === id)).filter((f): f is (typeof FUNDAMENTER)[number] => !!f)
  const fundament = dimensjonerPunktfundament({ NGk: Gtot * fak, NQk, grunn, dybdeM: grunn === 'fjell' ? 0.3 : Math.max(0.6, frost.anbefaltDybdeM), oppdriftKN: oppdrift > 0 ? oppdrift / nPad : undefined, kandidater })
  const dia = Number(/Ø(\d+)/.exec(fundament.valgt.navn)?.[1] ?? 200)
  // Fundamentene settes rett innenfor ytterkant (kledningen går fri) og under kantbjelken.
  {
    const inset = dia / 2 + 2
    const nx = padX.length
    for (let i = 0; i < nx; i++) padX[i] = -B / 2 + inset + (i * (B - 2 * inset)) / (nx - 1)
    padZ = padZ.map((z) => (Math.abs(z) < 1 ? 0 : Math.sign(z) * (D / 2 - inset)))
  }
  for (const x of padX)
    for (const z of padZ)
      legg(
        { navn: 'Fundament (pilarrør)', profil: `Ø${dia} mm`, mat: 'pilarror', part: 'fundament', kategori: 'fundament', gruppe: 'fundament', tre: false, farge: 0x9a9a94, stk: true, merknad: `${fundament.valgt.navn}, underkant ${frost.anbefaltDybdeM.toFixed(1).replace('.', ',')} m under terreng (frostfritt). Synlig ${yF} mm.` },
        { type: 'sylinder', c: [x, 0, z], h: yF, r: dia / 2, segs: 24 },
        [0, 1, 0],
        false,
      )

  // ════════════════════════════════════════════════════════════════
  // UTSTYR
  // ════════════════════════════════════════════════════════════════
  const takOverkantVerden = (x: number, z: number) => {
    const [u, v] = tilR(x, z)
    return yP + plateY(u, v) + 18 / cos + (inn.takpapp ? 4 / cos : 0)
  }
  const fotVerden = takFot.map((f) => f.map(([u, v]) => {
    const w = W([u, 0, v])
    return [w[0], w[2]] as P2
  }))
  const iFot = (x: number, z: number, r: number) =>
    fotVerden.some((f) => {
      // punkt-til-polygon (konveks) avstand < r ?
      let inside = true
      let minD = Infinity
      for (let i = 0; i < f.length; i++) {
        const p = f[i]
        const q = f[(i + 1) % f.length]
        const cr = (q[0] - p[0]) * (z - p[1]) - (q[1] - p[1]) * (x - p[0])
        if (cr < 0) inside = false
        const L2 = (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2 || 1
        const t = Math.max(0, Math.min(1, ((x - p[0]) * (q[0] - p[0]) + (z - p[1]) * (q[1] - p[1])) / L2))
        minD = Math.min(minD, Math.hypot(x - p[0] - t * (q[0] - p[0]), z - p[1] - t * (q[1] - p[1])))
      }
      // skallet kan ha begge orienteringer
      let inside2 = true
      for (let i = 0; i < f.length; i++) {
        const p = f[i]
        const q = f[(i + 1) % f.length]
        if ((q[0] - p[0]) * (z - p[1]) - (q[1] - p[1]) * (x - p[0]) > 0) inside2 = false
      }
      return inside || inside2 || minD < r
    })

  if (inn.utstyr?.benk) {
    const zBak = -D / 2 + SB
    const dyb = Math.max(400, Math.min(520, D - 2 * SB - 450))
    const zF = zBak + dyb
    const xi0 = -B / 2 + SB
    const xi1 = B / 2 - SB
    const ySete = yD + 450
    const yPl = ySete - 18
    const bm = (navn: string, merknad?: string): Meta => ({ navn, profil: KV, mat: KVMAT, part: 'benk', kategori: 'utstyr', gruppe: 'utstyr', merknad })
    legg(bm('Benkelist', 'Skrus til stenderne i bakveggen, overkant = underkant seteplate.'), G(xi0, yPl - SB, zBak, xi1, yPl, zBak + T), [1, 0, 0], false)
    legg(bm('Benkelist', 'Skrus til stenderne i sideveggen.'), G(xi0, yPl - SB, zBak + T, xi0 + T, yPl, zF - T), [0, 0, 1], false)
    legg(bm('Benkelist', 'Skrus til stenderne i sideveggen.'), G(xi1 - T, yPl - SB, zBak + T, xi1, yPl, zF - T), [0, 0, 1], false)
    legg(bm('Benkerem', 'Fremkant sete. Hviler på sidelistene.'), G(xi0, yPl - SB, zF - T, xi1, yPl, zF), [1, 0, 0], false)
    if (xi1 - xi0 > 900) legg(bm('Benkestender', 'Midtstøtte under benkeremmen.'), G(-T / 2, yD, zF - SB, T / 2, yPl - SB, zF - T), [0, 1, 0], false)
    // Lufterør – finn plass mellom sperrene
    const r = 55
    let pos: [number, number] | undefined
    const zKand = [zBak + 80, zBak + 140, zBak + 200]
    for (const zc of zKand) {
      for (let dx = 0; dx <= (xi1 - xi0) / 2 - 90 && !pos; dx += 10) {
        for (const sx of [1, -1]) {
          const xc = sx * dx + (xi1 + xi0) / 2 + 200
          if (xc > xi1 - 80 || xc < xi0 + 80) continue
          if (!iFot(xc, zc, r + 20)) {
            pos = [xc, zc]
            break
          }
        }
      }
      if (pos) break
    }
    const hullR = Math.min(140, (xi1 - xi0) / 2 - 80, dyb / 2 - 60)
    const holeC: [number, number] = [-60, zBak + dyb / 2 + 20]
    const sirkel = (cx: number, cz: number, rr: number, n = 32): P2[] => {
      const p: P2[] = []
      for (let k = 0; k < n; k++) {
        const t = -(k / n) * Math.PI * 2
        p.push([cx + Math.cos(t) * rr, -(cz + Math.sin(t) * rr)])
      }
      return p
    }
    const yttre: P2[] = [[xi0, -zBak], [xi1, -zBak], [xi1, -zF], [xi0, -zF]]
    const hull: P2[][] = [sirkel(holeC[0], holeC[1], hullR)]
    if (pos && Math.hypot(pos[0] - holeC[0], pos[1] - holeC[1]) > hullR + r + 30 && pos[1] < zF - r - 10) hull.push(sirkel(pos[0], pos[1], r + 5, 20))
    // Seteplate: ekstruder i y (xz-plan)
    const seteG = prisme([0, 0, 0], [1, 0, 0], [0, 0, -1], [0, 1, 0], yttre, yPl, ySete, hull)
    legg({ navn: 'Seteplate, 18 mm kryssfiner', profil: '18 mm', mat: 'kryssfiner-18', part: 'benk', kategori: 'utstyr', gruppe: 'utstyr', tre: false, m2: ((xi1 - xi0) * dyb) / 1e6, merknad: `Hull Ø${Math.round(hullR * 2)} mm for toalettsetet${hull.length > 1 ? ' + Ø120 for lufterøret' : ''}.` }, seteG, [1, 0, 0], false)
    // Benkefront (avtagbar for tømming)
    for (const [s0, s1] of fordelBord(xi0, xi1, 98, 2)) legg({ navn: 'Benkefront', profil: '19 × 98 mm', mat: 'bord-19x98', part: 'benk', kategori: 'utstyr', gruppe: 'utstyr', merknad: 'Skrus fast med skruer så fronten kan tas av ved tømming.' }, G(s0, yD, zF, s1, yPl, zF + 19), [0, 1, 0], false)
    // Toalettsete (hvit ring + lokk)
    legg({ navn: 'Toalettsete med lokk', profil: '', mat: 'toalettsete', part: 'benk', kategori: 'utstyr', gruppe: 'utstyr', tre: false, farge: 0xf2f2ee, stk: true }, { type: 'sylinder', c: [holeC[0], ySete, holeC[1]], h: 40, r: hullR + 40, segs: 36 }, [0, 1, 0], false)
    if (pos) {
      const top = takOverkantVerden(pos[0], pos[1]) + 400
      legg({ navn: 'Lufterør Ø110 med hatt', profil: 'Ø110 mm', mat: 'lufteror', part: 'benk', kategori: 'utstyr', gruppe: 'utstyr', tre: false, farge: 0x2e3135, stk: true, merknad: 'Fra latrinebeholderen opp gjennom taket, ca. 400 mm over takflaten. Tettes med takmansjett.' }, { type: 'sylinder', c: [pos[0], yD + 120, pos[1]], h: top - yD - 120, r, segs: 20 }, [0, 1, 0], false)
      legg({ navn: 'Ventilasjonshatt', profil: '', mat: 'lufteror', part: 'benk', kategori: 'utstyr', gruppe: 'utstyr', tre: false, farge: 0x2e3135, stk: true }, { type: 'sylinder', c: [pos[0], top, pos[1]], h: 60, r: r + 35, segs: 20 }, [0, 1, 0], false)
    } else advarsler.push('Fant ikke plass til lufterøret mellom sperrene – plasser det på stedet.')
    // Dorullholder på sideveggen
    const xr = xi1 - 2
    legg({ navn: 'Dorullholder', profil: '', mat: 'dorullholder', part: 'benk', kategori: 'utstyr', gruppe: 'utstyr', tre: false, farge: 0xf5f5f0, stk: true }, { type: 'sylinder', c: [xr - 70, yD + 700, zF + 120], h: 100, r: 55, akse: [0, 0, 1], segs: 20 }, [0, 0, 1], false)
  }

  if (inn.utstyr?.dunker) {
    const binW = 600
    const gap = 90
    const innerW = B - 2 * SB
    const nBins = Math.floor((innerW + gap) / (binW + gap))
    const binD = Math.min(720, D - SB - 60)
    const hTot = Math.min(1070, Math.min(...alleApninger.filter((o) => o.side === 'front').map((o) => o.toppAbs), yP) - yD - 40)
    if (nBins >= 1 && hTot > 500) {
      const gw = nBins * binW + (nBins - 1) * gap
      const z = -D / 2 + SB + 30 + binD / 2
      for (let i = 0; i < nBins; i++) {
        const bx = -gw / 2 + binW / 2 + i * (binW + gap)
        const m = (navn: string, farge: number): Meta => ({ navn, profil: '', mat: '', part: 'bins', kategori: 'annet', gruppe: 'utstyr', tre: false, farge })
        legg(m('Søppeldunk (illustrasjon)', 0x434a51), G(bx - binW / 2, yD + 60, z - binD / 2, bx + binW / 2, yD + hTot - 70, z + binD / 2), [0, 1, 0], false)
        legg(m('Søppeldunk lokk (illustrasjon)', 0x2b3035), G(bx - binW / 2 - 8, yD + hTot - 70, z - binD / 2 - 10, bx + binW / 2 + 8, yD + hTot, z + binD / 2 + 10), [1, 0, 0], false)
        for (const s of [-1, 1]) legg(m('Hjul (illustrasjon)', 0x161819), { type: 'sylinder', c: [bx + s * (binW / 2 - 60) - 25, yD + 60, z - binD / 2 + 70], h: 50, r: 60, akse: [1, 0, 0], segs: 16 }, [1, 0, 0], false)
      }
    }
  }

  if (inn.utstyr?.ved) {
    // Vedstabel (illustrasjon): kubber Ø ~ 110 mm, 300 mm lange, stablet i hvert rom.
    const kantX = [-B / 2 + SB, ...(inn.skillevegger ?? []).flatMap((x) => [x - SB / 2, x + SB / 2]), B / 2 - SB].sort((p, q) => p - q)
    const zB = -D / 2 + SB + 40
    const zF = D / 2 - SB - 60
    const hStab = Math.min(yP - 150, yD + 1500)
    const lengde = 300
    const rader = Math.max(1, Math.floor((zF - zB) / (lengde + 20)))
    for (let k = 0; k + 1 < kantX.length; k += 2) {
      const x0 = kantX[k] + 30
      const x1 = kantX[k + 1] - 30
      if (x1 - x0 < 250) continue
      const d0 = 112
      const n = Math.floor((x1 - x0) / d0)
      const nY = Math.floor((hStab - yD) / (d0 * 0.9))
      const zFront = zB + rader * (lengde + 20)
      // massen bak (én boks per rom) + synlige kubbeender foran
      legg({ navn: 'Vedstabel (illustrasjon)', profil: '', mat: '', part: 'bins', kategori: 'annet', gruppe: 'utstyr', tre: false, farge: 0x7a5a3a }, G(x0, yD, zB, x0 + n * d0, yD + nY * d0 * 0.9, zFront - lengde), [1, 0, 0], false)
      for (let j = 0; j < nY; j++)
        for (let i = 0; i < n - (j % 2 ? 1 : 0); i++) {
          const cx = x0 + d0 / 2 + i * d0 + (j % 2 ? d0 / 2 : 0)
          const cy = yD + d0 / 2 + j * d0 * 0.9
          legg({ navn: 'Vedkubbe (illustrasjon)', profil: '', mat: '', part: 'bins', kategori: 'annet', gruppe: 'utstyr', tre: false, farge: (i + j) % 3 === 0 ? 0xb08a5e : (i + j) % 3 === 1 ? 0xa07a50 : 0xc29a6a }, { type: 'sylinder', c: [cx, cy, zFront - lengde], h: lengde, r: d0 / 2 - 4, akse: [0, 0, 1], segs: 10 }, [0, 0, 1], false)
        }
    }
  }

  // ── Nøkkeltall ──
  const alleY = deler.flatMap((d) => punkter(d.geo).map((p) => p[1]))
  const toppY = Math.max(...alleY)
  const fot = (B + 2 * kt) * (D + 2 * kt)
  const byaM2 = Math.max(fot, inn.utstikk > 1000 ? (L + 2 * ohU) * (M + 2 * (gOh || ohU)) : fot) / 1e6

  const statikk: Statikk = {
    sk,
    snoTak,
    tekke,
    taklast: tl,
    gulvbjelke,
    kantbjelke: kant,
    sidekant,
    midtdrager,
    sperre,
    grat,
    mDrager,
    overliggere,
    stender,
    frost,
    fundament,
    vind,
    merknader,
  }
  return {
    inn,
    deler,
    vegger,
    apninger: alleApninger,
    statikk,
    sg,
    valm: valmG,
    niva: { fund: yF, bjelke: yJ, dekke: yD, svill: yD + T, plate: yP, plateHoy: yC, mone: moneTop, topp: toppY, kledBunn },
    ramme: { L, M, O, uAx, vAx },
    kt,
    ohU,
    gOh,
    sperreV,
    gulv: { cc: ccG, hJ, hK, padX, padZ, midt, bjelkeX, dia, dybde: frost.anbefaltDybdeM },
    vinkel: a,
    beta,
    moneHoydeM: Math.max(...deler.filter((d) => d.gruppe === 'tekking').flatMap((d) => punkter(d.geo).map((p) => p[1]))) / 1000,
    gesimsHoydeM: (yP + topp(-kt) + (18 + (inn.takpapp ? 4 : 0)) / cos) / 1000,
    byaM2,
    takArealM2: deler.filter((d) => d.mat === 'kryssfiner-18' && d.gruppe === 'tekking').reduce((s, d) => s + (d.m2 ?? 0), 0),
    advarsler,
    hv,
    hvv,
    hb,
    hg,
    tg,
    dorer: alleApninger.filter((o) => o.blad === 'dor').length,
  }
}

/** Kappvinkel-tekst til kapplista. */
export function vinkelTekst(e?: KappEnde): string {
  if (!e || e.vinkel < 0.05) return 'rett'
  return `${fmtGrader(e.vinkel)}${e.merknad ? ` (${e.merknad})` : ''}`
}

export { loddkutt, kinnkutt, dot }

