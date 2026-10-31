/**
 * Typer for den kjøpte byggeplanen (PDF + forhåndsvisning).
 *
 * Alt her er VALGFRITT og ADDITIVT: byggeplanen fungerer med dagens
 * `ProductTemplate` (types.ts), men blir rikere når templatene/
 * beregningskjernen leverer mer data. Typene ligger her (ikke i types.ts) så
 * PDF-motoren kan utvikles uavhengig av kjernekontrakten.
 *
 * Kobling:
 *  - Et template kan få en metode `beregningsgrunnlag(config)` som returnerer
 *    `Beregningsgrunnlag` → PDF-en får automatisk et beregningsvedlegg.
 *  - `kappliste()` kan returnere `KapplisteDelPlan` (utvider `KapplisteDel`)
 *    med pos, kvalitet, kappvinkler og presise mm-lengder.
 *  - `beregn().linjer` kan inneholde `BomLinePlan` (kategori, kvalitet, pris).
 *  - `tegning2D()`/`soknadTegning()` kan returnere `Riss2DPlan` (akser, snitt,
 *    skravur, påskrifter).
 *  - `monteringPlan(config)` kan erstatte `montering()` med strukturerte steg.
 *
 * Tekst som havner i PDF-en tegnes med standardfonten Helvetica (WinAnsi).
 * Greske bokstaver og matematiske tegn utenfor Latin-1 oversettes automatisk
 * (γ → g, ψ → psi, ≤ → <=), men skriv helst «gM», «psi0», «<=» direkte.
 */
import type { BomLine, DesignConfig, Form2D, KapplisteDel, ProductTemplate, Riss2D } from './types'

// ─────────────────────────────────────────────────────────────────────────
// Beregningsvedlegg (fra beregningskjernen: laster.ts / dimensjonering.ts)
// ─────────────────────────────────────────────────────────────────────────

/** Én inngangsverdi i beregningsgrunnlaget, f.eks. «Kommune: Lillehammer». */
export interface BeregningVerdi {
  navn: string
  verdi: string | number
  enhet?: string
  /** Kilde/forklaring, f.eks. «NS-EN 1991-1-3 NA tabell NA.4(901)». */
  kilde?: string
}

/** En last eller lastkombinasjon. */
export interface BeregningLast {
  navn: string
  /** Kort symbol, f.eks. «s», «q_k», «w_e». */
  symbol?: string
  verdi: number
  enhet: string
  /** Formel/uttrykk, f.eks. «s = mu1 · Ce · Ct · sk = 0,8 · 1,0 · 1,0 · 3,5». */
  uttrykk?: string
  kommentar?: string
}

/** Kontrolltype for et konstruksjonselement (Eurokode 5). */
export type KontrollType =
  | 'Bøyning'
  | 'Skjær'
  | 'Nedbøyning'
  | 'Knekking'
  | 'Trykk vinkelrett (opplegg)'
  | 'Trykk'
  | 'Strekk'
  | 'Vipping'
  | 'Svingning'
  | 'Forbindelse'
  | string

/** Kontroll av ett element (bjelke, sperre, stolpe …). */
export interface BeregningKontroll {
  /** Posisjonsmerke som i kapplista/tegningene, f.eks. «B». */
  pos?: string
  /** Hva som kontrolleres, f.eks. «Sperre», «Bjelkelag», «Drager over port». */
  komponent: string
  /** Tverrsnitt, f.eks. «48×198». */
  tverrsnitt: string
  /** Fasthetsklasse, f.eks. «C24», «GL30c». */
  kvalitet?: string
  /** Spennvidde i mm. */
  spennMm?: number
  /** Senteravstand i mm. */
  ccMm?: number
  kontroll: KontrollType
  /** Utnyttelsesgrad (0–1 = OK; > 1 = ikke OK). */
  utnyttelse: number
  /** Kravet, f.eks. «L/300», «sigma_m,d <= f_m,d». */
  krav?: string
  /** Beregnet/tillatt verdi, f.eks. «9,8 / 16,6 N/mm²». */
  detalj?: string
  kommentar?: string
}

/** Veiledning om søknadsplikt (plan- og bygningsloven / SAK10). */
export interface ByggesakVeiledning {
  /** «Unntatt søknadsplikt», «Søknadspliktig – tiltak uten ansvarsrett» … */
  tittel: string
  /** true = trolig unntatt; false = søknadspliktig; 'usikker' = må avklares. */
  sokfri: boolean | 'usikker'
  punkter: string[]
  /** Hjemmel, f.eks. «SAK10 § 4-1 første ledd bokstav a». */
  hjemmel?: string[]
  lenker?: Array<{ tekst: string; url: string }>
}

/**
 * Sammendrag av den statiske beregningen – blir et eget vedlegg i
 * byggeplanen. Alle felt utenom `kontroller`/`forbehold` kan utelates.
 */
export interface Beregningsgrunnlag {
  /** Versjon av beregningskjernen (vises i vedlegget), f.eks. «1.0». */
  versjon?: string
  /** Inngangsdata: kommune, sk, høyde over havet, vind, pålitelighetsklasse … */
  forutsetninger: BeregningVerdi[]
  /** Karakteristiske og dimensjonerende laster. */
  laster: BeregningLast[]
  /** Lastkombinasjoner (valgfritt). */
  lastkombinasjoner?: BeregningLast[]
  /** Element-kontroller med utnyttelsesgrad. */
  kontroller: BeregningKontroll[]
  /** Standarder og anvisninger lagt til grunn. */
  standarder: Array<{ kode: string; tittel: string }>
  /** Søknadsplikt/byggesak. */
  byggesak?: ByggesakVeiledning
  /** Frie merknader (forutsetninger for utførelsen, fundamentering …). */
  merknader?: string[]
  /** Ansvarsfraskrivelse – vises nederst i vedlegget. */
  forbehold: string
}

// ─────────────────────────────────────────────────────────────────────────
// Materialliste og kappliste
// ─────────────────────────────────────────────────────────────────────────

/** Grupper i materiallisten (rekkefølgen = rekkefølgen i PDF-en). */
export type Materialkategori =
  | 'fundament'
  | 'konstruksjon'
  | 'bjelkelag'
  | 'tak'
  | 'kledning'
  | 'dekke'
  | 'beslag'
  | 'festemidler'
  | 'overflate'
  | 'utstyr'
  | 'annet'

/** Materiallinje med valgfrie tilleggsfelt for byggeplanen. */
export interface BomLinePlan extends BomLine {
  kategori?: Materialkategori
  /** Kvalitet/sortering, f.eks. «C24», «NTR AB», «C24 / NTR AB». */
  kvalitet?: string
  /** Pris-id i `PRISER` (gir pris per linje). */
  prisId?: string
  /** Linjesum i NOK (overstyrer utregning fra prisId). */
  prisKr?: number
}

/** Kapp i én ende av en del. */
export interface KappEnde {
  /**
   * Sagvinkel i grader: 0 = rett kapp. F.eks. 22,5 for en sperre med 22,5°
   * takvinkel kappet loddrett, 45 for gjæring. Én desimal vises.
   */
  vinkel: number
  /** gjaering = i bredflaten (kappsag), fas = skråsnitt over tykkelsen. */
  type?: 'gjaering' | 'fas' | 'hakk' | 'fugleskjaer'
  merknad?: string
}

/** Kapplistedel med valgfrie tilleggsfelt. */
export interface KapplisteDelPlan extends KapplisteDel {
  /** Posisjonsmerke (A, B …). Utelatt = løpende bokstav etter rekkefølge. */
  pos?: string
  /** Presis lengde i mm (overstyrer lengdeCm × 10). */
  lengdeMm?: number
  /** Kvalitet, f.eks. «C24», «NTR AB». */
  kvalitet?: string
  endeA?: KappEnde
  endeB?: KappEnde
  merknad?: string
  kategori?: Materialkategori
}

// ─────────────────────────────────────────────────────────────────────────
// Tegninger
// ─────────────────────────────────────────────────────────────────────────

/** Materialskravur for snittede flater. */
export type Fyll = 'tre' | 'betong' | 'isolasjon' | 'jord' | 'grus' | 'stal' | 'tett'

/** Form med skravur/linjevekt. */
export interface Form2DPlan extends Form2D {
  /** Fyll/skravur (kun lukkede former: rect og lukket poly). */
  fyll?: Fyll
  /** Snittet element (tykk kontur). */
  snittet?: boolean
}

/** Påskrift med valgfri pil (leder) til et punkt. Enheter cm som Riss2D. */
export interface Paaskrift {
  x: number
  y: number
  tekst: string
  /** Pilspiss-punkt. */
  tilX?: number
  tilY?: number
}

/** Rutenett-/aksepil. `retning: 'x'` = loddrett linje ved x = pos. */
export interface Akse {
  navn: string
  retning: 'x' | 'y'
  pos: number
}

/** Snittmarkering i en plan. */
export interface Snittmarkor {
  navn: string
  x1: number
  y1: number
  x2: number
  y2: number
  /** Synsretning: 1 = mot venstre side av linja (sett fra punkt 1 mot 2). */
  retning?: 1 | -1
}

/** Riss med tilleggsfelt (bakoverkompatibelt med `Riss2D`). */
export interface Riss2DPlan extends Riss2D {
  former: Form2DPlan[]
  /** Ønsket målestokk (nevner, f.eks. 50 for 1:50). Utelatt = automatisk. */
  malestokk?: number
  akser?: Akse[]
  paaskrifter?: Paaskrift[]
  snitt?: Snittmarkor[]
  /** Vis nordpil (grader fra opp). */
  nordpil?: number
}

// ─────────────────────────────────────────────────────────────────────────
// Montering
// ─────────────────────────────────────────────────────────────────────────

/** Byggetrinn – kobler steg til illustrasjon av modellen lag for lag. */
export type Byggetrinn = 'fundament' | 'reisverk' | 'bjelkelag' | 'tak' | 'kledning' | 'ferdig'

export interface MonteringSteg {
  tittel: string
  tekst: string
  trinn?: Byggetrinn
  verktoy?: string[]
  /** Tidsanslag for steget (timer). */
  tidTimer?: number
  /** Sikkerhets-/kvalitetsmerknad som fremheves. */
  advarsel?: string
}

// ─────────────────────────────────────────────────────────────────────────
// Utvidet template (leses løst – ingen endring i types.ts kreves)
// ─────────────────────────────────────────────────────────────────────────

/** Valgfrie plan-metoder et template kan tilby i tillegg til `ProductTemplate`. */
export interface PlanUtvidelser<C extends DesignConfig = DesignConfig> {
  beregningsgrunnlag?: (config: C) => Beregningsgrunnlag | undefined
  monteringPlan?: (config: C) => MonteringSteg[]
}

export type ProductTemplateMedPlan = ProductTemplate & PlanUtvidelser

/** Leser beregningsgrunnlaget fra et template hvis det finnes (feiltolerant). */
export function hentBeregningsgrunnlag(t: ProductTemplate, c: DesignConfig): Beregningsgrunnlag | undefined {
  const f = (t as ProductTemplateMedPlan).beregningsgrunnlag
  if (typeof f !== 'function') return undefined
  try {
    return f(c) ?? undefined
  } catch (e) {
    console.warn('beregningsgrunnlag feilet', e)
    return undefined
  }
}

/** Kort oppsummering av kontrollene (til panel/merker i UI). */
export function statikkOppsummering(g: Beregningsgrunnlag | undefined): { maks: number; antall: number; feil: number } | null {
  if (!g?.kontroller.length) return null
  const maks = Math.max(...g.kontroller.map((k) => k.utnyttelse))
  return { maks, antall: g.kontroller.length, feil: g.kontroller.filter((k) => k.utnyttelse > 1).length }
}
