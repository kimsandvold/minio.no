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

  /** Logg inn med e-post og passord. Kaster videre – skjemaet viser feilen. */
  const loggInnMedEpost = useCallback(async (epost: string, passord: string) => {
    const [{ signInWithEmailAndPassword }, { auth }] = lastet ?? (await lastFirebaseAuth())
    await signInWithEmailAndPassword(auth, epost.trim(), passord)
  }, [])

  /**
   * Oppretter en konto og sender bekreftelseslenke.
   *
   * Bekreftelsen er ikke pynt: porten foran bestillinger lover kunden at vi
   * har «en verifisert e-postadresse å sende fakturaen til». Med Google er den
   * verifisert av Google. Med e-post og passord er den det først når lenka er
   * klikket – derfor sendes den med én gang, uoppfordret.
   */
  const registrerMedEpost = useCallback(async (epost: string, passord: string, navn: string) => {
    const [{ createUserWithEmailAndPassword, sendEmailVerification, updateProfile }, { auth }] =
      lastet ?? (await lastFirebaseAuth())
    const { user } = await createUserWithEmailAndPassword(auth, epost.trim(), passord)
    const rentNavn = navn.trim()
    if (rentNavn) await updateProfile(user, { displayName: rentNavn })
    await sendEmailVerification(user).catch(() => {
      /* Kontoen er opprettet. Feiler selve e-posten, kan den sendes på nytt. */
    })
  }, [])

  /** Sender lenke for å sette nytt passord. */
  const sendPassordlenke = useCallback(async (epost: string) => {
    const [{ sendPasswordResetEmail }, { auth }] = lastet ?? (await lastFirebaseAuth())
    await sendPasswordResetEmail(auth, epost.trim())
  }, [])

  /** Sender bekreftelseslenka på nytt til den som er innlogget. */
  const sendBekreftelsePaaNytt = useCallback(async () => {
    const [{ sendEmailVerification }, { auth }] = lastet ?? (await lastFirebaseAuth())
    if (auth.currentUser) await sendEmailVerification(auth.currentUser)
  }, [])

  const logout = useCallback(async () => {
    const [{ signOut }, { auth }] = lastet ?? (await lastFirebaseAuth())
    await signOut(auth)
  }, [])

  const isAuthenticated = firebaseUser !== null
  const isAdmin = firebaseUser?.email === ADMIN_EMAIL
  /**
   * Google-kontoer er verifisert av Google. Nye e-postkontoer er det først
   * når bekreftelseslenka er klikket.
   */
  const epostVerifisert = firebaseUser?.emailVerified ?? false

  const user = firebaseUser
    ? {
        email: firebaseUser.email ?? '',
        name: firebaseUser.displayName ?? '',
        picture: firebaseUser.photoURL ?? undefined,
        sub: firebaseUser.uid,
      }
    : null

  return {
    user,
    firebaseUser,
    login,
    loggInnMedEpost,
    registrerMedEpost,
    sendPassordlenke,
    sendBekreftelsePaaNytt,
    logout,
    isAuthenticated,
    isAdmin,
    epostVerifisert,
    loading,
  }
}
