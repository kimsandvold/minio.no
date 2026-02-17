import { useState, useEffect, useCallback } from 'react'
import { useAuthContext } from '../context/AuthContext'
import {
  subscribeToPollResults,
  getUserVote,
  submitVote as submitVoteService,
  type PollData,
  type VoterRecord,
} from '../services/pollService'

interface UsePollReturn {
  pollData: PollData | null
  userVote: VoterRecord | null
  hasVoted: boolean
  loading: boolean
  submitting: boolean
  error: string | null
  submitVote: (option: string, otherText?: string) => Promise<void>
}

export function usePoll(pollId: string): UsePollReturn {
  const { firebaseUser } = useAuthContext()
  const [pollData, setPollData] = useState<PollData | null>(null)
  const [userVote, setUserVote] = useState<VoterRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsub = subscribeToPollResults(
      pollId,
      (data) => {
        setPollData(data)
        setLoading(false)
      },
      () => setLoading(false),
    )
    return unsub
  }, [pollId])

  useEffect(() => {
    if (!firebaseUser) {
      setUserVote(null)
      return
    }
    getUserVote(pollId, firebaseUser.uid).then(setUserVote).catch(() => {})
  }, [pollId, firebaseUser])

  const submitVote = useCallback(
    async (option: string, otherText?: string) => {
      if (!firebaseUser) return
      setSubmitting(true)
      setError(null)
      try {
        await submitVoteService(pollId, firebaseUser.uid, option, otherText)
        setUserVote({ uid: firebaseUser.uid, option, otherText, votedAt: null })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Noe gikk galt')
      } finally {
        setSubmitting(false)
      }
    },
    [pollId, firebaseUser],
  )

  return {
    pollData,
    userVote,
    hasVoted: !!userVote,
    loading,
    submitting,
    error,
    submitVote,
  }
}
