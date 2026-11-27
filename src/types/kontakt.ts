/**
 * Kontaktlista – Minios egen e-postliste.
 *
 * Adressene ble tidligere samlet inne i Brevo, via et sibforms-skjema i en
 * iframe. Da lå lista et sted vi ikke eide, kunne ikke sammenstilles med
 * resten av admin, og en innlogget kunde fantes ingen steder før hen faktisk
 * kjøpte noe. Nå er Firestore kilden, og Brevo er bare utsendelseskanalen vi
 * eksporterer TIL.
 *
 * Dokument-id er bevisst to slag:
 *   innlogget  – `uid`, så kontoen eier sin egen rad og kan oppdatere den
 *   anonym     – den normaliserte e-postadressen, så samme adresse ikke blir
 *                liggende i ti kopier etter ti påmeldinger
 *
 * Samme person kan derfor ha to rader (anonym påmelding + senere konto).
 * Det er med vilje: reglene skal ikke måtte la en uinnlogget skrive i en
 * innlogget sin rad. Eksporten slår dem sammen på adresse.
 */

/** Hvor adressen kom inn i huset. */
export type KontaktKilde = 'innlogging' | 'nyhetsbrev' | 'kassen'

/** Hvordan kontoen ble autentisert. `ukjent` for anonyme påmeldinger. */
export type Innloggingsmetode = 'google' | 'epost' | 'gjenopptatt' | 'ukjent'

export interface Kontakt {
  id?: string
  /** Firebase-uid. Tom streng for anonyme nyhetsbrev-påmeldinger. */
  uid: string
  /** Normalisert: trimmet og i små bokstaver. Nøkkelen alt dedupliseres på. */
  epost: string
  navn: string
  kilde: KontaktKilde
  metode: Innloggingsmetode
  /**
   * Aktivt markedsføringssamtykke.
   *
   * Innlogging setter den ALDRI til true. Å logge inn for å se sine egne
   * bestillinger er ikke et ja til nyhetsbrev, og en liste som later som om
   * det er det, er en liste man ikke kan sende fra.
   */
  nyhetsbrev: boolean
  /** Hvor samtykket ble gitt – dokumentasjonen bak haken. */
  nyhetsbrevKilde?: KontaktKilde
  /** Når det ble gitt. Brevo vil ha dato for samtykket ved import. */
  nyhetsbrevDato?: unknown
  /** Satt når noen melder seg av. Raden blir stående; haken blir false. */
  avmeldtDato?: unknown
  epostVerifisert: boolean
  opprettet?: unknown
  /** Siste gang kontoen ble sett – oppdateres én gang per nettleserøkt. */
  sistSett?: unknown
  /** Antall økter vi har registrert. Ikke antall sidevisninger. */
  antallOkter: number
}

/** Én registrert økt. Grunnlaget for aktivitetsgrafene i admin. */
export interface Innlogging {
  id?: string
  uid: string
  epost: string
  metode: Innloggingsmetode
  tidspunkt?: unknown
}

export const kildeLabel: Record<KontaktKilde, string> = {
  innlogging: 'Innlogging',
  nyhetsbrev: 'Nyhetsbrev',
  kassen: 'Kassen',
}

export const metodeLabel: Record<Innloggingsmetode, string> = {
  google: 'Google',
  epost: 'E-post',
  gjenopptatt: 'Gjenopptatt økt',
  ukjent: 'Ukjent',
}

/** Trimmet og i små bokstaver. Alt sammenligning og deduplisering går på denne. */
export function normaliserEpost(epost: string): string {
  return epost.trim().toLowerCase()
}

/**
 * Dokument-id for en anonym påmelding.
 *
 * Adressen brukes direkte. Firestore-id-er kan ikke inneholde `/`, være `.`
 * eller `..`, eller starte og slutte med `__` – ingenting av det kan stå i en
 * e-postadresse som har kommet gjennom `type="email"`-validering. Lengden
 * kuttes på 1500 tegn av Firestore uansett; vi avviser over 200 før det.
 */
export function kontaktIdForEpost(epost: string): string {
  return normaliserEpost(epost)
}
