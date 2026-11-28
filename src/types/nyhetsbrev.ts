/**
 * Nyhetsbrev bygget av blokker i /admin/kontakter/nyhetsbrev.
 *
 * Et brev er en ordnet liste blokker pluss et tema. Blokkene er bevisst få og
 * enkle: hver av dem må kunne gjengis som e-post-HTML som overlever å bli
 * limt inn i Mail på Mac – det vil si bare tabeller og inline-stiler.
 */

interface Felles {
  id: string
}

export interface HeroBlokk extends Felles {
  type: 'hero'
  bilde: string
  tittel: string
  tekst: string
  knappTekst: string
  knappUrl: string
}

export interface OverskriftBlokk extends Felles {
  type: 'overskrift'
  tekst: string
  storrelse: 'stor' | 'liten'
}

export interface TekstBlokk extends Felles {
  type: 'tekst'
  /** Avsnitt skilles med blank linje. **fet**, *kursiv* og [lenke](url). */
  tekst: string
}

export interface BildeBlokk extends Felles {
  type: 'bilde'
  url: string
  alt: string
  lenke: string
  bildetekst: string
}

export interface KnappBlokk extends Felles {
  type: 'knapp'
  tekst: string
  url: string
  stil: 'fylt' | 'omriss'
}

export interface Kort {
  bilde: string
  tittel: string
  tekst: string
  lenkeTekst: string
  url: string
}

export interface KortBlokk extends Felles, Kort {
  type: 'kort'
}

export interface KortparBlokk extends Felles {
  type: 'kortpar'
  venstre: Kort
  hoyre: Kort
}

export interface SitatBlokk extends Felles {
  type: 'sitat'
  tekst: string
  kilde: string
}

export interface SkilleBlokk extends Felles {
  type: 'skille'
}

export interface AvstandBlokk extends Felles {
  type: 'avstand'
  hoyde: number
}

export type Blokk =
  | HeroBlokk
  | OverskriftBlokk
  | TekstBlokk
  | BildeBlokk
  | KnappBlokk
  | KortBlokk
  | KortparBlokk
  | SitatBlokk
  | SkilleBlokk
  | AvstandBlokk

export type BlokkType = Blokk['type']

export interface Tema {
  /** Knapper, lenker og detaljer. */
  aksent: string
  /** Flaten rundt selve brevet. */
  bakgrunn: string
  /** Overskrifter i serif gir et redaksjonelt preg; sans er nøytralt. */
  overskriftFont: 'sans' | 'serif'
  visLogo: boolean
}

export interface Nyhetsbrev {
  id?: string
  /** Internt navn i lista. Mottakeren ser det aldri. */
  tittel: string
  /** Emnefeltet i e-posten. */
  emne: string
  tema: Tema
  blokker: Blokk[]
  /** Teksten nederst. */
  bunntekst: string
  opprettet?: unknown
  oppdatert?: unknown
}

export const STANDARD_TEMA: Tema = {
  aksent: '#a8512c',
  bakgrunn: '#f4efe8',
  overskriftFont: 'serif',
  visLogo: true,
}

export const STANDARD_BUNNTEKST =
  'Du får denne e-posten fordi du har meldt deg på nyhetsbrevet fra Minio. [Meld deg av](https://minio.no/avmeld) når som helst.'

/** Tidligere standardtekster. Utkast som fortsatt har en av dem, får den nye når de åpnes. */
export const GAMLE_BUNNTEKSTER = [
  'Du får denne e-posten fordi du har meldt deg på nyhetsbrevet fra Minio. Vil du ikke ha flere, svar «avmeld» på denne e-posten.',
  'Du får denne e-posten fordi du har meldt deg på nyhetsbrevet fra Minio. [Meld deg av](https://minio.no/min-profil) når som helst på Min profil.',
]

export const blokkNavn: Record<BlokkType, string> = {
  hero: 'Toppbilde',
  overskrift: 'Overskrift',
  tekst: 'Tekst',
  bilde: 'Bilde',
  knapp: 'Knapp',
  kort: 'Kort',
  kortpar: 'To kort',
  sitat: 'Sitat',
  skille: 'Skillelinje',
  avstand: 'Luft',
}

export const blokkIkon: Record<BlokkType, string> = {
  hero: 'faImages',
  overskrift: 'faHeading',
  tekst: 'faAlignLeft',
  bilde: 'faImage',
  knapp: 'faHandPointer',
  kort: 'faSquare',
  kortpar: 'faTableColumns',
  sitat: 'faQuoteLeft',
  skille: 'faMinus',
  avstand: 'faUpDownLeftRight',
}

export const nyId = (): string => Math.random().toString(36).slice(2, 10)

const tomtKort = (): Kort => ({ bilde: '', tittel: 'Tittel', tekst: 'Kort beskrivelse.', lenkeTekst: 'Les mer', url: 'https://minio.no' })

export function nyBlokk(type: BlokkType): Blokk {
  const id = nyId()
  switch (type) {
    case 'hero':
      return { id, type, bilde: '/images/hero/hero.webp', tittel: 'Stor overskrift', tekst: 'En kort ingress som forteller hva brevet handler om.', knappTekst: 'Se mer', knappUrl: 'https://minio.no' }
    case 'overskrift':
      return { id, type, tekst: 'Overskrift', storrelse: 'stor' }
    case 'tekst':
      return { id, type, tekst: 'Skriv teksten her. Bruk **fet**, *kursiv* og [lenker](https://minio.no).' }
    case 'bilde':
      return { id, type, url: '', alt: '', lenke: '', bildetekst: '' }
    case 'knapp':
      return { id, type, tekst: 'Se mer', url: 'https://minio.no', stil: 'fylt' }
    case 'kort':
      return { id, type, ...tomtKort() }
    case 'kortpar':
      return { id, type, venstre: tomtKort(), hoyre: tomtKort() }
    case 'sitat':
      return { id, type, tekst: 'Et sitat som løfter brevet.', kilde: '' }
    case 'skille':
      return { id, type }
    case 'avstand':
      return { id, type, hoyde: 24 }
  }
}
