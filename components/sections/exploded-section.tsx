"use client"

import { useRef, useState } from "react"
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  type MotionValue,
} from "framer-motion"

import { CountUp } from "@/components/common/count-up"
import { GlassCard } from "@/components/common/glass-card"
import {
  INGREDIENT_CALLOUTS,
  type IngredientCallout,
} from "@/lib/burger-layers"
import { burgerStore } from "@/lib/burger-store"
import { cn } from "@/lib/utils"

const stepId = (index: number) => `layer-step-${index + 1}`
const pad = (n: number) => String(n).padStart(2, "0")

function LeaderLine({ onRight }: { onRight: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        "absolute top-1/2 hidden h-3 w-16 -translate-y-1/2 items-center text-primary lg:flex xl:w-24",
        onRight ? "right-full -scale-x-100" : "left-full"
      )}
    >
      <svg
        viewBox="0 0 100 2"
        preserveAspectRatio="none"
        className="h-0.5 flex-1 overflow-visible"
      >
        <motion.line
          x1="0"
          y1="1"
          x2="100"
          y2="1"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 0.7 }}
          viewport={{ amount: 0.6 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
        />
      </svg>
      <motion.span
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ amount: 0.6 }}
        transition={{ duration: 0.3, delay: 0.9 }}
        className="relative flex size-3 shrink-0"
      >
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/60 motion-reduce:animate-none" />
        <span className="relative size-3 rounded-full bg-primary" />
      </motion.span>
    </div>
  )
}

function StepRail({
  active,
  progress,
}: {
  active: number
  progress: MotionValue<number>
}) {
  const reducedMotion = useReducedMotion()

  function goTo(index: number) {
    document.getElementById(stepId(index))?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "center",
    })
  }

  return (
    <nav
      aria-label="Burger layers"
      className="pointer-events-auto liquid-glass flex items-center gap-3 rounded-full px-4 py-2"
    >
      <div className="relative flex items-center gap-6 sm:gap-10">
        <div className="absolute inset-x-3 top-1/2 h-px -translate-y-1/2 bg-white/15" />
        <motion.div
          style={{ scaleX: progress }}
          className="absolute inset-x-3 top-1/2 h-px origin-left -translate-y-1/2 bg-primary"
        />
        {INGREDIENT_CALLOUTS.map((callout, index) => {
          const isActive = index === active
          return (
            <button
              key={callout.title}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Go to ${callout.eyebrow}`}
              aria-current={isActive ? "step" : undefined}
              className={cn(
                "relative flex size-7 items-center justify-center rounded-full border text-xs font-semibold transition-all duration-300 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                isActive
                  ? "scale-110 border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/40"
                  : index < active
                    ? "border-primary/60 bg-background text-primary"
                    : "border-white/20 bg-background text-muted-foreground hover:border-primary/50"
              )}
            >
              {pad(index + 1)}
            </button>
          )
        })}
      </div>
      <span
        aria-live="polite"
        className="hidden min-w-24 text-xs font-medium text-muted-foreground sm:block"
      >
        {INGREDIENT_CALLOUTS[active].title}
      </span>
    </nav>
  )
}

export function ExplodedSection() {
  const stepsRef = useRef<HTMLOListElement>(null)
  const [active, setActive] = useState(0)
  const { scrollYProgress } = useScroll({
    target: stepsRef,
    offset: ["start center", "end center"],
  })
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24 })

  function activate(callout: IngredientCallout, index: number) {
    burgerStore.activeLayers = callout.layers
    setActive(index)
  }

  function deactivate(callout: IngredientCallout) {
    if (burgerStore.activeLayers === callout.layers)
      burgerStore.activeLayers = []
  }

  return (
    <section
      id="exploded-section"
      aria-labelledby="exploded-heading"
      className="relative overflow-x-clip px-4"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex min-h-svh flex-col justify-end gap-4 pb-24 lg:grid lg:grid-cols-3 lg:items-center lg:pb-0">
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold tracking-widest text-primary uppercase">
              Anatomy of a legend
            </p>
            <h2
              id="exploded-heading"
              className="font-heading text-4xl font-extrabold tracking-tight text-balance sm:text-5xl xl:text-6xl"
            >
              Seven layers. Zero shortcuts.
            </h2>
          </div>
          <p className="max-w-sm text-muted-foreground sm:text-lg lg:col-start-3 lg:justify-self-end lg:text-right">
            Keep scrolling to take our signature stack apart, one ingredient at
            a time.
          </p>
        </div>

        <div className="relative">
          {/* Spans the steps and closing spacer so the rail sticks until the section ends. */}
          <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center">
            <div className="sticky bottom-4 mt-auto lg:bottom-6">
              <StepRail active={active} progress={progress} />
            </div>
          </div>

          <ol ref={stepsRef}>
            {INGREDIENT_CALLOUTS.map((callout, index) => {
              const onRight = index % 2 === 1
              return (
                <motion.li
                  key={callout.title}
                  id={stepId(index)}
                  viewport={{ amount: 0.6 }}
                  onViewportEnter={() => activate(callout, index)}
                  onViewportLeave={() => deactivate(callout)}
                  className={cn(
                    "flex min-h-svh items-end pb-20 lg:items-center lg:pb-0",
                    onRight && "lg:justify-end"
                  )}
                >
                  <motion.div
                    initial={{ opacity: 0, x: onRight ? 40 : -40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ amount: 0.6 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="relative w-full lg:max-w-sm"
                  >
                    <LeaderLine onRight={onRight} />
                    <GlassCard className="flex flex-col gap-3 p-6 sm:p-8">
                      <div className="flex items-center justify-between gap-4 text-xs font-medium tracking-widest text-primary uppercase">
                        <span>{callout.eyebrow}</span>
                        <span className="text-muted-foreground" aria-hidden>
                          {pad(index + 1)}/{pad(INGREDIENT_CALLOUTS.length)}
                        </span>
                      </div>
                      <h3 className="font-heading text-2xl font-bold sm:text-3xl">
                        {callout.title}
                      </h3>
                      <p className="text-sm text-pretty text-muted-foreground sm:text-base">
                        {callout.description}
                      </p>
                      <div className="mt-2 flex items-end gap-4 border-t border-white/10 pt-4">
                        <p className="flex items-baseline gap-1.5">
                          <CountUp
                            value={callout.stat.value}
                            className="font-heading text-5xl leading-none font-extrabold text-primary"
                          />
                          <span className="font-heading text-lg font-bold text-primary/80">
                            {callout.stat.unit}
                          </span>
                        </p>
                        <p className="pb-1 text-xs tracking-widest text-muted-foreground uppercase">
                          {callout.stat.label}
                        </p>
                      </div>
                    </GlassCard>
                  </motion.div>
                </motion.li>
              )
            })}
          </ol>
          {/* Room after the last callout for the burger to close and fade before the menu enters. */}
          <div data-reassemble aria-hidden className="h-svh" />
        </div>
      </div>
    </section>
  )
}
