"use client"

import { useState } from "react"
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "framer-motion"
import { Flame, Menu, ShoppingBag, X } from "lucide-react"

import { useCart } from "@/components/cart-provider"
import { buttonVariants } from "@/components/ui/button"
import { BRAND_NAME, NAV_LINKS } from "@/lib/site"
import { cn } from "@/lib/utils"

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { scrollY } = useScroll()
  const { items } = useCart()

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24))

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
      <nav
        aria-label="Main"
        className={cn(
          "liquid-glass mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-full py-2 pr-2 pl-5 transition-shadow duration-300",
          scrolled && "shadow-black/60"
        )}
      >
        <a
          href="#top"
          className="flex items-center gap-2 font-heading text-lg font-bold tracking-tight"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Flame className="size-4" aria-hidden />
          </span>
          {BRAND_NAME}
        </a>

        <ul className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <a
            href="#menu"
            aria-label={`Cart, ${items.size} ${items.size === 1 ? "item" : "items"}`}
            className="liquid-glass flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:border-primary/50"
          >
            <ShoppingBag className="size-4" aria-hidden />
            <AnimatePresence>
              {items.size > 0 && (
                <motion.span
                  key={items.size}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  aria-hidden
                  className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
                >
                  {items.size}
                </motion.span>
              )}
            </AnimatePresence>
          </a>
          <a
            href="#menu"
            className={cn(
              buttonVariants({ variant: "glow", size: "lg" }),
              "hidden rounded-full px-4 sm:inline-flex"
            )}
          >
            Order Now
          </a>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
            className="liquid-glass flex size-9 items-center justify-center rounded-full text-foreground md:hidden"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.ul
            id="mobile-nav"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="liquid-glass mx-auto mt-2 flex max-w-7xl flex-col rounded-3xl p-2 md:hidden"
          >
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-2xl px-4 py-3 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="p-2 sm:hidden">
              <a
                href="#menu"
                onClick={() => setOpen(false)}
                className={cn(
                  buttonVariants({ variant: "glow", size: "xl" }),
                  "w-full"
                )}
              >
                Order Now
              </a>
            </li>
          </motion.ul>
        )}
      </AnimatePresence>
    </header>
  )
}
