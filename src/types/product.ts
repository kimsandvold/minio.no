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
  /** Hidden from product listings/carousels, but still reachable by URL and via search. */
  unlisted?: boolean
  hasPromoRibbon?: boolean
  /**
   * Kampanje som er slått AV utenfor sesong. JSON tar ikke kommentarer, så
   * verdiene parkeres her i stedet for å slettes. `aktiv: false` betyr at
   * ingenting av dette vises – se `notat` for hva som må skrus på igjen.
   */
  kampanje?: {
    aktiv: boolean
    notat: string
    regularPrice: string
    rabattProsent: number
  }
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


