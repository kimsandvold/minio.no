import type * as THREE from 'three'

/**
 * Kjernekontrakt for det parametriske designverktøyet.
 *
 * Hvert produkt (plantekasse, varmepumpehus, bod …) implementerer én
 * `ProductTemplate`. Skallet (DesignerPage + DesignerViewport) er helt
 * produktuavhengig og driver alt via denne kontrakten. Modulen er bevisst
 * løst koblet fra resten av siden slik at den senere kan trekkes ut til et
 * eget domene.
 */

/** En fri konfigurasjon – nøkler tolkes av det enkelte templatet. */
export type DesignConfig = Record<string, number | string | boolean>

/** Et mål kunden kan justere (skyveknapp + dra-håndtak i 3D). */
export interface DimensionSpec {
  /** Feltnavn i config (må være et tall i cm). */
  key: string
  label: string
  min: number
  max: number
  step: number
  /** Enhet vist i UI. Standard: cm. */
  unit?: string
  /** Aksen håndtaket drar langs i 3D-scenen. */
  axis: 'x' | 'y' | 'z'
  /** Vis dra-håndtak i 3D. Standard: true. Sett false for kun slider. */
  handle?: boolean
  /** Vis dette målet kun når betingelsen er sann (ellers skjult). */
  visibleWhen?: (config: DesignConfig) => boolean
  /**
   * Vanlige verdier som vises som klikkbare hakk/holdepunkter under slideren
   * (f.eks. de vanligste takvinklene). Klikk setter verdien direkte.
   */
  markers?: number[]
}

/** Ett valg i en enumerert alternativgruppe (form, dimensjon, konstruksjon). */
export interface OptionChoice {
  id: string
  label: string
  note?: string
  /** Valgfritt ikon-navn / form-id for visuell knapp. */
  ikon?: string
  /**
   * Config-verdier som settes samtidig som dette valget velges (f.eks. en
   * fornuftig standard takvinkel når taktypen byttes). Slås sammen med
   * `{ [gruppe.key]: valg.id }`.
   */
  patch?: Partial<DesignConfig>
}

/** En gruppe enumererte valg – vist som knapper (ikke farge). */
export interface OptionGroup {
  key: string
  label: string
  choices: OptionChoice[]
  /** Vis gruppen kun når betingelsen er sann. */
  visibleWhen?: (config: DesignConfig) => boolean
}

/** Ett valg innenfor en materialgruppe (treslag, farge, dimensjon …). */
export interface MaterialChoice {
  id: string
  label: string
  /** Farge brukt i 3D-modellen. */
  hex: number
  /** CSS-farge for fargeprøven i UI. Standard: avledet fra hex. */
  swatch?: string
  /** Kort forklaring vist under valget. */
  note?: string
}

/** En gruppe materialvalg (radioknapper/fargeprøver i sidepanelet). */
export interface MaterialGroup {
  /** Feltnavn i config (en streng = valgt `MaterialChoice.id`). */
  key: string
  label: string
  choices: MaterialChoice[]
  /** Vis som fargeprøver i stedet for knapper. */
  asSwatches?: boolean
}

/** En/av-valg (bunn, duk, espalier …). */
export interface ToggleSpec {
  key: string
  label: string
  note?: string
}

/** Én rad i materiallisten. */
export interface BomLine {
  navn: string
  spesifikasjon?: string
  antall: number
  enhet: string
  kommentar?: string
}

/** Én rad i kapplista – en unik del med mål og antall. */
export interface KapplisteDel {
  navn: string
  profil: string
  lengdeCm: number
  antall: number
}

/** Resultatet av `beregn()` – materiallisten + estimat. */
export interface Bom {
  linjer: BomLine[]
  /** Veiledende materialkostnad i NOK. */
  estimatKr: number
  /** Kort sammendrag, f.eks. «120 × 80 × 60 cm · impregnert». */
  sammendrag: string
  /**
   * Grunnflate i m² til oppsummeringskortet. Rapporteres av templatet fordi
   * `bounds` er kamera-geometri (inkluderer utstikk, rekkverk, marginer) og
   * derfor ikke egner seg som brukervendt mål.
   */
  arealM2?: number
  /** Kort brukervendt målstreng til oppsummeringskortet, f.eks. «400 × 250 cm». */
  maal?: string
  /** Anslått montering/arbeidstid (timer) for dette produktet – overstyrer
   * den generiske arbeidstid-skaleringen når satt. */
  arbeidstimer?: number
}

/** Veiledende byggeregel-status (søknadsplikt, høyder, areal). */
export interface Byggeregler {
  /** Trolig unntatt søknadsplikt ved gjeldende mål? */
  sokfri: boolean
  /** Kort statustittel, f.eks. «Trolig søknadsfri». */
  tittel: string
  /** Punktvise merknader / forutsetninger. */
  punkter: string[]
}

/** Fysiske ytterdimensjoner (meter) – brukes til kamera og håndtak. */
export interface Bounds {
  x: number
  y: number
  z: number
}

/** Materialoverstyring for én del (paint bucket). */
export interface PartMaterial {
  treslag?: string
  farge?: string
}

/** Ekstra valg til buildMesh: per-del-materialer og trestruktur-tekstur. */
export interface BuildOptions {
  overrides?: Record<string, PartMaterial>
  woodTexture?: THREE.Texture | null
}

/** En malbar del (brukes av paint bucket-paletten). */
export interface PartSpec {
  key: string
  label: string
}

/**
 * Målsatt 2D-tegning (arbeidstegning). Templatet rapporterer rene 2D-riss
 * (plan/oppriss) med utgangspunkt i de samme parametrene som 3D-modellen –
 * ikke en projeksjon av mesh-en. Enheter er cm, y peker nedover (SVG).
 */
export interface Form2D {
  type: 'poly' | 'rect' | 'line'
  /** For poly/line: punktliste [x, y] i cm. */
  points?: Array<[number, number]>
  /** For rect: øvre venstre hjørne + størrelse i cm. */
  x?: number
  y?: number
  w?: number
  h?: number
  /** Stiplet (skjult kant / hjelpelinje). */
  dashed?: boolean
  /** Tynn hjelpe-/detaljstrek i stedet for hovedkontur. */
  tynn?: boolean
}

/** En målelinje – horisontal eller vertikal – med tekst. */
export interface Maal2D {
  x1: number
  y1: number
  x2: number
  y2: number
  /** Etikett. Skjules/maskeres når tegningen er låst. */
  label: string
  /** Forskyvning av målelinja ut fra geometrien (cm, fortegn styrer retning). */
  offset?: number
}

/** Fritt tekstmerke (f.eks. takvinkel) plassert i cm-koordinater. */
export interface Tekst2D {
  x: number
  y: number
  tekst: string
}

/** Ett riss (én projeksjon), f.eks. «Forfra». */
export interface Riss2D {
  id: string
  navn: string
  /** Tegneflatens utstrekning i cm (uten margin) – brukes til viewBox. */
  bredde: number
  hoyde: number
  former: Form2D[]
  maal: Maal2D[]
  tekster?: Tekst2D[]
  /**
   * Tegningstype. Klassifiserer risset i det søknadsklare tegningsheftet og
   * styrer rendering: 'fasade'/'snitt' tegnes med terrenglinje. Utelatt =
   * nøytralt arbeidsriss (ingen terreng), som før.
   */
  type?: 'plan' | 'fasade' | 'snitt'
}

/** Komplett 2D-tegningssett for gjeldende config. */
export interface Tegning2D {
  riss: Riss2D[]
}

/**
 * Tittelfelt (tegningsstempel) for søknadsklare tegninger. Fylles ut av
 * tiltakshaver før innsending; tomme felt tegnes som utfyllingslinje slik at
 * de kan skrives inn for hånd.
 */
export interface Tittelfelt {
  /** Kort beskrivelse av tiltaket, f.eks. «Frittstående carport 36 m²». */
  tiltak: string
  /** Hva dette arket viser, f.eks. «Fasade sør», «Plan», «Snitt A–A». */
  tegningstype: string
  /** Grafisk/nominell målestokk, f.eks. «grafisk» eller «1:100». */
  malestokk: string
  dato: string
  tegningsnr?: string
  tiltakshaver?: string
  adresse?: string
  gnrBnr?: string
  kommune?: string
}

export interface ProductTemplate<C extends DesignConfig = DesignConfig> {
  id: string
  navn: string
  /** Icon-navn (FontAwesome) til produktvelgeren. */
  ikon: string
  beskrivelse: string
  /** Bilde/render til produktvelger og forside-promo. */
  bilde?: string
  /** Ligger verktøyet klart, eller «kommer snart»? */
  tilgjengelig: boolean
  /**
   * Helt gratis produkt: materialliste, 2D-planvisning, nedlasting og utskrift
   * er alltid åpne – ingen betaling/kode kreves. Utelatt = betalt byggeplan.
   */
  gratis?: boolean
  /** Fra-pris for betalt materialliste + tegninger (NOK). */
  fraPris: number
  /**
   * Hvilke leveranser tilbys i oppsummeringskortet: 'ferdig' (bygget),
   * 'materialpakke' (kappet), 'plan' (byggeplan). Utelatt = alle tilbys.
   */
  leveranser?: Array<'ferdig' | 'materialpakke' | 'plan'>
  defaultConfig: C
  /** Ferdige oppsett kunden kan starte fra (f.eks. «Enkel carport»). */
  presets?: Array<{ id: string; navn: string; beskrivelse?: string; config: Partial<C> }>
  /** Form-/varianvalg vist først med ikoner (f.eks. kvadrat/L-form). */
  former?: OptionGroup
  dimensjoner: DimensionSpec[]
  materialer: MaterialGroup[]
  /** Enumererte konstruksjonsvalg (stolpedimensjon, o.l.). */
  alternativer?: OptionGroup[]
  valg?: ToggleSpec[]
  /** Beregn materialliste + estimat. Ren funksjon. */
  beregn: (config: C) => Bom
  /** Kappliste – unike deler med mål og antall (delevisning). */
  kappliste?: (config: C) => KapplisteDel[]
  /** Målsatt 2D-arbeidstegning (plan/oppriss) for gjeldende config. */
  tegning2D?: (config: C) => Tegning2D
  /**
   * Komplett søknadsklart tegningssett (plan + fasader + snitt), klassifisert
   * med `Riss2D.type`. Brukes til byggesøknad-heftet. Utelatt = ikke søknadsklar.
   */
  soknadTegning?: (config: C) => Tegning2D
  /** Monteringsanvisning – låses opp sammen med materiallisten. */
  montering?: (config: C) => string[]
  /** Råd om sammenføyning, verktøy og behandling (til PDF-planen). */
  raad?: (config: C) => string[]
  /** Veiledende status mot byggereglene (søknadsplikt, høyder, areal). */
  byggeregler?: (config: C) => Byggeregler
  /** Malbare deler (paint bucket). Meshene tagges med `userData.part`. */
  parts?: PartSpec[]
  /** Bygg 3D-modellen (sentrert i x/z, y fra 0 og opp), mål i meter. */
  buildMesh: (config: C, opts?: BuildOptions) => THREE.Group
  /** Ytterdimensjoner i meter for gjeldende config. */
  bounds: (config: C) => Bounds
}
