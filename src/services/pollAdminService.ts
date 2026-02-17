import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'

export interface PollDoc {
  id: string
  question: string
  options: string[]
  votes: Record<string, number>
  otherVotes: string[]
  startDate: Timestamp
  endDate: Timestamp
  createdAt: Timestamp
}

const pollsCol = collection(db, 'polls')

export async function getAllPolls(): Promise<PollDoc[]> {
  const q = query(pollsCol, orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PollDoc)
}

export async function createPoll(
  question: string,
  options: string[],
  startDate: Date,
  endDate: Date,
): Promise<string> {
  const votes: Record<string, number> = {}
  for (const opt of options) votes[opt] = 0

  const ref = await addDoc(pollsCol, {
    question,
    options,
    votes,
    otherVotes: [],
    startDate: Timestamp.fromDate(startDate),
    endDate: Timestamp.fromDate(endDate),
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function updatePoll(
  pollId: string,
  updates: {
    question?: string
    options?: string[]
    startDate?: Date
    endDate?: Date
  },
): Promise<void> {
  const ref = doc(db, 'polls', pollId)
  const data: Record<string, unknown> = {}
  if (updates.question !== undefined) data.question = updates.question
  if (updates.options !== undefined) data.options = updates.options
  if (updates.startDate !== undefined)
    data.startDate = Timestamp.fromDate(updates.startDate)
  if (updates.endDate !== undefined)
    data.endDate = Timestamp.fromDate(updates.endDate)
  await updateDoc(ref, data)
}

export async function deletePoll(pollId: string): Promise<void> {
  const ref = doc(db, 'polls', pollId)
  await deleteDoc(ref)
}

export async function getActivePoll(): Promise<PollDoc | null> {
  const now = Timestamp.now()
  // Single inequality on startDate to avoid needing a composite index.
  // Filter endDate client-side.
  const q = query(
    pollsCol,
    where('startDate', '<=', now),
    orderBy('startDate', 'desc'),
  )
  const snap = await getDocs(q)
  for (const d of snap.docs) {
    const data = d.data() as Omit<PollDoc, 'id'>
    if (data.endDate && data.endDate.toMillis() >= now.toMillis()) {
      return { id: d.id, ...data } as PollDoc
    }
  }
  return null
}
