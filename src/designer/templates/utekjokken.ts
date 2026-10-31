import * as THREE from 'three'
import type { Bom, BomLine, BuildOptions, Byggeregler, DesignConfig, ProductTemplate, Tegning2D } from '../types'
import type { Beregningsgrunnlag, KapplisteDelPlan, MonteringSteg } from '../plan-typer'
import { TRESLAG, resolveColor, treslagValg, fargeValg } from '../materials'
import { PRISER, prisFor } from '../priser'
import { frostForConfig, frostsoneForConfig, grunnForConfig, snolastForConfig } from '../byggested'
import { VB0_STANDARD, fmt, snolastTak, taktekkeFra, vindOppdrift, vindlast } from '../laster'
import { DOBLE_C24, kontrollerBjelke, kontrollerSoyle, dimensjonerSperre, dimensjonerStolpe, maksGulvbjelkeSpenn, taklaster, linjelaster, tverrsnitt } from '../dimensjonering'
import type { Medlemskontroll } from '../dimensjonering'
import { FROSTSONER, GRUNN, dimensjonerPunktfundament } from '../fundament'
import { tilByggeregler, vurderByggesak } from '../byggesak'
import { lagBeregningsrapport, tilPlanVedlegg } from '../beregningsgrunnlag'
import { fmtGrader } from '../geometri'
import { basis, boks, byggMesher, ende, f0, kuttPlan, lagMatFabrikk, lmLinje, lmPerPris, plasser, prisme, prof, samleKappliste, stavLengde, stegTilTekst } from './smaa-felles'
import type { Stav, V2, V3 } from './smaa-felles'

/**
 * Utekjøkken – parametrisk template (byggeplan for selvbygging).
 *
 * BENK: ramme av 48×98 C24 – bein (stasjoner c/c ≤ 1,2 m), langrammer
 * oppå beina og tverrligger c/c ≤ 0,6 m under benkeplata. Hyller av
 * terrassebord på hyllebærere. Endene og baksiden kles med spiler/bord.
 * Benkeplate i heltre, laminat eller rustfritt (kjøpes ferdig, hull for vask
 * skjæres ut). Rette eller L-formede benker. Bakvegg (sprutvegg) med
 * skjermstolper og topphylle.
 *
 * TAK (valgfritt): stolper på støpte punktfundament, doble dragere (2 × 48)
 * skråhøvlet i takvinkelen, sperrer c/c ≤ 600, kneband 45° i begge retninger,
 * tekking (stål på lekter, bordtak, shingel eller takpapp på kryssfiner).
 * Hevet platting på justerbare terrassefoter. Alt dimensjoneres etter
 * NS-EN 1990/1991/1995 (snø, nyttelast på benk og platting, vindoppløft).
 */

export interface UtekjokkenConfig {
  form: string // 'rett' | 'l-venstre' | 'l-hoyre'
  bredde: number // cm (x)
  benkedybde: number // cm
  dybde: number // cm – takets/plattingens dybde (overbygd)
  sidelengde: number // cm – L-armens lengde (utvendig)
  hoyde: number // cm – fri høyde fra plattingen til underkant bakre drager
  taktype: string // 'ingen' | 'flatt' | 'pulttak'
  takvinkel: number
  taktekke: string // 'stålplater' | 'bord' | 'shingel' | 'takpapp'
  plattformHoyde: number // cm (0 = ingen platting)
  benkehoyde: number // cm – overkant benkeplate over gulv
  benkeplate: string // 'tre' | 'laminat' | 'rustfritt'
  hyller: number
  virke: string // spiler: '23x48' | '36x63' | '21x98'
  harVask: boolean
  harSkap: boolean
  harBenk: boolean
  harBakvegg: boolean
  harSidevegger: boolean
  treslag: string
  farge: string
  [key: string]: DesignConfig[string]
}

const SVINN = 1.1
const OH = 0.3 // takutstikk
const B = 0.048
const TP = 0.04 // benkeplate
const OVH = 0.03 // benkeplatens utstikk foran
const STOLPE_Y0 = 0.08
const SKAP_B = 0.6
const VASK = { b: 0.4, d: 0.34, dyp: 0.16 }

const cm = (v: number) => v / 100
const rad = (g: number) => (g * Math.PI) / 180
const X3: V3 = [1, 0, 0]
const Y3: V3 = [0, 1, 0]
const Z3: V3 = [0, 0, 1]

function spile(id: string) {
  if (id === '36x63') return { t: 0.036, w: 0.063, gap: 0.012, profil: prof(36, 63), pris: 'lekt-36x63', navn: 'Spile' }
  if (id === '21x98' || id === '48x98') return { t: 0.021, w: 0.098, gap: 0.004, profil: prof(21, 98), pris: 'bord-21x98', navn: 'Kledningsbord' }
  return { t: 0.023, w: 0.048, gap: 0.012, profil: prof(23, 48), pris: 'lekt-23x48', navn: 'Spile' }
}

const benkeplateNavn = (b: string) => (b === 'rustfritt' ? 'rustfritt stål' : b === 'laminat' ? 'laminat' : 'heltre')
const takvinkel = (c: UtekjokkenConfig) => (c.taktype === 'flatt' ? 2 : Math.max(3, Math.min(30, c.takvinkel)))
const tekkeAv = (c: UtekjokkenConfig) => {
  const t = c.taktype === 'flatt' && (c.taktekke === 'shingel' || c.taktekke === 'bord') ? 'takpapp' : c.taktekke
  return t === 'stålplater' ? 'stal' : t === 'bord' ? 'bord' : t === 'shingel' ? 'shingel' : 'takpapp'
}

// ── Statikk ──────────────────────────────────────────────────────────

interface Statikk {
  rail: Medlemskontroll
  hylleListe: number
  bein: Medlemskontroll
  hylle?: Medlemskontroll
  sperre?: Medlemskontroll
  hS: number
  drager?: Medlemskontroll
  hD: number
  stolpe?: Medlemskontroll
  P: number
  bjelke?: Medlemskontroll
  fotAvstand: number
  sk: ReturnType<typeof snolastForConfig>
  ok: boolean
  melding: string[]
}

function statikk(c: UtekjokkenConfig, stasjonMaks: number, hylleMaks: number, beinH: number): Statikk {
  const roofed = c.taktype !== 'ingen'
  const BW = cm(c.benkedybde)
  const tk = roofed ? 2 : 3
  const benkLast = [
    { navn: 'Egenvekt benkeplate (40 mm)', type: 'egen' as const, qk: 0.25 * (BW / 2) },
    { navn: 'Nyttelast benk 2,0 kN/m²', type: 'nytte' as const, qk: 2.0 * (BW / 2) },
  ]
  const rail = { ...kontrollerBjelke(tverrsnitt(48, 98, 1, 'C24', 'stolpe-48x98'), { spennM: stasjonMaks, laster: benkLast, punktlaster: [{ navn: 'Grill/pizzaovn 1,5 kN', type: 'nytte', Qk: 1.5 }], tjenesteklasse: tk, nedboyning: 'gulv', sidestottet: true }), navn: 'Langramme benk' }
  const A = stasjonMaks * (BW / 2)
  const bein = { ...kontrollerSoyle(tverrsnitt(48, 98, 1, 'C24', 'stolpe-48x98'), { lengdeM: Math.max(0.3, beinH), NGk: 0.3 * A, NQk: [{ type: 'nytte', Nk: 2.0 * A + 1.5 }], tjenesteklasse: tk }), navn: 'Benkebein' }
  // Hyllebord spenner på tvers mellom hyllelistene; listene mellom bein-stasjonene.
  const hylleSpenn = Math.max(0.2, BW - OVH - 2 * 0.098 - 0.048)
  const hylle = c.hyller > 0 ? { ...kontrollerBjelke(tverrsnitt(120, 28, 1, 'C24', 'terrassebord-28x120'), { spennM: hylleSpenn, laster: [{ navn: 'Nyttelast hylle 1,0 kN/m²', type: 'nytte', qk: 0.13 }], punktlaster: [{ navn: 'Punktlast 0,5 kN', type: 'nytte', Qk: 0.5 }], tjenesteklasse: tk, nedboyning: 'gulv' }), navn: 'Hyllebord' } : undefined
  let hylleListe = 0.048
  let liste: Medlemskontroll | undefined
  if (c.hyller > 0) {
    for (const h of [0.048, 0.098]) {
      hylleListe = h
      liste = { ...kontrollerBjelke(tverrsnitt(48, Math.round(h * 1000), 1, 'C24'), { spennM: hylleMaks, laster: [{ navn: 'Nyttelast hylle 1,0 kN/m²', type: 'nytte', qk: 1.0 * (hylleSpenn / 2) }], punktlaster: [{ navn: 'Punktlast 0,5 kN', type: 'nytte', Qk: 0.5 }], tjenesteklasse: tk, nedboyning: 'gulv', sidestottet: true }), navn: 'Hyllelist' }
      if (liste.ok) break
    }
  }
  const sk = snolastForConfig(c)
  const melding: string[] = []
  let sperre: Medlemskontroll | undefined
  let drager: Medlemskontroll | undefined
  let stolpe: Medlemskontroll | undefined
  let bjelke: Medlemskontroll | undefined
  let hS = 0.148
  let hD = 0.198
  let P = 0.098
  let fotAvstand = 1.2
  if (roofed) {
    const W = cm(c.bredde)
    const D = cm(c.dybde)
    const a = takvinkel(c)
    const tekke = taktekkeFra(tekkeAv(c))
    const sp = dimensjonerSperre({ spennHorisontalM: D - 0.098, vinkelGrader: a, ccM: 0.6, tekke, sk: sk.sk, tjenesteklasse: 2 })
    sperre = { ...sp.kontroll, navn: 'Sperre' }
    hS = Math.max(0.098, sp.valgt.h / 1000)
    const flater = taklaster({ sk: sk.sk, vinkelGrader: a, tekke })
    const nX = W > 3.6 ? 3 : 2
    const spenn = (W - 0.098) / (nX - 1)
    const fas = 0.096 * Math.tan(rad(a))
    for (const tv of DOBLE_C24.filter((t) => t.antall === 2)) {
      drager = { ...kontrollerBjelke(tverrsnitt(48, Math.round(tv.h - fas * 1000), 2, 'C24', tv.pris), { spennM: spenn, laster: linjelaster(flater, D / 2 + OH), tjenesteklasse: 2, nedboyning: 'drager', sidestottet: true, opplegglengdeMm: 98 }), navn: 'Drager' }
      hD = tv.h / 1000
      drager.tverrsnitt = { ...drager.tverrsnitt, profil: `2 × 48 × ${tv.h} mm (netto ${Math.round(tv.h - fas * 1000)} etter skråhøvling)` }
      if (drager.ok) break
    }
    const st = dimensjonerStolpe({ lengdeM: cm(c.hoyde) + cm(c.plattformHoyde) + 0.2, belastningsarealM2: ((W + 2 * OH) * (D + 2 * OH)) / (2 * nX), flatelaster: flater, knekklengdefaktor: 1.0, tjenesteklasse: 3, kandidater: [tverrsnitt(98, 98, 1, 'C24', 'stolpe-98x98'), tverrsnitt(148, 148, 1, 'C24', 'stolpe-148x148')] })
    stolpe = { ...st.kontroll, navn: 'Stolpe' }
    P = st.valgt.b / 1000
    if (!sp.ok) melding.push('Sperrene holder ikke for snølasten over denne dybden – reduser dybden eller øk takvinkelen.')
    if (!drager?.ok) melding.push('Dragerne holder ikke for snølasten – reduser bredden (over 3,6 m får du midtstolper).')
    if (cm(c.plattformHoyde) >= 0.05) {
      const bj = tverrsnitt(48, 98, 1, 'C24', 'stolpe-48x98')
      fotAvstand = Math.max(0.5, Math.min(1.5, maksGulvbjelkeSpenn(bj, { ccM: 0.6, bruk: 'A-gulv', tjenesteklasse: 3 })))
      const n = Math.max(1, Math.ceil((D - 0.3) / fotAvstand - 1e-9))
      fotAvstand = (D - 0.3) / n
      bjelke = { ...kontrollerBjelke(bj, { spennM: fotAvstand, laster: [{ navn: 'Terrassebord 28 mm', type: 'egen', qk: 0.2 * 0.6 }, { navn: 'Nyttelast kat. A 2,0 kN/m²', type: 'nytte', qk: 2.0 * 0.6 }], punktlaster: [{ navn: 'Punktlast 2,0 kN', type: 'nytte', Qk: 2.0 }], tjenesteklasse: 3, nedboyning: 'gulv', ccM: 0.6 }), navn: 'Bjelkelag platting' }
    }
  }
  if (!rail.ok) melding.push('Benkerammen er for svak – legg inn flere bein (kortere bredde mellom stasjonene).')
  const ok = [rail, bein, hylle, liste, sperre, drager, stolpe, bjelke].every((k) => !k || k.ok)
  return { rail, hylleListe, bein, hylle: liste && hylle ? (liste.maksUtnyttelse > hylle.maksUtnyttelse ? liste : hylle) : hylle, sperre, hS, drager, hD, stolpe, P, bjelke, fotAvstand, sk, ok, melding }
}

// ── Geometri / stavliste ─────────────────────────────────────────────

interface Lop {
  // Ramme-rektangel (uten benkeplatens utstikk) + hvilken side er «front».
  x0: number
  x1: number
  z0: number
  z1: number
  langsX: boolean
  front: 1 | -1 // åpen side (+z for hovedløpet, ±x for L-armen)
}

interface Geo {
  roofed: boolean
  W: number
  D: number
  y0: number // gulvnivå (platting eller helle)
  yTop: number
  st: Statikk
  lop: Lop[]
  zb: number
  a: number
  tan: number
  cos: number
  Yb: (z: number) => number
  Yt: (z: number) => number
  drBunnBak: number
  drBunnFront: number
  postX: number[]
  ph: number
  sk: ReturnType<typeof spile>
  skjermTopp: number
}

function stasjoner(a: number, b: number, maks: number, faste: number[] = []) {
  const pts = [...new Set([a, b, ...faste.filter((f) => f > a + 0.05 && f < b - 0.05)])].sort((p, q) => p - q)
  const ut: number[] = []
  for (let i = 0; i < pts.length - 1; i++) {
    const n = Math.max(1, Math.ceil((pts[i + 1] - pts[i]) / maks - 1e-9))
    for (let k = 0; k < n; k++) ut.push(pts[i] + ((pts[i + 1] - pts[i]) * k) / n)
  }
  ut.push(pts[pts.length - 1])
  return ut
}

function geo(c: UtekjokkenConfig): Geo {
  const roofed = c.taktype !== 'ingen'
  const W = cm(c.bredde)
  const BW = cm(c.benkedybde)
  const sp = spile(c.virke)
  const bakvegg = Boolean(c.harBakvegg)
  // Foreløpig statikk for å finne stolpemål (P) og bjelkehøyde.
  const st0 = statikk(c, 1.2, 1.2, cm(c.benkehoyde) - 0.15)
  const P = st0.P
  const D = roofed ? cm(c.dybde) : 0
  const phIn = roofed ? cm(c.plattformHoyde) : 0
  const ph = phIn < 0.05 ? 0 : Math.max(phIn, 0.028 + 0.098 + 0.03)
  const y0 = roofed ? ph : 0.04
  const yTop = y0 + cm(c.benkehoyde)
  const zb = roofed ? -D / 2 + P + 0.03 + sp.t + (bakvegg ? sp.t + 0.098 : 0) : 0
  const xL = roofed ? -W / 2 + P + 0.03 : -W / 2
  const xR = -xL
  const lop: Lop[] = [{ x0: xL, x1: xR, z0: zb, z1: zb + BW - OVH, langsX: true, front: 1 }]
  const meld: string[] = []
  if (c.form === 'l-venstre' || c.form === 'l-hoyre') {
    const maksArm = roofed ? D / 2 - P - 0.05 - sp.t - zb : 3.5
    const armLen = Math.min(Math.max(BW + 0.4, cm(c.sidelengde)), maksArm)
    const armEnde = zb + armLen
    if (armLen < BW + 0.25) meld.push('L-armen får ikke plass under taket – øk takdybden. Planen viser rett benk.')
    else if (c.form === 'l-venstre') lop.push({ x0: xL, x1: xL + BW - OVH, z0: zb + BW, z1: armEnde, langsX: false, front: 1 })
    else lop.push({ x0: xR - BW + OVH, x1: xR, z0: zb + BW, z1: armEnde, langsX: false, front: -1 })
  }
  const a = takvinkel(c)
  const tan = Math.tan(rad(a))
  const cos = Math.cos(rad(a))
  // Takplan: fall bakover (lav bak). Underkant bakre drager = gulv + fri høyde.
  const hD = st0.hD
  const drBunnBak = y0 + cm(c.hoyde)
  const zIBak = -D / 2 + 0.096
  const Yb = (z: number) => drBunnBak + hD + (z - zIBak) * tan
  const drBunnFront = Yb(D / 2) - hD
  const postX = W > 3.6 ? [-(W / 2 - P / 2), 0, W / 2 - P / 2] : [-(W / 2 - P / 2), W / 2 - P / 2]
  const skjermTopp = Math.min(yTop + 1.0, roofed ? drBunnBak - 0.08 : Infinity)
  st0.melding.push(...meld)
  return { roofed, W, D, y0, yTop, st: st0, lop, zb, a, tan, cos, Yb, Yt: (z) => Yb(z) + st0.hS / cos, drBunnBak, drBunnFront, postX, ph, sk: sp, skjermTopp }
}

function konstruer(c: UtekjokkenConfig, opts?: BuildOptions): { staver: Stav[]; g: Geo } {
  const g = geo(c)
  const st = g.st
  const { W, D, y0, yTop } = g
  const sp = g.sk
  const P = st.P
  const staver: Stav[] = []
  const add = (s: Stav) => staver.push({ kvalitet: 'Impregnert C24', ...s })
  const K98 = prof(48, 98)
  const bjelke = (navn: string, akse: 'x' | 'y' | 'z', a0: number, a1: number, p: [number, number], q: [number, number], part: string, pid: string, profil = K98, pris = 'stolpe-48x98', merknad?: string, darken = 0.88) => {
    // p/q = tverrsnitt i de to andre aksene (x→(y,z), y→(z,x), z→(y,x)).
    const prof2: V2[] = [[p[0], q[0]], [p[1], q[0]], [p[1], q[1]], [p[0], q[1]]]
    const geom = akse === 'x' ? prisme(prof2, () => a0, () => a1) : akse === 'y' ? plasser(prisme(prof2, () => a0, () => a1), basis(Y3, Z3, X3)) : plasser(prisme(prof2, () => a0, () => a1), basis(Z3, Y3, X3))
    add({ navn, profil, pris, lengdeMm: (a1 - a0) * 1000, endeA: ende(0), endeB: ende(0), merknad, part, pid, geom, darken, kategori: 'konstruksjon' })
  }

  // ── Benk ──
  const railY0 = yTop - TP - 0.098
  const hylleN = Math.min(3, Math.max(0, Math.round(c.hyller)))
  let sinkInfo: { x: number; z: number } | undefined
  let skapInfo: { x0: number; x1: number; z0: number; z1: number } | undefined
  const heller: Array<[number, number]> = []
  g.lop.forEach((l, li) => {
    // Lokale akser: L = langs, T = på tvers (mot fronten).
    const Lmin = l.langsX ? l.x0 : l.z0
    const Lmax = l.langsX ? l.x1 : l.z1
    const Tb = l.langsX ? l.z0 : l.front > 0 ? l.x0 : l.x1 // bakkant
    const Tf = l.langsX ? l.z1 : l.front > 0 ? l.x1 : l.x0 // frontkant (ramme)
    const sT = Tf > Tb ? 1 : -1
    const T = (t: number) => Tb + sT * t // t målt fra bakkant
    const dT = Math.abs(Tf - Tb)
    const faste: number[] = []
    const skap = c.harSkap && li === 0
    // Skapet står i enden som er fri for L-armen.
    const skapV = skap && c.form === 'l-hoyre'
    if (skap) faste.push(skapV ? Lmin + SKAP_B : Lmax - B - SKAP_B)
    const skapA = skapV ? Lmin : Lmax - SKAP_B
    const skapB = skapV ? Lmin + SKAP_B : Lmax
    const st0 = stasjoner(Lmin + B / 2, Lmax - B / 2, 1.2, faste.map((f) => f + B / 2))
    const tverr = stasjoner(Lmin + B / 2, Lmax - B / 2, 0.6, st0)
    // Vask: i et fag mellom tverrliggerne nær venstre ende av hovedløpet.
    if (c.harVask && li === 0) {
      const fag = tverr.slice(0, -1).map((_x, i) => i)
      if (c.form === 'l-venstre') fag.reverse() // ikke der L-armen stenger
      for (const i of fag) {
        const fri = tverr[i + 1] - tverr[i] - B
        const mid = (tverr[i] + tverr[i + 1]) / 2
        if (fri >= VASK.b + 0.04 && (!skap || mid < skapA - 0.3 || mid > skapB + 0.3)) {
          sinkInfo = { x: mid, z: T(0.07 + VASK.d / 2) }
          break
        }
      }
    }
    const pT = (t0: number, t1: number): [number, number] => [Math.min(T(t0), T(t1)), Math.max(T(t0), T(t1))]
    const langs = (navn: string, t0: number, t1: number, ya: number, yb: number, a0: number, a1: number, pid: string, profil = K98, pris = 'stolpe-48x98', merk?: string) => {
      if (l.langsX) bjelke(navn, 'x', a0, a1, [ya, yb], pT(t0, t1), 'benk', pid, profil, pris, merk)
      else bjelke(navn, 'z', a0, a1, [ya, yb], pT(t0, t1), 'benk', pid, profil, pris, merk)
    }
    const tvers = (navn: string, Lc: number, bL: number, t0: number, t1: number, ya: number, yb: number, pid: string, profil = K98, pris = 'stolpe-48x98') => {
      const [ta, tb] = pT(t0, t1)
      if (l.langsX) bjelke(navn, 'z', ta, tb, [ya, yb], [Lc - bL / 2, Lc + bL / 2], 'benk', pid, profil, pris)
      else bjelke(navn, 'x', ta, tb, [ya, yb], [Lc - bL / 2, Lc + bL / 2], 'benk', pid, profil, pris)
    }
    // Bein (48 langs, 98 på tvers) i front og bak ved hver stasjon.
    st0.forEach((Lc, i) => {
      ;[[0, 0.098], [dT - 0.098, dT]].forEach(([t0, t1], k) => {
        const [ta, tb] = pT(t0, t1)
        const p2: [number, number] = [Lc - B / 2, Lc + B / 2]
        if (l.langsX) bjelke('Benkebein', 'y', y0, railY0, [ta, tb], p2, 'benk', `bein-${li}-${i}-${k}`)
        else bjelke('Benkebein', 'y', y0, railY0, p2, [ta, tb], 'benk', `bein-${li}-${i}-${k}`)
      })
      if (!g.roofed) {
        // Helle under hvert bein (én helle der to bein står tett).
        ;[[0, 0.098], [dT - 0.098, dT]].forEach(([t0, t1], k) => {
          const tc = (T(t0) + T(t1)) / 2
          const px = l.langsX ? Lc : tc
          const pz = l.langsX ? tc : Lc
          if (heller.some(([hx, hz]) => Math.abs(hx - px) < 0.2 && Math.abs(hz - pz) < 0.2)) return
          heller.push([px, pz])
          const geom = l.langsX ? boks(Lc, 0.02, tc, 0.2, 0.04, 0.2) : boks(tc, 0.02, Lc, 0.2, 0.04, 0.2)
          staver.push({ navn: 'Helle (underlag for bein)', profil: 'betong', lengdeMm: 0, part: 'fundament', pid: `helle-${li}-${i}-${k}`, geom, materiale: new THREE.MeshStandardMaterial({ color: 0x9a9a94, roughness: 0.95 }), ikkeKapp: true })
        })
      }
    })
    // Langrammer oppå beina, tverrliggere imellom.
    langs('Langramme', 0, B, railY0, yTop - TP, Lmin, Lmax, `rail-b-${li}`)
    langs('Langramme', dT - B, dT, railY0, yTop - TP, Lmin, Lmax, `rail-f-${li}`)
    tverr.forEach((Lc, i) => tvers('Tverrligger', Lc, B, B, dT - B, railY0, yTop - TP, `tverr-${li}-${i}`))
    // Hyller: hyllelister 48×48 innenfor beina (langs løpet) + tverrlagte
    // hyllebord med 10 mm luft (ristehylle).
    if (hylleN > 0) {
      const yH0 = y0 + 0.1
      const yH1 = railY0 - 0.25
      const hoyder = Array.from({ length: hylleN }, (_, i) => (hylleN === 1 ? yH0 : yH0 + ((yH1 - yH0) * i) / (hylleN - 1)))
      const hylleStart = skap && skapV ? Lmin + SKAP_B : Lmin
      const hylleSlutt = skap && !skapV ? Lmax - SKAP_B : Lmax
      const lh = st.hylleListe
      hoyder.forEach((yh, hi) => {
        langs('Hyllelist', 0.098, 0.098 + B, yh, yh + lh, hylleStart, hylleSlutt, `hl-${li}-${hi}-b`, prof(48, Math.round(lh * 1000)), lh > 0.05 ? 'stolpe-48x98' : 'stolpe-48x48', 'Skrus til innsiden av beina.')
        langs('Hyllelist', dT - 0.098 - B, dT - 0.098, yh, yh + lh, hylleStart, hylleSlutt, `hl-${li}-${hi}-f`, prof(48, Math.round(lh * 1000)), lh > 0.05 ? 'stolpe-48x98' : 'stolpe-48x48', 'Skrus til innsiden av beina.')
        const nB = Math.max(1, Math.floor((hylleSlutt - hylleStart + 0.01) / (0.12 + 0.01)))
        const pitch = (hylleSlutt - hylleStart - 0.12) / Math.max(1, nB - 1)
        for (let j = 0; j < nB; j++) {
          const Lc = hylleStart + 0.06 + j * pitch
          tvers('Hyllebord', Lc, 0.12, 0.098, dT - 0.098, yh + lh, yh + lh + 0.028, `hylle-${li}-${hi}-${j}`, prof(28, 120), 'terrassebord-28x120')
        }
      })
    }
    // Skap i høyre fag av hovedløpet.
    if (skap) {
      const sx0 = skapV ? Lmin + B + 0.002 : Lmax - SKAP_B + 0.002
      const sx1 = skapV ? Lmin + SKAP_B - 0.002 : Lmax - B - 0.002
      skapInfo = { x0: sx0, x1: sx1, z0: T(0.05), z1: T(dT - 0.01) }
    }
    // Kledning (stående spiler/bord): endene og baksiden.
    const kled = (_navn: string, akse: 'x' | 'z', n0: number, n1: number, s0: number, s1: number, tag: string) => {
      const len = s1 - s0
      const n = Math.max(1, Math.round((len + sp.gap) / (sp.w + sp.gap)))
      const bw = (len - (n - 1) * sp.gap) / n
      for (let i = 0; i < n; i++) {
        const a0 = s0 + i * (bw + sp.gap)
        const prof2: V2[] = [[a0, n0], [a0 + bw, n0], [a0 + bw, n1], [a0, n1]]
        const geom = plasser(prisme(prof2, () => y0 + 0.01, () => yTop - TP), akse === 'x' ? basis(Y3, X3, Z3) : basis(Y3, Z3, X3))
        add({ navn: `${sp.navn} (kledning)`, profil: sp.profil, pris: sp.pris, lengdeMm: (yTop - TP - y0 - 0.01) * 1000, endeA: ende(0), endeB: ende(0), part: 'benk', pid: `${tag}-${i}`, geom, darken: 0.96, kategori: 'kledning' })
      }
    }
    const t = sp.t
    if (l.langsX) {
      kled('Kledning', 'x', l.z0 - t, l.z0, l.x0 - t, l.x1 + t, `kb-${li}`)
      kled('Kledning', 'z', l.x0 - t, l.x0, l.z0, l.z1, `kv-${li}`)
      kled('Kledning', 'z', l.x1, l.x1 + t, l.z0, l.z1, `kh-${li}`)
    } else {
      // L-arm: ytterside og ende.
      if (l.front > 0) kled('Kledning', 'z', l.x0 - t, l.x0, l.z0, l.z1, `ka-${li}`)
      else kled('Kledning', 'z', l.x1, l.x1 + t, l.z0, l.z1, `ka-${li}`)
      kled('Kledning', 'x', l.z1, l.z1 + t, l.x0 - (l.front > 0 ? t : 0), l.x1 + (l.front < 0 ? t : 0), `ke-${li}`)
    }
  })

  // ── Benkeplate (kjøpes ferdig; hull for vask) ──
  const plateMat = c.benkeplate === 'rustfritt'
    ? new THREE.MeshStandardMaterial({ color: 0xc9ccd1, roughness: 0.3, metalness: 0.75 })
    : c.benkeplate === 'laminat'
      ? new THREE.MeshStandardMaterial({ color: 0x3a3b40, roughness: 0.5, metalness: 0.05 })
      : lagMatFabrikk(c.treslag, c.farge, opts)('benkeplate', 1.05)
  const t = sp.t
  const plate = (x0: number, x1: number, z0: number, z1: number, pid: string) => {
    if (x1 - x0 < 0.005 || z1 - z0 < 0.005) return
    staver.push({ navn: `Benkeplate (${benkeplateNavn(c.benkeplate)})`, profil: '40 mm benkeplate', lengdeMm: Math.max(x1 - x0, z1 - z0) * 1000, part: 'benk', pid, geom: boks((x0 + x1) / 2, yTop - TP / 2, (z0 + z1) / 2, x1 - x0, TP, z1 - z0), materiale: plateMat, ikkeKapp: true, explode: new THREE.Vector3(0, 0.4, 0) })
  }
  g.lop.forEach((l, li) => {
    let x0 = l.x0 - t
    let x1 = l.x1 + t
    let z0 = l.z0 - t
    const z1 = l.z1 + (l.langsX ? OVH : t)
    if (!l.langsX) {
      z0 = l.z0
      if (l.front > 0) x1 = l.x1 + OVH
      else x0 = l.x0 - OVH
    }
    if (l.langsX && c.form === 'l-venstre') x0 = l.x0 - t
    if (li === 0 && sinkInfo) {
      const hx0 = sinkInfo.x - VASK.b / 2
      const hx1 = sinkInfo.x + VASK.b / 2
      const hz0 = sinkInfo.z - VASK.d / 2
      const hz1 = sinkInfo.z + VASK.d / 2
      plate(x0, hx0, z0, z1, `benkeplate-${li}-a`)
      plate(hx1, x1, z0, z1, `benkeplate-${li}-b`)
      plate(hx0, hx1, z0, hz0, `benkeplate-${li}-c`)
      plate(hx0, hx1, hz1, z1, `benkeplate-${li}-d`)
    } else plate(x0, x1, z0, z1, `benkeplate-${li}`)
  })
  const stal = new THREE.MeshStandardMaterial({ color: 0xb8bcc0, roughness: 0.3, metalness: 0.8 })
  if (sinkInfo) {
    const { x, z } = sinkInfo
    staver.push({ navn: 'Utslagsvask (rustfri)', profil: 'kum', lengdeMm: 0, part: 'utstyr', pid: 'vask', geom: boks(x, yTop - VASK.dyp / 2, z, VASK.b - 0.004, VASK.dyp, VASK.d - 0.004), materiale: stal, ikkeKapp: true })
    staver.push({ navn: 'Blandebatteri', profil: 'kran', lengdeMm: 0, part: 'utstyr', pid: 'kran', geom: boks(x, yTop + 0.13, z - VASK.d / 2 - 0.04, 0.03, 0.26, 0.03), materiale: stal, ikkeKapp: true })
  }
  if (skapInfo) {
    const s = skapInfo
    const z0 = Math.min(s.z0, s.z1)
    const z1 = Math.max(s.z0, s.z1)
    staver.push({ navn: 'Underskap (kjøpes ferdig)', profil: 'skap 600 mm', lengdeMm: 0, part: 'utstyr', pid: 'skap', geom: boks((s.x0 + s.x1) / 2, (y0 + 0.02 + railY0 - 0.005) / 2, (z0 + z1) / 2, s.x1 - s.x0, railY0 - 0.005 - y0 - 0.02, z1 - z0 - 0.06), materiale: new THREE.MeshStandardMaterial({ color: new THREE.Color(resolveColor(c.treslag, c.farge)).multiplyScalar(0.8), roughness: 0.7 }), ikkeKapp: true })
  }

  // ── Bakvegg (sprutvegg) ──
  if (c.harBakvegg) {
    const l = g.lop[0]
    const z1 = l.z0 - t
    const z0 = z1 - 0.098
    const xs = stasjoner(l.x0 - t + B / 2, l.x1 + t - B / 2, 0.6)
    xs.forEach((x, i) => bjelke('Skjermstolpe', 'y', y0, g.skjermTopp, [z0, z1], [x - B / 2, x + B / 2], 'vegg', `skjermstolpe-${i}`, K98, 'stolpe-48x98', 'Skrus til benkens langramme og bakre bein.'))
    const yS0 = yTop + 0.06
    const n = Math.max(2, Math.floor((g.skjermTopp - 0.02 - yS0 + sp.gap) / (sp.w + sp.gap)))
    for (let i = 0; i < n; i++) {
      const ya = yS0 + i * (sp.w + sp.gap)
      bjelke(`${sp.navn} (bakvegg)`, 'x', l.x0 - t, l.x1 + t, [ya, ya + sp.w], [z1, z1 + t], 'vegg', `bakspile-${i}`, sp.profil, sp.pris)
    }
    bjelke('Topphylle', 'x', l.x0 - t, l.x1 + t, [g.skjermTopp, g.skjermTopp + 0.028], [z0, z0 + 0.12], 'vegg', 'topphylle', prof(28, 120), 'terrassebord-28x120')
  }

  // ── Sittebenk (overbygd, rett) ──
  if (g.roofed && c.harBenk && c.form === 'rett') {
    const zs0 = g.lop[0].z1 + OVH + 0.45
    const zs1 = D / 2 - 0.1
    if (zs1 - zs0 >= 0.6) {
      const xs0 = -W / 2 + P + 0.08
      const xs1 = xs0 + 0.42
      const ySete = y0 + 0.45
      const yr0 = ySete - 0.028 - 0.098
      stasjoner(zs0 + B / 2, zs1 - B / 2, 1.0).forEach((zc, i) => {
        bjelke('Benkebein (sittebenk)', 'y', y0, yr0, [zc - B / 2, zc + B / 2], [xs0, xs0 + 0.098], 'benk', `sbein-${i}-a`)
        bjelke('Benkebein (sittebenk)', 'y', y0, yr0, [zc - B / 2, zc + B / 2], [xs1 - 0.098, xs1], 'benk', `sbein-${i}-b`)
      })
      bjelke('Langramme (sittebenk)', 'z', zs0, zs1, [yr0, yr0 + 0.098], [xs0, xs0 + B], 'benk', 'srail-a')
      bjelke('Langramme (sittebenk)', 'z', zs0, zs1, [yr0, yr0 + 0.098], [xs1 - B, xs1], 'benk', 'srail-b')
      for (let j = 0; j < 3; j++) {
        const xa = xs0 + j * (0.134 + 0.009)
        bjelke('Setebord', 'z', zs0, zs1, [ySete - 0.028, ySete], [xa, Math.min(xs1, xa + 0.134)], 'benk', `sete-${j}`, prof(28, 145), 'terrassebord-28x145', 'Slip kantene runde.')
      }
    }
  }

  // ── Tak, stolper, platting ──
  if (g.roofed) {
    const { a, tan, cos } = g
    const sin = Math.sin(rad(a))
    const hD = st.hD
    const hS = st.hS
    const Pmm = Math.round(P * 1000)
    // Stolper
    const zRows = [-(D / 2 - P / 2), D / 2 - P / 2]
    zRows.forEach((zp, r) => {
      const topp = r === 0 ? g.drBunnBak : g.drBunnFront
      g.postX.forEach((xp, i) => {
        bjelke('Stolpe', 'y', STOLPE_Y0, topp, [zp - P / 2, zp + P / 2], [xp - P / 2, xp + P / 2], 'stolpe', `stolpe-${r}-${i}`, prof(Pmm, Pmm), Pmm > 100 ? 'stolpe-148x148' : 'stolpe-98x98', 'Står i stolpesko på støpt fundament.', 0.9)
        staver.push({ navn: 'Fundament (pilarrør Ø200, støpt)', profil: 'betong', lengdeMm: 0, part: 'fundament', pid: `fund-${r}-${i}`, geom: (() => { const gg = new THREE.CylinderGeometry(P / 2 + 0.012, P / 2 + 0.012, 0.05, 28); gg.translate(xp, 0.025, zp); return gg })(), materiale: new THREE.MeshStandardMaterial({ color: 0x9a9a94, roughness: 0.95 }), ikkeKapp: true })
        staver.push({ navn: 'Stolpesko (justerbar)', profil: 'stål', lengdeMm: 0, part: 'fundament', pid: `sko-${r}-${i}`, geom: boks(xp, 0.065, zp, 0.05, 0.03, 0.05), materiale: new THREE.MeshStandardMaterial({ color: 0x8c9196, roughness: 0.45, metalness: 0.7 }), ikkeKapp: true })
      })
    })
    // Dragere (2 × 48), skråhøvlet oppå.
    const dProfil = prof(48, Math.round(hD * 1000))
    const dPris = `bjelke-48x${Math.round(hD * 1000)}`
    zRows.forEach((zp, r) => {
      const bunn = r === 0 ? g.drBunnBak : g.drBunnFront
      for (let k = 0; k < 2; k++) {
        const z0 = zp - 0.048 + k * B
        const z1 = z0 + B
        const geom = prisme([[bunn, z0], [bunn, z1], [g.Yb(z1), z1], [g.Yb(z0), z0]], () => -W / 2 - OH, () => W / 2 + OH)
        add({ navn: r === 0 ? 'Drager bak' : 'Drager foran', profil: dProfil, pris: dPris, lengdeMm: (W + 2 * OH) * 1000, endeA: ende(0), endeB: ende(0), merknad: `Skråhøvles ${fmtGrader(a)} på oversiden. To planker boltes/skrus sammen, ${f0(OH * 100)} cm utstikk i hver ende.`, part: 'drager', pid: `drager-${r}-${k}`, geom, darken: 0.85, explode: new THREE.Vector3(0, 0.2, 0), kategori: 'konstruksjon' })
      }
    })
    // Sperrer
    const sProfil = prof(48, Math.round(hS * 1000))
    const sPris = `bjelke-48x${Math.round(hS * 1000)}`
    const eU: V3 = [0, sin, cos] // fra bak (lav) mot front (høy)
    const eV: V3 = [0, cos, -sin]
    const O: V3 = [0, g.Yb(0), 0]
    const spX = stasjoner(-W / 2 - OH + B / 2, W / 2 + OH - B / 2, 0.6, g.postX)
    spX.forEach((X0, i) => {
      const s0 = kuttPlan(O, eU, X3, eV, Z3, -D / 2 - OH)
      const s1 = kuttPlan(O, eU, X3, eV, Z3, D / 2 + OH)
      const prof2: V2[] = [[X0 - B / 2, 0], [X0 + B / 2, 0], [X0 + B / 2, hS], [X0 - B / 2, hS]]
      add({ navn: 'Sperre', profil: sProfil, pris: sPris, lengdeMm: stavLengde(prof2, s0, s1) * 1000, endeA: ende(a, 'gjaering', 'loddkutt'), endeB: ende(a, 'gjaering', 'loddkutt'), merknad: `Loddkutt ${fmtGrader(a)} i begge ender. Sperrebeslag mot dragerne.`, part: 'spaer', pid: `sperre-${i}`, geom: plasser(prisme(prof2, s0, s1), basis(eU, X3, eV, O)), explode: new THREE.Vector3(0, 0.35, 0), kategori: 'tak' })
    })
    // Tekking
    const tekk = tekkeAv(c)
    const uLangs = (z: number) => (z - O[2]) / cos // ca. posisjon langs fallet
    void uLangs
    const vT = hS
    if (tekk === 'stal' || tekk === 'bord') {
      // Lekter 36×48 langs x, c/c 600 langs fallet.
      const lekt = (u: number, i: number) => {
        const p0: V2 = [u - 0.024, vT]
        const prof2: V2[] = [[p0[0], vT], [p0[0] + 0.048, vT], [p0[0] + 0.048, vT + 0.036], [p0[0], vT + 0.036]]
        const geom = plasser(prisme(prof2.map(([uu, vv]) => [uu, vv] as V2), () => -W / 2 - OH, () => W / 2 + OH), basis(X3, eU, eV, O))
        add({ navn: 'Taklekt', profil: prof(36, 48), pris: 'stolpe-36x48', lengdeMm: (W + 2 * OH) * 1000, endeA: ende(0), endeB: ende(0), part: 'tak', pid: `lekt-${i}`, geom, darken: 0.9, explode: new THREE.Vector3(0, 0.45, 0), kategori: 'tak' })
      }
      const u0 = kuttPlan(O, eU, X3, eV, Z3, -D / 2 - OH)(0, vT) + 0.03
      const u1 = kuttPlan(O, eU, X3, eV, Z3, D / 2 + OH)(0, vT) - 0.03
      const n = Math.max(2, Math.ceil((u1 - u0) / 0.6 - 1e-9) + 1)
      for (let i = 0; i < n; i++) lekt(u0 + ((u1 - u0) * i) / (n - 1), i)
      const vB = vT + 0.036
      const s0 = kuttPlan(O, eU, X3, eV, Z3, -D / 2 - OH)
      const s1 = kuttPlan(O, eU, X3, eV, Z3, D / 2 + OH)
      if (tekk === 'stal') {
        const prof2: V2[] = [[-W / 2 - OH, vB], [W / 2 + OH, vB], [W / 2 + OH, vB + 0.02], [-W / 2 - OH, vB + 0.02]]
        staver.push({ navn: 'Stålplater (taktekke)', profil: 'profilert stål', lengdeMm: stavLengde(prof2, s0, s1) * 1000, part: 'tak', pid: 'stalplate', geom: plasser(prisme(prof2, s0, s1), basis(eU, X3, eV, O)), materiale: new THREE.MeshStandardMaterial({ color: 0x5f6368, roughness: 0.45, metalness: 0.5 }), ikkeKapp: true, explode: new THREE.Vector3(0, 0.6, 0) })
      } else {
        const R = W + 2 * OH
        const nU = Math.max(2, Math.ceil((R - 0.098) / 0.156 - 1e-9) + 1)
        const Pc = (R - 0.098) / (nU - 1)
        const bord = (x0: number, v0: number, pid: string, navn: string, dark: number) => {
          const prof2: V2[] = [[x0, v0], [x0 + 0.098, v0], [x0 + 0.098, v0 + 0.021], [x0, v0 + 0.021]]
          add({ navn, profil: prof(21, 98), pris: 'bord-21x98', lengdeMm: stavLengde(prof2, s0, s1) * 1000, endeA: ende(a, 'gjaering', 'loddkutt'), endeB: ende(a, 'gjaering', 'loddkutt'), part: 'tak', pid, geom: plasser(prisme(prof2, s0, s1), basis(eU, X3, eV, O)), darken: dark, explode: new THREE.Vector3(0, 0.6, 0), kategori: 'tak' })
        }
        for (let i = 0; i < nU; i++) bord(-R / 2 + i * Pc, vB, `tak-u-${i}`, 'Takbord underligger', 0.85)
        for (let i = 0; i < nU - 1; i++) bord(-R / 2 + (i + 0.5) * Pc, vB + 0.021, `tak-o-${i}`, 'Takbord overligger', 1)
      }
    } else {
      const s0 = kuttPlan(O, eU, X3, eV, Z3, -D / 2 - OH)
      const s1 = kuttPlan(O, eU, X3, eV, Z3, D / 2 + OH)
      const lag = (navn: string, v0: number, tykk: number, pid: string, mat: THREE.Material) => {
        const prof2: V2[] = [[-W / 2 - OH, v0], [W / 2 + OH, v0], [W / 2 + OH, v0 + tykk], [-W / 2 - OH, v0 + tykk]]
        staver.push({ navn, profil: navn.includes('kryssfiner') ? '18 mm kryssfiner' : 'tekking', lengdeMm: stavLengde(prof2, s0, s1) * 1000, part: 'tak', pid, geom: plasser(prisme(prof2, s0, s1), basis(eU, X3, eV, O)), materiale: mat, ikkeKapp: true, explode: new THREE.Vector3(0, 0.6, 0) })
      }
      lag('Takplate (18 mm kryssfiner)', vT, 0.018, 'takplate', new THREE.MeshStandardMaterial({ color: 0xc9a46a, roughness: 0.85 }))
      lag(tekk === 'shingel' ? 'Shingel (tekking)' : 'Takpapp (tekking)', vT + 0.018, 0.004, 'tekking', new THREE.MeshStandardMaterial({ color: tekk === 'shingel' ? 0x3a3330 : 0x262626, roughness: 0.95 }))
    }
    // Kneband 45°
    const kbL = Math.min(0.5, (g.drBunnBak - y0) * 0.3)
    let kb = 0
    const kneband = (O2: V3, e1: V3, e2: V3, eT: V3, n0: V3, e0: number, n1: V3, e1v: number, pid: string) => {
      const s0 = kuttPlan(O2, e1, e2, eT, n0, e0)
      const s1 = kuttPlan(O2, e1, e2, eT, n1, e1v)
      const prof2: V2[] = [[0, -B / 2], [0.098, -B / 2], [0.098, B / 2], [0, B / 2]]
      add({ navn: 'Kneband', profil: K98, pris: 'stolpe-48x98', lengdeMm: stavLengde(prof2, s0, s1) * 1000, endeA: ende(45, 'gjaering'), endeB: ende(45, 'gjaering'), merknad: 'Avstiver taket mot vind. Bolt/skru 2 × 5×100 i hver ende.', part: 'kneband', pid, geom: plasser(prisme(prof2, s0, s1), basis(e1, e2, eT, O2)), darken: 0.9, kategori: 'konstruksjon' })
    }
    const s2 = Math.SQRT1_2
    zRows.forEach((zp, r) => {
      const dBunn = r === 0 ? g.drBunnBak : g.drBunnFront
      g.postX.forEach((xp) => {
        // Langs dragerne (x-retning), begge sider der det er plass.
        ;[-1, 1].forEach((dir) => {
          const utover = Math.abs(xp + dir * 0.01) > Math.abs(xp) && Math.abs(xp) > 0.01
          if (utover && c.harSidevegger) return
          // Utover under drager-utstikket: kortere kneband så det treffer dragerne.
          const L = utover ? Math.min(kbL, OH - P / 2 - 0.06) : kbL
          if (L < 0.15) return
          const xf = xp + dir * (P / 2)
          kneband([xf, dBunn - L, zp], [dir * s2, s2, 0], [-dir * s2, s2, 0], Z3, [dir, 0, 0], dir * xf, Y3, dBunn, `kb-${kb++}`)
        })
        // Inn mot midten (z-retning) til sperra over stolpen.
        const dz = r === 0 ? 1 : -1
        if (r === 0 && (c.harBakvegg || c.form !== 'rett') && Math.abs(xp) < g.lop[0].x1 + 0.05) return
        const zf = zp + dz * (P / 2)
        // Start så kneband treffer sperra etter kbL horisontalt (45°).
        const yStart = g.Yb(zf + dz * kbL) - kbL
        if (yStart > dBunn - 0.15) return
        const nS: V3 = [0, 1, -tan]
        const eS = g.Yb(0) // planet y − tan·z = Yb(0) (sperrenes underkant)
        kneband([xp, yStart, zf], [0, s2, dz * s2], [0, s2, -dz * s2], X3, [0, 0, dz], dz * zf, nS, eS, `kb-${kb++}`)
      })
    })
    // Sidevegger (liggende bord utenpå stolpene).
    if (c.harSidevegger) {
      const yS1 = Math.min(y0 + 1.8, g.drBunnBak - kbL - 0.05)
      const n = Math.max(2, Math.floor((yS1 - y0 - 0.1 + sp.gap) / (sp.w + sp.gap)))
      ;[-1, 1].forEach((sx) => {
        const x0 = sx > 0 ? W / 2 : -W / 2 - sp.t
        for (let i = 0; i < n; i++) {
          const ya = y0 + 0.1 + i * (sp.w + sp.gap)
          bjelke(`${sp.navn} (sidevegg)`, 'z', -D / 2, D / 2, [ya, ya + sp.w], [x0, x0 + sp.t], 'vegg', `sidevegg-${sx}-${i}`, sp.profil, sp.pris)
        }
      })
    }
    // Platting på justerbare føtter.
    if (g.ph > 0) {
      const hJ = 0.098
      const yJ1 = g.ph - 0.028
      const yJ0 = yJ1 - hJ
      const jx = stasjoner(-(W / 2 - P - 0.03 - B / 2), W / 2 - P - 0.03 - B / 2, 0.6).filter((x) => g.postX.length < 3 || Math.abs(x) > P / 2 + B / 2 + 0.03)
      if (g.postX.length === 3) jx.push(-(P / 2 + B / 2 + 0.02), P / 2 + B / 2 + 0.02)
      jx.sort((p, q) => p - q)
      const fotZ = stasjoner(-D / 2 + 0.15, D / 2 - 0.15, st.fotAvstand + 1e-6)
      jx.forEach((x, i) => {
        bjelke('Bjelkelag (platting)', 'z', -D / 2, D / 2, [yJ0, yJ1], [x - B / 2, x + B / 2], 'platting', `bjelke-${i}`, K98, 'stolpe-48x98')
        fotZ.forEach((z, k) => g.postX.some((px) => Math.abs(px - x) < 0.2) && Math.abs(Math.abs(z) - (D / 2 - P / 2)) < 0.2 ? undefined : staver.push({ navn: 'Justerbar terrassefot', profil: 'fot', lengdeMm: 0, part: 'fundament', pid: `fot-${i}-${k}`, geom: (() => { const gg = new THREE.CylinderGeometry(0.05, 0.07, yJ0, 16); gg.translate(x, yJ0 / 2, z); return gg })(), materiale: new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 }), ikkeKapp: true }))
      })
      const nB = Math.ceil((D + 0.004) / 0.124 - 1e-9)
      const bw = (D - (nB - 1) * 0.004) / nB
      for (let j = 0; j < nB; j++) {
        const z0 = -D / 2 + j * (bw + 0.004)
        const z1 = z0 + bw
        const iStolperad = z0 < -D / 2 + P || z1 > D / 2 - P
        const segs: Array<[number, number]> = !iStolperad ? [[-W / 2, W / 2]] : g.postX.length === 3 ? [[-W / 2 + P, -P / 2], [P / 2, W / 2 - P]] : [[-W / 2 + P, W / 2 - P]]
        segs.forEach(([a0, a1], si) => bjelke(bw < 0.1195 ? 'Terrassebord (kløyvd)' : 'Terrassebord', 'x', a0, a1, [yJ1, yJ1 + 0.028], [z0, z1], 'platting', `dekke-${j}-${si}`, prof(28, 120), 'terrassebord-28x120', iStolperad ? 'Kappes rundt stolpene.' : undefined, 1))
      }
    }
  }
  return { staver, g }
}

function lagGruppe(c: UtekjokkenConfig, mat: (pid: string, d?: number) => THREE.Material, opts?: BuildOptions) {
  const inner = new THREE.Group()
  const { staver, g } = konstruer(c, opts)
  byggMesher(inner, staver, mat)
  // Sentrer fotavtrykket i x/z.
  const bb = new THREE.Box3().setFromObject(inner)
  inner.position.set(-(bb.min.x + bb.max.x) / 2, 0, -(bb.min.z + bb.max.z) / 2)
  const group = new THREE.Group()
  group.add(inner)
  return { group, staver, g }
}

function buildMesh(c: UtekjokkenConfig, opts?: BuildOptions): THREE.Group {
  return lagGruppe(c, lagMatFabrikk(c.treslag, c.farge, opts), opts).group
}

function kappliste(c: UtekjokkenConfig): KapplisteDelPlan[] {
  return samleKappliste(konstruer(c).staver)
}

function fundamentering(c: UtekjokkenConfig, g: Geo) {
  const grunn = grunnForConfig(c)
  const frost = frostForConfig(c, { snofri: false }) // åpent under taket: naturlig snødekke rundt stolpene
  const vind = vindlast(VB0_STANDARD, 2, Math.max(2, g.Yt(g.D / 2)))
  const takA = (g.W + 2 * OH) * (g.D + 2 * OH)
  const nSt = g.postX.length * 2
  const G = takA * 0.35
  const oppdrift = vindOppdrift(vind.qp, takA, G, 1.2) / nSt
  const fund = dimensjonerPunktfundament({ NGk: G / nSt + 0.3, NQk: [{ type: 'sno', Nk: (snolastTak(g.st.sk.sk, g.a).s * takA) / nSt }], grunn, dybdeM: grunn === 'fjell' ? 0.3 : Math.max(0.8, frost.anbefaltDybdeM), oppdriftKN: Math.max(0, oppdrift) })
  return { frost, vind, oppdrift, fund, takA }
}

function beregn(c: UtekjokkenConfig): Bom {
  const faktor = TRESLAG[c.treslag]?.prisFaktor ?? 1
  const { staver, g } = konstruer(c)
  const lm = lmPerPris(staver)
  const linjer: BomLine[] = [...lm.entries()].map(([id, l]) => lmLinje(PRISER[id]?.navn ?? (id === 'terrassebord-28x145' ? 'Terrassebord 28×145 mm' : id), l, SVINN, { spesifikasjon: 'impregnert' }))
  let woodKr = 0
  lm.forEach((l, id) => (woodKr += l * (prisFor(id) || 36) * faktor))
  const plateLm = g.lop.reduce((s, l) => s + Math.max(l.x1 - l.x0, l.z1 - l.z0) + 0.05, 0)
  linjer.push({ navn: `Benkeplate ${benkeplateNavn(c.benkeplate)}`, spesifikasjon: `40 mm, ${c.benkedybde} cm dyp${c.harVask ? ', hull for vask' : ''}`, antall: Math.round(plateLm * 10) / 10, enhet: 'lm', kommentar: g.lop.length > 1 ? 'to deler, skjøtes i hjørnet' : undefined })
  let ekstra = plateLm * prisFor(c.benkeplate === 'rustfritt' ? 'benkeplate-rustfritt' : c.benkeplate === 'laminat' ? 'benkeplate-laminat' : 'benkeplate-tre')
  if (c.harVask) { linjer.push({ navn: PRISER['utslagsvask'].navn, spesifikasjon: 'nedfelt kum 400×340, vannlås', antall: 1, enhet: 'stk' }); ekstra += prisFor('utslagsvask') }
  if (c.harSkap) { linjer.push({ navn: PRISER['underskap'].navn, spesifikasjon: 'utendørs, 600 mm', antall: 1, enhet: 'stk' }); ekstra += prisFor('underskap') }
  const deler = staver.filter((s) => !s.ikkeKapp).length
  if (g.roofed) {
    const f = fundamentering(c, g)
    const nSt = g.postX.length * 2
    const tekk = tekkeAv(c)
    linjer.push({ navn: tekk === 'stal' ? 'Stålplater (takplater)' : tekk === 'bord' ? 'Bordtak – se kapplisten' : tekk === 'shingel' ? 'Kryssfiner 18 mm + shingel/underlag' : 'Kryssfiner 18 mm + takpapp', antall: Math.round((f.takA / g.cos) * 1.1 * 10) / 10, enhet: 'm²' })
    if (tekk !== 'bord') ekstra += (f.takA / g.cos) * 1.1 * (tekk === 'stal' ? prisFor('taktekke-stalplater') : prisFor('kryssfiner-18') + prisFor(tekk === 'shingel' ? 'taktekke-shingel' : 'taktekke-takpapp') * 0.6)
    linjer.push({ navn: 'Pilarrør Ø200 + betong', spesifikasjon: `${f0(Math.max(0.8, f.frost.anbefaltDybdeM) * 100)} cm dypt (frostfritt)`, antall: nSt, enhet: 'stk' })
    linjer.push({ navn: PRISER['stolpesko'].navn, antall: nSt, enhet: 'stk' })
    linjer.push({ navn: PRISER['vinkelbeslag'].navn, spesifikasjon: 'sperrebeslag', antall: staver.filter((s) => s.navn === 'Sperre').length * 2, enhet: 'stk' })
    ekstra += nSt * (prisFor('stolpesko') + 250) + staver.filter((s) => s.navn === 'Sperre').length * 2 * prisFor('vinkelbeslag')
    const fot = staver.filter((s) => s.navn === 'Justerbar terrassefot').length
    if (fot) { linjer.push({ navn: 'Justerbar terrassefot', spesifikasjon: 'på pukk/helle', antall: fot, enhet: 'stk' }); ekstra += fot * 60 }
  } else {
    const heller = staver.filter((s) => s.navn.startsWith('Helle')).length
    linjer.push({ navn: 'Betonghelle 200×200 (under bein)', antall: heller, enhet: 'stk' })
    ekstra += heller * 30
  }
  const skruer = Math.ceil((deler * 4 + 60) / 50) * 50
  linjer.push({ navn: 'Skruer', spesifikasjon: 'rustfri A4, 5,0×90 (ramme) og 4,5×50 (spiler/bord)', antall: skruer, enhet: 'stk' })
  ekstra += skruer * prisFor('skrue')
  const estimatKr = Math.round((woodKr * SVINN + ekstra) / 10) * 10
  const formNavn = c.form === 'l-hoyre' ? 'L-form (høyre)' : c.form === 'l-venstre' ? 'L-form (venstre)' : 'Rett'
  const utstyr = [c.harVask && 'vask', c.harSkap && 'skap', c.harBakvegg && 'bakvegg', g.roofed && c.harSidevegger && 'sidevegger'].filter(Boolean).join(', ')
  return {
    linjer,
    estimatKr,
    sammendrag: `${formNavn} · ${c.bredde} cm${g.roofed ? ` · overbygd ${c.taktype === 'flatt' ? 'flatt tak' : `pulttak ${fmt(g.a, 0)}°`}` : ' · uten tak'} · ${benkeplateNavn(c.benkeplate)} benkeplate${utstyr ? ` · ${utstyr}` : ''}`,
    arealM2: g.roofed ? Math.round(((g.W + 2 * OH) * (g.D + 2 * OH)) * 10) / 10 : Math.round(g.lop.reduce((s, l) => s + (l.x1 - l.x0) * (l.z1 - l.z0), 0) * 10) / 10,
    maal: g.roofed ? `${c.bredde} × ${c.dybde} cm` : `${c.bredde} × ${c.form === 'rett' ? c.benkedybde : Math.max(c.benkedybde, c.sidelengde)} cm`,
    arbeidstimer: Math.round((8 + deler * 0.08) * 2) / 2,
  }
}

function beregningsgrunnlag(c: UtekjokkenConfig): Beregningsgrunnlag {
  const g = geo(c)
  const st = g.st
  const deler: Record<string, Medlemskontroll> = { 'Langramme benk': st.rail, Benkebein: st.bein }
  if (st.hylle) deler.Hyllebord = st.hylle
  if (st.sperre) deler.Sperre = st.sperre
  if (st.drager) deler.Drager = st.drager
  if (st.stolpe) deler.Stolpe = st.stolpe
  if (st.bjelke) deler['Bjelkelag platting'] = st.bjelke
  const f = g.roofed ? fundamentering(c, g) : undefined
  const topp = g.roofed ? g.Yt(g.D / 2) + 0.05 : g.skjermTopp
  return tilPlanVedlegg(
    lagBeregningsrapport({
      produkt: 'utekjokken',
      tittel: g.roofed ? 'Utekjøkken – benk, tak, stolper og fundament' : 'Utekjøkken – benk',
      snolast: g.roofed ? { mark: st.sk, tak: snolastTak(st.sk.sk, g.a) } : undefined,
      vind: f?.vind,
      forutsetninger: [
        { navn: 'Nyttelast benkeplate', verdi: '2,0 kN/m² + 1,5 kN punktlast (grill/pizzaovn)', kilde: 'Valgt (kat. A, konservativt)' },
        ...(g.roofed ? [{ navn: 'Takvinkel', verdi: fmt(g.a, 1), enhet: '°' }, { navn: 'Grunn ved fundamentene', verdi: GRUNN[grunnForConfig(c)].navn, kilde: grunnForConfig(c) === 'ukjent' ? 'Ikke oppgitt – konservativ antakelse (Byggested)' : 'Valgt i Byggested – kontroller på tomta', usikker: true }, { navn: 'Frostsone', verdi: FROSTSONER[frostsoneForConfig(c).sone].navn, kilde: frostsoneForConfig(c).merknad, usikker: true }] : []),
      ],
      deler,
      frost: f?.frost,
      fundament: f?.fund,
      byggesak: vurderByggesak(g.roofed ? { tiltak: 'frittliggende', byaM2: f?.takA ?? 0, moneHoydeM: topp, gesimsHoydeM: topp } : { tiltak: 'smatiltak', byaM2: 0 }),
      merknader: [
        ...(g.roofed ? [`Netto vindoppløft per stolpe ca. ${fmt(Math.max(0, f?.oppdrift ?? 0), 2)} kN (åpent tak, cp,net 1,2) – stolpeskoen må være innstøpt, og sperrebeslag i hver sperreende.`, 'Kneband 45° i begge retninger ved hver stolpe avstiver taket.'] : []),
        'Benkeplata er ikke beregnet – følg leverandørens anvisning for spenn mellom tverrliggerne (her ≤ 60 cm).',
        'Hold 1 m fri avstand fra grill/ildsted til brennbart materiale, og følg grillprodusentens avstandskrav.',
      ],
      ekstraAdvarsler: st.melding,
    }),
  )
}

function byggeregler(c: UtekjokkenConfig): Byggeregler {
  const g = geo(c)
  if (!g.roofed) {
    return { sokfri: true, tittel: 'Ikke søknadspliktig', punkter: ['Et utekjøkken uten tak er en innretning, ikke en bygning – det er ikke søknadspliktig.', 'Grill og ildsted: hold avstand til husvegg og brennbart materiale etter produsentens krav (ofte 1 m).', 'Vask med avløp: avløpet skal føres til godkjent avløp eller infiltrasjon – sjekk med kommunen.'] }
  }
  const topp = g.Yt(g.D / 2) + 0.05
  const r = vurderByggesak({ tiltak: 'frittliggende', byaM2: (g.W + 2 * OH) * (g.D + 2 * OH), moneHoydeM: topp, gesimsHoydeM: topp })
  const b = tilByggeregler(r)
  return { ...b, punkter: [...b.punkter, 'Overbygd utekjøkken regnes som en frittliggende bygning (takets areal teller i BYA). Står det inntil boligen, gjelder reglene for tilbygg (maks 15 m²).', g.ph > 0.5 ? 'Plattingen er over 0,5 m – rekkverk kreves.' : `Plattingen er ${f0(g.ph * 100)} cm over terreng – under 0,5 m, rekkverk kreves ikke.`] }
}

function monteringPlan(c: UtekjokkenConfig): MonteringSteg[] {
  const g = geo(c)
  const st = g.st
  const steg: MonteringSteg[] = []
  if (g.roofed) {
    const f = fundamentering(c, g)
    steg.push({ tittel: 'Fundamenter', trinn: 'fundament', tekst: `Sett ut ${g.postX.length * 2} stolpepunkter (c/c ${f0((g.W - st.P) / (g.postX.length - 1) * 100)} × ${f0((g.D - st.P) * 100)} cm) og kontroller diagonalene. Grav til ${f0(Math.max(0.8, f.frost.anbefaltDybdeM) * 100)} cm, sett pilarrør Ø200 på pukk og støp med stolpesko 5 cm over terreng.`, verktoy: ['Snor', 'Vater/laser', 'Jordbor'], tidTimer: 4 })
    if (g.ph > 0) steg.push({ tittel: 'Platting', trinn: 'bjelkelag', tekst: `Sett justerbare terrassefoter på pukk (c/c ${f0(st.fotAvstand * 100)} cm), legg bjelkelaget 48×98 c/c ≤ 60 cm i vater og skru terrassebordene med 4 mm luft. Bordene kappes rundt stolpene.`, tidTimer: 5 })
    steg.push({ tittel: 'Stolper og dragere', trinn: 'reisverk', tekst: `Reis stolpene (${prof(Math.round(st.P * 1000), Math.round(st.P * 1000))}), skråhøvle dragerne (2 × 48×${f0(st.hD * 1000)}) ${fmtGrader(g.a)} og legg dem på stolpene – fronten er høyest. Skru kneband 45° i begge retninger.`, tidTimer: 4 })
    steg.push({ tittel: 'Sperrer og tekking', trinn: 'tak', tekst: `Legg sperrene (48×${f0(st.hS * 1000)}) c/c ≤ 60 cm med ${f0(OH * 100)} cm utstikk og loddkutt ${fmtGrader(g.a)}, fest med sperrebeslag. Tekk med ${tekkeAv(c) === 'stal' ? 'stålplater på lekter 36×48 c/c 60' : tekkeAv(c) === 'bord' ? 'over/underligger på lekter' : tekkeAv(c) === 'shingel' ? 'kryssfiner, underlagsbelegg og shingel' : 'kryssfiner og takpapp'}.`, tidTimer: 5 })
    if (c.harSidevegger) steg.push({ tittel: 'Sidevegger', trinn: 'kledning', tekst: `Skru liggende ${g.sk.profil} utenpå stolpene på sidene.`, tidTimer: 2 })
  } else {
    steg.push({ tittel: 'Underlag', trinn: 'fundament', tekst: 'Avrett et drenert underlag (pukk/grus) og legg betonghelle under hvert bein, i vater.', tidTimer: 1.5 })
  }
  steg.push({ tittel: 'Benkeramme', trinn: g.roofed ? 'kledning' : 'reisverk', tekst: `Kapp bein og rammer (48×98) etter kapplista. Bein i hver stasjon (c/c ≤ 120 cm), langrammer oppå beina og tverrliggere c/c ≤ 60 cm, slik at overkant ramme blir ${f0((g.yTop - TP - g.y0) * 100)} cm over gulvet.${c.hyller > 0 ? ` Skru hyllebærere og legg ${c.hyller} hylle(r) av terrassebord.` : ''}`, tidTimer: 4 })
  steg.push({ tittel: 'Kledning', trinn: 'kledning', tekst: `Kle endene og baksiden med stående ${g.sk.profil}${g.sk.gap > 0.005 ? ` med ${f0(g.sk.gap * 1000)} mm luft` : ''}.${c.harBakvegg ? ' Reis skjermstolpene bak benken og skru liggende spiler og topphylle.' : ''}`, tidTimer: 3 })
  steg.push({ tittel: 'Benkeplate og utstyr', trinn: 'ferdig', tekst: `Legg ${benkeplateNavn(c.benkeplate)} benkeplate (40 mm) med 3 cm utstikk foran${c.harVask ? ', skjær ut hull for vasken og monter kum, kran og avløp med vannlås' : ''}${c.harSkap ? '. Sett inn underskapet i høyre fag' : ''}.`, tidTimer: 3, advarsel: c.harVask ? 'Vannet må kunne tømmes før frosten.' : undefined })
  return steg
}

// ── 2D-tegning (fra samme 3D-geometri) ──────────────────────────────

function tegning2D(c: UtekjokkenConfig): Tegning2D {
  const { group, g, staver } = lagGruppe(c, () => new THREE.MeshBasicMaterial())
  group.updateMatrixWorld(true)
  const bb = new THREE.Box3().setFromObject(group)
  const off = (group.children[0] as THREE.Group).position
  const cmv = (m: number) => Math.round(m * 1000) / 10
  const Ht = cmv(bb.max.y)
  const W = cmv(bb.max.x - bb.min.x)
  const D = cmv(bb.max.z - bb.min.z)
  const xv = (x: number) => cmv(x + off.x - bb.min.x)
  const zv = (z: number) => cmv(z + off.z - bb.min.z)
  const yv = (y: number) => Ht - cmv(y)
  const rekt = (navn: string) => staver.filter((s) => s.navn.startsWith(navn)).map((s) => { s.geom.computeBoundingBox(); return s.geom.boundingBox as THREE.Box3 })
  const fasade = (side: 'x' | 'z'): Tegning2D['riss'][number]['former'] => {
    const ut: Tegning2D['riss'][number]['former'] = []
    const h = (b: THREE.Box3, tynn = false, dashed = false) => ut.push(side === 'x' ? { type: 'rect', x: xv(b.min.x), y: yv(b.max.y), w: cmv(b.max.x - b.min.x), h: cmv(b.max.y - b.min.y), tynn, dashed } : { type: 'rect', x: zv(b.min.z), y: yv(b.max.y), w: cmv(b.max.z - b.min.z), h: cmv(b.max.y - b.min.y), tynn, dashed })
    rekt('Benkeplate').forEach((b) => h(b))
    rekt('Benkebein').forEach((b) => h(b, true))
    rekt('Stolpe').forEach((b) => h(b))
    rekt('Drager').forEach((b) => h(b))
    rekt('Skjermstolpe').forEach((b) => h(b, true))
    rekt('Topphylle').forEach((b) => h(b, true))
    rekt('Underskap').forEach((b) => h(b, false, true))
    rekt('Terrassebord').slice(0, 1).forEach((b) => h(b, true))
    return ut
  }
  const forfra = fasade('x')
  const siden = fasade('z')
  if (g.roofed) {
    // Takflaten sett fra siden.
    const zs = [-g.D / 2 - OH, g.D / 2 + OH]
    siden.push({ type: 'poly', points: [[zv(zs[0]), yv(g.Yt(zs[0]) + 0.04)], [zv(zs[1]), yv(g.Yt(zs[1]) + 0.04)], [zv(zs[1]), yv(g.Yb(zs[1]))], [zv(zs[0]), yv(g.Yb(zs[0]))], [zv(zs[0]), yv(g.Yt(zs[0]) + 0.04)]] })
    forfra.push({ type: 'rect', x: 0, y: yv(g.Yt(g.D / 2 + OH) + 0.04), w: W, h: cmv(g.Yt(g.D / 2 + OH) + 0.04 - g.Yb(-g.D / 2 - OH)), tynn: true })
  }
  const plan: Tegning2D['riss'][number]['former'] = [{ type: 'rect', x: 0, y: 0, w: W, h: D, dashed: true }]
  rekt('Benkeplate').forEach((b) => plan.push({ type: 'rect', x: xv(b.min.x), y: zv(b.min.z), w: cmv(b.max.x - b.min.x), h: cmv(b.max.z - b.min.z) }))
  rekt('Stolpe').forEach((b) => plan.push({ type: 'rect', x: xv(b.min.x), y: zv(b.min.z), w: cmv(b.max.x - b.min.x), h: cmv(b.max.z - b.min.z), tynn: true }))
  rekt('Utslagsvask').forEach((b) => plan.push({ type: 'rect', x: xv(b.min.x), y: zv(b.min.z), w: cmv(b.max.x - b.min.x), h: cmv(b.max.z - b.min.z), dashed: true }))
  return {
    riss: [
      { id: 'forfra', navn: 'Forfra', type: 'fasade', bredde: W, hoyde: Ht, former: forfra, maal: [{ x1: 0, y1: Ht, x2: W, y2: Ht, label: `${f0(W)} cm`, offset: 24 }, { x1: W, y1: yv(g.yTop), x2: W, y2: yv(g.y0), label: `${c.benkehoyde} cm`, offset: 20 }, ...(g.roofed ? [{ x1: 0, y1: yv(g.drBunnBak), x2: 0, y2: yv(g.y0), label: `${c.hoyde} cm`, offset: -20 }] : [])] },
      { id: 'siden', navn: 'Fra siden', type: g.roofed ? 'snitt' : 'fasade', bredde: D, hoyde: Ht, former: siden, maal: [{ x1: 0, y1: Ht, x2: D, y2: Ht, label: `${f0(D)} cm`, offset: 24 }], tekster: g.roofed ? [{ x: D * 0.4, y: 4, tekst: fmtGrader(g.a) }] : undefined },
      { id: 'plan', navn: 'Ovenfra (plan)', type: 'plan', bredde: W, hoyde: D, former: plan, maal: [{ x1: 0, y1: D, x2: W, y2: D, label: `${f0(W)} cm`, offset: 20 }, { x1: 0, y1: 0, x2: 0, y2: D, label: `${f0(D)} cm`, offset: -20 }] },
    ],
  }
}

// ── Template ─────────────────────────────────────────────────────────

export const utekjokken: ProductTemplate<UtekjokkenConfig> & {
  beregningsgrunnlag: (c: UtekjokkenConfig) => Beregningsgrunnlag
  monteringPlan: (c: UtekjokkenConfig) => MonteringSteg[]
} = {
  id: 'utekjokken',
  navn: 'Utekjøkken',
  ikon: 'faKitchenSet',
  beskrivelse: 'Tegn utekjøkkenet i 3D – fra enkel benk til stort overbygd kjøkken. Rett eller L-form, benkeplate, vask, skap, hyller og bakvegg. Taket dimensjoneres for snø, og byggeplanen har kappliste og montering steg for steg.',
  bilde: '/images/products/utekjokken-3d.webp',
  tilgjengelig: true,
  fraPris: 349,
  leveranser: ['plan'],
  defaultConfig: {
    form: 'rett',
    bredde: 280,
    benkedybde: 65,
    dybde: 220,
    sidelengde: 180,
    hoyde: 220,
    taktype: 'ingen',
    takvinkel: 8,
    taktekke: 'stålplater',
    plattformHoyde: 0,
    benkehoyde: 90,
    benkeplate: 'tre',
    hyller: 1,
    virke: '23x48',
    harVask: true,
    harSkap: true,
    harBenk: false,
    harBakvegg: true,
    harSidevegger: false,
    treslag: 'impregnert',
    farge: 'ubehandlet',
  },
  presets: [
    { id: 'enkel', navn: 'Enkel benk', beskrivelse: 'Spilebenk med to hyller', config: { form: 'rett', bredde: 200, benkedybde: 60, taktype: 'ingen', harVask: false, harSkap: false, harBakvegg: false, hyller: 2, benkeplate: 'tre' } },
    { id: 'vask', navn: 'Benk med vask', beskrivelse: 'Vask og sprutvegg', config: { form: 'rett', bredde: 240, benkedybde: 65, taktype: 'ingen', harVask: true, harSkap: false, harBakvegg: true, hyller: 1 } },
    { id: 'grill', navn: 'Grillstasjon', beskrivelse: 'Rustfri plate + skap', config: { form: 'rett', bredde: 300, benkedybde: 70, taktype: 'ingen', harVask: false, harSkap: true, harBakvegg: true, hyller: 1, benkeplate: 'rustfritt', virke: '21x98' } },
    { id: 'l-form', navn: 'L-kjøkken', beskrivelse: 'Hjørne med retur', config: { form: 'l-hoyre', bredde: 320, benkedybde: 65, sidelengde: 160, taktype: 'ingen', harVask: true, harSkap: true, harBakvegg: true, hyller: 1 } },
    { id: 'overbygd', navn: 'Overbygd', beskrivelse: 'Pulttak, platting og sidevegger', config: { form: 'rett', bredde: 320, benkedybde: 65, dybde: 220, hoyde: 220, taktype: 'pulttak', takvinkel: 8, taktekke: 'stålplater', plattformHoyde: 20, harVask: true, harSkap: true, harBakvegg: true, harSidevegger: true, harBenk: true, hyller: 2 } },
    { id: 'xl', navn: 'Selskapskjøkken XL', beskrivelse: 'L-form under tak, rustfritt', config: { form: 'l-hoyre', bredde: 420, benkedybde: 70, dybde: 300, sidelengde: 200, hoyde: 230, taktype: 'pulttak', takvinkel: 10, taktekke: 'shingel', plattformHoyde: 20, harVask: true, harSkap: true, harBakvegg: true, harSidevegger: false, hyller: 2, benkeplate: 'rustfritt', virke: '21x98' } },
  ],
  dimensjoner: [
    { key: 'bredde', label: 'Bredde', min: 150, max: 600, step: 10, axis: 'x' },
    { key: 'benkehoyde', label: 'Benkehøyde', min: 80, max: 100, step: 1, axis: 'y', markers: [85, 90, 95] },
    { key: 'benkedybde', label: 'Benkedybde', min: 55, max: 90, step: 5, axis: 'z' },
    { key: 'sidelengde', label: 'L-arm lengde', min: 100, max: 350, step: 10, axis: 'z', handle: false, visibleWhen: (c) => c.form !== 'rett' },
    { key: 'hoyde', label: 'Fri høyde under tak', min: 200, max: 280, step: 5, axis: 'y', handle: false, visibleWhen: (c) => c.taktype !== 'ingen' },
    { key: 'dybde', label: 'Takdybde', min: 160, max: 350, step: 10, axis: 'z', handle: false, visibleWhen: (c) => c.taktype !== 'ingen' },
    { key: 'plattformHoyde', label: 'Platting (0 = ingen)', min: 0, max: 50, step: 5, axis: 'y', handle: false, visibleWhen: (c) => c.taktype !== 'ingen' },
    { key: 'takvinkel', label: 'Takvinkel', min: 3, max: 30, step: 1, unit: '°', axis: 'y', handle: false, visibleWhen: (c) => c.taktype === 'pulttak', markers: [5, 8, 12, 20] },
    { key: 'hyller', label: 'Antall hyller', min: 0, max: 3, step: 1, unit: 'stk', axis: 'y', handle: false },
  ],
  materialer: [
    { key: 'treslag', label: 'Treslag', choices: treslagValg(['impregnert', 'gran', 'royal', 'lerk', 'kebony']) },
    { key: 'farge', label: 'Farge / beis', asSwatches: true, choices: fargeValg(['ubehandlet', 'klar', 'hvit', 'lysgra', 'morkegra', 'sort', 'brun', 'gronn']) },
  ],
  alternativer: [
    { key: 'form', label: 'Form', choices: [{ id: 'rett', label: 'Rett', note: 'Benk langs én side.' }, { id: 'l-hoyre', label: 'L – høyre', note: 'Retur mot høyre.' }, { id: 'l-venstre', label: 'L – venstre', note: 'Retur mot venstre.' }] },
    { key: 'taktype', label: 'Tak', choices: [{ id: 'ingen', label: 'Uten tak', note: 'Frittstående benk.' }, { id: 'flatt', label: 'Flatt', note: 'Overbygd, 2° fall bakover.' }, { id: 'pulttak', label: 'Pulttak', note: 'Overbygd, fall bakover.' }] },
    { key: 'taktekke', label: 'Taktekke', visibleWhen: (c) => c.taktype !== 'ingen', choices: [{ id: 'stålplater', label: 'Stålplater', note: 'Min. ca. 7° fall.' }, { id: 'bord', label: 'Bordtak', note: 'Min. ca. 15° fall.' }, { id: 'shingel', label: 'Shingel', note: 'Min. 15° fall.' }, { id: 'takpapp', label: 'Takpapp', note: 'Også for flatt tak.' }] },
    { key: 'benkeplate', label: 'Benkeplate', choices: [{ id: 'tre', label: 'Heltre' }, { id: 'laminat', label: 'Laminat' }, { id: 'rustfritt', label: 'Rustfritt' }] },
    { key: 'virke', label: 'Kledning (spiler)', choices: [{ id: '23x48', label: 'Spiler 23 × 48' }, { id: '36x63', label: 'Spiler 36 × 63' }, { id: '21x98', label: 'Tette bord 21 × 98' }] },
  ],
  valg: [
    { key: 'harVask', label: 'Vask', note: 'Nedfelt kum med kran og avløp.' },
    { key: 'harSkap', label: 'Underskap', note: 'Lukket skap (600 mm) i enden uten L-arm.' },
    { key: 'harBakvegg', label: 'Bakvegg', note: 'Sprutvegg med topphylle.' },
    { key: 'harSidevegger', label: 'Sidevegger', note: 'Liggende bord for le (med tak).' },
    { key: 'harBenk', label: 'Sittebenk', note: 'Langs siden (med tak, rett benk).' },
  ],
  parts: [
    { key: 'benk', label: 'Benk og innredning' },
    { key: 'vegg', label: 'Vegger' },
    { key: 'stolpe', label: 'Stolper' },
    { key: 'drager', label: 'Dragere' },
    { key: 'kneband', label: 'Kneband' },
    { key: 'spaer', label: 'Sperrer' },
    { key: 'tak', label: 'Tak' },
    { key: 'platting', label: 'Platting' },
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
      ...g.st.melding,
      'Bruk rustfrie (A4) skruer og beslag, og forbor i endene så virket ikke sprekker.',
      'Hold endeveden på bein og stolper fri fra bakken (helle eller stolpesko) – da råtner de ikke.',
      `Benkeplate i ${benkeplateNavn(c.benkeplate)}${c.benkeplate === 'tre' ? ' må oljes jevnlig med benkeplateolje' : c.benkeplate === 'laminat' ? ' må være beregnet for utendørs bruk, og kantene forsegles' : ' tåler varme og er lettest å holde rent'}.`,
      c.harVask ? 'Avløp: før til godkjent avløp eller infiltrasjon. Steng og tøm vannet før frosten.' : 'Planlegg vann/avløp nå selv om du venter med vasken – legg trekkerør.',
      'Grill og pizzaovn: følg produsentens avstandskrav til brennbart materiale (ofte 1 m), og bruk ubrennbar plate under.',
    ]
    if (g.roofed) {
      const t = tekkeAv(c)
      if (t === 'stal' && g.a < 7) r.unshift(`Stålplater trenger normalt minst ca. 7° fall – ${fmt(g.a, 0)}° er for lite. Velg takpapp eller øk vinkelen.`)
      if ((t === 'shingel' || t === 'bord') && g.a < 15) r.unshift(`${t === 'shingel' ? 'Shingel' : 'Bordtak'} trenger minst 15° fall – velg takpapp eller øk vinkelen.`)
      if (c.taktype === 'flatt' && c.taktekke !== 'takpapp') r.unshift('Flatt tak (2°) tekkes med takpapp – valgt tekking er byttet til takpapp i planen.')
      r.push('Taket står på frostsikre fundamenter med kneband i begge retninger. Sperrebeslag i alle sperreender holder taket mot vindsug.')
    }
    return r
  },
  buildMesh,
  bounds: (c) => {
    const { group } = lagGruppe(c, () => new THREE.MeshBasicMaterial())
    const s = new THREE.Box3().setFromObject(group).getSize(new THREE.Vector3())
    return { x: s.x, y: s.y, z: s.z }
  },
}
