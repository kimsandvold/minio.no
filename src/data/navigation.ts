import type { NavLink } from '../types/product'

// Toppmenyen holdes kort – logoen lenker hjem, og Gravering og Prosjekthjelp
// ligger i footeren og under Tjenester.
export const navLinks: NavLink[] = [
  { href: '/produkter', label: 'Produkter', icon: 'faBriefcase', ariaLabel: 'Produkter' },
  { href: '/designverktoy', label: 'Design selv', icon: 'faCube', ariaLabel: 'Design selv i 3D' },
  { href: '/byggeguider', label: 'Byggeguider', icon: 'faTools', ariaLabel: 'Byggeguider' },
  { href: '/tjenester', label: 'Tjenester', icon: 'faHammer', ariaLabel: 'Tjenester' },
  { href: '/kontakt', label: 'Kontakt', icon: 'faEnvelope', ariaLabel: 'Kontakt' },
]

export const sectionTitles: Record<string, string> = {
  hjem: 'Minio – Tidløs håndverk etter dine mål og stil',
  portefolje: 'Produkter – Minio',
  prosess: 'Prosess – Minio',
  tjenester: 'Tjenester – Minio',
  'tre-veier': 'Tre måter å få det bygget – Minio',
  gravering: 'Gravering – Minio',
  kontakt: 'Kontakt – Minio',
}
