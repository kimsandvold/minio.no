// Foretaksopplysninger – brukes i footer, salgsbetingelser og personvern.
// Hentet fra Enhetsregisteret (Brønnøysund) for org.nr 937 227 493.
export const company = {
  brand: 'Minio',
  legalName: 'MINIO SANDVOLD',
  orgForm: 'Enkeltpersonforetak',
  orgNr: '937 227 493',
  address: 'Simon Darres veg 16',
  postal: '2624 Lillehammer',
  country: 'Norge',
  // E-post lagres i deler slik at den fullstendige adressen aldri finnes som
  // én sammenhengende streng i kildekode, DOM eller prerendret HTML.
  emailUser: 'post',
  emailDomain: 'minio.no',
  site: 'minio.no',
  mvaRegistered: false,
} as const
