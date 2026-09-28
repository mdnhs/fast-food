import type { Object3D } from "three"

export type LayerId =
  | "bun_top"
  | "pickles"
  | "tomatoes"
  | "cheese"
  | "patty"
  | "lettuce"
  | "bun_bottom"

export type LayerRefCallback = (id: LayerId) => (node: Object3D | null) => void

// Layers move by (explodedY - assembledY) from wherever they start, so the GLB and procedural burgers share one rig.
type LayerRig = {
  id: LayerId
  assembledY: number
  explodedY: number
  explodedRotation?: { x: number; z: number }
  // Fraction of the explode timeline to wait before this layer starts moving.
  delay: number
}

export const LAYER_RIG: LayerRig[] = [
  {
    id: "bun_top",
    assembledY: 0.34,
    explodedY: 1.9,
    explodedRotation: { x: 0.15, z: -0.1 },
    delay: 0,
  },
  { id: "tomatoes", assembledY: 0.3, explodedY: 1.35, delay: 0.08 },
  { id: "pickles", assembledY: 0.22, explodedY: 0.75, delay: 0.14 },
  { id: "cheese", assembledY: 0.13, explodedY: 0.05, delay: 0.2 },
  { id: "patty", assembledY: -0.15, explodedY: -0.75, delay: 0.2 },
  { id: "lettuce", assembledY: -0.42, explodedY: -1.6, delay: 0.08 },
  { id: "bun_bottom", assembledY: -1, explodedY: -2.6, delay: 0 },
]

export type IngredientCallout = {
  layers: LayerId[]
  eyebrow: string
  title: string
  description: string
  stat: { value: number; unit: string; label: string }
}

export const INGREDIENT_CALLOUTS: IngredientCallout[] = [
  {
    layers: ["bun_top", "bun_bottom"],
    eyebrow: "Layer 01 · The Crown",
    title: "Toasted Brioche",
    description:
      "Butter-enriched brioche baked every morning, then kissed on the flat-top for a caramelised, crackle-edged crumb.",
    stat: { value: 5, unit: "am", label: "Baked fresh daily" },
  },
  {
    layers: ["tomatoes", "pickles"],
    eyebrow: "Layer 02 · The Crunch",
    title: "Organic Heirloom Tomatoes",
    description:
      "Vine-ripened heirlooms and house-brined dill pickles, sliced thick for a bright, acidic snap in every bite.",
    stat: { value: 80, unit: "km", label: "Max distance to farm" },
  },
  {
    layers: ["cheese"],
    eyebrow: "Layer 03 · The Melt",
    title: "Aged Smoked Cheddar",
    description:
      "Twelve-month cheddar cold-smoked over applewood, draped over the patty in the final seconds on the grill.",
    stat: { value: 12, unit: "months", label: "Cold-smoked & aged" },
  },
]
