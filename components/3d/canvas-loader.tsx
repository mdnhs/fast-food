"use client"

import { Html, useProgress } from "@react-three/drei"

export function CanvasLoader() {
  const { progress } = useProgress()

  return (
    <Html center>
      <div
        role="status"
        className="flex flex-col items-center gap-3 text-xs font-medium tracking-widest text-muted-foreground uppercase"
      >
        <span className="size-10 animate-spin rounded-full border-2 border-white/10 border-t-primary" />
        Firing up the grill {Math.round(progress)}%
      </div>
    </Html>
  )
}
