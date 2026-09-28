"use client"

import { useEffect, useRef } from "react"
import { animate, useInView, useReducedMotion } from "framer-motion"

import { cn } from "@/lib/utils"

type CountUpProps = {
  value: number
  decimals?: number
  prefix?: string
  suffix?: string
  duration?: number
  delay?: number
  className?: string
}

function formatCount(
  n: number,
  decimals: number,
  prefix: string,
  suffix: string
) {
  return `${prefix}${n.toFixed(decimals)}${suffix}`
}

export function CountUp({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 1.6,
  delay = 0,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const reducedMotion = useReducedMotion()
  const format = (n: number) => formatCount(n, decimals, prefix, suffix)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (reducedMotion) {
      node.textContent = formatCount(value, decimals, prefix, suffix)
      return
    }
    if (!inView) return
    // Writes straight to the DOM so a running count doesn't re-render the parent every frame.
    const controls = animate(0, value, {
      duration,
      delay,
      ease: "easeOut",
      onUpdate: (n) => {
        node.textContent = formatCount(n, decimals, prefix, suffix)
      },
    })
    return () => controls.stop()
  }, [inView, reducedMotion, value, decimals, prefix, suffix, duration, delay])

  return (
    <span className={cn("tabular-nums", className)}>
      <span ref={ref} aria-hidden>
        {format(0)}
      </span>
      <span className="sr-only">{format(value)}</span>
    </span>
  )
}
