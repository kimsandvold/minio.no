/**
 * Gravering – produktdata for /gravering og graveringskonfiguratoren.
 *
 * Modellen er bygget rundt PRODUKTTYPE, ikke form: en termos har volum og
 * farge, en fjøl har størrelse, treslag og kant. Hvert produkt bestemmer selv
 * hvilke valg som vises, hva de heter («Treslag» vs «Farge» vs «Antall») og
 * hvor mange tekstlinjer det er plass til.
 *
 * PRISER: alt som koster penger ligger i `varianter[].pris` og `flater[].tillegg`
 * her i filen – aldri ute i komponentene. Prisene er veiledende og vises alltid
 * som «fra»; endelig pris settes i tilbudet.
 */

export type ProduktId =
  | 'fjol-rekt'
  | 'kjevle'
  | 'fjol-rund'
  | 'glassbrikke'
  | 'drikkeflaske'
  | 'termokopp'
  | 'skinnlapp'

/**
 * Hvordan overflaten tegnes i forhåndsvisningen.
 *
 * `stal` er børstet metall med synlige striper; `lakk` er pulverlakk, som er
 * helt glatt – striper der ville sett ut som riller flaska ikke har.
 */
export type Tekstur = 'tre' | 'stal' | 'lakk' | 'skinn'

/**
 * Hvordan motivet er komponert på flaten. Oppsettet bestemmer plassering,
 * størrelsesforhold og hvilke streker som tegnes rundt teksten – det er dette
 * som skiller et diskret hjørnemerke fra et klassisk midtstilt navn.
 */
export type OppsettId =
  | 'senter'
  | 'linjer'
  | 'monogram'
  | 'hjorne'
  | 'venstre'
  // Kjevleoppsett: motivet ligger i det utbrettede sylinderplanet og må gå
  // sømløst rundt, ikke bare pent innenfor en kant.
  | 'monster'
  | 'monstertekst'

/** Geometrien forhåndsvisningen bruker. */
export type FormId = 'rekt' | 'kjevle' | 'rund' | 'brikke' | 'flaske' | 'kopp' | 'lapp'

export interface Flate {
  id: string
  navn: string
  beskrivelse: string
  tekstur: Tekstur
  /** Grunnfarge i forhåndsvisningen. */
  farge: string
  /** Åre, børsting eller narv – mørkere eller lysere enn grunnfargen. */
  areFarge: string
  /** Fargen graveringen får. På pulverlakkert stål blir den LYSERE enn flaten. */
  brentFarge: string
  /** Bærestroppens farge, der produktet har en. Målt fra produktbildene. */
  stroppFarge?: string
  tillegg: number
}

export interface Variant {
  id: string
  navn: string
  /** Mål i mm som geometrien tegner etter. For runde: bredde = høyde = diameter. */
  bredde: number
  hoyde: number
  beskrivelse: string
  pris: number
  /** Antall enheter kunden får. 1 for enkeltprodukter, 4/6/10 … for sett. */
  antall: number
}

export interface KantDetalj {
  id: string
  navn: string
  beskrivelse: string
  tillegg: number
}

export interface GraveringProdukt {
  id: ProduktId
  navn: string
  kort: string
  form: FormId
  /** Overskriften over flatevalgene – «Treslag», «Farge» eller «Skinn». */
  flateEtikett: string
  flater: Flate[]
  /** Overskriften over variantvalgene – «Størrelse», «Volum» eller «Antall». */
  variantEtikett: string
  varianter: Variant[]
  /** Kantbehandling finnes bare på fjølene. */
  kanter: KantDetalj[] | null
  maksLinjer: number
  /**
   * Skal prislinja vise det fysiske målet fra geometrien («350 × 220 mm»)?
   * Nei for volum- og antallsprodukter, der «500 ml» og «Sett med 6» sier mer.
   */
  maalIPris: boolean
  /**
   * Hvor mye materialtillegget teller per enhet. En glassbrikke på 10 cm bruker
   * en brøkdel av eika en hel fjøl gjør, så uten dette ville eik på et sett med
   * seks brikker kostet seks ganger fjølpåslaget.
   */
  flateFaktor: number
  /** Teksten under forhåndsvisningen, til høyre for målet. */
  spesifikasjon: string
  /**
   * Prisen for selve graveringsjobben, når den ikke allerede ligger i
   * produktprisen. `null` betyr at `varianter[].pris` er en samlet pris med
   * gravering inkludert – slik resten av utvalget fortsatt er priset.
   */
  gravering: { pris: number; etikett: string } | null
  /**
   * Er produktet i salg nå? Utvalget snevres bevisst inn til det vi faktisk
   * har på lager og kan levere – resten blir stående i koden, ferdig tegnet,
   * til vi tar dem inn igjen.
   */
  tilgjengelig: boolean
  /** Motivoppsettene som kler produktet, i den rekkefølgen de vises. */
  oppsett: OppsettId[]
  start: {
    flate: string
    variant: string
    kant: string | null
    oppsett: OppsettId
    linjer: [string, string, string]
    font: string
    symbol: string | null
  }
}

// --- Flater -------------------------------------------------------------

/** Bøk er det eneste treslaget vi lagerfører skjærefjøla i. */
const BOK: Flate = {
  id: 'bok',
  navn: 'Bøk',
  beskrivelse: 'Lys og jevn med fin, tett åre. Hard nok til kniv, og graveringen står skarpt.',
  tekstur: 'tre',
  farge: '#e8d3b0',
  areFarge: '#c9ac82',
  brentFarge: '#5a3a1c',
  tillegg: 0,
}

const TRESLAG: Flate[] = [
  BOK,
  {
    id: 'ask',
    navn: 'Ask',
    beskrivelse: 'Lys, seig og rett i veden. Tydelig åre uten å ta oppmerksomheten.',
    tekstur: 'tre',
    farge: '#ead9bb',
    areFarge: '#cbb48c',
    brentFarge: '#5c3a18',
    tillegg: 80,
  },
  {
    id: 'eik',
    navn: 'Eik',
    beskrivelse: 'Hardt og slitesterkt med markert åretegning. Det klassiske valget.',
    tekstur: 'tre',
    farge: '#d9bd8f',
    areFarge: '#b2905f',
    brentFarge: '#4a2d13',
    tillegg: 100,
  },
  {
    id: 'valnott',
    navn: 'Valnøtt',
    beskrivelse: 'Mørk og dyp. Graveringen brenner nesten sort og gir et dempet, diskret preg.',
    tekstur: 'tre',
    farge: '#6b4428',
    areFarge: '#4e2f1a',
    brentFarge: '#2a1708',
    tillegg: 250,
  },
]

/**
 * Pulverlakkert stål. Laseren brenner ikke – den tar vekk lakken, så motivet
 * blir blankt stål mot farget bakgrunn. Derfor er `brentFarge` lysere enn
 * `farge` her, motsatt av tre og skinn.
 */
const STAL: Flate[] = [
  {
    id: 'sort',
    navn: 'Sort matt',
    beskrivelse: 'Matt sort lakk. Størst kontrast – graveringen lyser som blankt stål.',
    tekstur: 'stal',
    farge: '#2b2b2d',
    areFarge: '#3f3f42',
    brentFarge: '#cfccc5',
    tillegg: 0,
  },
  {
    id: 'stal',
    navn: 'Børstet stål',
    beskrivelse: 'Ulakkert, børstet overflate. Diskret gravering i matt grått.',
    tekstur: 'stal',
    farge: '#b4b3b0',
    areFarge: '#9a9996',
    brentFarge: '#5f5e5c',
    tillegg: 0,
  },
  {
    id: 'hvit',
    navn: 'Hvit',
    beskrivelse: 'Ren hvit lakk. Graveringen kommer fram som en mørkere, matt strek.',
    tekstur: 'stal',
    farge: '#eceae6',
    areFarge: '#d6d3cd',
    brentFarge: '#7d7a74',
    tillegg: 0,
  },
  {
    id: 'marine',
    navn: 'Marineblå',
    beskrivelse: 'Dyp blå lakk. Samme stålkontrast som sort, men litt varmere.',
    tekstur: 'stal',
    farge: '#27374d',
    areFarge: '#334760',
    brentFarge: '#cfccc5',
    tillegg: 0,
  },
]

/**
 * Drikkeflaska vi har på lager: pulverlakkert i tre lyse farger. Laseren tar vekk
 * lakken, så motivet blir blankt stål – mot en lys lakk leser det som en
 * mattgrå strek, ikke som noe lyst. Derfor er `brentFarge` MØRKERE enn flaten
 * her, motsatt av de sorte og marineblå i `STAL`.
 */
const FLASKEFARGER: Flate[] = [
  {
    id: 'hvit',
    navn: 'Hvit',
    beskrivelse: 'Ren, matt hvit. Mest nøytral – graveringen står som en rolig grå strek.',
    tekstur: 'lakk',
    farge: '#eeece8',
    areFarge: '#dad7d1',
    brentFarge: '#605c55',
    stroppFarge: '#dedad2',
    tillegg: 0,
  },
  {
    id: 'lysegronn',
    navn: 'Lysegrønn',
    beskrivelse: 'Dempet salviegrønn med lys stropp. Varmest av de tre, og tåler bruk uten å se sliten ut.',
    tekstur: 'lakk',
    // Målt fra produktbildet: kroppen #aab8a3, kanten litt mørkere.
    farge: '#aab8a3',
    areFarge: '#93a28c',
    brentFarge: '#49543f',
    stroppFarge: '#cfd0b8',
    tillegg: 0,
  },
  {
    id: 'lyserosa',
    navn: 'Lyserosa',
    beskrivelse: 'Myk, støvet rosa med stropp i samme farge. Fin til gaver, og graveringen får god kontrast.',
    tekstur: 'lakk',
    // Målt fra produktbildet: kroppen #f1dedd, stroppen tydelig mørkere.
    farge: '#f1dedd',
    areFarge: '#dec6c4',
    brentFarge: '#6b5351',
    stroppFarge: '#c08e92',
    tillegg: 0,
  },
]

const SKINN: Flate[] = [
  {
    id: 'natur',
    navn: 'Natur',
    beskrivelse: 'Ubehandlet vegetabilsk garvet skinn. Mørkner pent med tiden.',
    tekstur: 'skinn',
    farge: '#c08a52',
    areFarge: '#a87340',
    brentFarge: '#5a3317',
    tillegg: 0,
  },
  {
    id: 'cognac',
    navn: 'Cognac',
    beskrivelse: 'Varm, middels brun. Den vanligste – står godt til det meste.',
    tekstur: 'skinn',
    farge: '#a8713f',
    areFarge: '#8e5c30',
    brentFarge: '#4a2a12',
    tillegg: 0,
  },
  {
    id: 'morkebrun',
    navn: 'Mørkebrun',
    beskrivelse: 'Dyp brun. Diskret, og tåler søl og bruk uten å se slitt ut.',
    tekstur: 'skinn',
    farge: '#5b3a23',
    areFarge: '#492d19',
    brentFarge: '#2c190c',
    tillegg: 0,
  },
  {
    id: 'sortskinn',
    navn: 'Sort',
    beskrivelse: 'Sort skinn. Lavest kontrast i graveringen, men mest nøytralt.',
    tekstur: 'skinn',
    farge: '#2a2622',
    areFarge: '#201d1a',
    brentFarge: '#0f0d0b',
    tillegg: 0,
  },
]

const FJOLKANTER: KantDetalj[] = [
  { id: 'rett', navn: 'Rett kant', beskrivelse: 'Pusset og oljet rett kant. Enklest og rimeligst.', tillegg: 0 },
  { id: 'fas', navn: 'Fasede kanter', beskrivelse: 'Skråskårne kanter som gir fjøla et mykere uttrykk.', tillegg: 60 },
  { id: 'saftrille', navn: 'Saftrille', beskrivelse: 'Frest rille langs kanten som samler kraft og saft.', tillegg: 90 },
]

// --- Produkter ----------------------------------------------------------

export const graveringProdukter: GraveringProdukt[] = [
  {
    id: 'fjol-rekt',
    navn: 'Skjærefjøl',
    kort: 'Skjærefjøl i massiv bøk med saftrille',
    form: 'rekt',
    flateEtikett: 'Treslag',
    // Bare bøk: dette er fjøla vi faktisk har, ikke et utvalg vi kan skaffe.
    flater: [BOK],
    variantEtikett: 'Størrelse',
    varianter: [
      {
        id: 'standard',
        navn: '350 × 240 mm',
        bredde: 350,
        hoyde: 240,
        beskrivelse: 'Hverdagsfjøl med saftrille',
        // Bare emnet, med et nøkternt påslag på innkjøpet. Samme fjøl står hos
        // Europris til 149, så et høyt påslag her er lett å gjennomskue –
        // marginen tas på graveringsjobben i stedet.
        pris: 199,
        antall: 1,
      },
    ],
    // Saftrille og avrundede hjørner er frest inn fra før – ikke et tilvalg.
    kanter: null,
    maksLinjer: 3,
    maalIPris: true,
    flateFaktor: 1,
    spesifikasjon: 'Massiv bøk · 15 mm · saftrille',
    // Her ligger arbeidet: pussing, korrektur, lasertid, oljing og pakking.
    gravering: { pris: 249, etikett: 'Gravering, pussing og olje' },
    tilgjengelig: true,
    oppsett: ['senter', 'linjer', 'monogram', 'hjorne', 'venstre'],
    start: {
      flate: 'bok',
      variant: 'standard',
      kant: null,
      oppsett: 'senter',
      linjer: ['{familie}', '{sted}', ''],
      font: 'Cormorant Garamond',
      symbol: null,
    },
  },
  {
    id: 'kjevle',
    navn: 'Kjevle',
    kort: 'Pregekjevle i bøk – mønsteret trykkes i deigen',
    form: 'kjevle',
    flateEtikett: 'Treslag',
    flater: [BOK],
    variantEtikett: 'Størrelse',
    varianter: [
      {
        id: 'standard',
        navn: 'Ø 50 × 250 mm',
        // bredde = hele lengden med håndtak, hoyde = diameter. Trykkflaten
        // regnes ut i geometrien.
        bredde: 430,
        hoyde: 50,
        beskrivelse: 'Klassisk kjevle med dreibare håndtak',
        pris: 249,
        antall: 1,
      },
    ],
    kanter: null,
    maksLinjer: 2,
    maalIPris: false,
    flateFaktor: 1,
    spesifikasjon: 'Massiv bøk · speilvendt pregemotiv',
    // Et mønster rundt hele trykkflaten er vesentlig mer lasertid enn et navn.
    gravering: { pris: 299, etikett: 'Gravering av pregemotiv' },
    tilgjengelig: true,
    oppsett: ['monster', 'monstertekst', 'senter'],
    start: {
      flate: 'bok',
      variant: 'standard',
      kant: null,
      oppsett: 'monster',
      linjer: ['God jul', '{familie}', ''],
      font: 'Cormorant Garamond',
      symbol: 'gingerbread',
    },
  },
  {
    id: 'fjol-rund',
    navn: 'Rund fjøl',
    kort: 'Rund serveringsfjøl med opphengshull',
    form: 'rund',
    flateEtikett: 'Treslag',
    flater: TRESLAG,
    variantEtikett: 'Diameter',
    varianter: [
      { id: 'liten', navn: 'Ø 240 mm', bredde: 240, hoyde: 240, beskrivelse: 'Ost og spekemat til to', pris: 499, antall: 1 },
      { id: 'medium', navn: 'Ø 300 mm', bredde: 300, hoyde: 300, beskrivelse: 'Serveringsfat til bordet', pris: 649, antall: 1 },
      { id: 'stor', navn: 'Ø 360 mm', bredde: 360, hoyde: 360, beskrivelse: 'Stort fat til selskap', pris: 849, antall: 1 },
    ],
    kanter: FJOLKANTER,
    maksLinjer: 3,
    maalIPris: true,
    flateFaktor: 1,
    spesifikasjon: '20 mm tykk, oljet',
    gravering: null,
    tilgjengelig: false,
    oppsett: ['senter', 'linjer', 'monogram'],
    start: { flate: 'bok', variant: 'medium', oppsett: 'senter', kant: 'rett', linjer: ['Ida & Jonas', '14. juni {ar}', ''], font: 'Great Vibes', symbol: 'heart' },
  },
  {
    id: 'glassbrikke',
    navn: 'Glassbrikker',
    kort: 'Runde underlag i tre, i sett',
    form: 'brikke',
    flateEtikett: 'Treslag',
    flater: TRESLAG,
    variantEtikett: 'Antall',
    varianter: [
      { id: 'sett4', navn: 'Sett med 4', bredde: 100, hoyde: 100, beskrivelse: 'Ø 100 mm · samme gravering på alle', pris: 449, antall: 4 },
      { id: 'sett6', navn: 'Sett med 6', bredde: 100, hoyde: 100, beskrivelse: 'Ø 100 mm · samme gravering på alle', pris: 599, antall: 6 },
    ],
    kanter: null,
    maksLinjer: 2,
    maalIPris: false,
    flateFaktor: 0.25,
    spesifikasjon: '10 mm tykke, oljet',
    gravering: null,
    tilgjengelig: false,
    oppsett: ['senter', 'monogram', 'linjer'],
    start: { flate: 'eik', variant: 'sett6', oppsett: 'senter', kant: null, linjer: ['{etternavn}', '', ''], font: 'Montserrat', symbol: 'tree' },
  },
  {
    id: 'drikkeflaske',
    navn: 'Drikkeflaske',
    kort: 'Drikkeflaske i pulverlakkert stål, med klaff-lokk og bærestropp',
    form: 'flaske',
    flateEtikett: 'Farge',
    flater: FLASKEFARGER,
    variantEtikett: 'Volum',
    varianter: [
      // Målene styrer tegningen: forholdet mellom høyde og diameter er hentet
      // fra produktbildet. Volumene er fortsatt uavklart.
      //
      // PRIS: graverte stålflasker ligger i markedet på 199–320 kr (Nfoto og
      // Strande 249, LazerStore og Walseng 298–299, AD Trykk 320). Emneprisen
      // er satt slik at totalen lander midt i det spennet – ikke etter samme
      // logikk som fjøla, der produktet er sjeldnere og tåler mer.
      { id: '500', navn: '500 ml', bredde: 70, hoyde: 265, beskrivelse: 'Til sekken og treningen', pris: 149, antall: 1 },
      { id: '750', navn: '750 ml', bredde: 73, hoyde: 300, beskrivelse: 'Til turen og lange dager', pris: 199, antall: 1 },
    ],
    kanter: null,
    maksLinjer: 2,
    maalIPris: false,
    flateFaktor: 1,
    spesifikasjon: 'Pulverlakkert stål · klaff-lokk',
    // Ingen pussing eller oljing her – flaska tørkes av og pakkes.
    gravering: { pris: 150, etikett: 'Gravering' },
    tilgjengelig: true,
    oppsett: ['senter', 'linjer', 'monogram'],
    start: { flate: 'hvit', variant: '500', oppsett: 'senter', kant: null, linjer: ['{etternavn}', '{sted}', ''], font: 'Bebas Neue', symbol: 'pine' },
  },
  {
    id: 'termokopp',
    navn: 'Termokopp',
    kort: 'Termokopp med tett lokk',
    form: 'kopp',
    flateEtikett: 'Farge',
    flater: STAL,
    variantEtikett: 'Volum',
    varianter: [
      { id: '350', navn: '350 ml', bredde: 80, hoyde: 160, beskrivelse: 'Kaffekoppen til jobb', pris: 399, antall: 1 },
      { id: '450', navn: '450 ml', bredde: 86, hoyde: 180, beskrivelse: 'Litt mer å gå på', pris: 449, antall: 1 },
    ],
    kanter: null,
    maksLinjer: 2,
    maalIPris: false,
    flateFaktor: 1,
    spesifikasjon: 'Dobbeltvegget stål, tett lokk',
    gravering: null,
    tilgjengelig: false,
    oppsett: ['senter', 'linjer', 'monogram'],
    start: { flate: 'marine', variant: '350', oppsett: 'senter', kant: null, linjer: ['{fornavn}', '', ''], font: 'Montserrat', symbol: null },
  },
  {
    id: 'skinnlapp',
    navn: 'Navnelapper i skinn',
    kort: 'Navn på jakka, sekken og barnehagetøyet',
    form: 'lapp',
    flateEtikett: 'Skinn',
    flater: SKINN,
    variantEtikett: 'Antall',
    varianter: [
      { id: '10', navn: '10 stk', bredde: 60, hoyde: 25, beskrivelse: 'Til ett barn', pris: 299, antall: 10 },
      { id: '20', navn: '20 stk', bredde: 60, hoyde: 25, beskrivelse: 'Til to barn, eller en hel sesong', pris: 449, antall: 20 },
      { id: '30', navn: '30 stk', bredde: 60, hoyde: 25, beskrivelse: 'Til søskenflokken', pris: 599, antall: 30 },
    ],
    kanter: null,
    maksLinjer: 2,
    maalIPris: false,
    flateFaktor: 1,
    spesifikasjon: '60 × 25 mm, hull til påsying',
    gravering: null,
    tilgjengelig: false,
    oppsett: ['senter', 'linjer'],
    start: { flate: 'cognac', variant: '20', oppsett: 'senter', kant: null, linjer: ['{fornavn}', '', ''], font: 'Montserrat', symbol: null },
  },
]

/** Produktene som er i salg nå – det konfiguratoren og prisene bruker. */
export const synligeProdukter = graveringProdukter.filter((p) => p.tilgjengelig)

/** Treslagene vi graverer i, til materialseksjonen på /gravering. */
export const graveringTreslag = TRESLAG

export function produkt(id: ProduktId): GraveringProdukt {
  return graveringProdukter.find((p) => p.id === id) ?? graveringProdukter[0]
}

// --- Motiv, skrift og symboler ------------------------------------------

export interface OppsettMal {
  id: OppsettId
  navn: string
  beskrivelse: string
}

/**
 * Oppsettene bestemmer komposisjonen, ikke innholdet: samme navn kan stå
 * midtstilt og klassisk, sperret mellom to hårstreker, eller som et lite
 * merke nede i hjørnet. Selve plasseringen regnes ut i `graveringMotiv.ts`.
 */
export const graveringOppsett: OppsettMal[] = [
  { id: 'senter', navn: 'Midtstilt', beskrivelse: 'Navnet stort i midten, undertekst under. Det klassiske.' },
  { id: 'linjer', navn: 'Mellom streker', beskrivelse: 'Sperret versal mellom to hårstreker. Rolig og moderne.' },
  { id: 'monogram', navn: 'Monogram', beskrivelse: 'Initialen i en tynn ring, med navnet under.' },
  { id: 'hjorne', navn: 'Hjørnemerke', beskrivelse: 'Liten signatur nede til høyre, som et produsentmerke.' },
  { id: 'venstre', navn: 'Venstrestilt', beskrivelse: 'Tekstblokk mot venstre kant, med en kort strek over.' },
  { id: 'monster', navn: 'Mønster', beskrivelse: 'Symbolet gjentatt sømløst rundt hele kjevla.' },
  { id: 'monstertekst', navn: 'Mønster og tekst', beskrivelse: 'Tekstbånd langs kjevla, med mønster over og under.' },
]

export function oppsettMal(id: OppsettId): OppsettMal {
  return graveringOppsett.find((o) => o.id === id) ?? graveringOppsett[0]
}

/** Kuratert utvalg – hele fontlista fra skiltdesigneren er for mye her. */
export const graveringFonter = [
  'Montserrat',
  'Playfair Display',
  'Cormorant Garamond',
  'Lora',
  'Bebas Neue',
  'Dancing Script',
  'Great Vibes',
  'Permanent Marker',
]

/**
 * Symbolkategoriene som gir mening å gravere, i den rekkefølgen de vises.
 * Rekkefølgen er hverdagen først (mat, natur, former), så det tematiske.
 * Piler, kontor og univers er utelatt – de hører ikke hjemme på en fjøl.
 */
export const graveringSymbolKategorier = [
  'Mat',
  'Natur',
  'Former',
  'Dekor',
  'Hjem',
  'Dyr',
  'Jul',
  'Halloween',
  'Sport',
  'Verktoy',
  'Jakt',
  'Villmark',
  'Trearbeid',
  'Kunst',
]

// --- Pris ---------------------------------------------------------------

/** Tillegg per tekstlinje utover den første. */
export const PRIS_EKSTRA_LINJE = 40

export interface Valg {
  produkt: ProduktId
  flate: string
  variant: string
  kant: string | null
  oppsett: OppsettId
  /**
   * Kundens egen plassering av motivet i flaten. Utelatt eller 'auto' betyr at
   * oppsettet bestemmer selv – et hjørnemerke havner i hjørnet uten at noen
   * trenger å si det.
   */
  juster?: 'auto' | 'venstre' | 'midt' | 'hoyre'
  loddrett?: 'auto' | 'topp' | 'midt' | 'bunn'
  linjer: [string, string, string]
  font: string
  symbol: string | null
}

export interface Prislinje {
  etikett: string
  kroner: number
}

/**
 * Prisoppsett som både konfiguratoren og forespørselen viser.
 *
 * `maal` er målet slik kunden ser det under forhåndsvisningen. Det sendes inn
 * fordi geometrien eier det: en rund fjøl er «Ø 300 mm», ikke «300 × 300 mm».
 */
export function prisFor(valg: Valg, maal?: string): { linjer: Prislinje[]; sum: number } {
  const p = produkt(valg.produkt)
  const variant = p.varianter.find((v) => v.id === valg.variant) ?? p.varianter[0]
  const flate = p.flater.find((f) => f.id === valg.flate) ?? p.flater[0]
  const kant = p.kanter?.find((k) => k.id === valg.kant)
  const ekstraLinjer = Math.max(0, valg.linjer.slice(0, p.maksLinjer).filter((l) => l.trim()).length - 1)

  // «Skjærefjøl – 350 × 220 mm», men «Termos – 500 ml» og «Glassbrikker – Sett med 6».
  const maalTekst = p.maalIPris && maal ? maal : variant.navn
  const linjer: Prislinje[] = [{ etikett: `${p.navn} – ${maalTekst}`, kroner: variant.pris }]
  // Graveringsjobben står for seg der produktprisen bare dekker emnet.
  if (p.gravering) {
    linjer.push({
      etikett: variant.antall > 1 ? `${p.gravering.etikett} × ${variant.antall}` : p.gravering.etikett,
      kroner: p.gravering.pris * variant.antall,
    })
  }
  // Materialtillegget gjelder per enhet, skalert etter hvor mye materiale
  // enheten faktisk bruker (se `flateFaktor`).
  const flateTillegg = Math.round(flate.tillegg * p.flateFaktor * variant.antall)
  if (flateTillegg) {
    linjer.push({
      etikett: variant.antall > 1 ? `${flate.navn} × ${variant.antall}` : flate.navn,
      kroner: flateTillegg,
    })
  }
  if (kant?.tillegg) linjer.push({ etikett: kant.navn, kroner: kant.tillegg })
  if (ekstraLinjer) {
    linjer.push({
      etikett: `${ekstraLinjer} ekstra tekstlinje${ekstraLinjer > 1 ? 'r' : ''}`,
      kroner: ekstraLinjer * PRIS_EKSTRA_LINJE,
    })
  }

  return { linjer, sum: linjer.reduce((n, l) => n + l.kroner, 0) }
}

/**
 * Laveste ferdigpris for ett produkt med gravering, til «fra»-tekster. Teller
 * graveringen med der den er en egen linje – ellers ville fjøla se ut som 299.
 */
export function fraPris(p: GraveringProdukt): number {
  return Math.min(...p.varianter.map((v) => v.pris)) + (p.gravering?.pris ?? 0)
}

/** Laveste pris på tvers av alt vi graverer – til «fra»-tekster. */
export const graveringFraPris = Math.min(...synligeProdukter.map(fraPris))

// --- Bestilling ---------------------------------------------------------

/**
 * En linje i bestillingen: ett ferdig konfigurert produkt med sin egen pris og
 * sitt eget antall. Konfiguratoren samler flere linjer før innsending – både
 * fordi folk kjøper to like gaver, og fordi fri frakt-terskelen ellers er
 * uoppnåelig når man bare kan sende én vare om gangen.
 */
export interface Ordrelinje {
  /** Lokal id, bare for å kunne fjerne riktig linje. */
  id: string
  valg: Valg
  /** Målet slik geometrien oppgir det, f.eks. «350 × 240 mm». */
  maal: string
  linjer: Prislinje[]
  /** Pris for ÉN enhet. Antallet ganges på i summen. */
  sum: number
  antall: number
}

export function ordreSum(ordre: Ordrelinje[]): number {
  return ordre.reduce((n, l) => n + l.sum * l.antall, 0)
}

export function ordreAntall(ordre: Ordrelinje[]): number {
  return ordre.reduce((n, l) => n + l.antall, 0)
}

// --- Frakt og kampanje --------------------------------------------------

/**
 * Frakt oppgis som et KONKRET TALL, ikke «kommer i tillegg». Et ukjent beløp
 * rett før innsending er den vanligste grunnen til at folk hopper av, og
 * 139 kr skremmer mindre enn uvissheten gjør.
 */
export const FRAKT = 139

/**
 * Førjulskampanjen: fri frakt over en terskel, ikke prisavslag.
 *
 * 1. Juridisk: prisopplysningsforskriften § 9a krever at en annonsert
 *    prisnedsettelse oppgir laveste pris de siste 30 dagene. Produktene har
 *    aldri vært solgt, så det finnes ingen førpris – «20 % rabatt» ville vært
 *    ulovlig markedsføring til vi har 30 dagers prishistorikk.
 * 2. Forretningsmessig: fri frakt til alle spiste 140 kr av en margin på 224.
 *    En terskel løfter handlekurven i stedet: to gaver, eller fjøl + kjevle,
 *    og da bærer ordren frakten selv.
 *
 * Slå av med `aktiv: false` – da gjelder vanlig frakt på alt.
 */
export const graveringKampanje = {
  aktiv: true,
  grense: 700,
  merke: 'Fri frakt over 700 kr',
  /** Siste dag kampanjen gjelder. Står i all tekst via `frist`. */
  frist: '15. desember',
  tekst:
    'Vi tar frakten på ordre over 700 kroner til og med 15. desember – to gaver, eller fjøl og kjevle sammen.',
}

export interface Frakt {
  kroner: number
  gratis: boolean
}

/** Frakten for en ordresum, med kampanjen tatt i betraktning. */
export function fraktFor(sum: number): Frakt {
  const gratis = graveringKampanje.aktiv && sum >= graveringKampanje.grense
  return { kroner: gratis ? 0 : FRAKT, gratis }
}

/**
 * Minio er et enkeltpersonforetak under grensen for mva-registrering, så
 * prisene er endelige: ingen merverdiavgift legges til ved fakturering. Se
 * `company.mvaRegistered` og salgsbetingelsene.
 */
export const PRIS_ER_ENDELIG = 'Prisen er endelig – vi beregner ikke merverdiavgift.'

// --- Tjenester utover konfiguratoren ------------------------------------

export interface GraveringTjeneste {
  ikon: string
  tittel: string
  tekst: string
  lenke?: { til: string; tekst: string }
}

export const graveringTjenester: GraveringTjeneste[] = [
  {
    ikon: 'faHome',
    tittel: 'Nummerskilt',
    tekst: 'Skreddersydde husnummerskilt laserskåret i tre. Moderne, minimalistisk eller rustikk – vi tilpasser design, størrelse og skrifttype. Værbehandlet for norske forhold.',
  },
  {
    ikon: 'faTruck',
    tittel: 'Adresseskilt til postkassestativ',
    tekst: 'Adresseskilt som passer sømløst til stativet ditt, med navn, adresse eller husnummer. Bestill sammen for et helhetlig uttrykk ved innkjørselen.',
    lenke: { til: '/produkter/postkassestativer', tekst: 'Se postkassestativer' },
  },
  {
    ikon: 'faTree',
    tittel: 'Hytteskilt',
    tekst: 'Hyttenavn, familienavn eller et valgfritt motiv, laserskåret i tre. Et tidløst tillegg til fjellhytta eller sjøbua.',
  },
  {
    ikon: 'faHandPointer',
    tittel: 'Velkomstskilt og dekor',
    tekst: 'Skilt til inngangspartiet, hageskilt og dekorative elementer ute. Fra enkle tekstskilt til detaljerte motiver, i de størrelsene du trenger.',
  },
  {
    ikon: 'faCube',
    tittel: 'Gravering på Minio-produkter',
    tekst: 'Legg en personlig detalj på det du allerede bestiller. Vi graverer husnummer, navn eller logo rett på varmepumpehus, søppelboder og resten av utvalget.',
    lenke: { til: '/produkter', tekst: 'Se produktene' },
  },
  {
    ikon: 'faGears',
    tittel: 'Etter din egen tegning',
    tekst: 'Har du en helt egen idé? Vi skjærer og graverer etter dine skisser eller filer. Firmaprofilering, orienteringsskilt eller noe helt annet – ta kontakt for en prat.',
  },
]
