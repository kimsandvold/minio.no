import type { Product } from '../types/product'
import productsData from './products.json'

export const allProducts: Product[] = productsData as Product[]

/** Products shown in listings and carousels. Unlisted ones stay reachable by URL and via search. */
const listedProducts = allProducts.filter(p => !p.unlisted)

const SIMULATED_DELAY = 400

function simulateFetch<T>(data: T): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(data), SIMULATED_DELAY))
}

export function fetchAllProducts(): Promise<Product[]> {
  return simulateFetch(listedProducts)
}

const PINNED_FIRST_SLUG = 'pidestall-krakk'

export function fetchRandomProducts(count: number, excludeSlug?: string): Promise<Product[]> {
  const pool = listedProducts.filter(p => !p.isFeatured && p.slug !== excludeSlug)
  const pinned = pool.find(p => p.slug === PINNED_FIRST_SLUG)
  const rest = pool.filter(p => p.slug !== PINNED_FIRST_SLUG)
  const shuffled = [...rest].sort(() => Math.random() - 0.5)
  const result = pinned ? [pinned, ...shuffled].slice(0, count) : shuffled.slice(0, count)
  return simulateFetch(result)
}

export function fetchFeaturedProduct(): Promise<Product | undefined> {
  return simulateFetch(allProducts.find(p => p.isFeatured))
}

export function fetchFeaturedProducts(): Promise<Product[]> {
  return simulateFetch(allProducts.filter(p => p.isFeatured))
}

export function fetchProductBySlug(slug: string): Promise<Product | undefined> {
  return simulateFetch(allProducts.find(p => p.slug === slug))
}
