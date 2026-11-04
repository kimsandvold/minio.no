/**
 * Henvendelser som før KUN gikk på e-post via Formspree, og dermed kunne gå
 * tapt hvis e-posten ikke kom fram eller druknet i innboksen.
 *
 * Alt kunden sender inn skal finnes igjen under /admin. Dette er samlingen for
 * det som ikke er en ferdig konfigurert bestilling:
 *   kontakt    – kontaktskjemaet
 *   eget-emne  – gravering på kundens egen gjenstand
 */
export type HenvendelseKilde = 'kontakt' | 'eget-emne'
export type HenvendelseStatus = 'ny' | 'besvart' | 'lukket'

export interface Henvendelse {
  id?: string
  kilde: HenvendelseKilde
  /** Emnelinje/overskrift – «Gravering», produktnavn, eller valgt tema. */
  emne: string
  navn: string
  epost: string
  /** Mobil. Valgfri på uforpliktende henvendelser, påkrevd når noe faktureres. */
  mobil: string
  /** Fritekst fra kunden. */
  melding: string
  /** Ekstra felter som varierer med kilden (antall, materiale, mål …). */
  detaljer?: Record<string, string>
  status: HenvendelseStatus
  createdAt?: unknown
}

export const henvendelseStatusLabel: Record<HenvendelseStatus, string> = {
  ny: 'Ny',
  besvart: 'Besvart',
  lukket: 'Lukket',
}

export const henvendelseKildeLabel: Record<HenvendelseKilde, string> = {
  kontakt: 'Kontaktskjema',
  'eget-emne': 'Eget emne',
}
