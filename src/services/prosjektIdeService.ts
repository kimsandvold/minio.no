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
import type { ProsjektIde, ProsjektIdeStatus } from '../types/prosjektIde'

const COLLECTION = 'prosjektIdeer'
// Samme Formspree-skjema som kontakt/checkout bruker (varsler admin på e-post).
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mwpwragr'

type NyProsjektIde = Omit<ProsjektIde, 'id' | 'status' | 'createdAt'>

/**
 * Lagrer prosjektidéen i Firestore (uinnlogget – se firestore.rules) og
 * varsler admin på e-post (best-effort). Varselet skal ikke blokkere
 * lagringen om Formspree feiler.
 */
export async function opprettProsjektIde(ide: NyProsjektIde): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...ide,
    status: 'ny' as ProsjektIdeStatus,
    createdAt: serverTimestamp(),
  })
  void sendAdminVarsel(ide)
  return ref.id
}

async function sendAdminVarsel(ide: NyProsjektIde): Promise<void> {
  try {
    const fd = new FormData()
    fd.append('_subject', `Ny prosjektidé: ${ide.prosjektType || 'uteprosjekt'} – ${ide.navn}`)
    fd.append('Navn', ide.navn)
    fd.append('email', ide.epost)
    fd.append('Sted', ide.sted || '(ikke oppgitt)')
    fd.append('Prosjekttype', ide.prosjektType || '(ikke valgt)')
    fd.append('Idé', ide.melding)
    fd.append('Admin', `${window.location.origin}/admin/prosjektideer`)
    await fetch(FORMSPREE_ENDPOINT, { method: 'POST', body: fd, headers: { Accept: 'application/json' } })
  } catch {
    // Varsel er best-effort – idéen er allerede lagret i Firestore.
  }
}

/** Alle prosjektidéer (admin). Nyeste først. */
export async function getAlleProsjektIdeer(): Promise<ProsjektIde[]> {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ProsjektIde))
}

export async function oppdaterProsjektIdeStatus(id: string, status: ProsjektIdeStatus): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { status })
}
