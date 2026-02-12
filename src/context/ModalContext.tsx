import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Product } from '../types/product'

interface ModalContextType {
  productModal: Product | null
  openProductModal: (product: Product) => void
  closeProductModal: () => void
  newsletterOpen: boolean
  openNewsletter: () => void
  closeNewsletter: () => void
}

const ModalContext = createContext<ModalContextType | null>(null)

export function ModalProvider({ children }: { children: ReactNode }) {
  const [productModal, setProductModal] = useState<Product | null>(null)
  const [newsletterOpen, setNewsletterOpen] = useState(false)
  const openProductModal = useCallback((product: Product) => setProductModal(product), [])
  const closeProductModal = useCallback(() => setProductModal(null), [])
  const openNewsletter = useCallback(() => setNewsletterOpen(true), [])
  const closeNewsletter = useCallback(() => setNewsletterOpen(false), [])

  return (
    <ModalContext.Provider
      value={{
        productModal,
        openProductModal,
        closeProductModal,
        newsletterOpen,
        openNewsletter,
        closeNewsletter,
      }}
    >
      {children}
    </ModalContext.Provider>
  )
}

export function useModalContext(): ModalContextType {
  const ctx = useContext(ModalContext)
  if (!ctx) throw new Error('useModalContext must be used within ModalProvider')
  return ctx
}
