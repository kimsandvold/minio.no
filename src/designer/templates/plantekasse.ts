import * as THREE from 'three'
import type { Bom, BomLine, BuildOptions, Byggeregler, DesignConfig, ProductTemplate, Tegning2D } from '../types'
import type { Beregningsgrunnlag, KapplisteDelPlan, MonteringSteg } from '../plan-typer'
import { TRESLAG, treslagValg, fargeValg } from '../materials'
import { PRISER, prisFor } from '../priser'
import { fmt } from '../laster'
import { kontrollerBjelke, kontrollerSoyle, maksSpenn, tverrsnitt } from '../dimensjonering'
import type { BjelkeInput, Medlemskontroll, Nedboyningskrav, Tverrsnitt } from '../dimensjonering'
import { lagBeregningsrapport, tilPlanVedlegg } from '../beregningsgrunnlag'
import { basis, byggMesher, ende, f0, lagMatFabrikk, lmLinje, lmPerPris, plasser, prisme, prof, samleKappliste, stegTilTekst } from './smaa-felles'
import type { Stav } from './smaa-felles'

/**
 * Plantekasse – parametrisk template (Minio bygger den ferdig, gratis plan).
 *
 * KONSTRUKSJON
 *  - Liggende bord (21×98 / 28×120 / 28×145) rundt en rettvinklet omkrets
 *    (kvadrat, rektangel, L-form inn- eller utvendig hjørne). Hjørnene er
 *    lagt i FORBAND: annenhver rad går gjennom på hver side (som tømmer), og
 *    det andre bordet butter mot innsiden. Øverste rad kløyves til eksakt
 *    høyde.
 *  - Hjørner: «hjørnebord» (to stående bord utenpå, 90° vinkel – blir også
 *    ben) eller «stolpe innvendig» (48×48 / 98×98 i hvert hjørne – to stolper
 *    ved innvendig L-hjørne).
 *  - Jordtrykk: høye/lange kasser får mellomstolper og tverrstag (strekkstag)
 *    i toppen. Avstanden beregnes fra jordtrykket på nederste bord
 *    (K0 = 0,5, γ = 15 kN/m³) etter NS-EN 1995-1-1, tjenesteklasse 3, permanent last.
 *  - Bunn: bunnbord med 6 mm dreneringsspalte på bunnlister langs veggene.
 *    Bord legges mellom stolpene (ingen utsparing). Med ben bærer bunnlistene
 *    jorda til beina, og alt kontrolleres.
 *  - Topplist gjæret 45° (alltid 45° – like brede bord), utheng utover.
 *    Langs espalieret flukter topplisten med veggen så stolpene går fri.
 *  - Foring: fiberduk (drenerer) eller plast på veggene (bunnen åpen).
 */

export type PlantekasseShape = 'square' | 'rect' | 'outside-corner' | 'inside-corner'

export interface PlantekasseConfig {
  shape: PlantekasseShape
  bredde: number // cm (x) – utvendig mål på bordveggene
  dybde: number // cm (z)
  hoyde: number // cm – kassehøyde (bordveggene, uten topplist og ben)
  arm: number // cm – armbredde for L-former
  ben: number // cm – ben under kassen
  bordDim: string // '21x98' | '28x120' | '28x145'
  hjorne: string // 'kapp' (hjørnebord utvendig) | 'stolpe' (innvendig)
  stolpeDim: string // '48x48' | '98x98'
  treslag: string
  farge: string
  bunn: boolean
  topplist: boolean
  topplistOverheng: number // cm
  espalier: boolean
  espalierHoyde: number // cm over kassen
  foring: string // 'fiberduk' | 'plast' | 'ingen'
  [key: string]: DesignConfig[string]
}

const SVINN = 1.1
const GAP = 0.003 // sprekk mellom bordradene
const BUNN_GAP = 0.006 // dreneringsspalte i bunnen
const LIST = 0.048 // bunnlist 48×48
const DUK = 0.0008
const K0 = 0.5 // hviletrykkskoeffisient
const GAMMA_JORD = 15 // kN/m³ – fuktig plantejord, konservativt
const ESP_STOLPE = 0.048
const ESP_SPILE_T = 0.028
const ESP_SPILE_B = 0.048

const BORD_DIMS: Record<string, { label: string; t: number; h: number; pris: string }> = {
  '21x98': { label: '21 × 98 mm', t: 21, h: 98, pris: 'bord-21x98' },
  '28x120': { label: '28 × 120 mm', t: 28, h: 120, pris: 'terrassebord-28x120' },
  '28x145': { label: '28 × 145 mm', t: 28, h: 145, pris: 'terrassebord-28x145' },
}
const STOLPE_DIMS: Record<string, { label: string; mm: number; pris: string }> = {
  '48x48': { label: '48 × 48 mm', mm: 48, pris: 'stolpe-48x48' },
  '98x98': { label: '98 × 98 mm', mm: 98, pris: 'stolpe-98x98' },
}
const pris = (id: string) => prisFor(id)
const prisNavn = (id: string) => PRISER[id]?.navn ?? id

const cm = (v: number) => v / 100
const bordAv = (c: PlantekasseConfig) => BORD_DIMS[c.bordDim] ?? BORD_DIMS['28x120']
const stolpeAv = (c: PlantekasseConfig) => STOLPE_DIMS[c.stolpeDim] ?? STOLPE_DIMS['48x48']
const erL = (c: PlantekasseConfig) => c.shape === 'outside-corner' || c.shape === 'inside-corner'

type P2 = [number, number] // (x, z) i meter

/**
 * Effektive mål (m). L-former: armbredde 25–100 cm, og hvert ben minst
 * 30 cm lengre enn armen (ellers blir det ikke en L) – målene justeres opp.
 */
export function maal(c: PlantekasseConfig) {
  let w = cm(c.bredde)
  let d = cm(c.shape === 'square' ? c.bredde : c.dybde)
  let arm = 0
  if (erL(c)) {
    arm = Math.max(0.25, Math.min(1.0, cm(Number(c.arm) || 50)))
    w = Math.max(w, arm + 0.3)
    d = Math.max(d, arm + 0.3)
  }
  return { w, d, arm, justert: Math.abs(w - cm(c.bredde)) > 1e-9 || Math.abs(d - cm(c.shape === 'square' ? c.bredde : c.dybde)) > 1e-9 }
}

/** Omkrets (utvendig flate av bordveggene), mot klokka i (x, z). */
function hjorner(c: PlantekasseConfig): P2[] {
  const { w, d, arm } = maal(c)
  if (erL(c)) {
    const t = arm
    return [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, -d / 2 + t], [-w / 2 + t, -d / 2 + t], [-w / 2 + t, d / 2], [-w / 2, d / 2]]
  }
  return [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]]
}

interface Kant {
  i: number
  a: P2
  b: P2
  L: number
  dir: P2
  inn: P2 // innover-normal
}
function kanter(v: P2[]): Kant[] {
  return v.map((a, i) => {
    const b = v[(i + 1) % v.length]
    const L = Math.hypot(b[0] - a[0], b[1] - a[1])
    const dir: P2 = [(b[0] - a[0]) / L, (b[1] - a[1]) / L]
    return { i, a, b, L, dir, inn: [-dir[1], dir[0]] }
  })
}
/** Konveks hjørne (mot klokka): kryssprodukt > 0. */
const konveks = (k: Kant[], v: number) => {
  const a = k[(v - 1 + k.length) % k.length].dir
  const b = k[v].dir
  return a[0] * b[1] - a[1] * b[0] > 0
}

// ── Statikk ──────────────────────────────────────────────────────────

const NED_JORD: Nedboyningskrav = { instQ: 300, fin: 150, begrunnelse: 'Jordtrykk: w_fin ≤ L/150 (synlig utbuling, EC5 tab. 7.2)' }

function jordInput(tv: Tverrsnitt, dybde: number, trib: number, faktor = 1): (s: number) => BjelkeInput {
  void tv
  const q = K0 * GAMMA_JORD * dybde * trib * faktor
  return (s) => ({
    spennM: s,
    laster: [{ navn: `Jordtrykk K0·γ·z = ${fmt(K0, 1)}·${GAMMA_JORD}·${fmt(dybde, 2)}`, type: 'egen', qk: q }],
    tjenesteklasse: 3,
    nedboyning: NED_JORD,
    inkluderEgenvekt: false,
    opplegglengdeMm: 48,
  })
}

interface Statikk {
  /** Største tillatte bordspenn mellom stolper (m). */
  maksSpenn: number
  spennVegg: number
  vegg: Medlemskontroll
  stolpe?: Medlemskontroll
  bunnbord?: Medlemskontroll
  bunnlist?: Medlemskontroll
  ben?: Medlemskontroll
  listH: number
  ok: boolean
  melding: string[]
}

// ── Geometri ─────────────────────────────────────────────────────────

interface Stolpe {
  x: number
  z: number
  sx: number // utstrekning i x
  sz: number // utstrekning i z
  navn: string
  mid: boolean
}
interface Stag {
  x0: number
  x1: number
  z0: number
  z1: number
  y: number
  navn: string
}

interface Geo {
  v: P2[]
  k: Kant[]
  t: number
  bh: number
  rader: number
  topH: number // bredden på øverste (kløyvde) rad
  Hf: number // faktisk kassehøyde
  benY: number
  p: number // stolpemål (hjørne/mellom)
  stolper: Stolpe[]
  stag: Stag[]
  bunn: boolean
  st: Statikk
  espKanter: number[]
}

function rader(Hm: number, bh: number) {
  // n rader der øverste kløyves: H = (n−1)(bh+gap) + top.
  let n = Math.max(1, Math.ceil((Hm + GAP) / (bh + GAP) - 1e-9))
  let top = Hm - (n - 1) * (bh + GAP)
  if (top < 0.035 && n > 1) {
    n -= 1
    top = bh
  }
  top = Math.min(bh, top)
  return { n, top, Hf: (n - 1) * (bh + GAP) + top }
}

function geo(c: PlantekasseConfig): Geo {
  const b = bordAv(c)
  const t = b.t / 1000
  const bh = b.h / 1000
  const v = hjorner(c)
  const k = kanter(v)
  const r = rader(cm(c.hoyde), bh)
  const benY = Math.max(0, cm(c.ben))
  const bunn = Boolean(c.bunn) || benY > 0
  const kapp = c.hjorne !== 'stolpe'
  const sd = stolpeAv(c)
  // Mellomstolper: 48×48 for hjørnebord-varianten, ellers valgt stolpe.
  const pMid = kapp ? 0.048 : sd.mm / 1000
  const pHj = sd.mm / 1000
  const jordDybde = Math.max(0.05, r.Hf - 0.03) // jorda fylles til ~3 cm under kanten

  // Veggbord: største spenn mellom stolper (nederste bord, størst trykk).
  const bordTv = tverrsnitt(b.h, b.t, 1, 'C24', b.pris)
  const veggInput = jordInput(bordTv, jordDybde, bh)
  const Lmax = Math.max(0.3, maksSpenn(bordTv, veggInput, 6))

  // Bunn (bare med ben – på bakken hviler bunnen på grunnen).
  const qBunn = GAMMA_JORD * jordDybde // kN/m²

  /** Mellomposisjoner på [a, b] med segmenter ≤ s. */
  const deling = (a: number, bb: number, s: number) => {
    const n = Math.max(1, Math.ceil((bb - a) / s - 1e-9))
    return Array.from({ length: n - 1 }, (_, i) => a + ((i + 1) * (bb - a)) / n)
  }

  let s = Lmax
  let stolper: Stolpe[] = []
  let stag: Stag[] = []
  let st: Statikk | undefined
  for (let iter = 0; iter < 12; iter++) {
    stolper = []
    stag = []
    // Hjørnestolper (stolpe-varianten).
    if (!kapp) {
      v.forEach((V, i) => {
        const inA = k[(i - 1 + k.length) % k.length].inn
        const inB = k[i].inn
        if (konveks(k, i)) {
          const cx = V[0] + (t + pHj / 2) * (inA[0] + inB[0])
          const cz = V[1] + (t + pHj / 2) * (inA[1] + inB[1])
          stolper.push({ x: cx, z: cz, sx: pHj, sz: pHj, navn: 'Hjørnestolpe', mid: false })
        } else {
          // Innvendig hjørne: én stolpe mot hver vegg, rett innenfor gjennomgangsbordet.
          const pA: P2 = [V[0] + (t + pHj / 2) * inA[0] + (t - pHj / 2) * inB[0], V[1] + (t + pHj / 2) * inA[1] + (t - pHj / 2) * inB[1]]
          const pB: P2 = [V[0] + (t + pHj / 2) * inB[0] + (t - pHj / 2) * inA[0], V[1] + (t + pHj / 2) * inB[1] + (t - pHj / 2) * inA[1]]
          stolper.push({ x: pA[0], z: pA[1], sx: pHj, sz: pHj, navn: 'Hjørnestolpe', mid: false })
          stolper.push({ x: pB[0], z: pB[1], sx: pHj, sz: pHj, navn: 'Hjørnestolpe', mid: false })
        }
      })
    }
    // Mellomstolper + tverrstag per «arm».
    const { w, d } = maal(c)
    const yStag = benY + r.Hf - bh // stagets underkant (overkant flukter med kassen)
    const midt = (x: number, z: number) => stolper.push({ x, z, sx: pMid, sz: pMid, navn: 'Mellomstolpe', mid: true })
    // Plass til stag over bunnen? (bunnlist + bunnbord + 1 cm)
    const bunnTopp = benY + (bunn ? 0.098 + t + 0.01 : 0)
    const lagStagX = (x: number, zA: number, zB: number) => {
      if (yStag < bunnTopp) return
      // Stag langs z ved siden av stolpene (på +x-siden).
      const xs = x + pMid / 2
      stag.push({ x0: xs, x1: xs + t, z0: zA, z1: zB, y: yStag, navn: 'Tverrstag' })
    }
    const lagStagZ = (z: number, xA: number, xB: number) => {
      if (yStag - (bh + 0.01) < bunnTopp) return
      const zs = z + pMid / 2
      stag.push({ x0: xA, x1: xB, z0: zs, z1: zs + t, y: yStag - (bh + 0.01), navn: 'Tverrstag' })
    }
    const kantInn = t + pMid / 2
    if (!erL(c)) {
      for (const x of deling(-w / 2, w / 2, s)) {
        midt(x, -d / 2 + kantInn)
        midt(x, d / 2 - kantInn)
        lagStagX(x, -d / 2 + t + DUK, d / 2 - t - DUK)
      }
      for (const z of deling(-d / 2, d / 2, s)) {
        midt(-w / 2 + kantInn, z)
        midt(w / 2 - kantInn, z)
        lagStagZ(z, -w / 2 + t + DUK, w / 2 - t - DUK)
      }
    } else {
      const arm = v[2][1] - v[1][1]
      const Vx = v[3][0]
      const Vz = v[3][1]
      // Arm langs x (kant 0 og 2): stag mellom kant 0 og 2 for x i (Vx, w/2).
      for (const x of deling(Vx, w / 2, s)) {
        midt(x, -d / 2 + kantInn)
        midt(x, Vz - kantInn)
        lagStagX(x, -d / 2 + t + DUK, Vz - t - DUK)
      }
      for (const x of deling(-w / 2, Vx, s)) midt(x, -d / 2 + kantInn)
      // Arm langs z (kant 5 og 3).
      for (const z of deling(Vz, d / 2, s)) {
        midt(-w / 2 + kantInn, z)
        midt(Vx - kantInn, z)
        lagStagZ(z, -w / 2 + t + DUK, Vx - t - DUK)
      }
      for (const z of deling(-d / 2, Vz, s)) midt(-w / 2 + kantInn, z)
      // Kortendene (kant 1 og 4) er korte (= armbredden).
      for (const z of deling(-d / 2, -d / 2 + arm, s)) midt(w / 2 - kantInn, z)
      for (const x of deling(-w / 2, -w / 2 + arm, s)) midt(x, d / 2 - kantInn)
    }

    // Kontroller: største faktiske bordspenn mellom stolpene langs veggene.
    const spennVegg = Math.min(Lmax, s)
    const vegg = { ...kontrollerBjelke(bordTv, veggInput(spennVegg)), navn: 'Veggbord (nederste rad)' }
    const harMid = stolper.some((p) => p.mid)
    const stTv = tverrsnitt(Math.round(pMid * 1000), Math.round(pMid * 1000), 1, 'C24', kapp ? 'stolpe-48x48' : sd.pris)
    // Mellomstolpe: trekantlast mellom bunn og stag → ekvivalent jevn last 0,513·p.
    const stolpe = harMid
      ? { ...kontrollerBjelke(stTv, { ...jordInput(stTv, jordDybde, spennVegg, 0.513)(Math.max(0.2, r.Hf - bh / 2)), nedboyning: NED_JORD }), navn: 'Mellomstolpe' }
      : undefined
    let bunnbord: Medlemskontroll | undefined
    let bunnlist: Medlemskontroll | undefined
    let ben: Medlemskontroll | undefined
    let listH = 0.048
    if (benY > 0) {
      // Bunnbord spenner over korteste innvendige mål (minus lister).
      const innv = erL(c) ? v[2][1] - v[1][1] - 2 * t : Math.min(w, d) - 2 * t
      const bbTv = tverrsnitt(b.h, b.t, 1, 'C24', b.pris)
      bunnbord = { ...kontrollerBjelke(bbTv, { spennM: Math.max(0.1, innv - LIST), laster: [{ navn: `Jord γ·z = ${GAMMA_JORD}·${fmt(jordDybde, 2)}`, type: 'egen', qk: qBunn * bh }], tjenesteklasse: 3, nedboyning: NED_JORD }), navn: 'Bunnbord' }
      // Bunnlist mellom stolpene/hjørnene, tar halve bunnen.
      const listSpenn = harMid || kapp ? spennVegg : Math.max(w, d)
      for (const hh of [0.048, 0.098]) {
        listH = hh
        bunnlist = { ...kontrollerBjelke(tverrsnitt(48, Math.round(hh * 1000), 1, 'C24', hh > 0.05 ? 'stolpe-48x98' : 'stolpe-48x48'), { spennM: listSpenn, laster: [{ navn: 'Bunn med jord', type: 'egen', qk: qBunn * (innv / 2) }], tjenesteklasse: 3, nedboyning: NED_JORD, sidestottet: true }), navn: 'Bunnlist' }
        if (bunnlist.ok) break
      }
      // Ben: jord + kasse fordelt på beina.
      const areal = erL(c) ? w * (v[2][1] - v[1][1]) + (d - (v[2][1] - v[1][1])) * (v[2][1] - v[1][1]) : w * d
      const nBen = stolper.filter((p) => !p.mid || p.mid).length + (kapp ? v.length : 0)
      const NG = (qBunn * areal + 0.3 * areal) / Math.max(4, nBen)
      const benTv = kapp ? tverrsnitt(b.t, b.h, 2, 'C24', b.pris) : tverrsnitt(sd.mm, sd.mm, 1, 'C24', sd.pris)
      ben = { ...kontrollerSoyle(benTv, { lengdeM: Math.max(0.1, benY), knekklengdefaktor: 2, NGk: NG, NQk: [], tjenesteklasse: 3 }), navn: 'Ben' }
    }
    const meld: string[] = []
    const okAlle = vegg.ok && (stolpe?.ok ?? true) && (bunnbord?.ok ?? true) && (bunnlist?.ok ?? true) && (ben?.ok ?? true)
    if (bunnbord && !bunnbord.ok) {
      const bbTv = tverrsnitt(b.h, b.t, 1, 'C24', b.pris)
      const maks = maksSpenn(bbTv, (sp) => ({ spennM: sp, laster: [{ navn: 'Jord', type: 'egen', qk: qBunn * bh }], tjenesteklasse: 3, nedboyning: NED_JORD }), 4)
      meld.push(`Med ben bærer bunnbordene all jorda: ${f0(jordDybde * 100)} cm jord tåler maks ca. ${f0((maks + LIST + 2 * t) * 100)} cm utvendig ${erL(c) ? 'armbredde' : 'dybde'} med ${b.label}. Reduser dybden/høyden, velg tykkere bord eller sett kassen uten ben på bakken.`)
    }
    if (ben && !ben.ok) meld.push('Beina er for svake for jordvekten – reduser benhøyden eller velg kraftigere stolpe.')
    st = { maksSpenn: Lmax, spennVegg, vegg, stolpe, bunnbord, bunnlist, ben, listH, ok: okAlle, melding: meld }
    // Ikke OK pga. stolpe eller bunnlist → tettere stolper.
    if ((stolpe && !stolpe.ok) || (bunnlist && !bunnlist.ok)) {
      s = s * 0.8
      continue
    }
    break
  }
  const espKanter = !c.espalier ? [] : c.shape === 'outside-corner' ? [2, 3] : c.shape === 'inside-corner' ? [5, 0] : [0]
  return { v, k, t, bh, rader: r.n, topH: r.top, Hf: r.Hf, benY, p: pHj, stolper, stag, bunn, st: st as Statikk, espKanter }
}

// ── Stavliste ────────────────────────────────────────────────────────

const Y3: [number, number, number] = [0, 1, 0]

function konstruer(c: PlantekasseConfig): { staver: Stav[]; g: Geo } {
  const g = geo(c)
  const { v, k, t, bh, benY } = g
  const b = bordAv(c)
  const bordP = prof(b.t, b.h)
  const kapp = c.hjorne !== 'stolpe'
  const sd = stolpeAv(c)
  const N = v.length
  const staver: Stav[] = []
  const add = (s: Stav) => staver.push({ kvalitet: 'Impregnert', ...s })

  /** Plate langs kant: along ∈ [s0, s1], innover ∈ [n0, n1], y ∈ [y0, y1]. */
  const langsKant = (kk: Kant, s0: number, s1: number, n0: number, n1: number, y0: number, y1: number, e0?: (y: number, n: number) => number, e1?: (y: number, n: number) => number) =>
    plasser(
      prisme([[y0, n0], [y1, n0], [y1, n1], [y0, n1]], e0 ?? (() => s0), e1 ?? (() => s1)),
      basis([kk.dir[0], 0, kk.dir[1]], Y3, [kk.inn[0], 0, kk.inn[1]], [kk.a[0], 0, kk.a[1]]),
    )

  // ── Veggbord i forband ──
  for (let r = 0; r < g.rader; r++) {
    const y0 = benY + r * (bh + GAP)
    const hRad = r === g.rader - 1 ? g.topH : bh
    for (const kk of k) {
      const gjennom = (kk.i + r) % 2 === 0
      const vS = kk.i
      const vE = (kk.i + 1) % N
      const ext = (vert: number) => (gjennom ? (konveks(k, vert) ? 0 : t) : konveks(k, vert) ? -t : 0)
      const s0 = -ext(vS)
      const s1 = kk.L + ext(vE)
      const kloyvd = hRad < bh - 0.0005
      add({
        navn: kloyvd ? 'Veggbord, øverste rad' : 'Veggbord',
        profil: bordP,
        pris: b.pris,
        lengdeMm: (s1 - s0) * 1000,
        endeA: ende(0),
        endeB: ende(0),
        merknad: kloyvd ? `Kløyves til ${f0(hRad * 1000)} mm bredde.` : gjennom ? 'Går gjennom i hjørnet (forband).' : 'Butter mot gjennomgående bord.',
        part: 'kledning',
        pid: `vegg-${kk.i}-${r}`,
        geom: langsKant(kk, s0, s1, 0, t, y0, y0 + hRad),
        explode: new THREE.Vector3(-kk.inn[0] * 0.3, 0, -kk.inn[1] * 0.3),
        kategori: 'kledning',
      })
    }
  }
  const topY = benY + g.Hf

  // ── Hjørner ──
  if (kapp) {
    // To stående bord utenpå hvert hjørne, fra bakken til kanten. Det ene
    // bordet i konvekse hjørner er t lengre (dekker endeveden på det andre);
    // i innvendige hjørner starter det andre bordet t ut fra hjørnet.
    const bw = bh
    const kappSeg: Array<{ start?: [number, number]; slutt?: [number, number] }> = k.map(() => ({}))
    v.forEach((_V, vi) => {
      const ia = (vi - 1 + N) % N
      const kA = k[ia]
      const kv = konveks(k, vi)
      kappSeg[ia].slutt = [kA.L - bw, kA.L + (kv ? t : 0)]
      kappSeg[vi].start = [kv ? 0 : t, (kv ? 0 : t) + bw]
    })
    k.forEach((kk) => {
      const seg = kappSeg[kk.i]
      // Korte kanter: del plassen likt (bordene kløyves).
      if (seg.start && seg.slutt && seg.start[1] > seg.slutt[0] - 0.004) {
        const m = (seg.start[0] + seg.slutt[1]) / 2
        seg.start = [seg.start[0], m - 0.002]
        seg.slutt = [m + 0.002, seg.slutt[1]]
      }
      ;([['start', seg.start], ['slutt', seg.slutt]] as Array<[string, [number, number] | undefined]>).forEach(([hvor, r]) => {
        if (!r) return
        const [s0, s1] = r
        const nett = s1 - s0 - (hvor === 'slutt' && konveks(k, (kk.i + 1) % N) ? t : 0)
        const kloyvd = nett < bw - 0.0005
        add({
          navn: kloyvd ? 'Hjørnebord (stående, kløyvd)' : 'Hjørnebord (stående)',
          profil: bordP,
          pris: b.pris,
          lengdeMm: topY * 1000,
          endeA: ende(0),
          endeB: ende(0),
          merknad: kloyvd ? `Kløyves til ${f0((s1 - s0) * 1000)} mm (kort vegg).` : s1 - s0 > bw + 1e-6 ? 'Dekker endeveden på hjørnebordet på naboveggen.' : undefined,
          part: 'stolpe',
          pid: `hjorne-${kk.i}-${hvor}`,
          geom: plasser(prisme([[0, s0], [topY, s0], [topY, s1], [0, s1]], () => -t, () => 0), basis([kk.inn[0], 0, kk.inn[1]], Y3, [kk.dir[0], 0, kk.dir[1]], [kk.a[0], 0, kk.a[1]])),
          explode: new THREE.Vector3(-kk.inn[0] * 0.45, -0.2, -kk.inn[1] * 0.45),
          kategori: 'konstruksjon',
        })
      })
    })
  }
  // Stolper (hjørne og mellom): fra bakken (med ben) eller kassebunnen.
  g.stolper.forEach((p, i) => {
    const y0 = 0
    const geom = plasser(prisme([[p.z - p.sz / 2, p.x - p.sx / 2], [p.z + p.sz / 2, p.x - p.sx / 2], [p.z + p.sz / 2, p.x + p.sx / 2], [p.z - p.sz / 2, p.x + p.sx / 2]], () => y0, () => topY), basis([0, 1, 0], [0, 0, 1], [1, 0, 0]))
    const mm = Math.round(p.sx * 1000)
    add({
      navn: p.navn,
      profil: prof(mm, mm),
      pris: mm === 98 ? 'stolpe-98x98' : 'stolpe-48x48',
      lengdeMm: (topY - y0) * 1000,
      endeA: ende(0),
      endeB: ende(0),
      merknad: p.mid ? 'Holder veggen mot jordtrykket – festes til tverrstaget i toppen.' : benY > 0 ? `Står ned som ben (${f0(benY * 100)} cm).` : undefined,
      part: 'stolpe',
      pid: `stolpe-${i}`,
      geom,
      darken: 0.85,
      explode: new THREE.Vector3(p.x, 0, p.z).normalize().multiplyScalar(0.15).setY(-0.1),
      kategori: 'konstruksjon',
    })
  })
  // Tverrstag (strekkstag i toppen).
  g.stag.forEach((s, i) => {
    const langsX = s.x1 - s.x0 > s.z1 - s.z0
    const geom = langsX
      ? prisme([[s.y, s.z0], [s.y + bh, s.z0], [s.y + bh, s.z1], [s.y, s.z1]], () => s.x0, () => s.x1)
      : plasser(prisme([[s.y, s.x0], [s.y + bh, s.x0], [s.y + bh, s.x1], [s.y, s.x1]], () => s.z0, () => s.z1), basis([0, 0, 1], Y3, [1, 0, 0]))
    add({ navn: s.navn, profil: bordP, pris: b.pris, lengdeMm: (langsX ? s.x1 - s.x0 : s.z1 - s.z0) * 1000, endeA: ende(0), endeB: ende(0), merknad: 'På høykant i toppen, skrus til mellomstolpene med 2 × 2 skruer.', part: 'stolpe', pid: `stag-${i}`, geom, darken: 0.9, explode: new THREE.Vector3(0, 0.25, 0), kategori: 'konstruksjon' })
  })

  // ── Bunn ──
  if (g.bunn) {
    const listH = g.st.listH
    const yL0 = benY
    const yB0 = benY + listH
    const hindre = g.stolper.map((p) => ({ x0: p.x - p.sx / 2, x1: p.x + p.sx / 2, z0: p.z - p.sz / 2, z1: p.z + p.sz / 2 }))
    const listP = prof(48, Math.round(listH * 1000))
    const listPris = listH > 0.05 ? 'stolpe-48x98' : 'stolpe-48x48'
    /** Liste langs x (z-bånd [z0,z1]) fra xa til xb, splittet ved stolper. */
    const liste = (akse: 'x' | 'z', a: number, bb: number, q0: number, q1: number, tag: string) => {
      const hinder = hindre
        .filter((h) => (akse === 'x' ? h.z1 > q0 + 1e-6 && h.z0 < q1 - 1e-6 : h.x1 > q0 + 1e-6 && h.x0 < q1 - 1e-6))
        .map((h) => (akse === 'x' ? [h.x0, h.x1] : [h.z0, h.z1]))
        .sort((p, q) => p[0] - q[0])
      let cur = a
      const seg: Array<[number, number]> = []
      for (const [h0, h1] of hinder) {
        if (h1 <= cur + 1e-6 || h0 >= bb - 1e-6) continue
        if (h0 > cur + 0.02) seg.push([cur, h0])
        cur = Math.max(cur, h1)
      }
      if (bb > cur + 0.02) seg.push([cur, bb])
      seg.forEach(([s0, s1], j) => {
        const geom = akse === 'x'
          ? prisme([[yL0, q0], [yL0 + listH, q0], [yL0 + listH, q1], [yL0, q1]], () => s0, () => s1)
          : plasser(prisme([[yL0, q0], [yL0 + listH, q0], [yL0 + listH, q1], [yL0, q1]], () => s0, () => s1), basis([0, 0, 1], Y3, [1, 0, 0]))
        add({ navn: 'Bunnlist', profil: listP, pris: listPris, lengdeMm: (s1 - s0) * 1000, endeA: ende(0), endeB: ende(0), merknad: 'Skrus til veggbordene innvendig (A4 5,0×70 c/c 200).', part: 'bunn', pid: `bunnlist-${tag}-${j}`, geom, darken: 0.85, explode: new THREE.Vector3(0, -0.2, 0), kategori: 'konstruksjon' })
      })
      return seg
    }
    /** Bunnbord i et område, bordene langs `retning`, lagt mellom stolpene. */
    const bunnbord = (x0: number, x1: number, z0: number, z1: number, retning: 'x' | 'z', tag: string) => {
      // Bordene ligger på listene: for retning z spenner de fra z0 til z1.
      const tverr0 = retning === 'z' ? x0 : z0
      const tverr1 = retning === 'z' ? x1 : z1
      const langs0 = retning === 'z' ? z0 : x0
      const langs1 = retning === 'z' ? z1 : x1
      // Stolper i området: [tverr0, tverr1, langs0, langs1].
      const st = hindre
        .filter((h) => h.x1 > x0 + 1e-6 && h.x0 < x1 - 1e-6 && h.z1 > z0 + 1e-6 && h.z0 < z1 - 1e-6)
        .map((h) => (retning === 'z' ? [h.x0, h.x1, h.z0, h.z1] : [h.z0, h.z1, h.x0, h.x1]))
      // Del tverr-aksen i elementære intervaller ved stolpekantene.
      const kutt = [...new Set([tverr0, tverr1, ...st.flatMap((h) => [h[0], h[1]]).filter((q) => q > tverr0 + 1e-6 && q < tverr1 - 1e-6)])].sort((p, q) => p - q)
      let n = 0
      for (let ii = 0; ii < kutt.length - 1; ii++) {
        const q0i = kutt[ii]
        const q1i = kutt[ii + 1]
        if (q1i - q0i < 0.01) continue
        // Ledig strekning langs bordet mellom stolpene i dette intervallet.
        const opptatt = st.filter((h) => h[0] < q1i - 1e-6 && h[1] > q0i + 1e-6).map((h) => [h[2], h[3]] as [number, number])
        let l0 = langs0
        let l1 = langs1
        for (const [o0, o1] of opptatt) {
          if (o0 - langs0 < langs1 - o1) l0 = Math.max(l0, o1)
          else l1 = Math.min(l1, o0)
        }
        if (l1 - l0 < 0.05) continue
        const vegg0 = Math.abs(q0i - tverr0) < 1e-6
        const vegg1 = Math.abs(q1i - tverr1) < 1e-6
        const f0v = q0i + (vegg0 ? 0 : BUNN_GAP / 2)
        const f1v = q1i - (vegg1 ? 0 : BUNN_GAP / 2)
        const bredde = f1v - f0v
        if (bredde < 0.01) continue
        const antall = Math.max(1, Math.ceil((bredde + BUNN_GAP) / (bh + BUNN_GAP) - 1e-9))
        const bw = Math.min(bh, (bredde - (antall - 1) * BUNN_GAP) / antall)
        for (let i = 0; i < antall; i++) {
          const q0 = f0v + i * (bw + BUNN_GAP)
          const q1 = q0 + bw
          const geom = retning === 'z'
            ? plasser(prisme([[yB0, q0], [yB0 + t, q0], [yB0 + t, q1], [yB0, q1]], () => l0, () => l1), basis([0, 0, 1], Y3, [1, 0, 0]))
            : prisme([[yB0, q0], [yB0 + t, q0], [yB0 + t, q1], [yB0, q1]], () => l0, () => l1)
          const kl = bw < bh - 0.0005
          add({ navn: kl ? 'Bunnbord (kløyvd)' : 'Bunnbord', profil: bordP, pris: b.pris, lengdeMm: (l1 - l0) * 1000, endeA: ende(0), endeB: ende(0), merknad: kl ? `Kløyves til ${f0(bw * 1000)} mm. 6 mm dreneringsspalte.` : '6 mm dreneringsspalte mellom bordene.', part: 'bunn', pid: `bunn-${tag}-${n++}`, geom, darken: 0.9, explode: new THREE.Vector3(0, -0.35, 0), kategori: 'kledning' })
        }
      }
    }
    const { w, d } = maal(c)
    const ti = t + DUK // innvendig vegg (inkl. foring)
    if (!erL(c)) {
      const langsZ = w >= d // bordene spenner korteste vei
      if (langsZ) {
        liste('x', -w / 2 + ti, w / 2 - ti, -d / 2 + ti, -d / 2 + ti + LIST, 'a')
        liste('x', -w / 2 + ti, w / 2 - ti, d / 2 - ti - LIST, d / 2 - ti, 'b')
        bunnbord(-w / 2 + ti, w / 2 - ti, -d / 2 + ti, d / 2 - ti, 'z', 'r')
      } else {
        liste('z', -d / 2 + ti, d / 2 - ti, -w / 2 + ti, -w / 2 + ti + LIST, 'a')
        liste('z', -d / 2 + ti, d / 2 - ti, w / 2 - ti - LIST, w / 2 - ti, 'b')
        bunnbord(-w / 2 + ti, w / 2 - ti, -d / 2 + ti, d / 2 - ti, 'x', 'r')
      }
    } else {
      const Vx = v[3][0]
      const Vz = v[3][1]
      // Arm 1 (langs x, hele bredden): bord langs z mellom kant 0 og linja ved kant 2.
      liste('x', -w / 2 + ti, w / 2 - ti, -d / 2 + ti, -d / 2 + ti + LIST, 'a0')
      liste('x', -w / 2 + ti, w / 2 - ti, Vz - ti - LIST, Vz - ti, 'a2')
      bunnbord(-w / 2 + ti, w / 2 - ti, -d / 2 + ti, Vz - ti, 'z', 'a')
      // Arm 2 (langs z): bord langs x mellom kant 5 og 3, fra arm 1 til enden.
      liste('z', Vz - ti + BUNN_GAP, d / 2 - ti, -w / 2 + ti, -w / 2 + ti + LIST, 'b5')
      liste('z', Vz - ti + BUNN_GAP, d / 2 - ti, Vx - ti - LIST, Vx - ti, 'b3')
      bunnbord(-w / 2 + ti, Vx - ti, Vz - ti + BUNN_GAP, d / 2 - ti, 'x', 'b')
    }
  }

  // ── Foring (duk/plast) innvendig ──
  if (c.foring !== 'ingen') {
    const mat = new THREE.MeshStandardMaterial({ color: c.foring === 'plast' ? 0x1d1d1d : 0x4a4943, roughness: c.foring === 'plast' ? 0.45 : 1 })
    const y0 = g.bunn ? benY + g.st.listH + t : benY
    for (const kk of k) {
      const vS = kk.i
      const vE = (kk.i + 1) % N
      const s0 = konveks(k, vS) ? t : -t
      const s1 = kk.L - (konveks(k, vE) ? t : -t)
      staver.push({ navn: c.foring === 'plast' ? 'Plastforing (vegg)' : 'Fiberduk (vegg)', profil: 'duk', lengdeMm: (s1 - s0) * 1000, part: 'duk', pid: `duk-${kk.i}`, geom: langsKant(kk, s0 + DUK, s1 - DUK, t, t + DUK, y0, topY - 0.002), materiale: mat, ikkeKapp: true })
    }
  }

  // ── Topplist (gjæret 45°) ──
  if (c.topplist) {
    const ovMaks = bh - t - 0.01
    const ovStd = Math.min(ovMaks, Math.max(0, cm(c.topplistOverheng)))
    const ov = k.map((kk) => (g.espKanter.includes(kk.i) ? 0 : ovStd))
    const ytre = (kk: Kant) => -ov[kk.i] // innover-koordinat for ytterkant
    const indre = (kk: Kant) => bh - ov[kk.i]
    k.forEach((kk) => {
      const kA = k[(kk.i - 1 + N) % N]
      const kB = k[(kk.i + 1) % N]
      // Gjæring: endeplanet går fra ytre til indre hjørne – alltid 45° fordi
      // bordene er like brede (se utledning i rapporten).
      const sStart = (n: number) => (konveks(k, kk.i) ? n + ov[kk.i] - ov[kA.i] : ov[kA.i] - ov[kk.i] - n)
      const sSlutt = (n: number) => (konveks(k, kB.i) ? kk.L + ov[kB.i] - ov[kk.i] - n : kk.L - ov[kB.i] + ov[kk.i] + n)
      const n0 = ytre(kk)
      const n1 = indre(kk)
      const geom = langsKant(kk, 0, 0, n0, n1, topY, topY + t, (_y, n) => sStart(n), (_y, n) => sSlutt(n))
      const lengde = Math.max(sSlutt(n0), sSlutt(n1)) - Math.min(sStart(n0), sStart(n1))
      add({ navn: 'Topplist', profil: bordP, pris: b.pris, lengdeMm: lengde * 1000, endeA: ende(45, 'gjaering'), endeB: ende(45, 'gjaering'), merknad: ov[kk.i] > 0 ? `Ligger flatt, ${f0(ov[kk.i] * 1000)} mm utheng. Gjæres 45° og limes i skjøtene.` : 'Ligger flatt, flukter med veggen mot espalieret. Gjæres 45°.', part: 'topplist', pid: `topplist-${kk.i}`, geom, explode: new THREE.Vector3(0, 0.35, 0), kategori: 'kledning' })
    })
  }

  // ── Espalier ──
  if (g.espKanter.length) {
    const eh = cm(Math.max(40, Math.min(200, Number(c.espalierHoyde) || 100)))
    const yTopKasse = topY + (c.topplist ? t : 0)
    const yTopp = topY + eh
    g.espKanter.forEach((ki) => {
      const kk = k[ki]
      // Avstand fra hjørnene: fri for hjørnebord, og ved innvendig hjørne fri for
      // naboveggen; der to espaliervegger møtes, fri for nabogitteret.
      const innsett = (vert: number, annen: number) => {
        let i0 = (kapp ? bh + t : 0) + 0.03
        if (!konveks(k, vert)) i0 = (kapp ? bh + t : 0) + ESP_STOLPE + t + 0.02
        else if (g.espKanter.includes(annen)) i0 = Math.max(i0, 2 * ESP_SPILE_T + 0.04)
        return i0
      }
      const in0 = innsett(ki, (ki - 1 + N) % N)
      const in1 = innsett((ki + 1) % N, (ki + 1) % N)
      const span = kk.L - in0 - in1 - ESP_STOLPE
      if (span < 0.25) return
      const inset = in0
      const nSt = Math.max(2, Math.ceil(span / 1.2 - 1e-9) + 1)
      const sPos = Array.from({ length: nSt }, (_, i) => inset + ESP_STOLPE / 2 + (i * span) / (nSt - 1))
      // Stolper utenpå veggen (innover ∈ [−48, 0]) fra bakken til toppen.
      sPos.forEach((sp, i) => {
        add({ navn: 'Espalierstolpe', profil: prof(48, 48), pris: 'stolpe-48x48', lengdeMm: yTopp * 1000, endeA: ende(0), endeB: ende(0), merknad: 'Skrus utenpå veggen med 2 skruer per bordrad.', part: 'espalier', pid: `esp-st-${ki}-${i}`, geom: langsKant(kk, sp - ESP_STOLPE / 2, sp + ESP_STOLPE / 2, -ESP_STOLPE, 0, 0, yTopp), darken: 0.85, explode: new THREE.Vector3(-kk.inn[0] * 0.3, 0.2, -kk.inn[1] * 0.3), kategori: 'konstruksjon' })
      })
      // Loddrette spiler (mot kassen) og vannrette spiler (innerst), over topplisten.
      const s0 = sPos[0] - ESP_STOLPE / 2
      const s1 = sPos[sPos.length - 1] + ESP_STOLPE / 2
      const yS0 = yTopKasse + 0.005
      const nV = Math.max(2, Math.round((s1 - s0 - ESP_SPILE_B) / 0.2) + 1)
      for (let i = 0; i < nV; i++) {
        const sc = s0 + ESP_SPILE_B / 2 + (i * (s1 - s0 - ESP_SPILE_B)) / (nV - 1)
        add({ navn: 'Espalierspile, loddrett', profil: prof(28, 48), pris: 'espalier-28x48', lengdeMm: (yTopp - yS0) * 1000, endeA: ende(0), endeB: ende(0), part: 'espalier', pid: `esp-v-${ki}-${i}`, geom: langsKant(kk, sc - ESP_SPILE_B / 2, sc + ESP_SPILE_B / 2, 0, ESP_SPILE_T, yS0, yTopp), explode: new THREE.Vector3(0, 0.3, 0), kategori: 'kledning' })
      }
      const nH = Math.max(2, Math.round((yTopp - yS0 - ESP_SPILE_B) / 0.2) + 1)
      for (let j = 0; j < nH; j++) {
        const yc = yS0 + ESP_SPILE_B / 2 + (j * (yTopp - yS0 - ESP_SPILE_B)) / (nH - 1)
        add({ navn: 'Espalierspile, vannrett', profil: prof(28, 48), pris: 'espalier-28x48', lengdeMm: (s1 - s0) * 1000, endeA: ende(0), endeB: ende(0), part: 'espalier', pid: `esp-h-${ki}-${j}`, geom: langsKant(kk, s0, s1, ESP_SPILE_T, 2 * ESP_SPILE_T, yc - ESP_SPILE_B / 2, yc + ESP_SPILE_B / 2), explode: new THREE.Vector3(0, 0.35, 0), kategori: 'kledning' })
      }
    })
  }
  void sd
  return { staver, g }
}

function lagGruppe(c: PlantekasseConfig, mat: (pid: string, d?: number) => THREE.Material) {
  const group = new THREE.Group()
  const body = new THREE.Group()
  const { staver, g } = konstruer(c)
  byggMesher(body, staver, mat)
  // Utvendig hjørne: snu kassen så armene går rundt hjørnet bak.
  if (c.shape === 'outside-corner') body.rotation.y = Math.PI
  group.add(body)
  return { group, g }
}

function buildMesh(c: PlantekasseConfig, opts?: BuildOptions): THREE.Group {
  return lagGruppe(c, lagMatFabrikk(c.treslag, c.farge, opts)).group
}

// ── Kappliste / materialliste ────────────────────────────────────────

function kappliste(c: PlantekasseConfig): KapplisteDelPlan[] {
  return samleKappliste(konstruer(c).staver)
}

const FORM_NAVN: Record<PlantekasseShape, string> = { square: 'kvadratisk', rect: 'rektangulær', 'outside-corner': 'L-form (utvendig hjørne)', 'inside-corner': 'L-form (innvendig hjørne)' }

function innvendigAreal(g: Geo) {
  // Polygonareal minus veggtykkelse (tilnærmet).
  const A = Math.abs(g.v.reduce((s, p, i) => { const q = g.v[(i + 1) % g.v.length]; return s + p[0] * q[1] - q[0] * p[1] }, 0)) / 2
  const omkrets = g.k.reduce((s, kk) => s + kk.L, 0)
  return { A, Ainn: Math.max(0, A - omkrets * g.t), omkrets }
}

function beregn(c: PlantekasseConfig): Bom {
  const faktor = TRESLAG[c.treslag]?.prisFaktor ?? 1
  const { staver, g } = konstruer(c)
  const lm = lmPerPris(staver)
  const linjer: BomLine[] = [...lm.entries()].map(([id, l]) => lmLinje(prisNavn(id), l, SVINN, { spesifikasjon: 'impregnert NTR AB' }))
  let woodKr = 0
  lm.forEach((l, id) => (woodKr += l * pris(id) * faktor))
  const { Ainn, omkrets } = innvendigAreal(g)
  const deler = staver.filter((s) => !s.ikkeKapp).length
  const skruer = Math.ceil((deler * 4 + 20) / 50) * 50
  const jordL = Ainn * Math.max(0, g.Hf - 0.03) * 1000
  const dukM2 = c.foring === 'ingen' ? 0 : omkrets * g.Hf + (c.foring === 'fiberduk' ? Ainn : 0)
  let ekstra = skruer * prisFor('skrue')
  linjer.push({ navn: 'Skruer', spesifikasjon: 'rustfri A4, 5,0×50 (bord) og 5,0×70 (stolper/lister)', antall: skruer, enhet: 'stk' })
  if (c.foring === 'fiberduk') {
    linjer.push({ navn: PRISER['fiberduk'].navn, spesifikasjon: 'ugressduk/fiberduk 1 × 10 m', antall: Math.max(1, Math.ceil((dukM2 * 1.15) / 10)), enhet: 'rull', kommentar: `${f0(dukM2 * 1.15)} m² inkl. omlegg – vegger og bunn` })
    ekstra += Math.max(1, Math.ceil((dukM2 * 1.15) / 10)) * prisFor('fiberduk')
  } else if (c.foring === 'plast') {
    linjer.push({ navn: 'Plastforing (knasteplast/fiberduk-plast)', spesifikasjon: 'kun veggene – bunnen holdes åpen', antall: Math.round(dukM2 * 1.15 * 10) / 10, enhet: 'm²' })
    ekstra += dukM2 * 1.15 * 25
  }
  linjer.push({ navn: 'Plantejord', spesifikasjon: 'fylles til 3 cm under kanten', antall: Math.round(jordL / 10) * 10, enhet: 'liter', kommentar: 'medfølger ikke' })
  const estimatKr = Math.round((woodKr * SVINN + ekstra) / 10) * 10
  const malStr = c.shape === 'square' ? `${c.bredde}×${c.bredde}` : `${c.bredde}×${c.dybde}`
  return {
    linjer,
    estimatKr,
    sammendrag: `${FORM_NAVN[c.shape]} · ${malStr}×${f0(g.Hf * 100)} cm · ${g.rader} rader ${bordAv(c).label} · ${TRESLAG[c.treslag]?.label ?? c.treslag}`,
    arealM2: Math.round(innvendigAreal(g).A * 100) / 100,
    maal: `${malStr} × ${f0(g.Hf * 100)} cm`,
    arbeidstimer: Math.round((1.5 + deler * 0.05) * 2) / 2,
  }
}

// ── Statikk / byggeregler ────────────────────────────────────────────

function beregningsgrunnlag(c: PlantekasseConfig): Beregningsgrunnlag {
  const g = geo(c)
  const st = g.st
  const deler: Record<string, Medlemskontroll> = { 'Veggbord (nederste rad)': st.vegg }
  if (st.stolpe) deler.Mellomstolpe = st.stolpe
  if (st.bunnbord) deler.Bunnbord = st.bunnbord
  if (st.bunnlist) deler.Bunnlist = st.bunnlist
  if (st.ben) deler.Ben = st.ben
  return tilPlanVedlegg(
    lagBeregningsrapport({
      produkt: 'plantekasse',
      tittel: 'Plantekasse – jordtrykk og jordvekt',
      forutsetninger: [
        { navn: 'Jorddybde', verdi: fmt(Math.max(0.05, g.Hf - 0.03), 2), enhet: 'm', kilde: 'Fylt til 3 cm under kanten' },
        { navn: 'Tyngdetetthet jord γ', verdi: GAMMA_JORD, enhet: 'kN/m³', kilde: 'Fuktig plantejord, konservativt (tørr 8–12)' },
        { navn: 'Hviletrykkskoeffisient K0', verdi: fmt(K0, 2), kilde: 'K0 ≈ 1 − sin φ, φ ≈ 30°' },
        { navn: 'Lasttype', verdi: 'Permanent (γG 1,35, kmod 0,50)', kilde: 'NS-EN 1990 / NS-EN 1995-1-1, tjenesteklasse 3' },
        { navn: 'Største bordspenn mellom stolper', verdi: fmt(st.maksSpenn, 2), enhet: 'm' },
      ],
      laster: [{ navn: 'Jordtrykk ved bunnen', symbol: 'p', verdi: K0 * GAMMA_JORD * Math.max(0.05, g.Hf - 0.03), enhet: 'kN/m²', uttrykk: `p = K0·γ·z = ${fmt(K0, 1)}·${GAMMA_JORD}·${fmt(Math.max(0.05, g.Hf - 0.03), 2)}` }],
      deler,
      merknader: [
        g.stag.length ? `${g.stag.length} tverrstag i toppen holder langveggene sammen – de tar strekk fra jordtrykket (ca. ${fmt((K0 * GAMMA_JORD * g.Hf * g.Hf * st.spennVegg) / 6, 2)} kN per stag).` : 'Kassen er så lav/kort at veggbordene spenner fritt mellom hjørnene – ingen tverrstag trengs.',
        'Vann i jorda øker vekten; sørg for drenering i bunnen så jorda ikke blir vannmettet.',
      ],
      ekstraAdvarsler: st.melding,
    }),
  )
}

function byggeregler(c: PlantekasseConfig): Byggeregler {
  const g = geo(c)
  return {
    sokfri: true,
    tittel: 'Ikke søknadspliktig',
    punkter: [
      'En plantekasse er ikke en bygning og er ikke søknadspliktig.',
      `Faktisk kassehøyde: ${f0(g.Hf * 100)} cm (${g.rader} rader ${bordAv(c).label}${g.topH < g.bh - 0.0005 ? `, øverste rad kløyvd til ${f0(g.topH * 1000)} mm` : ''}).`,
      g.stag.length ? `Jordtrykket krever mellomstolper med maks ${f0(g.st.spennVegg * 100)} cm avstand og ${g.stag.length} tverrstag.` : 'Veggene tåler jordtrykket uten mellomstolper.',
      'Impregnert virke (NTR AB) er godkjent for dyrking av grønnsaker – fôr gjerne innsiden med plast eller duk om du vil unngå direkte kontakt.',
      'Plasser ikke kassen slik at den hindrer rømningsvei, sikt i avkjørsel eller tilkomst for brannbil.',
    ],
  }
}

// ── Montering ────────────────────────────────────────────────────────

function monteringPlan(c: PlantekasseConfig): MonteringSteg[] {
  const g = geo(c)
  const kapp = c.hjorne !== 'stolpe'
  const b = bordAv(c)
  const steg: MonteringSteg[] = [
    { tittel: 'Kapp', trinn: 'fundament', tekst: `Kapp alt etter kapplista (rette kapp, topplisten gjæres 45°). Bordene i hver rad har to lengder: gjennomgående og buttende – annenhver rad bytter de plass (forband).${g.topH < g.bh - 0.0005 ? ` Kløyv bordene i øverste rad til ${f0(g.topH * 1000)} mm.` : ''}`, verktoy: ['Kapp-/gjæringssag', 'Sirkelsag (kløyving)', 'Vinkel'], tidTimer: 1 },
    kapp
      ? { tittel: 'Hjørnebord', trinn: 'reisverk', tekst: `Skru sammen de stående hjørnebordene (${b.label}) to og to til 90°-vinkler, ${f0((g.benY + g.Hf) * 100)} cm lange${g.benY > 0 ? ` – ${f0(g.benY * 100)} cm blir ben` : ''}. Det bredeste bordet dekker endeveden på det andre.`, tidTimer: 0.5 }
      : { tittel: 'Hjørnestolper', trinn: 'reisverk', tekst: `Kapp hjørnestolpene (${stolpeAv(c).label}) til ${f0((g.benY + g.Hf) * 100)} cm${g.benY > 0 ? ` – ${f0(g.benY * 100)} cm står ned som ben` : ''}. Innvendig L-hjørne har én stolpe mot hver vegg.`, tidTimer: 0.3 },
    { tittel: 'Første rad', trinn: 'reisverk', tekst: `Legg kassen opp-ned på et plant underlag eller start nederst${g.benY > 0 ? ` med beina ${f0(g.benY * 100)} cm under` : ''}. Skru nederste rad til hjørnene med 2 skruer per bordende (forbor 4 mm, 15 mm fra enden). Sjekk at diagonalene er like.`, tidTimer: 0.5 },
    { tittel: 'Bygg opp radene', trinn: 'kledning', tekst: `Legg radene med ${f0(GAP * 1000)} mm luft (bruk avstandsklosser). Annenhver rad bytter hvilket bord som går gjennom i hjørnet.${g.stolper.some((p) => p.mid) ? ` Skru mellomstolpene inn fra innsiden for hver ${f0(g.st.spennVegg * 100)} cm.` : ''}`, tidTimer: 1 },
  ]
  if (g.stag.length) steg.push({ tittel: 'Tverrstag', trinn: 'kledning', tekst: `Skru ${g.stag.length} tverrstag på høykant i toppen, inntil mellomstolpene (2 + 2 skruer). Stagene holder langveggene fra å bule ut når jorda trykker.`, tidTimer: 0.3 })
  if (g.bunn) steg.push({ tittel: 'Bunn', trinn: 'kledning', tekst: `Skru bunnlister (${prof(48, Math.round(g.st.listH * 1000))}) innvendig langs veggene i bunnen, mellom stolpene. Legg bunnbordene med 6 mm dreneringsspalte – bordene ligger mellom stolpene.`, tidTimer: 0.5 })
  if (c.foring !== 'ingen') steg.push({ tittel: c.foring === 'plast' ? 'Plastforing' : 'Fiberduk', trinn: 'kledning', tekst: c.foring === 'plast' ? 'Stift plast på innsiden av veggene fra bunnen til 1 cm under kanten. La bunnen være åpen så vannet renner ut.' : 'Kle vegger og bunn med fiberduk (stift i toppen). Duken slipper vann gjennom, men holder jorda på plass.', tidTimer: 0.3 })
  if (c.topplist) steg.push({ tittel: 'Topplist', trinn: 'kledning', tekst: `Gjær topplistene 45°, lim skjøtene med D4-lim og skru ned i veggbordene/stolpene ovenfra.${g.espKanter.length ? ' Langs espalieret flukter topplisten med veggen.' : ''}`, tidTimer: 0.5 })
  if (g.espKanter.length) steg.push({ tittel: 'Espalier', trinn: 'kledning', tekst: `Skru espalierstolpene (48×48) utenpå bakveggen, fra bakken og ${f0((Number(c.espalierHoyde) || 100))} cm over kassen. Skru loddrette spiler mot kassesiden og vannrette spiler innerst, ca. 20 cm rutenett.`, tidTimer: 1 })
  steg.push({ tittel: 'Plasser og fyll', trinn: 'ferdig', tekst: `Sett kassen i vater på drenert underlag (grus/heller). Fyll ca. ${Math.round((innvendigAreal(g).Ainn * Math.max(0, g.Hf - 0.03) * 1000) / 10) * 10} liter jord – drenerende lag (lettklinker/grus) nederst i høye kasser.`, tidTimer: 0.5 })
  return steg
}

// ── 2D-tegning ───────────────────────────────────────────────────────

function tegning2D(c: PlantekasseConfig): Tegning2D {
  const g = geo(c)
  const { staver } = konstruer(c)
  const cmv = (m: number) => Math.round(m * 1000) / 10
  const { w, d } = maal(c)
  const W = cmv(w)
  const D = cmv(d)
  const ben = cmv(g.benY)
  const Hk = cmv(g.Hf)
  const tl = c.topplist ? cmv(g.t) : 0
  const eh = staver.some((s) => s.part === 'espalier') ? Math.max(40, Math.min(200, Number(c.espalierHoyde) || 100)) : 0
  const H = ben + Hk + Math.max(tl, eh)
  const yTopp = H - ben - Hk // kassens overkant (tegning, y ned)
  const ovMaks = cmv(g.bh - g.t - 0.01)
  const ov = c.topplist ? Math.min(ovMaks, c.topplistOverheng) : 0
  // Planmål fra 3D-stavene (samme kilde) – ytre omriss inkl. topplist, hjørnebord og espalier.
  const bb = new THREE.Box3()
  for (const s of staver) {
    s.geom.computeBoundingBox()
    if (s.geom.boundingBox) bb.union(s.geom.boundingBox)
  }
  const flip = c.shape === 'outside-corner' ? -1 : 1
  const px = (x: number) => cmv(flip * x) + W / 2
  const pz = (z: number) => cmv(flip * z) + D / 2
  const oppriss = (bredde: number, navn: string, id: string): Tegning2D['riss'][number] => {
    const former: Tegning2D['riss'][number]['former'] = []
    for (let r = 0; r < g.rader; r++) {
      const yb = H - ben - cmv(r * (g.bh + GAP))
      const h = cmv(r === g.rader - 1 ? g.topH : g.bh)
      former.push({ type: 'rect', x: 0, y: yb - h, w: bredde, h })
    }
    if (tl) former.push({ type: 'rect', x: -ov, y: yTopp - tl, w: bredde + 2 * ov, h: tl })
    if (c.hjorne !== 'stolpe') {
      const bw = cmv(g.bh)
      former.push({ type: 'rect', x: -cmv(g.t), y: yTopp, w: bw, h: H - yTopp }, { type: 'rect', x: bredde + cmv(g.t) - bw, y: yTopp, w: bw, h: H - yTopp })
    } else if (ben > 0) {
      const p = cmv(g.p)
      former.push({ type: 'rect', x: cmv(g.t), y: H - ben, w: p, h: ben }, { type: 'rect', x: bredde - cmv(g.t) - p, y: H - ben, w: p, h: ben })
    }
    if (eh) {
      // Espalier (stiplet ramme + rutenett ca. 20 cm).
      former.push({ type: 'rect', x: 0, y: H - ben - Hk - eh, w: bredde, h: eh - tl, dashed: true })
      for (let yy = 20; yy < eh - tl; yy += 20) former.push({ type: 'line', points: [[0, H - ben - Hk - tl - yy], [bredde, H - ben - Hk - tl - yy]], tynn: true })
    }
    return {
      id,
      navn,
      type: 'fasade',
      bredde,
      hoyde: H,
      former,
      maal: [
        { x1: 0, y1: H, x2: bredde, y2: H, label: `${f0(bredde)} cm`, offset: 22 },
        { x1: bredde, y1: yTopp, x2: bredde, y2: H - ben, label: `${f0(Hk)} cm`, offset: 20 },
        ...(ben > 0 ? [{ x1: bredde, y1: H - ben, x2: bredde, y2: H, label: `${f0(ben)} cm`, offset: 20 }] : []),
        ...(tl ? [{ x1: -ov, y1: yTopp - tl, x2: bredde + ov, y2: yTopp - tl, label: `${f0(bredde + 2 * ov)} cm`, offset: -12 }] : []),
        ...(eh ? [{ x1: 0, y1: 0, x2: 0, y2: yTopp, label: `${f0(eh)} cm`, offset: -18 }] : []),
      ],
    }
  }
  const plan: Tegning2D['riss'][number] = {
    id: 'plan',
    navn: 'Ovenfra (plan)',
    type: 'plan',
    bredde: W,
    hoyde: D,
    former: [
      { type: 'poly', points: [...g.v.map(([x, z]) => [px(x), pz(z)] as [number, number]), [px(g.v[0][0]), pz(g.v[0][1])]] },
      // Ytre omriss (topplist, hjørnebord, espalierstolper) – stiplet.
      { type: 'rect', x: Math.min(px(bb.min.x), px(bb.max.x)), y: Math.min(pz(bb.min.z), pz(bb.max.z)), w: cmv(bb.max.x - bb.min.x), h: cmv(bb.max.z - bb.min.z), dashed: true, tynn: true },
      ...g.stolper.map((p) => ({ type: 'rect' as const, x: Math.min(px(p.x - p.sx / 2), px(p.x + p.sx / 2)), y: Math.min(pz(p.z - p.sz / 2), pz(p.z + p.sz / 2)), w: cmv(p.sx), h: cmv(p.sz), tynn: true })),
      ...g.stag.map((s) => ({ type: 'rect' as const, x: Math.min(px(s.x0), px(s.x1)), y: Math.min(pz(s.z0), pz(s.z1)), w: cmv(s.x1 - s.x0), h: cmv(s.z1 - s.z0), dashed: true })),
    ],
    maal: [
      { x1: 0, y1: D, x2: W, y2: D, label: `${f0(W)} cm`, offset: 22 },
      { x1: 0, y1: 0, x2: 0, y2: D, label: `${f0(D)} cm`, offset: -20 },
      ...(erL(c) ? [{ x1: W, y1: 0, x2: W, y2: cmv(g.v[2][1] - g.v[1][1]), label: `${f0(cmv(g.v[2][1] - g.v[1][1]))} cm`, offset: 18 }] : []),
    ],
    tekster: g.stag.length ? [{ x: W / 2 - 10, y: D / 2, tekst: 'tverrstag (stiplet)' }] : undefined,
  }
  return { riss: [oppriss(W, 'Forfra', 'forfra'), oppriss(D, 'Fra siden', 'siden'), plan] }
}

// ── Template ─────────────────────────────────────────────────────────

export const plantekasse: ProductTemplate<PlantekasseConfig> & {
  beregningsgrunnlag: (c: PlantekasseConfig) => Beregningsgrunnlag
  monteringPlan: (c: PlantekasseConfig) => MonteringSteg[]
} = {
  id: 'plantekasse',
  navn: 'Plantekasse',
  ikon: 'faSeedling',
  beskrivelse: 'Tegn plantekassen i 3D – fire former, hjørner i forband, ben, topplist og espalier. Jordtrykket beregnes, så høye og lange kasser får stolper og stag der de trengs.',
  bilde: '/images/designer/plantekasse-3d.webp',
  tilgjengelig: true,
  gratis: true,
  fraPris: 199,
  leveranser: ['ferdig', 'plan'],
  defaultConfig: {
    shape: 'rect',
    bredde: 120,
    dybde: 60,
    hoyde: 50,
    arm: 50,
    ben: 0,
    bordDim: '28x120',
    hjorne: 'kapp',
    stolpeDim: '48x48',
    treslag: 'impregnert',
    farge: 'ubehandlet',
    bunn: false,
    topplist: true,
    topplistOverheng: 3,
    espalier: false,
    espalierHoyde: 100,
    foring: 'fiberduk',
  },
  presets: [
    { id: 'hoybed', navn: 'Høybed', beskrivelse: '180×80×60, stolper og stag', config: { shape: 'rect', bredde: 180, dybde: 80, hoyde: 60, ben: 0, hjorne: 'stolpe', stolpeDim: '48x48', bunn: false, topplist: true, topplistOverheng: 4, espalier: false, foring: 'plast', bordDim: '28x145' } },
    { id: 'plantebord', navn: 'Plantebord på ben', beskrivelse: 'Arbeidshøyde for ryggen', config: { shape: 'rect', bredde: 120, dybde: 60, hoyde: 30, ben: 50, hjorne: 'kapp', bunn: true, topplist: true, topplistOverheng: 4, espalier: false, foring: 'fiberduk', bordDim: '28x120' } },
    { id: 'espalier', navn: 'Med espalier', beskrivelse: 'For klatreplanter', config: { shape: 'rect', bredde: 100, dybde: 40, hoyde: 40, ben: 0, hjorne: 'kapp', bunn: false, topplist: true, topplistOverheng: 3, espalier: true, espalierHoyde: 120, foring: 'fiberduk', bordDim: '28x120' } },
    { id: 'hjorne', navn: 'Hjørnekasse', beskrivelse: 'L-form inn i et hjørne', config: { shape: 'inside-corner', bredde: 160, dybde: 160, hoyde: 50, arm: 50, ben: 0, hjorne: 'stolpe', stolpeDim: '48x48', bunn: false, topplist: true, topplistOverheng: 3, espalier: false, foring: 'fiberduk', bordDim: '28x120' } },
    { id: 'liten', navn: 'Urtekasse', beskrivelse: 'Liten, 21×98-bord', config: { shape: 'square', bredde: 60, hoyde: 30, ben: 0, hjorne: 'kapp', bunn: true, topplist: true, topplistOverheng: 2, espalier: false, foring: 'fiberduk', bordDim: '21x98' } },
  ],
  former: {
    key: 'shape',
    label: 'Form',
    choices: [
      { id: 'square', label: 'Kvadrat', ikon: 'square' },
      { id: 'rect', label: 'Rektangel', ikon: 'rect' },
      { id: 'outside-corner', label: 'Utvendig hjørne', ikon: 'outside-corner' },
      { id: 'inside-corner', label: 'Innvendig hjørne', ikon: 'inside-corner' },
    ],
  },
  dimensjoner: [
    { key: 'bredde', label: 'Bredde', min: 40, max: 300, step: 5, axis: 'x' },
    { key: 'dybde', label: 'Dybde', min: 30, max: 240, step: 5, axis: 'z', visibleWhen: (c) => c.shape !== 'square' },
    { key: 'hoyde', label: 'Høyde', min: 20, max: 100, step: 1, axis: 'y', markers: [30, 40, 50, 60, 80] },
    { key: 'arm', label: 'Armbredde', min: 30, max: 100, step: 5, axis: 'x', handle: false, visibleWhen: (c) => c.shape === 'outside-corner' || c.shape === 'inside-corner' },
    { key: 'ben', label: 'Ben under kassen', min: 0, max: 70, step: 2, axis: 'y', handle: false },
    { key: 'topplistOverheng', label: 'Topplist-utheng', min: 0, max: 8, step: 1, axis: 'x', handle: false, visibleWhen: (c) => Boolean(c.topplist) },
    { key: 'espalierHoyde', label: 'Espalier over kassen', min: 40, max: 200, step: 10, axis: 'y', handle: false, visibleWhen: (c) => Boolean(c.espalier) },
  ],
  materialer: [
    { key: 'treslag', label: 'Treslag', choices: treslagValg(['impregnert', 'gran', 'royal', 'lerk', 'kebony']) },
    { key: 'farge', label: 'Farge / beis', asSwatches: true, choices: fargeValg(['ubehandlet', 'klar', 'hvit', 'lysgra', 'morkegra', 'sort', 'brun', 'gronn']) },
  ],
  alternativer: [
    { key: 'bordDim', label: 'Bord', choices: Object.entries(BORD_DIMS).map(([id, v]) => ({ id, label: v.label })) },
    {
      key: 'hjorne',
      label: 'Hjørner',
      choices: [
        { id: 'kapp', label: 'Hjørnebord utvendig', note: 'To stående bord i vinkel – blir også ben.' },
        { id: 'stolpe', label: 'Stolpe innvendig', note: 'Glatte hjørner, stolpe innenfor.' },
      ],
    },
    { key: 'stolpeDim', label: 'Stolpe', visibleWhen: (c) => c.hjorne === 'stolpe', choices: Object.entries(STOLPE_DIMS).map(([id, v]) => ({ id, label: v.label })) },
    {
      key: 'foring',
      label: 'Foring innvendig',
      choices: [
        { id: 'fiberduk', label: 'Fiberduk', note: 'Drenerer – holder jorda.' },
        { id: 'plast', label: 'Plast på veggene', note: 'Beskytter treet – bunnen åpen.' },
        { id: 'ingen', label: 'Ingen' },
      ],
    },
  ],
  valg: [
    { key: 'bunn', label: 'Bunn med drenering', note: 'Alltid med når kassen har ben.' },
    { key: 'topplist', label: 'Topplist', note: 'Gjæret ramme rundt toppen.' },
    { key: 'espalier', label: 'Espalier på baksiden', note: 'For klatreplanter.' },
  ],
  parts: [
    { key: 'kledning', label: 'Veggbord' },
    { key: 'stolpe', label: 'Hjørner, stolper og stag' },
    { key: 'topplist', label: 'Topplist' },
    { key: 'bunn', label: 'Bunn' },
    { key: 'espalier', label: 'Espalier' },
  ],
  beregn,
  kappliste,
  tegning2D,
  byggeregler,
  beregningsgrunnlag,
  monteringPlan,
  montering: (c) => stegTilTekst(monteringPlan(c)),
  raad: (c) => {
    const g = geo(c)
    const r = [
      'Forbor alltid 8–10 mm fra bordendene og bruk rustfrie A4-skruer – vanlige skruer ruster og gir svarte renner.',
      'Hjørnene legges i forband: annenhver rad går gjennom på hver side. Det gir sterkere hjørner og et ryddig, tømret uttrykk.',
      g.stag.length ? `Jordtrykket på ${f0(g.Hf * 100)} cm jord er stort: mellomstolpene og tverrstagene må med, ellers buler langveggene ut.` : 'Kassen er lav nok til at veggene tåler jordtrykket uten stag.',
      c.foring === 'plast' ? 'Plast på veggene forlenger levetiden – men la bunnen være åpen så vannet renner ut.' : c.foring === 'fiberduk' ? 'Fiberduk innvendig holder jorda på plass og slipper vannet gjennom.' : 'Uten foring: jorda ligger rett på treet – velg impregnert eller kebony.',
      g.bunn ? 'Bunnen har 6 mm spalter for drenering. Legg 5–10 cm lettklinker eller grus nederst i høye kasser.' : 'Uten bunn: sett kassen på drenerende grus, og legg gjerne netting i bunnen mot mus og muldvarp.',
      c.topplist ? 'Lim gjæringene i topplisten med D4-lim før du skrur – da åpner de seg ikke.' : 'Slip toppkanten lett så den er god å ta i.',
      'La impregnert virke tørke noen uker før du oljer eller beiser.',
    ]
    return [...g.st.melding, ...r]
  },
  buildMesh,
  bounds: (c) => {
    const { group } = lagGruppe(c, () => new THREE.MeshBasicMaterial())
    const s = new THREE.Box3().setFromObject(group).getSize(new THREE.Vector3())
    return { x: s.x, y: s.y, z: s.z }
  },
}
