# Master Engineering Specification: Modern 3D Fast Food Landing Page

This document serves as an exhaustive technical and architectural guide for **Claude Code** to scaffold, develop, and polish a modern, high-performance landing page for a premium fast-food burger restaurant.

---

## 1. Project Overview & Vision
- **Product**: Premium artisanal burger and fast-food brand landing page.
- **Core Experience**: A fixed WebGL 3D canvas rendering an interactive burger model. As the visitor scrolls past the Hero section, the burger dynamically triggers an **exploded view** (layer-by-layer deconstruction: Top Bun, Pickles/Tomatoes, Melted Cheese, Flame-grilled Patty, Crisp Lettuce, Bottom Bun) synchronized directly with the scroll timeline.
- **Design Language**: Dark, bold culinary aesthetic with warm golden/amber highlights (`#FF9F0A`, `#F59E0B`), deep charcoal/black backdrops (`#0B0B0C`, `#141416`), smooth glassmorphic cards, micro-interactions, and fluid typography.

---

## 2. Technology Stack & Dependencies

```json
{
  "framework": "Next.js 14/15+ (App Router, TypeScript)",
  "styling": "Tailwind CSS",
  "3d_graphics": [
    "three",
    "@types/three",
    "@react-three/fiber",
    "@react-three/drei"
  ],
  "animation_engine": [
    "gsap",
    "framer-motion"
  ],
  "icons": "lucide-react",
  "assets_tooling": "gltfjsx"
}
```

### Installation Command
```bash
npm install three @types/three @react-three/fiber @react-three/drei gsap framer-motion lucide-react clsx tailwind-merge
```

---

## 3. Recommended Project File Structure

```text
├── public/
│   ├── models/
│   │   └── burger.glb          # 3D Burger model (with separated meshes)
│   └── textures/               # Environment HDRIs, matcaps, grain overlays
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── 3d/
│   │   │   ├── SceneContainer.tsx   # Fixed canvas with dynamic viewport
│   │   │   ├── BurgerExperience.tsx # R3F Scene setup, lights, shadows, cameras
│   │   │   ├── BurgerModel.tsx      # Exploded-view mesh logic & GSAP timeline
│   │   │   └── ProceduralBurger.tsx # Fallback if no .glb is provided
│   │   ├── ui/
│   │   │   ├── Navbar.tsx           # Floating glassmorphism navbar
│   │   │   ├── HeroSection.tsx      # Main title, badge, and initial CTA
│   │   │   ├── ExplodedSection.tsx  # Dynamic callouts synchronized to 3D layers
│   │   │   ├── MenuSection.tsx      # Interactive product grid with tilt effects
│   │   │   ├── CraftSection.tsx     # Quality pillars / "Why Us"
│   │   │   ├── Testimonials.tsx     # Infinite marquee / customer reviews
│   │   │   └── Footer.tsx           # Working hours, newsletter, store locator
│   │   └── common/
│   │       ├── Button.tsx
│   │       └── GlassCard.tsx
│   ├── hooks/
│   │   └── useScrollProgress.ts
│   └── lib/
│       └── utils.ts
```

---

## 4. Key 3D Rig Mechanics: Exploded Scroll Animation

### A. Model Mesh Hierarchy
Whether using a custom `.glb` (converted via `npx gltfjsx public/models/burger.glb -t`) or procedural fallback meshes, each ingredient must be indexed as an individual reference:
1. `bun_top`: Moves significantly upwards ($+Y$) and rotates slightly along $Z/Y$.
2. `sauce_top` & `pickles`: Intermediate displacement upwards ($+Y$).
3. `tomatoes`: Moderate elevation ($+Y$).
4. `cheese`: Slanted melt mesh floating slightly above patty ($+Y$).
5. `patty`: Center anchor or subtle offset ($Y \approx 0$).
6. `lettuce`: Floats downward ($-Y$).
7. `bun_bottom`: Base displacement downwards ($-Y$).

### B. GSAP ScrollTrigger Integration
- Pin the Canvas wrapper or keep it in a `fixed inset-0 pointer-events-none` state.
- Create a master GSAP timeline attached to the `ExplodedSection` scroll container:

```typescript
// Conceptual Implementation Pattern inside BurgerModel.tsx:
import { useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";

gsap.registerPlugin(ScrollTrigger);

export function BurgerRig() {
  const groupRef = useRef<THREE.Group>(null);
  const topBunRef = useRef<THREE.Mesh>(null);
  const tomatoRef = useRef<THREE.Mesh>(null);
  const cheeseRef = useRef<THREE.Mesh>(null);
  const pattyRef = useRef<THREE.Mesh>(null);
  const lettuceRef = useRef<THREE.Mesh>(null);
  const bottomBunRef = useRef<THREE.Mesh>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: "#exploded-section",
          start: "top bottom",
          end: "bottom top",
          scrub: 1.2,
        },
      });

      // Expand layers
      tl.to(topBunRef.current?.position, { y: 2.8, ease: "power1.out" }, 0)
        .to(topBunRef.current?.rotation, { x: 0.15, z: -0.1 }, 0)
        .to(tomatoRef.current?.position, { y: 1.8, ease: "power1.out" }, 0)
        .to(cheeseRef.current?.position, { y: 0.9, ease: "power1.out" }, 0)
        .to(pattyRef.current?.position, { y: 0.0, ease: "none" }, 0)
        .to(lettuceRef.current?.position, { y: -0.9, ease: "power1.out" }, 0)
        .to(bottomBunRef.current?.position, { y: -2.0, ease: "power1.out" }, 0);
    });

    return () => ctx.revert();
  }, []);

  // Idle floating animation when not aggressively scrolling
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.08;
      groupRef.current.rotation.y += 0.003;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Mesh components with appropriate references and materials */}
    </group>
  );
}
```

### C. Procedural Fallback Meshes
If `burger.glb` is absent during initial scaffolding:
- **Buns**: `<cylinderGeometry args={[1.5, 1.4, 0.6, 32]} />` with a rounded cap or modified hemisphere. Color: `#D97706`.
- **Patty**: Rough textured dark brown cylinder: `#451A03`, roughness: `0.9`.
- **Cheese**: Deformed plane/thin box with slight bend: `#FBBF24`.
- **Tomato Slices**: Thin red cylinders with glossy finish: `#EF4444`, roughness: `0.2`.
- **Lettuce**: Thin distorted disc with green roughness: `#22C55E`.

---

## 5. Page Sections & Visual Choreography

| Section | Scroll Behavior | Visual Details |
| :--- | :--- | :--- |
| **1. Navbar** | Sticky / Floating | Glassmorphism (`backdrop-blur-md bg-black/40 border-white/10`), Logo, Menu links, "Order Now" glowing CTA. |
| **2. Hero Section** | Normal Scroll | Compact burger model assembled in center-right. Left side: Bold typography ("Bite into Perfection"), pricing pill, and delivery duration badge. |
| **3. Exploded Ingredients** | Pin/Scrub Trigger | Model opens vertically. Floating UI tag cards appear alongside each layer (e.g., "Toasted Brioche", "Organic Heirloom Tomatoes", "Aged Smoked Cheddar", "100% Wagyu Blend"). |
| **4. Signature Menu** | Horizontal / Grid | Cards with 3D tilt hover, calorie count, spice-level indicators, and single-click quick-cart toggle. |
| **5. Craft & Freshness** | Stagger Reveal | Three value propositions: "Farm to Flame", "Secret Glaze Recipe", "Lightning Fast Dispatch". |
| **6. Customer Buzz** | Smooth Marquee | Social reviews, food critic quotes, and 5-star rating aggregates. |
| **7. Footer** | Modern Dark Footer | Store hours, dynamic open/closed badge, map link, and newsletter subscription form. |

---

## 6. Performance & Implementation Checklist for Claude Code

1. **Client Boundary**: R3F `<Canvas>` must be loaded dynamically using Next.js `dynamic(() => import(...), { ssr: false })` to avoid SSR hydration mismatches.
2. **WebGL Context Handling**: Use `<Suspense fallback={<CanvasLoader />}>` with `<Preload all />` from `@react-three/drei`.
3. **Responsive Scaling**: Calculate camera aspect ratio and model scale dynamically based on `window.innerWidth`. On mobile screens, scale the burger down to `0.65x` and translate it along the Y-axis so it doesn't obstruct text.
4. **Pointer Events**: Canvas wrapper must use `pointer-events-none` so DOM clicks and scroll interactions pass cleanly through to buttons and inputs. Interactive 3D elements must re-enable `pointer-events-auto`.
5. **Clean GSAP Contexts**: Always wrap GSAP ScrollTrigger allocations inside `gsap.context()` inside a `useLayoutEffect` or `useEffect` and invoke `ctx.revert()` in cleanup to prevent duplicate triggers on Next.js hot reloads.