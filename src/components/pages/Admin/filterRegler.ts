/**
 * Regelbasert filter for admin-listene.
 *
 * Et søkefelt svarer bare på «inneholder dette». Det man faktisk vil vite er
 * ting som «alle gmail-adresser», «alt UNNTATT mine egne testkontoer» eller
 * «alle på @firma.no som ikke har navn registrert» – og det er tre ulike
 * operatorer, ikke tre søk.
 *
 * Reglene kombineres med OG. ELLER er med vilje utelatt: det doblet
 * kompleksiteten i grensesnittet, og de gangene man trenger det er det som
 * regel «slutter på» over flere domener – som løses bedre med to eksporter.
 */

export type Operator =
  | 'inneholder'
  | 'inneholder-ikke'
  | 'starter-med'
  | 'slutter-paa'
  | 'er'
  | 'er-ikke'
  | 'er-tom'
  | 'er-ikke-tom'

export const operatorLabel: Record<Operator, string> = {
  inneholder: 'inneholder',
  'inneholder-ikke': 'inneholder ikke',
  'starter-med': 'starter med',
  'slutter-paa': 'slutter på',
  er: 'er lik',
  'er-ikke': 'er ikke lik',
  'er-tom': 'er tom',
  'er-ikke-tom': 'er utfylt',
}

/** Operatorene som ikke har noe å sammenligne med – verdifeltet skjules. */
const UTEN_VERDI: Operator[] = ['er-tom', 'er-ikke-tom']

export interface Regel {
  id: string
  felt: string
  operator: Operator
  verdi: string
}

export interface Filterfelt {
  nokkel: string
  navn: string
}

export interface Snarvei {
  navn: string
  regel: Omit<Regel, 'id'>
}

let teller = 0
export function nyRegel(felt: string, operator: Operator = 'inneholder', verdi = ''): Regel {
  teller += 1
  return { id: `r${teller}`, felt, operator, verdi }
}

/**
 * Er raden med?
 *
 * `hentVerdi` gjør komponenten uavhengig av hva slags rader den filtrerer –
 * sida bestemmer selv hvordan et felt leses ut av sin egen datatype.
 *
 * En regel uten verdi slipper alt gjennom. Det er med vilje: man skriver
 * «slutter på» først og domenet etterpå, og lista skal ikke blinke tom i
 * mellomtiden.
 */
export function passererFilter<T>(
  rad: T,
  regler: Regel[],
  hentVerdi: (rad: T, felt: string) => string,
): boolean {
  return regler.every((r) => {
    const faktisk = hentVerdi(rad, r.felt).toLowerCase()
    const sok = r.verdi.trim().toLowerCase()

    if (r.operator === 'er-tom') return faktisk === ''
    if (r.operator === 'er-ikke-tom') return faktisk !== ''
    if (!sok) return true

    switch (r.operator) {
      case 'inneholder':
        return faktisk.includes(sok)
      case 'inneholder-ikke':
        return !faktisk.includes(sok)
      case 'starter-med':
        return faktisk.startsWith(sok)
      case 'slutter-paa':
        return faktisk.endsWith(sok)
      case 'er':
        return faktisk === sok
      case 'er-ikke':
        return faktisk !== sok
    }
  })
}

/** Kort tekst som beskriver filteret – til kvittering og til filnavn. */
export function filterTekst(regler: Regel[], felter: Filterfelt[]): string {
  return regler
    .filter((r) => r.verdi.trim() || UTEN_VERDI.includes(r.operator))
    .map((r) => {
      const navn = felter.find((f) => f.nokkel === r.felt)?.navn ?? r.felt
      const verdi = UTEN_VERDI.includes(r.operator) ? '' : ` «${r.verdi.trim()}»`
      return `${navn} ${operatorLabel[r.operator]}${verdi}`
    })
    .join(' og ')
}
