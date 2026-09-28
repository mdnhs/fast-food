"use client"

import { useState } from "react"
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion"
import { Check, Flame, Plus } from "lucide-react"

import { useCart } from "@/components/cart-provider"
import { CountUp } from "@/components/common/count-up"
import { GlassCard } from "@/components/common/glass-card"
import { MAX_SPICE_LEVEL, MENU_ITEMS, type MenuItem } from "@/lib/menu"
import { cn } from "@/lib/utils"

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

// Bars are scaled to the heaviest item so the menu reads as a comparison.
const MAX_CALORIES = Math.max(...MENU_ITEMS.map((item) => item.calories))

function CalorieBar({ calories }: { calories: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between text-xs text-muted-foreground">
        <span className="tracking-widest uppercase">Calories</span>
        <CountUp
          value={calories}
          suffix=" kcal"
          duration={1.2}
          className="font-semibold text-foreground"
        />
      </div>
      <div
        aria-hidden
        className="h-1.5 overflow-hidden rounded-full bg-white/10"
      >
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: calories / MAX_CALORIES }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="h-full origin-left rounded-full bg-linear-to-r from-amber-glow to-orange-500"
        />
      </div>
    </div>
  )
}

function SpiceLevel({ level }: { level: number }) {
  return (
    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <span className="tracking-widest uppercase">Spice</span>
      <span
        role="img"
        className="inline-flex items-center gap-0.5"
        aria-label={
          level === 0
            ? "Not spicy"
            : `Spice level ${level} of ${MAX_SPICE_LEVEL}`
        }
      >
        {Array.from({ length: MAX_SPICE_LEVEL }, (_, i) => (
          <span key={i} aria-hidden className="relative flex">
            <Flame className="size-3.5 text-white/20" />
            {i < level && (
              <motion.span
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true, amount: 0.8 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 12,
                  delay: 0.4 + i * 0.15,
                }}
                className="absolute inset-0 flex"
              >
                <Flame className="size-3.5 fill-orange-500 text-orange-500" />
              </motion.span>
            )}
          </span>
        ))}
      </span>
    </div>
  )
}

function MenuCard({ item }: { item: MenuItem }) {
  const { items, toggle } = useCart()
  const inCart = items.has(item.id)
  const reducedMotion = useReducedMotion()
  const pointerX = useMotionValue(0.5)
  const pointerY = useMotionValue(0.5)
  const rotateX = useSpring(useTransform(pointerY, [0, 1], [8, -8]), {
    stiffness: 200,
    damping: 20,
  })
  const rotateY = useSpring(useTransform(pointerX, [0, 1], [-8, 8]), {
    stiffness: 200,
    damping: 20,
  })
  const Icon = item.icon
  // Remounting the stats replays their animations when the card is hovered.
  const [replay, setReplay] = useState(0)

  function handlePointerMove(event: React.PointerEvent<HTMLElement>) {
    if (reducedMotion || event.pointerType !== "mouse") return
    const rect = event.currentTarget.getBoundingClientRect()
    pointerX.set((event.clientX - rect.left) / rect.width)
    pointerY.set((event.clientY - rect.top) / rect.height)
  }

  function resetTilt() {
    pointerX.set(0.5)
    pointerY.set(0.5)
  }

  return (
    <motion.li
      onPointerMove={handlePointerMove}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setReplay((n) => n + 1)
      }}
      onPointerLeave={resetTilt}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      className="group"
    >
      <GlassCard className="flex h-full flex-col gap-5 p-6 transition-colors group-hover:border-primary/30">
        <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-2xl bg-radial from-primary/30 via-primary/5 to-transparent">
          <Icon
            aria-hidden
            strokeWidth={1.25}
            className="size-20 text-primary transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6"
          />
          {item.tag && (
            <span className="absolute top-3 left-3 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-xs font-medium text-primary inset-shadow-2xs inset-shadow-white/30 backdrop-blur-md">
              {item.tag}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-heading text-xl font-bold">{item.name}</h3>
            <span className="font-heading text-lg font-bold text-primary">
              {priceFormatter.format(item.price)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{item.description}</p>
        </div>

        <div key={replay} className="flex flex-col gap-3">
          <CalorieBar calories={item.calories} />
          <SpiceLevel level={item.spiceLevel} />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            aria-pressed={inCart}
            aria-label={`Add ${item.name} to cart`}
            onClick={() => toggle(item.id)}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              inCart
                ? "border-primary bg-primary text-primary-foreground"
                : "border-white/15 bg-white/5 text-foreground hover:border-primary/50 hover:text-primary"
            )}
          >
            {inCart ? (
              <Check className="size-4" aria-hidden />
            ) : (
              <Plus className="size-4" aria-hidden />
            )}
            {inCart ? "Added" : "Add"}
          </button>
        </div>
      </GlassCard>
    </motion.li>
  )
}

export function MenuSection() {
  return (
    <section
      id="menu"
      aria-labelledby="menu-heading"
      className="relative px-4 py-24 md:py-32"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-12">
        <div className="flex flex-col gap-4 md:max-w-xl">
          <p className="text-sm font-semibold tracking-widest text-primary uppercase">
            Signature menu
          </p>
          <h2
            id="menu-heading"
            className="font-heading text-4xl font-extrabold tracking-tight text-balance sm:text-5xl"
          >
            Built to order, never held under a lamp.
          </h2>
          <p className="text-muted-foreground sm:text-lg">
            Tap to add. Everything is flame-grilled the moment you order.
          </p>
        </div>

        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {MENU_ITEMS.map((item) => (
            <MenuCard key={item.id} item={item} />
          ))}
        </ul>
      </div>
    </section>
  )
}
