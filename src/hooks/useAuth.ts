import { useState, useEffect, useCallback } from 'react'
import type { User } from 'firebase/auth'

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL ?? ''

/**
 * Firebase (~340 kB) lastes dynamisk etter første render i stedet for å ligge
 * i oppstartsbunten – innloggingsstatusen trengs ikke for å tegne siden.
 * Modulene caches, så `login()` kan kalle signInWithPopup synkront i klikket
 * (ellers kan nettleseren blokkere popupen).
 */
type FirebaseAuthModules = [typeof import('firebase/auth'), typeof import('../lib/firebaseApp')]
let lastet: FirebaseAuthModules | undefined
let laster: Promise<FirebaseAuthModules> | undefined
function lastFirebaseAuth(): Promise<FirebaseAuthModules> {
  laster ??= Promise.all([import('firebase/auth'), import('../lib/firebaseApp')]).then((m) => (lastet = m))
  return laster
}

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let avbrutt = false
    let unsubscribe: (() => void) | undefined
    lastFirebaseAuth().then(([{ onAuthStateChanged }, { auth }]) => {
      if (avbrutt) return
      unsubscribe = onAuthStateChanged(auth, (user) => {
        setFirebaseUser(user)
        setLoading(false)
      })
    })
    return () => {
      avbrutt = true
      unsubscribe?.()
    }
  }, [])

  const login = useCallback(async () => {
    // Bevisst ingen nyhetsbrev-påmelding her: innlogging er ikke samtykke til
    // markedsføring. Påmelding skjer kun der brukeren aktivt haker av.
    const [{ signInWithPopup }, { auth, googleProvider }] = lastet ?? (await lastFirebaseAuth())
    await signInWithPopup(auth, googleProvider)
  }, [])

  const logout = useCallback(async () => {
    const [{ signOut }, { auth }] = lastet ?? (await lastFirebaseAuth())
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
