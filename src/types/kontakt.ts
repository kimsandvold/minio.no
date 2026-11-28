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

/** En avmelding fra /avmeld, uten konto. */
export interface Avmelding {
  id?: string
  epost: string
  tidspunkt?: unknown
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

const tid = (v: unknown): number => (v as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0

/**
 * Gjeldende samtykke per adresse.
 *
 * Samme adresse kan ha to rader: en anonym påmelding (id = adressen) og en
 * konto (id = uid). Kontoen kan ikke skrive i den anonyme raden, så en som
 * melder seg av på /min-profil endrer bare sin egen. Derfor gjelder det
 * SISTE svaret på tvers av radene – ja (nyhetsbrevDato) eller nei
 * (avmeldtDato) – ikke «ja vinner». Ellers ville en avmelding blitt
 * overkjørt av en gammel påmelding, og personen fått brevet likevel.
 */
export function samtykkePerEpost(liste: Kontakt[], avmeldinger: Avmelding[] = []): Map<string, boolean> {
  const siste = new Map<string, { ja: boolean; tid: number }>()
  // Avmeldinger fra /avmeld er nei-svar på adressen, uansett hvilken rad.
  for (const a of avmeldinger) {
    const fins = siste.get(a.epost)
    const t = tid(a.tidspunkt)
    if (!fins || t > fins.tid) siste.set(a.epost, { ja: false, tid: t })
  }
  for (const k of liste) {
    if (!k.epost) continue
    const hendelser = [
      ...(k.nyhetsbrev ? [{ ja: true, tid: tid(k.nyhetsbrevDato) }] : []),
      ...(k.avmeldtDato ? [{ ja: false, tid: tid(k.avmeldtDato) }] : []),
    ]
    for (const h of hendelser) {
      const fins = siste.get(k.epost)
      if (!fins || h.tid > fins.tid) siste.set(k.epost, h)
    }
  }
  return new Map([...siste].map(([epost, h]) => [epost, h.ja]))
}
