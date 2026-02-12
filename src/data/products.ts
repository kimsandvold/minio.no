import type { Product } from '../types/product'
import productsData from './products.json'

const allProducts: Product[] = productsData as Product[]

const SIMULATED_DELAY = 400

function simulateFetch<T>(data: T): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(data), SIMULATED_DELAY))
}

export function fetchAllProducts(): Promise<Product[]> {
  return simulateFetch(allProducts)
}

export function fetchRandomProducts(count: number): Promise<Product[]> {
  const pool = allProducts.filter(p => !p.isFeatured)
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return simulateFetch(shuffled.slice(0, count))
}

export function fetchFeaturedProduct(): Promise<Product | undefined> {
  return simulateFetch(allProducts.find(p => p.isFeatured))
}

export function fetchProductBySlug(slug: string): Promise<Product | undefined> {
  return simulateFetch(allProducts.find(p => p.slug === slug))
}
