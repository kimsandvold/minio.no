import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import type { GoogleUser } from '../types/auth'

export function useAuth() {
  const [user, setUser] = useLocalStorage<GoogleUser | null>('minio_user', null)

  const login = useCallback((googleUser: GoogleUser) => {
    setUser(googleUser)
  }, [setUser])

  const logout = useCallback(() => {
    setUser(null)
  }, [setUser])

  const isAuthenticated = user !== null

  return { user, login, logout, isAuthenticated }
}
