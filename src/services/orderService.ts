import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { BasketItem } from '../types/product'
import type { Order, OrderStatus } from '../types/order'

const ORDERS_COLLECTION = 'orders'

interface CreateOrderParams {
  userId: string
  userEmail: string
  userName: string
  customerName: string
  customerEmail: string
  customerPhone: string
  items: BasketItem[]
  notes: string
  totalSum: number
}

export async function createOrder(params: CreateOrderParams): Promise<string> {
  const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
    ...params,
    status: 'ny' as OrderStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function getUserOrders(userId: string): Promise<Order[]> {
  const q = query(
    collection(db, ORDERS_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order))
}

export async function getAllOrders(): Promise<Order[]> {
  const q = query(
    collection(db, ORDERS_COLLECTION),
    orderBy('createdAt', 'desc'),
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order))
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const ref = doc(db, ORDERS_COLLECTION, orderId)
  await updateDoc(ref, { status, updatedAt: serverTimestamp() })
}
