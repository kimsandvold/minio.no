import {
  STANDARD_BUNNTEKST,
  STANDARD_TEMA,
  nyId,
  type Blokk,
  type Kort,
  type Nyhetsbrev,
} from '../types/nyhetsbrev'

/**
 * Ferdige utgangspunkt for nyhetsbrev, bygget på det Minio faktisk har:
 * produktsidene, graveringen og byggeguidene. Bildene er de samme som på
 * nettstedet, så de er allerede publisert og har en fast adresse.
 *
 * En mal er et utkast, ikke et ferdig brev. Teksten er skrevet for å bli
 * endret – den skal bare gjøre at man starter med noe i stedet for et blankt
 * ark.
 */

export interface Mal {
  id: string
  navn: string
  beskrivelse: string
  /** Bilde til malvelgeren. */
  bilde: string
  lag: () => Omit<Nyhetsbrev, 'id'>
}

const kort = (bilde: string, tittel: string, tekst: string, url: string, lenkeTekst = 'Se mer'): Kort => ({
  bilde,
  tittel,
  tekst,
  lenkeTekst,
  url,
})

// Hver blokk trenger en egen id, også når samme mal brukes to ganger.
type UtenId<T> = T extends Blokk ? Omit<T, 'id'> : never
const med = (blokker: UtenId<Blokk>[]): Blokk[] => blokker.map((b) => ({ ...b, id: nyId() }) as Blokk)

function brev(tittel: string, emne: string, blokker: UtenId<Blokk>[], aksent?: string): Omit<Nyhetsbrev, 'id'> {
  return {
    tittel,
    emne,
    tema: { ...STANDARD_TEMA, ...(aksent ? { aksent } : {}) },
    blokker: med(blokker),
    bunntekst: STANDARD_BUNNTEKST,
  }
}

export const MALER: Mal[] = [
  {
    id: 'tom',
    navn: 'Tomt brev',
    beskrivelse: 'Bare logo og en tekstblokk.',
    bilde: '',
    lag: () =>
      brev('Nytt nyhetsbrev', '', [
        { type: 'overskrift', tekst: 'Overskrift', storrelse: 'stor' },
        { type: 'tekst', tekst: 'Hei!\n\nSkriv brevet her.' },
      ]),
  },
  {
    id: 'gravering',
    navn: 'Gravering – julegaven',
    beskrivelse: 'Graverte skjærefjøler og gaver med navn, dato eller en hilsen.',
    bilde: '/images/featured/minio_gravering_3.webp',
    lag: () =>
      brev('Gravering til jul', 'En gave med navnet deres på', [
        {
          type: 'hero',
          bilde: '/images/featured/minio_gravering_3.webp',
          tittel: 'En gave med navnet deres på',
          tekst: 'Skjærefjøler, serveringsfjøler og kjevler i heltre – gravert med navn, en dato eller en hilsen. Du ser graveringen før du bestiller.',
          knappTekst: 'Lag din gravering',
          knappUrl: '/gravering',
        },
        { type: 'overskrift', tekst: 'Populært nå', storrelse: 'liten' },
        {
          type: 'kort',
          ...kort('/images/featured/minio_curringb_engrave_1.webp', 'Til familien eller brudeparet', 'Familienavnet, barnas navn eller bryllupsdatoen – på en fjøl de faktisk bruker hver dag.', '/gravering', 'Lag din'),
        },
        {
          type: 'tekst',
          tekst: 'Velg treslag – bøk, ask, eik eller valnøtt – og skriv inn teksten. Du ser resultatet med én gang, og graveringen lages akkurat slik du ser den.',
        },
        { type: 'knapp', tekst: 'Se alle graveringene', url: '/gravering', stil: 'omriss' },
      ]),
  },
  {
    id: 'varmepumpehus',
    navn: 'Varmepumpehus',
    beskrivelse: 'Beskytt varmepumpen før vinteren – tilpasset dine mål.',
    bilde: '/images/products/minio_vps.webp',
    lag: () =>
      brev('Varmepumpehus', 'Gi varmepumpen et tak over hodet før snøen kommer', [
        {
          type: 'hero',
          bilde: '/images/products/minio_vps.webp',
          tittel: 'Et tak over varmepumpen',
          tekst: 'Snø og is som faller fra taket er en av de vanligste grunnene til at utedelen tar skade. Et varmepumpehus skjermer den – og ser bedre ut enn en grå boks på veggen.',
          knappTekst: 'Design ditt varmepumpehus',
          knappUrl: '/produkter/varmepumpehus',
        },
        { type: 'overskrift', tekst: 'Tilpasset din varmepumpe', storrelse: 'stor' },
        {
          type: 'tekst',
          tekst: 'Velg mål, finish og tak, og se 3D-modellen oppdatere seg mens du justerer. Huset lages etter målene til akkurat din utedel, med god lufting rundt.\n\n**Pris fra 3 490,-**',
        },
        {
          type: 'kortpar',
          venstre: kort('/images/products/varm_hus.webp', 'Naturlig tre', 'Lar treet gråne pent, eller olje det i fargen du vil.', '/produkter/varmepumpehus'),
          hoyre: kort('/images/products/varm_hus_v3.webp', 'Med husnummer', 'Gravér husnummeret rett på fronten.', '/gravering'),
        },
        { type: 'knapp', tekst: 'Kom i gang', url: '/produkter/varmepumpehus', stil: 'fylt' },
      ]),
  },
  {
    id: 'plantekasser',
    navn: 'Plantekasser',
    beskrivelse: 'Vårsesongen: plantekasser og pidestaller til terrassen.',
    bilde: '/images/products/plantekasser_4.webp',
    lag: () =>
      brev('Plantekasser', 'Gjør terrassen klar for sesongen', [
        {
          type: 'hero',
          bilde: '/images/products/plantekasser_4.webp',
          tittel: 'Gjør terrassen klar for sesongen',
          tekst: 'Håndlagde plantekasser i tre, i størrelsen som passer plassen din. Fra én kasse ved inngangen til en hel rekke langs rekkverket.',
          knappTekst: 'Se plantekassene',
          knappUrl: '/produkter/plantekasser',
        },
        {
          type: 'kortpar',
          venstre: kort('/images/products/plantekasser_2.webp', 'Plantekasser', 'Etter dine mål. Pris fra 1 260,-', '/produkter/plantekasser'),
          hoyre: kort('/images/products/pidestall_krakk_1.webp', 'Pidestall-krakk', 'Løft pottene opp i høyde. Pris fra 1 500,-', '/produkter/pidestall-krakk'),
        },
        { type: 'sitat', tekst: 'Det enkleste grepet for en terrasse som føles ferdig: grønt i høyde.', kilde: '' },
        {
          type: 'tekst',
          tekst: 'Vil du heller lage dem selv? Byggeguiden viser hvordan du lager en [pidestall for utendørs bruk](/byggeguider/prosjekter/pidestall-utendors), steg for steg.',
        },
      ], '#3f7d52'),
  },
  {
    id: 'byggeguide',
    navn: 'Ny byggeguide',
    beskrivelse: 'Gjør-det-selv: del en ny guide eller et prosjekt.',
    bilde: '/images/byggeguider/hagebenk.webp',
    lag: () =>
      brev('Ny byggeguide', 'Ukens prosjekt: bygg en hagebenk', [
        { type: 'overskrift', tekst: 'Ukens prosjekt', storrelse: 'liten' },
        {
          type: 'hero',
          bilde: '/images/byggeguider/hagebenk.webp',
          tittel: 'Bygg en hagebenk på en helg',
          tekst: 'Materialliste, kappliste og fremgangsmåte – alt du trenger for å bygge den selv.',
          knappTekst: 'Les guiden',
          knappUrl: '/byggeguider/prosjekter/hagebenk',
        },
        { type: 'skille' },
        { type: 'overskrift', tekst: 'Flere prosjekter', storrelse: 'liten' },
        {
          type: 'kortpar',
          venstre: kort('/images/byggeguider/fuglehus.webp', 'Fuglehus', 'Et lite prosjekt å gjøre sammen med barna.', '/byggeguider/prosjekter/fuglehus', 'Les guiden'),
          hoyre: kort('/images/byggeguider/pidestall.webp', 'Pidestall', 'Plantestativ for terrassen.', '/byggeguider/prosjekter/pidestall-utendors', 'Les guiden'),
        },
        { type: 'knapp', tekst: 'Alle byggeguidene', url: '/byggeguider', stil: 'omriss' },
      ]),
  },
  {
    id: 'planleggere',
    navn: 'Planleggere',
    beskrivelse: 'Terrasse, pergola og carport – tegn det selv, få materialliste.',
    bilde: '/images/planleggere/pergola-inspirasjon.webp',
    lag: () =>
      brev('Planleggere', 'Tegn terrassen før du kjøper materialene', [
        {
          type: 'hero',
          bilde: '/images/planleggere/pergola-inspirasjon.webp',
          tittel: 'Tegn det før du bygger det',
          tekst: 'Med planleggerne tegner du terrassen, pergolaen eller carporten selv – og får materialliste og tegninger du kan bygge etter, eller gi til en snekker.',
          knappTekst: 'Åpne planleggerne',
          knappUrl: '/planleggere',
        },
        {
          type: 'kortpar',
          venstre: kort('/images/planleggere/terrasse-inspirasjon.webp', 'Terrasse', 'Bjelker, stolper og bord – regnet ut for deg.', '/planleggere/terrasse', 'Planlegg terrasse'),
          hoyre: kort('/images/planleggere/carport-foto.webp', 'Carport', 'Se målene og materialene før du søker.', '/planleggere/carport', 'Planlegg carport'),
        },
        { type: 'tekst', tekst: 'Usikker på søknadsplikt? Les [når du må søke for terrassen](/byggeguider/soknadsplikt-terrasse).' },
      ]),
  },
  {
    id: 'manedsbrev',
    navn: 'Månedsbrev',
    beskrivelse: 'Litt av alt: nyheter, et produkt og en guide.',
    bilde: '/images/hero/forside_6.webp',
    lag: () =>
      brev('Månedsbrev', 'Nytt fra Minio', [
        { type: 'tekst', tekst: 'Hei!\n\nHer er det siste fra verkstedet og nettsiden denne måneden.' },
        { type: 'bilde', url: '/images/hero/forside_6.webp', alt: '', lenke: '/', bildetekst: '' },
        { type: 'overskrift', tekst: 'Nytt denne måneden', storrelse: 'stor' },
        { type: 'tekst', tekst: 'Skriv om det som er nytt – et produkt, en ny guide eller noe du har laget.' },
        {
          type: 'kort',
          ...kort('/images/featured/minio_gravering_3.webp', 'Gravering', 'Navn, datoer og hilsener på skjærefjøler i heltre.', '/gravering'),
        },
        { type: 'skille' },
        { type: 'tekst', tekst: 'Har du spørsmål eller et prosjekt du lurer på? Bare svar på denne e-posten.\n\nHilsen Kim' },
      ]),
  },
]
