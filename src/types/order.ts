import type { Timestamp } from 'firebase/firestore'
import type { BasketItem } from './product'

export type OrderStatus = 'ny' | 'bekreftet' | 'under_arbeid' | 'ferdig' | 'kansellert'

export const orderStatusLabels: Record<OrderStatus, string> = {
  ny: 'Ny',
  bekreftet: 'Bekreftet',
  under_arbeid: 'Under arbeid',
  ferdig: 'Ferdig',
  kansellert: 'Kansellert',
}

export const orderStatusColors: Record<OrderStatus, string> = {
  ny: '#2196f3',
  bekreftet: '#ff9800',
  under_arbeid: '#9c27b0',
  ferdig: '#4caf50',
  kansellert: '#f44336',
}

export interface Order {
  id: string
  userId: string
  userEmail: string
  userName: string
  customerName: string
  customerEmail: string
  customerPhone: string
  items: BasketItem[]
  notes: string
  totalSum: number
  status: OrderStatus
  createdAt: Timestamp
  updatedAt: Timestamp
}
