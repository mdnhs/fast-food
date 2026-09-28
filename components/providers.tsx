"use client"

import { MotionConfig } from "framer-motion"

import { CartProvider } from "@/components/cart-provider"
import { ThemeProvider } from "@/components/theme-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider forcedTheme="dark">
      <MotionConfig reducedMotion="user">
        <CartProvider>{children}</CartProvider>
      </MotionConfig>
    </ThemeProvider>
  )
}
