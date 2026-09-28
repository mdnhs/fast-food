"use client"

import { useLayoutEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"

import { gsap } from "@/lib/gsap"

const BurgerExperience = dynamic(
  () => import("@/components/3d/burger-experience"),
  { ssr: false }
)

export function SceneContainer() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(true)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(wrapperRef.current, {
        autoAlpha: 0,
        ease: "none",
        scrollTrigger: {
          trigger: "#exploded-section",
          // The reassemble spacer ends at "bottom 150%"; the gap absorbs its scrub lag so the fade starts on a closed burger.
          start: "bottom 120%",
          end: "bottom bottom",
          scrub: true,
          onLeave: () => setActive(false),
          onEnterBack: () => setActive(true),
          onRefresh: (self) => setActive(self.progress < 1),
        },
      })
    })
    return () => ctx.revert()
  }, [])

  return (
    <div
      ref={wrapperRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
    >
      <div className="absolute top-1/2 left-1/2 size-96 -translate-1/2 rounded-full bg-radial from-primary/25 to-transparent to-70% blur-3xl md:size-160" />
      <BurgerExperience active={active} />
    </div>
  )
}
