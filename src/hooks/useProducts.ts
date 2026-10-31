import { useState, useEffect } from 'react'
import type { Product } from '../types/product'
import {
  fetchRandomProducts,
  getFeaturedProducts,
  getListedProducts,
  getProductBySlug,
} from '../data/products'

interface UseProductsResult<T> {
  data: T
  loading: boolean
}

// Produktdataene er statisk JSON i bunten. Hookene under svarer derfor
// synkront: da matcher første render den prerendrede HTML-en, i stedet for å
// bytte den ut med skjeletter og så med innholdet igjen (blink, CLS, sen LCP).

export function useAllProducts(): UseProductsResult<Product[]> {
  return { data: getListedProducts(), loading: false }
}

export function useRandomProducts(count: number, excludeSlug?: string): UseProductsResult<Product[]> {
  const [data, setData] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRandomProducts(count, excludeSlug).then(products => {
      setData(products)
      setLoading(false)
    })
  }, [count, excludeSlug])

  return { data, loading }
}

export function useFeaturedProduct(): UseProductsResult<Product | undefined> {
  return { data: getFeaturedProducts()[0], loading: false }
}

export function useFeaturedProducts(): UseProductsResult<Product[]> {
  return { data: getFeaturedProducts(), loading: false }
}

export function useProductBySlug(slug: string | undefined): UseProductsResult<Product | undefined> {
  return { data: slug ? getProductBySlug(slug) : undefined, loading: false }
}
