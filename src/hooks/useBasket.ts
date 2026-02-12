import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import type { BasketItem } from '../types/product'

export function useBasket() {
  const [items, setItems] = useLocalStorage<BasketItem[]>('minio_basket', [])
  const [notes, setNotes] = useLocalStorage<string>('minio_basket_notes', '')

  const addItem = useCallback((item: Omit<BasketItem, 'id' | 'quantity'>) => {
    setItems(prev => [...prev, { ...item, id: Date.now(), quantity: 1 }])
  }, [setItems])

  const removeItem = useCallback((itemId: number) => {
    setItems(prev => prev.filter(item => item.id !== itemId))
  }, [setItems])

  const updateQuantity = useCallback((itemId: number, quantity: number) => {
    if (quantity < 1) return
    setItems(prev => prev.map(item => item.id === itemId ? { ...item, quantity } : item))
  }, [setItems])

  const clearBasket = useCallback(() => {
    setItems([])
    setNotes('')
  }, [setItems, setNotes])

  const totalItems = items.length

  return { items, notes, setNotes, addItem, removeItem, updateQuantity, clearBasket, totalItems }
}
