import type { NavLink } from '../types/product'

export const navLinks: NavLink[] = [
  { href: '/', label: 'Hjem', icon: 'faHome', ariaLabel: 'Hjem' },
  { href: '/produkter', label: 'Produkter', icon: 'faBriefcase', ariaLabel: 'Produkter' },
  { href: '/slik-jobber-vi', label: 'Slik jobber vi', icon: 'faGears', ariaLabel: 'Slik jobber vi' },
  { href: '/byggeguider', label: 'Byggeguider', icon: 'faTools', ariaLabel: 'Byggeguider' },
  { href: '/designverktoy', label: '3D design', icon: 'faCube', ariaLabel: '3D design' },
  { href: '/kontakt', label: 'Kontakt', icon: 'faEnvelope', ariaLabel: 'Kontakt' },
]

export const sectionTitles: Record<string, string> = {
  hjem: 'Minio – Tidløs håndverk etter dine mål og stil',
  portefolje: 'Produkter – Minio',
  prosess: 'Prosess – Minio',
  tjenester: 'Tjenester – Minio',
  kontakt: 'Kontakt – Minio',
}
