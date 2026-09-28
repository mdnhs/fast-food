import * as THREE from "three"

type RGB = [number, number, number]
type ColorStop = [number, string]

export type ProfilePoint = [radius: number, y: number]

export function mulberry32(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hash3(x: number, y: number, z: number, seed: number) {
  let h =
    Math.imul(x, 0x27d4eb2d) ^
    Math.imul(y, 0x165667b1) ^
    Math.imul(z, 0x9e3779b1) ^
    seed
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b)
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

function noise3(x: number, y: number, z: number, seed: number) {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const z0 = Math.floor(z)
  const fx = x - x0
  const fy = y - y0
  const fz = z - z0
  const sx = fx * fx * (3 - 2 * fx)
  const sy = fy * fy * (3 - 2 * fy)
  const sz = fz * fz * (3 - 2 * fz)
  const lerp = THREE.MathUtils.lerp
  const corner = (dx: number, dy: number, dz: number) =>
    hash3(x0 + dx, y0 + dy, z0 + dz, seed)
  return lerp(
    lerp(
      lerp(corner(0, 0, 0), corner(1, 0, 0), sx),
      lerp(corner(0, 1, 0), corner(1, 1, 0), sx),
      sy
    ),
    lerp(
      lerp(corner(0, 0, 1), corner(1, 0, 1), sx),
      lerp(corner(0, 1, 1), corner(1, 1, 1), sx),
      sy
    ),
    sz
  )
}

function fbm(x: number, y: number, z: number, seed: number, octaves = 4) {
  let sum = 0
  let amplitude = 0.5
  let frequency = 1
  let norm = 0
  for (let i = 0; i < octaves; i++) {
    sum +=
      amplitude *
      noise3(x * frequency, y * frequency, z * frequency, seed + i * 131)
    norm += amplitude
    amplitude *= 0.5
    frequency *= 2
  }
  return sum / norm
}

function hexToRgb(hex: string): RGB {
  const value = parseInt(hex.slice(1), 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

function gradient(stops: ColorStop[]) {
  const parsed = stops.map(([at, hex]) => [at, hexToRgb(hex)] as const)
  return (t: number): RGB => {
    const i = parsed.findIndex(([at]) => at >= t)
    if (i <= 0) return [...parsed[i === -1 ? parsed.length - 1 : 0][1]]
    const [a, ca] = parsed[i - 1]
    const [b, cb] = parsed[i]
    const k = (t - a) / (b - a)
    return [0, 1, 2].map((c) => ca[c] + (cb[c] - ca[c]) * k) as RGB
  }
}

function shade(color: RGB, factor: number): RGB {
  return color.map((c) => Math.min(255, Math.max(0, c * factor))) as RGB
}

function mix(a: RGB, b: RGB, t: number): RGB {
  return a.map((c, i) => c + (b[i] - c) * t) as RGB
}

function createCanvas(size: number) {
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  return canvas
}

// Writes a color map and a height (bump) map in one pass; v runs bottom-to-top to match three.js UVs.
function paint(
  size: number,
  shader: (u: number, v: number) => { color: RGB; height: number }
) {
  const colorCanvas = createCanvas(size)
  const bumpCanvas = createCanvas(size)
  const colorCtx = colorCanvas.getContext("2d")!
  const bumpCtx = bumpCanvas.getContext("2d")!
  const colorData = colorCtx.createImageData(size, size)
  const bumpData = bumpCtx.createImageData(size, size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const { color, height } = shader((x + 0.5) / size, 1 - (y + 0.5) / size)
      const i = (y * size + x) * 4
      colorData.data.set([color[0], color[1], color[2], 255], i)
      const h = Math.round(Math.min(1, Math.max(0, height)) * 255)
      bumpData.data.set([h, h, h, 255], i)
    }
  }
  colorCtx.putImageData(colorData, 0, 0)
  bumpCtx.putImageData(bumpData, 0, 0)
  return { map: toTexture(colorCanvas, true), bump: toTexture(bumpCanvas) }
}

function toTexture(canvas: HTMLCanvasElement, isColor = false) {
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.anisotropy = 8
  if (isColor) texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

// Maps a lathe UV back to its 3D surface point so noise has no seam at u=0/1 and no pinch at the pole.
function latheSurface(profile: ProfilePoint[], u: number, v: number) {
  const f = v * (profile.length - 1)
  const i = Math.min(profile.length - 2, Math.floor(f))
  const k = f - i
  const radius = THREE.MathUtils.lerp(profile[i][0], profile[i + 1][0], k)
  const y = THREE.MathUtils.lerp(profile[i][1], profile[i + 1][1], k)
  const angle = u * Math.PI * 2
  return [Math.sin(angle) * radius, y, Math.cos(angle) * radius] as const
}

// Cylinder caps use a disc inscribed in the unit square: centre at (0.5, 0.5).
function discCoords(u: number, v: number) {
  const dx = (u - 0.5) * 2
  const dy = (v - 0.5) * 2
  return { dx, dy, r: Math.hypot(dx, dy), angle: Math.atan2(dy, dx) }
}

export function createBunTopTextures(profile: ProfilePoint[], rimV: number) {
  const dome = gradient([
    [0, "#f3cf94"],
    [0.1, "#df9440"],
    [0.35, "#b8621a"],
    [1, "#7c350b"],
  ])
  const crumb: RGB = hexToRgb("#ecc995")
  return paint(512, (u, v) => {
    const [x, y, z] = latheSurface(profile, u, v)
    const mottle = fbm(x * 2.2, y * 2.2, z * 2.2, 11)
    const grain = fbm(x * 30, y * 30, z * 30, 23, 3)
    if (v < rimV * 0.66) {
      const pore = grain > 0.66 ? 0.9 : 1
      return {
        color: shade(crumb, (0.94 + mottle * 0.12) * pore),
        height: 0.5 + (grain - 0.5) * 0.6,
      }
    }
    const t = Math.max(0, (v - rimV) / (1 - rimV))
    const blotch = THREE.MathUtils.smoothstep(mottle, 0.55, 0.75) * 0.18
    return {
      color: shade(
        dome(t),
        0.9 + mottle * 0.22 - blotch + (grain - 0.5) * 0.08
      ),
      height: mottle * 0.7 + grain * 0.3,
    }
  })
}

export function createBunBottomTextures(profile: ProfilePoint[]) {
  const side = gradient([
    [0, "#9c5418"],
    [0.3, "#c77a2c"],
    [0.6, "#e6a45a"],
    [0.8, "#f3cf95"],
    [1, "#e0ae6c"],
  ])
  return paint(256, (u, v) => {
    const [x, y, z] = latheSurface(profile, u, v)
    const mottle = fbm(x * 2.5, y * 2.5, z * 2.5, 37)
    const grain = fbm(x * 28, y * 28, z * 28, 41, 3)
    const isCutFace = v > 0.84
    const toast = isCutFace
      ? THREE.MathUtils.smoothstep(mottle, 0.45, 0.8) * 0.3
      : 0
    const pore = isCutFace && grain > 0.6 ? 0.8 : 1
    return {
      color: shade(side(v), (0.92 + mottle * 0.16 - toast) * pore),
      height: isCutFace ? grain : mottle * 0.7 + grain * 0.3,
    }
  })
}

export function createPattyTextures() {
  const meat = gradient([
    [0, "#1f0d06"],
    [0.45, "#4a2210"],
    [0.75, "#6e3519"],
    [1, "#8a4a24"],
  ])
  const side = paint(256, (u, v) => {
    const angle = u * Math.PI * 2
    const x = Math.sin(angle) * 1.6
    const z = Math.cos(angle) * 1.6
    const y = v * 0.45
    const crag = fbm(x * 5, y * 5, z * 5, 53)
    const speck = fbm(x * 40, y * 40, z * 40, 59, 2)
    const fat = speck > 0.7 ? 0.35 : 0
    return {
      color: mix(meat(crag), hexToRgb("#a8703f"), fat),
      height: crag * 0.8 + speck * 0.2,
    }
  })
  const top = paint(512, (u, v) => {
    const { dx, dy, r } = discCoords(u, v)
    const crag = fbm(dx * 4, dy * 4, 0.5, 61)
    const speck = fbm(dx * 36, dy * 36, 0.5, 67, 2)
    // Diagonal char stripes; smoothstep keeps the edges soft like a real grill press.
    const stripe = Math.abs(Math.sin((dx + dy) * 7 + crag * 0.8))
    const char = THREE.MathUtils.smoothstep(stripe, 0.82, 0.97) * 0.75
    const edgeChar = THREE.MathUtils.smoothstep(r, 0.78, 1) * 0.35
    const base = meat(0.35 + crag * 0.6)
    return {
      color: shade(base, 1 - char - edgeChar + (speck - 0.5) * 0.25),
      height: crag * 0.7 + speck * 0.3 - char * 0.3,
    }
  })
  return { side, top }
}

export function createCheeseTextures() {
  const cheese = gradient([
    [0, "#f59e0b"],
    [0.6, "#fbbf24"],
    [1, "#fcd34d"],
  ])
  return paint(128, (u, v) => {
    const n = fbm(u * 6, v * 6, 0.3, 71, 3)
    return { color: cheese(n), height: n }
  })
}

export function createTomatoTexture() {
  const size = 512
  const canvas = createCanvas(size)
  const ctx = canvas.getContext("2d")!
  const c = size / 2
  const random = mulberry32(79)

  ctx.fillStyle = "#b91c1c"
  ctx.fillRect(0, 0, size, size)
  const flesh = ctx.createRadialGradient(c, c, 0, c, c, c * 0.96)
  flesh.addColorStop(0, "#f87171")
  flesh.addColorStop(0.7, "#ef4444")
  flesh.addColorStop(1, "#dc2626")
  ctx.fillStyle = flesh
  ctx.beginPath()
  ctx.arc(c, c, c * 0.95, 0, Math.PI * 2)
  ctx.fill()

  const chambers = 5
  for (let i = 0; i < chambers; i++) {
    const angle = (i / chambers) * Math.PI * 2 + 0.3
    const cx = c + Math.cos(angle) * c * 0.5
    const cy = c + Math.sin(angle) * c * 0.5
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(angle)
    const gel = ctx.createRadialGradient(0, 0, 0, 0, 0, c * 0.28)
    gel.addColorStop(0, "rgba(254, 202, 202, 0.95)")
    gel.addColorStop(1, "rgba(252, 165, 165, 0.6)")
    ctx.fillStyle = gel
    ctx.beginPath()
    ctx.ellipse(0, 0, c * 0.28, c * 0.18, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = "#fde68a"
    for (let s = 0; s < 7; s++) {
      ctx.beginPath()
      ctx.ellipse(
        (random() - 0.5) * c * 0.35,
        (random() - 0.5) * c * 0.18,
        c * 0.035,
        c * 0.02,
        random() * Math.PI,
        0,
        Math.PI * 2
      )
      ctx.fill()
    }
    ctx.restore()
  }

  const core = ctx.createRadialGradient(c, c, 0, c, c, c * 0.22)
  core.addColorStop(0, "#fecaca")
  core.addColorStop(1, "rgba(248, 113, 113, 0)")
  ctx.fillStyle = core
  ctx.beginPath()
  ctx.arc(c, c, c * 0.22, 0, Math.PI * 2)
  ctx.fill()

  return toTexture(canvas, true)
}

export function createPickleTexture() {
  const size = 256
  const canvas = createCanvas(size)
  const ctx = canvas.getContext("2d")!
  const c = size / 2
  const random = mulberry32(83)

  ctx.fillStyle = "#365314"
  ctx.fillRect(0, 0, size, size)
  const flesh = ctx.createRadialGradient(c, c, 0, c, c, c * 0.88)
  flesh.addColorStop(0, "#d9e59a")
  flesh.addColorStop(0.75, "#a3b94a")
  flesh.addColorStop(1, "#6b8a24")
  ctx.fillStyle = flesh
  ctx.beginPath()
  ctx.arc(c, c, c * 0.88, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = "rgba(247, 254, 231, 0.85)"
  for (let i = 0; i < 14; i++) {
    const angle = (i / 14) * Math.PI * 2 + random() * 0.2
    const radius = c * (0.32 + random() * 0.12)
    ctx.beginPath()
    ctx.ellipse(
      c + Math.cos(angle) * radius,
      c + Math.sin(angle) * radius,
      c * 0.06,
      c * 0.035,
      angle,
      0,
      Math.PI * 2
    )
    ctx.fill()
  }
  return toTexture(canvas, true)
}

export function createLettuceTextures() {
  const leaf = gradient([
    [0, "#ecfccb"],
    [0.3, "#bef264"],
    [0.7, "#65a30d"],
    [1, "#3f6212"],
  ])
  return paint(512, (u, v) => {
    const { r, angle } = discCoords(u, v)
    const n = fbm(u * 8, v * 8, 0.7, 89)
    // Primary veins radiate from the centre; sin() of the angle spaces them evenly with a noisy wobble.
    const vein = Math.abs(Math.sin(angle * 9 + n * 2.5))
    const veinMask =
      (1 - THREE.MathUtils.smoothstep(vein, 0, 0.08)) * (1 - r * 0.6)
    const base = leaf(Math.min(1, r * 0.85 + (n - 0.5) * 0.3))
    return {
      color: mix(base, hexToRgb("#f7fee7"), veinMask * 0.55),
      height: n * 0.6 + veinMask * 0.4,
    }
  })
}
