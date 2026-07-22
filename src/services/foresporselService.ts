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
import type { DesignForesporsel, ForesporselStatus } from '../types/foresporsel'
import { foresporselTypeLabel } from '../types/foresporsel'

const COLLECTION = 'designForesporsler'
// Samme Formspree-skjema som kontakt/checkout bruker (varsler admin på e-post).
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mwpwragr'

const formatKr = (n: number) => `${n.toLocaleString('nb-NO')} kr`

type NyForesporsel = Omit<DesignForesporsel, 'id' | 'status' | 'createdAt'>

/**
 * Lagrer forespørselen i Firestore og varsler admin på e-post (best-effort).
 * E-postvarselet skal ikke blokkere lagringen om Formspree feiler.
 */
export async function opprettForesporsel(f: NyForesporsel): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...f,
    status: 'ny' as ForesporselStatus,
    createdAt: serverTimestamp(),
  })
  void sendAdminVarsel(f)
  return ref.id
}

async function sendAdminVarsel(f: NyForesporsel): Promise<void> {
  try {
    const fd = new FormData()
    fd.append('_subject', `Ny forespørsel: ${foresporselTypeLabel[f.type]} – ${f.produktNavn}`)
    fd.append('Type', foresporselTypeLabel[f.type])
    fd.append('Produkt', f.produktNavn)
    fd.append('Design', f.designNavn)
    fd.append('Mål', f.maal)
    fd.append('Areal', f.arealM2 != null ? `${f.arealM2.toFixed(1)} m²` : '–')
    fd.append('Materialkostnad', formatKr(f.estimatKr))
    fd.append('Prisestimat', formatKr(f.prisEstimatKr))
    fd.append('Spesifikasjon', f.sammendrag)
    fd.append('email', f.userEmail)
    fd.append('Melding', f.melding || '(ingen melding)')
    fd.append('Admin', `${window.location.origin}/admin/foresporsler`)
    await fetch(FORMSPREE_ENDPOINT, { method: 'POST', body: fd, headers: { Accept: 'application/json' } })
  } catch {
    // Varsel er best-effort – forespørselen er allerede lagret i Firestore.
  }
}

/** Alle forespørsler (admin). Nyeste først. */
export async function getAlleForesporsler(): Promise<DesignForesporsel[]> {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as DesignForesporsel))
}

export async function oppdaterForesporselStatus(id: string, status: ForesporselStatus): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { status })
}
