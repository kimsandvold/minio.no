/**
 * Fundamentering og frost – veiledende, konservativ.
 *
 * Grunnlag: SINTEF Byggforsk 451.021 (klimadata for frostdimensjonering –
 * frostmengde F10), 521.111 (frostsikring av fundamenter), 521.xxx (fundamentering
 * av småhus), NS-EN 1997-1 (geoteknikk) for prinsippet. Ingen geoteknisk
 * prosjektering: grunnforholdene på tomta skal alltid kontrolleres.
 *
 * Enheter: m, kN, kPa (= kN/m²).
 */
import { LASTFAKTOR, LASTTYPER, fmt } from './laster'
import type { Lasttype } from './laster'

// ── Frost ──────────────────────────────────────────────────────────

/** Forenklede frostsoner med representativ frostmengde F10 (h·°C). */
export type Frostsone = 'kyst' | 'lavland' | 'innland' | 'kaldt-innland'

/**
 * Representativ F10 per sone (h·°C). USIKKER/FORENKLET – Byggforsk 451.021
 * gir F10 per kommune (fra ca. 5 000 h°C på Vestlandskysten til > 60 000 h°C i
 * indre Finnmark). Sonene velger den øvre delen av hvert intervall:
 *   kyst: ytre Vestland/Sørland/Rogaland ≈ 5 000–10 000
 *   lavland: Oslofjorden, Trøndelag lavland, Agder innenfor kysten ≈ 10 000–20 000
 *   innland: Innlandet lavt, indre Trøndelag, Nordland ≈ 20 000–35 000
 *   kaldt-innland: fjellbygder, Østerdalen, Finnmarksvidda ≈ 35 000–60 000+
 */
export const FROSTSONER: Record<Frostsone, { F10: number; navn: string }> = {
  kyst: { F10: 10000, navn: 'Kyststrøk (Vestlandet/Sørlandet/Rogaland)' },
  lavland: { F10: 20000, navn: 'Lavland (Oslofjorden, Trøndelag lavland)' },
  innland: { F10: 35000, navn: 'Innland (Innlandet, indre Trøndelag, Nordland)' },
  'kaldt-innland': { F10: 60000, navn: 'Kaldt innland (fjellbygder, Østerdalen, Finnmark)' },
}

export type Grunn = 'fjell' | 'grus-sand' | 'morene' | 'silt' | 'leire' | 'silt-leire' | 'ukjent'

/**
 * Grunntyper: telefarlighet og forsiktig antatt dimensjonerende bæreevne
 * (σ_Rd, kPa) for små punkt-/stripefundamenter på fast, drenert grunn.
 * KONSERVATIVE erfaringsverdier – IKKE geoteknisk prosjektering. Bløt leire,
 * kvikkleire, torv/myr og fylling krever geoteknisk vurdering.
 */
export const GRUNN: Record<Grunn, { navn: string; telefarlig: boolean; sigmaRd: number; lambda: number; vannVol: number }> = {
  fjell: { navn: 'Fjell', telefarlig: false, sigmaRd: 1000, lambda: 3.0, vannVol: 0.0 },
  'grus-sand': { navn: 'Grus/sand (drenert)', telefarlig: false, sigmaRd: 200, lambda: 2.0, vannVol: 0.1 },
  morene: { navn: 'Morene (fast lagret)', telefarlig: true, sigmaRd: 200, lambda: 1.8, vannVol: 0.25 },
  silt: { navn: 'Silt', telefarlig: true, sigmaRd: 100, lambda: 1.6, vannVol: 0.3 },
  leire: { navn: 'Leire (fast/middels)', telefarlig: true, sigmaRd: 75, lambda: 1.5, vannVol: 0.35 },
  /** Byggested-valget «Silt/leire»: fast silt/leire – frost som silt (dypest av de to), bæreevne 100 kPa. Bløt leire → geotekniker. */
  'silt-leire': { navn: 'Silt/leire (fast)', telefarlig: true, sigmaRd: 100, lambda: 1.6, vannVol: 0.3 },
  /**
   * «Vet ikke»: KONSERVATIV kombinasjon – telefarlig med morenens frostdybde
   * (lavt vanninnhold ⇒ dypest frost av de telefarlige) og bæreevne som fast
   * silt/leire (100 kPa).
   */
  ukjent: { navn: 'Ukjent grunn (antatt telefarlig)', telefarlig: true, sigmaRd: 100, lambda: 1.8, vannVol: 0.25 },
}

/**
 * n-faktor (overflate-frostmengde / luft-frostmengde). Byggforsk 451.021 gir
 * F10 som luftens frostmengde; frosten i bakken styres av frostmengden på
 * OVERFLATEN. Snø isolerer sterkt.
 * - snøfri (brøytet/måkt, under tak eller under et høyt dekke): n = 0,9
 *   (KONSERVATIV – asfalt/grus som holdes snøfri ligger typisk 0,8–0,9)
 * - naturlig snødekke: n = 0,5 (KONSERVATIV – med varig snødekke er n ofte
 *   0,2–0,4; 0,5 dekker snøfattige vintre og tidlig frost før snøen kommer)
 */
export const N_FAKTOR = { snofri: 0.9, snodekt: 0.5 } as const

/** Minste fundamentdybde i ikke-telefarlig, drenert grus/sand (m). */
export const MIN_DYBDE_IKKE_TELEFARLIG = 0.6

export interface Frostresultat {
  F10: number
  /** n-faktor brukt (overflate/luft). */
  nFaktor: number
  /** Er overflaten forutsatt snøfri (brøytet / under tak / under høyt dekke)? */
  snofri: boolean
  /** Beregnet frostdybde i aktuell grunn, m. */
  frostdybdeM: number
  /** Anbefalt minste fundamentdybde (underkant), m – avrundet opp til 0,1 m. */
  anbefaltDybdeM: number
  telefarlig: boolean
  forklaring: string
  /** Alternativ til full frostdybde (markisolasjon / masseutskifting). */
  alternativ: string
  merknader: string[]
}

/**
 * Frostdybde etter Stefans formel med n-faktor:
 *   z = √(2·λ_frossen·n·F10·3600 / L),  L = 334 MJ/m³ · volumetrisk vanninnhold
 * Stefan neglisjerer jordas varmekapasitet og gir derfor litt for STOR dybde
 * (på sikker side). Kalibrert mot norsk praksis (Byggforsk 451.021/521.111):
 * telefarlig grunn med naturlig snødekke gir ca. 0,8 m (kyst), 1,1 m
 * (lavland), 1,4 m (innland) og 1,9 m (kaldt innland); snøfri flate gir
 * ca. 1,0 / 1,5 / 1,9 / 2,5 m.
 *
 * Ikke-telefarlig grunn (fjell, drenert grus/sand): frosten gir ikke telehiv,
 * så fundamentet trenger ikke ned til frostdybden – forutsatt at massene er
 * telefrie og drenerte hele veien ned. Anbefaling 0,6 m (grus/sand) for
 * stabilitet og forankring, eller boltet til fjell.
 *
 * @param snofri  true for brøytede/måkte flater, under tak (carport, garasje)
 *                og under høye terrassedekker. Standard false (naturlig snødekke).
 */
export function frostdybde(inn: { sone?: Frostsone; F10?: number; grunn: Grunn; snofri?: boolean }): Frostresultat {
  const F10 = inn.F10 ?? FROSTSONER[inn.sone ?? 'innland'].F10
  const snofri = inn.snofri ?? false
  const n = snofri ? N_FAKTOR.snofri : N_FAKTOR.snodekt
  const g = GRUNN[inn.grunn]
  const Lw = 334e6 * Math.max(0.05, g.vannVol)
  const z = Math.sqrt((2 * g.lambda * n * F10 * 3600) / Lw)
  const merknader: string[] = []
  let anbef: number
  if (!g.telefarlig) {
    anbef = inn.grunn === 'fjell' ? 0 : MIN_DYBDE_IKKE_TELEFARLIG
    merknader.push(
      inn.grunn === 'fjell'
        ? 'Fundament på fjell: bolt/forankre pilaren til fjellet (f.eks. kjemisk anker). Ingen frostdybde.'
        : `Ikke telefarlig grunn (drenert grus/sand): telehiv er lite sannsynlig, så ${fmt(MIN_DYBDE_IKKE_TELEFARLIG, 1)} m dybde er nok – men massene må være telefrie og drenerte ned til frostdybden (ca. ${fmt(z, 1)} m). Ved tvil: behandle som telefarlig.`,
    )
  } else {
    anbef = Math.ceil(z * 10 - 1e-9) / 10
    merknader.push('Telefarlig grunn: underkant fundament til frostfri dybde. Pilarrør bør ha glatt utside/plastfolie så telen ikke griper tak (sidegrep).')
    if (!snofri) merknader.push('Forutsatt naturlig snødekke om vinteren. Måkes/brøytes flaten, eller står fundamentet under tak/høyt dekke, må dybden økes (velg «snøfri»).')
  }
  if (inn.F10 === undefined) merknader.push(`Frostmengde fra forenklet sone (${FROSTSONER[inn.sone ?? 'innland'].navn}, F10 ≈ ${F10} h°C). Finn F10 for din kommune i Byggforsk 451.021.`)
  return {
    F10,
    nFaktor: n,
    snofri,
    frostdybdeM: z,
    anbefaltDybdeM: anbef,
    telefarlig: g.telefarlig,
    forklaring: `Frostdybde z = √(2·λ·n·F10·3600/L) = ${fmt(z, 2)} m (${g.navn}, F10 = ${F10} h°C, n = ${fmt(n, 1)} – ${snofri ? 'snøfri overflate' : 'naturlig snødekke'})`,
    alternativ:
      'Alternativ: grunnere fundament (min. 0,4–0,6 m) frostsikret med markisolasjon (XPS) rundt/under fundamentet, dimensjonert etter Byggforsk 521.111, eller utskifting til drenert, telefri pukk/grus ned til frostdybden.',
    merknader,
  }
}

// ── Punktfundament ─────────────────────────────────────────────────

export type Fundamenttype = 'betongsoyle' | 'betongsoyle-saale' | 'betongblokk' | 'skruefundament' | 'ringmur'

export interface Fundamentstorrelse {
  id: string
  navn: string
  type: Fundamenttype
  /** Bæreflate mot grunn, m². */
  arealM2: number
  /** Betongvolum per meter dybde for søylen/blokka (egenvekt/oppdrift), m³/m. */
  volumPerM: number
  /** Tykkelse på sålen (kun 'betongsoyle-saale'), m. Standard 0,15. */
  saaleTykkelseM?: number
}

const ror = (d: number) => Math.PI * (d / 2) ** 2
const saale = (side: number, ror_: number, t = 0.15): Fundamentstorrelse => ({
  id: `saale-${Math.round(side * 1000)}`,
  navn: `Pilarrør Ø${Math.round(ror_ * 1000)} på såle ${Math.round(side * 1000)} × ${Math.round(side * 1000)}`,
  type: 'betongsoyle-saale',
  arealM2: side * side,
  volumPerM: ror(ror_),
  saaleTykkelseM: t,
})
const blokk = (side: number): Fundamentstorrelse => ({
  id: `blokk-${Math.round(side * 1000)}`,
  navn: `Massiv betongblokk ${Math.round(side * 1000)} × ${Math.round(side * 1000)}`,
  type: 'betongblokk',
  arealM2: side * side,
  volumPerM: side * side,
})

/**
 * Vanlige fundamenter i stigende størrelse: pilarrør Ø200–Ø300, pilarrør på
 * støpt såle 400–1000 mm (såle 150 mm, 200 mm fra 800 mm). Store såler gir
 * både bæreflate og jordvekt mot vindoppløft.
 */
export const FUNDAMENTER: Fundamentstorrelse[] = [
  { id: 'ror-200', navn: 'Pilarrør Ø200', type: 'betongsoyle', arealM2: ror(0.2), volumPerM: ror(0.2) },
  { id: 'ror-250', navn: 'Pilarrør Ø250', type: 'betongsoyle', arealM2: ror(0.25), volumPerM: ror(0.25) },
  { id: 'ror-300', navn: 'Pilarrør Ø300', type: 'betongsoyle', arealM2: ror(0.3), volumPerM: ror(0.3) },
  { ...saale(0.4, 0.2), navn: 'Pilarrør Ø200 på såle 400 × 400' },
  { ...saale(0.5, 0.25), navn: 'Pilarrør Ø250 på såle 500 × 500' },
  { ...saale(0.6, 0.3), navn: 'Pilarrør Ø300 på såle 600 × 600' },
  saale(0.8, 0.3, 0.2),
  saale(1.0, 0.3, 0.2),
]

/** Massive betongblokker (støpt i forskaling, full dybde) – tunge, for stort oppløft. */
export const BETONGBLOKKER: Fundamentstorrelse[] = [blokk(0.5), blokk(0.6), blokk(0.8)]

/** Alle kandidater (pilarer/såler først, deretter massive blokker). */
export const FUNDAMENTER_MED_BLOKKER: Fundamentstorrelse[] = [...FUNDAMENTER, ...BETONGBLOKKER]

/** Betong, kN/m³ (NS-EN 1991-1-1 tab. A.1, armert ≈ 25; uarmert 24). */
const BETONG = 24
/**
 * Tilbakefylt jord over såle mot oppløft: γ = 16 kN/m³ (KONSERVATIV for fuktig
 * komprimert fylling; 18–20 er vanlig – ved grunnvann over sålen må oppdriftsredusert
 * ~9 kN/m³ brukes) og jordkjegle med 15° fra loddrett (vanlig praksis 15–30°).
 * Kreves: masser komprimert lagvis over sålen.
 */
export const JORD_OPPLOFT = { gamma: 16, vinkelGrader: 15 } as const

/** Betongvekt (kN) for et fundament med gitt dybde (underkant), m. */
export function betongvekt(f: Fundamentstorrelse, dybdeM: number): number {
  if (f.type === 'betongsoyle-saale') {
    const t = f.saaleTykkelseM ?? 0.15
    return BETONG * (f.volumPerM * Math.max(0, dybdeM - t) + f.arealM2 * t)
  }
  return BETONG * f.volumPerM * dybdeM
}

/**
 * Jordvekt (kN) RETT over sålen (prisme: såleareal minus pilar × fyllhøyde).
 * Brukes som last på grunnen i bæreevnekontrollen – jordkjeglen utenfor
 * sålekanten hviler på grunnen ved siden av og belaster ikke sålen.
 */
export function jordvektPrisme(f: Fundamentstorrelse, dybdeM: number): number {
  if (f.type !== 'betongsoyle-saale') return 0
  const h = Math.max(0, dybdeM - (f.saaleTykkelseM ?? 0.15))
  return JORD_OPPLOFT.gamma * Math.max(0, f.arealM2 - f.volumPerM) * h
}

/**
 * Jordvekt (kN) over sålen innenfor en avkortet pyramide (kjegle) med
 * `JORD_OPPLOFT.vinkelGrader` fra loddrett, minus pilaren. Bare for såler –
 * rene pilarrør og massive blokker har ingen jord over seg.
 */
export function jordvektOverSaale(f: Fundamentstorrelse, dybdeM: number): number {
  if (f.type !== 'betongsoyle-saale') return 0
  const h = Math.max(0, dybdeM - (f.saaleTykkelseM ?? 0.15))
  if (h <= 0) return 0
  const b1 = Math.sqrt(f.arealM2)
  const b2 = b1 + 2 * h * Math.tan((JORD_OPPLOFT.vinkelGrader * Math.PI) / 180)
  const A1 = b1 * b1
  const A2 = b2 * b2
  const V = (h / 3) * (A1 + A2 + Math.sqrt(A1 * A2)) - f.volumPerM * h
  return JORD_OPPLOFT.gamma * Math.max(0, V)
}

export interface FundamentInput {
  /** Karakteristiske laster på fundamentet (fra stolpen), kN. */
  NGk: number
  NQk: Array<{ type: Exclude<Lasttype, 'egen'>; Nk: number }>
  grunn: Grunn
  /** Fundamentdybde (underkant), m. */
  dybdeM: number
  /** Netto oppløft fra vind i bruddgrense (kN, positiv = løft), f.eks. fra `vindOppdrift` per stolpe. */
  oppdriftKN?: number
  kandidater?: Fundamentstorrelse[]
}

export interface Fundamentresultat {
  valgt: Fundamentstorrelse
  ok: boolean
  /** N_Ed (kN) og σ_Ed (kPa). */
  NEd: number
  sigmaEd: number
  sigmaRd: number
  utnyttelse: number
  /** Oppløft: holder egenvekten fundamentet nede? */
  oppdriftOk: boolean
  forklaring: string[]
  merknader: string[]
}

/**
 * Velg første (minste) punktfundament i `kandidater` der σ_Ed = N_Ed/A ≤ σ_Rd
 * og (ved oppløft) 0,9·(betong + jord over såle) ≥ oppløft. N_Ed = maks av 6.10a/b (+ betongens egenvekt).
 */
export function dimensjonerPunktfundament(inn: FundamentInput): Fundamentresultat {
  const g = GRUNN[inn.grunn]
  const typer = inn.NQk.filter((q) => q.Nk > 0)
  const NEdUten = Math.max(
    LASTFAKTOR.G610a * inn.NGk + typer.reduce((s, q) => s + LASTFAKTOR.Q * LASTTYPER[q.type].psi0 * q.Nk, 0),
    ...typer.map((lead) => LASTFAKTOR.G610b * inn.NGk + LASTFAKTOR.Q * lead.Nk + typer.filter((q) => q !== lead).reduce((s, q) => s + LASTFAKTOR.Q * LASTTYPER[q.type].psi0 * q.Nk, 0)),
    LASTFAKTOR.G610a * inn.NGk,
  )
  const kandidater = inn.kandidater ?? FUNDAMENTER
  const merknader: string[] = []
  if (inn.grunn === 'leire' || inn.grunn === 'silt' || inn.grunn === 'silt-leire') merknader.push('Leire/silt: sjekk at grunnen er fast (ikke bløt/kvikk). Ved tvil – kontakt geotekniker.')
  if (inn.grunn === 'ukjent') merknader.push('Grunnforholdene er ikke oppgitt – fundamentet er dimensjonert konservativt for telefarlig grunn med 100 kPa bæreevne. Grav en prøvegrop og oppgi grunnforhold for et mer nøyaktig fundament.')
  let siste: Fundamentresultat | undefined
  for (const f of kandidater) {
    const Gf = betongvekt(f, inn.dybdeM)
    const Gj = jordvektOverSaale(f, inn.dybdeM)
    const Gp = jordvektPrisme(f, inn.dybdeM)
    // Bæreevne: bare jorda RETT over sålen (prisme) er last på sålen. Oppløft: hele jordkjeglen holder igjen.
    const NEd = NEdUten + LASTFAKTOR.G610a * (Gf + Gp)
    const sigma = NEd / f.arealM2
    const u = sigma / g.sigmaRd
    const oppdriftOk = (inn.oppdriftKN ?? 0) <= LASTFAKTOR.Ggunstig * (Gf + Gj)
    const res: Fundamentresultat = {
      valgt: f,
      ok: u <= 1 && oppdriftOk,
      NEd,
      sigmaEd: sigma,
      sigmaRd: g.sigmaRd,
      utnyttelse: u,
      oppdriftOk,
      forklaring: [
        `N_Ed = ${fmt(NEd, 1)} kN (inkl. betong ${fmt(Gf, 2)} kN${Gp > 0 ? ` og jord rett over sålen ${fmt(Gp, 2)} kN` : ''}), A = ${fmt(f.arealM2, 3)} m²`,
        `σ_Ed = ${fmt(sigma, 0)} kPa ≤ σ_Rd = ${g.sigmaRd} kPa (${g.navn}, forsiktig antatt) → utnyttelse ${fmt(u, 2)}`,
        inn.oppdriftKN !== undefined
          ? `Oppløft ${fmt(inn.oppdriftKN, 2)} kN ${oppdriftOk ? '≤' : '>'} 0,9 · (betong ${fmt(Gf, 2)} + jord ${fmt(Gj, 2)}) = ${fmt(LASTFAKTOR.Ggunstig * (Gf + Gj), 2)} kN${Gj > 0 ? ` (jordkjegle ${JORD_OPPLOFT.vinkelGrader}°, γ = ${JORD_OPPLOFT.gamma} kN/m³ – komprimer fyllingen lagvis)` : ''}`
          : 'Oppløft ikke vurdert',
      ],
      merknader,
    }
    siste = res
    if (res.ok) return res
  }
  const r = siste as Fundamentresultat
  r.merknader = [...merknader, r.oppdriftOk ? 'Ingen standardfundament holder – større såle eller flere stolper trengs.' : 'Oppløftet er større enn fundamentets egenvekt – forankre med såle/jordanker eller øk betongvolumet.']
  return r
}

/** Stripefundament/ringmur: nødvendig sålebredde (m) for linjelast N_Ed (kN/m). */
export function saalebredde(NEdKNm: number, grunn: Grunn): number {
  const b = NEdKNm / GRUNN[grunn].sigmaRd
  return Math.max(0.3, Math.ceil(b * 20 - 1e-9) / 20)
}

/** Forankringsråd for stolper (tekst til planen). */
export function forankringsraad(inn: { aapentTak: boolean; oppdriftPerStolpeKN?: number }): string[] {
  const r = [
    'Stolpene festes i stolpesko av varmforsinket stål, støpt inn eller boltet til fundamentet med ekspansjons-/kjemisk anker. Hold endeveden min. 20 mm over betong (lufting).',
    'Stolpeskoen skrus/boltes gjennom stolpen etter produsentens anvisning – ikke bare spiker.',
  ]
  if (inn.aapentTak) {
    r.push('Åpne tak (carport/pergola) får oppløft fra vind. Bruk beslag mellom drager og stolpe og mellom sperre og drager (sperrebeslag/vinkelbeslag) i hver forbindelse.')
    r.push('Stiv av konstruksjonen med kneband (45°, 48×98) i begge retninger ved hver stolpe, eller vindkryss/stive vegger.')
  }
  if (inn.oppdriftPerStolpeKN !== undefined && inn.oppdriftPerStolpeKN > 0)
    r.push(`Beregnet netto oppløft ca. ${fmt(inn.oppdriftPerStolpeKN, 1)} kN per stolpe (bruddgrense) – stolpesko og fundament må ha minst denne strekkapasiteten.`)
  return r
}
