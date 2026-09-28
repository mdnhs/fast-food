"use client"

import { useCallback, useEffect, useLayoutEffect, useRef } from "react"
import { useFrame, type ThreeEvent } from "@react-three/fiber"
import { useReducedMotion } from "framer-motion"
import * as THREE from "three"

import { GlbBurger } from "@/components/3d/glb-burger"
import { ModelErrorBoundary } from "@/components/3d/model-error-boundary"
import { ProceduralBurger } from "@/components/3d/procedural-burger"
import {
  LAYER_RIG,
  type LayerId,
  type LayerRefCallback,
} from "@/lib/burger-layers"
import { burgerStore } from "@/lib/burger-store"
import { gsap, ScrollTrigger } from "@/lib/gsap"

// Matches Tailwind's `lg`: below it the copy stacks above/below the burger instead of flanking it.
const STACKED_BREAKPOINT = 1024
const MOBILE_SCALE = 0.8
const BURGER_WIDTH = 3.3
const ASSEMBLED_HEIGHT = 2.8
const EXPLODED_HEIGHT = 5.6
const MAX_LAYER_DELAY = Math.max(...LAYER_RIG.map((layer) => layer.delay))
const HIGHLIGHT_PULL = 0.6
const AUTO_SPIN = 0.18
const DRAG_SENSITIVITY = 0.008
// Total tilt limit, so the drag can reach a straight top-down or bottom-up view like an orbit camera.
const MAX_TILT = Math.PI / 2
const PITCH_HOLD_MS = 4000
const SCROLL_SPIN = 0.0006

const { lerp, clamp, damp } = THREE.MathUtils
const easeOut = (t: number) => 1 - (1 - t) * (1 - t)

export function BurgerModel() {
  const rigRef = useRef<THREE.Group>(null)
  const floatRef = useRef<THREE.Group>(null)
  const layers = useRef<
    Partial<Record<LayerId, { node: THREE.Object3D; baseY: number }>>
  >({})
  const progress = useRef({ intro: 0, explode: 0, close: 0 })
  const highlights = useRef<Partial<Record<LayerId, number>>>({})
  const reducedMotion = useReducedMotion() ?? false
  const yaw = useRef(0)
  const drag = useRef({
    active: false,
    lastX: 0,
    lastY: 0,
    lastTime: 0,
    yawVelocity: 0,
    pitch: 0,
    baseTilt: 0.35,
    releasedAt: 0,
  })
  const scrollVelocity = useRef(0)
  const dragRef = useRef<THREE.Group>(null)
  const hitRef = useRef<THREE.Mesh>(null)

  const layerRef = useCallback<LayerRefCallback>(
    (id) => (node) => {
      // Stored on the object so a re-attach after the rig has moved it keeps the original height.
      if (node) {
        node.userData.baseY ??= node.position.y
        layers.current[id] = { node, baseY: node.userData.baseY }
      } else delete layers.current[id]
    },
    []
  )

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(progress.current, {
        explode: 1,
        ease: "none",
        scrollTrigger: {
          trigger: "#exploded-section",
          start: "top bottom",
          end: "top top",
          scrub: reducedMotion ? true : 1.2,
        },
      })

      gsap.to(progress.current, {
        close: 1,
        ease: "none",
        scrollTrigger: {
          trigger: "[data-reassemble]",
          start: "top bottom",
          end: "top center",
          scrub: reducedMotion ? true : 1.2,
        },
      })

      if (reducedMotion) {
        progress.current.intro = 1
        return
      }
      ScrollTrigger.create({
        onUpdate: (self) => {
          scrollVelocity.current = self.getVelocity()
          // Scrolling hands the burger back to the scroll story, so a held tilt starts easing out.
          drag.current.releasedAt = 0
        },
      })
      gsap.to(progress.current, { intro: 1, duration: 1.8, ease: "expo.out" })
    })
    return () => ctx.revert()
  }, [reducedMotion])

  useEffect(() => {
    const state = drag.current
    const onMove = (event: PointerEvent) => {
      if (!state.active) return
      const dx = event.clientX - state.lastX
      const dy = event.clientY - state.lastY
      const dt = Math.max(event.timeStamp - state.lastTime, 1) / 1000
      state.lastX = event.clientX
      state.lastY = event.clientY
      state.lastTime = event.timeStamp
      yaw.current += dx * DRAG_SENSITIVITY
      state.yawVelocity = clamp((dx * DRAG_SENSITIVITY) / dt, -12, 12)
      state.pitch = clamp(
        state.pitch + dy * DRAG_SENSITIVITY,
        -MAX_TILT - state.baseTilt,
        MAX_TILT - state.baseTilt
      )
    }
    const onUp = () => {
      if (!state.active) return
      state.active = false
      state.releasedAt = performance.now()
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)
    return () => {
      onUp()
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
    }
  }, [])

  // Touch drags are left to the page so swiping over the burger still scrolls.
  const onPointerDown = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (event.pointerType === "touch" || event.button !== 0) return
    const target = event.nativeEvent.target as Element | null
    if (target?.closest("a, button, input, textarea, select, label")) return
    event.stopPropagation()
    Object.assign(drag.current, {
      active: true,
      lastX: event.clientX,
      lastY: event.clientY,
      lastTime: event.nativeEvent.timeStamp,
      yawVelocity: 0,
    })
    document.body.style.cursor = "grabbing"
    document.body.style.userSelect = "none"
  }, [])

  const onPointerOver = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (event.pointerType === "touch" || drag.current.active) return
    document.body.style.cursor = "grab"
  }, [])

  const onPointerOut = useCallback(() => {
    if (!drag.current.active) document.body.style.cursor = ""
  }, [])

  useFrame((state, delta) => {
    const rig = rigRef.current
    const float = floatRef.current
    const dragGroup = dragRef.current
    const hit = hitRef.current
    if (!rig || !float || !dragGroup || !hit) return

    const { intro, explode, close } = progress.current
    // Placement follows `explode` only, so the burger closes in place instead of sliding back to the hero spot.
    const spread = explode * (1 - close)
    const { width, height } = state.viewport
    const isStacked = state.size.width < STACKED_BREAKPOINT

    // Side-by-side layouts keep the burger inside the middle third so it never covers the flanking copy.
    const centreFit = (width * 0.37) / BURGER_WIDTH
    const heroScale = isStacked
      ? Math.min(1.2 * MOBILE_SCALE, (width * 0.85) / BURGER_WIDTH)
      : Math.min(1.5, centreFit, (height * 0.6) / ASSEMBLED_HEIGHT)
    const explodedScale = isStacked
      ? Math.min(0.92 * MOBILE_SCALE, (height * 0.5) / EXPLODED_HEIGHT)
      : Math.min(1.1, centreFit, (height * 0.85) / EXPLODED_HEIGHT)

    // Stacked layouts keep the burger below the hero copy, then above the callout cards once exploded.
    const heroY = isStacked ? -height * 0.33 : -0.15
    const explodedY = isStacked ? height * 0.14 : -0.15

    rig.position.y = lerp(heroY, explodedY, explode) - (1 - intro) * 1.5
    rig.scale.setScalar(
      lerp(heroScale, explodedScale, explode) * lerp(0.6, 1, intro)
    )
    const d = drag.current
    d.baseTilt = lerp(0.35, 0.22, explode)
    rig.rotation.x = d.baseTilt
    rig.rotation.y = (1 - intro) * -Math.PI

    if (!d.active) {
      yaw.current += d.yawVelocity * delta
      d.yawVelocity = damp(d.yawVelocity, 0, 2.5, delta)
      if (performance.now() - d.releasedAt > PITCH_HOLD_MS)
        d.pitch = damp(d.pitch, 0, 1.5, delta)
    }
    dragGroup.rotation.x = d.pitch
    hit.scale.y = lerp(ASSEMBLED_HEIGHT, EXPLODED_HEIGHT, spread)

    let scrollTurn = 0
    if (!reducedMotion) {
      scrollTurn = (explode + close) * Math.PI * 2
      scrollVelocity.current = damp(scrollVelocity.current, 0, 4, delta)
      const velocity = clamp(scrollVelocity.current, -3000, 3000)
      yaw.current += delta * (AUTO_SPIN + velocity * SCROLL_SPIN)
      dragGroup.rotation.z = damp(
        dragGroup.rotation.z,
        velocity * -0.00008,
        4,
        delta
      )
      float.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.08
      float.rotation.x = damp(
        float.rotation.x,
        -state.pointer.y * 0.12,
        3,
        delta
      )
      float.rotation.z = damp(
        float.rotation.z,
        state.pointer.x * 0.08,
        3,
        delta
      )
    }

    // Layers live inside the spinning float group, so the pull is counter-rotated to always point at the camera.
    float.rotation.y = yaw.current + scrollTurn
    const spin = float.rotation.y
    for (const layer of LAYER_RIG) {
      const entry = layers.current[layer.id]
      if (!entry) continue
      const { node, baseY } = entry
      const local = easeOut(
        clamp((spread - layer.delay) / (1 - MAX_LAYER_DELAY), 0, 1)
      )
      const isActive = burgerStore.activeLayers.includes(layer.id)
      const highlight = damp(
        highlights.current[layer.id] ?? 0,
        isActive ? spread : 0,
        5,
        delta
      )
      highlights.current[layer.id] = highlight

      node.position.set(
        -Math.sin(spin) * highlight * HIGHLIGHT_PULL,
        baseY + (layer.explodedY - layer.assembledY) * local,
        Math.cos(spin) * highlight * HIGHLIGHT_PULL
      )
      node.scale.setScalar(1 + highlight * 0.08)

      if (layer.explodedRotation) {
        node.rotation.x = layer.explodedRotation.x * local
        node.rotation.z = layer.explodedRotation.z * local
      }
    }
  })

  return (
    <group ref={rigRef}>
      <group ref={dragRef}>
        {/* Cheaper to raycast than the GLB, and still catches the gaps between exploded layers. */}
        <mesh
          ref={hitRef}
          position-y={-0.3}
          onPointerDown={onPointerDown}
          onPointerOver={onPointerOver}
          onPointerOut={onPointerOut}
        >
          <cylinderGeometry
            args={[BURGER_WIDTH / 2, BURGER_WIDTH / 2, 1, 24]}
          />
          <meshBasicMaterial visible={false} />
        </mesh>
        <group ref={floatRef}>
          <ModelErrorBoundary
            fallback={<ProceduralBurger layerRef={layerRef} />}
          >
            <GlbBurger layerRef={layerRef} />
          </ModelErrorBoundary>
        </group>
      </group>
    </group>
  )
}
