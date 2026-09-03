import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { DesignerProsjekt } from '../types/designerProsjekt'
import { MAKS_DESIGN_PER_TYPE } from '../types/designerProsjekt'

const COLLECTION = 'designerProsjekter'

export class MaksDesignError extends Error {
  constructor() {
    super(`Du kan lagre maks ${MAKS_DESIGN_PER_TYPE} design per type.`)
    this.name = 'MaksDesignError'
  }
}

interface NyttProsjekt {
  userId: string
  templateId: string
  navn: string
  config: DesignerProsjekt['config']
  overrides?: DesignerProsjekt['overrides']
}

/** Oppretter et nytt lagret design. Håndhever maks antall per type. */
export async function opprettProsjekt(p: NyttProsjekt): Promise<DesignerProsjekt> {
  const eksisterende = await getBrukerProsjekter(p.userId, p.templateId)
  if (eksisterende.length >= MAKS_DESIGN_PER_TYPE) throw new MaksDesignError()

  const ref = await addDoc(collection(db, COLLECTION), {
    userId: p.userId,
    templateId: p.templateId,
    navn: p.navn,
    config: p.config,
    overrides: p.overrides ?? {},
    betalt: false,
    kjopt: {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return {
    id: ref.id,
    userId: p.userId,
    templateId: p.templateId,
    navn: p.navn,
    config: p.config,
    overrides: p.overrides ?? {},
    betalt: false,
    kjopt: {},
  }
}

export async function oppdaterProsjekt(
  id: string,
  data: { navn?: string; config?: DesignerProsjekt['config']; overrides?: DesignerProsjekt['overrides'] },
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { ...data, updatedAt: serverTimestamp() })
}

export async function getBrukerProsjekter(userId: string, templateId?: string): Promise<DesignerProsjekt[]> {
  const clauses = [where('userId', '==', userId)]
  if (templateId) clauses.push(where('templateId', '==', templateId))
  const snap = await getDocs(query(collection(db, COLLECTION), ...clauses))
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as DesignerProsjekt)
  // Sorter nyeste først (unngår sammensatt Firestore-indeks).
  return list.sort((a, b) => (b.updatedAt?.toMillis?.() ?? 0) - (a.updatedAt?.toMillis?.() ?? 0))
}

export async function getProsjekt(id: string): Promise<DesignerProsjekt | null> {
  const snap = await getDoc(doc(db, COLLECTION, id))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as DesignerProsjekt) : null
}

export async function slettProsjekt(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id))
}

/*
 * Opplåsing (`betalt`, `kjopt`, `frosset`, `tilgangskode`) skrives IKKE herfra.
 * Feltene er server-only i firestore.rules, og settes av Vercel-funksjonene:
 *  - api/vipps/status.ts – etter kapret Vipps-betaling
 *  - api/vipps/redeem.ts – ved innløsing av tilgangskode
 * Se losInnTilgangskode() i src/services/vippsService.ts.
 */
