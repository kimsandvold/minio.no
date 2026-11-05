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
import type { DesignForesporsel, ForesporselStatus } from '../types/foresporsel'
import type { Oppfolging } from '../types/oppfolging'
import { foresporselTypeLabel } from '../types/foresporsel'

const COLLECTION = 'designForesporsler'
// Samme Formspree-skjema som kontakt/checkout bruker (varsler admin på e-post).
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mwpwragr'

const formatKr = (n: number) => `${n.toLocaleString('nb-NO')} kr`

type NyForesporsel = Omit<DesignForesporsel, 'id' | 'status' | 'createdAt'>

/**
 * Lagrer forespørselen i Firestore og varsler admin på e-post. De to går
 * parallelt og uavhengig: forespørselen regnes som sendt når minst én av dem
 * gikk gjennom, så en blokkert/hengende Firestore ikke stopper e-posten (eller
 * omvendt). Kaster bare når begge feilet – da ser kunden en feilmelding.
 */
export async function opprettForesporsel(f: NyForesporsel): Promise<void> {
  const lagring = medTidsfrist(
    addDoc(collection(db, COLLECTION), {
      ...f,
      status: 'ny' as ForesporselStatus,
      createdAt: serverTimestamp(),
    }),
    LAGRINGSFRIST_MS,
  ).then(
    () => true,
    () => false,
  )
  const [lagret, varslet] = await Promise.all([lagring, sendAdminVarsel(f)])
  if (!lagret && !varslet) throw new Error('Kunne ikke sende forespørselen.')
}

/** Returnerer true når Formspree tok imot varselet. */
async function sendAdminVarsel(f: NyForesporsel): Promise<boolean> {
  try {
    const fd = new FormData()
    fd.append('_subject', `Ny forespørsel: ${foresporselTypeLabel[f.type]} – ${f.produktNavn}`)
    fd.append('Type', foresporselTypeLabel[f.type])
    fd.append('Produkt', f.produktNavn)
    fd.append('Design', f.designNavn)
    // Lenken åpner nøyaktig designet kunden forespør (admin kan lese alle
    // design). Mangler den, var designet ikke lagret – da er spesifikasjonen
    // under hele grunnlaget.
    fd.append(
      'Designlenke',
      f.designId
        ? `${window.location.origin}/designverktoy/${f.produktId}?design=${f.designId}`
        : '(designet var ikke lagret – se spesifikasjonen)',
    )
    fd.append('Mål', f.maal)
    fd.append('Areal', f.arealM2 != null ? `${f.arealM2.toFixed(1).replace('.', ',')} m²` : '–')
    fd.append('Materialkostnad', formatKr(f.estimatKr))
    fd.append('Prisestimat', `fra ${formatKr(f.prisEstimatKr)}`)
    fd.append('Spesifikasjon', f.sammendrag)
    if (f.konfigurasjon) fd.append('Alle valg', f.konfigurasjon)
    fd.append('email', f.userEmail)
    fd.append('Melding', f.melding || '(ingen melding)')
    fd.append('Admin', `${window.location.origin}/admin/foresporsler`)
    const res = await fetch(FORMSPREE_ENDPOINT, { method: 'POST', body: fd, headers: { Accept: 'application/json' } })
    return res.ok
  } catch {
    return false
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

/** Setter «gjort»/«sendt»/«fakturert»-markørene (admin). */
export async function oppdaterForesporselOppfolging(id: string, endring: Oppfolging): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { ...endring })
}
