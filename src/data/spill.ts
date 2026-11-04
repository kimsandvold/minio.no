/**
 * Håndverkerspillene. Spillene er statiske HTML-sider i public/underholdning/,
 * så de lenkes med vanlige <a>-lenker (ikke router-lenker). Brukes av
 * /underholdning og spillseksjonen på forsiden.
 *
 * Nytt spill: legg det til i SPILL med `nytt: true` – da får det «Nytt»-merke
 * begge steder, og blir utvalgt om ingen andre er merket `utvalgt`.
 */

export interface Spill {
  href: string
  tittel: string
  beskrivelse: string
  /** Hva spillet tester – vises over tittelen. */
  ferdighet: string
  /** Omtrentlig tid for én runde. */
  tid: string
  /** Målet som låser opp rabattkoden. */
  maal: string
  /** Mobilskjermbilde fra spillet (public/images/underholdning/). */
  bilde: string
  nytt?: boolean
  /** Vis dette spillet i toppen, uavhengig av hva som er nyest. */
  utvalgt?: boolean
}

export const SPILL: Spill[] = [
  {
    href: '/underholdning/tool-dreiemester.html',
    tittel: 'Dreiemester',
    beskrivelse:
      'Dreiebenken går og dreiejernet er skarpt. Drei sjakkbonder, kjevler og kjegler etter tegningen – jag lange spon, samle stjerner og fyll hylla. Men skjær for dypt, og emnet knekker.',
    ferdighet: 'Presisjon',
    tid: '2 min / fritt',
    maal: '4 000 poeng',
    bilde: '/images/underholdning/dreiemester.webp',
    nytt: true,
  },
  {
    href: '/underholdning/tool-terrasse.html',
    tittel: 'Terrassemester',
    beskrivelse:
      'Legg terrassebord på bjelkelaget, fyll rader og kolonner og skru dem fast. Tre minutter på do eller uendelig – og utfordre kompisen på de samme plankene.',
    ferdighet: 'Logikk',
    tid: '3 min / uendelig',
    maal: '3 000 poeng',
    bilde: '/images/underholdning/terrasse.webp',
    utvalgt: true,
  },
  {
    href: '/underholdning/tool-stack.html',
    tittel: 'Stabelmester',
    beskrivelse: 'Slipp plankene og kapp bort det som stikker ut. Treff på millimeteren og stabl høyest mulig.',
    ferdighet: 'Presisjon',
    tid: 'ca. 2 min',
    maal: '25 planker',
    bilde: '/images/underholdning/stack.webp',
  },
  {
    href: '/underholdning/tool-nails.html',
    tittel: "Spiker'n",
    beskrivelse: 'Treff den grønne sonen og slå spikeren i planken. Timing er alt.',
    ferdighet: 'Timing',
    tid: 'ca. 3 min',
    maal: 'Nivå 10',
    bilde: '/images/underholdning/nails.webp',
  },
  {
    href: '/underholdning/tool-saw.html',
    tittel: 'Sag Rytme',
    beskrivelse: 'Sag planker i takt og treff kuttelinjene for combo-bonus.',
    ferdighet: 'Rytme',
    tid: 'ca. 3 min',
    maal: '5000 poeng',
    bilde: '/images/underholdning/saw.webp',
  },
  {
    href: '/underholdning/tool-game.html',
    tittel: 'Finn Verktøyet',
    beskrivelse: 'Trykk på riktig verktøy før det forsvinner. Feil verktøy koster et liv.',
    ferdighet: 'Reaksjon',
    tid: '30 sek',
    maal: '3500 poeng',
    bilde: '/images/underholdning/game.webp',
  },
  {
    href: '/underholdning/tool-maze.html',
    tittel: 'Verktøyjakt',
    beskrivelse: 'Samle verktøy i labyrinten – og hold deg unna de sinte kundene.',
    ferdighet: 'Labyrint',
    tid: 'ca. 5 min',
    maal: 'Nivå 8',
    bilde: '/images/underholdning/maze.webp',
  },
  {
    href: '/underholdning/tool-quiz.html',
    tittel: 'Verktøy Quiz',
    beskrivelse: 'Vet du hvor de kjente verktøymerkene ble grunnlagt? Pek ut riktig land på kartet.',
    ferdighet: 'Kunnskap',
    tid: 'ca. 3 min',
    maal: '20 av 20 riktige',
    bilde: '/images/underholdning/quiz.webp',
  },
  {
    href: '/underholdning/tool-kursmester.html',
    tittel: 'Kursmester',
    beskrivelse:
      'Koble opp lyskurser på koblingsskjema: endevender i trappa, kryssbryter fra tre steder, dimmer med lastgrense og varmekabel på egen kurs. Slå på automaten – holder den, eller smeller det? 33 brett i fire kapitler.',
    ferdighet: 'Fagkunnskap',
    tid: '1–3 min per brett',
    maal: 'Tre stjerner på et brett',
    bilde: '/images/underholdning/kursmester.webp',
  },
]

/** Toppen fremhever det utvalgte spillet – ellers det nyeste, ellers det første. */
export const UTVALGT = SPILL.find((s) => s.utvalgt) ?? SPILL.find((s) => s.nytt) ?? SPILL[0]
/** Rutenettet viser resten – det utvalgte står allerede i toppen. */
export const RESTEN = SPILL.filter((s) => s !== UTVALGT)

