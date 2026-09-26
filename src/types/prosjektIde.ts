/**
 * Prosjektidé fra /prosjekthjelp. Lav-terskel-inngangen til nettverket:
 * hvem som helst kan fortelle om uteprosjektet sitt uten innlogging, og
 * dialogen videre går på e-post fra admin (se /admin/prosjektideer).
 */
export type ProsjektIdeStatus = 'ny' | 'besvart' | 'lukket'

export interface ProsjektIde {
  id?: string
  /** Innsenderens navn. */
  navn: string
  /** E-posten svaret skal gå til – eneste kontaktpunkt. */
  epost: string
  /** Valgfritt sted/kommune – avgjør om hjelp på stedet er aktuelt. */
  sted: string
  /** Valgt prosjekttype («Terrasse eller platting» osv.), tom hvis ikke valgt. */
  prosjektType: string
  /** Innsenderens beskrivelse av idéen. */
  melding: string
  status: ProsjektIdeStatus
  createdAt?: unknown
}

export const prosjektIdeStatusLabel: Record<ProsjektIdeStatus, string> = {
  ny: 'Ny',
  besvart: 'Besvart',
  lukket: 'Lukket',
}
