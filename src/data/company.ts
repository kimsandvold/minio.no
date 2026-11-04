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
  /**
   * Innehaveren. Enkeltpersonforetaket står i Enhetsregisteret på samme navn,
   * så dette er allerede offentlig – og en navngitt fagperson som forfatter
   * veier tyngre enn et foretaksnavn i både søk og AI-genererte svar.
   */
  founder: 'Kim Sandvold',
  founderTitle: 'Trehåndverker og innehaver',
  /**
   * Fagområdene verkstedet faktisk arbeider innenfor. Publiseres som
   * `knowsAbout` på LocalBusiness – den direkte måten å erklære temaautoritet
   * på. Hold lista ærlig: bare det vi virkelig lager og skriver om.
   */
  knowsAbout: [
    'Trekonstruksjoner for hage og uteplass',
    'Terrasse- og plattingbygging',
    'Carport og pergola',
    'Dimensjonering av trevirke etter Eurokode 5',
    'Snølast og frostfri fundamentering i Norge',
    'Trykkimpregnert og royalimpregnert trevirke',
    'Overflatebehandling av tre utendørs',
    'Lasergravering i tre, stål og skinn',
  ],
} as const
