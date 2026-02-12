import { useEffect, useCallback } from 'react'
import { useScrollLock } from './useScrollLock'

export function useModal(isOpen: boolean, onClose: () => void): {
  handleBackdropClick: (e: React.MouseEvent) => void
} {
  useScrollLock(isOpen)

  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose()
    },
    [onClose]
  )

  return { handleBackdropClick }
}
