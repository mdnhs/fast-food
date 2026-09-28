"use client"

import { Suspense } from "react"
import { Environment, Lightformer, Preload } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import {
  Bloom,
  EffectComposer,
  N8AO,
  SMAA,
  ToneMapping,
} from "@react-three/postprocessing"
import { ToneMappingMode } from "postprocessing"

import { BurgerModel } from "@/components/3d/burger-model"
import { CanvasLoader } from "@/components/3d/canvas-loader"

export default function BurgerExperience({ active }: { active: boolean }) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 11], fov: 35 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      // The canvas is pointer-events-none, so pointer tracking listens on the body instead.
      eventSource={document.body}
      eventPrefix="client"
    >
      <Suspense fallback={<CanvasLoader />}>
        <ambientLight intensity={0.35} />
        <directionalLight
          position={[4, 6, 5]}
          intensity={2.4}
          color="#ffd9a0"
        />
        <directionalLight
          position={[-5, 2, -4]}
          intensity={1.6}
          color="#ff9f0a"
        />
        <pointLight
          position={[0, -3, 3]}
          intensity={8}
          distance={10}
          color="#ff7a00"
        />

        <BurgerModel />

        <Environment resolution={256}>
          <Lightformer
            form="rect"
            intensity={2}
            position={[0, 5, -2]}
            rotation-x={Math.PI / 2}
            scale={[10, 3, 1]}
          />
          <Lightformer
            form="rect"
            intensity={1.5}
            color="#ffb347"
            position={[-5, 1, 1]}
            rotation-y={Math.PI / 2}
            scale={[6, 2, 1]}
          />
          <Lightformer
            form="ring"
            intensity={1}
            color="#ff9f0a"
            position={[5, 2, 2]}
            rotation-y={-Math.PI / 2}
            scale={3}
          />
        </Environment>
        <EffectComposer multisampling={0}>
          <N8AO halfRes aoRadius={0.6} intensity={2.2} distanceFalloff={0.6} />
          <Bloom
            mipmapBlur
            luminanceThreshold={0.85}
            intensity={0.35}
            radius={0.6}
          />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <SMAA />
        </EffectComposer>
        <Preload all />
      </Suspense>
    </Canvas>
  )
}
