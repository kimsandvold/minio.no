import { allProducts } from './products'
import { guideTopics, guideProjects, guideHref, projectHref } from './byggeguider'

export type SearchGroup = 'Produkter' | 'Byggeguider' | 'Planleggere' | 'Sider'

export interface SearchItem {
  /** Stable id for keys and selection. */
  id: string
  group: SearchGroup
  title: string
  /** Short human-readable description shown under the title. */
  description: string
  href: string
  /** Optional image (used for products). */
  image?: string
  /** FontAwesome icon name (used when there is no image). */
  icon: string
  /** Extra search terms / synonyms so matches work beyond title + description. */
  keywords: string[]
}

/** Static pages and planners worth surfacing in search. */
const staticItems: SearchItem[] = [
  {
    id: 'page-planleggere',
    group: 'Planleggere',
    title: 'Terrasseplanlegger',
    description: 'Tegn terrassen i 3D og få materialliste og prisoverslag.',
    href: '/planleggere/terrasse',
    icon: 'faRulerCombined',
    keywords: ['terrasse', 'planlegger', '3d', 'materialliste', 'pris', 'gulv', 'platting'],
  },
  {
    id: 'page-pergola',
    group: 'Planleggere',
    title: 'Pergolaplanlegger',
    description: 'Design pergolaen i 3D med mål, materialliste og pris.',
    href: '/planleggere/pergola',
    icon: 'faRulerCombined',
    keywords: ['pergola', 'planlegger', '3d', 'solskjerming', 'tak', 'hage'],
  },
  {
    id: 'page-carport',
    group: 'Planleggere',
    title: 'Carportplanlegger',
    description: 'Planlegg carporten i 3D med snølast, materialliste og pris.',
    href: '/planleggere/carport',
    icon: 'faRulerCombined',
    keywords: ['carport', 'planlegger', '3d', 'bil', 'snølast', 'tak', 'parkering'],
  },
  {
    id: 'page-planleggere-hub',
    group: 'Planleggere',
    title: 'Alle planleggere',
    description: 'Oversikt over alle 3D-planleggerne våre.',
    href: '/planleggere',
    icon: 'faRulerCombined',
    keywords: ['planleggere', 'verktøy', '3d', 'oversikt'],
  },
  {
    id: 'page-byggeguider',
    group: 'Sider',
    title: 'Byggeguider',
    description: 'Steg-for-steg-guider fra idé til ferdig prosjekt.',
    href: '/byggeguider',
    icon: 'faTools',
    keywords: ['byggeguider', 'guide', 'diy', 'gjør det selv', 'tips'],
  },
  {
    id: 'page-produkter',
    group: 'Sider',
    title: 'Produkter',
    description: 'Se alle hage- og utendørsprodukter i tre.',
    href: '/produkter',
    icon: 'faBriefcase',
    keywords: ['produkter', 'butikk', 'utvalg', 'sortiment'],
  },
  {
    id: 'page-slik-jobber-vi',
    group: 'Sider',
    title: 'Slik jobber vi',
    description: 'Fra idé til ferdig produkt – slik er prosessen vår.',
    href: '/slik-jobber-vi',
    icon: 'faGears',
    keywords: ['prosess', 'slik jobber vi', 'bestilling', 'fremgangsmåte'],
  },
  {
    id: 'page-skilt-og-gravering',
    group: 'Sider',
    title: 'Skilt & gravering',
    description: 'Personlige skilt og gravering etter dine ønsker.',
    href: '/skilt-og-gravering',
    icon: 'faPencilRuler',
    keywords: ['skilt', 'gravering', 'dørskilt', 'navneskilt', 'personlig'],
  },
  {
    id: 'page-kontakt',
    group: 'Sider',
    title: 'Kontakt',
    description: 'Ta kontakt for et uforpliktende tilbud.',
    href: '/kontakt',
    icon: 'faEnvelope',
    keywords: ['kontakt', 'tilbud', 'e-post', 'telefon', 'henvendelse'],
  },
]

/** Strip HTML tags so product detail text can feed keyword matching. */
const stripHtml = (html: string): string => html.replace(/<[^>]+>/g, ' ')

/**
 * Everything searchable on the site, assembled once from the same static data
 * the pages render from. Products, build guides, projects, planners and key pages.
 */
export const searchIndex: SearchItem[] = [
  ...allProducts.map<SearchItem>((p) => ({
    id: `product-${p.slug}`,
    group: 'Produkter',
    title: p.title,
    description: p.shortDescription,
    href: `/produkter/${p.slug}`,
    image: p.images[0]?.src,
    icon: 'faBriefcase',
    keywords: [p.slug, p.price, stripHtml(p.detailsHtml)],
  })),
  ...guideTopics.map<SearchItem>((t) => ({
    id: `guide-${t.slug}`,
    group: 'Byggeguider',
    title: t.title,
    description: t.teaser,
    href: guideHref(t),
    icon: 'faTools',
    keywords: t.keywords,
  })),
  ...guideProjects.map<SearchItem>((proj) => ({
    id: `project-${proj.slug}`,
    group: 'Byggeguider',
    title: proj.title,
    description: proj.teaser,
    href: projectHref(proj),
    image: proj.image ?? undefined,
    icon: 'faHammer',
    keywords: ['prosjekt', proj.difficulty, proj.slug],
  })),
  ...staticItems,
]

/** Order groups appear in the results list. */
export const groupOrder: SearchGroup[] = ['Produkter', 'Byggeguider', 'Planleggere', 'Sider']

/**
 * Score an item against a query. Returns 0 for no match, higher is more relevant.
 * Every whitespace-separated term must match somewhere; title hits weigh most.
 */
function scoreItem(item: SearchItem, terms: string[]): number {
  const title = item.title.toLowerCase()
  const description = item.description.toLowerCase()
  const keywords = item.keywords.join(' ').toLowerCase()

  let score = 0
  for (const term of terms) {
    if (title.startsWith(term)) score += 100
    else if (title.includes(term)) score += 50
    else if (description.includes(term)) score += 15
    else if (keywords.includes(term)) score += 8
    else return 0 // a term that matches nothing disqualifies the item
  }
  return score
}

/** Search the whole site. Empty query returns []. Results are sorted by relevance. */
export function searchAll(query: string, limit = 12): SearchItem[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return []

  return searchIndex
    .map((item) => ({ item, score: scoreItem(item, terms) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.item)
}
