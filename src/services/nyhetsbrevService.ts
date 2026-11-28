import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Nyhetsbrev } from '../types/nyhetsbrev'

/** Nyhetsbrev-utkast (admin). Bare admin kan lese og skrive, se firestore.rules. */
const SAMLING = 'nyhetsbrev'

export async function getAlleNyhetsbrev(): Promise<Nyhetsbrev[]> {
  const snap = await getDocs(query(collection(db, SAMLING), orderBy('oppdatert', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Nyhetsbrev)
}

export async function getNyhetsbrev(id: string): Promise<Nyhetsbrev | null> {
  const snap = await getDoc(doc(db, SAMLING, id))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Nyhetsbrev) : null
}

export async function opprettNyhetsbrev(brev: Omit<Nyhetsbrev, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, SAMLING), {
    ...brev,
    opprettet: serverTimestamp(),
    oppdatert: serverTimestamp(),
  })
  return ref.id
}

export async function lagreNyhetsbrev(id: string, brev: Nyhetsbrev): Promise<void> {
  const { tittel, emne, tema, blokker, bunntekst } = brev
  await updateDoc(doc(db, SAMLING, id), { tittel, emne, tema, blokker, bunntekst, oppdatert: serverTimestamp() })
}

export async function slettNyhetsbrev(id: string): Promise<void> {
  await deleteDoc(doc(db, SAMLING, id))
}
