import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { SignDesign, SavedDesign } from '../types/design'

const DESIGNS_COLLECTION = 'designs'

interface CreateDesignParams {
  userId: string
  name: string
  design: SignDesign
  svgSnapshot: string
}

export async function createDesign(params: CreateDesignParams): Promise<string> {
  const docRef = await addDoc(collection(db, DESIGNS_COLLECTION), {
    ...params,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updateDesign(
  designId: string,
  data: { name?: string; design?: SignDesign; svgSnapshot?: string },
): Promise<void> {
  const ref = doc(db, DESIGNS_COLLECTION, designId)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
}

export async function getUserDesigns(userId: string): Promise<SavedDesign[]> {
  const q = query(
    collection(db, DESIGNS_COLLECTION),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc'),
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SavedDesign))
}

export async function getDesignById(designId: string): Promise<SavedDesign | null> {
  const ref = doc(db, DESIGNS_COLLECTION, designId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as SavedDesign
}

export async function deleteDesign(designId: string): Promise<void> {
  const ref = doc(db, DESIGNS_COLLECTION, designId)
  await deleteDoc(ref)
}
