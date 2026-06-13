export interface GuidePhase {
  key: string
  label: string
}

export interface GuideTopic {
  number: number
  slug: string
  title: string
  teaser: string
  phaseKey: string
  /** Extra search terms / synonyms so search matches even when the word isn't in the title. */
  keywords: string[]
  /** Whether the article page is published yet. Unpublished topics show as "Kommer snart". */
  available: boolean
}

export const guidePhases: GuidePhase[] = [
  { key: 'planlegg', label: 'Planlegg prosjektet' },
  { key: 'velg', label: 'Velg riktig' },
  { key: 'bygg', label: 'Bygg' },
  { key: 'finish', label: 'Finish' },
]

export const guideTopics: GuideTopic[] = [
  {
    number: 1,
    slug: 'planlegging',
    title: 'Planlegging',
    teaser: 'Fra løs idé til en konkret plan og en materialliste som stemmer.',
    phaseKey: 'planlegg',
    keywords: ['plan', 'materialliste', 'kappeliste', 'budsjett', 'mål', 'idé', 'skisse', 'forberedelse'],
    available: true,
  },
  {
    number: 2,
    slug: 'design-og-tegning',
    title: 'Design & tegning',
    teaser: 'Skisse på papir eller digitalt? Slik tegner du prosjektet før du bygger.',
    phaseKey: 'planlegg',
    keywords: ['design', 'tegning', 'skisse', '3d', 'papir', 'digitalt', 'målestokk', 'ruteark', 'sketchup'],
    available: true,
  },
  {
    number: 3,
    slug: 'konstruksjon-og-styrke',
    title: 'Konstruksjon & styrke',
    teaser: 'Vil det tåle belastning? Tenk på vekt, avstivning og innfesting.',
    phaseKey: 'planlegg',
    keywords: ['konstruksjon', 'styrke', 'bæreevne', 'belastning', 'avstivning', 'innfesting', 'stabilitet', 'vekt', 'diagonal'],
    available: true,
  },
  {
    number: 4,
    slug: 'trevirke',
    title: 'Trevirke',
    teaser: 'Tretyper, impregnert vs. ubehandlet, dimensjoner og kvalitet.',
    phaseKey: 'velg',
    keywords: ['tre', 'materialer', 'impregnert', 'furu', 'gran', 'lerk', 'dimensjoner', 'bord', 'kvalitet', 'ubehandlet'],
    available: true,
  },
  {
    number: 5,
    slug: 'verktoy',
    title: 'Verktøy',
    teaser: 'Hva du faktisk trenger – og hva som bare er kjekt å ha.',
    phaseKey: 'velg',
    keywords: ['verktøy', 'sag', 'drill', 'skrutrekker', 'tvinger', 'klemmer', 'vinkelhake', 'tommestokk', 'utstyr', 'sirkelsag', 'stikksag'],
    available: true,
  },
  {
    number: 6,
    slug: 'lim-og-festemidler',
    title: 'Lim & festemidler',
    teaser: 'Riktig lim, skruer og beslag for utebruk – så det sitter og holder.',
    phaseKey: 'velg',
    keywords: ['lim', 'skruer', 'beslag', 'spiker', 'forboring', 'rustfri', 'galvanisert', 'trelim', 'feste', 'vinkelbeslag'],
    available: true,
  },
  {
    number: 7,
    slug: 'sikkerhet',
    title: 'Sikkerhet',
    teaser: 'Verneutstyr og trygg bruk av verktøy – så byggingen blir hyggelig og skadefri.',
    phaseKey: 'bygg',
    keywords: ['sikkerhet', 'verneutstyr', 'vernebriller', 'hørselvern', 'støvmaske', 'hansker', 'trygg', 'jordfeilbryter'],
    available: true,
  },
  {
    number: 8,
    slug: 'maling-og-merking',
    title: 'Måling & merking',
    teaser: 'Mål to ganger, kapp én gang. Nøyaktig oppmerking gir deler som passer.',
    phaseKey: 'bygg',
    keywords: ['måling', 'merking', 'mål', 'oppmerking', 'vinkel', 'vater', 'referansekant', 'presisjon', 'tommestokk'],
    available: true,
  },
  {
    number: 9,
    slug: 'saging-og-sammenfoyning',
    title: 'Saging & sammenføyning',
    teaser: 'Slik kapper du rett og setter delene sammen i vinkel.',
    phaseKey: 'bygg',
    keywords: ['saging', 'kapping', 'sammenføyning', 'skjøt', 'montering', 'vinkel', 'buttskjøt', 'kappe', 'sage'],
    available: true,
  },
  {
    number: 10,
    slug: 'sliping',
    title: 'Sliping',
    teaser: 'Riktig kornethet og teknikk for et glatt, proft resultat.',
    phaseKey: 'finish',
    keywords: ['sliping', 'slipepapir', 'kornethet', 'eksentersliper', 'glatt', 'finpuss', 'slipe', 'korn'],
    available: true,
  },
  {
    number: 11,
    slug: 'overflatebehandling',
    title: 'Overflatebehandling',
    teaser: 'Velg og påfør beis, olje eller maling som varer ute.',
    phaseKey: 'finish',
    keywords: ['overflatebehandling', 'beis', 'olje', 'maling', 'lakk', 'behandling', 'strøk', 'male', 'beise'],
    available: true,
  },
  {
    number: 12,
    slug: 'vedlikehold',
    title: 'Vedlikehold',
    teaser: 'Enkelt stell som holder prosjektet pent år etter år.',
    phaseKey: 'finish',
    keywords: ['vedlikehold', 'stell', 'rengjøring', 'reparasjon', 'ettersyn', 'råte', 'vask', 'pleie'],
    available: true,
  },
]

export interface GuideProject {
  slug: string
  title: string
  teaser: string
  difficulty: string
  time: string
  /** Public path under /images, or null while we wait for a photo. */
  image: string | null
  available: boolean
}

export const guideProjects: GuideProject[] = [
  {
    slug: 'hagebenk',
    title: 'Hagebenk',
    teaser: 'En stilren, slettet benk i trykkimpregnert terrassebord – limt og skrudd sammen.',
    difficulty: 'Nybegynner',
    time: '3–4 timer',
    image: '/images/byggeguider/hagebenk.webp',
    available: true,
  },
  {
    slug: 'pidestall-utendors',
    title: 'Pidestall utendørs',
    teaser: 'En klassisk søyle-pidestall i terrassebord – perfekt sokkel for en potteplante eller skulptur ute.',
    difficulty: 'Nybegynner',
    time: '3–4 timer',
    image: '/images/byggeguider/pidestall.webp',
    available: true,
  },
]

export const projectHref = (project: GuideProject): string =>
  `/byggeguider/prosjekter/${project.slug}`

export const guideHref = (topic: GuideTopic): string => `/byggeguider/${topic.slug}`

export const findTopic = (slug: string): GuideTopic | undefined =>
  guideTopics.find((t) => t.slug === slug)

export const topicsByPhase = (phaseKey: string): GuideTopic[] =>
  guideTopics.filter((t) => t.phaseKey === phaseKey)

/** Does a topic match a free-text query (title + teaser + keywords)? Empty query matches all. */
export const topicMatchesQuery = (topic: GuideTopic, query: string): boolean => {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return true
  const haystack = `${topic.title} ${topic.teaser} ${topic.keywords.join(' ')}`.toLowerCase()
  return terms.every((term) => haystack.includes(term))
}
