import { useEffect } from 'react'
import { sectionTitles } from '../data/navigation'

export function useHashNavigation(): void {
  useEffect(() => {
    function updateTitle() {
      const hash = location.hash.replace('#', '')
      document.title = sectionTitles[hash] || 'Minio – Tidløs håndverk etter dine mål og stil'
    }

    updateTitle()
    window.addEventListener('hashchange', updateTitle)
    return () => window.removeEventListener('hashchange', updateTitle)
  }, [])
}
