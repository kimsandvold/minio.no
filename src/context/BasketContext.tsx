import { createContext, useContext, type ReactNode } from 'react'
import { useBasket } from '../hooks/useBasket'
import type { BasketItem } from '../types/product'

interface BasketContextType {
  items: BasketItem[]
  notes: string
  setNotes: (notes: string) => void
  addItem: (item: Omit<BasketItem, 'id' | 'quantity'>, quantity?: number) => void
  removeItem: (itemId: number) => void
  updateQuantity: (itemId: number, quantity: number) => void
  clearBasket: () => void
  totalItems: number
}

const BasketContext = createContext<BasketContextType | null>(null)

export function BasketProvider({ children }: { children: ReactNode }) {
  const basket = useBasket()
  return <BasketContext.Provider value={basket}>{children}</BasketContext.Provider>
}

export function useBasketContext(): BasketContextType {
  const ctx = useContext(BasketContext)
  if (!ctx) throw new Error('useBasketContext must be used within BasketProvider')
  return ctx
}
