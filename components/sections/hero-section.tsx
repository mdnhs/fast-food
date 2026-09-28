"use client"

import { motion, useReducedMotion, type Variants } from "framer-motion"
import { Sparkles, Star, Timer } from "lucide-react"

import { CountUp } from "@/components/common/count-up"

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
}

// Lets the stat pills finish sliding in before their numbers start counting.
const STAT_DELAY = 0.8
const RATING = 4.9
const MAX_RATING = 5

function DeliveryTimer() {
  const reducedMotion = useReducedMotion()
  return (
    <li className="liquid-glass inline-flex items-center gap-3 rounded-full py-2 pr-5 pl-2">
      <span className="liquid-glass relative flex size-9 items-center justify-center rounded-full liquid-glass-tint text-primary">
        <svg
          aria-hidden
          viewBox="0 0 36 36"
          className="absolute inset-0 size-full -rotate-90"
        >
          <motion.circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ pathLength: reducedMotion ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: reducedMotion ? 0 : 1.8,
              delay: STAT_DELAY,
              ease: "easeInOut",
            }}
          />
        </svg>
        <Timer className="size-4" aria-hidden />
      </span>
      <span className="flex flex-col text-sm leading-tight">
        <CountUp
          value={18}
          prefix="~"
          suffix=" min"
          delay={STAT_DELAY}
          className="font-semibold"
        />
        <span className="text-xs text-muted-foreground">Delivered in</span>
      </span>
    </li>
  )
}

function StarRating() {
  const reducedMotion = useReducedMotion()
  const stars = Array.from({ length: MAX_RATING }, (_, i) => (
    <Star key={i} className="size-3.5 shrink-0 fill-current" />
  ))
  return (
    <li className="liquid-glass inline-flex items-center gap-3 rounded-full py-2 pr-5 pl-3">
      {/* Grey stars underneath, primary stars clipped to the rating on top. */}
      <span aria-hidden className="relative flex">
        <span className="flex gap-0.5 text-white/20">{stars}</span>
        <motion.span
          className="absolute inset-y-0 left-0 flex gap-0.5 overflow-hidden text-primary"
          initial={{
            width: reducedMotion ? `${(RATING / MAX_RATING) * 100}%` : 0,
          }}
          animate={{ width: `${(RATING / MAX_RATING) * 100}%` }}
          transition={{
            duration: reducedMotion ? 0 : 1.4,
            delay: STAT_DELAY,
            ease: "easeOut",
          }}
        >
          {stars}
        </motion.span>
      </span>
      <span className="flex flex-col text-sm leading-tight">
        <span className="font-semibold">
          <CountUp value={RATING} decimals={1} delay={STAT_DELAY} /> /{" "}
          {MAX_RATING}
        </span>
        <span className="text-xs text-muted-foreground">
          <CountUp value={12} suffix="k" delay={STAT_DELAY} /> reviews
        </span>
      </span>
    </li>
  )
}

export function HeroSection() {
  return (
    <section
      id="top"
      className="relative flex min-h-svh items-start px-4 pt-28 pb-16 lg:items-center lg:pt-24"
    >
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-3 lg:items-center"
      >
        <div className="flex flex-col items-start gap-5 lg:gap-6">
          <motion.span
            variants={item}
            className="liquid-glass inline-flex items-center gap-2 rounded-full liquid-glass-tint px-3 py-1 text-xs font-medium text-primary"
          >
            <Sparkles className="size-3.5" aria-hidden />
            New · Smoked Cheddar Wagyu Stack
          </motion.span>

          <motion.h1
            variants={item}
            className="font-heading text-5xl leading-none font-extrabold tracking-tight text-balance sm:text-6xl xl:text-7xl"
          >
            Bite into{" "}
            <span className="bg-linear-to-r from-ember via-amber-glow to-orange-500 bg-clip-text text-transparent">
              Perfection
            </span>
          </motion.h1>

          <motion.p
            variants={item}
            className="max-w-sm text-base text-pretty text-muted-foreground sm:text-lg"
          >
            Wagyu patties seared over open flame, stacked on toasted brioche and
            delivered to your door while the cheese is still melting.
          </motion.p>
        </div>

        <div aria-hidden className="hidden lg:block" />

        <div className="flex flex-col items-start gap-4 lg:items-end">
          <motion.ul
            variants={item}
            className="flex flex-wrap gap-3 lg:flex-col lg:items-end"
          >
            <li className="liquid-glass flex flex-col rounded-3xl px-5 py-4 lg:items-end">
              <span className="text-xs tracking-widest text-muted-foreground uppercase">
                Starting from
              </span>
              <CountUp
                value={12.9}
                decimals={2}
                prefix="$"
                delay={STAT_DELAY}
                className="font-heading text-3xl font-extrabold text-primary"
              />
            </li>
            <DeliveryTimer />
            <StarRating />
          </motion.ul>

          <motion.div
            variants={item}
            className="flex flex-wrap items-center gap-3 lg:justify-end"
          >
            <a
              href="#exploded-section"
              className="liquid-glass inline-flex h-12 items-center rounded-full px-6 text-base font-medium transition-colors outline-none hover:bg-white/10 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              See the layers
            </a>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}
