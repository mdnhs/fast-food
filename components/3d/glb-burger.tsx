"use client"

import { useLayoutEffect } from "react"
import { useGLTF } from "@react-three/drei"

import { LAYER_RIG, type LayerRefCallback } from "@/lib/burger-layers"

// Built from public/3d/burger_realistic_free.glb by scripts/prepare-burger-model.mjs.
const MODEL_URL = "/models/burger.glb"

export function GlbBurger({ layerRef }: { layerRef: LayerRefCallback }) {
  const { scene } = useGLTF(MODEL_URL)

  useLayoutEffect(() => {
    const detach = LAYER_RIG.map(({ id }) => {
      const attach = layerRef(id)
      attach(scene.getObjectByName(id) ?? null)
      return () => attach(null)
    })
    return () => detach.forEach((fn) => fn())
  }, [scene, layerRef])

  return <primitive object={scene} />
}

useGLTF.preload(MODEL_URL)
