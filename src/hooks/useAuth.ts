import { useState, useEffect, useCallback } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL ?? ''

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const login = useCallback(async () => {
    await signInWithPopup(auth, googleProvider)
  }, [])

  const logout = useCallback(async () => {
    await signOut(auth)
  }, [])

  const isAuthenticated = firebaseUser !== null
  const isAdmin = firebaseUser?.email === ADMIN_EMAIL

  const user = firebaseUser
    ? {
        email: firebaseUser.email ?? '',
        name: firebaseUser.displayName ?? '',
        picture: firebaseUser.photoURL ?? undefined,
        sub: firebaseUser.uid,
      }
    : null

  return { user, firebaseUser, login, logout, isAuthenticated, isAdmin, loading }
}
