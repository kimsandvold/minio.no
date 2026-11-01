/**
 * Håndverkerspillene. Spillene er statiske HTML-sider i public/underholdning/,
 * så de lenkes med vanlige <a>-lenker (ikke router-lenker). Brukes av
 * /underholdning og spillseksjonen på forsiden.
 *
 * Nytt spill: legg det til i SPILL med `nytt: true` – da blir det utvalgt og
 * får «Nytt»-merke begge steder.
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
]

/** Toppen fremhever det nyeste spillet – eller det første, om ingen er nye. */
export const UTVALGT = SPILL.find((s) => s.nytt) ?? SPILL[0]
/** Rutenettet viser resten – det utvalgte står allerede i toppen. */
export const RESTEN = SPILL.filter((s) => s !== UTVALGT)

