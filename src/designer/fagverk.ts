/**
 * Takstoler (fagverk) – analyse og kontroll etter NS-EN 1995-1-1 (EC5).
 *
 * Kjernemodul (ingen three.js), flyttet hit fra templates/felles-fagverk.ts
 * (som re-eksporterer). En takstol er et fagverk der overgurten får både
 * aksialkraft og bøying. Her:
 *
 *  1. `losFagverk` – 2D stivhetsmetode for leddede staver (N, mm). Gir
 *     stavkrefter (strekk +) og nodeforskyvninger (til nedbøyning).
 *  2. `dimensjonerTakstol` – Fink-/W-takstol (saltak) eller pulttakstol
 *     (enkeltfall, Pratt med loddrette staver). Velger minste C24-gurter og
 *     -staver som består alle kontroller, og returnerer kjernens
 *     `Dimensjonering`-format så resultatet går rett inn i beregningsvedlegget.
 *
 * Kontroller (konservativt, skrives ut i forutsetningene):
 *  - Overgurt: aksialkraft fra fagverket + lokalt moment q·a²/8 i hvert felt
 *    (og utkragende moment q·o²/2 ved utstikk). Trykk + bøying EC5 6.23
 *    (k_c i takplanet; ut av planet avstivet av lekter/takplater) og 6.19,
 *    strekk + bøying 6.17, skjær 6.13.
 *  - Undergurt: strekk (6.1) og trykk ⊥ ved opplegg (6.1.5, k_c,90 = 1,0).
 *  - Staver: knekking om svak akse (l_ef = stavlengde, ingen avstivning) /
 *    strekk.
 *  - Nedbøyning: fra fagverksanalysen × glidefaktor 1,5 for spikerplate-
 *    forbindelser; L/300 (snø) og L/200 (slutt, k_def).
 * Spikerplateforbindelsene dimensjoneres av takstolprodusent/platelevrandør.
 */
import { KCR, KDEF, KMOD, MATERIALER, knekkfaktor, tverrsnitt } from './dimensjonering'
import type { Delkontroll, Dimensjonering, Flatelast, Medlemskontroll, Tjenesteklasse, Tverrsnitt } from './dimensjonering'
import { LASTFAKTOR, LASTTYPER, TRE_TYNGDETETTHET, fmt } from './laster'

// ── 2D fagverk ─────────────────────────────────────────────────────

export interface FNode {
  x: number
  y: number
  /** Fastholdt i x / y. */
  fx?: boolean
  fy?: boolean
}
export interface FStav {
  a: number
  b: number
  /** Aksialstivhet E·A (N). */
  EA: number
}

/** Løs leddet 2D-fagverk. Laster i N på noder: [node, Fx, Fy]. Returnerer N (strekk +) og forskyvninger (mm). */
export function losFagverk(noder: FNode[], staver: FStav[], laster: Array<[number, number, number]>): { N: number[]; u: Array<[number, number]> } {
  const n = noder.length * 2
  const K: number[][] = Array.from({ length: n }, () => new Array(n).fill(0))
  const F = new Array(n).fill(0)
  for (const s of staver) {
    const A = noder[s.a]
    const B = noder[s.b]
    const dx = B.x - A.x
    const dy = B.y - A.y
    const L = Math.hypot(dx, dy)
    const c = dx / L
    const sn = dy / L
    const k = s.EA / L
    const m = [c * c, c * sn, sn * sn]
    const idx = [2 * s.a, 2 * s.a + 1, 2 * s.b, 2 * s.b + 1]
    const ke = [
      [m[0], m[1], -m[0], -m[1]],
      [m[1], m[2], -m[1], -m[2]],
      [-m[0], -m[1], m[0], m[1]],
      [-m[1], -m[2], m[1], m[2]],
    ]
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) K[idx[i]][idx[j]] += k * ke[i][j]
  }
  for (const [nd, fx, fy] of laster) {
    F[2 * nd] += fx
    F[2 * nd + 1] += fy
  }
  // Randbetingelser: stor fjær (penalty) på fastholdte frihetsgrader.
  const stor = 1e12
  noder.forEach((nd, i) => {
    if (nd.fx) K[2 * i][2 * i] += stor
    if (nd.fy) K[2 * i + 1][2 * i + 1] += stor
  })
  const u = gauss(K, F)
  const N = staver.map((s) => {
    const A = noder[s.a]
    const B = noder[s.b]
    const dx = B.x - A.x
    const dy = B.y - A.y
    const L = Math.hypot(dx, dy)
    const du = (u[2 * s.b] - u[2 * s.a]) * (dx / L) + (u[2 * s.b + 1] - u[2 * s.a + 1]) * (dy / L)
    return (s.EA / L) * du
  })
  return { N, u: noder.map((_, i) => [u[2 * i], u[2 * i + 1]] as [number, number]) }
}

function gauss(A0: number[][], b0: number[]): number[] {
  const n = b0.length
  const A = A0.map((r) => r.slice())
  const b = b0.slice()
  for (let k = 0; k < n; k++) {
    let p = k
    for (let i = k + 1; i < n; i++) if (Math.abs(A[i][k]) > Math.abs(A[p][k])) p = i
    ;[A[k], A[p]] = [A[p], A[k]]
    ;[b[k], b[p]] = [b[p], b[k]]
    const piv = A[k][k] || 1e-30
    for (let i = k + 1; i < n; i++) {
      const f = A[i][k] / piv
      if (f === 0) continue
      for (let j = k; j < n; j++) A[i][j] -= f * A[k][j]
      b[i] -= f * b[k]
    }
  }
  const x = new Array(n).fill(0)
  for (let i = n - 1; i >= 0; i--) {
    let s = b[i]
    for (let j = i + 1; j < n; j++) s -= A[i][j] * x[j]
    x[i] = s / (A[i][i] || 1e-30)
  }
  return x
}

// ── Takstol-geometri ───────────────────────────────────────────────

export type TakstolType = 'fink' | 'pult'

export interface TakstolGeometri {
  type: TakstolType
  /** Analysemodell (systemlinjer), mm. x = 0 i ytterliv opplegg (hæl), y = 0 i undergurtens systemlinje. */
  noder: Array<{ x: number; y: number }>
  staver: Array<{ a: number; b: number; rolle: 'over' | 'under' | 'stav' }>
  /** Noder i overgurten (fra hæl til topp/høy ende) – til lastfordeling. */
  overNoder: number[]
  /** Noder i undergurten. */
  underNoder: number[]
  /** Opplegg (node-indekser). */
  opplegg: [number, number]
  /** Toppnode (møne / høy ende). */
  topp: number
}

/**
 * Fink/W (saltak): hæl–Q1–møne–Q2–hæl, undergurt-noder i 1/3-punktene.
 * Pult (enkeltfall): n felt med loddrette staver og diagonaler (Pratt).
 */
export function takstolGeometri(type: TakstolType, spennMm: number, vinkelGrader: number): TakstolGeometri {
  const t = Math.tan((vinkelGrader * Math.PI) / 180)
  const S = spennMm
  if (type === 'fink') {
    const noder = [
      { x: 0, y: 0 }, // 0 hæl v
      { x: S / 4, y: (S / 4) * t }, // 1 Q1
      { x: S / 2, y: (S / 2) * t }, // 2 møne
      { x: (3 * S) / 4, y: (S / 4) * t }, // 3 Q2
      { x: S, y: 0 }, // 4 hæl h
      { x: S / 3, y: 0 }, // 5 T1
      { x: (2 * S) / 3, y: 0 }, // 6 T2
    ]
    const staver: TakstolGeometri['staver'] = [
      { a: 0, b: 1, rolle: 'over' },
      { a: 1, b: 2, rolle: 'over' },
      { a: 2, b: 3, rolle: 'over' },
      { a: 3, b: 4, rolle: 'over' },
      { a: 0, b: 5, rolle: 'under' },
      { a: 5, b: 6, rolle: 'under' },
      { a: 6, b: 4, rolle: 'under' },
      { a: 1, b: 5, rolle: 'stav' },
      { a: 5, b: 2, rolle: 'stav' },
      { a: 2, b: 6, rolle: 'stav' },
      { a: 6, b: 3, rolle: 'stav' },
    ]
    return { type, noder, staver, overNoder: [0, 1, 2, 3, 4], underNoder: [0, 5, 6, 4], opplegg: [0, 4], topp: 2 }
  }
  // Pulttakstol: høy ende ved x = S, loddrett endestav.
  const nf = Math.max(2, Math.ceil(S / 1500 - 1e-9))
  const noder: Array<{ x: number; y: number }> = [{ x: 0, y: 0 }]
  for (let i = 1; i <= nf; i++) noder.push({ x: (i * S) / nf, y: 0 }) // B1..Bn: 1..nf
  for (let i = 1; i <= nf; i++) noder.push({ x: (i * S) / nf, y: ((i * S) / nf) * t }) // T1..Tn: nf+1..2nf
  const B = (i: number) => (i === 0 ? 0 : i)
  const T = (i: number) => (i === 0 ? 0 : nf + i)
  const staver: TakstolGeometri['staver'] = []
  for (let i = 0; i < nf; i++) staver.push({ a: B(i), b: B(i + 1), rolle: 'under' })
  for (let i = 0; i < nf; i++) staver.push({ a: T(i), b: T(i + 1), rolle: 'over' })
  for (let i = 1; i <= nf; i++) staver.push({ a: B(i), b: T(i), rolle: 'stav' })
  for (let i = 1; i < nf; i++) staver.push({ a: T(i), b: B(i + 1), rolle: 'stav' })
  return { type, noder, staver, overNoder: [0, ...Array.from({ length: nf }, (_, i) => T(i + 1))], underNoder: [0, ...Array.from({ length: nf }, (_, i) => B(i + 1))], opplegg: [0, nf], topp: T(nf) }
}

// ── Dimensjonering ─────────────────────────────────────────────────

export interface TakstolInput {
  type: TakstolType
  /** Ytterliv–ytterliv opplegg (undergurtens lengde), mm. */
  spennMm: number
  vinkelGrader: number
  /** Horisontalt utstikk forbi hælen (lav side / begge sider for Fink), mm. */
  utstikkMm: number
  /** Pult: utstikk forbi høy ende, mm. */
  hoyUtstikkMm?: number
  ccM: number
  /** Taklaster per m² horisontal projeksjon (fra `taklaster`). */
  flatelaster: Flatelast[]
  tjenesteklasse?: Tjenesteklasse
  /** Oppleggsbredde under undergurten (svill/drager), mm. */
  opplegglengdeMm: number
  /** Antall takstoler spikret sammen (bæretakstol ved valm). */
  lag?: number
  /** Ekstra karakteristisk punktlast i toppnoden (valm: grat + kongesperre), kN. */
  toppLast?: { G: number; S: number }
  /** Minste gurthøyde (mm) – f.eks. for å ligge i plan med sperrer/andre takstoler. */
  minOvergurtH?: number
  minUndergurtH?: number
}

export interface TakstolResultat {
  geometri: TakstolGeometri
  overgurt: Dimensjonering
  undergurt: Dimensjonering
  stav: Dimensjonering
  ok: boolean
  melding: string
  /** Karakteristisk oppleggsreaksjon per takstol (kN), [venstre/lav, høyre/høy]. */
  reaksjon: { G: [number, number]; S: [number, number] }
  nedboyningMm: { inst: number; fin: number; grenseInst: number; grenseFin: number }
  /** Største trykk i overgurt/stav og strekk i undergurt (ULS, kN) – til utskrift. */
  krefter: { overgurtN: number; undergurtN: number; stavN: number }
}

const GURT_H = [98, 148, 198, 223]
const STAV_H = [98, 148]
const GLIDEFAKTOR = 1.5

interface Kombi {
  navn: string
  g: number
  s: number
  kmod: number
}

function kombinasjoner(tk: Tjenesteklasse): Kombi[] {
  const psi0 = LASTTYPER.sno.psi0
  return [
    { navn: '1,35·G', g: LASTFAKTOR.G610a, s: 0, kmod: KMOD[tk].permanent },
    { navn: '6.10a: 1,35·G + 1,05·snø', g: LASTFAKTOR.G610a, s: LASTFAKTOR.Q * psi0, kmod: KMOD[tk].kort },
    { navn: '6.10b: 1,2·G + 1,5·snø', g: LASTFAKTOR.G610b, s: LASTFAKTOR.Q, kmod: KMOD[tk].kort },
  ]
}

interface Analyse {
  NG: number[]
  NS: number[]
  uG: Array<[number, number]>
  uS: Array<[number, number]>
  /** Lokale overgurt-felt: horisontal lengde og stav-indeks. */
  felt: Array<{ stav: number; dx: number }>
  qG: number
  qS: number
  RG: [number, number]
  RS: [number, number]
}

function analyser(geo: TakstolGeometri, inn: TakstolInput, over: Tverrsnitt, under: Tverrsnitt, stav: Tverrsnitt): Analyse {
  const lag = inn.lag ?? 1
  const cosA = Math.cos((inn.vinkelGrader * Math.PI) / 180)
  const gk = inn.flatelaster.filter((f) => f.type === 'egen').reduce((s, f) => s + f.qk, 0)
  const sk = inn.flatelaster.filter((f) => f.type === 'sno').reduce((s, f) => s + f.qk, 0)
  const egen = (tv: Tverrsnitt) => TRE_TYNGDETETTHET * tv.b * tv.antall * tv.h * 1e-6 // kN/m
  // Linjelast på overgurten per horisontal mm (N/mm = kN/m), per takstol × lag.
  const qG = (gk * inn.ccM + egen(over) / cosA) * lag
  const qS = sk * inn.ccM * lag
  const E = MATERIALER[over.materiale].E0mean
  const noder: FNode[] = geo.noder.map((n, i) => ({ ...n, fx: i === geo.opplegg[0], fy: i === geo.opplegg[0] || i === geo.opplegg[1] }))
  const staver: FStav[] = geo.staver.map((s) => {
    const tv = s.rolle === 'over' ? over : s.rolle === 'under' ? under : stav
    return { a: s.a, b: s.b, EA: E * tv.b * tv.antall * tv.h * lag }
  })
  const felt: Analyse['felt'] = []
  const lastFor = (q: number): Array<[number, number, number]> => {
    const L: Array<[number, number, number]> = []
    const on = geo.overNoder
    for (let i = 0; i < on.length - 1; i++) {
      const a = geo.noder[on[i]]
      const b = geo.noder[on[i + 1]]
      const dx = Math.abs(b.x - a.x)
      L.push([on[i], 0, (-q * dx) / 2], [on[i + 1], 0, (-q * dx) / 2])
    }
    // Utstikk.
    L.push([geo.opplegg[0], 0, -q * inn.utstikkMm])
    if (geo.type === 'fink') L.push([geo.opplegg[1], 0, -q * inn.utstikkMm])
    else if (inn.hoyUtstikkMm) L.push([geo.topp, 0, -q * inn.hoyUtstikkMm])
    return L
  }
  geo.staver.forEach((s, i) => {
    if (s.rolle !== 'over') return
    felt.push({ stav: i, dx: Math.abs(geo.noder[s.b].x - geo.noder[s.a].x) })
  })
  // Egenvekt undergurt + staver (G) som nodelaster i undergurten.
  const lastG = lastFor(qG)
  geo.staver.forEach((s) => {
    if (s.rolle === 'over') return
    const tv = s.rolle === 'under' ? under : stav
    const L = Math.hypot(geo.noder[s.b].x - geo.noder[s.a].x, geo.noder[s.b].y - geo.noder[s.a].y)
    const W = egen(tv) * L * lag
    lastG.push([s.a, 0, -W / 2], [s.b, 0, -W / 2])
  })
  const lastS = lastFor(qS)
  if (inn.toppLast) {
    lastG.push([geo.topp, 0, -inn.toppLast.G * 1000])
    lastS.push([geo.topp, 0, -inn.toppLast.S * 1000])
  }
  const rG = losFagverk(noder, staver, lastG)
  const rS = losFagverk(noder, staver, lastS)
  const reak = (last: Array<[number, number, number]>): [number, number] => {
    // Statisk likevekt om venstre opplegg.
    const xa = geo.noder[geo.opplegg[0]].x
    const xb = geo.noder[geo.opplegg[1]].x
    let tot = 0
    let mom = 0
    for (const [nd, , fy] of last) {
      tot += -fy
      mom += -fy * (geo.noder[nd].x - xa)
    }
    // Utstikk-lastene er lagt i hælnodene (x = 0/S) – momentet fra utkragingen tas lokalt.
    const Rb = mom / (xb - xa)
    return [(tot - Rb) / 1000, Rb / 1000]
  }
  return { NG: rG.N, NS: rS.N, uG: rG.u, uS: rS.u, felt, qG, qS, RG: reak(lastG), RS: reak(lastS) }
}

function kontrollerTakstol(geo: TakstolGeometri, inn: TakstolInput, over: Tverrsnitt, under: Tverrsnitt, stav: Tverrsnitt): {
  over: Medlemskontroll
  under: Medlemskontroll
  stav: Medlemskontroll
  an: Analyse
  wInst: number
  wFin: number
  krefter: TakstolResultat['krefter']
} {
  const tk = inn.tjenesteklasse ?? 2
  const lag = inn.lag ?? 1
  const an = analyser(geo, inn, over, under, stav)
  const komb = kombinasjoner(tk)
  const cosA = Math.cos((inn.vinkelGrader * Math.PI) / 180)
  const mat = MATERIALER.C24
  const fd = (fk: number, kmod: number) => (kmod * fk) / mat.gammaM
  const kh = (h: number) => (h < 150 ? Math.min((150 / h) ** 0.2, 1.3) : 1)
  const tvLag = (tv: Tverrsnitt): Tverrsnitt => (lag > 1 ? tverrsnitt(tv.b, tv.h, lag * tv.antall, tv.materiale, tv.pris) : tv)
  const forut = [
    `C24 (NS-EN 338), tjenesteklasse ${tk}, γ_M = 1,25`,
    `Fagverk analysert med leddede knutepunkter (stivhetsmetoden); laster samlet i knutepunktene`,
    'Overgurt avstivet ut av planet av lekter/takplater c/c ≤ 600',
    `Nedbøyning fra fagverksanalysen × ${fmt(GLIDEFAKTOR, 1)} (glidning i spikerplateforbindelser)`,
    'Spikerplater dimensjoneres av takstolprodusent/platelevrandør',
  ]
  if (lag > 1) forut.push(`${lag} takstoler spikret sammen som bæretakstol`)

  // ── Overgurt ──
  const A_o = over.b * over.antall * over.h * lag
  const W_o = (over.b * over.antall * lag * over.h * over.h) / 6
  let uKomb = 0, uSkj = 0, dKomb = '', dSkj = '', kombNavn = ''
  let maxNo = 0
  for (const k of komb) {
    const q = k.g * an.qG + k.s * an.qS
    for (const f of an.felt) {
      const s = geo.staver[f.stav]
      const N = k.g * an.NG[f.stav] + k.s * an.NS[f.stav]
      const Lp = Math.hypot(geo.noder[s.b].x - geo.noder[s.a].x, geo.noder[s.b].y - geo.noder[s.a].y)
      let M = (q * f.dx * f.dx) / 8
      let V = (q * f.dx) / 2
      const erHael = s.a === geo.opplegg[0] || s.b === geo.opplegg[1] || (geo.type === 'fink' && (s.a === geo.opplegg[1] || s.b === geo.opplegg[1]))
      if (erHael) {
        M = Math.max(M, (q * inn.utstikkMm ** 2) / 2)
        V = Math.max(V, q * inn.utstikkMm)
      }
      if (geo.type === 'pult' && (s.b === geo.topp || s.a === geo.topp) && inn.hoyUtstikkMm) {
        M = Math.max(M, (q * inn.hoyUtstikkMm ** 2) / 2)
        V = Math.max(V, q * inn.hoyUtstikkMm)
      }
      const sm = M / W_o
      const fm = fd(mat.fmk, k.kmod) * kh(over.h)
      let u: number
      let det: string
      if (N < 0) {
        const { kc } = knekkfaktor(Lp, over.h / Math.sqrt(12), mat)
        const sc = -N / A_o
        const fc = fd(mat.fc0k, k.kmod)
        const u1 = sc / (kc * fc) + sm / fm
        const u2 = (sc / fc) ** 2 + sm / fm
        u = Math.max(u1, u2)
        det = `N_Ed = ${fmt(-N / 1000, 1)} kN trykk, M_Ed = ${fmt(M / 1e6, 2)} kNm: σ_c/(k_c·f_c,0,d) + σ_m/f_m,d = ${fmt(sc, 2)}/(${fmt(kc, 2)}·${fmt(fc, 1)}) + ${fmt(sm, 1)}/${fmt(fm, 1)} (l_ef = ${Math.round(Lp)} mm, EC5 6.23)`
        maxNo = Math.max(maxNo, -N)
      } else {
        const ft = fd(mat.ft0k, k.kmod) * kh(over.h)
        u = N / A_o / ft + sm / fm
        det = `N_Ed = ${fmt(N / 1000, 1)} kN strekk, M_Ed = ${fmt(M / 1e6, 2)} kNm: σ_t/f_t,0,d + σ_m/f_m,d (EC5 6.17)`
      }
      if (u > uKomb) { uKomb = u; dKomb = det; kombNavn = k.navn }
      const tau = (1.5 * V * cosA) / (KCR * A_o)
      const uv = tau / fd(mat.fvk, k.kmod)
      if (uv > uSkj) { uSkj = uv; dSkj = `V_Ed = ${fmt((V * cosA) / 1000, 2)} kN, τ = ${fmt(tau, 2)} MPa ≤ f_v,d = ${fmt(fd(mat.fvk, k.kmod), 2)} MPa` }
    }
  }
  // Nedbøyning (største loddrette forskyvning i noder).
  const maxUy = (u: Array<[number, number]>) => Math.max(...u.map((p) => Math.abs(p[1])))
  const kdef = KDEF[tk]
  const wG = maxUy(an.uG) * GLIDEFAKTOR
  const wS = maxUy(an.uS) * GLIDEFAKTOR
  const wInst = wS
  const wFin = wG * (1 + kdef) + wS * (1 + LASTTYPER.sno.psi2 * kdef)
  const L = inn.spennMm
  const gInst = L / 300
  const gFin = L / 200
  const lasterUt = [
    { navn: 'Egenlast (tak + overgurt)', type: 'egen' as const, verdi: an.qG, enhet: 'kN/m' as const },
    { navn: 'Snølast', type: 'sno' as const, verdi: an.qS, enhet: 'kN/m' as const },
    ...(inn.toppLast ? [{ navn: 'Punktlast i topp (grat/kongesperre), egenlast', type: 'egen' as const, verdi: inn.toppLast.G, enhet: 'kN' as const }, { navn: 'Punktlast i topp, snø', type: 'sno' as const, verdi: inn.toppLast.S, enhet: 'kN' as const }] : []),
  ]
  const lagMk = (navn: string, tv: Tverrsnitt, spenn: number, kontroller: Delkontroll[], komb2: string): Medlemskontroll => {
    const styr = kontroller.reduce((a, b) => (b.utnyttelse > a.utnyttelse ? b : a))
    return {
      navn,
      tverrsnitt: tvLag(tv),
      tjenesteklasse: tk,
      spennMm: spenn,
      ccMm: inn.ccM * 1000,
      kontroller,
      maksUtnyttelse: styr.utnyttelse,
      styrende: styr.navn,
      ok: kontroller.every((k) => k.ok),
      lastkombinasjon: komb2,
      laster: lasterUt,
      forutsetninger: forut,
    }
  }
  const nedb: Delkontroll[] = [
    { id: 'nedboyningInst', navn: 'Nedbøyning takstol (L/300)', utnyttelse: wInst / gInst, ok: wInst <= gInst, detalj: `w_inst,snø = ${fmt(wInst, 1)} mm ≤ L/300 = ${fmt(gInst, 1)} mm` },
    { id: 'nedboyningFin', navn: 'Sluttnedbøyning takstol (L/200)', utnyttelse: wFin / gFin, ok: wFin <= gFin, detalj: `w_fin = ${fmt(wFin, 1)} mm ≤ L/200 = ${fmt(gFin, 1)} mm (k_def ${fmt(kdef, 1)})` },
  ]
  const overMk = lagMk(
    'Takstol – overgurt',
    over,
    Math.max(...an.felt.map((f) => f.dx / cosA)),
    [
      { id: 'knekk', navn: 'Aksialkraft + bøying', utnyttelse: uKomb, ok: uKomb <= 1, detalj: dKomb },
      { id: 'skjaer', navn: 'Skjær', utnyttelse: uSkj, ok: uSkj <= 1, detalj: dSkj },
      ...nedb,
    ],
    kombNavn,
  )

  // ── Undergurt ──
  const A_u = under.b * under.antall * under.h * lag
  let uT = 0, dT = '', uC = 0, dC = '', komU = ''
  let maxNu = 0
  geo.staver.forEach((s, i) => {
    if (s.rolle !== 'under') return
    for (const k of komb) {
      const N = k.g * an.NG[i] + k.s * an.NS[i]
      if (N >= 0) {
        const ft = fd(mat.ft0k, k.kmod) * kh(under.h)
        const u = N / A_u / ft
        maxNu = Math.max(maxNu, N)
        if (u > uT) { uT = u; dT = `N_Ed = ${fmt(N / 1000, 1)} kN strekk, σ_t = ${fmt(N / A_u, 2)} MPa ≤ k_h·f_t,0,d = ${fmt(ft, 1)} MPa`; komU = k.navn }
      } else {
        const Lp = Math.hypot(geo.noder[s.b].x - geo.noder[s.a].x, geo.noder[s.b].y - geo.noder[s.a].y)
        const { kc } = knekkfaktor(Lp, under.h / Math.sqrt(12), mat)
        const u = -N / A_u / (kc * fd(mat.fc0k, k.kmod))
        if (u > uT) { uT = u; dT = `N_Ed = ${fmt(-N / 1000, 1)} kN trykk, k_c = ${fmt(kc, 2)}`; komU = k.navn }
      }
    }
  })
  for (const k of komb) {
    const R = Math.max(k.g * an.RG[0] + k.s * an.RS[0], k.g * an.RG[1] + k.s * an.RS[1]) * 1000
    const sc = R / (under.b * under.antall * lag * (inn.opplegglengdeMm + 30))
    // EC5 6.1.5(4): k_c,90 = 1,5 for heltre på diskrete opplegg (takstoler c/c 600, l1 ≥ 2h).
    const u = sc / (1.5 * fd(mat.fc90k, k.kmod))
    if (u > uC) { uC = u; dC = `R = ${fmt(R / 1000, 2)} kN, σ_c,90 = ${fmt(sc, 2)} MPa ≤ k_c,90·f_c,90,d = 1,5·${fmt(fd(mat.fc90k, k.kmod), 2)} MPa (opplegg ${Math.round(inn.opplegglengdeMm)} mm + 30)` }
  }
  const underMk = lagMk(
    'Takstol – undergurt',
    under,
    inn.spennMm,
    [
      { id: 'boying', navn: 'Aksialkraft (strekk)', utnyttelse: uT, ok: uT <= 1, detalj: dT },
      { id: 'trykkTvers', navn: 'Trykk ⊥ fiber ved opplegg', utnyttelse: uC, ok: uC <= 1, detalj: dC },
    ],
    komU,
  )

  // ── Staver ──
  const A_s = stav.b * stav.antall * stav.h * lag
  let uS = 0, dS = '', komS = '', lMax = 0
  let maxNs = 0
  geo.staver.forEach((s, i) => {
    if (s.rolle !== 'stav') return
    const Lp = Math.hypot(geo.noder[s.b].x - geo.noder[s.a].x, geo.noder[s.b].y - geo.noder[s.a].y)
    lMax = Math.max(lMax, Lp)
    for (const k of komb) {
      const N = k.g * an.NG[i] + k.s * an.NS[i]
      let u: number
      let d: string
      if (N < 0) {
        const { kc } = knekkfaktor(Lp, (stav.b * lag) / Math.sqrt(12), mat)
        u = -N / A_s / (kc * fd(mat.fc0k, k.kmod))
        d = `N_Ed = ${fmt(-N / 1000, 2)} kN trykk, l = ${Math.round(Lp)} mm, k_c = ${fmt(kc, 2)} (svak akse)`
        maxNs = Math.max(maxNs, -N)
      } else {
        u = N / A_s / (fd(mat.ft0k, k.kmod) * kh(stav.h))
        d = `N_Ed = ${fmt(N / 1000, 2)} kN strekk`
        maxNs = Math.max(maxNs, N)
      }
      if (u > uS) { uS = u; dS = d; komS = k.navn }
    }
  })
  const stavMk = lagMk('Takstol – stav', stav, lMax, [{ id: 'knekk', navn: 'Knekking / strekk', utnyttelse: uS, ok: uS <= 1, detalj: dS }], komS)
  return { over: overMk, under: underMk, stav: stavMk, an, wInst, wFin, krefter: { overgurtN: maxNo / 1000, undergurtN: maxNu / 1000, stavN: maxNs / 1000 } }
}

/** Velg minste C24-gurter/staver (48 × h) som består alle kontroller. */
export function dimensjonerTakstol(inn: TakstolInput): TakstolResultat {
  const geo = takstolGeometri(inn.type, inn.spennMm, inn.vinkelGrader)
  const bj = (h: number) => tverrsnitt(48, h, 1, 'C24', `bjelke-48x${h}`)
  const kombi: Array<[number, number, number]> = []
  for (const o of GURT_H) for (const u of GURT_H) for (const s of STAV_H) if (o >= (inn.minOvergurtH ?? 0) && u >= (inn.minUndergurtH ?? 0)) kombi.push([o, u, s])
  kombi.sort((a, b) => a[0] + a[1] + 0.5 * a[2] - (b[0] + b[1] + 0.5 * b[2]) || a[0] - b[0])
  const vurdert: Dimensjonering['vurdert'] = []
  let valgt: ReturnType<typeof kontrollerTakstol> | undefined
  let valgtTv: [Tverrsnitt, Tverrsnitt, Tverrsnitt] | undefined
  let beste: { r: ReturnType<typeof kontrollerTakstol>; tv: [Tverrsnitt, Tverrsnitt, Tverrsnitt]; u: number } | undefined
  for (const [o, u, s] of kombi) {
    // Staver høyere enn gurtene gir ikke mening.
    if (s > Math.max(o, u)) continue
    const tv: [Tverrsnitt, Tverrsnitt, Tverrsnitt] = [bj(o), bj(u), bj(s)]
    const r = kontrollerTakstol(geo, inn, ...tv)
    const maks = Math.max(r.over.maksUtnyttelse, r.under.maksUtnyttelse, r.stav.maksUtnyttelse)
    vurdert.push({ profil: `overgurt 48×${o} / undergurt 48×${u} / stav 48×${s}`, maksUtnyttelse: maks, styrende: maks === r.over.maksUtnyttelse ? r.over.styrende : maks === r.under.maksUtnyttelse ? r.under.styrende : r.stav.styrende })
    if (r.over.ok && r.under.ok && r.stav.ok) {
      valgt = r
      valgtTv = tv
      break
    }
    if (!beste || maks < beste.u) beste = { r, tv, u: maks }
  }
  const ok = !!valgt
  const r = valgt ?? beste!.r
  const tv = valgtTv ?? beste!.tv
  const lag = inn.lag ?? 1
  const tvLag = (t: Tverrsnitt): Tverrsnitt => (lag > 1 ? tverrsnitt(t.b, t.h, lag, t.materiale, t.pris) : t)
  const fu = (u: number) => fmt(u, 2)
  const melding = ok
    ? `Takstol ${inn.type === 'fink' ? 'W/Fink' : 'pult'}${lag > 1 ? ` (${lag} lag)` : ''}: overgurt 48×${tv[0].h} (${fu(r.over.maksUtnyttelse)}), undergurt 48×${tv[1].h} (${fu(r.under.maksUtnyttelse)}), staver 48×${tv[2].h} (${fu(r.stav.maksUtnyttelse)})`
    : `Ingen standard takstol i 48 mm C24 holder for spenn ${fmt(inn.spennMm / 1000, 2)} m – bruk takstol fra produsent (prosjektert) eller reduser spennet.`
  const dim = (mk: Medlemskontroll, t: Tverrsnitt): Dimensjonering => ({ valgt: tvLag(t), kontroll: mk, ok: mk.ok, vurdert, melding: `${mk.navn}: ${tvLag(t).profil} C24, utnyttelse ${fu(mk.maksUtnyttelse)} (${mk.styrende.toLowerCase()})` })
  return {
    geometri: geo,
    overgurt: dim(r.over, tv[0]),
    undergurt: dim(r.under, tv[1]),
    stav: dim(r.stav, tv[2]),
    ok,
    melding,
    reaksjon: { G: r.an.RG, S: r.an.RS },
    nedboyningMm: { inst: r.wInst, fin: r.wFin, grenseInst: inn.spennMm / 300, grenseFin: inn.spennMm / 200 },
    krefter: r.krefter,
  }
}
