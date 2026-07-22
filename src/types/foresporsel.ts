/**
 * Forespørsel fra designverktøyet: kunden ber om å få designet bygget
 * («ferdig») eller kappet som materialpakke («materialpakke»). Lagres i
 * Firestore og varsles til admin på e-post (Formspree). Byggeplan-kjøp går
 * en annen vei (tilgangskode/betaling), ikke via forespørsel.
 */
export type ForesporselType = 'ferdig' | 'materialpakke'
export type ForesporselStatus = 'ny' | 'besvart' | 'lukket'

export interface DesignForesporsel {
  id?: string
  userId: string
  userEmail: string
  type: ForesporselType
  produktId: string
  produktNavn: string
  designNavn: string
  /** Kort teknisk sammendrag av designet (bom.sammendrag). */
  sammendrag: string
  /** Ytre mål, f.eks. «300 × 250 cm». */
  maal: string
  /** Grunnflate i m² (null hvis ikke relevant). */
  arealM2: number | null
  /** Veiledende materialkostnad (kr). */
  estimatKr: number
  /** Veiledende pris for valgt leveranse (kr). */
  prisEstimatKr: number
  /** Kundens fritekst til admin. */
  melding: string
  status: ForesporselStatus
  createdAt?: unknown
}

export const foresporselTypeLabel: Record<ForesporselType, string> = {
  ferdig: 'Ferdig bygget',
  materialpakke: 'Materialpakke',
}

export const foresporselStatusLabel: Record<ForesporselStatus, string> = {
  ny: 'Ny',
  besvart: 'Besvart',
  lukket: 'Lukket',
}
