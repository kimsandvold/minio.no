import { createContext, useContext, type ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import type { GoogleUser } from '../types/auth'

interface AuthContextType {
  user: GoogleUser | null
  login: (user: GoogleUser) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export function useAuthContext(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}
