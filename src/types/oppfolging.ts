/**
 * Oppfølging av en innkommen bestilling: er den gjort, og er den fakturert?
 *
 * Dette er bevisst to uavhengige markører ved siden av `status`. Statusen er
 * dialogen med kunden (ny → bekreftet → ferdig / besvart → lukket), mens disse
 * to er din egen driftsbokføring: en ordre kan være produsert uten å være
 * fakturert, og en byggeplan kan være fakturert lenge før den er levert.
 *
 * Feltene er valgfrie fordi alle dokumenter som lå i Firestore før dette ble
 * laget mangler dem – de leses da som «ikke gjort» og «ikke fakturert».
 *
 * Datoene lagres som 'ÅÅÅÅ-MM-DD'-strenger, ikke Timestamp: de skrives og
 * leses av <input type="date">, og det er dagen som teller for et bilag – ikke
 * klokkeslettet. Da slipper vi også tidssone-skliing på datoen i regnskapet.
 */
export interface Oppfolging {
  /** Jobben er utført (gravert, bygget, plan levert). */
  gjort?: boolean
  /** Datoen den ble gjort, 'ÅÅÅÅ-MM-DD'. */
  gjortDato?: string | null
  /** Faktura er sendt. */
  fakturert?: boolean
  /** Fakturadato, 'ÅÅÅÅ-MM-DD'. */
  fakturaDato?: string | null
}

/** Dagens dato som 'ÅÅÅÅ-MM-DD' i lokal tid (ikke UTC – unngår feil dag om kvelden). */
export function idag(): string {
  const d = new Date()
  const to = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${to(d.getMonth() + 1)}-${to(d.getDate())}`
}

/** 'ÅÅÅÅ-MM-DD' → '5. nov. 2026'. Tom streng når datoen mangler. */
export function formatOppfolgingDato(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' })
}
