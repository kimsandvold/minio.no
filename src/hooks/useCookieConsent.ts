import { useState, useCallback } from 'react'

export function useCookieConsent(): {
  hasConsented: boolean
  acceptCookies: () => void
} {
  const [hasConsented, setHasConsented] = useState(() => {
    return localStorage.getItem('minio_cookie_consent') === 'true'
  })

  const acceptCookies = useCallback(() => {
    localStorage.setItem('minio_cookie_consent', 'true')
    setHasConsented(true)
  }, [])

  return { hasConsented, acceptCookies }
}
