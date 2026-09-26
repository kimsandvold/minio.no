/**
 * Data for prosjektkompasset på /prosjekthjelp.
 *
 * Prinsipp (se docs/UTVIKLINGSNOTATER.md): brukeren skal få verdi *før* vi ber
 * om noe. Tre trykk gir et anslag på materialkostnad, tid og søknadsplikt –
 * deretter er e-posten et middel til å få med seg sitt eget prosjekt, ikke en
 * bomstasjon.
 *
 * Tall kommer aldri fra markedsføringstekst:
 * - Materialkostnad og søknadsstatus regnes live med designverktøyets egne
 *   templates (`beregn` / `byggeregler`) der det finnes et template.
 * - Tid og vanskelighetsgrad er sitert fra byggeguidene.
 * - Mangler vi grunnlag, sier vi det og lover et personlig svar i stedet.
 */

export interface Storrelse {
  id: string
  navn: string
  /** Kort målbeskrivelse vist på kortet, f.eks. «3 × 3 m». */
  maal: string
  /** Overstyringer av templatets defaultConfig (mål i cm). */
  config?: Record<string, string | number | boolean>
  /** Tid/vanskelighet sitert fra byggeguiden – overstyrer typens tekst. */
  tid?: string
}

export interface Lenke {
  til: string
  tekst: string
}

export interface ProsjektType {
  id: string
  navn: string
  bilde?: string
  ikon: string
  /** Designverktøy-template som gir live materialanslag. */
  templateId?: string
  /** Hvis templatet er en nær slektning (f.eks. bod regnet som skjul). */
  templateNote?: string
  storrelser: Storrelse[]
  /** Tid/vanskelighet fra byggeguiden. */
  tid?: string
  /** Søknadsregler fra guidene – brukes når templatet ikke har `byggeregler`. */
  regler?: string
  guider: Lenke[]
}

export const PROSJEKTTYPER: ProsjektType[] = [
  {
    id: 'terrasse',
    navn: 'Terrasse eller platting',
    bilde: '/images/planleggere/terrasse.webp',
    ikon: 'faBorderAll',
    templateId: 'terrasse',
    storrelser: [
      { id: 's', navn: 'Platting', maal: '3 × 3 m', config: { lengde: 300, bredde: 300 }, tid: 'Kan stå ferdig på én dag · lav vanskelighetsgrad' },
      { id: 'm', navn: 'Familieterrasse', maal: '5 × 4 m', config: { lengde: 500, bredde: 400 } },
      { id: 'l', navn: 'Stor terrasse', maal: '7 × 5 m', config: { lengde: 700, bredde: 500 } },
    ],
    tid: 'Typisk én til to helger for 20–30 m²',
    guider: [
      { til: '/byggeguider/bygge-terrasse', tekst: 'Slik bygger du terrasse' },
      { til: '/byggeguider/hva-koster-terrasse', tekst: 'Hva koster en terrasse?' },
      { til: '/byggeguider/soknadsplikt-terrasse', tekst: 'Søknadsplikt for terrasse' },
    ],
  },
  {
    id: 'pergola',
    navn: 'Pergola',
    bilde: '/images/planleggere/pergola.webp',
    ikon: 'faWarehouse',
    templateId: 'pergola',
    storrelser: [
      { id: 's', navn: 'Liten', maal: '3 × 2,5 m', config: { bredde: 300, dybde: 250 } },
      { id: 'm', navn: 'Medium', maal: '4 × 3 m', config: { bredde: 400, dybde: 300 } },
      { id: 'l', navn: 'Stor', maal: '5 × 4 m', config: { bredde: 500, dybde: 400 } },
    ],
    tid: 'Én til to helger for én til to personer · middels vanskelighetsgrad',
    guider: [{ til: '/byggeguider/bygge-pergola', tekst: 'Slik bygger du pergola' }],
  },
  {
    id: 'carport',
    navn: 'Carport',
    bilde: '/images/planleggere/carport.webp',
    ikon: 'faWarehouse',
    templateId: 'carport',
    storrelser: [
      { id: 's', navn: 'Én bil', maal: '3,5 × 5,5 m', config: { bredde: 350, lengde: 550 } },
      { id: 'm', navn: 'To biler', maal: '6 × 6 m', config: { bredde: 600, lengde: 600 } },
      { id: 'l', navn: 'To biler + bod', maal: '7 × 8 m', config: { bredde: 700, lengde: 800 } },
    ],
    tid: 'Typisk to til tre helger for én bil · middels til høy vanskelighetsgrad',
    guider: [
      { til: '/byggeguider/bygge-carport', tekst: 'Slik bygger du carport' },
      { til: '/byggeguider/carport-uten-soknad', tekst: 'Carport uten søknad' },
    ],
  },
  {
    id: 'utekjokken',
    navn: 'Utekjøkken',
    bilde: '/images/planleggere/utekjokken.webp',
    ikon: 'faKitchenSet',
    templateId: 'utekjokken',
    storrelser: [
      { id: 's', navn: 'Kompakt', maal: '2 m benk', config: { bredde: 200 } },
      { id: 'm', navn: 'Standard', maal: '2,8 m benk', config: { bredde: 280 } },
      { id: 'l', navn: 'Stort', maal: '4 m benk', config: { bredde: 400 } },
    ],
    guider: [{ til: '/planleggere/utekjokken', tekst: 'Utekjøkkenplanleggeren' }],
  },
  {
    id: 'bod',
    navn: 'Bod eller skjul',
    bilde: '/images/products/vedskjul-3d.webp',
    ikon: 'faWarehouse',
    templateId: 'vedskjul',
    templateNote: 'Regnet som skjul med tak, gulv og dører i designverktøyet.',
    storrelser: [
      { id: 's', navn: 'Vedskjul', maal: '2,4 × 1,5 m', config: { bredde: 240, dybde: 150 } },
      { id: 'm', navn: 'Stort skjul', maal: '3,6 × 1,8 m', config: { bredde: 360, dybde: 180 } },
      { id: 'l', navn: 'Bod', maal: '4 × 3 m', config: { bredde: 400, dybde: 300, hoyde: 230 } },
    ],
    tid: 'En bod på 6–8 m² tar typisk tre til fem helger · middels til høy vanskelighetsgrad',
    regler: 'Frittstående bod inntil 50 m² med mønehøyde under 4 m og minst 1 m til nabogrensen er normalt søknadsfri.',
    guider: [
      { til: '/byggeguider/bygge-utebod', tekst: 'Slik bygger du utebod' },
      { til: '/byggeguider/bod-uten-soknad', tekst: 'Bod uten søknad' },
    ],
  },
  {
    id: 'levegg',
    navn: 'Levegg',
    bilde: '/images/products/minio_levegg_variant.webp',
    ikon: 'faBorderNone',
    storrelser: [
      { id: 's', navn: 'Kort', maal: 'ca. 3 m' },
      { id: 'm', navn: 'Medium', maal: 'ca. 6 m' },
      { id: 'l', navn: 'Lang', maal: '10 m eller mer' },
    ],
    tid: '5–6 m kan stå ferdig på én god arbeidsdag · lav til middels vanskelighetsgrad',
    regler: 'Levegg inntil 1,8 m høy og maks 10 m lang er som regel søknadsfri.',
    guider: [
      { til: '/byggeguider/bygge-levegg', tekst: 'Slik bygger du levegg' },
      { til: '/byggeguider/levegg-gjerde-regler', tekst: 'Regler for levegg og gjerde' },
    ],
  },
  {
    id: 'annet',
    navn: 'Noe annet',
    ikon: 'faLightbulb',
    storrelser: [],
    guider: [{ til: '/byggeguider', tekst: 'Alle byggeguider' }],
  },
]

export interface Valg {
  id: string
  navn: string
  tekst: string
  ikon: string
}

export const GJENNOMFORING: Valg[] = [
  { id: 'selv', navn: 'Jeg bygger selv', tekst: 'Tegning, materialliste og råd underveis', ikon: 'faHammer' },
  { id: 'materialpakke', navn: 'Materialpakke', tekst: 'Ferdig kappet materiale – jeg monterer', ikon: 'faBoxOpen' },
  { id: 'ferdig', navn: 'Få det bygget', tekst: 'Jeg vil ha hjelp av en snekker', ikon: 'faCheckCircle' },
  { id: 'usikker', navn: 'Vet ikke ennå', tekst: 'Hjelp meg å finne ut hva som passer', ikon: 'faLightbulb' },
]

export const TIDSRAMME: Valg[] = [
  { id: 'snart', navn: 'Så snart som mulig', tekst: '', ikon: 'faRocket' },
  { id: 'iaar', navn: 'I løpet av året', tekst: '', ikon: 'faClock' },
  { id: 'drom', navn: 'Bare drømmer foreløpig', tekst: '', ikon: 'faSeedling' },
]

/** Runder til nærmeste 500 kr – anslaget er veiledende, ikke et tilbud. */
export function rundKr(kr: number): number {
  return Math.round(kr / 500) * 500
}

export function formatKr(kr: number): string {
  return `${rundKr(kr).toLocaleString('nb-NO')} kr`
}
