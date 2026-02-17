import {
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'

export interface PollData {
  question: string
  options: string[]
  votes: Record<string, number>
  otherVotes: string[]
}

export interface VoterRecord {
  uid: string
  option: string
  otherText?: string
  votedAt: unknown
}

export function subscribeToPollResults(
  pollId: string,
  callback: (data: PollData | null) => void,
  onError?: (err: Error) => void,
) {
  const ref = doc(db, 'polls', pollId)
  return onSnapshot(
    ref,
    (snap) => {
      callback(snap.exists() ? (snap.data() as PollData) : null)
    },
    (err) => {
      console.error('Poll snapshot error:', err)
      onError?.(err)
    },
  )
}

export async function getUserVote(
  pollId: string,
  uid: string,
): Promise<VoterRecord | null> {
  const ref = doc(db, 'polls', pollId, 'voters', uid)
  const snap = await getDoc(ref)
  return snap.exists() ? (snap.data() as VoterRecord) : null
}

export async function submitVote(
  pollId: string,
  uid: string,
  option: string,
  otherText?: string,
) {
  const pollRef = doc(db, 'polls', pollId)
  const voterRef = doc(db, 'polls', pollId, 'voters', uid)

  await runTransaction(db, async (tx) => {
    const pollSnap = await tx.get(pollRef)
    if (!pollSnap.exists()) throw new Error('Poll not found')

    const data = pollSnap.data() as PollData
    const votes = { ...data.votes }
    votes[option] = (votes[option] || 0) + 1

    const updates: Partial<PollData> = { votes }
    if (option === 'Annet' && otherText) {
      updates.otherVotes = [...(data.otherVotes || []), otherText]
    }

    tx.update(pollRef, updates)
    tx.set(voterRef, {
      uid,
      option,
      ...(otherText ? { otherText } : {}),
      votedAt: serverTimestamp(),
    } satisfies VoterRecord)
  })
}
