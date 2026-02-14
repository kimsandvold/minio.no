import { useEffect } from 'react'

export function useScrollLock(locked: boolean): void {
  useEffect(() => {
    if (locked) {
      document.documentElement.style.overflow = 'hidden'
      document.body.style.overflow = 'hidden'
    } else {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
    }
    return () => {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
    }
  }, [locked])
}
