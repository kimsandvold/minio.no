import { useState, useEffect } from 'react'
import type { Product } from '../types/product'
import {
  fetchAllProducts,
  fetchRandomProducts,
  fetchFeaturedProduct,
  fetchProductBySlug,
} from '../data/products'

interface UseProductsResult<T> {
  data: T
  loading: boolean
}

export function useAllProducts(): UseProductsResult<Product[]> {
  const [data, setData] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllProducts().then(products => {
      setData(products)
      setLoading(false)
    })
  }, [])

  return { data, loading }
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
  const [data, setData] = useState<Product | undefined>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedProduct().then(product => {
      setData(product)
      setLoading(false)
    })
  }, [])

  return { data, loading }
}

export function useProductBySlug(slug: string | undefined): UseProductsResult<Product | undefined> {
  const [data, setData] = useState<Product | undefined>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) {
      setLoading(false)
      return
    }
    setLoading(true)
    fetchProductBySlug(slug).then(product => {
      setData(product)
      setLoading(false)
    })
  }, [slug])

  return { data, loading }
}
