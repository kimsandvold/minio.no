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
import type { ProsjektIde, ProsjektIdeStatus } from '../types/prosjektIde'

const COLLECTION = 'prosjektIdeer'
// Samme Formspree-skjema som kontakt/checkout bruker (varsler admin på e-post).
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mwpwragr'

type NyProsjektIde = Omit<ProsjektIde, 'id' | 'status' | 'createdAt'>

/**
 * Lagrer prosjektidéen i Firestore (uinnlogget – se firestore.rules) og
 * varsler admin på e-post. De to går parallelt og uavhengig av hverandre:
 * idéen regnes som sendt når minst én av dem gikk gjennom, slik at en
 * blokkert/hengende Firestore ikke stopper e-posten (eller omvendt). Kaster
 * bare når begge feilet – da får kunden feilmelding og beholder teksten.
 */
export async function opprettProsjektIde(ide: NyProsjektIde): Promise<void> {
  const lagring = medTidsfrist(
    addDoc(collection(db, COLLECTION), {
      ...ide,
      status: 'ny' as ProsjektIdeStatus,
      createdAt: serverTimestamp(),
    }),
    LAGRINGSFRIST_MS,
  ).then(
    () => true,
    () => false,
  )
  const [lagret, varslet] = await Promise.all([lagring, sendAdminVarsel(ide)])
  if (!lagret && !varslet) throw new Error('Kunne ikke sende prosjektidéen.')
}

/** Returnerer true når Formspree tok imot varselet. */
async function sendAdminVarsel(ide: NyProsjektIde): Promise<boolean> {
  try {
    const fd = new FormData()
    fd.append('_subject', `Ny prosjektidé: ${ide.prosjektType || 'uteprosjekt'} – ${ide.navn}`)
    fd.append('Navn', ide.navn)
    fd.append('email', ide.epost)
    fd.append('Sted', ide.sted || '(ikke oppgitt)')
    fd.append('Prosjekttype', ide.prosjektType || '(ikke valgt)')
    fd.append('Idé', ide.melding)
    fd.append('Admin', `${window.location.origin}/admin/prosjektideer`)
    const res = await fetch(FORMSPREE_ENDPOINT, { method: 'POST', body: fd, headers: { Accept: 'application/json' } })
    return res.ok
  } catch {
    return false
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
