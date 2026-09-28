"use client"

import { useRef, useState } from "react"
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
  type TargetAndTransition,
  type Variants,
} from "framer-motion"
import { Flame, Sparkles, Zap } from "lucide-react"

import { CountUp } from "@/components/common/count-up"
import { GlassCard } from "@/components/common/glass-card"
import { cn } from "@/lib/utils"

const PILLARS = [
  {
    icon: Flame,
    title: "Farm to Flame",
    description:
      "Grass-fed beef from three partner ranches, delivered chilled every morning and seared over binchotan-style charcoal.",
    stat: { value: 3, prefix: "", suffix: " partner ranches" },
    idle: {
      scale: [1, 1.12, 0.95, 1.08, 1],
      rotate: [0, -4, 3, -2, 0],
      transition: { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
    },
  },
  {
    icon: Sparkles,
    title: "Secret Glaze Recipe",
    description:
      "A smoky-sweet glaze of black garlic, bourbon and burnt honey, reduced for six hours and brushed on at the last second.",
    stat: { value: 6, prefix: "", suffix: "-hour reduction" },
    idle: {
      scale: [1, 1.15, 1],
      rotate: [0, 15, -10, 0],
      opacity: [1, 0.6, 1],
      transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
    },
  },
  {
    icon: Zap,
    title: "Lightning Fast Dispatch",
    description:
      "Insulated, vented packaging and riders within a 4 km radius keep your burger crisp, hot and on your doorstep fast.",
    stat: { value: 18, prefix: "~", suffix: " min average" },
    idle: {
      opacity: [1, 0.3, 1, 1],
      scale: [1, 1, 1.15, 1],
      transition: {
        duration: 1.2,
        repeat: Infinity,
        repeatDelay: 0.8,
        ease: "easeOut",
      },
    },
  },
] satisfies {
  icon: typeof Flame
  title: string
  description: string
  stat: { value: number; prefix: string; suffix: string }
  idle: TargetAndTransition
}[]

const LAST_STEP = PILLARS.length - 1

const list: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
}

const card: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
}

// Mobile links each node to the next one below it, so the line stops at the last node instead of the list's end.
function MobileSegment({
  index,
  progress,
}: {
  index: number
  progress: MotionValue<number>
}) {
  const fill = useTransform(
    progress,
    [index / LAST_STEP, (index + 1) / LAST_STEP],
    [0, 1]
  )
  return (
    <span
      aria-hidden
      className="absolute top-10 -bottom-6 -left-9 w-px bg-white/10 md:hidden"
    >
      <motion.span
        style={{ scaleY: fill }}
        className="block size-full origin-top bg-primary"
      />
    </span>
  )
}

export function CraftSection() {
  const timelineRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()
  const [reached, setReached] = useState(-1)
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start 75%", "end 90%"],
  })
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24 })

  useMotionValueEvent(progress, "change", (p) => {
    setReached(
      p <= 0.01 ? -1 : Math.min(LAST_STEP, Math.floor(p * LAST_STEP + 0.05))
    )
  })

  return (
    <section
      id="craft"
      aria-labelledby="craft-heading"
      className="relative px-4 py-24 md:py-32"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-12">
        <div className="flex flex-col gap-4 md:max-w-xl">
          <p className="text-sm font-semibold tracking-widest text-primary uppercase">
            Craft &amp; freshness
          </p>
          <h2
            id="craft-heading"
            className="font-heading text-4xl font-extrabold tracking-tight text-balance sm:text-5xl"
          >
            Obsessive about the details you can taste.
          </h2>
        </div>

        <div ref={timelineRef} className="relative">
          <div
            aria-hidden
            className="absolute top-5 right-1/6 left-1/6 hidden h-px bg-white/10 md:block"
          >
            <motion.div
              style={{ scaleX: progress }}
              className="size-full origin-left bg-primary"
            />
          </div>

          <motion.ol
            variants={list}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            className="grid gap-6 pl-14 md:grid-cols-3 md:pt-16 md:pl-0"
          >
            {PILLARS.map((pillar, index) => {
              const isReached = index <= reached
              return (
                <motion.li
                  key={pillar.title}
                  variants={card}
                  className="relative"
                >
                  {index < LAST_STEP && (
                    <MobileSegment index={index} progress={progress} />
                  )}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute top-0 -left-14 flex size-10 items-center justify-center rounded-full border text-xs font-semibold transition-all duration-500 md:-top-16 md:left-1/2 md:-translate-x-1/2",
                      isReached
                        ? "scale-110 border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/40"
                        : "border-white/15 bg-background text-muted-foreground"
                    )}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <GlassCard
                    className={cn(
                      "flex h-full flex-col gap-4 p-8 transition-colors duration-500",
                      isReached && "border-primary/30"
                    )}
                  >
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                      <motion.span
                        className="flex"
                        whileInView={reducedMotion ? undefined : pillar.idle}
                        viewport={{ amount: 0.8 }}
                      >
                        <pillar.icon className="size-6" aria-hidden />
                      </motion.span>
                    </span>
                    <h3 className="font-heading text-2xl font-bold">
                      {pillar.title}
                    </h3>
                    <p className="flex-1 text-muted-foreground">
                      {pillar.description}
                    </p>
                    <p className="border-t border-white/10 pt-4 text-sm font-medium text-primary">
                      <CountUp
                        value={pillar.stat.value}
                        prefix={pillar.stat.prefix}
                        className="font-heading text-3xl font-extrabold"
                      />
                      {pillar.stat.suffix}
                    </p>
                  </GlassCard>
                </motion.li>
              )
            })}
          </motion.ol>
        </div>
      </div>
    </section>
  )
}
