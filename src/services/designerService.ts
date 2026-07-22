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
import type { DesignerProsjekt, Vare } from '../types/designerProsjekt'
import { MAKS_DESIGN_PER_TYPE, VARER_FOR_KJOP } from '../types/designerProsjekt'

const COLLECTION = 'designerProsjekter'

export class MaksDesignError extends Error {
  constructor() {
    super(`Du kan lagre maks ${MAKS_DESIGN_PER_TYPE} design per type.`)
    this.name = 'MaksDesignError'
  }
}

/**
 * 6-sifret tilgangskode utledet av templateId + userId + designId.
 * Deterministisk (kan reproduseres for e-post), men per design.
 */
export function genTilgangskode(templateId: string, userId: string, designId: string): string {
  const s = `${templateId}:${userId}:${designId}:minio-plan-v1`
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return String((h >>> 0) % 1000000).padStart(6, '0')
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
    tilgangskode: '',
    vipps: { status: 'none' },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  const tilgangskode = genTilgangskode(p.templateId, p.userId, ref.id)
  await updateDoc(ref, { tilgangskode })
  return {
    id: ref.id,
    userId: p.userId,
    templateId: p.templateId,
    navn: p.navn,
    config: p.config,
    overrides: p.overrides ?? {},
    betalt: false,
    kjopt: {},
    tilgangskode,
    vipps: { status: 'none' },
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

/**
 * Låser opp leveransene som følger med et kjøp (entitlements). Setter de
 * aktuelle `kjopt.*`-flaggene + `betalt` (bakoverkompatibelt totalflagg).
 * Server-autoritativ opplåsing skjer i Cloud Function ved Vipps-kapring; denne
 * brukes for kode-basert opplåsing (tilgangskode/demo) på klienten.
 */
export async function markerKjopt(id: string, vare: Vare | 'bundle'): Promise<void> {
  const patch: Record<string, unknown> = {
    betalt: true,
    'vipps.status': 'paid',
    updatedAt: serverTimestamp(),
  }
  for (const v of VARER_FOR_KJOP[vare]) patch[`kjopt.${v}`] = true
  await updateDoc(doc(db, COLLECTION, id), patch)
}
