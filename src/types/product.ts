export interface Product {
  id: string
  slug: string
  title: string
  shortDescription: string
  price: string
  regularPrice?: string
  images: Array<{
    src: string
    alt: string
  }>
  detailsHtml: string
  category: 'primary' | 'secondary'
  showOnFrontPage: boolean
  hasPromoRibbon?: boolean
  isFeatured?: boolean
  hasConfigurator?: boolean
  basePrice?: number
  externalLink?: string
}

export interface BasketItem {
  id: number
  type: string
  quantity: number
  dimensions: {
    width: number
    height: number
    depth: number
  }
  mounting?: string
  angle?: string
  finish: string
  roof?: string
  quality?: string
  shape?: string
  armThickness?: number
  espalier?: string
  delivery: string
  installation?: string
  price: string
  product?: string
  size?: string
  complexity?: string
  lighting?: string
  designCount?: string
  signRequested?: boolean
  signWidthCm?: number
  signHeightCm?: number
  signDesignId?: string
  discount?: string
  orientation?: string
  setLabel?: string
  slotDimensions?: Array<{
    width: number
    height: number
    depth: number
    widthB?: number
    type?: string
    orientation?: string
    unitPrice?: string
  }>
  lockQuantity?: boolean
}

export interface ProcessStepData {
  icon: string
  number: number
  title: string
  description: string
}

export interface ServiceData {
  icon: string
  title: string
  description: string
  serviceName: string
  externalLink?: {
    href: string
    label: string
    icon: string
  }
}

export interface FeaturedCreation {
  image: {
    src: string
    alt: string
  }
  title: string
  meta?: string
  metaList?: Array<{
    label: string
    value: string
  }>
  description: string
}

export interface NavLink {
  href: string
  label: string
  icon: string
  ariaLabel: string
}

export interface SocialLink {
  href: string
  label: string
  icon: string
  ariaLabel: string
  platform: 'facebook' | 'instagram'
}

export interface GuideSection {
  heading: string
  body: string
}

export type UserLevel = 'beginner' | 'intermediate' | 'advanced'

export interface GuideItem {
  title: string
  slug: string
  excerpt: string
  category: string
  readTime: string
  productSlug: string
  icon: string
  difficulty: UserLevel
  sections: GuideSection[]
}

export interface FaqItem {
  icon: string
  question: string
  answer: string
}

export interface QuizOption {
  label: string
  value: UserLevel
}

export interface QuizQuestion {
  question: string
  options: QuizOption[]
}

export interface CourseModule {
  title: string
  slug: string
  type: 'guide' | 'topic'
  duration: string
}

export interface Course {
  slug: string
  title: string
  subtitle: string
  description: string
  level: UserLevel
  duration: string
  moduleCount: number
  icon: string
  cardImage: string
  learningObjectives: string[]
  modules: CourseModule[]
  article: GuideSection[]
}

export interface InspirationTopic {
  slug: string
  title: string
  excerpt: string
  icon: string
  sections: GuideSection[]
}
