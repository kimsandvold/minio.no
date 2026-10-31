import * as THREE from 'three'
import type { Bom, BomLine, BuildOptions, Byggeregler, DesignConfig, ProductTemplate, Tegning2D } from '../types'
import type { Beregningsgrunnlag, KapplisteDelPlan, MonteringSteg } from '../plan-typer'
import { TRESLAG, treslagValg, fargeValg } from '../materials'
import { PRISER, prisFor } from '../priser'
import { snolastForConfig } from '../byggested'
import { VB0_STANDARD, fmt, snolastTak, taktekkeFra, vindHorisontal, vindOppdrift, vindlast } from '../laster'
import { kontrollerBjelke, kontrollerSoyle, linjelaster, taklaster, tverrsnitt, dimensjonerSperre } from '../dimensjonering'
import type { Medlemskontroll } from '../dimensjonering'
import { FROSTSONER, GRUNN, dimensjonerPunktfundament, frostdybde } from '../fundament'
import type { Frostsone, Grunn } from '../fundament'
import { vurderByggesak } from '../byggesak'
import { lagBeregningsrapport, tilPlanVedlegg } from '../beregningsgrunnlag'
import { fmtGrader } from '../geometri'
import { basis, byggMesher, ende, f0, lagMatFabrikk, lmLinje, lmPerPris, plasser, prisme, prof, samleKappliste, stegTilTekst } from './smaa-felles'
import type { Stav, V2, V3 } from './smaa-felles'

/**
 * Postkassestativ med tak – parametrisk template (Minio bygger det ferdig).
 *
 * KONSTRUKSJON
 *  - Stolper 98×98 i hjørnene (og midt foran/bak over 2 m bredde) på
 *    punktfundament: støpt pilarrør eller jordskrue med stolpesko, dybde etter
 *    frostberegning (fundament.ts). Stativet er høyt og smalt – vind-
 *    velting og oppløft gir strekk i fundamentene, som kontrolleres.
 *  - Bunnramme og rem i 2 × 48 mm (flukter med stolpene). Remmene er
 *    skråhøvlet i takvinkelen der sperrene ligger på (fullt anlegg uten
 *    fuglemunn), og gjæret 45° i hjørnene ved valmtak.
 *  - Losholter 48×98 c/c ≤ 600 for stående kledning bak og på sidene.
 *    Kneband 45° i de åpne frontfagene.
 *  - Tak: pulttak, saltak (møne langs bredden eller dybden, bærende mønebjelke
 *    på gavlstolper – ingen skyvkrefter) eller valmtak (gratsperrer,
 *    skiftesperrer med kinnkutt, mønebord). Sperrer, rem og mønebjelke
 *    dimensjoneres for snølast (NS-EN 1991-1-3 / NS-EN 1995-1-1).
 *  - Postkassene henges på innerveggen slik at laveste innkast er ≥ 90 cm og
 *    høyeste ≤ 175 cm over bakken (Postens krav), med bunnskap/pakkehylle under.
 */

export interface PostkassestativConfig {
  bredde: number // cm (x) – utvendig stolpe til stolpe
  dybde: number // cm (z)
  hoyde: number // cm – bakken til overkant rem ved takfoten
  kasser: number // antall postkasser
  innkast: number // cm – ønsket høyde til laveste innkast
  kledningsbord: string // '19x148' | '19x98' | 'lekt'
  taktype: string // 'pulttak' | 'saltak' | 'valmtak'
  takvinkel: number
  takutstikk: number // cm
  takretning: string // pulttak: 'bak' (fall bakover) | 'front'
  moneretning: string // saltak: 'bredde' | 'dybde'
  tekking: string // 'takpapp' | 'shingel'
  bunnskap: boolean
  fundament: string // 'pilarror' | 'jordskrue'
  grunn: string
  frostsone: string
  treslag: string
  farge: string
  [key: string]: DesignConfig[string]
}

const SVINN = 1.1
const P = 0.098 // stolpe
const RB = 0.096 // rem/bunnramme 2 × 48
const B = 0.048
const BUNN_Y0 = 0.1
const BUNN_H = 0.098
const STOLPE_Y0 = 0.08 // stolpesko løfter stolpen 30 mm over betongen
const BETONG_Y = 0.05
const KASSE = { b: 0.3, h: 0.42, d: 0.34, innkast: 0.36, luft: 0.04, radavstand: 0.53 }
const POSTEN = { minInnkast: 0.9, maksInnkast: 1.75, lokkLuft: 0.1 }
const TAKPLATE = 0.018
const TEKKING_T = 0.004

const cm = (v: number) => v / 100
const rad = (g: number) => (g * Math.PI) / 180

function kledningSpec(id: string) {
  if (id === '19x98') return { t: 0.019, w: 0.098, gap: 0.004, profil: prof(19, 98), pris: 'bord-19x98' }
  if (id === 'lekt') return { t: 0.023, w: 0.048, gap: 0.012, profil: prof(23, 48), pris: 'lekt-23x48' }
  return { t: 0.019, w: 0.148, gap: 0.004, profil: prof(19, 148), pris: 'bord-19x148' }
}

// ── Takramme (lokalt R-system: X langs mønet/takfoten, Z på tvers) ──

interface Tak {
  type: 'pulttak' | 'saltak' | 'valmtak'
  /** Verdens-vektor for lokal (X, y, Z). */
  tilV: (p: V3) => V3
  L: number
  S: number
  a: number
  tan: number
  cos: number
  sin: number
  H: number
  oh: number
  hS: number // sperrehøyde
  hRem: number
  /** Rafterunderkant (= remmenes skråflate). */
  Yb: (X: number, Z: number) => number
  Yt: (X: number, Z: number) => number
  r: number // mønelengde (valm)
  hRidge: number // mønebjelke/mønebord
  gavl: (X: number) => boolean // er veggen ved X = ±L/2 gavl?
}

function lagTak(c: PostkassestativConfig, hS: number, hRem: number, hRidge: number): Tak {
  const w = cm(c.bredde)
  const d = cm(c.dybde)
  const type = (['pulttak', 'saltak', 'valmtak'].includes(c.taktype) ? c.taktype : 'pulttak') as Tak['type']
  const swap = (type === 'saltak' && c.moneretning === 'dybde') || (type === 'valmtak' && d > w)
  const speil = type === 'pulttak' && c.takretning !== 'front' // pulttak: lav takfot mot +Z; «bak» = fall bakover
  const tilV = ([X, y, Z]: V3): V3 => {
    const z2 = speil ? -Z : Z
    return swap ? [z2, y, X] : [X, y, z2]
  }
  const L = swap ? d : w
  const S = swap ? w : d
  const a = Math.max(3, Math.min(45, c.takvinkel))
  const tan = Math.tan(rad(a))
  const cos = Math.cos(rad(a))
  const H = cm(c.hoyde)
  const oh = Math.max(0.05, Math.min(0.3, cm(c.takutstikk)))
  const r = type === 'valmtak' ? Math.max(0, L - S) : 0
  const Yb = (X: number, Z: number) => {
    if (type === 'pulttak') return H + (S / 2 - Z) * tan
    if (type === 'saltak') return H + (S / 2 - Math.abs(Z)) * tan
    return H + Math.min(S / 2 - Math.abs(Z), L / 2 - Math.abs(X)) * tan
  }
  return { type, tilV, L, S, a, tan, cos, sin: Math.sin(rad(a)), H, oh, hS, hRem, Yb, Yt: (X, Z) => Yb(X, Z) + hS / Math.cos(rad(a)), r, hRidge, gavl: () => type !== 'valmtak' }
}

// ── Statikk ──────────────────────────────────────────────────────────

interface Statikk {
  sperre: Medlemskontroll
  hS: number
  rem: Medlemskontroll
  hRem: number
  ridge?: Medlemskontroll
  hRidge: number
  /** Saltak: bærende mønebjelke på gavlstolper, eller sperrebind (takstoler). */
  saltak: 'monebjelke' | 'sperrebind'
  stolpe: Medlemskontroll
  sk: ReturnType<typeof snolastForConfig>
  ok: boolean
  melding: string[]
}

const REM_H = [0.148, 0.198, 0.223]

function statikk(c: PostkassestativConfig): Statikk {
  const w = cm(c.bredde)
  const d = cm(c.dybde)
  const sk = snolastForConfig(c)
  const type = c.taktype
  const a = Math.max(3, Math.min(45, c.takvinkel))
  const tekke = taktekkeFra(c.tekking === 'shingel' ? 'shingel' : 'takpapp')
  const flater = taklaster({ sk: sk.sk, vinkelGrader: a, tekke })
  const swap = (type === 'saltak' && c.moneretning === 'dybde') || (type === 'valmtak' && d > w)
  const L = swap ? d : w
  const S = swap ? w : d
  const oh = Math.max(0.05, Math.min(0.3, cm(c.takutstikk)))
  // Sperrer
  const spenn = type === 'pulttak' ? S - RB : S / 2 - RB / 2
  const sp = dimensjonerSperre({ spennHorisontalM: Math.max(0.2, spenn), vinkelGrader: a, ccM: 0.6, tekke, sk: sk.sk })
  const hS = Math.max(0.098, sp.valgt.h / 1000)
  // Rem ved takfoten: spenn mellom stolpene langs X; avfasingen trekkes fra.
  const midt = w > 2.0
  const remSpenn = (swap ? L : midt ? L / 2 : L) - P
  const trib = type === 'pulttak' ? S / 2 + oh : type === 'saltak' ? S / 4 + oh : S / 2 + oh
  const fas = RB * Math.tan(rad(a))
  let rem: Medlemskontroll | undefined
  let hRem = REM_H[REM_H.length - 1]
  for (const h of REM_H) {
    rem = { ...kontrollerBjelke(tverrsnitt(48, Math.round((h - fas) * 1000), 2, 'C24', `bjelke-48x${Math.round(h * 1000)}`), { spennM: remSpenn, laster: linjelaster(flater, trib), tjenesteklasse: 2, nedboyning: 'drager', sidestottet: true, opplegglengdeMm: 98 }), navn: 'Rem (takfot)' }
    hRem = h
    rem.tverrsnitt = { ...rem.tverrsnitt, profil: `2 × 48 × ${Math.round(h * 1000)} mm (netto ${Math.round((h - fas) * 1000)} etter skråhøvling)` }
    if (rem.ok) break
  }
  // Mønebjelke (saltak) – på gavlstolper.
  let ridge: Medlemskontroll | undefined
  let hRidge = 0.148
  if (type === 'saltak') {
    for (const h of REM_H) {
      ridge = { ...kontrollerBjelke(tverrsnitt(48, Math.round(h * 1000), 2, 'C24', `bjelke-48x${Math.round(h * 1000)}`), { spennM: L - P, laster: linjelaster(flater, S / 2), tjenesteklasse: 2, nedboyning: 'drager', sidestottet: true, opplegglengdeMm: 98 }), navn: 'Mønebjelke' }
      hRidge = h
      if (ridge.ok) break
    }
  } else if (type === 'valmtak') {
    hRidge = [0.098, 0.148, 0.198, 0.223].find((h) => h >= hS / Math.cos(rad(a)) - 1e-6) ?? 0.223
  }
  // Mønebjelken må få plass over gavlremmen (gavlstolpe ≥ 10 cm), ellers takstoler med sperrebind.
  let saltak: Statikk['saltak'] = 'monebjelke'
  if (type === 'saltak' && (S / 2 - RB / 2) * Math.tan(rad(a)) - hRidge - RB * Math.tan(rad(a)) < 0.1) {
    saltak = 'sperrebind'
    ridge = undefined
  }
  const nStolper = midt ? 6 : 4
  const A = (w + 2 * oh) * (d + 2 * oh)
  const stolpe = { ...kontrollerSoyle(tverrsnitt(98, 98, 1, 'C24', 'stolpe-98x98'), { lengdeM: cm(c.hoyde), NGk: (flater[0].qk * A) / nStolper + 0.5, NQk: [{ type: 'sno', Nk: (flater[1].qk * A) / nStolper }], tjenesteklasse: 3 }), navn: 'Stolpe' }
  const melding: string[] = []
  if (!sp.ok) melding.push(`Sperrene holder ikke for sk = ${fmt(sk.sk, 1)} kN/m² – reduser dybden eller øk takvinkelen.`)
  if (rem && !rem.ok) melding.push('Remmen over den åpne fronten er for svak for snølasten – velg mindre bredde (eller > 2 m bredde gir midtstolpe).')
  if (ridge && !ridge.ok) melding.push('Mønebjelken holder ikke for snølasten over dette spennet.')
  return { sperre: { ...sp.kontroll, navn: 'Sperre' }, hS, rem: rem as Medlemskontroll, hRem, ridge, hRidge, saltak, stolpe, sk, ok: sp.ok && (rem?.ok ?? true) && (ridge?.ok ?? true) && stolpe.ok, melding }
}

// ── Geometri ─────────────────────────────────────────────────────────

interface Kasse {
  x: number
  yb: number // underkant
}

interface Geo {
  w: number
  d: number
  st: Statikk
  tak: Tak
  midt: boolean
  stolper: Array<{ x: number; z: number; topp: number }>
  remBunn: number // underkant rem (vanlig)
  remBunnHoy: number // pulttak: høy side
  bak: { remBunn: number } // underkant rem over bakveggen
  front: { remBunn: number }
  kasser: Kasse[]
  rader: number
  innkastLav: number
  innkastHoy: number
  hylle: number // overkant hylle (0 = ingen bunnskap)
  ks: ReturnType<typeof kledningSpec>
  kasseD: number
  plassTil: number
  meldinger: string[]
}

function geo(c: PostkassestativConfig): Geo {
  const w = cm(c.bredde)
  const d = cm(c.dybde)
  const st = statikk(c)
  const tak = lagTak(c, st.hS, st.hRem, st.hRidge)
  const midt = w > 2.0
  const fas = RB * tak.tan
  const remBunn = tak.H + fas - st.hRem
  const remBunnHoy = tak.type === 'pulttak' ? tak.Yb(0, -tak.S / 2) - st.hRem : remBunn
  // Hvilken verdensside er høy (pulttak)?
  const hoyVerden = tak.tilV([0, 0, -1]) // retning mot høy side i verden
  const bakHoy = tak.type === 'pulttak' && hoyVerden[2] < -0.5
  const frontHoy = tak.type === 'pulttak' && hoyVerden[2] > 0.5
  const stolper: Geo['stolper'] = []
  const xs = midt ? [-(w / 2 - P / 2), 0, w / 2 - P / 2] : [-(w / 2 - P / 2), w / 2 - P / 2]
  for (const sz of [-1, 1]) {
    for (const x of xs) {
      const z = sz * (d / 2 - P / 2)
      const hoy = (sz < 0 && bakHoy) || (sz > 0 && frontHoy)
      stolper.push({ x, z, topp: hoy ? remBunnHoy : remBunn })
    }
  }
  const ks = kledningSpec(c.kledningsbord)
  const meldinger: string[] = []
  // Postkasser
  const innerW = w - 2 * P
  const segmenter: Array<[number, number]> = midt ? [[-w / 2 + P, -P / 2], [P / 2, w / 2 - P]] : [[-w / 2 + P, w / 2 - P]]
  const perSeg = segmenter.map(([a, b]) => Math.max(0, Math.floor((b - a + KASSE.luft) / (KASSE.b + KASSE.luft))))
  const kapasitetRad = perSeg.reduce((s, n) => s + n, 0)
  const bakRemBunn = bakHoy ? remBunnHoy : remBunn
  let ønsket = Math.max(1, Math.round(Number(c.kasser) || 1))
  const plassTil = Math.max(1, 2 * kapasitetRad)
  if (ønsket > plassTil) {
    meldinger.push(`Det er bare plass til ${plassTil} postkasser i to rader med ${f0(w * 100)} cm bredde – øk bredden for flere.`)
    ønsket = plassTil
  }
  let rader = ønsket > kapasitetRad ? 2 : 1
  // Plass under remmen (lokket skal kunne åpnes). Postkassene går nesten fram
  // til fronten i grunne stativer – laveste rem gjelder.
  const toppMaks = Math.min(remBunn, remBunnHoy) - POSTEN.lokkLuft
  const toppFor = (innk: number, r: number) => innk - KASSE.innkast + (r - 1) * KASSE.radavstand + KASSE.h + 0.09
  let innkastLav = Math.max(POSTEN.minInnkast, cm(Number(c.innkast) || 110))
  if (innkastLav + (rader - 1) * KASSE.radavstand > POSTEN.maksInnkast) innkastLav = Math.max(POSTEN.minInnkast, POSTEN.maksInnkast - (rader - 1) * KASSE.radavstand)
  if (toppFor(innkastLav, rader) > toppMaks) innkastLav = Math.max(POSTEN.minInnkast, innkastLav - (toppFor(innkastLav, rader) - toppMaks))
  if (rader === 2 && toppFor(innkastLav, 2) > toppMaks + 1e-6) {
    meldinger.push(`Vegghøyden gir bare plass til én rad postkasser under remmen (${kapasitetRad} stk) – øk høyden eller bredden for flere.`)
    rader = 1
    ønsket = kapasitetRad
  }
  if (toppFor(innkastLav, rader) > toppMaks + 1e-6) meldinger.push('Vegghøyden er for lav til at postkasselokkene kan åpnes helt under remmen – øk høyden.')
  const kasser: Kasse[] = []
  const iRad = [Math.min(ønsket, kapasitetRad), Math.max(0, ønsket - kapasitetRad)]
  iRad.forEach((n, ri) => {
    if (n <= 0) return
    const yb = innkastLav - KASSE.innkast + ri * KASSE.radavstand
    // Fordel på segmentene etter kapasitet.
    let rest = n
    const fordeling = perSeg.map((cap, si) => {
      const andel = si === perSeg.length - 1 ? rest : Math.min(cap, Math.round((n * cap) / kapasitetRad))
      rest -= andel
      return andel
    })
    fordeling.forEach((k, si) => {
      const [a, b] = segmenter[si]
      for (let i = 0; i < k; i++) kasser.push({ x: a + ((b - a) * (i + 0.5)) / k, yb })
    })
  })
  // Innkast-nummerering: laveste nummer først (venstre → høyre, øverst først).
  const innkastHoy = innkastLav + (rader - 1) * KASSE.radavstand
  // Bunnskap/hylle under laveste kasse.
  let hylle = 0
  if (c.bunnskap) {
    hylle = Math.min(0.75, innkastLav - KASSE.innkast - 0.08)
    if (hylle < 0.4) {
      meldinger.push('Bunnskapet får ikke plass under postkassene – løft innkastet eller slå av bunnskap.')
      hylle = 0
    }
  }
  const kasseD = Math.min(KASSE.d, d - B - ks.t - 0.085) // fri plass foran til kneband
  void innerW
  return { w, d, st, tak, midt, stolper, remBunn, remBunnHoy, bak: { remBunn: bakRemBunn }, front: { remBunn: frontHoy ? remBunnHoy : remBunn }, kasser, rader, innkastLav, innkastHoy, hylle, ks, kasseD, plassTil, meldinger }
}

// ── Stavliste ────────────────────────────────────────────────────────

const X3: V3 = [1, 0, 0]
const Y3: V3 = [0, 1, 0]
const Z3: V3 = [0, 0, 1]
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const add3 = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s]

/** Kuttfunksjon u(p, q) for et plan n·P = e i en stav-ramme P = O + u·eU + p·eA + q·eB. */
const plan = (O: V3, eU: V3, eA: V3, eB: V3, n: V3, e: number) => (p: number, q: number) => (e - dot(n, add3(add3(O, eA, p), eB, q))) / dot(n, eU)

function konstruer(c: PostkassestativConfig): { staver: Stav[]; g: Geo } {
  const g = geo(c)
  const { w, d, tak, st, ks } = g
  const staver: Stav[] = []
  const addS = (s: Stav) => staver.push({ kvalitet: 'Impregnert C24', ...s })
  const kat = { k: 'konstruksjon' as const, t: 'tak' as const, kl: 'kledning' as const }
  void kat

  // ── Stolper ──
  g.stolper.forEach((p, i) => {
    const geom = plasser(prisme([[p.z - P / 2, p.x - P / 2], [p.z + P / 2, p.x - P / 2], [p.z + P / 2, p.x + P / 2], [p.z - P / 2, p.x + P / 2]], () => STOLPE_Y0, () => p.topp), basis(Y3, Z3, X3))
    addS({ navn: 'Stolpe', profil: prof(98, 98), pris: 'stolpe-98x98', lengdeMm: (p.topp - STOLPE_Y0) * 1000, endeA: ende(0), endeB: ende(0), part: 'stolpe', pid: `stolpe-${i}`, geom, darken: 0.88, explode: new THREE.Vector3(p.x, 0, p.z).normalize().multiplyScalar(0.25), kategori: kat.k, merknad: 'Festes i stolpesko med 4 skruer/bolter.' })
  })

  // ── Bunnramme (2 × 48×98, på høykant) ──
  const xInn = w / 2 - P
  const zInn = d / 2 - P
  const segX: Array<[number, number]> = g.midt ? [[-xInn, -P / 2], [P / 2, xInn]] : [[-xInn, xInn]]
  const bjelkeX = (navn: string, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, pid: string, part = 'konstruksjon', profil = prof(48, 98), pris = 'stolpe-48x98') =>
    addS({ navn, profil, pris, lengdeMm: (x1 - x0) * 1000, endeA: ende(0), endeB: ende(0), part, pid, geom: prisme([[y0, z0], [y1, z0], [y1, z1], [y0, z1]], () => x0, () => x1), darken: 0.85, kategori: kat.k })
  const bjelkeZ = (navn: string, z0: number, z1: number, x0: number, x1: number, y0: number, y1: number, pid: string, part = 'konstruksjon', profil = prof(48, 98), pris = 'stolpe-48x98') =>
    addS({ navn, profil, pris, lengdeMm: (z1 - z0) * 1000, endeA: ende(0), endeB: ende(0), part, pid, geom: plasser(prisme([[y0, x0], [y1, x0], [y1, x1], [y0, x1]], () => z0, () => z1), basis(Z3, Y3, X3)), darken: 0.85, kategori: kat.k })
  const by0 = BUNN_Y0
  const by1 = BUNN_Y0 + BUNN_H
  ;[-1, 1].forEach((sz) => {
    segX.forEach(([a, b], si) => {
      for (let k = 0; k < 2; k++) {
        const z0 = sz > 0 ? d / 2 - RB + k * B : -d / 2 + k * B
        bjelkeX('Bunnramme', a, b, z0, z0 + B, by0, by1, `bunnramme-${sz > 0 ? 'f' : 'b'}-${si}-${k}`)
      }
    })
  })
  ;[-1, 1].forEach((sx) => {
    for (let k = 0; k < 2; k++) {
      const x0 = sx > 0 ? w / 2 - RB + k * B : -w / 2 + k * B
      bjelkeZ('Bunnramme', -zInn, zInn, x0, x0 + B, by0, by1, `bunnramme-${sx > 0 ? 'h' : 'v'}-${k}`)
    }
  })

  // ── Losholter bak og på sidene (for stående kledning) ──
  const losNivaa = (topp: number) => {
    const y0 = by1
    const y1 = topp
    const n = Math.max(0, Math.ceil((y1 - y0) / 0.6 - 1e-9) - 1)
    return Array.from({ length: n }, (_, i) => y0 + ((i + 1) * (y1 - y0)) / (n + 1) - 0.049)
  }
  const bakTopp = g.bak.remBunn
  losNivaa(bakTopp).forEach((y, li) => segX.forEach(([a, b], si) => bjelkeX('Losholt', a, b, -d / 2, -d / 2 + B, y, y + 0.098, `losholt-b-${li}-${si}`)))
  ;[-1, 1].forEach((sx) => {
    losNivaa(Math.min(g.remBunn, g.remBunnHoy)).forEach((y, li) => bjelkeZ('Losholt', -zInn, zInn, sx > 0 ? w / 2 - B : -w / 2, sx > 0 ? w / 2 : -w / 2 + B, y, y + 0.098, `losholt-${sx > 0 ? 'h' : 'v'}-${li}`))
  })

  // ── Rem (2 × 48, skråhøvlet der sperrene ligger) ──
  // Lokal R-ramme → verden.
  const V = tak.tilV
  const Rplasser = (geomLokal: THREE.BufferGeometry) => {
    const ex = V([1, 0, 0])
    const ez = V([0, 0, 1])
    return plasser(geomLokal, basis(ex, Y3, ez))
  }
  const { L, S, tan } = tak
  const hRem = st.hRem
  const remProfil = prof(48, Math.round(hRem * 1000))
  const remPris = `bjelke-48x${Math.round(hRem * 1000)}`
  const fasMerk = (vinkel: number) => `Skråhøvles ${fmtGrader(vinkel)} på oversiden (sperrene får fullt anlegg).`
  const remBunnStd = g.remBunn
  // Takfot-remmer langs X ved Z = ±S/2.
  const takfotRem = (sz: number) => {
    const hoy = tak.type === 'pulttak' && sz < 0
    const bunn = hoy ? g.remBunnHoy : remBunnStd
    for (let k = 0; k < 2; k++) {
      const z0 = sz > 0 ? S / 2 - RB + k * B : -S / 2 + k * B
      const z1 = z0 + B
      const topp = (Z: number) => tak.Yb(0, Z)
      const mitre = tak.type === 'valmtak'
      const geom = prisme(
        [[bunn, z0], [bunn, z1], [topp(z1), z1], [topp(z0), z0]],
        (_y, Z) => (mitre ? -(L / 2 - (S / 2 - Math.abs(Z))) : -L / 2),
        (_y, Z) => (mitre ? L / 2 - (S / 2 - Math.abs(Z)) : L / 2),
      )
      const zMaks = Math.max(Math.abs(z0), Math.abs(z1))
      addS({ navn: hoy ? 'Rem, høy side' : 'Rem, takfot', profil: remProfil, pris: remPris, lengdeMm: (mitre ? L - 2 * (S / 2 - zMaks) : L) * 1000, endeA: ende(mitre ? 45 : 0, mitre ? 'gjaering' : undefined), endeB: ende(mitre ? 45 : 0, mitre ? 'gjaering' : undefined), merknad: `${fasMerk(tak.a)} To planker skrus/spikres sammen.`, part: 'konstruksjon', pid: `rem-z${sz}-${k}`, geom: Rplasser(geom), darken: 0.8, kategori: kat.k })
    }
  }
  takfotRem(1)
  takfotRem(-1)
  // Remmer ved X = ±L/2 (gavl: flat; valm: skråhøvlet og gjæret).
  ;[-1, 1].forEach((sx) => {
    for (let k = 0; k < 2; k++) {
      const x0 = sx > 0 ? L / 2 - RB + k * B : -L / 2 + k * B
      const x1 = x0 + B
      let geom: THREE.BufferGeometry
      if (tak.type === 'valmtak') {
        const topp = (X: number) => tak.H + (L / 2 - Math.abs(X)) * tan
        geom = plasser(prisme([[remBunnStd, x0], [remBunnStd, x1], [topp(x1), x1], [topp(x0), x0]], (_y, X) => -(S / 2 - (L / 2 - Math.abs(X))), (_y, X) => S / 2 - (L / 2 - Math.abs(X))), basis(Z3, Y3, X3))
      } else {
        const z0 = -S / 2 + P
        const z1 = S / 2 - P
        geom = plasser(prisme([[remBunnStd, x0], [remBunnStd + hRem, x0], [remBunnStd + hRem, x1], [remBunnStd, x1]], () => z0, () => z1), basis(Z3, Y3, X3))
      }
      const xMaks = Math.max(Math.abs(x0), Math.abs(x1))
      const lengde = tak.type === 'valmtak' ? S - 2 * (L / 2 - xMaks) : S - 2 * P
      addS({ navn: tak.type === 'valmtak' ? 'Rem, valm' : 'Rem, gavl', profil: remProfil, pris: remPris, lengdeMm: lengde * 1000, endeA: ende(tak.type === 'valmtak' ? 45 : 0, tak.type === 'valmtak' ? 'gjaering' : undefined), endeB: ende(tak.type === 'valmtak' ? 45 : 0, tak.type === 'valmtak' ? 'gjaering' : undefined), merknad: tak.type === 'valmtak' ? fasMerk(tak.a) : 'Ligger mellom takfotremmene.', part: 'konstruksjon', pid: `rem-x${sx}-${k}`, geom: Rplasser(geom), darken: 0.8, kategori: kat.k })
    }
  })

  // ── Sperrer ──
  const hS = st.hS
  const spProfil = prof(48, Math.round(hS * 1000))
  const spPris = `bjelke-48x${Math.round(hS * 1000)}`
  const cosA = tak.cos
  const sinA = tak.sin
  const ohT = tak.oh - 0.019 // sperreender bak takfotbordet
  /** Sperre i et takplan med takfot mot +Z (sz = 1) eller −Z. Profil (lateral X, v). */
  const sperre = (navn: string, X0: number, sz: number, startKutt: (O: V3, eU: V3, eA: V3, eB: V3) => (p: number, q: number) => number, sluttZ: number, pid: string, merknad: string, endeA: ReturnType<typeof ende>, kniker: number[] = []) => {
    const eU: V3 = [0, -sinA, sz * cosA]
    const eV: V3 = [0, cosA, sz * sinA]
    const O: V3 = [0, tak.Yb(0, 0), 0]
    const s0 = startKutt(O, eU, X3, eV)
    const s1 = plan(O, eU, X3, eV, [0, 0, sz], sluttZ)
    const prof2: V2[] = [[X0 - B / 2, 0], [X0 + B / 2, 0], [X0 + B / 2, hS], [X0 - B / 2, hS]]
    const geom = plasser(prisme(prof2, s0, s1, kniker), basis(eU, X3, eV, O))
    const us = [...prof2, ...kniker.flatMap((k) => [[k, 0], [k, hS]] as V2[])].flatMap(([p, q]) => [s0(p, q), s1(p, q)])
    addS({ navn, profil: spProfil, pris: spPris, lengdeMm: (Math.max(...us) - Math.min(...us)) * 1000, endeA, endeB: ende(tak.a, 'gjaering', 'loddkutt mot takfotbordet'), merknad, part: 'tak', pid, geom: Rplasser(geom), explode: new THREE.Vector3(0, 0.35, 0), kategori: kat.t })
  }
  const posisjoner = (a: number, b: number, faste: number[] = []) => {
    // c/c ≤ 600 mellom a og b, med faste posisjoner inkludert.
    const pts = [...new Set([a, b, ...faste])].sort((p, q) => p - q)
    const ut: number[] = []
    for (let i = 0; i < pts.length - 1; i++) {
      const n = Math.max(1, Math.ceil((pts[i + 1] - pts[i]) / 0.6 - 1e-9))
      for (let k = 0; k < n; k++) ut.push(pts[i] + ((pts[i + 1] - pts[i]) * k) / n)
    }
    ut.push(pts[pts.length - 1])
    // Ingen to sperrer nærmere enn 15 cm (faste posisjoner har forrang).
    const fast = new Set(faste)
    const res: number[] = []
    for (const x of ut) {
      const nær = res.findIndex((y) => Math.abs(y - x) < 0.15)
      if (nær < 0) res.push(x)
      else if (fast.has(x)) res[nær] = x
    }
    return res
  }
  if (tak.type === 'pulttak') {
    posisjoner(-L / 2 + B / 2, L / 2 - B / 2).forEach((X0, i) => {
      sperre(Math.abs(Math.abs(X0) - (L / 2 - B / 2)) < 1e-6 ? 'Gavlsperre' : 'Sperre', X0, 1, (O, eU, eA, eB) => plan(O, eU, eA, eB, [0, 0, 1], -S / 2 - ohT), S / 2 + ohT, `sperre-${i}`, `Loddkutt ${fmtGrader(tak.a)} i begge ender. Ligger på skråhøvlede remmer, sperrebeslag i hver ende.`, ende(tak.a, 'gjaering', 'loddkutt'))
    })
  } else if (tak.type === 'saltak') {
    posisjoner(-L / 2 + B / 2, L / 2 - B / 2).forEach((X0, i) => {
      ;[1, -1].forEach((sz) => {
        sperre(Math.abs(Math.abs(X0) - (L / 2 - B / 2)) < 1e-6 ? 'Gavlsperre' : 'Sperre', X0, sz, (O, eU, eA, eB) => plan(O, eU, eA, eB, [0, 0, sz], 0), S / 2 + ohT, `sperre-${i}-${sz}`, `Loddkutt ${fmtGrader(tak.a)} mot motstående sperre over mønebjelken.`, ende(tak.a, 'gjaering', 'loddkutt i mønet'))
      })
    })
  } else {
    // ── Valm: vanlige sperrer langs mønet, skiftesperrer, gratsperrer ──
    const r = tak.r
    const k2 = (B / 2) * Math.SQRT2
    const lang = posisjoner(-L / 2 + 0.12, L / 2 - 0.12, r > 0 ? [-(r / 2 - B / 2), r / 2 - B / 2] : [0])
    lang.forEach((X0, i) => {
      ;[1, -1].forEach((sz) => {
        const vanlig = r > 0 && Math.abs(X0) <= r / 2 - B / 2 + 1e-6
        if (vanlig) {
          sperre('Sperre', X0, sz, (O, eU, eA, eB) => plan(O, eU, eA, eB, [0, 0, sz], B / 2), S / 2 + ohT, `vsperre-${i}-${sz}`, `Loddkutt ${fmtGrader(tak.a)} mot mønebordet.`, ende(tak.a, 'gjaering', 'loddkutt'))
        } else if (r === 0 && Math.abs(X0) < 1e-6) {
          // Pyramide: midtsperre møter to grater (V-kutt).
          sperre('Kongesperre', X0, sz, (O, eU, eA, eB) => {
            const a1 = plan(O, eU, eA, eB, [1, 0, -sz], -k2)
            const a2 = plan(O, eU, eA, eB, [-1, 0, -sz], -k2)
            return (p, q) => Math.max(a1(p, q), a2(p, q))
          }, S / 2 + ohT, `ksperre-z-${sz}`, 'V-kutt (kinnkutt 45° mot begge gratene).', ende(tak.a, 'gjaering', 'dobbelt kinnkutt 45°'), [0])
        } else {
          const sx = Math.sign(X0)
          sperre('Skiftesperre', X0, sz, (O, eU, eA, eB) => plan(O, eU, eA, eB, [sx, 0, -sz], r / 2 - k2), S / 2 + ohT, `ssperre-${i}-${sz}`, 'Kinnkutt 45° mot gratsperra + loddkutt.', ende(tak.a, 'gjaering', 'kinnkutt 45°'))
        }
      })
    })
    // Valmsider (X = ±L/2): sperrer langs X.
    const ende0 = posisjoner(-S / 2 + 0.12, S / 2 - 0.12, [0])
    ;[1, -1].forEach((sx) => {
      ende0.forEach((Z0, i) => {
        const eU: V3 = [sx * cosA, -sinA, 0]
        const eV: V3 = [sx * sinA, cosA, 0]
        const O: V3 = [sx * (r / 2), tak.H + (S / 2) * tan, 0]
        let s0: (p: number, q: number) => number
        let kn: number[] = []
        let navn = 'Skiftesperre'
        let merk = 'Kinnkutt 45° mot gratsperra + loddkutt.'
        if (Math.abs(Z0) < 1e-6) {
          const a1 = plan(O, eU, Z3, eV, [sx, 0, -1], r / 2 + k2)
          const a2 = plan(O, eU, Z3, eV, [sx, 0, 1], r / 2 + k2)
          s0 = (p, q) => Math.max(a1(p, q), a2(p, q))
          kn = [0]
          navn = 'Kongesperre'
          merk = 'V-kutt (kinnkutt 45° mot begge gratene).'
        } else {
          const sz = Math.sign(Z0)
          s0 = plan(O, eU, Z3, eV, [sx, 0, -sz], r / 2 + k2)
        }
        const s1 = plan(O, eU, Z3, eV, [sx, 0, 0], L / 2 + ohT)
        const prof2: V2[] = [[Z0 - B / 2, 0], [Z0 + B / 2, 0], [Z0 + B / 2, hS], [Z0 - B / 2, hS]]
        const geom = plasser(prisme(prof2, s0, s1, kn), basis(eU, Z3, eV, O))
        const us = [...prof2, ...kn.flatMap((k) => [[k, 0], [k, hS]] as V2[])].flatMap(([p, q]) => [s0(p, q), s1(p, q)])
        addS({ navn, profil: spProfil, pris: spPris, lengdeMm: (Math.max(...us) - Math.min(...us)) * 1000, endeA: ende(tak.a, 'gjaering', navn === 'Kongesperre' ? 'dobbelt kinnkutt 45°' : 'kinnkutt 45°'), endeB: ende(tak.a, 'gjaering', 'loddkutt'), merknad: merk, part: 'tak', pid: `esperre-${sx}-${i}`, geom: Rplasser(geom), explode: new THREE.Vector3(0, 0.35, 0), kategori: kat.t })
      })
    })
    // Gratsperrer fra mønet til hjørnene.
    const beta = Math.atan(tan / Math.SQRT2)
    const cb = Math.cos(beta)
    const sbt = Math.sin(beta)
    const delta = (B / (2 * Math.SQRT2)) * tan
    const hH = cb * (hS / cosA - delta)
    const lager = [0.098, 0.148, 0.198, 0.223].find((h) => h >= hH - 1e-6) ?? 0.223
    ;[1, -1].forEach((sx) => [1, -1].forEach((sz) => {
      const eU: V3 = [(sx * cb) / Math.SQRT2, -sbt, (sz * cb) / Math.SQRT2]
      const eT: V3 = [-sz / Math.SQRT2, 0, sx / Math.SQRT2]
      const eV0: V3 = [(sx * sbt) / Math.SQRT2, cb, (sz * sbt) / Math.SQRT2]
      const O: V3 = [sx * (r / 2), tak.H + (S / 2) * tan, 0]
      const a1 = plan(O, eU, eT, eV0, [sx, 0, 0], r / 2)
      const a2 = plan(O, eU, eT, eV0, [0, 0, sz], 0)
      const s0 = (p: number, q: number) => Math.max(a1(p, q), a2(p, q))
      const b1 = plan(O, eU, eT, eV0, [sx, 0, 0], L / 2 + ohT)
      const b2 = plan(O, eU, eT, eV0, [0, 0, sz], S / 2 + ohT)
      const s1 = (p: number, q: number) => Math.min(b1(p, q), b2(p, q))
      const prof2: V2[] = [[-B / 2, 0], [B / 2, 0], [B / 2, hH], [-B / 2, hH]]
      const geom = plasser(prisme(prof2, s0, s1, [0]), basis(eU, eT, eV0, O))
      const us = [...prof2, [0, 0], [0, hH]].flatMap(([p, q]) => [s0(p, q), s1(p, q)])
      addS({ navn: 'Grat', profil: prof(48, Math.round(lager * 1000)), pris: `bjelke-48x${Math.round(lager * 1000)}`, lengdeMm: (Math.max(...us) - Math.min(...us)) * 1000, endeA: ende((beta * 180) / Math.PI, 'gjaering', 'dobbelt kinnkutt 45° mot møte/nabograt'), endeB: ende((beta * 180) / Math.PI, 'gjaering', 'loddkutt'), merknad: `Gratsperre. Rippes til ${f0(hH * 1000)} mm høyde. Gratvinkel ${fmtGrader((beta * 180) / Math.PI)}, senket ${f0(delta * 1000)} mm.`, part: 'tak', pid: `grat-${sx}-${sz}`, geom: Rplasser(geom), explode: new THREE.Vector3(0, 0.35, 0), kategori: kat.t })
    }))
    // Mønebord mellom de vanlige sperrene.
    if (r > 0) {
      const topp = tak.Yt(0, B / 2)
      const geom = prisme([[topp - st.hRidge, -B / 2], [topp - st.hRidge, B / 2], [topp, B / 2], [topp, -B / 2]], () => -r / 2, () => r / 2)
      addS({ navn: 'Mønebord', profil: prof(48, Math.round(st.hRidge * 1000)), pris: `bjelke-48x${Math.round(st.hRidge * 1000)}`, lengdeMm: r * 1000, endeA: ende(0), endeB: ende(0), part: 'tak', pid: 'monebord', geom: Rplasser(geom), explode: new THREE.Vector3(0, 0.4, 0), kategori: kat.t })
    }
  }
  // ── Saltak: bærende mønebjelke på gavlstolper ──
  if (tak.type === 'saltak' && st.saltak === 'sperrebind') {
    // Takstoler: sperrebind (undergurt) ved siden av hvert sperrepar, liggende på remmene.
    const yb = tak.H + RB * tan
    const yt = yb + 0.098
    const zTak = (y: number) => S / 2 - (y - tak.H - hS / cosA) / tan
    const zEnde = (y: number) => Math.min(S / 2 - 0.002, zTak(y))
    const knekk = zTak(yb) > S / 2 - 0.002 && zTak(yt) < S / 2 - 0.002 ? [tak.H + hS / cosA + (0.002) * tan] : []
    posisjoner(-L / 2 + B / 2, L / 2 - B / 2).forEach((X0, i) => {
      const xa = X0 + B / 2 <= L / 2 - B - 1e-6 ? X0 + B / 2 : X0 - B / 2 - B
      const geom = plasser(prisme([[yb, xa], [yt, xa], [yt, xa + B], [yb, xa + B]], (y) => -zEnde(y), (y) => zEnde(y), knekk), basis(Z3, Y3, X3))
      const lengde = 2 * Math.max(zEnde(yb), zEnde(yt))
      addS({ navn: 'Sperrebind', profil: prof(48, 98), pris: 'stolpe-48x98', lengdeMm: lengde * 1000, endeA: ende(90 - tak.a, 'gjaering', 'skråkappes etter takflaten'), endeB: ende(90 - tak.a, 'gjaering', 'skråkappes etter takflaten'), merknad: 'Undergurt i takstolen: ligger på remmene og skrus til begge sperrene (3 skruer 5×90 i hver ende). Tar skyvkraften fra sperrene.', part: 'tak', pid: `sperrebind-${i}`, geom: Rplasser(geom), darken: 0.85, explode: new THREE.Vector3(0, 0.3, 0), kategori: kat.t })
    })
  }
  if (tak.type === 'saltak' && st.saltak === 'monebjelke') {
    const hR = st.hRidge
    const yb = tak.Yb(0, RB / 2) - hR
    for (let k = 0; k < 2; k++) {
      const z0 = -RB / 2 + k * B
      const z1 = z0 + B
      const geom = prisme([[yb, z0], [yb, z1], [tak.Yb(0, z1), z1], [tak.Yb(0, z0), z0]], () => -L / 2, () => L / 2)
      addS({ navn: 'Mønebjelke', profil: prof(48, Math.round(hR * 1000)), pris: `bjelke-48x${Math.round(hR * 1000)}`, lengdeMm: L * 1000, endeA: ende(0), endeB: ende(0), merknad: `Skråhøvles ${fmtGrader(tak.a)} på oversiden. To planker skrus sammen.`, part: 'tak', pid: `monebjelke-${k}`, geom: Rplasser(geom), darken: 0.85, kategori: kat.t })
    }
    ;[-1, 1].forEach((sx) => {
      const x0 = sx > 0 ? L / 2 - P : -L / 2
      const y0 = remBunnStd + st.hRem
      const geom = plasser(prisme([[-P / 2, x0], [P / 2, x0], [P / 2, x0 + P], [-P / 2, x0 + P]], () => y0, () => yb), basis(Y3, Z3, X3))
      addS({ navn: 'Gavlstolpe', profil: prof(98, 98), pris: 'stolpe-98x98', lengdeMm: (yb - y0) * 1000, endeA: ende(0), endeB: ende(0), merknad: 'Står på gavlremmen og bærer mønebjelken.', part: 'konstruksjon', pid: `gavlstolpe-${sx}`, geom: Rplasser(geom), darken: 0.88, kategori: kat.k })
    })
  }

  // ── Takplate, tekking, takfotbord og vindski ──
  const plate = (navn: string, pts: Array<[number, number]>, y0: (X: number, Z: number) => number, tykk: number, pid: string, mat: THREE.Material) => {
    const geom = plasser(prisme(pts.map(([X, Z]) => [Z, X] as V2), (Z, X) => y0(X, Z), (Z, X) => y0(X, Z) + tykk / cosA), basis(Y3, Z3, X3))
    staver.push({ navn, profil: navn.includes('papp') || navn.includes('Shingel') ? 'tekking' : '18 mm kryssfiner', lengdeMm: 0, part: 'tak', pid, geom: Rplasser(geom), materiale: mat, ikkeKapp: true, explode: new THREE.Vector3(0, 0.6, 0) })
  }
  const oh = tak.oh
  const plater: Array<Array<[number, number]>> =
    tak.type === 'pulttak'
      ? [[[-L / 2 - oh, -S / 2 - oh], [L / 2 + oh, -S / 2 - oh], [L / 2 + oh, S / 2 + oh], [-L / 2 - oh, S / 2 + oh]]]
      : tak.type === 'saltak'
        ? [
            [[-L / 2 - oh, 0], [L / 2 + oh, 0], [L / 2 + oh, S / 2 + oh], [-L / 2 - oh, S / 2 + oh]],
            [[-L / 2 - oh, -S / 2 - oh], [L / 2 + oh, -S / 2 - oh], [L / 2 + oh, 0], [-L / 2 - oh, 0]],
          ]
        : [
            [[-tak.r / 2, 0], [tak.r / 2, 0], [L / 2 + oh, S / 2 + oh], [-L / 2 - oh, S / 2 + oh]],
            [[-L / 2 - oh, -S / 2 - oh], [L / 2 + oh, -S / 2 - oh], [tak.r / 2, 0], [-tak.r / 2, 0]],
            [[tak.r / 2, 0], [L / 2 + oh, -S / 2 - oh], [L / 2 + oh, S / 2 + oh]],
            [[-tak.r / 2, 0], [-L / 2 - oh, S / 2 + oh], [-L / 2 - oh, -S / 2 - oh]],
          ]
  const kryssfiner = new THREE.MeshStandardMaterial({ color: 0xc9a46a, roughness: 0.85 })
  const tekkeMat = new THREE.MeshStandardMaterial({ color: c.tekking === 'shingel' ? 0x3b3633 : 0x262626, roughness: 0.95 })
  plater.forEach((pts, i) => {
    plate('Takplate (18 mm kryssfiner)', pts, (X, Z) => tak.Yt(X, Z), TAKPLATE, `takplate-${i}`, kryssfiner)
    plate(c.tekking === 'shingel' ? 'Shingel (tekking)' : 'Takpapp (tekking)', pts, (X, Z) => tak.Yt(X, Z) + TAKPLATE / cosA, TEKKING_T, `tekking-${i}`, tekkeMat)
  })
  // Takfotbord langs takføttene (gjæret ved valm), vindski langs gavlene.
  const fH = hS >= 0.148 ? 0.148 : 0.098
  const fProfil = prof(19, Math.round(fH * 1000))
  const fPris = fH >= 0.148 ? 'bord-19x148' : 'bord-19x98'
  const takfot = (sz: number) => {
    const Zo = sz * (S / 2 + oh)
    const Zi = sz * (S / 2 + oh - 0.019)
    const topp = Math.min(tak.Yt(0, Zo), tak.Yt(0, Zi))
    const valm = tak.type === 'valmtak'
    const geom = prisme(
      [[topp - fH, Math.min(Zi, Zo)], [topp - fH, Math.max(Zi, Zo)], [topp, Math.max(Zi, Zo)], [topp, Math.min(Zi, Zo)]],
      (_y, Z) => (valm ? -(L / 2 + oh) + (S / 2 + oh - Math.abs(Z)) : -L / 2 - oh),
      (_y, Z) => (valm ? L / 2 + oh - (S / 2 + oh - Math.abs(Z)) : L / 2 + oh),
    )
    addS({ navn: 'Takfotbord', profil: fProfil, pris: fPris, lengdeMm: (L + 2 * oh) * 1000, endeA: ende(valm ? 45 : 0, valm ? 'gjaering' : undefined), endeB: ende(valm ? 45 : 0, valm ? 'gjaering' : undefined), part: 'tak', pid: `takfot-z${sz}`, geom: Rplasser(geom), explode: new THREE.Vector3(0, 0.45, 0), kategori: kat.t })
  }
  if (tak.type === 'pulttak') {
    takfot(1)
    takfot(-1)
  } else {
    takfot(1)
    takfot(-1)
  }
  if (tak.type === 'valmtak') {
    ;[1, -1].forEach((sx) => {
      const Xo = sx * (L / 2 + oh)
      const Xi = sx * (L / 2 + oh - 0.019)
      const topp = Math.min(tak.Yt(Xo, 0), tak.Yt(Xi, 0))
      const geom = plasser(
        prisme([[topp - fH, Math.min(Xi, Xo)], [topp - fH, Math.max(Xi, Xo)], [topp, Math.max(Xi, Xo)], [topp, Math.min(Xi, Xo)]], (_y, X) => -(S / 2 + oh) + (L / 2 + oh - Math.abs(X)), (_y, X) => S / 2 + oh - (L / 2 + oh - Math.abs(X))),
        basis(Z3, Y3, X3),
      )
      addS({ navn: 'Takfotbord', profil: fProfil, pris: fPris, lengdeMm: (S + 2 * oh) * 1000, endeA: ende(45, 'gjaering'), endeB: ende(45, 'gjaering'), part: 'tak', pid: `takfot-x${sx}`, geom: Rplasser(geom), explode: new THREE.Vector3(0, 0.45, 0), kategori: kat.t })
    })
  } else {
    // Vindski under platekanten på gavlene.
    ;[1, -1].forEach((sx) => {
      const X0 = sx * (L / 2 + oh - 0.0095)
      const deler: Array<{ sz: number; fra: number; til: number }> = tak.type === 'pulttak' ? [{ sz: 1, fra: -S / 2 - oh + 0.019, til: S / 2 + oh - 0.019 }] : [{ sz: 1, fra: 0, til: S / 2 + oh - 0.019 }, { sz: -1, fra: 0, til: -(S / 2 + oh - 0.019) }]
      deler.forEach(({ sz, fra, til }, j) => {
        const eU: V3 = [0, -sinA, sz * cosA]
        const eV: V3 = [0, cosA, sz * sinA]
        const O: V3 = [0, tak.Yt(0, 0), 0]
        const s0 = plan(O, eU, X3, eV, [0, 0, sz], sz * fra)
        const s1 = plan(O, eU, X3, eV, [0, 0, sz], sz * til)
        const prof2: V2[] = [[X0 - 0.0095, -fH], [X0 + 0.0095, -fH], [X0 + 0.0095, 0], [X0 - 0.0095, 0]]
        const geom = plasser(prisme(prof2, s0, s1), basis(eU, X3, eV, O))
        const us = prof2.flatMap(([p, q]) => [s0(p, q), s1(p, q)])
        addS({ navn: 'Vindski', profil: fProfil, pris: fPris, lengdeMm: (Math.max(...us) - Math.min(...us)) * 1000, endeA: ende(tak.a, 'gjaering', 'loddkutt'), endeB: ende(tak.a, 'gjaering', 'loddkutt'), part: 'tak', pid: `vindski-${sx}-${j}`, geom: Rplasser(geom), explode: new THREE.Vector3(sx * 0.2, 0.45, 0), kategori: kat.t })
      })
    })
  }

  // ── Kneband 45° i de åpne frontfagene ──
  const frontRemBunn = g.front.remBunn
  const apning = g.midt ? g.w / 2 - P - P / 2 : g.w - 2 * P
  const kbL = Math.min(0.4, apning / 2 - 0.03)
  const kbPar: Array<[number, number]> = [] // [x ved stolpeflate, retning]
  g.stolper.filter((p) => p.z > 0).forEach((p) => {
    if (p.x < -0.01) kbPar.push([p.x + P / 2, 1])
    else if (p.x > 0.01) kbPar.push([p.x - P / 2, -1])
    else {
      kbPar.push([p.x + P / 2, 1])
      kbPar.push([p.x - P / 2, -1])
    }
  })
  if (kbL >= 0.15) kbPar.forEach(([x0, dir], i) => {
    const s2 = Math.SQRT1_2
    const eU: V3 = [dir * s2, s2, 0]
    const eV: V3 = [-dir * s2, s2, 0]
    const O: V3 = [x0, frontRemBunn - kbL, 0]
    const zA = d / 2 - 0.074
    const zB = d / 2 - 0.026
    const s0 = plan(O, eU, eV, Z3, [dir, 0, 0], dir * x0)
    const s1 = plan(O, eU, eV, Z3, [0, 1, 0], frontRemBunn)
    const prof2: V2[] = [[0, zA], [0.098, zA], [0.098, zB], [0, zB]]
    const geom = plasser(prisme(prof2, s0, s1), basis(eU, eV, Z3, O))
    const us = prof2.flatMap(([p, q]) => [s0(p, q), s1(p, q)])
    addS({ navn: 'Kneband', profil: prof(48, 98), pris: 'stolpe-48x98', lengdeMm: (Math.max(...us) - Math.min(...us)) * 1000, endeA: ende(45, 'gjaering'), endeB: ende(45, 'gjaering'), merknad: 'Avstiver den åpne fronten. 2 skruer 5×90 i hver ende.', part: 'konstruksjon', pid: `kneband-${i}`, geom, darken: 0.85, kategori: kat.k })
  })

  // ── Kledning (stående) ──
  /** Takets underkant over et punkt i veggflukten (kledningen kappes hit). */
  const lokal = (xw: number, zw: number): [number, number] => {
    // Invers av tilV: finn (X, Z) slik at tilV([X,0,Z]) = (xw,0,zw).
    const ex = V([1, 0, 0])
    const ez = V([0, 0, 1])
    return [ex[0] * xw + ex[2] * zw, ez[0] * xw + ez[2] * zw]
  }
  const erGavl = (xw: number, zw: number) => {
    if (tak.type === 'valmtak') return false
    const [X] = lokal(xw, zw)
    return Math.abs(Math.abs(X) - L / 2) < 0.2
  }
  const takTopp1 = (xw: number, zw: number, gavl: boolean) => {
    const [X, Z] = lokal(xw, zw)
    return (gavl ? tak.Yt(X, Z) : tak.Yb(X, Z)) - 0.002
  }
  // Laveste av inner- og ytterflaten (kledningen må gå klar av sperrene).
  const takTopp = (xw: number, zw: number, gavl: boolean) => {
    const innX = Math.abs(xw) > w / 2 ? Math.sign(xw) * (w / 2) : xw
    const innZ = Math.abs(zw) > d / 2 ? Math.sign(zw) * (d / 2) : zw
    return Math.min(takTopp1(xw, zw, gavl), takTopp1(innX, innZ, gavl))
  }
  const yK0 = BUNN_Y0
  /** Stående kledning langs en vegg: s ∈ [fra, til] langs veggen, tykkelse [n0, n1]. */
  const vegg = (navn: string, akse: 'x' | 'z', n0: number, n1: number, fra: number, til: number, bunn: (s: number) => number, topp: (s: number) => number, kniker: number[], tag: string, part = 'kledning') => {
    const len = til - fra
    if (len < ks.w * 0.6) return
    const n = Math.max(1, Math.round((len + ks.gap) / (ks.w + ks.gap)))
    const bw = (len - (n - 1) * ks.gap) / n
    for (let i = 0; i < n; i++) {
      const s0 = fra + i * (bw + ks.gap)
      const s1 = s0 + bw
      const yb = Math.max(bunn(s0), bunn(s1))
      if (Math.min(topp(s0), topp(s1)) - yb < Math.max(0.12, bw + 0.01)) continue
      const kn = kniker.filter((k) => k > s0 + 1e-6 && k < s1 - 1e-6)
      const prof2: V2[] = [[s0, n0], [s1, n0], [s1, n1], [s0, n1]]
      const geom = plasser(prisme(prof2, () => yb, (sv) => topp(sv), kn), akse === 'x' ? basis(Y3, X3, Z3) : basis(Y3, Z3, X3))
      const lengde = Math.max(topp(s0), topp(s1), ...kn.map(topp)) - yb
      const skra = Math.abs(topp(s0) - topp(s1)) > 0.001 || kn.length > 0
      const vinkel = skra ? tak.a : 0
      addS({ navn, profil: ks.profil, pris: ks.pris, kvalitet: 'Impregnert/grunnet', lengdeMm: lengde * 1000, endeA: ende(0), endeB: ende(vinkel, vinkel ? 'gjaering' : undefined, kn.length ? 'to skråkapp – toppen møtes i mønet' : vinkel ? 'skråkappes etter takfallet' : undefined), part, pid: `${tag}-${i}`, geom, darken: 0.95, kategori: kat.kl })
    }
  }
  const kt = ks.t
  // Bakvegg (dekker endeveden på sidekledningen).
  const bakGavl = erGavl(0, -d / 2 - kt)
  vegg('Kledning', 'x', -d / 2 - kt, -d / 2, -(w / 2 + kt), w / 2 + kt, () => yK0, (sv) => takTopp(sv, -d / 2 - kt, bakGavl), bakGavl && tak.type === 'saltak' ? [0] : [], 'kled-bak')
  // Sidevegger.
  ;[-1, 1].forEach((sx) => {
    const xo = sx * (w / 2)
    const gavl = erGavl(xo + sx * kt, 0)
    vegg('Kledning', 'z', sx > 0 ? xo : xo - kt, sx > 0 ? xo + kt : xo, -d / 2, d / 2, () => yK0, (sv) => takTopp(xo + sx * kt, sv, gavl), gavl && tak.type === 'saltak' ? [0] : [], `kled-${sx > 0 ? 'h' : 'v'}`)
  })
  // Front: hjørner i full høyde + topp over åpningen.
  const frontGavl = erGavl(0, d / 2 + kt)
  const fTopp = (sv: number) => takTopp(sv, d / 2 + kt, frontGavl)
  ;[-1, 1].forEach((sx) => {
    const a = sx < 0 ? -(w / 2 + kt) : w / 2 - P
    const b = sx < 0 ? -(w / 2 - P) : w / 2 + kt
    vegg('Kledning', 'x', d / 2, d / 2 + kt, a, b, () => yK0, fTopp, [], `kled-f${sx}`)
  })
  vegg('Kledning', 'x', d / 2, d / 2 + kt, -(w / 2 - P), w / 2 - P, () => frontRemBunn, fTopp, frontGavl && tak.type === 'saltak' ? [0] : [], 'kled-ftopp')
  if (g.midt) vegg('Kledning', 'x', d / 2, d / 2 + kt, -P / 2, P / 2, () => yK0, () => frontRemBunn, [], 'kled-fmidt')
  // Innervegg bak (montasjeflate for postkassene).
  const yInn0 = g.hylle > 0 ? g.hylle : by1 + 0.028
  segX.forEach(([a, b], si) => vegg('Kledning, innervegg', 'x', -d / 2 + B, -d / 2 + B + kt, a, b, () => yInn0, () => g.bak.remBunn - 0.002, [], `innervegg-${si}`))

  // ── Gulv, bunnskap og hylle ──
  if (g.hylle > 0) {
    const gulvY = by1
    const tB = 0.028
    // Gulvbord langs z (fra bak til front) mellom stolpene.
    segX.forEach(([a, b], si) => {
      const n = Math.max(1, Math.ceil((b - a + 0.006) / 0.126 - 1e-9))
      const bw = (b - a - (n - 1) * 0.006) / n
      for (let i = 0; i < n; i++) {
        const x0 = a + i * (bw + 0.006)
        addS({ navn: bw < 0.1195 ? 'Gulvbord (kløyvd)' : 'Gulvbord', profil: prof(28, 120), pris: 'terrassebord-28x120', lengdeMm: d * 1000, endeA: ende(0), endeB: ende(0), merknad: bw < 0.1195 ? `Kløyves til ${f0(bw * 1000)} mm.` : undefined, part: 'gulv', pid: `gulv-${si}-${i}`, geom: plasser(prisme([[gulvY, x0], [gulvY + tB, x0], [gulvY + tB, x0 + bw], [gulvY, x0 + bw]], () => -d / 2, () => d / 2), basis(Z3, Y3, X3)), kategori: 'dekke' })
      }
    })
    const yG = gulvY + tB
    const hyllUnder = g.hylle - tB
    const zBak = -d / 2 + B
    const zFr = d / 2 - 0.02
    // Rom: én skillevegg per postkasse (min. 35 cm), stående bord 28×120.
    const rom = Math.max(1, Math.min(g.kasser.length || 1, Math.floor((w - 2 * P) / 0.35)))
    const skille: number[] = []
    for (let i = 0; i <= rom; i++) skille.push(-(w / 2 - P) + B / 2 + 0.003 + ((w - 2 * P - B - 0.006) * i) / rom)
    skille.forEach((xc, i) => {
      if (g.midt && Math.abs(xc) < P / 2 + 0.03) return
      const nB = Math.max(1, Math.ceil((zFr - zBak + 0.004) / 0.124 - 1e-9))
      const bw = (zFr - zBak - (nB - 1) * 0.004) / nB
      for (let j = 0; j < nB; j++) {
        const z0 = zBak + j * (bw + 0.004)
        addS({ navn: 'Skillevegg (bunnskap)', profil: prof(28, 120), pris: 'terrassebord-28x120', lengdeMm: (hyllUnder - yG) * 1000, endeA: ende(0), endeB: ende(0), merknad: 'Stående bord, skrus til gulvet og hylla.', part: 'kledning', pid: `skille-${i}-${j}`, geom: plasser(prisme([[z0, xc - 0.014], [z0 + bw, xc - 0.014], [z0 + bw, xc + 0.014], [z0, xc + 0.014]], () => yG, () => hyllUnder), basis(Y3, Z3, X3)), darken: 0.92, kategori: 'kledning' })
      }
    })
    // Hylle (pakkehylle) – bord langs x.
    const nH = Math.max(1, Math.ceil((zFr - zBak + 0.006) / 0.126 - 1e-9))
    const hw = (zFr - zBak - (nH - 1) * 0.006) / nH
    segX.forEach(([xa, xb], si) => {
      for (let j = 0; j < nH; j++) {
        const z0 = zBak + j * (hw + 0.006)
        // Ved midtstolper: bordene ytterst kappes rundt stolpen.
        const aa = g.midt && si === 1 && (z0 < -d / 2 + P || z0 + hw > d / 2 - P) ? xa : xa
        addS({ navn: hw < 0.1195 ? 'Hyllebord (kløyvd)' : 'Hyllebord', profil: prof(28, 120), pris: 'terrassebord-28x120', lengdeMm: (xb - aa) * 1000, endeA: ende(0), endeB: ende(0), merknad: hw < 0.1195 ? `Kløyves til ${f0(hw * 1000)} mm.` : undefined, part: 'gulv', pid: `hylle-${si}-${j}`, geom: prisme([[hyllUnder, z0], [g.hylle, z0], [g.hylle, z0 + hw], [hyllUnder, z0 + hw]], () => aa, () => xb), kategori: 'dekke' })
      }
    })
  }
  return { staver, g }
}

/** Postkasser (grønn klassisk modell, medfølger) + fundament (betong/stål). */
function byggUtstyr(group: THREE.Group, c: PostkassestativConfig, g: Geo) {
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, pid: string, navn: string, part: string, rot?: [number, number, number], sc?: [number, number, number]) => {
    const mesh = new THREE.Mesh(geo, m)
    mesh.position.set(x, y, z)
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2])
    if (sc) mesh.scale.set(sc[0], sc[1], sc[2])
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.userData.part = part
    mesh.userData.pid = pid
    mesh.userData.info = { navn, profil: '', lengdeCm: 0 }
    group.add(mesh)
  }
  const betong = new THREE.MeshStandardMaterial({ color: 0x9a9a94, roughness: 0.96 })
  const stal = new THREE.MeshStandardMaterial({ color: 0x8c9196, roughness: 0.45, metalness: 0.7 })
  g.stolper.forEach((p, i) => {
    if (c.fundament === 'jordskrue') add(new THREE.CylinderGeometry(0.045, 0.045, BETONG_Y, 20), stal, p.x, BETONG_Y / 2, p.z, `jordskrue-${i}`, 'Jordskrue (skruefundament)', 'fundament')
    else add(new THREE.CylinderGeometry(0.1, 0.1, BETONG_Y, 28), betong, p.x, BETONG_Y / 2, p.z, `pilarror-${i}`, 'Fundament (pilarrør Ø200, støpt)', 'fundament')
    add(new THREE.BoxGeometry(0.14, 0.006, 0.14), stal, p.x, BETONG_Y + 0.003, p.z, `sko-${i}`, 'Stolpesko (justerbar)', 'fundament')
    add(new THREE.BoxGeometry(0.04, STOLPE_Y0 - BETONG_Y - 0.006, 0.04), stal, p.x, (BETONG_Y + 0.006 + STOLPE_Y0) / 2, p.z, `skostag-${i}`, 'Stolpesko (justerbar)', 'fundament')
  })
  const gronn = new THREE.MeshStandardMaterial({ color: 0x3a7043, roughness: 0.45, metalness: 0.2 })
  const gronnM = new THREE.MeshStandardMaterial({ color: 0x2c5834, roughness: 0.45, metalness: 0.2 })
  const sort = new THREE.MeshStandardMaterial({ color: 0x121212, roughness: 0.5 })
  const flate = -g.d / 2 + B + g.ks.t
  const bd = g.kasseD
  g.kasser.forEach((k, j) => {
    const { b: bw, h: bh } = KASSE
    const cz = flate + bd / 2
    const front = flate + bd
    add(new THREE.BoxGeometry(bw, bh, bd), gronn, k.x, k.yb + bh / 2, cz, `postkasse-${j}`, 'Postkasse', 'postkasse')
    add(new THREE.CylinderGeometry(bd / 2, bd / 2, bw + 0.01, 20), gronn, k.x, k.yb + bh, cz + 0.04 * bd + 0.002, `postkasse-${j}-topp`, 'Postkasse (topp)', 'postkasse', [0, 0, Math.PI / 2], [0.5, 1, 1.08])
    add(new THREE.BoxGeometry(bw * 0.66, bh * 0.09, 0.01), gronnM, k.x, k.yb + KASSE.innkast, front + 0.005, `postkasse-${j}-innkast`, 'Postkasse (innkast)', 'postkasse')
    add(new THREE.BoxGeometry(bw * 0.52, 0.016, 0.012), sort, k.x, k.yb + KASSE.innkast, front + 0.011, `postkasse-${j}-sprekk`, 'Postkasse (brevsprekk)', 'postkasse')
    add(new THREE.BoxGeometry(bw * 0.86, bh * 0.58, 0.008), gronn, k.x, k.yb + bh * 0.33, front + 0.004, `postkasse-${j}-luke`, 'Postkasse (luke)', 'postkasse')
    add(new THREE.BoxGeometry(bw * 0.66, bh * 0.44, 0.006), gronnM, k.x, k.yb + bh * 0.33, front + 0.011, `postkasse-${j}-lukepanel`, 'Postkasse (lukepanel)', 'postkasse')
    ;[Math.PI / 4, -Math.PI / 4].forEach((a, q) => add(new THREE.BoxGeometry(0.075, 0.016, 0.016), sort, k.x, k.yb + bh * 0.66, front + 0.018, `postkasse-${j}-vrider-${q}`, 'Postkasse (vrider)', 'postkasse', [0, 0, a]))
  })
}

function lagGruppe(c: PostkassestativConfig, mat: (pid: string, d?: number) => THREE.Material) {
  const group = new THREE.Group()
  const { staver, g } = konstruer(c)
  byggMesher(group, staver, mat)
  byggUtstyr(group, c, g)
  return { group, staver, g }
}

function buildMesh(c: PostkassestativConfig, opts?: BuildOptions): THREE.Group {
  return lagGruppe(c, lagMatFabrikk(c.treslag, c.farge, opts, 0.8)).group
}

function kappliste(c: PostkassestativConfig): KapplisteDelPlan[] {
  return samleKappliste(konstruer(c).staver)
}

// ── Fundament og vind ────────────────────────────────────────────────

function fundamentering(c: PostkassestativConfig, g: Geo, staver: Stav[]) {
  // Samme nøkler/semantikk som byggested.ts (c.grunn / c.frostsone) – egne knapper her fordi Byggested er skjult.
  const grunn = ((Object.keys(GRUNN) as Grunn[]).includes(c.grunn as Grunn) ? c.grunn : 'grus-sand') as Grunn
  const sone = ((Object.keys(FROSTSONER) as Frostsone[]).includes(c.frostsone as Frostsone) ? c.frostsone : 'lavland') as Frostsone
  const frost = frostdybde({ sone, grunn })
  const dybde = Math.max(grunn === 'fjell' ? 0.3 : 0.6, frost.anbefaltDybdeM)
  const toppY = Math.max(g.tak.Yt(0, 0), g.tak.Yt(0, -g.tak.S / 2)) + 0.03
  const vind = vindlast(VB0_STANDARD, 2, Math.max(2, toppY))
  // Egenvekt fra kapplista (5 kN/m³) + tak (kryssfiner/papp) + postkasser.
  let G = 0
  for (const s of staver) {
    const m = s.profil.match(/(\d+)\s*×\s*(\d+)/)
    if (m && s.pris) G += (s.lengdeMm / 1000) * (Number(m[1]) / 1000) * (Number(m[2]) / 1000) * 5
  }
  const takA = (g.tak.L + 2 * g.tak.oh) * (g.tak.S + 2 * g.tak.oh)
  G += takA * 0.17 + g.kasser.length * 0.05
  const nSt = g.stolper.length
  // Vind på bakveggen (bredeste flate) – velter om fremre fundamentrekke.
  const Fb = vindHorisontal(vind.qp, g.w * toppY)
  const arm = g.d - P
  const nBak = nSt / 2
  const loftBak = ((Fb * toppY) / 2 / arm) / nBak
  // Vind på siden – velter om motsatt side.
  const Fs = vindHorisontal(vind.qp, g.d * toppY)
  const loftSide = ((Fs * toppY) / 2 / (g.w - P)) / Math.max(2, nSt / 2)
  // Oppløft på taket (åpen front → cp,net 1,2 konservativt).
  const takLoft = vindOppdrift(vind.qp, takA, 0, 1.2) / nSt
  const oppdrift = Math.max(loftBak, loftSide) + takLoft - (0.9 * G) / nSt
  const sk = g.st.sk.sk
  const fund = dimensjonerPunktfundament({
    NGk: G / nSt,
    NQk: [{ type: 'sno', Nk: (snolastTak(sk, g.tak.a).s * takA) / nSt }],
    grunn,
    dybdeM: dybde,
    oppdriftKN: Math.max(0, oppdrift),
  })
  return { frost, dybde, vind, G, oppdrift, fund, Fb }
}

function beregn(c: PostkassestativConfig): Bom {
  const faktor = TRESLAG[c.treslag]?.prisFaktor ?? 1
  const { staver, g } = konstruer(c)
  const lm = lmPerPris(staver)
  const linjer: BomLine[] = [...lm.entries()].map(([id, l]) => lmLinje(PRISER[id]?.navn ?? id, l, SVINN, { spesifikasjon: 'impregnert' }))
  let woodKr = 0
  lm.forEach((l, id) => (woodKr += l * prisFor(id) * faktor))
  const plater = staver.filter((s) => s.pid.startsWith('takplate'))
  const takA = plater.reduce((sum, s) => {
    s.geom.computeBoundingBox()
    return sum
  }, 0) || (g.tak.L + 2 * g.tak.oh) * (g.tak.S + 2 * g.tak.oh) / g.tak.cos
  const f = fundamentering(c, g, staver)
  const nSt = g.stolper.length
  const deler = staver.filter((s) => !s.ikkeKapp).length
  const skruer = Math.ceil((deler * 4 + 60) / 50) * 50
  linjer.push({ navn: 'Takplate 18 mm kryssfiner (utendørs)', antall: Math.round(takA * SVINN * 10) / 10, enhet: 'm²', kommentar: 'inkl. svinn' })
  linjer.push({ navn: c.tekking === 'shingel' ? 'Asfaltshingel + underlagsbelegg' : 'Takpapp (2-lags/underlag + topp)', antall: Math.round(takA * 1.15 * 10) / 10, enhet: 'm²', kommentar: 'inkl. omlegg' })
  linjer.push({ navn: c.fundament === 'jordskrue' ? 'Jordskrue for 98×98 stolpe' : 'Pilarrør Ø200 + betong', spesifikasjon: c.fundament === 'jordskrue' ? `min. ${f0(f.dybde * 100)} cm lang` : `${f0(f.dybde * 100)} cm dypt, ca. ${f0(Math.PI * 0.1 * 0.1 * (f.dybde + 0.05) * 1000)} l betong pr. stk`, antall: nSt, enhet: 'stk' })
  linjer.push({ navn: PRISER['stolpesko'].navn, spesifikasjon: 'for 98×98, varmforsinket', antall: nSt, enhet: 'stk' })
  linjer.push({ navn: PRISER['vinkelbeslag'].navn, spesifikasjon: 'sperrebeslag i hver sperreende', antall: deler > 0 ? staver.filter((s) => /sperre/i.test(s.navn)).length * 2 : 0, enhet: 'stk' })
  linjer.push({ navn: 'Skruer', spesifikasjon: 'rustfri A4, 4,5×50 (kledning) og 5,0×90 (ramme)', antall: skruer, enhet: 'stk' })
  if (g.kasser.length) linjer.push({ navn: 'Postkasse', spesifikasjon: 'Posten-godkjent, med navneskilt ≥ 55×90 mm', antall: g.kasser.length, enhet: 'stk' })
  const estimatKr = Math.round((woodKr * SVINN + takA * SVINN * prisFor('kryssfiner-18') + takA * 1.15 * prisFor(c.tekking === 'shingel' ? 'taktekke-shingel' : 'taktekke-takpapp') * 0.6 + nSt * (prisFor('stolpesko') + (c.fundament === 'jordskrue' ? 450 : 250)) + skruer * prisFor('skrue') + g.kasser.length * prisFor('postkasse')) / 10) * 10
  const takNavn = c.taktype === 'saltak' ? `saltak (møne langs ${c.moneretning === 'dybde' ? 'dybden' : 'bredden'})` : c.taktype === 'valmtak' ? 'valmtak' : 'pulttak'
  return {
    linjer,
    estimatKr,
    sammendrag: `${c.bredde} × ${c.dybde} cm · ${g.kasser.length} postkasser · ${takNavn} ${fmt(g.tak.a, 1)}° · ${TRESLAG[c.treslag]?.label ?? c.treslag}`,
    arealM2: (c.bredde * c.dybde) / 10000,
    maal: `${c.bredde} × ${c.dybde} × ${f0(Math.max(g.tak.Yt(0, 0), g.tak.Yt(0, -g.tak.S / 2)) * 100 + 2)} cm`,
    arbeidstimer: Math.round((10 + deler * 0.06) * 2) / 2,
  }
}

function beregningsgrunnlag(c: PostkassestativConfig): Beregningsgrunnlag {
  const { staver, g } = konstruer(c)
  const f = fundamentering(c, g, staver)
  const st = g.st
  const deler: Record<string, Medlemskontroll> = { Sperre: st.sperre, 'Rem (takfot)': st.rem, Stolpe: st.stolpe }
  if (st.ridge) deler.Mønebjelke = st.ridge
  return tilPlanVedlegg(
    lagBeregningsrapport({
      produkt: 'postkassestativ',
      tittel: 'Postkassestativ – tak, stolper og fundament',
      snolast: { mark: st.sk, tak: snolastTak(st.sk.sk, g.tak.a) },
      vind: f.vind,
      forutsetninger: [
        { navn: 'Takvinkel', verdi: fmt(g.tak.a, 1), enhet: '°' },
        { navn: 'Egenvekt stativ (inkl. tak og postkasser)', verdi: fmt(f.G, 2), enhet: 'kN' },
        { navn: 'Grunn', verdi: GRUNN[((Object.keys(GRUNN) as Grunn[]).includes(c.grunn as Grunn) ? c.grunn : 'grus-sand') as Grunn].navn, kilde: 'Valgt av kunden – kontroller på tomta', usikker: true },
        { navn: 'Fundamentdybde', verdi: fmt(f.dybde, 1), enhet: 'm', kilde: 'Frostberegning (Byggforsk 451.021/521.111)' },
      ],
      laster: [{ navn: 'Vindkraft mot bakveggen (bruddgrense)', symbol: 'F_w', verdi: f.Fb, enhet: 'kN', uttrykk: `1,5·1,3·qp·A, A = ${fmt(g.w, 2)} × ${fmt(Math.max(g.tak.Yt(0, 0), g.tak.Yt(0, -g.tak.S / 2)), 2)} m²` }],
      deler,
      frost: f.frost,
      fundament: f.fund,
      byggesak: vurderByggesak({ tiltak: 'smatiltak', byaM2: (g.w + 2 * g.tak.oh) * (g.d + 2 * g.tak.oh) }),
      merknader: [
        `Velting/oppløft: største strekk per fundament ca. ${fmt(Math.max(0, f.oppdrift), 2)} kN (bruddgrense, etter fratrukket 0,9·egenvekt). ${f.oppdrift > 0 ? 'Stolpeskoen må forankres i betongen (innstøpt) eller jordskruen ha minst denne strekkapasiteten.' : 'Egenvekten holder stativet nede, men fest likevel stolpeskoene skikkelig.'}`,
        'Kneband i de åpne frontfagene og kledning spikret/skrudd til alle losholter avstiver stativet mot vind.',
        g.tak.type === 'valmtak' ? 'Valmtak: remmene danner en lukket ring – skru hjørnene sammen med vinkelbeslag så ringen tar skyvkraften fra sperrene.' : g.tak.type === 'saltak' ? (st.saltak === 'sperrebind' ? 'Saltak: sperreparene er bundet sammen med sperrebind (takstoler), så skyvkraften tas i takstolen og ikke av remmene.' : 'Saltak: mønebjelken er bærende og står på gavlstolper, så sperrene gir ingen skyvkraft på remmene.') : 'Pulttak: sperrene ligger fritt opplagt på to skråhøvlede remmer.',
      ],
      ekstraAdvarsler: [...st.melding, ...g.meldinger],
    }),
  )
}

function byggeregler(c: PostkassestativConfig): Byggeregler {
  const g = geo(c)
  const ok = (b: boolean) => (b ? '✓' : '✗')
  const p: string[] = []
  p.push(`${ok(g.innkastLav >= POSTEN.minInnkast - 1e-6)} Laveste innkast ${f0(g.innkastLav * 100)} cm over bakken (Posten: minst 90 cm).`)
  p.push(`${ok(g.innkastHoy <= POSTEN.maksInnkast + 1e-6)} Høyeste innkast ${f0(g.innkastHoy * 100)} cm (Posten: høyst 175 cm fra ståstedet).`)
  p.push(`${g.kasser.length} postkasser i ${g.rader} ${g.rader > 1 ? 'rader' : 'rad'}. Sett dem i nummerordning med laveste nummer først, og merk med navn (skilt min. 55 × 90 mm) på forsiden – ikke på lokket.`)
  p.push('Plasser stativet ved innkjørselen (inntil 100 m unna i tettbygd strøk, 250 m i spredtbygd) slik at det nås fra utsiden av eiendommen uten trafikkfare.')
  p.push('Stativet må ikke hindre sikten i avkjørselen. Langs offentlig vei kan vegeier kreve avstand eller tillatelse (veglova) – avklar med kommunen/Statens vegvesen, særlig nærmere enn 3 m fra vegkanten. Sett det utenfor brøytekanten.')
  p.push('Du er selv ansvarlig for brøyting, strøing og fri tilgang til postkassene hele året.')
  p.push('Vil du flytte en eksisterende postkasse, må du søke Posten.')
  p.push(...g.meldinger)
  const bs = vurderByggesak({ tiltak: 'smatiltak', byaM2: (g.w + 2 * g.tak.oh) * (g.d + 2 * g.tak.oh) })
  return { sokfri: bs.sokfri, tittel: g.innkastHoy <= POSTEN.maksInnkast && g.innkastLav >= POSTEN.minInnkast ? 'Ikke søknadspliktig – oppfyller Postens krav' : 'Sjekk Postens høydekrav', punkter: [...p, ...bs.punkter, bs.sjekkMedKommunen] }
}

function monteringPlan(c: PostkassestativConfig): MonteringSteg[] {
  const { staver, g } = konstruer(c)
  const f = fundamentering(c, g, staver)
  const st = g.st
  const steg: MonteringSteg[] = [
    { tittel: 'Sett ut og fundamenter', trinn: 'fundament', tekst: `Sett ut ${g.stolper.length} stolpepunkter (c/c ${f0((g.w - P) * 100)} × ${f0((g.d - P) * 100)} cm${g.midt ? ', midtstolper foran og bak' : ''}) og kontroller diagonalene. ${c.fundament === 'jordskrue' ? `Skru ned jordskruer, min. ${f0(f.dybde * 100)} cm,` : `Grav til ${f0(f.dybde * 100)} cm, sett pilarrør Ø200 på 10 cm pukk og støp`} med stolpesko i samme høyde, 5 cm over terreng.`, verktoy: ['Snor og vater', 'Spade/jordbor'], tidTimer: 3, advarsel: 'Sjekk for kabler og rør i bakken før du graver.' },
    { tittel: 'Reis stolpene', trinn: 'reisverk', tekst: `Kapp stolpene (98×98) etter kapplista, sett dem i stolpeskoene og stag dem i lodd. Skru bunnrammen (2 × 48×98) mellom stolpene 10 cm over bakken.`, tidTimer: 1.5 },
    { tittel: 'Rem og losholter', trinn: 'reisverk', tekst: `Skråhøvle remmene ${fmtGrader(g.tak.a)} der sperrene skal ligge${g.tak.type === 'valmtak' ? ', gjær dem 45° i hjørnene' : ''}, og legg dem på stolpene (2 × 48×${f0(st.hRem * 1000)}). Skru losholter c/c ≤ 60 cm bak og på sidene, og kneband 45° i frontfagene.`, tidTimer: 2 },
    { tittel: 'Takkonstruksjon', trinn: 'tak', tekst: g.tak.type === 'saltak' ? st.saltak === 'sperrebind' ? `Sett sperreparene (48×${f0(st.hS * 1000)}) c/c ≤ 60 cm med loddkutt ${fmtGrader(g.tak.a)} i mønet (spikerplate/kryssfinerlask), og skru et sperrebind (48×98) på remmene ved hvert par – det gjør hvert par til en takstol uten skyvkraft på remmene.` : `Reis gavlstolpene og legg mønebjelken (2 × 48×${f0(st.hRidge * 1000)}). Sett sperrene (48×${f0(st.hS * 1000)}) c/c ≤ 60 cm med loddkutt ${fmtGrader(g.tak.a)} i mønet.` : g.tak.type === 'valmtak' ? `Sett mønebord og vanlige sperrer, deretter gratsperrene (${fmtGrader((Math.atan(g.tak.tan / Math.SQRT2) * 180) / Math.PI)}, kinnkutt 45°) og skiftesperrene med kinnkutt 45° mot grata.` : `Legg sperrene (48×${f0(st.hS * 1000)}) c/c ≤ 60 cm på de skråhøvlede remmene, loddkutt ${fmtGrader(g.tak.a)} i begge ender.`, tidTimer: 3 },
    { tittel: 'Tekking', trinn: 'tak', tekst: `Monter takfotbord${g.tak.type === 'valmtak' ? ' (gjæret 45°)' : ' og vindskier'}, skru 18 mm kryssfiner (c/c 150 i kantene) og tekk med ${c.tekking === 'shingel' ? 'underlagsbelegg og shingel' : 'takpapp med 10 cm omlegg'}.`, tidTimer: 2.5 },
    { tittel: 'Kledning', trinn: 'kledning', tekst: `Kle bakveggen, sidene og fronten rundt åpningen med stående ${g.ks.profil} (${f0(g.ks.gap * 1000)} mm luft), og innerveggen bak der postkassene skal henge.${g.tak.type !== 'valmtak' ? ' Gavlbordene skråkappes etter takfallet.' : ''}`, tidTimer: 3 },
  ]
  if (g.hylle > 0) steg.push({ tittel: 'Bunnskap og hylle', trinn: 'kledning', tekst: `Legg gulvbord på bunnrammen, sett skilleveggene og legg pakkehylla med overkant ${f0(g.hylle * 100)} cm over bakken.`, tidTimer: 2 })
  steg.push({ tittel: 'Postkasser', trinn: 'ferdig', tekst: `Heng opp ${g.kasser.length} postkasser på innerveggen med laveste innkast ${f0(g.innkastLav * 100)} cm${g.rader > 1 ? ` og øverste ${f0(g.innkastHoy * 100)} cm` : ''} over bakken. Skru gjennom innerveggen inn i losholtene. Nummerer i stigende rekkefølge.`, tidTimer: 1 })
  return steg
}

// ── 2D-tegning ───────────────────────────────────────────────────────

function tegning2D(c: PostkassestativConfig): Tegning2D {
  const { group, g } = lagGruppe(c, () => new THREE.MeshBasicMaterial())
  const bb = new THREE.Box3().setFromObject(group)
  const cmv = (m: number) => Math.round(m * 1000) / 10
  const topp = bb.max.y
  const Ht = cmv(topp)
  const yv = (m: number) => Ht - cmv(m)
  const W = cmv(bb.max.x - bb.min.x)
  const D = cmv(bb.max.z - bb.min.z)
  const xv = (m: number) => cmv(m - bb.min.x)
  const zv = (m: number) => cmv(m - bb.min.z)
  const f = fundamentering(c, g, konstruer(c).staver)
  const dyp = cmv(f.dybde)
  const stolper = g.stolper
  // Forfra
  const former: Tegning2D['riss'][number]['former'] = []
  stolper.filter((p) => p.z > 0).forEach((p) => {
    former.push({ type: 'rect', x: xv(p.x - P / 2), y: yv(p.topp), w: cmv(P), h: cmv(p.topp - STOLPE_Y0) })
    former.push({ type: 'rect', x: xv(p.x - 0.1), y: Ht - cmv(BETONG_Y), w: 20, h: dyp + cmv(BETONG_Y), dashed: true })
  })
  former.push({ type: 'rect', x: xv(-g.w / 2), y: yv(g.front.remBunn + g.st.hRem), w: cmv(g.w), h: cmv(g.st.hRem) })
  g.kasser.forEach((k) => former.push({ type: 'rect', x: xv(k.x - KASSE.b / 2), y: yv(k.yb + KASSE.h), w: cmv(KASSE.b), h: cmv(KASSE.h), dashed: true }))
  if (g.hylle > 0) former.push({ type: 'rect', x: xv(-g.w / 2 + P), y: yv(g.hylle), w: cmv(g.w - 2 * P), h: 2.8 })
  // Takets omriss sett forfra.
  former.push({ type: 'rect', x: 0, y: 0, w: W, h: cmv(topp - Math.min(g.tak.Yb(0, g.tak.S / 2 + g.tak.oh), g.tak.H)), tynn: true })
  // Postens høydegrenser
  former.push({ type: 'line', points: [[-10, yv(POSTEN.minInnkast)], [W + 10, yv(POSTEN.minInnkast)]], dashed: true, tynn: true })
  former.push({ type: 'line', points: [[-10, yv(POSTEN.maksInnkast)], [W + 10, yv(POSTEN.maksInnkast)]], dashed: true, tynn: true })
  const forfra = {
    id: 'forfra',
    navn: 'Forfra',
    type: 'fasade' as const,
    bredde: W,
    hoyde: Ht,
    former,
    maal: [
      { x1: xv(-g.w / 2), y1: Ht, x2: xv(g.w / 2), y2: Ht, label: `${c.bredde} cm`, offset: 24 },
      { x1: W, y1: yv(g.innkastLav), x2: W, y2: Ht, label: `${f0(g.innkastLav * 100)} cm innkast`, offset: 22 },
      { x1: 0, y1: 0, x2: 0, y2: Ht, label: `${f0(Ht)} cm`, offset: -22 },
      { x1: xv(stolper[0].x - 0.1), y1: Ht, x2: xv(stolper[0].x - 0.1), y2: Ht + dyp, label: `${f0(dyp)} cm`, offset: -14 },
    ],
    tekster: [
      { x: W + 2, y: yv(POSTEN.minInnkast) - 1, tekst: 'min. 90 (Posten)' },
      { x: W + 2, y: yv(POSTEN.maksInnkast) - 1, tekst: 'maks 175 (Posten)' },
    ],
  }
  // Fra siden: z fra bak (venstre) til front (høyre).
  const sideForm: Tegning2D['riss'][number]['former'] = []
  stolper.filter((p) => p.x < -0.01).forEach((p) => sideForm.push({ type: 'rect', x: zv(p.z - P / 2), y: yv(p.topp), w: cmv(P), h: cmv(p.topp - STOLPE_Y0) }))
  const profilPts: Array<[number, number]> = []
  for (let i = 0; i <= 40; i++) {
    const z = bb.min.z + ((bb.max.z - bb.min.z) * i) / 40
    // Takets overkant over midtsnittet i x.
    const [X, Z] = (() => {
      const ex = g.tak.tilV([1, 0, 0])
      const ez = g.tak.tilV([0, 0, 1])
      return [ex[2] * z, ez[2] * z] as [number, number]
    })()
    profilPts.push([zv(z), yv(g.tak.Yt(X, Z) + (TAKPLATE + TEKKING_T) / g.tak.cos)])
  }
  sideForm.push({ type: 'line', points: profilPts })
  g.kasser.slice(0, 1).forEach((k) => sideForm.push({ type: 'rect', x: zv(-g.d / 2 + B + g.ks.t), y: yv(k.yb + KASSE.h), w: cmv(g.kasseD), h: cmv(KASSE.h), dashed: true }))
  const siden = {
    id: 'siden',
    navn: 'Fra siden (front til høyre)',
    type: 'snitt' as const,
    bredde: D,
    hoyde: Ht,
    former: sideForm,
    maal: [
      { x1: zv(-g.d / 2), y1: Ht, x2: zv(g.d / 2), y2: Ht, label: `${c.dybde} cm`, offset: 24 },
      { x1: D, y1: yv(g.tak.H), x2: D, y2: Ht, label: `${c.hoyde} cm`, offset: 20 },
    ],
    tekster: [{ x: D * 0.3, y: 4, tekst: `${fmtGrader(g.tak.a)}` }],
  }
  const plan = {
    id: 'plan',
    navn: 'Ovenfra (plan)',
    type: 'plan' as const,
    bredde: W,
    hoyde: D,
    former: [
      { type: 'rect' as const, x: 0, y: 0, w: W, h: D, dashed: true },
      { type: 'rect' as const, x: xv(-g.w / 2), y: zv(-g.d / 2), w: cmv(g.w), h: cmv(g.d) },
      ...stolper.map((p) => ({ type: 'rect' as const, x: xv(p.x - P / 2), y: zv(p.z - P / 2), w: cmv(P), h: cmv(P), tynn: true })),
    ],
    maal: [
      { x1: xv(-g.w / 2), y1: zv(g.d / 2), x2: xv(g.w / 2), y2: zv(g.d / 2), label: `${c.bredde} cm`, offset: 20 },
      { x1: 0, y1: 0, x2: W, y2: 0, label: `${f0(W)} cm (tak)`, offset: -14 },
      { x1: xv(-g.w / 2), y1: zv(-g.d / 2), x2: xv(-g.w / 2), y2: zv(g.d / 2), label: `${c.dybde} cm`, offset: -20 },
    ],
    tekster: [{ x: W / 2 - 6, y: D + 6, tekst: 'front' }],
  }
  return { riss: [forfra, siden, plan] }
}

// ── Template ─────────────────────────────────────────────────────────

export const postkassestativ: ProductTemplate<PostkassestativConfig> & {
  beregningsgrunnlag: (c: PostkassestativConfig) => Beregningsgrunnlag
  monteringPlan: (c: PostkassestativConfig) => MonteringSteg[]
} = {
  id: 'postkassestativer',
  navn: 'Postkassestativ',
  ikon: 'faEnvelope',
  beskrivelse: 'Tegn postkassestativet med tak i 3D – postkassene henges i Postens høyde (innkast 90–175 cm), med pakkehylle og bunnskap. Stolper på frostsikre fundament, tak dimensjonert for snø.',
  bilde: '/images/products/postkassestativ-3d.webp',
  tilgjengelig: true,
  fraPris: 249,
  leveranser: ['ferdig', 'plan'],
  defaultConfig: {
    bredde: 160,
    dybde: 60,
    hoyde: 200,
    kasser: 3,
    innkast: 110,
    kledningsbord: '19x98',
    taktype: 'pulttak',
    takvinkel: 15,
    takutstikk: 15,
    takretning: 'bak',
    moneretning: 'bredde',
    tekking: 'takpapp',
    bunnskap: true,
    fundament: 'pilarror',
    grunn: 'grus-sand',
    frostsone: 'lavland',
    treslag: 'impregnert',
    farge: 'morkegra',
  },
  presets: [
    { id: 'enkel', navn: 'Enkelt, 2 kasser', beskrivelse: 'Pulttak, uten bunnskap', config: { bredde: 100, dybde: 55, hoyde: 190, kasser: 2, innkast: 110, taktype: 'pulttak', takvinkel: 12, takutstikk: 12, takretning: 'bak', bunnskap: false, kledningsbord: '19x98', farge: 'morkegra' } },
    { id: 'pulttak-160', navn: 'Pulttak 160 cm', beskrivelse: 'Moderne, 3 kasser + bunnskap', config: { bredde: 160, dybde: 60, hoyde: 200, kasser: 3, innkast: 110, taktype: 'pulttak', takvinkel: 15, takutstikk: 15, takretning: 'bak', bunnskap: true, kledningsbord: 'lekt', farge: 'sort' } },
    { id: 'saltak-180', navn: 'Saltak 180 cm', beskrivelse: 'Gavl mot veien, 4 kasser', config: { bredde: 180, dybde: 70, hoyde: 200, kasser: 4, innkast: 105, taktype: 'saltak', moneretning: 'dybde', takvinkel: 30, takutstikk: 15, bunnskap: true, kledningsbord: '19x98', treslag: 'gran', farge: 'hvit' } },
    { id: 'valmtak-220', navn: 'Valmtak 220 cm', beskrivelse: 'Fellesstativ, 5 kasser', config: { bredde: 220, dybde: 80, hoyde: 205, kasser: 5, innkast: 110, taktype: 'valmtak', takvinkel: 22.5, takutstikk: 20, bunnskap: true, kledningsbord: '19x148', treslag: 'impregnert', farge: 'lysgra' } },
    { id: 'sameie', navn: 'Sameie, 10 kasser', beskrivelse: 'To rader, saltak', config: { bredde: 260, dybde: 70, hoyde: 215, kasser: 10, innkast: 95, taktype: 'saltak', moneretning: 'bredde', takvinkel: 22.5, takutstikk: 15, bunnskap: false, kledningsbord: '19x148', farge: 'morkegra' } },
  ],
  dimensjoner: [
    { key: 'bredde', label: 'Bredde', min: 70, max: 330, step: 5, axis: 'x' },
    { key: 'dybde', label: 'Dybde', min: 45, max: 100, step: 5, axis: 'z' },
    { key: 'hoyde', label: 'Vegghøyde', min: 180, max: 250, step: 5, axis: 'y' },
    { key: 'kasser', label: 'Antall postkasser', min: 1, max: 12, step: 1, unit: 'stk', axis: 'x', handle: false },
    { key: 'innkast', label: 'Høyde til innkast', min: 90, max: 150, step: 5, axis: 'y', handle: false, markers: [90, 100, 110, 120] },
    { key: 'takvinkel', label: 'Takvinkel', min: 3, max: 45, step: 0.5, unit: '°', axis: 'y', handle: false, markers: [10, 15, 22.5, 30, 38, 45] },
    { key: 'takutstikk', label: 'Takutstikk', min: 5, max: 30, step: 1, axis: 'y', handle: false },
  ],
  alternativer: [
    {
      key: 'taktype',
      label: 'Taktype',
      choices: [
        { id: 'pulttak', label: 'Pulttak', patch: { takvinkel: 15 } },
        { id: 'saltak', label: 'Saltak', patch: { takvinkel: 27, moneretning: 'dybde' } },
        { id: 'valmtak', label: 'Valmtak', patch: { takvinkel: 22.5 } },
      ],
    },
    { key: 'takretning', label: 'Fallretning', visibleWhen: (c) => c.taktype === 'pulttak', choices: [{ id: 'bak', label: 'Bakover', note: 'Takdråpene faller bak – ikke på postbudet.' }, { id: 'front', label: 'Framover' }] },
    { key: 'moneretning', label: 'Møneretning', visibleWhen: (c) => c.taktype === 'saltak', choices: [{ id: 'dybde', label: 'Gavl mot veien' }, { id: 'bredde', label: 'Langs bredden' }] },
    { key: 'tekking', label: 'Tekking', choices: [{ id: 'takpapp', label: 'Takpapp' }, { id: 'shingel', label: 'Shingel', note: 'Min. ca. 15° fall.' }] },
    { key: 'kledningsbord', label: 'Kledning', choices: [{ id: '19x148', label: '19 × 148 mm' }, { id: '19x98', label: '19 × 98 mm' }, { id: 'lekt', label: 'Lekt 23 × 48 mm', note: 'Spileuttrykk med luft.' }] },
    { key: 'fundament', label: 'Fundament', choices: [{ id: 'pilarror', label: 'Støpt pilarrør', note: 'Ø200 til frostfri dybde.' }, { id: 'jordskrue', label: 'Jordskrue', note: 'Raskt – ingen støp.' }] },
    { key: 'grunn', label: 'Grunn', choices: [{ id: 'grus-sand', label: 'Grus/sand' }, { id: 'morene', label: 'Morene' }, { id: 'silt-leire', label: 'Leire/silt' }, { id: 'fjell', label: 'Fjell' }] },
    { key: 'frostsone', label: 'Klima (frost)', choices: [{ id: 'kyst', label: 'Kyst' }, { id: 'lavland', label: 'Lavland' }, { id: 'innland', label: 'Innland' }, { id: 'kaldt-innland', label: 'Kaldt innland' }] },
  ],
  materialer: [
    { key: 'treslag', label: 'Treslag', choices: treslagValg(['impregnert', 'gran', 'royal', 'lerk', 'kebony']) },
    { key: 'farge', label: 'Farge / beis', asSwatches: true, choices: fargeValg(['ubehandlet', 'klar', 'hvit', 'lysgra', 'morkegra', 'sort', 'brun', 'gronn']) },
  ],
  valg: [{ key: 'bunnskap', label: 'Bunnskap med pakkehylle', note: 'Rom for pakker og aviser under postkassene.' }],
  parts: [
    { key: 'konstruksjon', label: 'Ramme (stolper, rem, losholter)' },
    { key: 'kledning', label: 'Kledning' },
    { key: 'tak', label: 'Tak' },
    { key: 'gulv', label: 'Gulv og hylle' },
    { key: 'postkasse', label: 'Postkasser' },
    { key: 'fundament', label: 'Fundament' },
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
    return [
      ...g.st.melding,
      ...g.meldinger,
      `Postens krav: laveste innkast minst 90 cm og høyeste maks 175 cm over bakken. Her: ${f0(g.innkastLav * 100)}–${f0(g.innkastHoy * 100)} cm.`,
      'Merk postkassene med navn på alle som bor der (skilt min. 55 × 90 mm på forsiden), i nummerordning med laveste nummer først.',
      'Hold endeveden på stolpene 3 cm over betongen (stolpesko) – da tørker den ut og råtner ikke.',
      c.grunn === 'fjell' ? 'På fjell: bolt stolpeskoene til fjellet med kjemisk anker.' : 'Grav fundamentene til frostfri dybde (eller bruk jordskrue) – stativet er høyt og tar mye vind, og tele kan løfte og vri det.',
      'Plasser stativet utenfor brøytekanten og slik at det ikke hindrer sikten i avkjørselen.',
      c.taktype === 'pulttak' && c.takretning === 'front' ? 'Med fall framover drypper vannet foran postkassene – fall bakover er ofte bedre.' : 'Taket har utstikk og fall bort fra postkassene, så den som henter post står tørt.',
      'Bruk rustfrie (A4) skruer, og la impregnert virke tørke før du beiser.',
    ]
  },
  buildMesh,
  bounds: (c) => {
    const { group } = lagGruppe(c, () => new THREE.MeshBasicMaterial())
    const s = new THREE.Box3().setFromObject(group).getSize(new THREE.Vector3())
    return { x: s.x, y: s.y, z: s.z }
  },
}
