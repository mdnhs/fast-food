import {
  Beef,
  CupSoda,
  Drumstick,
  Flame,
  Leaf,
  Sandwich,
  type LucideIcon,
} from "lucide-react"

export type MenuItem = {
  id: string
  name: string
  description: string
  price: number
  calories: number
  spiceLevel: 0 | 1 | 2 | 3
  icon: LucideIcon
  tag?: string
}

export const MAX_SPICE_LEVEL = 3

export const MENU_ITEMS: MenuItem[] = [
  {
    id: "ember-classic",
    name: "The Ember Classic",
    description:
      "Wagyu patty, aged cheddar, heirloom tomato, pickles, house sauce.",
    price: 12.9,
    calories: 780,
    spiceLevel: 1,
    icon: Sandwich,
    tag: "Bestseller",
  },
  {
    id: "smoked-cheddar-wagyu",
    name: "Smoked Cheddar Wagyu",
    description: "Double Wagyu, applewood-smoked cheddar, onion jam, brioche.",
    price: 16.5,
    calories: 920,
    spiceLevel: 0,
    icon: Beef,
    tag: "New",
  },
  {
    id: "inferno-stack",
    name: "Inferno Stack",
    description:
      "Ghost-pepper jack, charred jalapeños, chipotle glaze, crispy onions.",
    price: 14.9,
    calories: 860,
    spiceLevel: 3,
    icon: Flame,
  },
  {
    id: "nashville-hot",
    name: "Nashville Hot Chicken",
    description:
      "Buttermilk-fried thigh, cayenne oil, slaw, bread & butter pickles.",
    price: 13.5,
    calories: 740,
    spiceLevel: 2,
    icon: Drumstick,
  },
  {
    id: "garden-smash",
    name: "Garden Smash",
    description:
      "Plant-based smash patty, vegan cheddar, butter lettuce, tomato.",
    price: 12.5,
    calories: 610,
    spiceLevel: 1,
    icon: Leaf,
    tag: "Plant-based",
  },
  {
    id: "salted-caramel-shake",
    name: "Salted Caramel Shake",
    description: "Hand-spun vanilla custard, burnt caramel, flaky sea salt.",
    price: 6.9,
    calories: 540,
    spiceLevel: 0,
    icon: CupSoda,
  },
]
