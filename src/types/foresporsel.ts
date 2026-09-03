/**
 * Forespørsel fra designverktøyet. Kunden ber om å få designet bygget
 * («ferdig»), kappet som materialpakke («materialpakke») eller om å kjøpe
 * byggeplanen («byggeplan»).
 *
 * «byggeplan» er den midlertidige manuelle salgsveien i lanseringsmodus:
 * forespørselen opprettes av api/plan/bestill.ts, som samtidig lager
 * tilgangskoden. Koden ligger KUN på denne forespørselen (som bare admin kan
 * lese) – aldri på designet kunden selv kan lese – helt til den er innløst.
 * Kunden Vippser manuelt, og admin sender koden fra /admin/foresporsler.
 */
export type ForesporselType = 'ferdig' | 'materialpakke' | 'byggeplan'
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
  /** Designets Firestore-id. Settes på 'byggeplan'-forespørsler. */
  designId?: string
  /**
   * 6-sifret tilgangskode kunden får når betalingen er mottatt. Settes kun av
   * serveren, og feltet er ikke lesbart for kunden (se firestore.rules).
   */
  tilgangskode?: string
  /**
   * Gikk varsel-e-posten til admin ut? Settes av api/plan/bestill.ts. false =
   * e-posten feilet eller mangler konfigurasjon (RESEND_API_KEY / EPOST_FRA /
   * ADMIN_EPOST); forespørselen og koden ligger uansett her.
   */
  adminVarslet?: boolean
  status: ForesporselStatus
  createdAt?: unknown
}

export const foresporselTypeLabel: Record<ForesporselType, string> = {
  ferdig: 'Ferdig bygget',
  materialpakke: 'Materialpakke',
  byggeplan: 'Byggeplan (kode)',
}

export const foresporselStatusLabel: Record<ForesporselStatus, string> = {
  ny: 'Ny',
  besvart: 'Besvart',
  lukket: 'Lukket',
}
