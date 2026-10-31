import * as THREE from 'three'
import type { Bom, BuildOptions, DesignConfig, Form2D, Maal2D, ProductTemplate, Riss2D, Tegning2D } from '../types'
import type { Beregningsgrunnlag, BomLinePlan, KapplisteDelPlan, MonteringSteg } from '../plan-typer'
import { TRESLAG, resolveColor, treslagValg, fargeValg } from '../materials'
import { PRISER, prisFor } from '../priser'
import { frostForConfig, grunnForConfig, snolastForConfig } from '../byggested'
import type { SnolastPaMark } from '../snolast-data'
import { DOBLE_C24, LIMTRE_GL30C, STENDERE, dimensjonerDrager, dimensjonerSperre, dimensjonerStender, kontrollerSoyle, linjelaster, taklaster, tverrsnitt, velgBjelke } from '../dimensjonering'
import type { Dimensjonering, Medlemskontroll, Tverrsnitt } from '../dimensjonering'
import { TAKTEKKE, VB0_STANDARD, fmt, mu1, snolastTak, taktekkeFra, vindlast } from '../laster'
import type { Taktekke } from '../laster'
import { fmtGrader, rundOppKapp, sperreGeometri, valmGeometri } from '../geometri'
import type { SperreGeometri, ValmGeometri } from '../geometri'
import { frostdybde, saalebredde } from '../fundament'
import { tilByggeregler, vurderByggesak } from '../byggesak'
import type { ByggesakResultat } from '../byggesak'
import { lagBeregningsrapport, tilPlanVedlegg } from '../beregningsgrunnlag'
import { dimensjonerTakstol } from './felles-fagverk'
import type { TakstolResultat } from './felles-fagverk'
import { AX, boks, byggGruppe, halvplanLinje, iXY, kappLengde, kappVinkler, klippAlle, lagKappliste, omslutt, polyAreal, rad, rekt, roterY, stavPoly, tilFormer, treInnkjop } from './felles-3d'
import type { Halvplan, KappInfo, P2, Prisme, V3 } from './felles-3d'

/**
 * Garasje – byggeplan etter norsk praksis (SINTEF Byggforsk 523.xxx/525.xxx,
 * NS-EN 1990/1991/1995 + NA). Uisolert garasje på støpt plate.
 *
 *  - Plate på mark (100 mm, armert) med kantforsterkning og markisolasjon/
 *    frostsikring. Impregnert bunnsvill på svillmembran, forankret med
 *    betongskruer.
 *  - Stenderverk c/c ≤ 600 (dimensjon beregnet for aksiallast + vind), dobbel
 *    toppsvill i forband, losholter c/c 600 for stående kledning, vindkryss.
 *  - Portåpning(er) med portbjelke dimensjonert for spennet, oppleggsstendere
 *    + hele stendere i hver side og krybbestendere over.
 *  - Tak: saltak = W/Fink-takstoler, pulttak = pulttakstoler (fagverk),
 *    valmtak = takstoler i mønepartiet + bæretakstol, gratsperrer,
 *    kongesperre og skiftesperrer (valmGeometri). Takstoler står rett over
 *    stendere.
 *
 * ÉN modell (`modell(c)`) gir 3D, kappliste, materialliste, tegninger og
 * beregninger. Koordinater: x = bredde, z = dybde (port i front, +z), y opp, mm.
 */

export interface GarasjeConfig {
  bredde: number // cm (x) – utvendig stenderverk
  dybde: number // cm (z)
  hoyde: number // cm – vegghøyde fra plate til overkant toppsvill
  garasjetype: string // 'enkel' | 'dobbel'
  porthoyde: number // cm – lysåpning (bestillingsmål port)
  kledningsbord: string // '19x148' | '19x98' | 'lekt'
  taktype: string // 'pulttak' | 'valmtak' | 'saltak'
  takvinkel: number
  takutstikk: number // cm
  takretning: string // pulttak: fallretning
  moneretning: string // saltak
  taktekke: string // 'takpapp' | 'shingel' | 'stålplater'
  takpapp: boolean // utgått (erstattet av taktekke)
  treslag: string
  farge: string
  [key: string]: DesignConfig[string]
}

// ── Konstanter (mm) ────────────────────────────────────────────────
const SLAB = 100 // plateoverkant over terreng
const T = 48
const PLY = 18
const LEKT = 48 // taklekt 48×48 for stål
const VS_T = 22
const VS_H = 148
const STOKK = 5400
const PORT_BREDDER = [3000, 2700, 2500, 2400]
const R = rundOppKapp
const pr = (b: number, h: number) => `${b} × ${h} mm`

type Vegg = 'front' | 'bak' | 'venstre' | 'hoyre'

interface Norm {
  B: number
  D: number
  H: number
  type: 'saltak' | 'pulttak' | 'valmtak'
  vinkel: number
  oh: number
  tekke: Taktekke
  tekkeNavn: string
  porter: number
  portH: number
  /** Roter kanonisk tak (spenn langs x) k·90° til verden. */
  rot: number
  /** Spenn (ytterliv–ytterliv bærevegger) og lengde langs takstolene. */
  S: number
  Lr: number
}

function normaliser(c: GarasjeConfig): Norm {
  const B = Math.max(2400, Number(c.bredde) * 10)
  const D = Math.max(3000, Number(c.dybde) * 10)
  const type: Norm['type'] = c.taktype === 'pulttak' ? 'pulttak' : c.taktype === 'valmtak' ? 'valmtak' : 'saltak'
  const vinkel = Math.max(type === 'pulttak' ? 3 : 10, Math.min(45, Number(c.takvinkel) || 27))
  const tk = c.taktekke === 'stålplater' ? 'stal' : c.taktekke === 'shingel' ? 'shingel' : 'takpapp'
  const tekke = taktekkeFra(tk)
  let rot = 0
  let S = B
  let Lr = D
  if (type === 'saltak' && c.moneretning === 'bredde') {
    rot = 1
    S = D
    Lr = B
  } else if (type === 'pulttak') {
    const r = c.takretning
    if (r === 'hoyre') rot = 2
    else if (r === 'front') { rot = 1; S = D; Lr = B }
    else if (r === 'bak') { rot = 3; S = D; Lr = B }
  } else if (type === 'valmtak' && B > D) {
    rot = 1
    S = D
    Lr = B
  }
  return {
    B,
    D,
    H: Math.max(2000, Number(c.hoyde) * 10),
    type,
    vinkel,
    oh: Math.max(50, Math.min(500, Number(c.takutstikk) * 10)),
    tekke,
    tekkeNavn: tekke === 'stal' ? 'Stålplater (takstein-/trapesprofil)' : tekke === 'shingel' ? 'Asfaltshingel' : 'Takpapp (2-lags)',
    porter: c.garasjetype === 'dobbel' ? 2 : 1,
    portH: Math.max(1800, Number(c.porthoyde) * 10),
    rot,
    S,
    Lr,
  }
}

const papp = (t: Taktekke) => t !== 'stal'

/** Kanonisk → verden for et punkt i plan (x_c, z_c). */
function tilVerden(rot: number, x: number, z: number): [number, number] {
  let a = x
  let b = z
  for (let i = 0; i < ((rot % 4) + 4) % 4; i++) [a, b] = [b, -a]
  return [a, b]
}
/** Verden → kanonisk. */
function tilKanon(rot: number, x: number, z: number): [number, number] {
  return tilVerden(4 - (((rot % 4) + 4) % 4), x, z)
}

// ── Stender: aksial + vind ─────────────────────────────────────────

function stenderVindKontroll(tv: Tverrsnitt, lMm: number, NGk: number, NSk: number, qp: number): Medlemskontroll {
  // Vind på vegg: c_p,net = 1,0 (utvendig trykk 0,8 + innvendig 0,2/–0,3 med åpen port), c/c 0,6 m.
  const wk = qp * 1.0 * 0.6 // kN/m
  const Mk = (wk * (lMm / 1000) ** 2) / 8
  const k = kontrollerSoyle(tv, {
    lengdeM: lMm / 1000,
    NGk,
    NQk: [{ type: 'sno', Nk: NSk, navn: 'Snø' }],
    MQk: [{ type: 'vind', Mk, navn: `Vind på vegg (q_p = ${fmt(qp, 2)} kN/m², c/c 600)` }],
    tjenesteklasse: 2,
    avstivetSvakAkse: true,
    svakAkseLengdeM: 0.6,
  })
  const navn = 'Trykk + bøying (vind på vegg)'
  return {
    ...k,
    navn: 'Stender – vind + aksial',
    ccMm: 600,
    kontroller: k.kontroller.map((d) => (d.id === 'knekk' ? { ...d, navn } : d)),
    styrende: navn,
    forutsetninger: ['Stender leddet i svill og toppsvill, avstivet om svak akse av losholter c/c 600', 'c_p,net = 1,0 (uisolert garasje, porten kan stå åpen)', ...k.forutsetninger],
  }
}

// ── Modell ─────────────────────────────────────────────────────────

interface Vegglinje {
  id: Vegg
  /** Langs-akse i verden. */
  akse: 'x' | 'z'
  /** Ytterliv-koordinat (z for front/bak, x for sider). */
  ytre: number
  /** Retning innover (+1/−1) langs normal. */
  inn: number
  s0: number
  s1: number
  baerende: boolean
}

interface Apning {
  a: number
  b: number
  sc: number
  bredde: number
}

interface GarasjeModell {
  n: Norm
  deler: Prisme[]
  sk: SnolastPaMark
  takstol?: TakstolResultat
  bæretakstol?: TakstolResultat
  grat?: Dimensjonering
  skifte?: Dimensjonering
  valm?: ValmGeometri
  stender: Dimensjonering
  stenderVind: Medlemskontroll
  portbjelke: Dimensjonering
  geo: SperreGeometri
  frost: ReturnType<typeof frostdybde>
  saale: number
  byggesak: ByggesakResultat
  cc: number
  dS: number
  hU: number
  hO: number
  yPlate: number
  hoyder: { gesims: number; mone: number }
  apninger: Apning[]
  portHEff: number
  portB: number
  meldinger: string[]
  takPosZ: number[]
  vindQp: number
  takAreal: number
  renner: number
  renneLm: number
  kledningLm: number
  kledningM2: number
  vindskiLm: number
  minVinkel?: number
}

const cache = new Map<string, GarasjeModell>()
function modell(c: GarasjeConfig): GarasjeModell {
  const k = JSON.stringify(c)
  const h = cache.get(k)
  if (h) return h
  const m = lagModell(c)
  cache.set(k, m)
  if (cache.size > 12) cache.delete(cache.keys().next().value as string)
  return m
}

const imp = (c: GarasjeConfig) => (c.treslag === 'impregnert' ? 'NTR AB' : TRESLAG[c.treslag]?.label ?? c.treslag)

function lagModell(c: GarasjeConfig): GarasjeModell {
  const n = normaliser(c)
  const { B, D, H, vinkel, oh, S, Lr, rot } = n
  const tan = Math.tan(rad(vinkel))
  const cos = Math.cos(rad(vinkel))
  const meldinger: string[] = []
  const sk = snolastForConfig(c)
  const flater = taklaster({ sk: sk.sk, vinkelGrader: vinkel, tekke: n.tekke })
  const gTak = flater.filter((f) => f.type === 'egen').reduce((s, f) => s + f.qk, 0)
  const sTak = flater.filter((f) => f.type === 'sno').reduce((s, f) => s + f.qk, 0)
  const yPlate = SLAB + H
  const vind = vindlast(VB0_STANDARD, 2, Math.max(4, (yPlate + S * tan * (n.type === 'pulttak' ? 1 : 0.5)) / 1000))
  const portVeggBaerende = rot % 2 === 1 || n.type === 'valmtak'

  // ── Takstoler ──
  let takstol: TakstolResultat | undefined
  let bæretakstol: TakstolResultat | undefined
  let cc = 0.6
  let minVinkel: number | undefined
  const tsType = n.type === 'pulttak' ? 'pult' : 'fink'
  const ts = (ccM: number, opp = 98, v = vinkel) =>
    dimensjonerTakstol({ type: tsType, spennMm: S, vinkelGrader: v, utstikkMm: oh, hoyUtstikkMm: n.type === 'pulttak' ? oh : undefined, ccM, flatelaster: v === vinkel ? flater : taklaster({ sk: sk.sk, vinkelGrader: v, tekke: n.tekke }), opplegglengdeMm: opp })
  for (const ccM of [0.6, 0.45, 0.4]) {
    takstol = ts(ccM)
    cc = ccM
    if (takstol.ok) break
  }
  if (!takstol!.ok) {
    for (let v = Math.ceil(vinkel) + 1; v <= 35; v++) {
      if (ts(0.6, 98, v).ok) {
        minVinkel = v
        break
      }
    }
    meldinger.push(`Takstolene holder ikke med 48 mm C24 for spenn ${fmt(S / 1000, 2)} m ved ${fmt(vinkel, 1)}°.${minVinkel ? ` Øk takvinkelen til minst ${minVinkel}°,` : ''} bestill prosjekterte takstoler fra takstolfabrikk, eller velg fall/møne langs den korte siden.`)
  }

  // Valm: bæretakstol + grat/skifte.
  let valm: ValmGeometri | undefined
  let grat: Dimensjonering | undefined
  let skifte: Dimensjonering | undefined
  const Rl = Lr - S
  let girderLag = 2
  let minDS = 98
  let bæretakstolLast: { G: number; S: number } | undefined
  let pyramide = false
  if (n.type === 'valmtak') {
    pyramide = Rl < 2 * 48 * 2 + 600
    girderLag = pyramide ? 3 : 2
    skifte = dimensjonerSperre({ spennHorisontalM: S / 2000, vinkelGrader: vinkel, ccM: cc, tekke: n.tekke, sk: sk.sk, tjenesteklasse: 2 })
    const Lh = (S / 2) * Math.SQRT2
    const beta = Math.atan(tan / Math.SQRT2)
    const gratKand = [tverrsnitt(48, 198, 1, 'C24', 'bjelke-48x198'), tverrsnitt(48, 223, 1, 'C24', 'bjelke-48x223'), ...DOBLE_C24.filter((t) => t.antall === 2), ...LIMTRE_GL30C.filter((t) => t.b <= 115)]
    // Trekantlast: w0 = q·Lh/2 i toppen → ekvivalent jevn last for skjær/reaksjon q·Lh/3 (konservativt for moment).
    grat = velgBjelke({ spennM: Lh / 1000, vinkelGrader: (beta * 180) / Math.PI, laster: linjelaster(flater, Lh / 3000), tjenesteklasse: 2, nedboyning: 'tak', sidestottet: true, opplegglengdeMm: 98 }, gratKand)
    grat.kontroll.navn = 'Gratsperre'
    valm = valmGeometri({ vinkelGrader: vinkel, lopMm: S / 2, ccMm: cc * 1000, gratTykkelseMm: grat.valgt.b * grat.valgt.antall, utstikkMm: oh })
    // Topplast på bæretakstolen: 2 grater (q·S²/12 hver) + kongesperre (q·cc·S/4), per valmende.
    const ender = pyramide ? 2 : 1
    const topp = (q: number) => (ender * (2 * ((q * (S / 1000) ** 2) / 12) + (q * cc * S) / 4000))
    // Bæretakstol: 2 eller 3 lag; større oppleggsbredde (stenderverk 48×148) hvis trykk ⊥ styrer.
    bæretakstolLast = { G: topp(gTak), S: topp(sTak) }
    const girder = (lag: number, opp: number) => dimensjonerTakstol({ type: 'fink', spennMm: S, vinkelGrader: vinkel, utstikkMm: oh, ccM: cc, flatelaster: flater, opplegglengdeMm: opp, lag, toppLast: bæretakstolLast })
    let funnet = false
    for (const [lag, opp] of [[girderLag, 98], [3, 98], [girderLag, 148], [3, 148], [3, 198]] as Array<[number, number]>) {
      bæretakstol = girder(lag, opp)
      girderLag = lag
      minDS = opp
      if (bæretakstol.ok) {
        funnet = true
        break
      }
    }
    if (!funnet) meldinger.push('Bæretakstolen ved valmen må prosjekteres av takstolfabrikk (for stor last for 3 lag 48 mm).')
  }
  // Alle takstoler (og valmens sperrer) får samme gurthøyder, så takflatene ligger i ett plan.
  let hU = Math.max(takstol!.undergurt.valgt.h, bæretakstol?.undergurt.valgt.h ?? 0)
  let hO = Math.max(takstol!.overgurt.valgt.h, bæretakstol?.overgurt.valgt.h ?? 0, skifte?.valgt.h ?? 0)
  const ensrett = () => {
    const minG = { minOvergurtH: hO, minUndergurtH: hU }
    takstol = dimensjonerTakstol({ type: tsType, spennMm: S, vinkelGrader: vinkel, utstikkMm: oh, hoyUtstikkMm: n.type === 'pulttak' ? oh : undefined, ccM: cc, flatelaster: flater, opplegglengdeMm: 98, ...minG })
    if (bæretakstol) bæretakstol = dimensjonerTakstol({ type: 'fink', spennMm: S, vinkelGrader: vinkel, utstikkMm: oh, ccM: cc, flatelaster: flater, opplegglengdeMm: minDS, lag: girderLag, toppLast: bæretakstolLast, ...minG })
    hU = Math.max(takstol!.undergurt.valgt.h, bæretakstol?.undergurt.valgt.h ?? 0)
    hO = Math.max(takstol!.overgurt.valgt.h, bæretakstol?.overgurt.valgt.h ?? 0, skifte?.valgt.h ?? 0)
  }
  if (takstol!.ok || n.type === 'valmtak') {
    ensrett()
    ensrett()
  }
  const hSt = takstol!.stav.valgt.h

  // ── Vegger: stender + portbjelke ──
  const lastbredde = (S / 2 + oh) / 1000
  const lStender = H - 3 * T
  let stender!: Dimensjonering
  let stenderVind!: Medlemskontroll
  let portbjelke!: Dimensjonering
  let dS = 98
  // Seksjonsport trenger sideplass (~100–150 mm) til skinner/beslag + innramming: ≥ 450 mm vegg i hver side, 500 mm midtpilar.
  const lysB = (B - 900 - (n.porter - 1) * 500) / n.porter
  const portB = PORT_BREDDER.find((b) => b <= lysB) ?? Math.max(2000, Math.floor(lysB / 100) * 100)
  if (portB < 2400) meldinger.push(`Bredden gir bare ${portB} mm portåpning – øk bredden (min. ${n.porter === 2 ? 540 : 300} cm) for standard garasjeport 2400 mm.`)
  let portHEff = n.portH
  let jackAnt = 1
  for (const tv of STENDERE.filter((t) => t.h >= minDS)) {
    const st = dimensjonerStender({ hoydeM: lStender / 1000, ccM: cc, lastbreddeM: lastbredde, flatelaster: flater, tjenesteklasse: 2, losholtM: 0.6, kandidater: [tv] })
    const NGk = st.kontroll.laster.find((l) => l.type === 'egen')?.verdi ?? 0
    const NSk = st.kontroll.laster.filter((l) => l.type === 'sno').reduce((s, l) => s + l.verdi, 0)
    const sv = stenderVindKontroll(tv, lStender, NGk, NSk, vind.qp)
    // Portbjelke: plass mellom portåpning og toppsvill.
    const rom = yPlate - 2 * T - SLAB - n.portH
    const gavlLast = n.type === 'saltak' && !portVeggBaerende ? (S / 2) * tan / 1000 / 2 : 0.3
    const dIn = {
      spennM: (portB + T) / 1000,
      lastbreddeM: portVeggBaerende ? lastbredde : 0.3,
      flatelaster: flater,
      ekstraLinjelaster: [{ navn: 'Vegg/kledning over port', type: 'egen' as const, qk: 0.25 * Math.max(0.3, gavlLast + (rom > 0 ? 0.3 : 0)) }],
      sidestottet: true,
      tjenesteklasse: 2 as const,
    }
    const kand = [...DOBLE_C24.filter((t) => t.b * t.antall <= tv.h + 2), ...LIMTRE_GL30C.filter((t) => t.b <= tv.h + 2)]
    // Helst en portbjelke som får plass under toppsvilla; ellers den som holder (porthøyden reduseres da).
    let pb: Dimensjonering | undefined
    const passer = kand.filter((t) => t.h <= rom)
    sok: for (const liste of [passer, kand]) {
      if (!liste.length) continue
      for (const opp of [48, 96]) {
        pb = dimensjonerDrager({ ...dIn, opplegglengdeMm: opp, kandidater: liste })
        if (pb.ok) {
          jackAnt = opp === 96 ? 2 : 1
          break sok
        }
      }
    }
    stender = st
    stenderVind = sv
    portbjelke = pb!
    dS = tv.h
    if (st.ok && sv.ok && pb!.ok) break
  }
  if (!stender.ok || !stenderVind.ok) meldinger.push('Stenderne holder ikke med 48 mm C24 c/c 600 – reduser vegghøyden/c/c eller få veggen prosjektert.')
  if (!portbjelke.ok) meldinger.push('Portbjelken holder ikke med standarddimensjon – bruk limtre prosjektert for spennet eller to porter.')
  const hh = portbjelke.valgt.h
  if (SLAB + n.portH + hh > yPlate - 2 * T) {
    portHEff = Math.floor((yPlate - 2 * T - hh - SLAB) / 5) * 5
    meldinger.push(`Portbjelken (${portbjelke.valgt.profil}) får ikke plass over ${Math.round(n.portH / 10)} cm port med vegghøyde ${Math.round(H / 10)} cm – porthøyden er redusert til ${Math.round(portHEff / 10)} cm. Øk vegghøyden for høyere port.`)
  }
  // Takstolen dimensjoneres på nytt med faktisk oppleggsbredde (toppsvill).
  if (dS !== 98) {
    takstol = dimensjonerTakstol({ type: tsType, spennMm: S, vinkelGrader: vinkel, utstikkMm: oh, hoyUtstikkMm: n.type === 'pulttak' ? oh : undefined, ccM: cc, flatelaster: flater, opplegglengdeMm: dS, minOvergurtH: hO, minUndergurtH: hU })
  }
  // Valm: samme setelengde (48 mm oppforing) for takstoler og skiftesperrer, så alle takflater ligger i samme plan.
  const geo = sperreGeometri({ vinkelGrader: vinkel, sperreHoydeMm: hO, svillBreddeMm: n.type === 'valmtak' ? T : dS, utstikkMm: oh, topp: n.type === 'pulttak' ? { type: 'vegg', lopMm: S, svillBreddeMm: dS, utstikkMm: oh } : { type: 'mone', lopMm: S / 2, moneTykkelseMm: 0 } })
  const s = geo.fuglemunn.seteMm

  // ── Prismer ──
  const deler: Prisme[] = []
  let orden = 0
  const ORD: Record<string, number> = {}
  const leggTil = (p: Omit<Prisme, 'kapp'> & { kapp?: Omit<KappInfo, 'orden'> }) => {
    deler.push({ ...p, kapp: p.kapp ? { ...p.kapp, orden: (ORD[p.navn] ??= orden++) } : undefined } as Prisme)
  }
  const kvC24 = `C24 · ${imp(c)}`
  const svillKv = 'C24 · NTR AB (impregnert)'

  // Betongplate.
  leggTil({ pid: 'plate', part: 'plate', navn: 'Betongplate (støpt gulv)', profil: '100 mm armert', ...boks([-B / 2 - 50, -300, -D / 2 - 50], [B / 2 + 50, SLAB, D / 2 + 50]), flate: 'betong', explode: [0, -0.5, 0] })

  // Vegglinjer (front/bak hele bredden, sider mellom).
  const vegger: Vegglinje[] = [
    { id: 'front', akse: 'x', ytre: D / 2, inn: -1, s0: -B / 2, s1: B / 2, baerende: portVeggBaerende },
    { id: 'bak', akse: 'x', ytre: -D / 2, inn: 1, s0: -B / 2, s1: B / 2, baerende: rot % 2 === 1 || n.type === 'valmtak' },
    { id: 'venstre', akse: 'z', ytre: -B / 2, inn: 1, s0: -D / 2 + dS, s1: D / 2 - dS, baerende: rot % 2 === 0 || n.type === 'valmtak' },
    { id: 'hoyre', akse: 'z', ytre: B / 2, inn: -1, s0: -D / 2 + dS, s1: D / 2 - dS, baerende: rot % 2 === 0 || n.type === 'valmtak' },
  ]
  // Prisme langs en vegg: s-intervall, y-intervall, dybde fra ytterliv [d0, d1] innover.
  const veggBoks = (v: Vegglinje, s0: number, s1: number, y0: number, y1: number, d0: number, d1: number) => {
    const a = v.ytre + v.inn * d0
    const b = v.ytre + v.inn * d1
    const [n0, n1] = [Math.min(a, b), Math.max(a, b)]
    return v.akse === 'x' ? boks([s0, y0, n0], [s1, y1, n1]) : boks([n0, y0, s0], [n1, y1, s1])
  }

  // Portåpninger i front.
  const apninger: Apning[] = []
  {
    const bay = B / n.porter
    for (let j = 0; j < n.porter; j++) {
      const sc = -B / 2 + (j + 0.5) * bay
      apninger.push({ a: sc - portB / 2, b: sc + portB / 2, sc, bredde: portB })
    }
  }

  // Takstol-/sperreposisjoner langs Lr (kanonisk z) og lastpunkter i verden.
  const takPosZ: number[] = []
  {
    const z0 = -Lr / 2 + T / 2
    const z1 = Lr / 2 - T / 2
    if (n.type === 'valmtak') {
      // Midtparti mellom bæretakstolene.
      const gz = pyramide ? 0 : Rl / 2
      if (pyramide) takPosZ.push(0)
      else {
        const k = Math.max(1, Math.ceil((2 * gz) / (cc * 1000) - 1e-9))
        for (let i = 0; i <= k; i++) takPosZ.push(-gz + (i * 2 * gz) / k)
      }
    } else {
      const k = Math.max(1, Math.ceil((z1 - z0) / (cc * 1000) - 1e-9))
      for (let i = 0; i <= k; i++) takPosZ.push(z0 + (i * (z1 - z0)) / k)
    }
  }
  const girderDybde = girderLag * T

  // Valm: skiftesperrer-posisjoner (kanonisk).
  const kongeT = T
  const valmData = (() => {
    if (n.type !== 'valmtak') return undefined
    const gz = pyramide ? 0 : Rl / 2
    const gFace = gz + girderDybde / 2 // ytterflate bæretakstol mot valmenden
    const endeX: number[] = [] // skiftesperrer på endevegg (x_c), utenom kongesperra i 0
    for (let x = cc * 1000; x < S / 2 - 150; x += cc * 1000) endeX.push(x, -x)
    const langZ: number[] = [] // skiftesperrer på langvegg (|z_c|), utover fra bæretakstolen
    for (let z = gFace + cc * 1000 - T / 2; z < Lr / 2 - 150; z += cc * 1000) langZ.push(z)
    return { gz, gFace, endeX, langZ }
  })()

  // Lastpunkter (verden, langs veggens s-akse) per vegg.
  const lastpunkt: Record<Vegg, number[]> = { front: [], bak: [], venstre: [], hoyre: [] }
  // Lastpunkt på kanonisk vegg 'x' (x_c = ±S/2, langs bærevegg) eller 'z' (z_c = ±Lr/2, endevegg).
  const leggLast = (xc: number, zc: number, paa: 'x' | 'z' = 'x') => {
    const [x, z] = tilVerden(rot, xc, zc)
    const sideVegg = (paa === 'x') === (rot % 2 === 0)
    const v: Vegg = sideVegg ? (x < 0 ? 'venstre' : 'hoyre') : z > 0 ? 'front' : 'bak'
    lastpunkt[v].push(sideVegg ? z : x)
  }
  for (const z of takPosZ) {
    if (n.type === 'valmtak' && Math.abs(z) === valmData!.gz && !pyramide) {
      for (let i = 0; i < girderLag; i++) {
        const zz = Math.sign(z) * (valmData!.gz - girderDybde / 2 + T / 2 + i * T)
        leggLast(-S / 2 + 1, zz)
        leggLast(S / 2 - 1, zz)
      }
    } else if (pyramide && n.type === 'valmtak') {
      for (let i = 0; i < girderLag; i++) {
        const zz = -girderDybde / 2 + T / 2 + i * T
        leggLast(-S / 2 + 1, zz)
        leggLast(S / 2 - 1, zz)
      }
    } else {
      leggLast(-S / 2 + 1, z)
      leggLast(S / 2 - 1, z)
    }
  }
  if (valmData) {
    for (const sz of [-1, 1]) {
      leggLast(0, sz * (Lr / 2 - 1), 'z')
      valmData.endeX.forEach((x) => leggLast(x, sz * (Lr / 2 - 1), 'z'))
      valmData.langZ.forEach((z) => {
        leggLast(-S / 2 + 1, sz * z)
        leggLast(S / 2 - 1, sz * z)
      })
    }
  }

  // ── Stenderverk ──
  const yStB = SLAB + T
  const yStT = yPlate - 2 * T
  const stTv = tverrsnitt(48, dS, 1, 'C24', dS === 98 ? 'stolpe-48x98' : `bjelke-48x${dS}`)
  const studProfil = stTv.profil
  const studPris = stTv.pris!
  const portTopp = SLAB + portHEff
  const losY: number[] = []
  for (let y = yStB + 600; y < yStT - 150; y += 600) losY.push(y)
  let vindkryssAnt = 0
  for (const v of vegger) {
    const front = v.id === 'front'
    // Obligatoriske stendere: hjørner + lastpunkter + åpningsinnramming.
    const pos = new Map<number, { navn: string; bunn: number; topp: number; kapp?: string }>()
    const settStender = (sPos: number, navn: string) => {
      const k = Math.round(sPos)
      if (!pos.has(k)) pos.set(k, { navn, bunn: yStB, topp: yStT })
    }
    settStender(v.s0 + T / 2, 'Hjørnestender')
    settStender(v.s1 - T / 2, 'Hjørnestender')
    if (v.akse === 'z') {
      // Spikerslag for innvendig hjørne (andre stender i L-hjørnet).
      settStender(v.s0 + T / 2 + T, 'Hjørnestender')
      settStender(v.s1 - T / 2 - T, 'Hjørnestender')
    }
    const inniApning = (x: number, marg = 0) => front && apninger.some((a) => x > a.a - T * (jackAnt + 1) - marg && x < a.b + T * (jackAnt + 1) + marg)
    if (front) {
      for (const a of apninger) {
        for (let j = 0; j < jackAnt; j++) {
          pos.set(Math.round(a.a - T / 2 - j * T), { navn: 'Oppleggsstender (port)', bunn: yStB, topp: portTopp })
          pos.set(Math.round(a.b + T / 2 + j * T), { navn: 'Oppleggsstender (port)', bunn: yStB, topp: portTopp })
        }
        pos.set(Math.round(a.a - T / 2 - jackAnt * T), { navn: 'Stender', bunn: yStB, topp: yStT })
        pos.set(Math.round(a.b + T / 2 + jackAnt * T), { navn: 'Stender', bunn: yStB, topp: yStT })
      }
    }
    const lp = lastpunkt[v.id].filter((x) => x > v.s0 + T && x < v.s1 - T)
    for (const x of lp) {
      if (inniApning(x)) continue
      // Unngå kollisjon med eksisterende stender (< 48 mm).
      const naer = [...pos.keys()].some((k) => Math.abs(k - x) < T)
      if (!naer) settStender(x, 'Stender')
    }
    // Fyll til c/c ≤ 600 (utenfor åpninger).
    const fyll = () => {
      const ks = [...pos.keys()].sort((a, b) => a - b)
      for (let i = 0; i < ks.length - 1; i++) {
        const a = ks[i]
        const b = ks[i + 1]
        if (inniApning((a + b) / 2, -T)) continue
        if (b - a > 600 + 1) {
          const k = Math.ceil((b - a) / 600 - 1e-9)
          for (let j = 1; j < k; j++) settStender(a + (j * (b - a)) / k, 'Stender')
        }
      }
    }
    fyll()
    // Tegn stenderne.
    ;[...pos.entries()].forEach(([sPos, st], i) => {
      leggTil({ pid: `st-${v.id}-${i}`, part: 'konstruksjon', navn: st.navn, profil: studProfil, ...veggBoks(v, sPos - T / 2, sPos + T / 2, st.bunn, st.topp, 0, dS), flate: 'tre', darken: 0.86, kapp: { kvalitet: kvC24, lengdeMm: R(st.topp - st.bunn), prisId: studPris, kategori: 'konstruksjon' } })
    })
    // Krybbestendere over portbjelken (under lastpunkter + c/c ≤ 600).
    if (front) {
      for (const a of apninger) {
        const yb = portTopp + hh
        const krybbe = yStT - yb >= 150 // kortere mellomrom: portbjelken klosses opp mot toppsvilla
        const xs = new Set<number>()
        const a0 = a.a - jackAnt * T
        const b0 = a.b + jackAnt * T
        lastpunkt.front.filter((x) => x > a0 + T / 2 && x < b0 - T / 2).forEach((x) => xs.add(Math.round(x)))
        const k = Math.ceil((b0 - a0) / 600 - 1e-9)
        for (let j = 1; j < k; j++) {
          const x = a0 + (j * (b0 - a0)) / k
          if (![...xs].some((q) => Math.abs(q - x) < 200)) xs.add(Math.round(x))
        }
        if (krybbe) [...xs].forEach((x, i) => leggTil({ pid: `krybbe-${a.sc}-${i}`, part: 'konstruksjon', navn: 'Krybbestender', profil: studProfil, ...veggBoks(v, x - T / 2, x + T / 2, yb, yStT, 0, dS), flate: 'tre', darken: 0.84, kapp: { kvalitet: kvC24, lengdeMm: R(yStT - yb), prisId: studPris, kategori: 'konstruksjon' } }))
        // Portbjelke.
        const pbTv = portbjelke.valgt
        const lagN = pbTv.materiale.startsWith('GL') ? 1 : pbTv.antall
        const lagB = pbTv.materiale.startsWith('GL') ? pbTv.b : pbTv.b
        const d0 = (dS - lagB * lagN) / 2
        for (let l = 0; l < lagN; l++) {
          leggTil({ pid: `portbjelke-${a.sc}-${l}`, part: 'konstruksjon', navn: 'Portbjelke', profil: pbTv.materiale.startsWith('GL') ? pbTv.profil : pbTv.boardProfil, ...veggBoks(v, a0, b0, portTopp, portTopp + hh, d0 + l * lagB, d0 + (l + 1) * lagB), flate: 'tre', darken: 0.8, kapp: { kvalitet: pbTv.materiale.startsWith('GL') ? 'GL30c' : kvC24, lengdeMm: R(b0 - a0), prisId: pbTv.pris ?? `limtre-${pbTv.b}x${pbTv.h}`, kategori: 'konstruksjon', merknad: `Opplegg ${jackAnt} × 48 mm oppleggsstender i hver side${lagN > 1 ? '; lagene spikres sammen c/c 300' : ''}` } })
        }
      }
    }
    // Losholter (spikerslag for stående kledning) mellom stenderne.
    const ks = [...pos.entries()].map(([k, st]) => ({ k, st })).sort((a, b) => a.k - b.k)
    for (let i = 0; i < ks.length - 1; i++) {
      const a = ks[i].k + T / 2
      const b = ks[i + 1].k - T / 2
      if (b - a < 150) continue
      losY.forEach((y, j) => {
        const iPort = front && apninger.some((ap) => (a + b) / 2 > ap.a - jackAnt * T - 1 && (a + b) / 2 < ap.b + jackAnt * T + 1)
        if (iPort) return
        if (y + T / 2 > Math.min(ks[i].st.topp, ks[i + 1].st.topp) && !(y > portTopp + hh)) return
        if (y > portTopp + hh && front && apninger.some((ap) => (a + b) / 2 > ap.a - jackAnt * T && (a + b) / 2 < ap.b + jackAnt * T) && y > yStT - 60) return
        leggTil({ pid: `los-${v.id}-${i}-${j}`, part: 'konstruksjon', navn: 'Losholt', profil: studProfil, ...veggBoks(v, a, b, y - T / 2, y + T / 2, 0, dS), flate: 'tre', darken: 0.82, kapp: { kvalitet: kvC24, lengdeMm: R(b - a), prisId: studPris, kategori: 'konstruksjon', merknad: 'Flukt med stenderens ytterkant (spikring av kledning)' } })
      })
    }
    // Bunnsvill (avbrutt i portåpning), skjøt på stender ved > 5,4 m.
    const svillBiter: Array<[number, number]> = []
    {
      let a = v.s0
      const kutt = front ? apninger.flatMap((ap) => [ap.a, ap.b]) : []
      const grenser = [v.s0, ...kutt, v.s1]
      for (let i = 0; i < grenser.length - 1; i += 2) {
        a = grenser[i]
        const b = grenser[i + 1]
        if (b - a < 20) continue
        let x = a
        while (b - x > STOKK) {
          const kand = ks.map((q) => q.k).filter((k) => k - x <= STOKK && k > x + 500)
          const nx = kand[kand.length - 1] ?? x + STOKK
          svillBiter.push([x, nx])
          x = nx
        }
        svillBiter.push([x, b])
      }
    }
    svillBiter.forEach(([a, b], i) => leggTil({ pid: `svill-${v.id}-${i}`, part: 'konstruksjon', navn: 'Bunnsvill', profil: studProfil, ...veggBoks(v, a, b, SLAB, SLAB + T, 0, dS), flate: 'tre', darken: 0.78, explode: [0, -0.15, 0], kapp: { kvalitet: svillKv, lengdeMm: R(b - a), prisId: studPris, kategori: 'konstruksjon', merknad: 'På svillmembran; betongskrue c/c ≤ 1000 og 200 fra ender' } }))
    // Svillmembran (visuell).
    svillBiter.forEach(([a, b], i) => leggTil({ pid: `membran-${v.id}-${i}`, part: 'plate', navn: 'Svillmembran', profil: 'EPDM 150 mm', ...veggBoks(v, a, b, SLAB - 2, SLAB, -10, dS + 10), flate: 'membran' }))
    // Dobbel toppsvill i forband.
    const nedre: [number, number] = v.akse === 'x' ? [v.s0, v.s1] : [v.s0, v.s1]
    const ovre: [number, number] = v.akse === 'x' ? [v.s0 + dS, v.s1 - dS] : [v.s0 - dS, v.s1 + dS]
    ;[nedre, ovre].forEach(([a, b], lag) => {
      const biter: Array<[number, number]> = []
      let x = a
      while (b - x > STOKK) {
        const kand = ks.map((q) => q.k).filter((k) => k - x <= STOKK - (lag ? 1200 : 0) && k > x + 500)
        const nx = kand[kand.length - 1] ?? x + STOKK
        biter.push([x, nx])
        x = nx
      }
      biter.push([x, b])
      biter.forEach(([p, q], i) => leggTil({ pid: `toppsvill-${v.id}-${lag}-${i}`, part: 'konstruksjon', navn: lag ? 'Toppsvill øvre' : 'Toppsvill nedre', profil: studProfil, ...veggBoks(v, p, q, yStT + lag * T, yStT + (lag + 1) * T, 0, dS), flate: 'tre', darken: 0.8, kapp: { kvalitet: kvC24, lengdeMm: R(q - p), prisId: studPris, kategori: 'konstruksjon', merknad: lag ? 'Overlapper hjørnet (forband), skjøter forskjøvet min. 1,2 m fra nedre' : undefined } }))
    })
    // Vindkryss (stålbånd 40×2) i hjørnefeltene, utenpå stenderne.
    const span = Math.min(2400, v.s1 - v.s0 - 200)
    const lukket = (a: number, b: number) => !(front && apninger.some((ap) => b > ap.a - 300 && a < ap.b + 300))
    for (const [a, b] of [[v.s0, v.s0 + span], [v.s1 - span, v.s1]] as Array<[number, number]>) {
      if (!lukket(a, b)) continue
      vindkryssAnt++
      for (const [p0, p1] of [[[a + 40, yStB + 40], [b - 40, yStT - 40]], [[b - 40, yStB + 40], [a + 40, yStT - 40]]] as Array<[P2, P2]>) {
        const poly = stavPoly(p0, p1, 40, 0)
        const ytre = v.ytre
        const base = v.akse === 'x' ? iXY(poly, v.inn < 0 ? ytre : ytre - 2, 2) : { poly, O: [v.inn > 0 ? ytre : ytre + 2, 0, 0] as V3, U: AX.z, V: AX.y, W: AX['-x'], t: 2 }
        leggTil({ pid: `vindkryss-${v.id}-${a}-${p0[0]}`, part: 'beslag', navn: 'Vindkryss (stålbånd)', profil: '40 × 2 mm', ...base, flate: 'metall' })
      }
    }
  }

  // ── Port (seksjonsport, lukket) ──
  for (const a of apninger) {
    const nP = Math.max(4, Math.round(portHEff / 530))
    const ph = portHEff / nP
    for (let k = 0; k < nP; k++) {
      leggTil({ pid: `port-${a.sc}-${k}`, part: 'port', navn: 'Garasjeport (seksjon)', profil: 'sandwich 40 mm', ...boks([a.a + 5, SLAB + k * ph + 3, D / 2 - dS - 45], [a.b - 5, SLAB + (k + 1) * ph - 3, D / 2 - dS - 5]), flate: 'port', explode: [0, 0, 0.4] })
    }
  }

  // ── Tak (kanonisk, roteres til verden) ──
  const tak: Prisme[] = []
  const tLegg = (p: Omit<Prisme, 'kapp'> & { kapp?: Omit<KappInfo, 'orden'> }) => {
    tak.push({ ...p, kapp: p.kapp ? { ...p.kapp, orden: (ORD[p.navn] ??= orden++) } : undefined } as Prisme)
  }
  const yU = yPlate + hU // overkant undergurt/oppforing = sperregeometriens y = 0
  const xL = -S / 2 // ytterliv lav/venstre bærevegg
  // Overkant takstol-overgurt (tak-referanse) i kanonisk x.
  const yOverkant = (x: number): number => {
    const xl = x - xL
    if (n.type === 'pulttak') return yU + (xl - s) * tan + hO / cos
    const xs = xl <= S / 2 ? xl : S - xl
    return yU + (xs - s) * tan + hO / cos
  }
  const dirO: P2 = [cos, Math.sin(rad(vinkel))]
  const kvT = 'C24 (takstol)'
  const lenO = (poly: P2[], dir: P2) => kappLengde(poly, dir)

  // Omriss overgurt (kanonisk x–y).
  const overV: P2[] =
    n.type === 'pulttak'
      ? (() => {
          // Pulttakstol: sete på undergurten i lav ende, rett overgurt over endestaven og ut i høyt utstikk.
          const b = (x: number) => (x - s) * tan
          const t = (x: number) => b(x) + hO / cos
          const xe = S + oh
          return ([[-oh, t(-oh)], [-oh, b(-oh)], [0, b(0)], [0, 0], [s, 0], [xe, b(xe)], [xe, t(xe)]] as P2[]).map(([x, y]) => [x + xL, y + yU] as P2)
        })()
      : geo.omriss.map(([x, y]) => [x + xL, y + yU] as P2)
  const overH = geo.omriss.map(([x, y]) => [xL + S - x, y + yU] as P2)
  const bunnL = (x: number) => (x - xL - s) * tan + yU
  const bunnR = (x: number) => (xL + S - x - s) * tan + yU
  const midt: P2 = [0, yU + 30]
  const underL = halvplanLinje([xL, bunnL(xL)], [1, tan], [xL + S / 2, yU + 30])
  const underR = halvplanLinje([xL + S, bunnR(xL + S)], [-1, tan], midt)
  const overUG: Halvplan = { a: 0, b: -1, c: -yU }

  interface Stav { navn: string; poly: P2[]; dir: P2 }
  const finkStaver = (hs: number): Stav[] => {
    const Q1: P2 = [xL + S / 4, bunnL(xL + S / 4)]
    const Q2: P2 = [xL + (3 * S) / 4, bunnR(xL + (3 * S) / 4)]
    const T1: P2 = [xL + S / 3, yU]
    const T2: P2 = [xL + (2 * S) / 3, yU]
    const A: P2 = [0, Math.min(bunnL(0), bunnR(0))]
    const mk = (navn: string, p0: P2, p1: P2, ekstra: Halvplan[]): Stav => {
      const d = Math.hypot(p1[0] - p0[0], p1[1] - p0[1])
      return { navn, poly: klippAlle(stavPoly(p0, p1, hs, 400), [underL, underR, overUG, ...ekstra]), dir: [(p1[0] - p0[0]) / d, (p1[1] - p0[1]) / d] }
    }
    return [
      mk('Takstol – stav ytre', Q1, T1, [{ a: 1, b: 0, c: T1[0] }]),
      mk('Takstol – stav indre', T1, A, [{ a: -1, b: 0, c: -T1[0] }, { a: 1, b: 0, c: A[0] }]),
      mk('Takstol – stav indre', T2, A, [{ a: 1, b: 0, c: T2[0] }, { a: -1, b: 0, c: -A[0] }]),
      mk('Takstol – stav ytre', Q2, T2, [{ a: -1, b: 0, c: -T2[0] }]),
    ]
  }
  const pultStaver = (hs: number): Stav[] => {
    const nf = Math.max(2, Math.ceil(S / 1500 - 1e-9))
    const ut: Stav[] = []
    const xs = Array.from({ length: nf + 1 }, (_, i) => xL + (i * S) / nf)
    const vx = (i: number) => (i === nf ? xL + S - hs / 2 : xs[i]) // endestaven i liv med høy vegg
    for (let i = 1; i <= nf; i++) {
      const x = vx(i)
      const p0: P2 = [x, yU]
      const p1: P2 = [x, bunnL(x) + 200]
      ut.push({ navn: i === nf ? 'Takstol – endestav' : 'Takstol – stav loddrett', poly: klippAlle(stavPoly(p0, p1, hs, 300), [underL, overUG, { a: 1, b: 0, c: xL + S }]), dir: [0, 1] })
    }
    for (let i = 1; i < nf; i++) {
      const p0: P2 = [vx(i), bunnL(vx(i))]
      const p1: P2 = [vx(i + 1), yU]
      const d = Math.hypot(p1[0] - p0[0], p1[1] - p0[1])
      ut.push({ navn: 'Takstol – diagonal', poly: klippAlle(stavPoly(p0, p1, hs, 400), [underL, overUG, { a: -1, b: 0, c: -(vx(i) + hs / 2) }, { a: 1, b: 0, c: vx(i + 1) - hs / 2 }]), dir: [(p1[0] - p0[0]) / d, (p1[1] - p0[1]) / d] })
    }
    return ut
  }
  const gavlStaver = (hs: number): Stav[] => {
    // Gavltakstol: loddrette gavlstendere c/c 600 i stedet for W-staver (står på gavlveggen).
    const ut: Stav[] = []
    const xs: number[] = []
    if (n.type === 'pulttak') for (let x = xL + 600; x < xL + S - 300; x += 600) xs.push(x)
    else for (let x = 0; x < S / 2 - 300; x += 600) { xs.push(x); if (x > 0) xs.push(-x) }
    for (const x of xs) {
      const p0: P2 = [x, yU]
      const p1: P2 = [x, yU + S]
      const halv: Halvplan[] = n.type === 'pulttak' ? [underL, overUG] : x === 0 ? [overUG, underL, underR] : [overUG, x < 0 ? underL : underR]
      const poly = klippAlle(stavPoly(p0, p1, hs, 0), halv)
      if (poly.length >= 3 && Math.max(...poly.map((p) => p[1])) - yU > 200) ut.push({ navn: 'Gavlstender (takstol)', poly, dir: [0, 1] })
    }
    if (n.type === 'pulttak') ut.push(...pultStaver(hs).filter((st) => st.navn === 'Takstol – endestav'))
    return ut
  }
  const leggTakstol = (z: number, i: string, lag: number, gavl: boolean, ts0: TakstolResultat) => {
    const hu = hU
    const hs = ts0.stav.valgt.h
    const ex: V3 = [0, 0.5, 0]
    const staver = gavl ? gavlStaver(hs) : n.type === 'pulttak' ? pultStaver(hs) : finkStaver(hs)
    for (let l = 0; l < lag; l++) {
      const z0 = z - (lag * T) / 2 + l * T
      const kv = lag > 1 ? `${kvT} – bæretakstol ${lag} lag` : kvT
      if (n.type === 'pulttak') tLegg({ pid: `ts-${i}-${l}-ov`, part: 'spaer', navn: 'Takstol – overgurt', profil: pr(48, hO), ...iXY(overV, z0, T), flate: 'tre', explode: ex, kapp: { kvalitet: kv, lengdeMm: lenO(overV, dirO), prisId: `bjelke-48x${hO}`, kategori: 'konstruksjon', endeA: { vinkel: Math.round(vinkel * 10) / 10, type: 'gjaering', merknad: 'loddkutt' }, endeB: { vinkel: Math.round(vinkel * 10) / 10, type: 'gjaering', merknad: 'loddkutt' }, merknad: `Sete ${Math.round(s)} mm på undergurt i begge ender` } })
      else {
        tLegg({ pid: `ts-${i}-${l}-ov`, part: 'spaer', navn: 'Takstol – overgurt', profil: pr(48, hO), ...iXY(overV, z0, T), flate: 'tre', explode: ex, kapp: { kvalitet: kv, lengdeMm: lenO(overV, dirO), prisId: `bjelke-48x${hO}`, kategori: 'konstruksjon', endeA: { vinkel: Math.round(vinkel * 10) / 10, type: 'gjaering', merknad: 'loddkutt raft' }, endeB: { vinkel: Math.round(vinkel * 10) / 10, type: 'gjaering', merknad: 'loddkutt møne' }, merknad: `Sete ${Math.round(s)} mm på undergurt, hæl ${Math.round(geo.fuglemunn.haelMm)} mm` } })
        tLegg({ pid: `ts-${i}-${l}-oh`, part: 'spaer', navn: 'Takstol – overgurt', profil: pr(48, hO), ...iXY(overH, z0, T), flate: 'tre', explode: ex, kapp: { kvalitet: kv, lengdeMm: lenO(overV, dirO), prisId: `bjelke-48x${hO}`, kategori: 'konstruksjon', endeA: { vinkel: Math.round(vinkel * 10) / 10, type: 'gjaering', merknad: 'loddkutt raft' }, endeB: { vinkel: Math.round(vinkel * 10) / 10, type: 'gjaering', merknad: 'loddkutt møne' }, merknad: `Sete ${Math.round(s)} mm på undergurt, hæl ${Math.round(geo.fuglemunn.haelMm)} mm` } })
      }
      tLegg({ pid: `ts-${i}-${l}-ug`, part: 'spaer', navn: 'Takstol – undergurt', profil: pr(48, hu), ...iXY(rekt(xL, yPlate, xL + S, yPlate + hu), z0, T), flate: 'tre', darken: 0.95, explode: ex, kapp: { kvalitet: kv, lengdeMm: R(S), prisId: `bjelke-48x${hu}`, kategori: 'konstruksjon' } })
      staver.forEach((st, k) => {
        if (st.poly.length < 3) return
        const [va, vb] = kappVinkler(st.poly, st.dir)
        tLegg({ pid: `ts-${i}-${l}-s${k}`, part: 'spaer', navn: st.navn, profil: pr(48, hs), ...iXY(st.poly, z0, T), flate: 'tre', darken: 0.92, explode: ex, kapp: { kvalitet: kv, lengdeMm: lenO(st.poly, st.dir), prisId: `bjelke-48x${hs}`, kategori: 'konstruksjon', endeA: { vinkel: va, type: 'gjaering' }, endeB: { vinkel: vb, type: 'gjaering' } } })
      })
    }
    // Spikerplater i knutepunktene (ytre lag, begge sider).
    const pkt: P2[] = n.type === 'pulttak' ? [[xL + 80, yU - hu / 2], [xL + S - 80, yU - hu / 2 + 60]] : [[xL + 80, yU - hu / 2], [xL + S - 80, yU - hu / 2], [0, Math.min(bunnL(0), bunnR(0)) + 30]]
    if (!gavl && n.type !== 'pulttak') pkt.push([xL + S / 4, bunnL(xL + S / 4)], [xL + (3 * S) / 4, bunnR(xL + (3 * S) / 4)], [xL + S / 3, yU], [xL + (2 * S) / 3, yU])
    pkt.forEach(([px, py], k) => {
      for (const side of [-1, 1]) {
        const zz = side < 0 ? z - (lag * T) / 2 - 1 : z + (lag * T) / 2
        tLegg({ pid: `pl-${i}-${k}-${side}`, part: 'beslag', navn: 'Spikerplate', profil: '100 × 200 mm', ...iXY(rekt(px - 60, py - 60, px + 60, py + 60), zz, 1), flate: 'metall', explode: ex })
      }
    })
  }

  if (n.type !== 'valmtak') {
    takPosZ.forEach((z, i) => leggTakstol(z, `${i}`, 1, i === 0 || i === takPosZ.length - 1, takstol!))
  } else {
    const vd = valmData!
    takPosZ.forEach((z, i) => {
      const erGirder = pyramide || Math.abs(Math.abs(z) - vd.gz) < 1
      leggTakstol(z, `${i}`, erGirder ? girderLag : 1, false, erGirder ? bæretakstol! : takstol!)
    })
  }

  // ── Valm: oppforing, grat, kongesperre, skiftesperrer ──
  let skifteGeo: SperreGeometri | undefined
  if (n.type === 'valmtak') {
    const vd = valmData!
    const gTv = grat!.valgt
    const tG = gTv.b * gTv.antall
    // Oppforing (48 × hU) på toppsvilla der valmen bærer – samme høyde som takstolenes undergurt.
    const oppf = (x0: number, z0: number, x1: number, z1: number, id: string) => {
      const L = Math.max(Math.abs(x1 - x0), Math.abs(z1 - z0))
      tLegg({ pid: `oppforing-${id}`, part: 'spaer', navn: 'Oppforing (raftebjelke)', profil: pr(48, hU), ...boks([Math.min(x0, x1), yPlate, Math.min(z0, z1)], [Math.max(x0, x1), yU, Math.max(z0, z1)]), flate: 'tre', darken: 0.9, kapp: { kvalitet: kvC24, lengdeMm: R(L), prisId: `bjelke-48x${hU}`, kategori: 'konstruksjon', merknad: 'Høykant på toppsvilla, i liv med ytterveggen; skjøt over stender' } })
    }
    for (const sz of [-1, 1]) {
      // Endevegg (hele bredden) og langvegger fra hjørnet inn til bæretakstolen.
      oppf(-S / 2, sz * (Lr / 2) - (sz > 0 ? T : 0), S / 2, sz * (Lr / 2) + (sz < 0 ? T : 0), `ende${sz}`)
      for (const sx of [-1, 1]) {
        const zA = sz * (vd.gFace + 1)
        const zB = sz * (Lr / 2 - T)
        oppf(sx * (S / 2) - (sx > 0 ? T : 0), Math.min(zA, zB), sx * (S / 2) + (sx < 0 ? T : 0), Math.max(zA, zB), `lang${sz}${sx}`)
      }
    }
    // Skiftesperre/kongesperre: sperre på oppforing (sete s på 48 mm), utstikk oh.
    skifteGeo = sperreGeometri({ vinkelGrader: vinkel, sperreHoydeMm: hO, svillBreddeMm: T, utstikkMm: oh, topp: { type: 'mone', lopMm: S / 2, moneTykkelseMm: 0 } })
    const s2 = skifteGeo.fuglemunn.seteMm
    const hR = hO
    // Polygon for en sperre fra vegg (d = 0) til d = dEnd (plumb), i (d, y).
    const sperrePoly = (dEnd: number): P2[] => {
      const bunn = (d: number) => (d - s2) * tan + yU
      const topp = (d: number) => bunn(d) + hR / cos
      return [[-oh, topp(-oh)], [-oh, bunn(-oh)], [0, bunn(0)], [0, yU], [s2, yU], [dEnd, bunn(dEnd)], [dEnd, topp(dEnd)]]
    }
    // Sperre i vertikalplan: origo på vegglinja, retning dir (x,z) innover, sentrert på linja.
    const sperre = (navn: string, ox: number, oz: number, dx: number, dz: number, dEnd: number, pid: string, tykk = T, _slices = 1, endeFor?: (w: number) => number) => {
      void _slices
      const U: V3 = [dx, 0, dz]
      const Wv: V3 = [-dz, 0, dx]
      const uC = endeFor ? endeFor(0) : dEnd
      const k = endeFor ? (endeFor(1) - endeFor(-1)) / 2 : 0
      const poly = sperrePoly(uC)
      const O: V3 = [ox - Wv[0] * (tykk / 2), 0, oz - Wv[2] * (tykk / 2)]
      // Kappelengde = lengste punkt (kinnkuttets lange side).
      const kappL = kappLengde(sperrePoly(uC + (Math.abs(k) * tykk) / 2), dirO)
      tLegg({ pid, part: 'spaer', navn, profil: pr(48, hR), poly, O, U, V: AX.y, W: Wv, t: tykk, flate: 'tre', explode: [0, 0.45, 0], skjevEnde: k ? { uFra: uC - 0.5, k } : undefined, kapp: { kvalitet: kvC24, lengdeMm: kappL, prisId: `bjelke-48x${hR}`, kategori: 'konstruksjon', endeA: { vinkel: Math.round(vinkel * 10) / 10, type: 'gjaering', merknad: 'loddkutt' }, endeB: { vinkel: Math.round(vinkel * 10) / 10, type: 'gjaering', merknad: endeFor ? `kinnkutt 45° mot grata (${fmtGrader(valm!.skiftesperreKinnkutt.overkantGrader)} på overkant)` : 'loddkutt mot bæretakstol' }, merknad: `Fuglemunn sete ${Math.round(s2)} mm på oppforing${endeFor ? '; lengde målt til lengste spiss' : ''}` } })
    }
    // Hjelp: avstand d (fra vegg) der en sperre i posisjon e (langs veggen) treffer gratens sideflate.
    // Grat fra hjørnet (e = ±E, d = 0) inn 45°: punkter med |e| = E − d. Sideflaten ligger tG/2·√2 (målt langs veggen) innenfor.
    const dGrat = (eAbs: number, E: number) => E - eAbs - (tG / 2) * Math.SQRT2
    for (const sz of [-1, 1]) {
      const zW = sz * (Lr / 2) // endevegg ytterliv
      // Kongesperre: x = 0, fra endeveggen til bæretakstolens flate.
      const dKonge = Lr / 2 - vd.gFace
      sperre('Kongesperre', 0, zW, 0, -sz, dKonge, `konge${sz}`, kongeT)
      // Skiftesperrer på endeveggen: treffer graten. E = S/2.
      // Skiftesperrene kappes med kinnkutt mot gratens sideflate – modellert som to skiver (½ tykkelse) med hver sin lengde.
      vd.endeX.forEach((x, k) => {
        if (dGrat(Math.abs(x), S / 2) < s2 + 80) return
        sperre('Skiftesperre', x, zW, 0, -sz, 0, `skifte-e${sz}-${k}`, T, 2, (w) => dGrat(Math.abs(x + (sz > 0 ? w : -w)), S / 2))
      })
      // Skiftesperrer på langveggene i valmsonen.
      for (const sx of [-1, 1]) {
        vd.langZ.forEach((zz, k) => {
          const z = sz * zz
          if (dGrat(Math.abs(z), Lr / 2) < s2 + 80) return
          // Langs langveggen er E = Lr/2 (målt fra senter), e = |z|.
          sperre('Skiftesperre', sx * (S / 2), z, -sx, 0, 0, `skifte-l${sz}${sx}-${k}`, T, 2, (w) => dGrat(Math.abs(z + (sx > 0 ? -w : w)), Lr / 2))
        })
      }
      // Gratsperrer fra hjørnene.
      for (const sx of [-1, 1]) {
        const cx = sx * (S / 2)
        const cz = zW
        const ux = -sx / Math.SQRT2
        const uz = -sz / Math.SQRT2
        const beta = Math.atan(tan / Math.SQRT2)
        const tb = Math.tan(beta)
        const cb = Math.cos(beta)
        const drop = valm!.senkingMm
        const hGr = gTv.h
        // Arris (gratlinje) over oppforingens ytterhjørne: y = yTopp0 + u·tanβ, der yTopp0 = takflatens overkant i vegglivet.
        const yTopp0 = yU + (0 - s2) * tan + hR / cos
        const topp = (u: number) => yTopp0 + u * tb - drop
        const bunn = (u: number) => topp(u) - hGr / cb
        // Sete: der bunnlinja krysser oppforingens overkant.
        const uSete = Math.max(0, (yU - bunn(0)) / tb)
        const uTail = -oh * Math.SQRT2
        // Øvre ende mot bæretakstolens flate (eller kongesperras side) – kinnkutt 45°.
        const Wv: V3 = [-uz, 0, ux]
        const xEnd = sx * (kongeT / 2)
        const zEnd = sz * vd.gFace
        const uFor = (w: number) => Math.min((xEnd - cx - w * Wv[0]) / ux, (zEnd - cz - w * Wv[2]) / uz)
        const uC = uFor(0)
        const k = (uFor(1) - uFor(-1)) / 2
        const sete: P2[] = uSete > 1 ? [[0, bunn(0)], [0, yU], [uSete, yU]] : [[0, bunn(0)]]
        // Halen planes ned til samme underkant som sperreendene (raftekassen ligger da plant rundt hjørnet).
        const yHale = yTopp0 - oh * tan - hR / cos
        const polyFor = (ue: number): P2[] => klippAlle([[uTail, topp(uTail)], [uTail, bunn(uTail)], ...sete, [ue, bunn(ue)], [ue, topp(ue)]], [{ a: 0, b: -1, c: -yHale }])
        const kappL = kappLengde(polyFor(uC + (Math.abs(k) * tG) / 2), [cb, Math.sin(beta)])
        const O: V3 = [cx - Wv[0] * (tG / 2), 0, cz - Wv[2] * (tG / 2)]
        tLegg({ pid: `grat-${sz}${sx}`, part: 'spaer', navn: 'Gratsperre', profil: gTv.materiale.startsWith('GL') ? gTv.profil : pr(gTv.b, gTv.h), poly: polyFor(uC), O, U: [ux, 0, uz], V: AX.y, W: Wv, t: tG, flate: 'tre', darken: 0.9, explode: [0, 0.55, 0], skjevEnde: { uFra: uC - 0.5, k }, kapp: { kvalitet: gTv.materiale.startsWith('GL') ? 'GL30c' : kvC24, lengdeMm: kappL, prisId: gTv.pris ?? `limtre-${gTv.b}x${gTv.h}`, kategori: 'konstruksjon', endeA: { vinkel: Math.round(((beta * 180) / Math.PI) * 10) / 10, type: 'gjaering', merknad: 'loddkutt hale' }, endeB: { vinkel: Math.round(((beta * 180) / Math.PI) * 10) / 10, type: 'gjaering', merknad: `kinnkutt 45° mot bæretakstol (${fmtGrader(valm!.gratKinnkutt.overkantGrader)} på overkant)` }, merknad: `${gTv.antall > 1 ? `${gTv.antall} lag spikret sammen. ` : ''}Senkes ${Math.round(drop)} mm så overkanten ligger i takflatene; halen planes vannrett i flukt med sperreendene; lengde målt til lengste spiss` } })
      }
    }
  }

  // ── Takflater: tekking/lekter, raftebord, vindski, renner (kanonisk) ──
  // Takflate i et skråplan: origo på vegglinja (ytterliv) i takflatens overkant, U langs raftet, V opp langs fallet, W normal ut.
  interface Flate { navn: string; O: V3; U: V3; Vs: V3; Wn: V3; poly: P2[]; e0: number; e1: number; dMin: number; dMaks: number; renne: boolean; egen: string }
  const flater2: Flate[] = []
  const yTopp0 = yOverkant(xL) - (n.type === 'pulttak' ? 0 : 0) + (0 - 0)
  void yTopp0
  const yRef = yU - s * tan + hO / cos // overkant sperre i vegglivet
  const ohG = Math.min(oh, 400) // gavlutstikk
  const lagFlate = (navn: string, ox: number, oz: number, ex: number, ez: number, dx: number, dz: number, e0: number, e1: number, dMaks: number, valmKant: boolean, renne: boolean, egen: string, hoyKant = false) => {
    const U: V3 = [ex, 0, ez]
    const Vs: V3 = [dx * cos, Math.sin(rad(vinkel)), dz * cos]
    const Wn: V3 = [-dx * Math.sin(rad(vinkel)), cos, -dz * Math.sin(rad(vinkel))]
    const v = (d: number) => d / cos
    const dMin = -oh
    let poly: P2[]
    if (valmKant) {
      // Trapes/trekant begrenset av gratene: |e| ≤ E − d, E = halv lengde ved vegglivet.
      const E = (e1 - e0) / 2
      const em = (e0 + e1) / 2
      const pts: P2[] = [[em - E - oh, v(dMin)], [em + E + oh, v(dMin)]]
      if (E - dMaks > 1) pts.push([em + E - dMaks, v(dMaks)], [em - E + dMaks, v(dMaks)])
      else pts.push([em, v(E)])
      poly = pts
    } else {
      poly = rekt(e0 - ohG, v(dMin), e1 + ohG, v(dMaks + (hoyKant ? oh : 0)))
    }
    flater2.push({ navn, O: [ox, yRef, oz], U, Vs, Wn, poly, e0, e1, dMin, dMaks, renne, egen })
  }
  if (n.type === 'saltak') {
    lagFlate('v', xL, 0, 0, 1, 1, 0, -Lr / 2, Lr / 2, S / 2, false, true, 'v')
    lagFlate('h', -xL, 0, 0, -1, -1, 0, -Lr / 2, Lr / 2, S / 2, false, true, 'h')
  } else if (n.type === 'pulttak') {
    lagFlate('p', xL, 0, 0, 1, 1, 0, -Lr / 2, Lr / 2, S, false, true, 'p', true)
  } else {
    lagFlate('lv', xL, 0, 0, 1, 1, 0, -Lr / 2, Lr / 2, S / 2, true, true, 'lv')
    lagFlate('lh', -xL, 0, 0, -1, -1, 0, -Lr / 2, Lr / 2, S / 2, true, true, 'lh')
    lagFlate('ef', 0, Lr / 2, -1, 0, 0, -1, -S / 2, S / 2, S / 2, true, true, 'ef')
    lagFlate('eb', 0, -Lr / 2, 1, 0, 0, 1, -S / 2, S / 2, S / 2, true, true, 'eb')
  }
  // Posisjoner (e langs raftet) der lekter kan skjøtes: takstoler/sperrer under flaten.
  const bæreE = (f: Flate): number[] => {
    const langsZ = Math.abs(f.U[2]) > 0.5
    const pos = langsZ ? [...takPosZ, ...(valmData ? [...valmData.langZ, ...valmData.langZ.map((z) => -z)] : [])] : valmData ? [0, ...valmData.endeX] : []
    return pos.map((q) => q * (langsZ ? f.U[2] : f.U[0])).sort((a2, b2) => a2 - b2)
  }
  const tekkeFarge = n.tekke === 'stal' ? 0x3d4146 : n.tekke === 'takpapp' ? 0x2e2e30 : 0x3f3a36
  let lektLm = 0
  for (const f of flater2) {
    const base = { O: f.O, U: f.U, V: f.Vs, W: f.Wn }
    if (papp(n.tekke)) {
      tLegg({ pid: `kryssfiner-${f.egen}`, part: 'tak', navn: 'Takplate 18 mm kryssfiner', profil: '18 mm', poly: f.poly, ...base, t: PLY, flate: 'plate', explode: [0, 1.0, 0] })
      tLegg({ pid: `tekke-${f.egen}`, part: 'tak', navn: n.tekkeNavn, profil: 'tekking', poly: f.poly, O: [f.O[0] + f.Wn[0] * PLY, f.O[1] + f.Wn[1] * PLY, f.O[2] + f.Wn[2] * PLY], U: f.U, V: f.Vs, W: f.Wn, t: 6, flate: 'tekke', farge: tekkeFarge, explode: [0, 1.2, 0] })
    } else {
      // Lekter 48×48 c/c ≤ 600 parallelt med raftet, klippet mot gratene.
      const vs = f.poly.map((p) => p[1])
      const v0 = Math.min(...vs)
      const v1 = Math.max(...vs)
      const nL = Math.max(2, Math.ceil((v1 - v0 - LEKT) / 600 - 1e-9) + 1)
      for (let j = 0; j < nL; j++) {
        const va = v0 + 10 + (j * (v1 - v0 - LEKT - 20)) / (nL - 1)
        const es = f.poly.map((p) => p[0])
        const lekt = klippAlle(rekt(Math.min(...es) - 10, va, Math.max(...es) + 10, va + LEKT), polyHalvplan(f.poly))
        if (lekt.length < 3) continue
        // Skjøt midt på takstol/sperre når lekta blir lengre enn lagerlengden.
        const eLo = Math.min(...lekt.map((p) => p[0]))
        const eHi = Math.max(...lekt.map((p) => p[0]))
        const kutt: number[] = []
        let e = eLo
        while (eHi - e > STOKK) {
          const kand = bæreE(f).filter((q) => q - e <= STOKK && q > e + 600)
          const nx = kand[kand.length - 1 - (j % 2)] ?? kand[kand.length - 1] ?? e + STOKK
          kutt.push(nx)
          e = nx
        }
        const grenser = [eLo - 1, ...kutt, eHi + 1]
        for (let q = 0; q < grenser.length - 1; q++) {
          const bit = klippAlle(lekt, [{ a: -1, b: 0, c: -grenser[q] }, { a: 1, b: 0, c: grenser[q + 1] }])
          if (bit.length < 3) continue
          const [va2, vb2] = kappVinkler(bit, [1, 0])
          const L = kappLengde(bit, [1, 0])
          lektLm += L
          tLegg({ pid: `lekt-${f.egen}-${j}-${q}`, part: 'tak', navn: 'Taklekt', profil: pr(48, 48), poly: bit, ...base, t: LEKT, flate: 'tre', darken: 0.85, explode: [0, 0.8, 0], kapp: { kvalitet: kvC24, lengdeMm: L, prisId: 'taklekt-48x48', kategori: 'tak', endeA: { vinkel: va2 }, endeB: { vinkel: vb2 }, merknad: kutt.length ? 'Skjøt midt på takstol' : undefined } })
        }
      }
      tLegg({ pid: `tekke-${f.egen}`, part: 'tak', navn: n.tekkeNavn, profil: 'tekking', poly: f.poly, O: [f.O[0] + f.Wn[0] * LEKT, f.O[1] + f.Wn[1] * LEKT, f.O[2] + f.Wn[2] * LEKT], U: f.U, V: f.Vs, W: f.Wn, t: 8, flate: 'tekke', farge: tekkeFarge, explode: [0, 1.2, 0] })
    }
  }
  const dekke = papp(n.tekke) ? PLY + 6 : LEKT + 8
  // Raftekasse (soffitt) under de laveste sperreendene, raftebord høyt nok til å dekke den.
  const hipDyp = 0 // gratens hale planes til sperrenes underkant
  const fasciaH = (topp: number, bunn: number) => [VS_H, 198, 223].find((h) => topp - h <= bunn + 1) ?? 223
  const fToppLav = yRef - oh * tan + (papp(n.tekke) ? PLY : 0)
  const ySoff = Math.min(fToppLav - VS_H + 10, yRef - oh * tan - Math.max(hO / cos, hipDyp) - 14)
  const fHLav = fasciaH(fToppLav, ySoff - 0)
  const fToppHoy = yRef + (S + oh) * tan + dekke + 10
  const ySoffH = Math.min(fToppHoy - VS_H + 10, yRef + S * tan - hO / cos - 14)
  const fHHoy = fasciaH(fToppHoy, ySoffH)
  // Raftebord på sperreendene langs raftet (alle flater med renne), og vindski på gavler.
  let renner = 0
  let renneLm = 0
  for (const f of flater2) {
    const lang = n.type !== 'valmtak' || f.egen === 'lv' || f.egen === 'lh'
    // Raftebord: loddrett bord i plan d = −oh, fra overkant sperre ned VS_H.
    const yTail = yRef + -oh * tan
    const ext = n.type === 'valmtak' ? (lang ? VS_T : -0) : ohG
    const e0 = f.e0 - (n.type === 'valmtak' ? oh : 0) - ext
    const e1 = f.e1 + (n.type === 'valmtak' ? oh : 0) + ext
    const ox = f.O[0] + -f.Wn[0] * 0 + (f.Vs[0] / cos) * -oh
    const oz = f.O[2] + (f.Vs[2] / cos) * -oh
    const nx = f.Vs[0] / cos
    const nz = f.Vs[2] / cos
    const rb: Prisme = { pid: `raftebord-${f.egen}`, part: 'tak', navn: 'Raftebord', profil: pr(VS_T, fHLav), poly: rekt(e0, fToppLav - fHLav, e1, fToppLav), O: [ox, 0, oz], U: f.U, V: AX.y, W: [-nx, 0, -nz], t: VS_T, flate: 'tre', darken: 0.78, explode: [0, 0.9, 0] }
    tLegg({ ...rb, kapp: { kvalitet: 'Grunnet gran', lengdeMm: R(e1 - e0), prisId: fHLav > VS_H ? 'vindskibord-22x198' : 'vindskibord-22x148', kategori: 'tak', merknad: e1 - e0 > STOKK ? 'Skjøtes med 45° skrå skjøt over sperre' : n.type === 'valmtak' ? 'Gjæres 45° i hjørnene' : undefined } })
    if (n.type === 'pulttak') {
      // Høy raft: raftebord på høy ende.
      const dH = S + oh
      const ox2 = f.O[0] + nx * dH
      const oz2 = f.O[2] + nz * dH
      tLegg({ pid: `raftebord-hoy`, part: 'tak', navn: 'Raftebord', profil: pr(VS_T, fHHoy), poly: rekt(e0, fToppHoy - fHHoy, e1, fToppHoy), O: [ox2, 0, oz2], U: f.U, V: AX.y, W: [nx, 0, nz], t: VS_T, flate: 'tre', darken: 0.78, explode: [0, 0.9, 0], kapp: { kvalitet: 'Grunnet gran', lengdeMm: R(e1 - e0), prisId: fHHoy > VS_H ? 'vindskibord-22x198' : 'vindskibord-22x148', kategori: 'tak' } })
    }
    if (f.renne) {
      // Takrenne 125 mm i plan utenfor raftebordet.
      const gl = n.type === 'valmtak' && !lang ? e1 - e0 - 2 * 140 : e1 - e0 + 2 * VS_T
      const ge0 = n.type === 'valmtak' && !lang ? e0 + 140 : e0 - VS_T
      const halv: P2[] = []
      const dc = -VS_T - 66
      const yr = yTail - 30
      for (let k = 0; k <= 8; k++) {
        const a = Math.PI + (k * Math.PI) / 8
        halv.push([dc + 62 * Math.cos(a), yr + 62 * Math.sin(a)])
      }
      for (let k = 8; k >= 0; k--) {
        const a = Math.PI + (k * Math.PI) / 8
        halv.push([dc + 58 * Math.cos(a), yr + 58 * Math.sin(a)])
      }
      // Profil i (d, y) – ekstrudert langs raftet (U).
      const Wd: V3 = [nx, 0, nz]
      const Or: V3 = [ox + f.U[0] * ge0, 0, oz + f.U[2] * ge0]
      tLegg({ pid: `renne-${f.egen}`, part: 'tak', navn: 'Takrenne 125 mm', profil: 'stål', poly: halv, O: Or, U: Wd, V: AX.y, W: f.U, t: gl, flate: 'metall', farge: 0x3c4046, explode: [0, 0.7, 0] })
      renner++
      renneLm += gl
      if (lang) {
        // Nedløp ved ene enden.
        const pe = ge0 + 130
        const px = ox + f.U[0] * pe + nx * dc
        const pz = oz + f.U[2] * pe + nz * dc
        tLegg({ pid: `nedlop-${f.egen}`, part: 'tak', navn: 'Nedløp', profil: 'Ø87 stål', ...boks([px - 40, SLAB + 50, pz - 40], [px + 40, yr - 40, pz + 40]), flate: 'metall', farge: 0x3c4046, explode: [0, 0, 0] })
      }
    }
  }
  // Vindski på gavlene (saltak/pult), og vindskisperre under gavlutstikket.
  let vindskiLm = 0
  if (n.type !== 'valmtak') {
    for (const sz of [-1, 1]) {
      const zs = sz > 0 ? Lr / 2 + ohG : -Lr / 2 - ohG - VS_T
      const seg: Array<[number, number]> = n.type === 'saltak' ? [[xL - oh, 0], [0, -xL + oh]] : [[xL - oh, -xL + oh]]
      for (const [x0, x1] of seg) {
        const topp = (x: number) => yOverkant(x) + dekke + 10
        const poly: P2[] = [[x0, topp(x0)], [x1, topp(x1)], [x1, topp(x1) - VS_H / cos], [x0, topp(x0) - VS_H / cos]]
        const stiger = topp(x1) > topp(x0)
        const L = kappLengde(poly, [cos, (stiger ? 1 : -1) * Math.sin(rad(vinkel))])
        vindskiLm += L
        tLegg({ pid: `vindski-${sz}-${x0}`, part: 'tak', navn: 'Vindski', profil: pr(VS_T, VS_H), ...iXY(poly, zs, VS_T), flate: 'tre', darken: 0.8, explode: [0, 0.85, sz * 0.2], kapp: { kvalitet: 'Grunnet gran', lengdeMm: L, prisId: 'vindskibord-22x148', kategori: 'tak', endeA: { vinkel: Math.round(vinkel * 10) / 10, type: 'gjaering' }, endeB: { vinkel: Math.round(vinkel * 10) / 10, type: 'gjaering', merknad: n.type === 'saltak' ? 'gjæres i mønet' : undefined } } })
        // Vindskisperre (bærer vindskia og takplatene i gavlutstikket).
        const zv = sz > 0 ? Lr / 2 + ohG - T : -Lr / 2 - ohG
        const bunnV = (x: number) => yOverkant(x) - 98 / cos
        const pv: P2[] = [[x0, yOverkant(x0)], [x1, yOverkant(x1)], [x1, bunnV(x1)], [x0, bunnV(x0)]]
        tLegg({ pid: `vindskisperre-${sz}-${x0}`, part: 'tak', navn: 'Vindskisperre', profil: pr(48, 98), ...iXY(pv, zv, T), flate: 'tre', darken: 0.86, explode: [0, 0.6, sz * 0.15], kapp: { kvalitet: kvC24, lengdeMm: kappLengde(pv, [cos, (stiger ? 1 : -1) * Math.sin(rad(vinkel))]), prisId: 'bjelke-48x98', kategori: 'tak', endeA: { vinkel: Math.round(vinkel * 10) / 10, type: 'gjaering' }, endeB: { vinkel: Math.round(vinkel * 10) / 10, type: 'gjaering' }, merknad: `Henges i lekter/takplater; stikkere 48×98 flatt over gavltakstolen c/c 1200 ved utstikk > 300 mm` } })
      }
    }
    if (n.type === 'saltak' && n.tekke === 'stal') {
      const ym = yOverkant(0) + dekke
      tLegg({ pid: 'monebeslag', part: 'tak', navn: 'Mønebeslag', profil: 'stål', poly: [[-160, ym - 160 * tan + 2], [0, ym + 8], [160, ym - 160 * tan + 2], [160, ym - 160 * tan + 8], [0, ym + 14], [-160, ym - 160 * tan + 8]], O: [0, 0, -Lr / 2 - ohG - 30], U: AX.x, V: AX.y, W: AX.z, t: Lr + 2 * ohG + 60, flate: 'metall', farge: 0x3d4146, explode: [0, 1.25, 0] })
    }
  }
  // Raftekasse (soffitt) under utstikket langs raftene.
  for (const f of flater2) {
    if (n.type === 'pulttak' && f.egen !== 'p') continue
    const lang = n.type !== 'valmtak' || f.egen === 'lv' || f.egen === 'lh'
    const nx = f.Vs[0] / cos
    const nz = f.Vs[2] / cos
    const e0 = f.e0 - (n.type === 'valmtak' && lang ? oh : 0)
    const e1 = f.e1 + (n.type === 'valmtak' && lang ? oh : 0)
    const poly: P2[] = n.type === 'valmtak' ? (lang ? [[e0, -oh], [e1, -oh], [e1 - oh, 0], [e0 + oh, 0]] : [[e0 - oh, -oh], [e1 + oh, -oh], [e1, 0], [e0, 0]]) : rekt(e0, -oh, e1, 0)
    // poly i (e, d) – horisontalt plan.
    const O: V3 = [f.O[0], ySoff, f.O[2]]
    tLegg({ pid: `soffitt-${f.egen}`, part: 'tak', navn: 'Raftekasse (undertak)', profil: 'panel 12 mm', poly: poly.map(([e, d]) => [e, d] as P2), O, U: f.U, V: [nx, 0, nz], W: AX.y, t: 12, flate: 'tre', darken: 0.92, explode: [0, 0.6, 0] })
    if (n.type === 'pulttak') {
      const dH = S
      const ySH = ySoffH
      tLegg({ pid: `soffitt-hoy`, part: 'tak', navn: 'Raftekasse (undertak)', profil: 'panel 12 mm', poly: rekt(e0, dH, e1, dH + oh), O: [f.O[0], ySH, f.O[2]], U: f.U, V: [nx, 0, nz], W: AX.y, t: 12, flate: 'tre', darken: 0.92, explode: [0, 0.6, 0] })
    }
  }

  // Roter taket til verden.
  for (const p of tak) deler.push(roterY(p, rot))

  // ── Kledning (stående bord) ──
  const kl = c.kledningsbord === '19x98' ? { t: 19, b: 98, profil: '19 × 98 mm', pris: 'bord-19x98' } : c.kledningsbord === 'lekt' ? { t: 23, b: 48, profil: '23 × 48 mm', pris: 'lekt-23x48' } : { t: 19, b: 148, profil: '19 × 148 mm', pris: 'bord-19x148' }
  const glipe = c.kledningsbord === 'lekt' ? 20 : 3
  // Kledningstopp (y) i et verdenspunkt på ytterlivet: under raftekasse/takplater.
  const kledTopp = (wx: number, wz: number, v: Vegglinje): number => {
    const [xc, zc] = tilKanon(rot, wx, wz)
    const erGavl = n.type !== 'valmtak' && Math.abs(Math.abs(zc) - Lr / 2) < 5 && Math.abs(Math.abs(xc) - S / 2) > 5
    void v
    if (erGavl) return yOverkant(Math.max(xL, Math.min(-xL, xc))) - 8
    if (n.type === 'pulttak' && xc > S / 2 - 5) return ySoffHoy() - 2
    return ySoff - 2
  }
  const ySoffHoy = () => ySoffH
  let kledningLm = 0
  let kledningM2 = 0
  let kIdx = 0
  for (const v of vegger) {
    const L0 = v.akse === 'x' ? -B / 2 - kl.t : -D / 2 - kl.t
    const L1 = -L0
    const nB = Math.round((L1 - L0) / (kl.b + glipe))
    const step = (L1 - L0) / nB
    for (let i = 0; i < nB; i++) {
      const sc = L0 + (i + 0.5) * step
      const bb = step - glipe
      const wx = v.akse === 'x' ? Math.max(-B / 2, Math.min(B / 2, sc)) : v.ytre
      const wz = v.akse === 'x' ? v.ytre : Math.max(-D / 2, Math.min(D / 2, sc))
      const sKl = (q: number) => (v.akse === 'x' ? Math.max(-B / 2, Math.min(B / 2, q)) : Math.max(-D / 2, Math.min(D / 2, q)))
      const toppVed = (q: number) => (v.akse === 'x' ? kledTopp(sKl(q), wz, v) : kledTopp(wx, sKl(q), v))
      const s0 = sc - bb / 2
      const s1 = sc + bb / 2
      const tL = toppVed(s0)
      const tM = toppVed(sc)
      const tR = toppVed(s1)
      const iPort = v.id === 'front' ? apninger.find((a) => s1 > a.a && s0 < a.b) : undefined
      const y0 = iPort ? portTopp : SLAB - 30
      const yMaks = Math.max(tL, tM, tR)
      if (yMaks - y0 < 40) continue
      // Omriss i veggplanet (s, y) – skråkappet topp under takflaten (gavl), ev. spiss over mønet.
      const poly: P2[] = [[s0, y0], [s1, y0], [s1, tR], ...(tM > Math.max(tL, tR) + 1 ? ([[sc, tM]] as P2[]) : []), [s0, tL]]
      const base =
        v.akse === 'x'
          ? iXY(poly, v.inn < 0 ? v.ytre + 2 : v.ytre - 2 - kl.t, kl.t)
          : { poly, O: [(v.inn > 0 ? v.ytre - 2 - kl.t : v.ytre + 2) + kl.t, 0, 0] as V3, U: AX.z, V: AX.y, W: AX['-x'], t: kl.t }
      const skraa = Math.round(((Math.atan(Math.abs(tR - tL) / bb) * 180) / Math.PI) * 10) / 10
      const spiss = tM > Math.max(tL, tR) + 1
      deler.push({
        pid: `kled-${kIdx++}`,
        part: 'kledning',
        navn: 'Kledning',
        profil: kl.profil,
        ...base,
        flate: 'tre',
        darken: 0.93,
        explode: [v.akse === 'z' ? -v.inn * 0.5 : 0, 0, v.akse === 'x' ? -v.inn * 0.5 : 0],
        kapp: { kvalitet: c.treslag === 'impregnert' ? 'Impregnert, høvlet' : 'Gran, grunnet', lengdeMm: R(yMaks - y0), prisId: kl.pris, kategori: 'kledning', orden: 999, endeA: { vinkel: 0 }, endeB: { vinkel: spiss ? Math.round(((Math.atan(tan) * 180) / Math.PI) * 10) / 10 : skraa, type: 'gjaering', merknad: spiss ? 'spiss i mønet (to skråkutt)' : skraa > 0.5 ? 'skråkapp etter takfallet' : undefined } },
      })
      kledningLm += (yMaks - y0) / 1000
      kledningM2 += ((yMaks - y0) * (bb + glipe)) / 1e6
    }
  }
  // Portomramming (foring + vannbrett over porten).
  for (const a of apninger) {
    deler.push({ pid: `portforing-${a.sc}`, part: 'kledning', navn: 'Vannbrett over port', profil: 'beslag', ...boks([a.a - 30, portTopp, D / 2], [a.b + 30, portTopp + 6, D / 2 + kl.t + 40]), flate: 'metall', farge: 0x3d4146 })
  }

  // ── Beregninger, høyder, byggesak ──
  const moneTopp = (n.type === 'pulttak' ? yOverkant(-xL) : yOverkant(0)) + dekke
  const gesims = n.type === 'pulttak' ? moneTopp : yRef + -oh * tan + dekke
  const takAreal = flater2.reduce((sum, f) => sum + polyAreal(f.poly), 0) / 1e6
  const frost = frostForConfig(c, { snofri: true }) // innvendig/under tak: snøfri
  // Linjelast på kantforsterkning (dimensjonerende) → sålebredde.
  const Nkant = 1.2 * (gTak * lastbredde + 0.5 * (H / 1000)) + 1.5 * sTak * lastbredde
  const saale = saalebredde(Nkant, grunnForConfig(c))
  const byggesak = vurderByggesak({ tiltak: 'frittliggende', byaM2: ((B + 2 * Math.max(0, oh - 1000)) * (D + 2 * Math.max(0, oh - 1000))) / 1e6, moneHoydeM: Math.round(moneTopp) / 1000, gesimsHoydeM: Math.round(gesims) / 1000 })

  void lektLm
  void hSt
  void skifteGeo
  void vindkryssAnt
  return {
    n,
    deler,
    sk,
    takstol,
    bæretakstol,
    grat,
    skifte,
    valm,
    stender,
    stenderVind,
    portbjelke,
    geo,
    frost,
    saale,
    byggesak,
    cc,
    dS,
    hU,
    hO,
    yPlate,
    hoyder: { gesims, mone: moneTopp },
    apninger,
    portHEff,
    portB,
    meldinger,
    takPosZ,
    vindQp: vind.qp,
    takAreal,
    renner,
    renneLm,
    kledningLm,
    kledningM2,
    vindskiLm,
    minVinkel,
  }
}

/** Konvekst polygon → halvplan (innsiden). */
function polyHalvplan(poly: P2[]): Halvplan[] {
  const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length
  const cy = poly.reduce((s, p) => s + p[1], 0) / poly.length
  return poly.map((p, i) => {
    const q = poly[(i + 1) % poly.length]
    return halvplanLinje(p, [q[0] - p[0], q[1] - p[1]], [cx, cy])
  })
}

// ── Kappliste og materialliste ─────────────────────────────────────

function kappliste(c: GarasjeConfig): KapplisteDelPlan[] {
  return lagKappliste(modell(c).deler)
}

function beregn(c: GarasjeConfig): Bom {
  const m = modell(c)
  const { n } = m
  const faktor = TRESLAG[c.treslag]?.prisFaktor ?? 1
  const linjer: BomLinePlan[] = []
  let kr = 0
  const legg = (l: BomLinePlan, enhetPris: number) => {
    const p = Math.round(l.antall * enhetPris)
    kr += p
    linjer.push({ ...l, prisKr: p })
  }
  // Fundament: plate med kantforsterkning.
  const A = ((n.B + 100) * (n.D + 100)) / 1e6
  const omkrets = (2 * (n.B + n.D)) / 1000
  const kantB = Math.max(0.3, m.saale)
  const betong = A * 0.1 + omkrets * kantB * 0.2
  legg({ navn: 'Ferdigbetong B30 (plate + kantforsterkning)', spesifikasjon: `100 mm plate + kant ${Math.round(kantB * 1000)}×300 mm`, antall: Math.round(betong * 1.08 * 10) / 10, enhet: 'm³', kategori: 'fundament', prisId: 'betong-m3', kommentar: 'inkl. 8 % svinn' }, prisFor('betong-m3'))
  legg({ navn: PRISER['armeringsnett'].navn, spesifikasjon: 'K131, 2 lag i kantforsterkningen', antall: Math.ceil((A * 1.15) / 10) + Math.ceil(omkrets / 5), enhet: 'stk', kategori: 'fundament', prisId: 'armeringsnett' }, prisFor('armeringsnett'))
  legg({ navn: PRISER['markisolasjon-xps'].navn, spesifikasjon: 'Under plata + 1,2 m vinger ut fra kanten (frostsikring uoppvarmet bygg, Byggforsk 521.111)', antall: Math.round((A + omkrets * 1.2) * 10) / 10, enhet: 'm²', kategori: 'fundament', prisId: 'markisolasjon-xps' }, prisFor('markisolasjon-xps'))
  legg({ navn: PRISER['radonsperre'].navn, antall: Math.round(A * 1.15 * 10) / 10, enhet: 'm²', kategori: 'fundament', prisId: 'radonsperre' }, prisFor('radonsperre'))
  legg({ navn: PRISER['grus-pukk'].navn, spesifikasjon: '200 mm komprimert under plata', antall: Math.round(((n.B + 1000) * (n.D + 1000) * 0.2) / 1e6 * 10) / 10, enhet: 'm³', kategori: 'fundament', prisId: 'grus-pukk' }, prisFor('grus-pukk'))
  // Trelast fra kapplista.
  for (const t of treInnkjop(kappliste(c), m.deler)) {
    const tre = !t.prisId.startsWith('limtre') && t.prisId !== 'vindskibord-22x148'
    const p = t.lm * prisFor(t.prisId) * (tre ? faktor : 1)
    kr += p
    linjer.push({ navn: PRISER[t.prisId]?.navn ?? t.profil, spesifikasjon: t.spesifikasjon, antall: Math.round(t.lm * 10) / 10, enhet: 'lm', kategori: t.kategori, kvalitet: t.kvalitet, prisId: t.prisId, prisKr: Math.round(p) })
  }
  legg({ navn: PRISER['vindsperre'].navn, spesifikasjon: c.kledningsbord === 'lekt' ? 'UV-bestandig sort duk (synlig mellom lektene)' : 'Anbefalt – gir tett vegg mot slagregn/fokksnø', antall: Math.round(m.kledningM2 * 1.1), enhet: 'm²', kategori: 'kledning', prisId: 'vindsperre' }, prisFor('vindsperre'))
  // Tak.
  const takA = m.takAreal * 1.1
  if (papp(n.tekke)) {
    legg({ navn: PRISER['kryssfiner-18-plate'].navn, antall: Math.ceil((m.takAreal * 1.06) / 2.88), enhet: 'stk', kategori: 'tak', kommentar: 'Skjøter på takstol, not/fjær på tvers', prisId: 'kryssfiner-18-plate' }, prisFor('kryssfiner-18-plate'))
    if (n.tekke === 'shingel') legg({ navn: PRISER['undertaksbelegg'].navn, antall: Math.ceil(takA / 15), enhet: 'rull', kategori: 'tak', prisId: 'undertaksbelegg' }, prisFor('undertaksbelegg'))
  }
  const tekkeId = n.tekke === 'stal' ? 'taktekke-stalplater' : n.tekke === 'shingel' ? 'taktekke-shingel' : 'taktekke-takpapp'
  legg({ navn: n.tekkeNavn, antall: Math.round(takA * 10) / 10, enhet: 'm²', kategori: 'tak', kommentar: 'inkl. 10 % svinn/omlegg', prisId: tekkeId }, prisFor(tekkeId))
  if (n.tekke === 'stal') {
    if (n.type === 'saltak') legg({ navn: PRISER['monebeslag'].navn, antall: Math.round((n.Lr / 1000 + 0.8) * 10) / 10, enhet: 'lm', kategori: 'tak', prisId: 'monebeslag' }, prisFor('monebeslag'))
    if (m.vindskiLm > 0) legg({ navn: PRISER['vindskibeslag'].navn, antall: Math.round((m.vindskiLm / 1000) * 10) / 10, enhet: 'lm', kategori: 'tak', prisId: 'vindskibeslag' }, prisFor('vindskibeslag'))
  }
  const soffM2 = m.deler.filter((d) => d.navn === 'Raftekasse (undertak)').reduce((sum, d) => sum + polyAreal(d.poly), 0) / 1e6
  legg({ navn: 'Raftekasse – kledning/panel 12×120 mm', antall: Math.round(soffM2 * 1.15 * 10) / 10, enhet: 'm²', kategori: 'tak', prisId: 'veggpanel' }, prisFor('veggpanel') * 0.6)
  if (m.renneLm > 0) {
    const nedlop = m.deler.filter((d) => d.navn === 'Nedløp').length
    legg({ navn: PRISER['takrenne'].navn, antall: Math.round((m.renneLm / 1000 + 0.2 * m.renner) * 10) / 10, enhet: 'lm', kategori: 'tak', kommentar: 'Fall min. 1:200 mot nedløp', prisId: 'takrenne' }, prisFor('takrenne'))
    legg({ navn: PRISER['rennekrok'].navn, antall: Math.ceil(m.renneLm / 600) + m.renner, enhet: 'stk', kategori: 'tak', prisId: 'rennekrok' }, prisFor('rennekrok'))
    legg({ navn: PRISER['nedlop'].navn, antall: Math.round(nedlop * ((m.yPlate - SLAB) / 1000 + 0.8) * 10) / 10, enhet: 'lm', kategori: 'tak', prisId: 'nedlop' }, prisFor('nedlop'))
    legg({ navn: PRISER['renne-ende'].navn, antall: m.renner, enhet: 'stk', kategori: 'tak', prisId: 'renne-ende' }, prisFor('renne-ende'))
  }
  // Beslag og festemidler.
  const svillLm = m.deler.filter((d) => d.navn === 'Bunnsvill').reduce((sum, d) => sum + (d.kapp?.lengdeMm ?? 0), 0) / 1000
  legg({ navn: PRISER['svillmembran'].navn, antall: Math.ceil(svillLm * 1.05), enhet: 'lm', kategori: 'fundament', prisId: 'svillmembran' }, prisFor('svillmembran'))
  const nSvill = m.deler.filter((d) => d.navn === 'Bunnsvill').length
  legg({ navn: PRISER['betongskrue'].navn, spesifikasjon: 'c/c ≤ 1000 og 200 mm fra hver ende', antall: Math.ceil(svillLm) + nSvill * 2, enhet: 'stk', kategori: 'festemidler', prisId: 'betongskrue' }, prisFor('betongskrue'))
  const nPl = m.deler.filter((d) => d.navn === 'Spikerplate').length
  legg({ navn: PRISER['spikerplate'].navn, antall: nPl, enhet: 'stk', kategori: 'beslag', kommentar: 'Takstolknutepunkter, begge sider', prisId: 'spikerplate' }, prisFor('spikerplate'))
  const nTs = new Set(m.deler.filter((d) => d.navn === 'Takstol – undergurt').map((d) => d.pid.split('-').slice(0, 3).join('-'))).size
  const nSperrer = m.deler.filter((d) => (d.navn === 'Skiftesperre' || d.navn === 'Kongesperre') && d.kapp).length
  legg({ navn: PRISER['vinkelbeslag'].navn, antall: (nTs + nSperrer) * 2, enhet: 'stk', kategori: 'beslag', kommentar: 'Takstol/sperre → toppsvill, begge sider (vindsug)', prisId: 'vinkelbeslag' }, prisFor('vinkelbeslag'))
  const kryss = m.deler.filter((d) => d.navn === 'Vindkryss (stålbånd)')
  if (kryss.length) {
    legg({ navn: PRISER['hulband'].navn, antall: Math.ceil((kryss.length * 3.6) / 10), enhet: 'rull', kategori: 'beslag', kommentar: 'Vindkryss i hjørnefeltene', prisId: 'hulband' }, prisFor('hulband'))
    legg({ navn: PRISER['bandstrammer'].navn, antall: kryss.length, enhet: 'stk', kategori: 'beslag', prisId: 'bandstrammer' }, prisFor('bandstrammer'))
  }
  legg({ navn: PRISER['kamspiker'].navn, antall: Math.ceil(((nTs + nSperrer) * 20 + kryss.length * 30) / 250), enhet: 'pk', kategori: 'festemidler', prisId: 'kamspiker' }, prisFor('kamspiker'))
  legg({ navn: 'Spiker/skruer for stenderverk og kledning', spesifikasjon: 'Varmforsinket 75/90 mm (reisverk), 2,8×65 mm kledningsspiker', antall: Math.round(m.kledningLm * 4 + 400), enhet: 'stk', kategori: 'festemidler', prisId: 'skrue' }, prisFor('skrue') * 0.5)
  // Port(er).
  const portId = m.portB >= 3000 ? 'garasjeport-3000' : m.portB >= 2700 ? 'garasjeport-2700' : m.portB >= 2500 ? 'garasjeport-2500' : 'garasjeport-2400'
  legg({ navn: PRISER[portId].navn, spesifikasjon: `Byggåpning ${m.portB} × ${m.portHEff} mm; krever ca. 250 mm overhøyde og ${m.portB + 200} mm innvendig bredde`, antall: n.porter, enhet: 'stk', kategori: 'utstyr', prisId: portId }, prisFor(portId))
  legg({ navn: PRISER['beslag-port'].navn, antall: n.porter, enhet: 'stk', kategori: 'kledning', prisId: 'beslag-port' }, prisFor('beslag-port'))

  const areal = (n.B * n.D) / 1e6
  let timer = 45 + areal * 2.2
  if (n.porter === 2) timer += 10
  if (n.type === 'valmtak') timer += 18
  else if (n.type === 'saltak') timer += 6
  const sammendrag = `${c.bredde} × ${c.dybde} cm · vegghøyde ${c.hoyde} cm · ${n.type} ${fmt(n.vinkel, 0)}° · ${n.porter === 2 ? '2 porter' : '1 port'} ${m.portB}×${m.portHEff} · stendere ${pr(48, m.dS)} c/c ${Math.round(m.cc * 1000)}`
  return { linjer, estimatKr: Math.round(kr / 10) * 10, sammendrag, arealM2: Math.round(areal * 100) / 100, maal: `${c.bredde} × ${c.dybde} cm`, arbeidstimer: Math.round(timer) }
}

// ── Tegninger ──────────────────────────────────────────────────────

const SKJULT = /Spikerplate|Svillmembran|Vindkryss|Taklekt|Takplate|Garasjeport|Losholt|Raftekasse/

function fasade(c: GarasjeConfig, vis: 'front' | 'bak' | 'venstre' | 'hoyre', id: string, navn: string): Riss2D {
  const m = modell(c)
  const { n } = m
  // Kun det som synes utvendig: kledning, tak, port, plate, renner.
  const sett = m.deler.filter((d) => ['kledning', 'tak', 'port', 'plate'].includes(d.part) && !SKJULT.test(d.navn))
  const topp = m.hoyder.mone + 10
  const ext = omslutt(sett)
  const u0 = vis === 'front' ? ext.min[0] : vis === 'bak' ? -ext.max[0] : vis === 'venstre' ? ext.min[2] : -ext.max[2]
  const u1 = vis === 'front' ? ext.max[0] : vis === 'bak' ? -ext.min[0] : vis === 'venstre' ? ext.max[2] : -ext.min[2]
  // Kledningsbord som enkelt-linjer blir for tett – tegn veggflaten som omriss + porter.
  const vegg = sett.filter((d) => d.part !== 'kledning')
  const former: Form2D[] = tilFormer(vegg, vis, [u0, 0], topp) as Form2D[]
  const kled = sett.filter((d) => d.part === 'kledning' && d.navn === 'Kledning')
  const kTynn = tilFormer(kled, vis, [u0, 0], topp, { tynn: () => true }) as Form2D[]
  former.push(...kTynn)
  const H = topp / 10
  const B = (u1 - u0) / 10
  const cmX = (u: number) => Math.round(u - u0) / 10
  const cmY = (y: number) => Math.round(topp - y) / 10
  const bredde = vis === 'front' || vis === 'bak' ? n.B : n.D
  const maal: Maal2D[] = [
    { x1: cmX(-bredde / 2), y1: H, x2: cmX(bredde / 2), y2: H, label: `${Math.round(bredde / 10)} cm`, offset: 26 },
    { x1: 0, y1: cmY(m.yPlate), x2: 0, y2: H, label: `${Math.round(m.yPlate / 10)} cm`, offset: -26 },
    { x1: B, y1: cmY(m.hoyder.mone), x2: B, y2: H, label: `${n.type === 'pulttak' ? 'Topp' : 'Møne'} ${Math.round(m.hoyder.mone / 10)} cm`, offset: 30 },
  ]
  if (vis === 'front') for (const a of m.apninger) maal.push({ x1: cmX(a.a), y1: cmY(SLAB + m.portHEff), x2: cmX(a.b), y2: cmY(SLAB + m.portHEff), label: `Port ${Math.round(a.bredde / 10)} × ${Math.round(m.portHEff / 10)}`, offset: -12 })
  return { id, navn, type: 'fasade', bredde: B, hoyde: H, former, maal, tekster: [{ x: B / 2, y: cmY(m.hoyder.mone) - 4, tekst: `${fmt(n.vinkel, 0)}°` }] }
}

function plan(c: GarasjeConfig): Riss2D {
  const m = modell(c)
  const { n } = m
  const sett = m.deler.filter((d) => ['Bunnsvill', 'Stender', 'Hjørnestender', 'Oppleggsstender (port)'].includes(d.navn))
  const takKant = omslutt(m.deler.filter((d) => d.navn === 'Raftebord' || d.navn === 'Vindski'))
  const alt = omslutt(m.deler.filter((d) => d.part !== 'plate'))
  const x0 = alt.min[0]
  const z0 = alt.min[2]
  const kant = m.deler.filter((d) => d.navn === 'Takrenne 125 mm' || d.navn === 'Raftebord' || d.navn === 'Vindski')
  const former: Form2D[] = [...(tilFormer(sett, 'plan', [x0, z0], 0) as Form2D[]), ...(tilFormer(kant, 'plan', [x0, z0], 0, { tynn: () => true }) as Form2D[]), { type: 'rect', x: (takKant.min[0] - x0) / 10, y: (takKant.min[2] - z0) / 10, w: (takKant.max[0] - takKant.min[0]) / 10, h: (takKant.max[2] - takKant.min[2]) / 10, dashed: true }]
  if (n.type === 'saltak') {
    const [ax, az] = tilVerden(n.rot, 0, -n.Lr / 2)
    const [bx, bz] = tilVerden(n.rot, 0, n.Lr / 2)
    former.push({ type: 'line', points: [[(ax - x0) / 10, (az - z0) / 10], [(bx - x0) / 10, (bz - z0) / 10]], dashed: true })
  }
  const cx = (x: number) => Math.round(x - x0) / 10
  const cz = (z: number) => Math.round(z - z0) / 10
  const B = (alt.max[0] - x0) / 10
  const H = (alt.max[2] - z0) / 10
  const maal: Maal2D[] = [
    { x1: cx(-n.B / 2), y1: H, x2: cx(n.B / 2), y2: H, label: `${c.bredde} cm`, offset: 26 },
    { x1: 0, y1: cz(-n.D / 2), x2: 0, y2: cz(n.D / 2), label: `${c.dybde} cm`, offset: -26 },
  ]
  for (const a of m.apninger) maal.push({ x1: cx(a.a), y1: cz(n.D / 2), x2: cx(a.b), y2: cz(n.D / 2), label: `${Math.round(a.bredde / 10)}`, offset: 50 })
  return { id: 'plan', navn: 'Plan (stenderverk)', type: 'plan', bredde: B, hoyde: H, former, maal, tekster: [{ x: B / 2, y: H / 2, tekst: `${n.porter === 2 ? 'Dobbel' : 'Enkel'} garasje ${fmt((n.B * n.D) / 1e6, 1)} m²` }] }
}

function snitt(c: GarasjeConfig): Riss2D {
  const m = modell(c)
  const { n } = m
  // Snitt i takstolplanet nær midten (viser takstolen i profil).
  const zMid = m.takPosZ[Math.floor(m.takPosZ.length / 2)]
  const [px, pz] = tilVerden(n.rot, 0, zMid)
  const langsX = n.rot % 2 === 0 // takstolplanet er x–y når rot er partall
  const vis: 'front' | 'venstre' = langsX ? 'front' : 'venstre'
  const plan0 = langsX ? pz : px
  const kutt = m.deler.filter((d) => {
    if (/Spikerplate|Garasjeport|Vindkryss|Svillmembran/.test(d.navn)) return false
    const e = omslutt([d])
    const k = langsX ? 2 : 0
    return e.min[k] <= plan0 + 25 && e.max[k] >= plan0 - 25
  })
  const topp = m.hoyder.mone + 10
  const ext = omslutt(kutt)
  const u0 = langsX ? ext.min[0] : ext.min[2]
  const former = tilFormer(kutt, vis, [u0, 0], topp, { tynn: (d) => d.part === 'kledning' || d.part === 'tak' }) as Form2D[]
  const B = ((langsX ? ext.max[0] : ext.max[2]) - u0) / 10
  const H = topp / 10
  const cmX = (u: number) => Math.round(u - u0) / 10
  const cmY = (y: number) => Math.round(topp - y) / 10
  const bredde = langsX ? n.B : n.D
  return {
    id: 'snitt',
    navn: 'Snitt A–A (gjennom takstol)',
    type: 'snitt',
    bredde: B,
    hoyde: H,
    former,
    maal: [
      { x1: cmX(-bredde / 2), y1: H, x2: cmX(bredde / 2), y2: H, label: `${Math.round(bredde / 10)} cm`, offset: 26 },
      { x1: 0, y1: cmY(m.yPlate), x2: 0, y2: cmY(SLAB), label: `Vegg ${Math.round((m.yPlate - SLAB) / 10)}`, offset: -26 },
      { x1: B, y1: cmY(m.hoyder.mone), x2: B, y2: H, label: `${Math.round(m.hoyder.mone / 10)}`, offset: 26 },
    ],
    tekster: [{ x: B / 2, y: cmY(m.hoyder.mone) + 10, tekst: `${fmt(n.vinkel, 0)}°` }],
  }
}

function tegning2D(c: GarasjeConfig): Tegning2D {
  return { riss: [plan(c), fasade(c, 'front', 'forfra', 'Forfra (port)'), fasade(c, 'hoyre', 'siden', 'Fra siden'), snitt(c)] }
}
function soknadTegning(c: GarasjeConfig): Tegning2D {
  return { riss: [plan(c), fasade(c, 'front', 'fasade-front', 'Fasade front (port)'), fasade(c, 'bak', 'fasade-bak', 'Fasade bak'), fasade(c, 'venstre', 'fasade-venstre', 'Fasade venstre'), fasade(c, 'hoyre', 'fasade-hoyre', 'Fasade høyre'), snitt(c)] }
}

// ── Beregningsgrunnlag / byggeregler / montering ───────────────────

function beregningsgrunnlag(c: GarasjeConfig): Beregningsgrunnlag {
  const m = modell(c)
  const { n } = m
  const kl = kappliste(c)
  const p = (navn: string) => kl.find((r) => r.navn === navn)?.pos
  const deler: Record<string, Dimensjonering | Medlemskontroll> = {}
  const pos: Record<string, string> = {}
  const sett = (navn: string, d: Dimensjonering | Medlemskontroll | undefined, kappNavn: string) => {
    if (!d) return
    deler[navn] = d
    const q = p(kappNavn)
    if (q) pos[navn] = q
  }
  sett('Takstol – overgurt', m.takstol!.overgurt, 'Takstol – overgurt')
  sett('Takstol – undergurt', m.takstol!.undergurt, 'Takstol – undergurt')
  sett('Takstol – staver', m.takstol!.stav, n.type === 'pulttak' ? 'Takstol – stav loddrett' : 'Takstol – stav indre')
  if (m.bæretakstol) {
    sett('Bæretakstol – overgurt', m.bæretakstol.overgurt, 'Takstol – overgurt')
    sett('Bæretakstol – undergurt', m.bæretakstol.undergurt, 'Takstol – undergurt')
    sett('Bæretakstol – staver', m.bæretakstol.stav, 'Takstol – stav indre')
  }
  sett('Gratsperre', m.grat, 'Gratsperre')
  sett('Skiftesperre/kongesperre', m.skifte, 'Kongesperre')
  sett('Stender – aksial', m.stender, 'Stender')
  sett('Stender – vind + aksial', m.stenderVind, 'Stender')
  sett('Portbjelke', m.portbjelke, 'Portbjelke')
  const t = TAKTEKKE[n.tekke]
  const rapport = lagBeregningsrapport({
    produkt: 'garasje',
    tittel: `Garasje ${c.bredde} × ${c.dybde} cm – ${n.type}`,
    forutsetninger: [
      { navn: 'Taktype', verdi: `${n.type} ${fmt(n.vinkel, 1)}°, takstoler c/c ${Math.round(m.cc * 1000)} mm` },
      { navn: 'Taktekking', verdi: t.navn, kilde: `g_k = ${fmt(t.gk, 2)} kN/m² takflate (${t.oppbygging})` },
      { navn: 'Pålitelighetsklasse', verdi: 'CC1/RC1 (K_FI = 1,0)', kilde: 'NS-EN 1990 NA' },
      { navn: 'Tjenesteklasse', verdi: 'TK 2 (uisolert, ventilert bygg)', kilde: 'NS-EN 1995-1-1 2.3.1.3' },
      { navn: 'Stenderverk', verdi: `${pr(48, m.dS)} C24 c/c ≤ ${Math.round(m.cc * 1000)}, høyde ${Math.round((m.yPlate - SLAB - 144))} mm`, kilde: 'Byggforsk 523.255' },
      { navn: 'Port', verdi: `${n.porter} × ${m.portB} × ${m.portHEff} mm` },
      { navn: 'Vind', verdi: `v_b,0 = ${VB0_STANDARD} m/s, terrengkategori II, q_p = ${fmt(m.vindQp, 2)} kN/m²`, kilde: 'NS-EN 1991-1-4 NA (standardverdi)', usikker: true },
      { navn: 'Grunn/frost', verdi: 'Morene (telefarlig), innlandsklima', kilde: 'Byggforsk 521.111 (forenklet sone)', usikker: true },
    ],
    snolast: { mark: m.sk, tak: snolastTak(m.sk.sk, n.vinkel) },
    vind: vindlast(VB0_STANDARD, 2, Math.max(4, m.hoyder.mone / 1000)),
    deler,
    pos,
    frost: m.frost,
    byggesak: m.byggesak,
    merknader: [
      `Takstoler: ${m.takstol!.melding}. Oppleggsreaksjon per takstol G = ${fmt(m.takstol!.reaksjon.G[0], 2)} kN, snø = ${fmt(m.takstol!.reaksjon.S[0], 2)} kN.`,
      ...(m.bæretakstol ? [`Bæretakstol ved valmen: ${m.bæretakstol.melding}.`] : []),
      `Kantforsterkning: dimensjonerende linjelast fra vegg ≈ ${fmt(1.2 * 0.6 + 1.5 * 1, 1)}–${fmt(m.saale * 75, 1)} kN/m → minste sålebredde ${Math.round(m.saale * 1000)} mm på morene (σ_Rd 200 kPa forutsatt).`,
      'Uoppvarmet garasje: frostsikres med markisolasjon under hele plata og vinger ut fra kanten (Byggforsk 521.111, tabell for uoppvarmede bygg) – eller ringmur til frostfri dybde.',
      `Snø μ1 = ${fmt(mu1(n.vinkel), 2)}. Takstolene står over stendere; svill forankres med betongskrue c/c ≤ 1000 mot vindsug.`,
    ],
    ekstraAdvarsler: m.meldinger,
  })
  return tilPlanVedlegg(rapport)
}

function byggeregler(c: GarasjeConfig) {
  const m = modell(c)
  const b = tilByggeregler(m.byggesak)
  b.punkter.splice(1, 0, `BYA ${fmt((m.n.B * m.n.D) / 1e6, 1)} m² (utvendig vegg; takutstikk ≤ 1,0 m teller ikke). Mønehøyde ${fmt(m.hoyder.mone / 1000, 2)} m og gesimshøyde ${fmt(m.hoyder.gesims / 1000, 2)} m målt fra terreng (plate 10 cm over terreng).`)
  return b
}

function monteringPlan(c: GarasjeConfig): MonteringSteg[] {
  const m = modell(c)
  const { n } = m
  const kl = kappliste(c)
  const p = (navn: string) => kl.find((r) => r.navn === navn)?.pos ?? ''
  const diag = Math.round(Math.hypot(n.B, n.D) / 10)
  const steg: MonteringSteg[] = [
    { trinn: 'fundament', tittel: 'Grunnarbeid og plate', tekst: `Grav ut matjord, legg fiberduk og 200 mm komprimert pukk. Legg markisolasjon (XPS) under hele plata og 1,2 m vinger ut fra kanten. Forskal ${c.bredde + 10} × ${c.dybde + 10} cm, kantforsterkning min. ${Math.round(Math.max(0.3, m.saale) * 1000)} mm bred × 300 mm, armering K131. Støp 100 mm plate med fall 1:100 mot porten. Diagonal ≈ ${diag} cm.`, verktoy: ['Minigraver', 'Laser', 'Vibratorplate', 'Betongpusser'], tidTimer: 16, advarsel: 'Plata må herde min. 7 døgn før veggene reises. Sjekk grunnforhold og frost (Byggforsk 521.111).' },
    { trinn: 'reisverk', tittel: `Bunnsvill (pos. ${p('Bunnsvill')})`, tekst: `Legg svillmembran og impregnert bunnsvill ${pr(48, m.dS)} langs ytterkanten (avbrutt i portåpningen${n.porter > 1 ? 'e' : ''}). Forankre med betongskruer c/c ≤ 1000 mm og 200 mm fra hver ende. Kontroller rett vinkel med diagonalmål.`, verktoy: ['Slagdrill', 'Krittsnor'], tidTimer: 3 },
    { trinn: 'reisverk', tittel: `Stenderverk (pos. ${p('Stender')}/${p('Hjørnestender')})`, tekst: `Bygg veggene liggende på plata og reis dem: stendere ${pr(48, m.dS)} c/c ≤ ${Math.round(m.cc * 1000)} – én rett under hver takstol – doble hjørnestendere, losholter c/c 600 i flukt med utsiden for stående kledning. Lodd og avstiv midlertidig.`, verktoy: ['Spikerpistol', 'Kappsag', 'Vater 2 m'], tidTimer: 10 },
    { trinn: 'reisverk', tittel: `Portåpning (pos. ${p('Portbjelke')})`, tekst: `Byggåpning ${m.portB} × ${m.portHEff} mm per port. ${m.portbjelke.valgt.profil} ${m.portbjelke.valgt.materiale} som portbjelke på ${m.apninger.length > 0 ? `${m.portbjelke.kontroll.spennMm ? '' : ''}` : ''}oppleggsstendere (${m.portbjelke.valgt.materiale.startsWith('GL') ? 'limtre' : 'lagene spikret sammen c/c 300'}) med hel stender utenfor i hver side. Krybbestendere c/c ≤ 600 fra portbjelken opp til toppsvillen.`, tidTimer: 3, advarsel: 'Sjekk portleverandørens krav til overhøyde (typisk 250 mm) og sidemål før du låser høyden.' },
    { trinn: 'reisverk', tittel: 'Dobbel toppsvill og vindkryss', tekst: 'Legg nedre toppsvill i flukt med veggene og øvre toppsvill i forband over hjørnene (skjøter forskjøvet min. 1,2 m). Monter vindkryss av stålbånd 40×2 diagonalt i hjørnefeltene, stramt med båndstrammer, spikret i hver stender.', tidTimer: 3 },
  ]
  if (n.type === 'valmtak') {
    steg.push({ trinn: 'tak', tittel: 'Takstoler og bæretakstol', tekst: `Reis takstolene i mønepartiet c/c ${Math.round(m.cc * 1000)}. Bæretakstolen${m.takPosZ.length === 1 ? '' : 'e'} i hver ende av mønet er ${m.bæretakstol?.overgurt.valgt.antall ?? 2} takstoler spikret sammen (c/c 150 i to rader). Fest alle med sperrebeslag i begge sider.`, tidTimer: 6 })
    steg.push({ trinn: 'tak', tittel: `Oppforing, grat og skiftesperrer (pos. ${p('Gratsperre')}/${p('Skiftesperre')})`, tekst: `Legg oppforing 48×${m.hU} høykant på toppsvilla i valmendene. Gratsperrene (${m.grat?.valgt.profil}) går fra hjørnet til bæretakstolen, helning ${fmtGrader(m.valm!.gratVinkelGrader)}, senket ${Math.round(m.valm!.senkingMm)} mm. Kongesperra står midt på endeveggen. Skiftesperrene c/c ${Math.round(m.cc * 1000)} kappes med loddkutt ${fmtGrader(n.vinkel)} og kinnkutt (kappsag: gjæring ${fmtGrader(n.vinkel)}, skråsnitt 45°) mot grata – lengdene står i kapplista.`, tidTimer: 10, advarsel: 'Mål og kontroller hver skiftesperre mot grata før kapping – små avvik i veggene forplanter seg.' })
  } else {
    steg.push({ trinn: 'tak', tittel: `Takstoler (pos. ${p('Takstol – overgurt')}/${p('Takstol – undergurt')})`, tekst: `${n.type === 'pulttak' ? 'Pulttakstoler' : 'W-takstoler'} med spenn ${Math.round(n.S / 10)} cm, c/c ${Math.round(m.cc * 1000)}, rett over stenderne. Lag én mal og kontroller mål/vinkler (${fmtGrader(n.vinkel)}) før resten. Gavltakstolene har loddrette gavlstendere c/c 600 for kledningen. Fest hver takstol med sperrebeslag i begge sider og stiv av med lekt diagonalt i takflaten.`, tidTimer: 6 + m.takPosZ.length * 0.3, advarsel: 'Takstoler kan bestilles ferdig fra takstolfabrikk med denne geometrien – de prosjekterer spikerplatene.' })
  }
  steg.push({ trinn: 'tak', tittel: 'Takflater', tekst: papp(n.tekke) ? `18 mm kryssfiner (not/fjær) med skjøter på takstol, deretter ${n.tekke === 'shingel' ? 'underlagsbelegg og shingel' : 'underlags- og overlagspapp'} etter leverandørens anvisning.` : 'Lekter 48×48 c/c ≤ 600 (og sløyfer/undertak om ønsket), deretter stålplater med omlegg og tetningsskruer. Mønebeslag og vindskibeslag til slutt.', tidTimer: 8 })
  steg.push({ trinn: 'tak', tittel: 'Raftebord, vindski, raftekasse og renner', tekst: `Raftebord 22×148 på sperreendene, ${n.type === 'valmtak' ? 'gjæret i hjørnene' : 'vindski 22×148 på vindskisperrene i gavlene'}. Raftekasse (undertak) under utstikket. Takrenner med fall 1:200 mot nedløp.`, tidTimer: 6 })
  steg.push({ trinn: 'kledning', tittel: 'Kledning', tekst: `${c.kledningsbord === 'lekt' ? 'Sort, UV-bestandig vindsperre og lektekledning 23×48 med 20 mm glipe' : 'Vindsperre (anbefalt) og stående kledning en-over-en'}, spikret i losholtene. Hold kledningen 30 mm ned over plata og min. 15 mm luft mot raftekassen.`, tidTimer: 14 })
  steg.push({ trinn: 'ferdig', tittel: 'Port og beslag', tekst: `Monter seksjonsport${n.porter > 1 ? 'ene' : 'en'} ${m.portB} × ${m.portHEff} mm etter leverandørens anvisning, med vannbrett over åpningen og foring rundt.`, tidTimer: 6 })
  return steg
}

function montering(c: GarasjeConfig): string[] {
  return monteringPlan(c).map((s) => `${s.tittel}: ${s.tekst}`)
}

function raad(c: GarasjeConfig): string[] {
  const m = modell(c)
  const { n } = m
  const r = [
    `Planen er dimensjonert for snølast på mark sk = ${fmt(m.sk.sk, 1)} kN/m²${m.sk.status === 'manuell' ? ' (oppgitt)' : ''}. Velg kommune og høyde over havet i «Byggested» – takstoler, stendere og portbjelke dimensjoneres på nytt.`,
    'Svillen skal være impregnert og ligge på svillmembran – aldri rett på betong.',
    'Takstolene skal stå rett over stenderne. Bruk sperrebeslag i begge sider av hver takstol (vindsug).',
    'En uoppvarmet garasje må frostsikres annerledes enn en bolig – følg Byggforsk 521.111 for markisolasjon, eller støp ringmur til frostfri dybde.',
    'Kontroller portleverandørens krav (overhøyde, sidemål, innvendig dybde for skinner) før du bygger portåpningen.',
    'Behandle kledningen innen ett år; endeved og kuttflater skal grunnes.',
  ]
  if (m.minVinkel) r.push(`Takstolene holder ikke ved ${fmt(n.vinkel, 0)}° for dette spennet – øk takvinkelen til minst ${m.minVinkel}°.`)
  if (n.tekke === 'shingel' && n.vinkel < 15) r.push('Asfaltshingel krever minst 15° takvinkel – velg takpapp eller øk vinkelen.')
  if (n.tekke === 'stal' && n.vinkel < 6) r.push('Stålplater krever normalt minst 6° takvinkel.')
  return r
}

// ── 3D / bounds ────────────────────────────────────────────────────

function buildMesh(c: GarasjeConfig, opts?: BuildOptions): THREE.Group {
  const m = modell(c)
  const tex = opts?.woodTexture ?? null
  const tre = (pid: string, darken = 1) => {
    const ov = opts?.overrides?.[pid]
    const base = new THREE.Color(resolveColor(ov?.treslag ?? c.treslag, ov?.farge ?? c.farge)).multiplyScalar(darken)
    const mat = new THREE.MeshStandardMaterial({ color: base, roughness: 0.8, metalness: 0.04 })
    if (tex) mat.map = tex
    return mat
  }
  return byggGruppe(m.deler, { tre })
}

function bounds(c: GarasjeConfig) {
  const m = modell(c)
  const e = omslutt(m.deler, (d) => d.part !== 'plate')
  return { x: (2 * Math.max(Math.abs(e.min[0]), Math.abs(e.max[0]))) / 1000, y: e.max[1] / 1000, z: (2 * Math.max(Math.abs(e.min[2]), Math.abs(e.max[2]))) / 1000 }
}

export const garasje: ProductTemplate<GarasjeConfig> & {
  beregningsgrunnlag: (c: GarasjeConfig) => Beregningsgrunnlag
  monteringPlan: (c: GarasjeConfig) => MonteringSteg[]
} = {
  id: 'garasje',
  navn: 'Garasje',
  ikon: 'faWarehouse',
  bilde: '/images/products/garasje-3d.webp',
  beskrivelse: 'Tegn garasjen i 3D – enkel eller dobbel, på støpt plate, med takstoler, beregnet portbjelke og stående kledning. Dimensjonert etter Eurokode for snølasten der du bor.',
  tilgjengelig: true,
  fraPris: 990,
  leveranser: ['plan'],
  defaultConfig: {
    bredde: 360,
    dybde: 600,
    hoyde: 240,
    garasjetype: 'enkel',
    porthoyde: 210,
    kledningsbord: '19x148',
    taktype: 'saltak',
    takvinkel: 27,
    takutstikk: 30,
    takretning: 'bak',
    moneretning: 'dybde',
    taktekke: 'takpapp',
    takpapp: true,
    treslag: 'impregnert',
    farge: 'morkegra',
  },
  presets: [
    { id: 'enkel-saltak', navn: 'Enkel garasje', beskrivelse: 'Saltak 27° · port 2500 · 21,6 m²', config: { bredde: 360, dybde: 600, hoyde: 240, garasjetype: 'enkel', porthoyde: 210, taktype: 'saltak', moneretning: 'dybde', takvinkel: 27, takutstikk: 30, taktekke: 'takpapp', kledningsbord: '19x148', treslag: 'impregnert', farge: 'morkegra' } },
    { id: 'enkel-pulttak', navn: 'Enkel m/ pulttak', beskrivelse: 'Moderne pulttak 10° · stål · lektekledning', config: { bredde: 380, dybde: 600, hoyde: 250, garasjetype: 'enkel', porthoyde: 215, taktype: 'pulttak', takretning: 'venstre', takvinkel: 10, takutstikk: 30, taktekke: 'stålplater', kledningsbord: 'lekt', treslag: 'royal', farge: 'sort' } },
    { id: 'dobbel-saltak', navn: 'Dobbel garasje', beskrivelse: 'To porter · saltak 27° · 39 m²', config: { bredde: 650, dybde: 600, hoyde: 240, garasjetype: 'dobbel', porthoyde: 210, taktype: 'saltak', moneretning: 'bredde', takvinkel: 27, takutstikk: 40, taktekke: 'shingel', kledningsbord: '19x148', treslag: 'gran', farge: 'hvit' } },
    { id: 'dobbel-valmtak', navn: 'Dobbel m/ valmtak', beskrivelse: 'Valmtak 25° · shingel · 42 m²', config: { bredde: 700, dybde: 600, hoyde: 250, garasjetype: 'dobbel', porthoyde: 215, taktype: 'valmtak', takvinkel: 25, takutstikk: 40, taktekke: 'shingel', kledningsbord: '19x148', treslag: 'impregnert', farge: 'brun' } },
  ],
  dimensjoner: [
    { key: 'bredde', label: 'Bredde', min: 300, max: 800, step: 10, axis: 'x' },
    { key: 'dybde', label: 'Dybde', min: 500, max: 900, step: 10, axis: 'z' },
    { key: 'hoyde', label: 'Vegghøyde', min: 220, max: 300, step: 5, axis: 'y' },
    { key: 'porthoyde', label: 'Porthøyde (lysåpning)', min: 200, max: 250, step: 5, axis: 'y', handle: false, markers: [200, 210, 213, 225, 250] },
    { key: 'takvinkel', label: 'Takvinkel', min: 5, max: 45, step: 0.5, unit: '°', axis: 'y', handle: false, markers: [10, 15, 22.5, 27, 30, 38] },
    { key: 'takutstikk', label: 'Takutstikk', min: 10, max: 50, step: 5, axis: 'y', handle: false },
  ],
  alternativer: [
    { key: 'garasjetype', label: 'Type', choices: [{ id: 'enkel', label: 'Enkel (1 port)' }, { id: 'dobbel', label: 'Dobbel (2 porter)', patch: { bredde: 650 } }] },
    {
      key: 'taktype',
      label: 'Taktype',
      choices: [
        { id: 'saltak', label: 'Saltak', note: 'W-takstoler', patch: { takvinkel: 27 } },
        { id: 'pulttak', label: 'Pulttak', note: 'Pulttakstoler', patch: { takvinkel: 10, taktekke: 'stålplater' } },
        { id: 'valmtak', label: 'Valmtak', note: 'Grat og skiftesperrer', patch: { takvinkel: 25 } },
      ],
    },
    { key: 'takretning', label: 'Fallretning', visibleWhen: (c) => c.taktype === 'pulttak', choices: [{ id: 'venstre', label: 'Mot venstre' }, { id: 'hoyre', label: 'Mot høyre' }, { id: 'bak', label: 'Bakover' }, { id: 'front', label: 'Framover', note: 'Lav side over porten.' }] },
    { key: 'moneretning', label: 'Møneretning', visibleWhen: (c) => c.taktype === 'saltak', choices: [{ id: 'dybde', label: 'Gavl mot port' }, { id: 'bredde', label: 'Møne langs port' }] },
    { key: 'taktekke', label: 'Taktekke', choices: [{ id: 'takpapp', label: 'Takpapp', note: 'På 18 mm kryssfiner' }, { id: 'shingel', label: 'Shingel', note: 'Min. 15°' }, { id: 'stålplater', label: 'Stålplater', note: 'På lekter, min. 6°' }] },
    { key: 'kledningsbord', label: 'Kledning', choices: [{ id: '19x148', label: 'Stående 19×148' }, { id: '19x98', label: 'Stående 19×98' }, { id: 'lekt', label: 'Lekt 23×48', note: 'Lektekledning på sort duk' }] },
  ],
  materialer: [
    { key: 'treslag', label: 'Treslag', choices: treslagValg(['impregnert', 'gran', 'royal', 'lerk', 'kebony']) },
    { key: 'farge', label: 'Farge / beis', asSwatches: true, choices: fargeValg(['ubehandlet', 'klar', 'hvit', 'lysgra', 'morkegra', 'sort', 'brun', 'gronn']) },
  ],
  parts: [
    { key: 'plate', label: 'Betongplate' },
    { key: 'konstruksjon', label: 'Stenderverk' },
    { key: 'spaer', label: 'Takstoler / sperrer' },
    { key: 'kledning', label: 'Kledning' },
    { key: 'tak', label: 'Tak' },
    { key: 'port', label: 'Garasjeport' },
  ],
  beregn,
  kappliste,
  tegning2D,
  soknadTegning,
  byggeregler,
  beregningsgrunnlag,
  monteringPlan,
  montering,
  raad,
  buildMesh,
  bounds,
}

/** Til tester/QA. */
export const garasjeModell = (c: Partial<GarasjeConfig>) => modell({ ...garasje.defaultConfig, ...c } as GarasjeConfig)
