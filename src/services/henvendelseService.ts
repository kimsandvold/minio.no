import {
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { LAGRINGSFRIST_MS, medTidsfrist } from '../utils/medTidsfrist'
import type { Henvendelse, HenvendelseStatus } from '../types/henvendelse'

const COLLECTION = 'henvendelser'

type NyHenvendelse = Omit<Henvendelse, 'id' | 'status' | 'createdAt'>

/**
 * Lagrer henvendelsen i Firestore så den finnes igjen under /admin.
 *
 * Returnerer true når den ble lagret. Kaster ALDRI: lagringen er et tillegg
 * til e-postvarselet som skjemaet sender fra før, og en blokkert Firestore
 * (adblock, bedriftsnett) skal ikke hindre kunden i å få sendt. Kalleren
 * avgjør selv om innsendingen var vellykket – normalt «minst én av dem gikk
 * gjennom», samme mønster som prosjektIdeService.
 */
export async function lagreHenvendelse(h: NyHenvendelse): Promise<boolean> {
  try {
    await medTidsfrist(
      addDoc(collection(db, COLLECTION), {
        ...h,
        status: 'ny' as HenvendelseStatus,
        createdAt: serverTimestamp(),
      }),
      LAGRINGSFRIST_MS,
    )
    return true
  } catch {
    return false
  }
}

/** Alle henvendelser (admin). Nyeste først. */
export async function getAlleHenvendelser(): Promise<Henvendelse[]> {
  const snap = await getDocs(query(collection(db, COLLECTION), orderBy('createdAt', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Henvendelse))
}

export async function oppdaterHenvendelseStatus(id: string, status: HenvendelseStatus): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { status })
}
