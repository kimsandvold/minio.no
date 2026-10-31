/**
 * Dimensjonering av trekonstruksjoner – NS-EN 1995-1-1 (Eurokode 5) + NA.
 *
 * Ren beregningsmodul (ingen three.js). Konservativ, transparent kontroll av
 * fritt opplagte bjelker (bøying, skjær, trykk vinkelrett på fiber ved
 * opplegg, vipping, nedbøyning) og søyler/stendere (knekking, trykk på svill).
 * Hver kontroll returnerer UTNYTTELSE (= last/kapasitet, ≤ 1,0 er OK) slik at
 * byggeplanen kan vise «utnyttelse 0,72» per del.
 *
 * Enheter inn: m, kN, kN/m, kN/m². Internt N og mm (1 kN/m = 1 N/mm).
 *
 * Forenklinger (alle på sikker side, skrives ut i beregningsgrunnlaget):
 * - Fritt opplagt enkeltspenn (ingen kontinuitetsgevinst).
 * - Skjærkraft tas ved opplegget uten reduksjon for last nær opplegg.
 * - kc,90 = 1,0 for bjelkeopplegg (EC5 tillater 1,25–1,75).
 * - ksys = 1,0 som standard (EC5 6.6 tillater 1,1 for bjelkelag/sperrer c/c).
 * - Aksialkraft i skrå sperrer neglisjeres (gjelder sperrer med bærende
 *   møne/vegg; ekte takstoler må beregnes som fagverk).
 * - Flerlags bjelker (2×/3× 48 mm) forutsettes skrudd/spikret sammen slik at
 *   lagene samvirker; søyler av flere lag knekkes per lag (konservativt).
 */
import { LASTFAKTOR, LASTTYPER, LIMTRE_TYNGDETETTHET, REKKVERK_LAST_KAT_A, NYTTELAST, TAKTEKKE, TRE_TYNGDETETTHET, DEKKE_EGENVEKT, fmt, mu1, snolastTerrasse, taklastHorisontal } from './laster'
import type { Dekke, Lasttype, Lastvarighet, Nyttelastkategori, Taktekke } from './laster'

// ── Materialer ─────────────────────────────────────────────────────

export type Tjenesteklasse = 1 | 2 | 3
export type Fasthetsklasse = 'C18' | 'C24' | 'C30' | 'GL28c' | 'GL30c'

export interface Materialdata {
  id: Fasthetsklasse
  type: 'heltre' | 'limtre'
  /** Karakteristiske fastheter, N/mm². */
  fmk: number
  ft0k: number
  fc0k: number
  fc90k: number
  fvk: number
  /** Stivhet, N/mm². */
  E0mean: number
  E005: number
  Gmean: number
  /** Densitet, kg/m³. */
  rhok: number
  rhomean: number
  /** Materialfaktor γM (NS-EN 1995-1-1 NA tab. NA.2.3). */
  gammaM: number
  /** Imperfeksjonsfaktor knekking βc (EC5 6.29). */
  betaC: number
  kilde: string
}

/**
 * Konstruksjonsvirke: NS-EN 338:2016 tab. 1. Limtre: NS-EN 14080:2013 tab. 5
 * (kombinert limtre «c»). γM: NA – 1,25 heltre, 1,15 limtre.
 */
export const MATERIALER: Record<Fasthetsklasse, Materialdata> = {
  C18: { id: 'C18', type: 'heltre', fmk: 18, ft0k: 10, fc0k: 18, fc90k: 2.2, fvk: 3.4, E0mean: 9000, E005: 6000, Gmean: 560, rhok: 320, rhomean: 380, gammaM: 1.25, betaC: 0.2, kilde: 'NS-EN 338:2016' },
  C24: { id: 'C24', type: 'heltre', fmk: 24, ft0k: 14.5, fc0k: 21, fc90k: 2.5, fvk: 4.0, E0mean: 11000, E005: 7400, Gmean: 690, rhok: 350, rhomean: 420, gammaM: 1.25, betaC: 0.2, kilde: 'NS-EN 338:2016' },
  C30: { id: 'C30', type: 'heltre', fmk: 30, ft0k: 19, fc0k: 24, fc90k: 2.7, fvk: 4.0, E0mean: 12000, E005: 8000, Gmean: 750, rhok: 380, rhomean: 460, gammaM: 1.25, betaC: 0.2, kilde: 'NS-EN 338:2016' },
  GL28c: { id: 'GL28c', type: 'limtre', fmk: 28, ft0k: 19.5, fc0k: 24, fc90k: 2.5, fvk: 3.5, E0mean: 12500, E005: 10400, Gmean: 650, rhok: 390, rhomean: 430, gammaM: 1.15, betaC: 0.1, kilde: 'NS-EN 14080:2013' },
  GL30c: { id: 'GL30c', type: 'limtre', fmk: 30, ft0k: 19.5, fc0k: 24.5, fc90k: 2.5, fvk: 3.5, E0mean: 13000, E005: 10800, Gmean: 650, rhok: 390, rhomean: 430, gammaM: 1.15, betaC: 0.1, kilde: 'NS-EN 14080:2013' },
}

/**
 * kmod (NS-EN 1995-1-1 tab. 3.1) – heltre og limtre.
 * Tjenesteklasse 1: oppvarmet innendørs. 2: overdekket ute (carport-tak, bod).
 * 3: værutsatt (terrassebjelkelag, frittstående stolper uten tak).
 */
export const KMOD: Record<Tjenesteklasse, Record<Lastvarighet, number>> = {
  1: { permanent: 0.6, lang: 0.7, middels: 0.8, kort: 0.9, momentan: 1.1 },
  2: { permanent: 0.6, lang: 0.7, middels: 0.8, kort: 0.9, momentan: 1.1 },
  3: { permanent: 0.5, lang: 0.55, middels: 0.65, kort: 0.7, momentan: 0.9 },
}

/** kdef (NS-EN 1995-1-1 tab. 3.2) – heltre og limtre. */
export const KDEF: Record<Tjenesteklasse, number> = { 1: 0.6, 2: 0.8, 3: 2.0 }

/** Sprekkfaktor for skjær, kcr (NS-EN 1995-1-1 6.1.7 / A1). */
export const KCR = 0.67

const VARIGHET_REKKEFOLGE: Lastvarighet[] = ['permanent', 'lang', 'middels', 'kort', 'momentan']

// ── Tverrsnitt ─────────────────────────────────────────────────────

export interface Tverrsnitt {
  /** Unik id, f.eks. 'C24-48x198' eller 'C24-2x48x198'. */
  id: string
  /** Visningsprofil, f.eks. «2 × 48 × 198 mm». */
  profil: string
  /** Enkeltlag til kapplista, f.eks. «48 × 198 mm». */
  boardProfil: string
  /** Bredde per lag (mm). */
  b: number
  /** Høyde (mm). */
  h: number
  /** Antall lag side om side. */
  antall: number
  materiale: Fasthetsklasse
  /** Prisnøkkel i `priser.ts` per lag (utelatt = mangler pris, f.eks. limtre). */
  pris?: string
}

export function tverrsnitt(b: number, h: number, antall = 1, materiale: Fasthetsklasse = 'C24', pris?: string): Tverrsnitt {
  const board = `${b} × ${h} mm`
  return {
    id: `${materiale}-${antall > 1 ? `${antall}x` : ''}${b}x${h}`,
    profil: antall > 1 ? `${antall} × ${board}` : board,
    boardProfil: board,
    b,
    h,
    antall,
    materiale,
    pris,
  }
}

const bj = (h: number, n = 1) => tverrsnitt(48, h, n, 'C24', `bjelke-48x${h}`)

/** Enkle C24-bjelker (bjelkelag, sperrer) – vanlige norske dimensjoner. */
export const BJELKER_C24: Tverrsnitt[] = [bj(98), bj(148), bj(198), bj(223)]
/** Sammensatte C24-bjelker (dragere/headere/mønebjelker). */
export const DOBLE_C24: Tverrsnitt[] = [bj(148, 2), bj(198, 2), bj(223, 2), bj(198, 3), bj(223, 3)]
/** Standard GL30c limtre (bredder 90/115/140, høyder i 45 mm-lameller). */
export const LIMTRE_GL30C: Tverrsnitt[] = [
  [90, 225], [90, 270], [90, 315], [115, 270], [115, 315], [115, 360], [115, 405], [140, 360], [140, 405], [140, 450], [140, 495],
].map(([b, h]) => tverrsnitt(b, h, 1, 'GL30c'))
/** Stolper. Impregnerte stolper forutsatt C24 (sjekk merking på virket). */
export const STOLPER: Tverrsnitt[] = [
  tverrsnitt(98, 98, 1, 'C24', 'stolpe-98x98'),
  tverrsnitt(90, 90, 1, 'GL30c', 'stolpe-90x90'),
  tverrsnitt(115, 115, 1, 'GL30c'),
  tverrsnitt(148, 148, 1, 'C24', 'stolpe-148x148'),
  tverrsnitt(140, 140, 1, 'GL30c'),
]
/** Stendere i stenderverk. */
export const STENDERE: Tverrsnitt[] = [tverrsnitt(48, 98, 1, 'C24', 'stolpe-48x98'), bj(148), bj(198)]
/** Alle bjelkekandidater for dragere: enkle → doble → limtre. */
export const DRAGERE: Tverrsnitt[] = [...BJELKER_C24, ...DOBLE_C24, ...LIMTRE_GL30C]

const areal = (t: Tverrsnitt) => t.b * t.antall * t.h

// ── Laster inn til medlemmet ───────────────────────────────────────

/** Flatelast, kN/m² horisontal projeksjon. */
export interface Flatelast {
  navn: string
  type: Lasttype
  qk: number
  kilde?: string
}
/** Linjelast, kN/m (vertikal, per horisontal meter). */
export interface Linjelast {
  navn: string
  type: Lasttype
  qk: number
}
/** Punktlast midt i spennet, kN (virker ALENE med egenlast – NS-EN 1991-1-1 6.3.1.2(4)). */
export interface Punktlast {
  navn: string
  type: Exclude<Lasttype, 'egen'>
  Qk: number
}

/** Flatelaster × lastbredde (c/c eller tributær bredde) → linjelaster. */
export function linjelaster(flater: Flatelast[], lastbreddeM: number): Linjelast[] {
  return flater.map((f) => ({ navn: f.navn, type: f.type, qk: f.qk * lastbreddeM }))
}

// ── Nedbøyningskrav ────────────────────────────────────────────────

export type Nedboyningsklasse = 'gulv' | 'tak' | 'drager'

export interface Nedboyningskrav {
  /** Øyeblikkelig nedbøyning av variabel last: w_inst,Q ≤ L / instQ. */
  instQ: number
  /** Netto sluttnedbøyning inkl. kryp: w_fin ≤ L / fin. */
  fin: number
  begrunnelse: string
}

/**
 * Valgte grenser innenfor NS-EN 1995-1-1 tab. 7.2 (w_inst L/300–L/500,
 * w_fin L/150–L/300). Den norske NA overlater valget til prosjekterende.
 * - gulv/terrasse: L/400 for nyttelast (stivt, «fjærer» ikke) og L/200 totalt.
 * - tak og dragere: L/300 / L/200 – uthus uten sprø kledning/himling. Gir
 *   også nok stivhet til at flate tak ikke får vannsekker (forutsatt fall ≥ 1:40).
 */
export const NEDBOYNING: Record<Nedboyningsklasse, Nedboyningskrav> = {
  gulv: { instQ: 400, fin: 200, begrunnelse: 'Gulv/terrasse: w_inst,Q ≤ L/400 (komfort), w_fin ≤ L/200 (EC5 tab. 7.2)' },
  tak: { instQ: 300, fin: 200, begrunnelse: 'Tak: w_inst,Q ≤ L/300, w_fin ≤ L/200 (EC5 tab. 7.2, uthus uten sprø himling)' },
  drager: { instQ: 300, fin: 200, begrunnelse: 'Drager: w_inst,Q ≤ L/300, w_fin ≤ L/200 (EC5 tab. 7.2)' },
}

// ── Resultattyper ──────────────────────────────────────────────────

export type DelkontrollId = 'boying' | 'skjaer' | 'trykkTvers' | 'vipping' | 'nedboyningInst' | 'nedboyningFin' | 'knekk' | 'trykkSvill'

export interface Delkontroll {
  id: DelkontrollId
  navn: string
  /** Utnyttelse (≤ 1,0 = OK). */
  utnyttelse: number
  ok: boolean
  /** Utregning i klartekst, f.eks. «σ = 10,6 MPa ≤ f_m,d = 12,5 MPa». */
  detalj: string
}

export interface Medlemskontroll {
  /** Valgfritt navn satt av kalleren (f.eks. «Sperre»). */
  navn?: string
  /** Posisjonsmerke som i kapplista/tegningene (f.eks. «C»). */
  pos?: string
  tverrsnitt: Tverrsnitt
  tjenesteklasse: Tjenesteklasse
  /** Spenn (bjelker) eller knekklengde (søyler), mm. */
  spennMm: number
  ccMm?: number
  kontroller: Delkontroll[]
  maksUtnyttelse: number
  /** Navn på styrende kontroll. */
  styrende: string
  ok: boolean
  /** Styrende lastkombinasjon i bruddgrense, klartekst. */
  lastkombinasjon: string
  /** Laster som inngikk (karakteristiske). */
  laster: Array<{ navn: string; type: Lasttype; verdi: number; enhet: 'kN/m' | 'kN' | 'kNm' }>
  forutsetninger: string[]
}

export interface Dimensjonering {
  valgt: Tverrsnitt
  kontroll: Medlemskontroll
  /** Fant vi et tverrsnitt som holder? Hvis ikke er `valgt` det største, og spennet må reduseres. */
  ok: boolean
  /** Alle kandidater som ble vurdert, i rekkefølge. */
  vurdert: Array<{ profil: string; maksUtnyttelse: number; styrende: string }>
  melding: string
}

// ── Lastkombinasjoner ──────────────────────────────────────────────

interface Kombinasjon {
  navn: string
  g: number
  q: Partial<Record<Lasttype, number>>
  varighet: Lastvarighet
}

const kortest = (v: Lastvarighet[]) => v.reduce((a, b) => (VARIGHET_REKKEFOLGE.indexOf(b) > VARIGHET_REKKEFOLGE.indexOf(a) ? b : a), 'permanent' as Lastvarighet)
type VarType = Exclude<Lasttype, 'egen'>

/**
 * Bruddgrensekombinasjoner, NS-EN 1990 NA (6.10a/6.10b). `kombiner = false`
 * betyr at variable laster ikke virker samtidig (f.eks. snø og nyttelast på
 * terrasse, NS-EN 1991-1-1 3.3.2) – da kjøres hver alene.
 */
function bruddKombinasjoner(typer: VarType[], kombiner: boolean): Kombinasjon[] {
  const res: Kombinasjon[] = [{ navn: '1,35·G', g: LASTFAKTOR.G610a, q: {}, varighet: 'permanent' }]
  for (const lead of typer) {
    const andre = kombiner ? typer.filter((t) => t !== lead) : []
    const varighet = kortest([lead, ...andre].map((t) => LASTTYPER[t].varighet))
    const qa: Partial<Record<Lasttype, number>> = {}
    const qb: Partial<Record<Lasttype, number>> = {}
    qa[lead] = LASTFAKTOR.Q * LASTTYPER[lead].psi0
    qb[lead] = LASTFAKTOR.Q
    for (const t of andre) {
      qa[t] = LASTFAKTOR.Q * LASTTYPER[t].psi0
      qb[t] = LASTFAKTOR.Q * LASTTYPER[t].psi0
    }
    const tekst = (q: Partial<Record<Lasttype, number>>) =>
      Object.entries(q).map(([t, f]) => `${fmt(f ?? 0, 2)}·${LASTTYPER[t as VarType].navn.toLowerCase()}`).join(' + ')
    res.push({ navn: `6.10a: 1,35·G + ${tekst(qa)}`, g: LASTFAKTOR.G610a, q: qa, varighet })
    res.push({ navn: `6.10b: 1,2·G + ${tekst(qb)}`, g: LASTFAKTOR.G610b, q: qb, varighet })
  }
  return res
}

// ── Bjelkekontroll ─────────────────────────────────────────────────

export interface BjelkeInput {
  /** Horisontalt spenn mellom oppleggene (senter–senter), m. */
  spennM: number
  /** Helning (sperrer), grader. 0 = vannrett. */
  vinkelGrader?: number
  /** Karakteristiske linjelaster (kN/m per horisontal meter). Egenvekt av selve bjelken legges til automatisk. */
  laster: Linjelast[]
  /** Punktlast midt i spennet (virker alene med egenlast). */
  punktlaster?: Punktlast[]
  tjenesteklasse: Tjenesteklasse
  nedboyning: Nedboyningsklasse | Nedboyningskrav
  /** Systemfaktor EC5 6.6 (1,0 standard; 1,1 tillatt for bjelkelag/sperrer c/c ≤ 1,2 m med lastfordelende dekke). */
  ksys?: number
  /** Er trykkanten avstivet mot vipping (bjelkelag/sperrer med dekke)? Standard true. Dragere/headere: false. */
  sidestottet?: boolean
  /** Opplegglengde langs bjelken, mm (standard 48 – bjelke på 48 mm svill/drager). */
  opplegglengdeMm?: number
  /** Kan variable laster virke samtidig? Standard true. Terrasse (snø/nyttelast): false. */
  kombinerVariable?: boolean
  /** Legg til bjelkens egenvekt automatisk. Standard true. */
  inkluderEgenvekt?: boolean
  /** c/c (m) – kun til utskrift. */
  ccM?: number
}

/** Kontroller ett tverrsnitt for en fritt opplagt bjelke. */
export function kontrollerBjelke(tv: Tverrsnitt, inn: BjelkeInput): Medlemskontroll {
  const mat = MATERIALER[tv.materiale]
  const sk = inn.tjenesteklasse
  const ksys = inn.ksys ?? 1.0
  const alfa = ((inn.vinkelGrader ?? 0) * Math.PI) / 180
  const cosA = Math.cos(alfa)
  const Lh = inn.spennM * 1000 // mm horisontalt
  const L = Lh / cosA // mm langs bjelken
  const bTot = tv.b * tv.antall
  const h = tv.h
  const A = bTot * h
  const W = (bTot * h * h) / 6
  const I = (bTot * h ** 3) / 12
  const krav = typeof inn.nedboyning === 'string' ? NEDBOYNING[inn.nedboyning] : inn.nedboyning

  const laster: Linjelast[] = [...inn.laster]
  if (inn.inkluderEgenvekt !== false) {
    const gamma = mat.type === 'limtre' ? LIMTRE_TYNGDETETTHET : TRE_TYNGDETETTHET
    laster.push({ navn: `Egenvekt ${tv.profil}`, type: 'egen', qk: (gamma * A * 1e-6) / cosA })
  }
  const Gk = laster.filter((l) => l.type === 'egen').reduce((s, l) => s + l.qk, 0) // N/mm
  const Qk: Partial<Record<VarType, number>> = {}
  for (const l of laster) if (l.type !== 'egen') Qk[l.type] = (Qk[l.type] ?? 0) + l.qk
  const typer = (Object.keys(Qk) as VarType[]).filter((t) => (Qk[t] ?? 0) > 0)
  const kombiner = inn.kombinerVariable !== false

  // ULS
  const kh = mat.type === 'heltre' ? (h < 150 ? Math.min((150 / h) ** 0.2, 1.3) : 1) : h < 600 ? Math.min((600 / h) ** 0.1, 1.1) : 1
  let kcrit = 1
  let vippeDetalj = 'Trykkant avstivet av dekke/tak (kcrit = 1,0)'
  if (inn.sidestottet === false) {
    const lef = 0.9 * L + 2 * h
    const sigCrit = (0.78 * bTot * bTot * mat.E005) / (h * lef)
    const lam = Math.sqrt(mat.fmk / sigCrit)
    kcrit = lam <= 0.75 ? 1 : lam <= 1.4 ? 1.56 - 0.75 * lam : 1 / (lam * lam)
    vippeDetalj = `l_ef = ${Math.round(lef)} mm, λ_rel,m = ${fmt(lam, 2)} → k_crit = ${fmt(kcrit, 2)}`
  }
  const lefC90 = (inn.opplegglengdeMm ?? 48) + 30
  type Effekt = { M: number; V: number; R: number; komb: string; kmod: number }
  const effekter: Effekt[] = []
  for (const k of bruddKombinasjoner(typer, kombiner)) {
    let q = k.g * Gk
    for (const t of typer) q += (k.q[t] ?? 0) * (Qk[t] ?? 0)
    effekter.push({ M: (q * Lh * Lh) / 8, V: ((q * Lh) / 2) * cosA, R: (q * Lh) / 2, komb: k.navn, kmod: KMOD[sk][k.varighet] })
  }
  for (const p of inn.punktlaster ?? []) {
    const d = LASTTYPER[p.type]
    const P = p.Qk * 1000 // N
    for (const [g, f, navn] of [
      [LASTFAKTOR.G610b, LASTFAKTOR.Q, `6.10b: 1,2·G + 1,5·${p.navn}`],
      [LASTFAKTOR.G610a, LASTFAKTOR.Q * d.psi0, `6.10a: 1,35·G + ${fmt(LASTFAKTOR.Q * d.psi0, 2)}·${p.navn}`],
    ] as Array<[number, number, string]>) {
      const q = g * Gk
      effekter.push({
        M: (q * Lh * Lh) / 8 + (f * P * Lh) / 4,
        V: ((q * Lh) / 2 + (f * P) / 2) * cosA,
        R: (q * Lh) / 2 + (f * P) / 2,
        komb: navn,
        kmod: KMOD[sk][d.varighet],
      })
    }
  }

  const fd = (fk: number, kmod: number) => (kmod * ksys * fk) / mat.gammaM
  let uM = 0, uV = 0, uC = 0
  let dM = '', dV = '', dC = '', komb = ''
  for (const e of effekter) {
    const sig = e.M / W
    const fmd = fd(mat.fmk, e.kmod) * kh
    const u1 = sig / (kcrit * fmd)
    if (u1 > uM) {
      uM = u1
      komb = e.komb
      dM = `M_Ed = ${fmt(e.M / 1e6, 2)} kNm, σ_m = ${fmt(sig, 1)} MPa ≤ ${kcrit < 1 ? `k_crit·` : ''}f_m,d = ${fmt(kcrit * fmd, 1)} MPa (k_mod ${fmt(e.kmod, 2)}, k_h ${fmt(kh, 2)}, γ_M ${fmt(mat.gammaM, 2)}; ${vippeDetalj})`
    }
    const tau = (1.5 * e.V) / (KCR * A)
    const u2 = tau / fd(mat.fvk, e.kmod)
    if (u2 > uV) {
      uV = u2
      dV = `V_Ed = ${fmt(e.V / 1000, 2)} kN, τ = ${fmt(tau, 2)} MPa ≤ f_v,d = ${fmt(fd(mat.fvk, e.kmod), 2)} MPa (k_cr ${KCR})`
    }
    const sc = e.R / (bTot * lefC90)
    const u3 = sc / fd(mat.fc90k, e.kmod)
    if (u3 > uC) {
      uC = u3
      dC = `R = ${fmt(e.R / 1000, 2)} kN, σ_c,90 = ${fmt(sc, 2)} MPa ≤ f_c,90,d = ${fmt(fd(mat.fc90k, e.kmod), 2)} MPa (l_ef = ${Math.round(lefC90)} mm, k_c,90 = 1,0)`
    }
  }

  // SLS – nedbøyning vinkelrett på bjelken
  const wUdl = (q: number) => (5 * q * Lh ** 4) / (384 * mat.E0mean * I * cosA * cosA) + (1.2 * q * Lh * Lh) / (8 * mat.Gmean * A)
  const wP = (P: number) => (P * Lh ** 3) / (48 * mat.E0mean * I * cosA * cosA) + (1.2 * P * Lh) / (4 * mat.Gmean * A)
  const kdef = KDEF[sk]
  const wG = wUdl(Gk)
  const wQ: Partial<Record<VarType, number>> = {}
  for (const t of typer) wQ[t] = wUdl(Qk[t] ?? 0)
  let wInstQ = 0
  let wFinQ = 0
  for (const lead of typer) {
    const andre = kombiner ? typer.filter((t) => t !== lead) : []
    const inst = (wQ[lead] ?? 0) + andre.reduce((s, t) => s + LASTTYPER[t].psi0 * (wQ[t] ?? 0), 0)
    const fin = (wQ[lead] ?? 0) * (1 + LASTTYPER[lead].psi2 * kdef) + andre.reduce((s, t) => s + (wQ[t] ?? 0) * (LASTTYPER[t].psi0 + LASTTYPER[t].psi2 * kdef), 0)
    wInstQ = Math.max(wInstQ, inst)
    wFinQ = Math.max(wFinQ, fin)
  }
  for (const p of inn.punktlaster ?? []) {
    const w = wP(p.Qk * 1000)
    wInstQ = Math.max(wInstQ, w)
    wFinQ = Math.max(wFinQ, w * (1 + LASTTYPER[p.type].psi2 * kdef))
  }
  const wFin = wG * (1 + kdef) + wFinQ
  const grenseInst = L / krav.instQ
  const grenseFin = L / krav.fin

  const kontroller: Delkontroll[] = [
    { id: 'boying', navn: inn.sidestottet === false ? 'Bøying m/ vipping' : 'Bøying', utnyttelse: uM, ok: uM <= 1, detalj: dM },
    { id: 'skjaer', navn: 'Skjær', utnyttelse: uV, ok: uV <= 1, detalj: dV },
    { id: 'trykkTvers', navn: 'Trykk ⊥ fiber ved opplegg', utnyttelse: uC, ok: uC <= 1, detalj: dC },
    { id: 'nedboyningInst', navn: `Nedbøyning (L/${krav.instQ})`, utnyttelse: wInstQ / grenseInst, ok: wInstQ <= grenseInst, detalj: `w_inst,Q = ${fmt(wInstQ, 1)} mm ≤ L/${krav.instQ} = ${fmt(grenseInst, 1)} mm` },
    { id: 'nedboyningFin', navn: `Sluttnedbøyning (L/${krav.fin})`, utnyttelse: wFin / grenseFin, ok: wFin <= grenseFin, detalj: `w_fin = ${fmt(wFin, 1)} mm ≤ L/${krav.fin} = ${fmt(grenseFin, 1)} mm (k_def ${fmt(kdef, 1)})` },
  ]
  const styr = kontroller.reduce((a, b) => (b.utnyttelse > a.utnyttelse ? b : a))
  const forutsetninger = [
    `${mat.id} (${mat.kilde}), tjenesteklasse ${sk}, γ_M = ${fmt(mat.gammaM, 2)}`,
    'Fritt opplagt enkeltspenn',
    krav.begrunnelse,
  ]
  if (ksys !== 1) forutsetninger.push(`Systemfaktor k_sys = ${fmt(ksys, 2)} (EC5 6.6)`)
  if (cosA < 0.9999) forutsetninger.push(`Skrå bjelke ${fmt(inn.vinkelGrader ?? 0, 1)}° – aksialkraft neglisjert`)
  if (tv.antall > 1) forutsetninger.push(`${tv.antall} lag skrus/spikres sammen (c/c ≤ 300 mm, forskjøvet) for samvirke`)
  return {
    tverrsnitt: tv,
    tjenesteklasse: sk,
    spennMm: L,
    ccMm: inn.ccM !== undefined ? inn.ccM * 1000 : undefined,
    kontroller,
    maksUtnyttelse: styr.utnyttelse,
    styrende: styr.navn,
    ok: kontroller.every((k) => k.ok),
    lastkombinasjon: komb,
    laster: [
      ...laster.map((l) => ({ navn: l.navn, type: l.type, verdi: l.qk, enhet: 'kN/m' as const })),
      ...(inn.punktlaster ?? []).map((p) => ({ navn: p.navn, type: p.type as Lasttype, verdi: p.Qk, enhet: 'kN' as const })),
    ],
    forutsetninger,
  }
}

/**
 * Velg det minste tverrsnittet (etter areal ≈ pris) som består alle kontroller.
 * Finnes ingen, returneres det sterkeste med `ok = false` og en melding om at
 * spennet må reduseres (mellomstøtte/drager).
 */
export function velgBjelke(inn: BjelkeInput, kandidater: Tverrsnitt[] = BJELKER_C24): Dimensjonering {
  const sortert = [...kandidater].sort((a, b) => areal(a) - areal(b) || a.h - b.h)
  const vurdert: Dimensjonering['vurdert'] = []
  let beste: Medlemskontroll | undefined
  for (const tv of sortert) {
    const k = kontrollerBjelke(tv, inn)
    vurdert.push({ profil: `${tv.profil} ${tv.materiale}`, maksUtnyttelse: k.maksUtnyttelse, styrende: k.styrende })
    if (k.ok) {
      return { valgt: tv, kontroll: k, ok: true, vurdert, melding: `${tv.profil} ${tv.materiale}: utnyttelse ${fmtUtnyttelse(k.maksUtnyttelse)} (${forbokstavLiten(k.styrende)})` }
    }
    if (!beste || k.maksUtnyttelse < beste.maksUtnyttelse) beste = k
  }
  const k = beste ?? kontrollerBjelke(sortert[sortert.length - 1], inn)
  return {
    valgt: k.tverrsnitt,
    kontroll: k,
    ok: false,
    vurdert,
    melding: `Ingen standarddimensjon holder for spenn ${fmt(inn.spennM, 2)} m – reduser spennet (mellomstøtte/drager) eller c/c. Beste: ${k.tverrsnitt.profil}, utnyttelse ${fmtUtnyttelse(k.maksUtnyttelse)}.`,
  }
}

/**
 * Største spenn (m, rundet NED til 5 cm) et gitt tverrsnitt klarer, der
 * `lagInput(spenn)` bygger lastoppsettet. Brukes til spenntabeller og til å
 * avgjøre når en midtdrager trengs.
 */
export function maksSpenn(tv: Tverrsnitt, lagInput: (spennM: number) => BjelkeInput, maksM = 15): number {
  let lo = 0.1
  let hi = maksM
  if (!kontrollerBjelke(tv, lagInput(lo)).ok) return 0
  if (kontrollerBjelke(tv, lagInput(hi)).ok) return hi
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2
    if (kontrollerBjelke(tv, lagInput(mid)).ok) lo = mid
    else hi = mid
  }
  return Math.floor(lo * 20 + 1e-9) / 20
}

// ── Søyler / stendere ──────────────────────────────────────────────

export interface SoyleInput {
  /** Systemlengde, m. */
  lengdeM: number
  /** Knekklengdefaktor β (1,0 leddet–leddet, avstivet). Fritt innspent stolpe: 2,0. */
  knekklengdefaktor?: number
  /** Karakteristisk aksiallast fra egenvekt, kN. */
  NGk: number
  /** Karakteristiske variable aksiallaster, kN. */
  NQk: Array<{ type: VarType; Nk: number; navn?: string }>
  tjenesteklasse: Tjenesteklasse
  kombinerVariable?: boolean
  /** Avstivet om svak akse (stendere med kledning/losholter). Standard false. */
  avstivetSvakAkse?: boolean
  /** Knekklengde om svak akse når losholter avstiver (m). Utelatt = full lengde. */
  svakAkseLengdeM?: number
  /** Kontroller trykk ⊥ fiber mot svill (stender på svill). */
  svill?: { materiale?: Fasthetsklasse; kontinuerlig?: boolean }
  /**
   * Karakteristiske bøyemomenter om STERK akse (kNm), f.eks. vind på vegg
   * (w·L²/8 for stender) eller V·(h − a) for stolpe med kneband. Gir samtidig
   * trykk + bøying etter NS-EN 1995-1-1 6.23/6.24 (k_m = 0,7).
   */
  MQk?: Array<{ type: VarType; Mk: number; navn?: string }>
}

/** Knekkfaktor kc (NS-EN 1995-1-1 6.3.2). */
export function knekkfaktor(lef: number, iMm: number, mat: Materialdata): { kc: number; lamRel: number } {
  const lam = lef / iMm
  const lamRel = (lam / Math.PI) * Math.sqrt(mat.fc0k / mat.E005)
  if (lamRel <= 0.3) return { kc: 1, lamRel }
  const k = 0.5 * (1 + mat.betaC * (lamRel - 0.3) + lamRel * lamRel)
  return { kc: 1 / (k + Math.sqrt(k * k - lamRel * lamRel)), lamRel }
}

export function kontrollerSoyle(tv: Tverrsnitt, inn: SoyleInput): Medlemskontroll {
  const mat = MATERIALER[tv.materiale]
  const sk = inn.tjenesteklasse
  const beta = inn.knekklengdefaktor ?? 1.0
  const L = inn.lengdeM * 1000
  const lef = beta * L
  // Flere lag: knekk per lag om svak akse (konservativt), samvirke om sterk akse.
  const bTot = tv.b * tv.antall
  const A = bTot * tv.h
  const iSterk = tv.h / Math.sqrt(12)
  const iSvak = (tv.antall > 1 ? tv.b : bTot) / Math.sqrt(12)
  const kSterk = knekkfaktor(lef, iSterk, mat)
  const lefSvak = inn.avstivetSvakAkse ? (inn.svakAkseLengdeM !== undefined ? inn.svakAkseLengdeM * 1000 : 0) : lef
  const kSvak = lefSvak > 0 ? knekkfaktor(lefSvak, iSvak, mat) : { kc: 1, lamRel: 0 }
  const kc = Math.min(kSterk.kc, kSvak.kc)

  const MQ: Partial<Record<VarType, number>> = {}
  for (const m of inn.MQk ?? []) MQ[m.type] = (MQ[m.type] ?? 0) + m.Mk
  const medMoment = (inn.MQk ?? []).some((m) => m.Mk > 0)
  const typer = [...inn.NQk.filter((q) => q.Nk > 0).map((q) => q.type), ...(inn.MQk ?? []).filter((m) => m.Mk > 0).map((m) => m.type)]
  const NQ: Partial<Record<VarType, number>> = {}
  for (const q of inn.NQk) NQ[q.type] = (NQ[q.type] ?? 0) + q.Nk
  const gamma = mat.type === 'limtre' ? LIMTRE_TYNGDETETTHET : TRE_TYNGDETETTHET
  const NG = inn.NGk + gamma * A * 1e-6 * inn.lengdeM
  const W = (bTot * tv.h * tv.h) / 6
  const kh = mat.type === 'heltre' ? (tv.h < 150 ? Math.min((150 / tv.h) ** 0.2, 1.3) : 1) : tv.h < 600 ? Math.min((600 / tv.h) ** 0.1, 1.1) : 1
  let uK = 0, uS = 0, dK = '', dS = '', komb = ''
  const svMat = MATERIALER[inn.svill?.materiale ?? 'C24']
  const kc90 = inn.svill?.kontinuerlig ? 1.25 : 1.0
  for (const k of bruddKombinasjoner([...new Set(typer)], inn.kombinerVariable !== false)) {
    let N = k.g * NG
    for (const t of Object.keys(NQ) as VarType[]) N += (k.q[t] ?? 0) * (NQ[t] ?? 0)
    N *= 1000 // N
    let M = 0
    for (const t of Object.keys(MQ) as VarType[]) M += (k.q[t] ?? 0) * (MQ[t] ?? 0)
    M *= 1e6 // Nmm
    const kmod = KMOD[sk][k.varighet]
    const fc0d = (kmod * mat.fc0k) / mat.gammaM
    const fmd = (kmod * mat.fmk * kh) / mat.gammaM
    const sig = N / A
    const sm = M / W
    // EC5 6.23 (knekk om sterk akse, momentet om sterk akse) og 6.24 (knekk om svak akse, k_m = 0,7).
    const u = medMoment ? Math.max(sig / (kSterk.kc * fc0d) + sm / fmd, sig / (kSvak.kc * fc0d) + 0.7 * (sm / fmd)) : sig / (kc * fc0d)
    if (u > uK) {
      uK = u
      komb = k.navn
      dK = medMoment
        ? `N_Ed = ${fmt(N / 1000, 2)} kN, M_Ed = ${fmt(M / 1e6, 2)} kNm: σ_c/(k_c,y·f_c,0,d) + σ_m/f_m,d = ${fmt(sig, 2)}/(${fmt(kSterk.kc, 2)}·${fmt(fc0d, 1)}) + ${fmt(sm, 1)}/${fmt(fmd, 1)}; k_c,z = ${fmt(kSvak.kc, 2)} (EC5 6.23/6.24)`
        : `N_Ed = ${fmt(N / 1000, 2)} kN, σ_c = ${fmt(sig, 2)} MPa ≤ k_c·f_c,0,d = ${fmt(kc, 2)} · ${fmt(fc0d, 1)} MPa (l_ef = ${Math.round(lef)} mm, λ_rel = ${fmt(Math.max(kSterk.lamRel, kSvak.lamRel), 2)})`
    }
    if (inn.svill) {
      const lefS = tv.h + 30 // stendertykkelse langs svilla + 30 mm på én side (konservativt)
      const sc = N / (bTot * lefS)
      const f90 = (kmod * svMat.fc90k) / svMat.gammaM
      const us = sc / (kc90 * f90)
      if (us > uS) {
        uS = us
        dS = `σ_c,90 = ${fmt(sc, 2)} MPa ≤ k_c,90·f_c,90,d = ${fmt(kc90 * f90, 2)} MPa (svill ${svMat.id})`
      }
    }
  }
  const kontroller: Delkontroll[] = [{ id: 'knekk', navn: medMoment ? 'Trykk + bøying (knekk)' : 'Knekking', utnyttelse: uK, ok: uK <= 1, detalj: dK }]
  if (inn.svill) kontroller.push({ id: 'trykkSvill', navn: 'Trykk ⊥ fiber mot svill', utnyttelse: uS, ok: uS <= 1, detalj: dS })
  const styr = kontroller.reduce((a, b) => (b.utnyttelse > a.utnyttelse ? b : a))
  return {
    tverrsnitt: tv,
    tjenesteklasse: sk,
    spennMm: lef,
    kontroller,
    maksUtnyttelse: styr.utnyttelse,
    styrende: styr.navn,
    ok: kontroller.every((k) => k.ok),
    lastkombinasjon: komb,
    laster: [
      { navn: 'Egenvekt (inkl. søyle)', type: 'egen', verdi: NG, enhet: 'kN' },
      ...inn.NQk.map((q) => ({ navn: q.navn ?? LASTTYPER[q.type].navn, type: q.type as Lasttype, verdi: q.Nk, enhet: 'kN' as const })),
      ...(inn.MQk ?? []).map((m) => ({ navn: `${m.navn ?? LASTTYPER[m.type].navn} (moment)`, type: m.type as Lasttype, verdi: m.Mk, enhet: 'kNm' as const })),
    ],
    forutsetninger: [
      `${mat.id} (${mat.kilde}), tjenesteklasse ${sk}`,
      `Knekklengde l_ef = ${fmt(beta, 1)} · ${fmt(inn.lengdeM, 2)} m (leddet/avstivet i topp – krever kneband/vindkryss eller avstivende vegg)`,
      inn.avstivetSvakAkse ? 'Avstivet om svak akse av kledning/losholter' : 'Knekking kontrollert om begge akser',
      medMoment ? 'Trykk + bøying om sterk akse etter NS-EN 1995-1-1 6.23/6.24' : 'Sentrisk last (ingen tilleggsmoment fra vind/eksentrisitet)',
    ],
  }
}

export function velgSoyle(inn: SoyleInput, kandidater: Tverrsnitt[] = STOLPER): Dimensjonering {
  const sortert = [...kandidater].sort((a, b) => areal(a) - areal(b))
  const vurdert: Dimensjonering['vurdert'] = []
  let beste: Medlemskontroll | undefined
  for (const tv of sortert) {
    const k = kontrollerSoyle(tv, inn)
    vurdert.push({ profil: `${tv.profil} ${tv.materiale}`, maksUtnyttelse: k.maksUtnyttelse, styrende: k.styrende })
    if (k.ok) return { valgt: tv, kontroll: k, ok: true, vurdert, melding: `${tv.profil} ${tv.materiale}: utnyttelse ${fmtUtnyttelse(k.maksUtnyttelse)}` }
    if (!beste || k.maksUtnyttelse < beste.maksUtnyttelse) beste = k
  }
  const k = beste ?? kontrollerSoyle(sortert[sortert.length - 1], inn)
  return { valgt: k.tverrsnitt, kontroll: k, ok: false, vurdert, melding: `Ingen standardstolpe holder – flere stolper/kortere lengde trengs. Beste: ${k.tverrsnitt.profil}, utnyttelse ${fmtUtnyttelse(k.maksUtnyttelse)}.` }
}

// ── Høynivå-funksjoner per bygningsdel ─────────────────────────────

/** Taklaster per m² horisontal projeksjon: egenvekt tekking + snø. */
export function taklaster(inn: { sk: number; vinkelGrader: number; tekke: Taktekke; hindret?: boolean; ekstraEgenvekt?: number }): Flatelast[] {
  const t = TAKTEKKE[inn.tekke]
  const g = taklastHorisontal(t.gk + (inn.ekstraEgenvekt ?? 0), inn.vinkelGrader)
  const m = mu1(inn.vinkelGrader, inn.hindret)
  return [
    { navn: `Egenvekt tak (${t.navn})`, type: 'egen', qk: g, kilde: 'NS-EN 1991-1-1 tillegg A (anslag)' },
    { navn: `Snølast μ1·sk = ${fmt(m, 2)}·${fmt(inn.sk, 1)}`, type: 'sno', qk: m * inn.sk, kilde: 'NS-EN 1991-1-3 + NA' },
  ]
}

/** Gulv-/terrasselaster per m²: dekke + nyttelast (+ ev. snø, ikke samtidig). */
export function gulvlaster(inn: { bruk: Nyttelastkategori; dekke?: Dekke; sk?: number; lagerKN?: number }): Flatelast[] {
  const n = NYTTELAST[inn.bruk]
  const res: Flatelast[] = [{ navn: `Egenvekt dekke (${inn.dekke ?? 'terrassebord-28'})`, type: 'egen', qk: DEKKE_EGENVEKT[inn.dekke ?? 'terrassebord-28'], kilde: 'Anslag' }]
  if (n.qk > 0) res.push({ navn: `Nyttelast ${n.navn}`, type: 'nytte', qk: n.qk, kilde: n.kilde })
  if (inn.sk && inn.sk > 0) res.push({ navn: `Snø på dekke 0,8·sk = 0,8·${fmt(inn.sk, 1)}`, type: 'sno', qk: snolastTerrasse(inn.sk), kilde: 'NS-EN 1991-1-3 (μ = 0,8)' })
  if (inn.lagerKN && inn.lagerKN > 0) res.push({ navn: 'Lagerlast (stablet ved)', type: 'lager', qk: inn.lagerKN, kilde: 'Anslag γ_ved' })
  return res
}

export interface GulvbjelkeInput {
  spennM: number
  ccM: number
  bruk: Nyttelastkategori
  /** Snølast på mark – gir snø på åpent dekke (ikke samtidig med nyttelast). Utelat for overdekket gulv. */
  sk?: number
  dekke?: Dekke
  /** Lagerlast kN/m² (f.eks. `vedlast(1.8)`). */
  lagerKN?: number
  /** Standard 3 (utendørs terrasse). Bod-gulv under tak: 2. */
  tjenesteklasse?: Tjenesteklasse
  opplegglengdeMm?: number
  kandidater?: Tverrsnitt[]
}

function gulvInput(inn: GulvbjelkeInput, spennM = inn.spennM): BjelkeInput {
  const flater = gulvlaster(inn)
  const n = NYTTELAST[inn.bruk]
  return {
    spennM,
    laster: linjelaster(flater, inn.ccM),
    punktlaster: n.Qk > 0 ? [{ navn: 'Punktlast nyttelast', type: 'nytte', Qk: n.Qk }] : [],
    tjenesteklasse: inn.tjenesteklasse ?? 3,
    nedboyning: 'gulv',
    kombinerVariable: false, // snø og nyttelast ikke samtidig (NS-EN 1991-1-1 3.3.2)
    opplegglengdeMm: inn.opplegglengdeMm,
    ccM: inn.ccM,
  }
}

/** Bjelkelag for terrasse/platting/bodgulv. */
export function dimensjonerGulvbjelke(inn: GulvbjelkeInput): Dimensjonering {
  const d = velgBjelke(gulvInput(inn), inn.kandidater ?? BJELKER_C24)
  d.kontroll.navn = 'Gulvbjelke'
  return d
}

/** Største spenn for et gitt bjelkelag-tverrsnitt (m). */
export function maksGulvbjelkeSpenn(tv: Tverrsnitt, inn: Omit<GulvbjelkeInput, 'spennM'>): number {
  return maksSpenn(tv, (s) => gulvInput({ ...inn, spennM: s }, s))
}

export interface SperreInput {
  /** Horisontal projeksjon av fritt spenn (opplegg–opplegg), m. */
  spennHorisontalM: number
  vinkelGrader: number
  ccM: number
  tekke: Taktekke
  sk: number
  /** Standard 2 (overdekket ute). */
  tjenesteklasse?: Tjenesteklasse
  hindret?: boolean
  opplegglengdeMm?: number
  kandidater?: Tverrsnitt[]
}

function sperreInput(inn: SperreInput, spennM = inn.spennHorisontalM): BjelkeInput {
  return {
    spennM,
    vinkelGrader: inn.vinkelGrader,
    laster: linjelaster(taklaster(inn), inn.ccM),
    tjenesteklasse: inn.tjenesteklasse ?? 2,
    nedboyning: 'tak',
    opplegglengdeMm: inn.opplegglengdeMm,
    ccM: inn.ccM,
  }
}

/** Sperre/takbjelke (enkeltspenn mellom vegg/drager og møne/drager). */
export function dimensjonerSperre(inn: SperreInput): Dimensjonering {
  const d = velgBjelke(sperreInput(inn), inn.kandidater ?? BJELKER_C24)
  d.kontroll.navn = 'Sperre'
  return d
}

export function maksSperreSpenn(tv: Tverrsnitt, inn: Omit<SperreInput, 'spennHorisontalM'>): number {
  return maksSpenn(tv, (s) => sperreInput({ ...inn, spennHorisontalM: s }, s))
}

export interface DragerInput {
  /** Horisontalt spenn (m). */
  spennM: number
  /** Helning for skrå dragere/åser (grader, 0 = vannrett). Lastene er per horisontal meter. */
  vinkelGrader?: number
  /** Tributær bredde (m) som drageren bærer av flatelastene. */
  lastbreddeM: number
  flatelaster: Flatelast[]
  /** Tilleggs-linjelaster (f.eks. vegg), kN/m. */
  ekstraLinjelaster?: Linjelast[]
  punktlaster?: Punktlast[]
  tjenesteklasse?: Tjenesteklasse
  /** Er dragerens trykkant avstivet (f.eks. bjelker/sperrer festet på toppen c/c 600)? Standard false (KONSERVATIV). */
  sidestottet?: boolean
  kombinerVariable?: boolean
  opplegglengdeMm?: number
  /** Standard: enkle + doble C24 + GL30c. Begrens f.eks. til doble for headere. */
  kandidater?: Tverrsnitt[]
  nedboyning?: Nedboyningsklasse | Nedboyningskrav
}

/** Drager/bærebjelke/header/mønebjelke (fritt opplagt). */
export function dimensjonerDrager(inn: DragerInput): Dimensjonering {
  const d = velgBjelke(
    {
      spennM: inn.spennM,
      vinkelGrader: inn.vinkelGrader,
      laster: [...linjelaster(inn.flatelaster, inn.lastbreddeM), ...(inn.ekstraLinjelaster ?? [])],
      punktlaster: inn.punktlaster,
      tjenesteklasse: inn.tjenesteklasse ?? 2,
      nedboyning: inn.nedboyning ?? 'drager',
      sidestottet: inn.sidestottet ?? false,
      kombinerVariable: inn.kombinerVariable,
      opplegglengdeMm: inn.opplegglengdeMm ?? 98,
    },
    inn.kandidater ?? DRAGERE,
  )
  d.kontroll.navn = 'Drager'
  return d
}

export interface StolpeInput {
  lengdeM: number
  /** Belastet areal per stolpe (horisontal projeksjon), m². */
  belastningsarealM2: number
  flatelaster: Flatelast[]
  /** Tilleggs-punktlast fra f.eks. drager-egenvekt (karakteristisk egenlast), kN. */
  ekstraNGk?: number
  tjenesteklasse?: Tjenesteklasse
  knekklengdefaktor?: number
  kombinerVariable?: boolean
  kandidater?: Tverrsnitt[]
}

/** Stolpe/søyle (carport, pergola, terrasse). */
export function dimensjonerStolpe(inn: StolpeInput): Dimensjonering {
  const A = inn.belastningsarealM2
  const NGk = inn.flatelaster.filter((f) => f.type === 'egen').reduce((s, f) => s + f.qk * A, 0) + (inn.ekstraNGk ?? 0)
  const NQk = inn.flatelaster.filter((f) => f.type !== 'egen').map((f) => ({ type: f.type as VarType, Nk: f.qk * A, navn: f.navn }))
  const d = velgSoyle(
    { lengdeM: inn.lengdeM, knekklengdefaktor: inn.knekklengdefaktor, NGk, NQk, tjenesteklasse: inn.tjenesteklasse ?? 3, kombinerVariable: inn.kombinerVariable },
    inn.kandidater ?? STOLPER,
  )
  d.kontroll.navn = 'Stolpe'
  return d
}

export interface StenderInput {
  hoydeM: number
  ccM: number
  /** Tak-/gulvlast-bredde som veggen bærer (m), f.eks. halve takdybden + utstikk. */
  lastbreddeM: number
  flatelaster: Flatelast[]
  tjenesteklasse?: Tjenesteklasse
  /** Losholt-avstand (m) – avstiver svak akse. Standard 0,6 (losholter c/c 600) – med kledning: 0. */
  losholtM?: number
  kandidater?: Tverrsnitt[]
}

/** Stender i stenderverk (svill + toppsvill), last fra tak via toppsvill. */
export function dimensjonerStender(inn: StenderInput): Dimensjonering {
  const A = inn.ccM * inn.lastbreddeM
  const NGk = inn.flatelaster.filter((f) => f.type === 'egen').reduce((s, f) => s + f.qk * A, 0)
  const NQk = inn.flatelaster.filter((f) => f.type !== 'egen').map((f) => ({ type: f.type as VarType, Nk: f.qk * A, navn: f.navn }))
  const d = velgSoyle(
    {
      lengdeM: inn.hoydeM,
      NGk,
      NQk,
      tjenesteklasse: inn.tjenesteklasse ?? 2,
      avstivetSvakAkse: true,
      svakAkseLengdeM: inn.losholtM ?? 0.6,
      svill: { materiale: 'C24', kontinuerlig: true },
    },
    inn.kandidater ?? STENDERE,
  )
  d.kontroll.navn = 'Stender'
  return d
}

// ── Rekkverksstolpe ────────────────────────────────────────────────

export interface RekkverkstolpeInput {
  /** Stolpetverrsnitt. `h` = dimensjon i lastretningen (vinkelrett på rekkverket). */
  tverrsnitt: Tverrsnitt
  /** Største c/c mellom stolper, m. */
  ccM: number
  /** Arm fra øverste bolt/innfesting til håndlist, m. */
  armM: number
  /** Horisontal linjelast, kN/m (standard `REKKVERK_LAST_KAT_A`). */
  qk?: number
  tjenesteklasse?: Tjenesteklasse
}

/**
 * Utkraget rekkverksstolpe: M_Ed = 1,5·q·cc·arm (nyttelast, middels varighet).
 * Kontrollerer bare trevirket – boltene/innfestingen i kantbjelken må
 * dimensjoneres separat (min. 2 × M12 gjennomgående anbefales).
 */
export function kontrollerRekkverkstolpe(inn: RekkverkstolpeInput): Medlemskontroll {
  const tv = inn.tverrsnitt
  const mat = MATERIALER[tv.materiale]
  const sk = inn.tjenesteklasse ?? 3
  const qk = inn.qk ?? REKKVERK_LAST_KAT_A
  const MEd = LASTFAKTOR.Q * qk * inn.ccM * inn.armM // kNm
  const bTot = tv.b * tv.antall
  const W = (bTot * tv.h * tv.h) / 6
  const kh = mat.type === 'heltre' ? (tv.h < 150 ? Math.min((150 / tv.h) ** 0.2, 1.3) : 1) : tv.h < 600 ? Math.min((600 / tv.h) ** 0.1, 1.1) : 1
  const kmod = KMOD[sk][LASTTYPER.nytte.varighet]
  const fmd = (kmod * mat.fmk * kh) / mat.gammaM
  const sigma = (MEd * 1e6) / W
  const VEd = LASTFAKTOR.Q * qk * inn.ccM * 1000 // N
  const tau = (1.5 * VEd) / (KCR * bTot * tv.h)
  const fvd = (kmod * mat.fvk) / mat.gammaM
  const u = sigma / fmd
  const uv = tau / fvd
  const kontroller: Delkontroll[] = [
    { id: 'boying', navn: 'Bøying (utkraget)', utnyttelse: u, ok: u <= 1, detalj: `M_Ed = 1,5 · ${fmt(qk, 1)} kN/m · ${fmt(inn.ccM, 2)} m · ${fmt(inn.armM, 2)} m = ${fmt(MEd, 2)} kNm; σ = ${fmt(sigma, 1)} MPa ≤ f_m,d = ${fmt(fmd, 1)} MPa` },
    { id: 'skjaer', navn: 'Skjær', utnyttelse: uv, ok: uv <= 1, detalj: `τ = ${fmt(tau, 2)} MPa ≤ f_v,d = ${fmt(fvd, 2)} MPa` },
  ]
  const styr = u >= uv ? kontroller[0] : kontroller[1]
  return {
    navn: 'Rekkverksstolpe',
    tverrsnitt: tv,
    tjenesteklasse: sk,
    spennMm: inn.armM * 1000,
    ccMm: inn.ccM * 1000,
    kontroller,
    maksUtnyttelse: styr.utnyttelse,
    styrende: styr.navn,
    ok: u <= 1 && uv <= 1,
    lastkombinasjon: '1,5·Q (horisontal last på håndlist)',
    laster: [{ navn: 'Horisontal linjelast på rekkverk', type: 'nytte', verdi: qk, enhet: 'kN/m' }],
    forutsetninger: [
      `Horisontal last ${fmt(qk, 1)} kN/m i håndlisthøyde (NS-EN 1991-1-1 tab. 6.12 kat. A, øvre verdi i intervallet 0,2–1,0)`,
      'Innfesting (bolter i kantbjelke) kontrolleres ikke her',
    ],
  }
}

// ── Formatering / forklaring ───────────────────────────────────────

function forbokstavLiten(t: string): string {
  return t.charAt(0).toLowerCase() + t.slice(1)
}

/** «0,72» – utnyttelse med to desimaler, norsk komma. */
export function fmtUtnyttelse(u: number): string {
  return fmt(u, 2)
}

/** Kort klartekst for byggeplanen, f.eks. «Gulvbjelke 48 × 198 mm C24 c/c 600: utnyttelse 0,85 (bøying) – OK». */
export function forklarKontroll(k: Medlemskontroll): string {
  const cc = k.ccMm ? ` c/c ${Math.round(k.ccMm)}` : ''
  const status = k.ok ? 'OK' : 'IKKE OK'
  return `${k.navn ? `${k.navn} ` : ''}${k.tverrsnitt.profil} ${k.tverrsnitt.materiale}${cc}, spenn ${fmt(k.spennMm / 1000, 2)} m: utnyttelse ${fmtUtnyttelse(k.maksUtnyttelse)} (${forbokstavLiten(k.styrende)}) – ${status}`
}

/** Plain-norsk forklaring av hva utnyttelse betyr (til beregningsvedlegget). */
export const UTNYTTELSE_FORKLARING =
  'Utnyttelse er forholdet mellom beregnet påkjenning og dimensjonerende kapasitet. 0,72 betyr at delen bruker 72 % av kapasiteten etter at sikkerhetsfaktorene er lagt inn. Alt ≤ 1,00 er godkjent.'
