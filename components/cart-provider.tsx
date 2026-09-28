"use client"

import { createContext, use, useCallback, useMemo, useState } from "react"

type CartContextValue = {
  items: ReadonlySet<string>
  toggle: (id: string) => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ReadonlySet<string>>(() => new Set())

  const toggle = useCallback((id: string) => {
    setItems((current) => {
      const next = new Set(current)
      if (!next.delete(id)) next.add(id)
      return next
    })
  }, [])

  const value = useMemo(() => ({ items, toggle }), [items, toggle])

  return <CartContext value={value}>{children}</CartContext>
}

export function useCart() {
  const context = use(CartContext)
  if (!context) throw new Error("useCart must be used within CartProvider")
  return context
}
