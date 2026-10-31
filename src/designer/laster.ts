/**
 * Laster (NS-EN 1990 / NS-EN 1991 med norske nasjonale tillegg, NA).
 *
 * Ren beregningsmodul – ingen three.js. Enheter: kN, m, kN/m², kN/m.
 * Alle flatelaster på tak er gitt per m² HORISONTAL PROJEKSJON (snø) eller
 * per m² TAKFLATE (egenvekt – se `taklastHorisontal`).
 *
 * Konservative valg er merket «KONSERVATIV», usikre verdier «USIKKER». Alt som
 * er usikkert skal skrives ut i beregningsgrunnlaget slik at kunden/kommunen
 * kan kontrollere det.
 */

// ── Lastfaktorer og kombinasjonsfaktorer (NS-EN 1990 + NA) ─────────

/**
 * Lastfaktorer, bruddgrense (STR/GEO), NS-EN 1990:2002+NA:2016 tabell
 * NA.A1.2(B). Norge bruker likning 6.10a og 6.10b:
 *   6.10a: 1,35·G + 1,5·Σψ0·Q
 *   6.10b: 1,2·G  + 1,5·Q1 + 1,5·Σψ0,i·Qi       (ξ·γG = 0,89·1,35 ≈ 1,2)
 * Konsekvensklasse CC1/CC2: K_FI = 1,0 (konservativt – vi reduserer aldri).
 */
export const LASTFAKTOR = {
  G610a: 1.35,
  G610b: 1.2,
  Q: 1.5,
  /** Gunstig permanent last (oppløft/velt). */
  Ggunstig: 0.9,
} as const

/** Lastvarighetsklasse (NS-EN 1995-1-1 tab. 2.1/2.2 + NA). */
export type Lastvarighet = 'permanent' | 'lang' | 'middels' | 'kort' | 'momentan'

/** Variabel lasttype som motoren kjenner. */
export type Lasttype = 'egen' | 'sno' | 'nytte' | 'vind' | 'lager'

export interface LasttypeData {
  navn: string
  psi0: number
  psi1: number
  psi2: number
  varighet: Lastvarighet
  kilde: string
}

/**
 * ψ-faktorer og lastvarighet per lasttype.
 *
 * - Snø: ψ0 = 0,7, ψ1 = 0,5, ψ2 = 0,2 (NS-EN 1990 tab. A1.1, «Finland, Island,
 *   Norge, Sverige»). Varighet: KORTTID – NS-EN 1995-1-1 NA.2.3.1.2 klassifiserer
 *   snølast som korttidslast i Norge. USIKKER: verifiser mot gjeldende NA-
 *   utgave; velg `varighet: 'middels'` om du vil være ekstra konservativ.
 * - Nyttelast kat. A (bolig, terrasse/balkong): ψ0 0,7 / ψ1 0,5 / ψ2 0,3,
 *   middels varighet (NS-EN 1995-1-1 tab. 2.2).
 * - Vind: ψ0 0,6 / ψ1 0,2 / ψ2 0. Korttid (KONSERVATIV – EC5 tillater momentan).
 * - Lager (stablet ved o.l., kat. E): ψ0 1,0 / ψ1 0,9 / ψ2 0,8, LANGTIDSLAST.
 */
export const LASTTYPER: Record<Exclude<Lasttype, 'egen'>, LasttypeData> = {
  sno: { navn: 'Snølast', psi0: 0.7, psi1: 0.5, psi2: 0.2, varighet: 'kort', kilde: 'NS-EN 1990 tab. A1.1 / NS-EN 1995-1-1 NA' },
  nytte: { navn: 'Nyttelast', psi0: 0.7, psi1: 0.5, psi2: 0.3, varighet: 'middels', kilde: 'NS-EN 1990 tab. A1.1 (kat. A)' },
  vind: { navn: 'Vindlast', psi0: 0.6, psi1: 0.2, psi2: 0, varighet: 'kort', kilde: 'NS-EN 1990 tab. A1.1' },
  lager: { navn: 'Lagerlast', psi0: 1.0, psi1: 0.9, psi2: 0.8, varighet: 'lang', kilde: 'NS-EN 1990 tab. A1.1 (kat. E)' },
}

// ── Egenvekt (permanent last) ──────────────────────────────────────

/** Taktekking/oppbygging (uten sperrer – sperrenes egenvekt legges til automatisk). */
export type Taktekke = 'takpapp' | 'shingel' | 'stal' | 'polykarbonat' | 'bord' | 'kryssfiner' | 'torv' | 'takstein'

export interface TaktekkeData {
  navn: string
  /** Karakteristisk egenvekt, kN/m² TAKFLATE (ikke horisontal projeksjon). */
  gk: number
  oppbygging: string
}

/**
 * Egenvekt av tekking + underlag (kN/m² takflate), KONSERVATIVE anslag fra
 * densiteter i NS-EN 1991-1-1 tillegg A og typiske produktdata:
 * kryssfiner/OSB ≈ 6 kN/m³ (18 mm ≈ 0,11), konstruksjonsvirke ≈ 5 kN/m³,
 * 2-lags asfalt takbelegg ≈ 0,06, asfaltshingel ≈ 0,10–0,12, stålprofil ≈ 0,05–
 * 0,07, flerkammer polykarbonat 16 mm ≈ 0,03. Torvtak: vannmettet torv 150 mm
 * ≈ 2,5–3,0 kN/m² (USIKKER – sterkt avhengig av tykkelse/vanninnhold).
 */
export const TAKTEKKE: Record<Taktekke, TaktekkeData> = {
  takpapp: { navn: 'Takpapp på 18 mm kryssfiner', gk: 0.25, oppbygging: 'kryssfiner 0,11 + 2-lags papp 0,06 + lekter/fester 0,08' },
  shingel: { navn: 'Asfaltshingel på 18 mm kryssfiner', gk: 0.3, oppbygging: 'kryssfiner 0,11 + shingel 0,12 + underlagsbelegg 0,02 + fester 0,05' },
  stal: { navn: 'Stålplater på lekter', gk: 0.15, oppbygging: 'stålplate 0,07 + lekter/sløyfer 0,04 + sutak 0,04' },
  polykarbonat: { navn: 'Polykarbonat på lekter', gk: 0.1, oppbygging: 'polykarbonat 0,03 + aluminiumsprofiler/lekter 0,07' },
  bord: { navn: 'Bordtak (2 lag bord)', gk: 0.25, oppbygging: '2 × 22 mm bord ≈ 0,22 + lekter 0,03' },
  kryssfiner: { navn: '18 mm kryssfiner', gk: 0.15, oppbygging: 'kryssfiner 0,11 + fester/lekter 0,04' },
  torv: { navn: 'Torvtak', gk: 3.5, oppbygging: 'vannmettet torv 150 mm ≈ 3,0 + membran/bord 0,5 (USIKKER)' },
  takstein: { navn: 'Betongtakstein', gk: 0.65, oppbygging: 'takstein 0,50 + lekter/sløyfer 0,10 + sutak 0,05' },
}

/** Mapper templatenes tekke-strenger ('stålplater', 'takpapp' …) til `Taktekke`. */
export function taktekkeFra(navn: string | undefined | null): Taktekke {
  const s = (navn ?? '').toLowerCase()
  if (s.includes('stål') || s.includes('stal')) return 'stal'
  if (s.includes('poly')) return 'polykarbonat'
  if (s.includes('shingel')) return 'shingel'
  if (s.includes('torv')) return 'torv'
  if (s.includes('stein')) return 'takstein'
  if (s.includes('bord')) return 'bord'
  if (s.includes('papp')) return 'takpapp'
  if (s.includes('kryssfiner')) return 'kryssfiner'
  return 'shingel' // KONSERVATIV standard når tekking er ukjent (tyngste vanlige lette tekking)
}

/**
 * Tyngdetetthet for konstruksjonsvirke til egenvekt av bjelker (kN/m³).
 * NS-EN 1991-1-1 tab. A.3 gir C24 ≈ 4,2 kN/m³ (tørt); vi bruker 5,0 for å dekke
 * impregnert/fuktig virke utendørs (KONSERVATIV).
 */
export const TRE_TYNGDETETTHET = 5.0
/** Limtre (kN/m³), samme begrunnelse. */
export const LIMTRE_TYNGDETETTHET = 5.0

/** Terrassedekke/gulvbord, kN/m². 28 mm bord ≈ 0,15 + skruer/avstand. */
export const DEKKE_EGENVEKT = {
  'terrassebord-28': 0.2,
  'terrassebord-21': 0.15,
  'gulv-kryssfiner-22': 0.2,
} as const
export type Dekke = keyof typeof DEKKE_EGENVEKT

// ── Nyttelast (NS-EN 1991-1-1 + NA) ────────────────────────────────

export type Nyttelastkategori = 'A-gulv' | 'A-balkong' | 'bod' | 'ingen'

export interface NyttelastData {
  navn: string
  /** Jevnt fordelt, kN/m². */
  qk: number
  /** Konsentrert, kN (virker alene – kombineres ikke med qk). */
  Qk: number
  kilde: string
  merknad?: string
}

/**
 * Nyttelaster.
 * - A-gulv: 2,0 kN/m² / 2,0 kN – NS-EN 1991-1-1 NA tab. NA.6.2, kat. A gulv.
 *   Brukes for plattinger på/nær bakken (≤ 0,5 m).
 * - A-balkong: 4,0 kN/m² / 2,0 kN – NA tab. NA.6.2, kat. A balkonger. Brukes for
 *   hevede terrasser (> 0,5 m) som fungerer som balkong (folksamling).
 *   USIKKER: verdien er gjengitt etter beste kunnskap om NA – verifiser.
 * - bod: 3,0 kN/m² / 2,0 kN – VALGT (ikke tabellverdi) for boder/uthus med
 *   hageredskap/sykler. Ikke lager (kat. E1, 7,5 kN/m²). For vedlager: bruk
 *   `vedlast()` som lagerlast i tillegg/i stedet.
 */
export const NYTTELAST: Record<Nyttelastkategori, NyttelastData> = {
  'A-gulv': { navn: 'Kat. A – gulv/platting', qk: 2.0, Qk: 2.0, kilde: 'NS-EN 1991-1-1 NA tab. NA.6.2' },
  'A-balkong': { navn: 'Kat. A – balkong/hevet terrasse', qk: 4.0, Qk: 2.0, kilde: 'NS-EN 1991-1-1 NA tab. NA.6.2', merknad: 'Verdi gjengitt etter beste kunnskap – verifiser mot gjeldende NA.' },
  bod: { navn: 'Bod/uthus (hageredskap)', qk: 3.0, Qk: 2.0, kilde: 'Valgt verdi (konservativ for privat bod)', merknad: 'Ikke dimensjonert som lager (kat. E1).' },
  ingen: { navn: 'Ingen nyttelast', qk: 0, Qk: 0, kilde: '–' },
}

/**
 * Stablet ved som lagerlast (kN/m²) for vedskjul-gulv/hyller.
 * γ_ved ≈ 5,0 kN/m³ stablet, lufttørr bjørk (≈ 600 kg/m³ fast × 0,6–0,7
 * stablingsfaktor ≈ 4,0 kN/m³, + fuktmargin). USIKKER/KONSERVATIV anslag –
 * NS-EN 1991-1-1 tillegg A har tabellverdier for lagrede materialer.
 */
export const VED_TYNGDETETTHET = 5.0
export function vedlast(stabelhoydeM: number): number {
  return Math.max(0, stabelhoydeM) * VED_TYNGDETETTHET
}

/**
 * Horisontal linjelast på rekkverk/brystning i bolig (kat. A), kN/m, i
 * håndlistens høyde. NS-EN 1991-1-1 tab. 6.12 gir for kat. A et intervall
 * 0,2–1,0 kN/m (anbefalt 0,5); den norske NA-verdien kunne IKKE verifiseres i
 * dette arbeidet. Vi bruker derfor øvre grense 1,0 kN/m (KONSERVATIV) – det
 * dekker enhver NA-verdi innenfor EN-intervallet. Uteplass/terrasse der mange
 * kan samles (kat. C) gir høyere last – ikke dekket her.
 */
export const REKKVERK_LAST_KAT_A = 1.0

// ── Snølast (NS-EN 1991-1-3 + NA) ──────────────────────────────────

/**
 * Formfaktor μ1 for pult- og saltak (NS-EN 1991-1-3 tab. 5.2), forutsatt at
 * snøen ikke hindres i å gli av (ingen snøfangere/rekkverk ved raft):
 *   0° ≤ α ≤ 30°:  μ1 = 0,8
 *   30° < α < 60°: μ1 = 0,8·(60 − α)/30
 *   α ≥ 60°:       μ1 = 0
 * Med snøfanger e.l. skal μ1 ≥ 0,8 (sett `hindret = true`).
 */
export function mu1(vinkelGrader: number, hindret = false): number {
  const a = Math.max(0, vinkelGrader)
  if (hindret || a <= 30) return 0.8
  if (a >= 60) return 0
  return (0.8 * (60 - a)) / 30
}

export interface SnolastTak {
  /** Snølast på tak, kN/m² horisontal projeksjon. */
  s: number
  sk: number
  mu1: number
  Ce: number
  Ct: number
  /** Skjev snølast på saltak (én side 0,5·μ1·sk), NS-EN 1991-1-3 fig. 5.3 tilfelle (ii)/(iii). */
  sSkjev: number
  forklaring: string
}

/**
 * Snølast på tak s = μ1·Ce·Ct·sk (NS-EN 1991-1-3 lign. 5.7).
 * Norsk NA: Ce = 1,0 og Ct = 1,0 (ingen reduksjon for vindeksponering eller
 * varmetap – kalde bygg som carport/bod får uansett Ct = 1,0).
 */
export function snolastTak(sk: number, vinkelGrader: number, opts: { hindret?: boolean; Ce?: number; Ct?: number } = {}): SnolastTak {
  const Ce = opts.Ce ?? 1.0
  const Ct = opts.Ct ?? 1.0
  const m = mu1(vinkelGrader, opts.hindret)
  const s = m * Ce * Ct * sk
  return {
    s,
    sk,
    mu1: m,
    Ce,
    Ct,
    sSkjev: 0.5 * s,
    forklaring: `s = μ1·Ce·Ct·sk = ${fmt(m, 2)} · ${fmt(Ce, 1)} · ${fmt(Ct, 1)} · ${fmt(sk, 1)} = ${fmt(s, 2)} kN/m² (takvinkel ${fmt(vinkelGrader, 1)}°)`,
  }
}

/**
 * Snø på terrasse/platting uten tak: behandles som flatt tak, μ = 0,8.
 * NS-EN 1991-1-1 § 3.3.2: på tak (inkl. tilgjengelige tak, kat. I) virker
 * nyttelast og snø IKKE samtidig – motoren tar derfor den største (envelope).
 */
export function snolastTerrasse(sk: number): number {
  return 0.8 * sk
}

export interface SnoFonn {
  mu2: number
  muS: number
  muW: number
  /** Fonnlengde ls (m). */
  ls: number
  /** Maks last ved veggen, kN/m². */
  sMaks: number
  forklaring: string
}

/**
 * Snøfonn på lavere tak inntil høyere byggverk (NS-EN 1991-1-3 § 5.3.6,
 * f.eks. veggmontert carport/bod inntil boligen).
 *   μw = (b1 + b2)/(2h) ≤ γ·h/sk, γ = 2 kN/m³, 0,8 ≤ μw ≤ 4,0 (anbefalte grenser)
 *   μs = 0 for øvre takvinkel ≤ 15°, ellers 0,5·μ1(øvre tak) (glidesnø, forenklet)
 *   ls = 2h, 5 m ≤ ls ≤ 15 m
 * b1 = bredde høyere tak, b2 = bredde lavere tak, h = høydeforskjell (m).
 * USIKKER: grensene for μw er EN-anbefalte – NA kan avvike.
 */
export function snoFonnInntilHoyereTak(sk: number, b1: number, b2: number, h: number, ovreTakvinkel = 30): SnoFonn {
  const hh = Math.max(0.1, h)
  let muW = (b1 + b2) / (2 * hh)
  muW = Math.min(muW, (2 * hh) / sk)
  muW = Math.max(0.8, Math.min(4.0, muW))
  const muS = ovreTakvinkel <= 15 ? 0 : 0.5 * mu1(ovreTakvinkel)
  const mu2 = muS + muW
  const ls = Math.max(5, Math.min(15, 2 * hh))
  return {
    mu2,
    muS,
    muW,
    ls,
    sMaks: mu2 * sk,
    forklaring: `Snøfonn inntil høyere tak: μ2 = μs + μw = ${fmt(muS, 2)} + ${fmt(muW, 2)} = ${fmt(mu2, 2)}, ls = ${fmt(ls, 1)} m → ${fmt(mu2 * sk, 2)} kN/m² ved veggen`,
  }
}

// ── Vind (NS-EN 1991-1-4 + NA) – kun forankring/avstiving ──────────

export type Terrengkategori = 0 | 1 | 2 | 3 | 4

/** Ruhetslengde z0 og zmin per terrengkategori (NS-EN 1991-1-4 NA tab. NA.4.1). */
const TERRENG: Record<Terrengkategori, { z0: number; zmin: number; navn: string }> = {
  0: { z0: 0.003, zmin: 2, navn: 'åpent hav / kyst' },
  1: { z0: 0.01, zmin: 2, navn: 'åpent, flatt terreng' },
  2: { z0: 0.05, zmin: 4, navn: 'landbruksområde, spredt bebyggelse' },
  3: { z0: 0.3, zmin: 8, navn: 'sammenhengende småhusbebyggelse/skog' },
  4: { z0: 1.0, zmin: 16, navn: 'by, høy bebyggelse' },
}

/**
 * Standard referansevindhastighet når kommunens verdi er ukjent. NA tab.
 * NA.4(901.1) gir vb,0 = 22–31 m/s (lavest i innlandet, høyest på værhard kyst).
 * 28 m/s dekker de fleste steder – USIKKER for ytre kyst (bruk faktisk verdi).
 */
export const VB0_STANDARD = 28

export interface Vindlast {
  vb0: number
  terreng: Terrengkategori
  hoydeM: number
  /** Vindkasthastighetstrykk qp(z), kN/m². */
  qp: number
  forklaring: string
}

/**
 * Vindkasthastighetstrykk qp(z) (NS-EN 1991-1-4 lign. 4.8), forenklet:
 * c_dir = c_season = c_prob = 1,0, c_alt = 1,0 (USIKKER over ~900 moh), c0 = 1,0.
 *   kr = 0,19·(z0/0,05)^0,07, cr = kr·ln(z/z0), Iv = 1/ln(z/z0)
 *   qp = (1 + 7·Iv)·½·ρ·(cr·vb)²,  ρ = 1,25 kg/m³
 */
export function vindlast(vb0 = VB0_STANDARD, terreng: Terrengkategori = 2, hoydeM = 4): Vindlast {
  const t = TERRENG[terreng]
  const z = Math.max(hoydeM, t.zmin)
  const kr = 0.19 * Math.pow(t.z0 / 0.05, 0.07)
  const ln = Math.log(z / t.z0)
  const cr = kr * ln
  const Iv = 1 / ln
  const vm = cr * vb0
  const qp = ((1 + 7 * Iv) * 0.5 * 1.25 * vm * vm) / 1000
  return {
    vb0,
    terreng,
    hoydeM: z,
    qp,
    forklaring: `qp(${fmt(z, 1)} m) = ${fmt(qp, 2)} kN/m² (vb,0 = ${vb0} m/s, terrengkategori ${terreng}: ${t.navn})`,
  }
}

/**
 * Netto oppløft på tak (kN, positiv = løft) i bruddgrense:
 *   F = 1,5·|cp,net|·qp·A − 0,9·Gk
 * cp,net = −1,2 (KONSERVATIV envelope for åpne tak/carport, NS-EN 1991-1-4
 * tab. 7.6/7.7 for små vinkler; lukkede boder har lavere netto sug).
 */
export function vindOppdrift(qp: number, takArealM2: number, egenvektKN: number, cpNet = 1.2): number {
  return LASTFAKTOR.Q * cpNet * qp * takArealM2 - LASTFAKTOR.Ggunstig * egenvektKN
}

/** Horisontal vindkraft (kN, bruddgrense) mot en flate – til avstiving/kneband. cf = 1,3 (KONSERVATIV). */
export function vindHorisontal(qp: number, flateM2: number, cf = 1.3): number {
  return LASTFAKTOR.Q * cf * qp * flateM2
}

// ── Hjelpere ───────────────────────────────────────────────────────

/** Norsk tallformat med komma og fast antall desimaler. */
export function fmt(v: number, desimaler = 2): string {
  return v.toFixed(desimaler).replace('.', ',')
}

/**
 * Egenvekt per m² takflate → per m² horisontal projeksjon (÷ cos α), slik at
 * alle taklaster kan summeres per horisontal m.
 */
export function taklastHorisontal(gkTakflate: number, vinkelGrader: number): number {
  return gkTakflate / Math.cos((Math.min(80, Math.max(0, vinkelGrader)) * Math.PI) / 180)
}
