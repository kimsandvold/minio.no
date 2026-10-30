import { addDoc, collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Valg } from '../data/gravering'

/**
 * Graveringsbestillinger. I motsetning til designforespørslene krever disse
 * ingen innlogging – en gravert fjøl er et gavekjøp, og en Google-pålogging i
 * veien ville kostet oss kunden.
 *
 * Dokumentet bærer hele produksjonsgrunnlaget: valgene kunden gjorde, og den
 * ferdige SVG-en med teksten konvertert til kurver. Da kan graveringen kjøres
 * uten å åpne konfiguratoren på nytt, og uten at riktig skrift er installert.
 * Reglene i firestore.rules låser lesing til admin.
 */

const COLLECTION = 'graveringBestillinger'

export type GraveringStatus = 'ny' | 'besvart' | 'lukket'

export interface GraveringBestilling {
  id?: string
  /**
   * Felles id for varene i samme bestilling. Hver vare lagres som sitt eget
   * dokument – de har hver sin produksjonsfil – men hører sammen i admin.
   */
  ordreId: string
  /** Antall like eksemplarer av denne varen. */
  antall: number
  navn: string
  epost: string
  telefon: string
  /** Leveringsadresse – varen sendes i posten og faktureres ved utsending. */
  adresse: string
  postnr: string
  sted: string
  melding: string
  produktId: string
  produktNavn: string
  /** Lesbar spesifikasjon, samme tekst som e-postvarselet får. */
  sammendrag: string
  maal: string
  prisSum: number
  /** Hele konfigurasjonen, slik at motivet kan gjenskapes i konfiguratoren. */
  valg: Valg
  /** Produksjonsfila. Tekst er kurver – ingen skriftavhengighet. */
  svg: string
  filnavn: string
  status: GraveringStatus
  createdAt?: unknown
}

export const graveringStatusLabel: Record<GraveringStatus, string> = {
  ny: 'Ny',
  besvart: 'Besvart',
  lukket: 'Lukket',
}

type NyBestilling = Omit<GraveringBestilling, 'id' | 'status' | 'createdAt'>

/** Lagrer bestillingen med SVG-en. Returnerer dokument-id-en. */
export async function lagreGravering(b: NyBestilling): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...b,
    status: 'ny' as GraveringStatus,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

/** Alle graveringsbestillinger (admin). Nyeste først. */
export async function getAlleGraveringer(): Promise<GraveringBestilling[]> {
  const snap = await getDocs(query(collection(db, COLLECTION), orderBy('createdAt', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as GraveringBestilling))
}

export async function oppdaterGraveringStatus(id: string, status: GraveringStatus): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { status })
}
