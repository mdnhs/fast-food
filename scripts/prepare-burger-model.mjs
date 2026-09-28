// Converts the Sketchfab export into public/models/burger.glb with one Y-up node per exploded-view layer.
// Usage: node scripts/prepare-burger-model.mjs
import { mkdir } from "node:fs/promises"
import { dirname } from "node:path"

import { NodeIO } from "@gltf-transform/core"
import { ALL_EXTENSIONS } from "@gltf-transform/extensions"
import {
  clearNodeTransform,
  dedup,
  flatten,
  prune,
  textureCompress,
  transformPrimitive,
} from "@gltf-transform/functions"
import sharp from "sharp"

const SOURCE = "public/3d/burger_realistic_free.glb"
const OUTPUT = "public/models/burger.glb"
// Rig constants the procedural burger was built around (lib/burger-layers.ts).
const TARGET_RADIUS = 1.6
const TARGET_CENTER_Y = 0.2

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
const doc = await io.read(SOURCE)
const root = doc.getRoot()
const buffer = root.listBuffers()[0]

await doc.transform(flatten())
for (const node of root.listNodes()) {
  if (node.getMesh()) clearNodeTransform(node)
}

function bounds(prims) {
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (const prim of prims) {
    const position = prim.getAttribute("POSITION")
    const point = []
    for (let i = 0; i < position.getCount(); i++) {
      position.getElement(i, point)
      for (let c = 0; c < 3; c++) {
        min[c] = Math.min(min[c], point[c])
        max[c] = Math.max(max[c], point[c])
      }
    }
  }
  return { min, max, center: min.map((v, c) => (v + max[c]) / 2) }
}

const translation = (x, y, z) => [
  1,
  0,
  0,
  0,
  0,
  1,
  0,
  0,
  0,
  0,
  1,
  0,
  x,
  y,
  z,
  1,
]

// Vertices are welded by position first, because UV seams duplicate vertices and would split one slice into many.
function splitIntoComponents(prim) {
  const position = prim.getAttribute("POSITION")
  const indices = prim.getIndices().getArray()
  const count = position.getCount()
  const parent = Int32Array.from({ length: count }, (_, i) => i)
  const find = (x) => {
    while (parent[x] !== x) x = parent[x] = parent[parent[x]]
    return x
  }
  const union = (a, b) => (parent[find(a)] = find(b))

  const seen = new Map()
  const point = []
  for (let i = 0; i < count; i++) {
    const key = position
      .getElement(i, point)
      .map((v) => v.toFixed(4))
      .join()
    if (seen.has(key)) union(i, seen.get(key))
    else seen.set(key, i)
  }
  for (let t = 0; t < indices.length; t += 3) {
    union(indices[t], indices[t + 1])
    union(indices[t], indices[t + 2])
  }

  const groups = new Map()
  for (let t = 0; t < indices.length; t += 3) {
    const rootId = find(indices[t])
    if (!groups.has(rootId)) groups.set(rootId, [])
    groups.get(rootId).push(indices[t], indices[t + 1], indices[t + 2])
  }

  return [...groups.values()].map((triangles) => {
    const remap = new Map()
    for (const index of triangles)
      if (!remap.has(index)) remap.set(index, remap.size)
    const part = doc.createPrimitive().setMaterial(prim.getMaterial())
    for (const semantic of prim.listSemantics()) {
      const source = prim.getAttribute(semantic)
      const size = source.getElementSize()
      const array = new (source.getArray().constructor)(remap.size * size)
      const element = []
      for (const [oldIndex, newIndex] of remap) {
        array.set(source.getElement(oldIndex, element), newIndex * size)
      }
      part.setAttribute(
        semantic,
        doc
          .createAccessor()
          .setType(source.getType())
          .setArray(array)
          .setNormalized(source.getNormalized())
          .setBuffer(buffer)
      )
    }
    part.setIndices(
      doc
        .createAccessor()
        .setType("SCALAR")
        .setArray(Uint32Array.from(triangles, (i) => remap.get(i)))
        .setBuffer(buffer)
    )
    return part
  })
}

const meshNodes = root.listNodes().filter((node) => node.getMesh())
const primsOf = (materialName) =>
  meshNodes
    .flatMap((node) => node.getMesh().listPrimitives())
    .filter((prim) => prim.getMaterial()?.getName() === materialName)

const byHeight = (a, b) => bounds([a]).min[1] - bounds([b]).min[1]
const bunParts = primsOf("bun.001").flatMap(splitIntoComponents).sort(byHeight)
const vegParts = primsOf("vegies.001").flatMap(splitIntoComponents)
const lettuce = primsOf("lettuce.001").flatMap(splitIntoComponents)

if (bunParts.length !== 4 || vegParts.length !== 11) {
  throw new Error(
    `Unexpected model layout: ${bunParts.length} bun parts, ${vegParts.length} veg parts`
  )
}

// The veg atlas holds two full-width tomato slices and nine small pickle slices.
const isWide = (prim) => {
  const { min, max } = bounds([prim])
  return max[0] - min[0] > 2
}
const [bunBottom, patty, cheese, bunTop] = bunParts
const layers = {
  bun_bottom: [bunBottom],
  lettuce,
  patty: [patty],
  cheese: [cheese],
  pickles: vegParts.filter((p) => !isWide(p)),
  tomatoes: vegParts.filter(isWide),
  bun_top: [bunTop],
}

const all = Object.values(layers).flat()
const total = bounds(all)
const radius = Math.max(
  total.max[0] - total.center[0],
  total.max[2] - total.center[2]
)
const scale = TARGET_RADIUS / radius
const normalize = [
  scale,
  0,
  0,
  0,
  0,
  scale,
  0,
  0,
  0,
  0,
  scale,
  0,
  -total.center[0] * scale,
  TARGET_CENTER_Y - total.center[1] * scale,
  -total.center[2] * scale,
  1,
]
all.forEach((prim) => transformPrimitive(prim, normalize))

for (const mesh of root.listMeshes()) {
  mesh.listPrimitives().forEach((prim) => prim.dispose())
  mesh.dispose()
}
for (const node of root.listNodes()) node.dispose()

// Each layer pivots around its own centre so the rig can scale and tilt it in place.
const scene = root.listScenes()[0]
for (const [id, prims] of Object.entries(layers)) {
  const centerY = bounds(prims).center[1]
  prims.forEach((prim) => transformPrimitive(prim, translation(0, -centerY, 0)))
  const mesh = doc.createMesh(id)
  prims.forEach((prim) => mesh.addPrimitive(prim))
  scene.addChild(
    doc.createNode(id).setMesh(mesh).setTranslation([0, centerY, 0])
  )
  console.log(
    `${id.padEnd(10)} parts=${prims.length} centerY=${centerY.toFixed(3)}`
  )
}

await doc.transform(
  prune(),
  dedup(),
  textureCompress({
    encoder: sharp,
    targetFormat: "webp",
    resize: [1024, 1024],
    quality: 88,
  })
)

await mkdir(dirname(OUTPUT), { recursive: true })
await io.write(OUTPUT, doc)
console.log(`wrote ${OUTPUT}`)
