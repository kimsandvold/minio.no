import { useState, useEffect } from 'react'
import { getActivePoll } from '../services/pollAdminService'

interface UseActivePollReturn {
  activePollId: string | null
  loading: boolean
}

export function useActivePoll(): UseActivePollReturn {
  const [activePollId, setActivePollId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getActivePoll()
      .then((poll) => setActivePollId(poll?.id ?? null))
      .catch(() => setActivePollId(null))
      .finally(() => setLoading(false))
  }, [])

  return { activePollId, loading }
}
