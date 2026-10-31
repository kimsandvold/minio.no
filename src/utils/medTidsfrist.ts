/**
 * Firestore-klienten gir ikke opp av seg selv: er nettet nede eller
 * firestore.googleapis.com blokkert (adblock, bedriftsbrannmur), venter
 * `addDoc` i det uendelige på kvittering fra serveren. Skjemaer som lagrer
 * og varsler på e-post bruker denne fristen så kunden aldri blir sittende med
 * en evig «Sender …»-knapp. Skrivingen ligger fortsatt i Firestores lokale kø
 * og lander gjerne når nettet er tilbake.
 */
export function medTidsfrist<T>(lofte: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    lofte,
    new Promise<never>((_, avvis) => setTimeout(() => avvis(new Error('Tidsavbrudd mot Firestore')), ms)),
  ])
}

/** Standardfrist for én lagring fra et kundeskjema. */
export const LAGRINGSFRIST_MS = 8000
