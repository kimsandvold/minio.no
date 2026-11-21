/**
 * Manus for graveringsvideoene. Alt som står i videoen – tekst, produkter,
 * navn som graveres – ligger her. Lag en ny variant ved å legge til en ny
 * nøkkel i `SHORTS` og rendre med `node lag-short.mjs <nøkkel>`.
 *
 * `*ord*` i en overskrift får aksentfarge og kursiv.
 *
 * Priser og kampanje hentes fra src/data/gravering.ts, så videoen aldri lover
 * noe nettsiden ikke gjør.
 */
import { fraPris, graveringKampanje, produkt, type Valg } from '../../src/data/gravering'

export interface ProduktKlipp {
  valg: Valg
  navn: string
  detalj: string
  /** Større enn 1 zoomer inn (kjevla er lang og smal – håndtakene kan kuttes). */
  zoom?: number
}

export interface Manus {
  krok: { eyebrow: string; tittel: string }
  produkter: [ProduktKlipp, ProduktKlipp, ProduktKlipp]
  oversikt: { tittel: string; tekst: string }
  avslutning: { frist: string; fristUthevet: string; under: string; kampanje: string | null; url: string }
}

export const pris = (k: ProduktKlipp) => `fra ${fraPris(produkt(k.valg.produkt)).toLocaleString('nb-NO')} kr`

const FJOL: ProduktKlipp = {
  navn: 'Skjærefjøl i bøk',
  detalj: 'Til kjøkkenet – med familienavnet',
  valg: {
    produkt: 'fjol-rekt',
    flate: 'bok',
    variant: 'standard',
    kant: null,
    oppsett: 'senter',
    linjer: ['Familien Berg', 'Lillehammer · 2026', ''],
    font: 'Cormorant Garamond',
    symbol: 'heart',
  },
}

const KJEVLE: ProduktKlipp = {
  navn: 'Pregekjevle',
  detalj: 'Mønsteret trykkes i pepperkakedeigen',
  zoom: 1.75,
  valg: {
    produkt: 'kjevle',
    flate: 'bok',
    variant: 'standard',
    kant: null,
    oppsett: 'monster',
    linjer: ['God jul', '', ''],
    font: 'Cormorant Garamond',
    symbol: 'gingerbread',
  },
}

const FLASKE: ProduktKlipp = {
  navn: 'Drikkeflaske i stål',
  detalj: 'Til turen – med navn og et motiv',
  valg: {
    produkt: 'drikkeflaske',
    flate: 'lysegronn',
    variant: '500',
    kant: null,
    oppsett: 'senter',
    linjer: ['Solheim', 'Sjusjøen', ''],
    font: 'Bebas Neue',
    symbol: 'pine',
  },
}

export const SHORTS: Record<string, Manus> = {
  jul: {
    krok: { eyebrow: 'Gravering · julegaver', tittel: 'Julegaven\nmed *navnet* på.' },
    produkter: [FJOL, KJEVLE, FLASKE],
    oversikt: {
      tittel: 'Du skriver *teksten*.',
      tekst: 'Vi graverer i verkstedet på Lillehammer og sender gaven hjem til deg.',
    },
    avslutning: {
      frist: 'Bestill innen',
      fristUthevet: '1. desember',
      under: 'for trygg julelevering',
      kampanje: graveringKampanje.aktiv ? `${graveringKampanje.merke} t.o.m. ${graveringKampanje.frist}` : null,
      url: 'minio.no/gravering',
    },
  },
}
