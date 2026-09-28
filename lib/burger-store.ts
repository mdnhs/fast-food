import type { LayerId } from "@/lib/burger-layers"

// Read every frame inside useFrame, so it lives outside React state to avoid re-rendering the canvas.
export const burgerStore: { activeLayers: LayerId[] } = { activeLayers: [] }
