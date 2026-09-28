"use client"

import { useLayoutEffect, useMemo, useRef } from "react"
import * as THREE from "three"

import {
  createBunBottomTextures,
  createBunTopTextures,
  createCheeseTextures,
  createLettuceTextures,
  createPattyTextures,
  createPickleTexture,
  createTomatoTexture,
  mulberry32,
  type ProfilePoint,
} from "@/components/3d/burger-textures"
import {
  LAYER_RIG,
  type LayerId,
  type LayerRefCallback,
} from "@/lib/burger-layers"

const assembledY = Object.fromEntries(
  LAYER_RIG.map((layer) => [layer.id, layer.assembledY])
) as Record<LayerId, number>

const TOP_BUN_RADIUS = 1.6
const TOP_BUN_SHOULDER = 0.2
const TOP_BUN_DOME = 0.85
// A cos^0.7 profile gives a fuller, rounder shoulder than a plain hemisphere, like a real brioche.
const domeRadius = (angle: number) =>
  TOP_BUN_RADIUS * Math.pow(Math.cos(angle), 0.7)

const TOP_BUN_PROFILE: ProfilePoint[] = [
  [0, 0],
  [1.45, 0],
  [1.56, 0.08],
  ...Array.from({ length: 17 }, (_, i): ProfilePoint => {
    const angle = (i / 16) * (Math.PI / 2)
    return [
      domeRadius(angle),
      TOP_BUN_SHOULDER + TOP_BUN_DOME * Math.sin(angle),
    ]
  }),
]
const TOP_BUN_RIM_V = 3 / (TOP_BUN_PROFILE.length - 1)

const BOTTOM_BUN_PROFILE: ProfilePoint[] = [
  [0, 0],
  [1.4, 0],
  [1.52, 0.1],
  [1.56, 0.3],
  [1.5, 0.5],
  [1.44, 0.55],
  [0, 0.55],
]

function createLathe(profile: ProfilePoint[]) {
  return new THREE.LatheGeometry(
    profile.map(([x, y]) => new THREE.Vector2(x, y)),
    96
  )
}

function createPattyGeometry() {
  const geometry = new THREE.CylinderGeometry(1.62, 1.6, 0.45, 96, 8)
  const position = geometry.attributes.position
  const vertex = new THREE.Vector3()
  for (let i = 0; i < position.count; i++) {
    vertex.fromBufferAttribute(position, i)
    const radius = Math.hypot(vertex.x, vertex.z)
    const noise =
      Math.sin(vertex.x * 7.1 + vertex.z * 3.3) *
        Math.cos(vertex.z * 6.7 - vertex.y * 9.2) +
      0.5 * Math.sin(vertex.x * 17.3 - vertex.z * 13.1)
    if (radius > 1e-3) {
      const scale = 1 + (noise * 0.045) / radius
      vertex.x *= scale
      vertex.z *= scale
    }
    vertex.y += noise * 0.012
    position.setXYZ(i, vertex.x, vertex.y, vertex.z)
  }
  geometry.computeVertexNormals()
  return geometry
}

function createCheeseGeometry() {
  const geometry = new THREE.BoxGeometry(3, 0.05, 3, 32, 1, 32)
  const position = geometry.attributes.position
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i)
    const z = position.getZ(i)
    const overhang = Math.max(0, Math.hypot(x, z) - 1.45)
    position.setY(i, position.getY(i) - overhang * overhang * 1.1)
  }
  geometry.computeVertexNormals()
  return geometry
}

function createLettuceGeometry(outerRadius: number, phase: number) {
  const geometry = new THREE.RingGeometry(0.01, outerRadius, 128, 8)
  geometry.rotateX(-Math.PI / 2)
  const position = geometry.attributes.position
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i)
    const z = position.getZ(i)
    const t = Math.hypot(x, z) / outerRadius
    const theta = Math.atan2(z, x)
    position.setY(
      i,
      Math.sin(theta * 11 + phase) * 0.1 * t * t +
        Math.cos(theta * 7 - phase) * 0.05 * t +
        Math.sin(theta * 23 + phase * 2) * 0.025 * t * t
    )
  }
  geometry.computeVertexNormals()
  return geometry
}

function createSauceGeometry() {
  const shape = new THREE.Shape()
  const steps = 96
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2
    const radius =
      1.25 + Math.sin(angle * 5) * 0.08 + Math.sin(angle * 11 + 1) * 0.05
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.005,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.03,
    bevelSegments: 4,
    curveSegments: 1,
  })
  geometry.rotateX(-Math.PI / 2)
  return geometry
}

function SesameSeeds() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const count = 64

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const random = mulberry32(7)
    const dummy = new THREE.Object3D()
    for (let i = 0; i < count; i++) {
      const elevation = 0.25 + random() * 1.05
      const theta = random() * Math.PI * 2
      const radius = domeRadius(elevation)
      dummy.position.set(
        Math.cos(theta) * radius,
        TOP_BUN_SHOULDER + TOP_BUN_DOME * Math.sin(elevation) + 0.01,
        Math.sin(theta) * radius
      )
      dummy.rotation.set(Math.PI / 2 - elevation, -theta, random() * Math.PI)
      const size = 0.85 + random() * 0.3
      dummy.scale.set(0.07 * size, 0.03 * size, 0.035 * size)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [])

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 10, 8]} />
      <meshStandardMaterial color="#f3e2bd" roughness={0.45} />
    </instancedMesh>
  )
}

const TOMATO_SLICES: [number, number, number][] = [
  [0.55, 0, 0.5],
  [-0.6, 0.01, 0.45],
  [0.5, 0.02, -0.6],
  [-0.5, 0, -0.55],
]

const PICKLE_SLICES: [number, number, number][] = [
  [0.7, 0.03, 0.2],
  [-0.2, 0.035, 0.75],
  [-0.75, 0.03, -0.1],
  [0.15, 0.04, -0.7],
  [0, 0.045, 0.05],
]

function createMaterials() {
  const bunTop = createBunTopTextures(TOP_BUN_PROFILE, TOP_BUN_RIM_V)
  const bunBottom = createBunBottomTextures(BOTTOM_BUN_PROFILE)
  const patty = createPattyTextures()
  const cheese = createCheeseTextures()
  const lettuce = createLettuceTextures()
  const tomato = createTomatoTexture()
  const pickle = createPickleTexture()

  const bread = {
    roughness: 0.62,
    bumpScale: 2,
    sheen: 0.6,
    sheenColor: new THREE.Color("#ffd8a8"),
    sheenRoughness: 0.6,
  }
  const pattySide = new THREE.MeshStandardMaterial({
    map: patty.side.map,
    bumpMap: patty.side.bump,
    bumpScale: 4,
    roughness: 0.85,
  })
  const pattyTop = new THREE.MeshPhysicalMaterial({
    map: patty.top.map,
    bumpMap: patty.top.bump,
    bumpScale: 3,
    roughness: 0.6,
    clearcoat: 0.25,
    clearcoatRoughness: 0.6,
  })
  const tomatoSkin = new THREE.MeshPhysicalMaterial({
    color: "#c81e1e",
    roughness: 0.2,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
  })
  const tomatoFlesh = new THREE.MeshPhysicalMaterial({
    map: tomato,
    roughness: 0.3,
    clearcoat: 0.8,
    clearcoatRoughness: 0.2,
  })
  const pickleSkin = new THREE.MeshStandardMaterial({
    color: "#3f6212",
    roughness: 0.35,
  })
  const pickleFlesh = new THREE.MeshPhysicalMaterial({
    map: pickle,
    roughness: 0.3,
    clearcoat: 0.6,
  })

  return {
    textures: [bunTop, bunBottom, patty.side, patty.top, cheese, lettuce]
      .flatMap((t) => [t.map, t.bump])
      .concat(tomato, pickle),
    bunTop: new THREE.MeshPhysicalMaterial({
      ...bread,
      map: bunTop.map,
      bumpMap: bunTop.bump,
      clearcoat: 0.55,
      clearcoatRoughness: 0.35,
    }),
    bunBottom: new THREE.MeshPhysicalMaterial({
      ...bread,
      map: bunBottom.map,
      bumpMap: bunBottom.bump,
    }),
    // CylinderGeometry material groups are ordered [side, top cap, bottom cap].
    patty: [pattySide, pattyTop, pattyTop],
    tomato: [tomatoSkin, tomatoFlesh, tomatoFlesh],
    pickle: [pickleSkin, pickleFlesh, pickleFlesh],
    sauce: new THREE.MeshPhysicalMaterial({
      color: "#d9622b",
      roughness: 0.12,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
    }),
    cheese: new THREE.MeshPhysicalMaterial({
      map: cheese.map,
      bumpMap: cheese.bump,
      bumpScale: 0.6,
      roughness: 0.32,
      clearcoat: 0.35,
      clearcoatRoughness: 0.3,
      sheen: 0.4,
      sheenColor: new THREE.Color("#fff3c4"),
      side: THREE.DoubleSide,
    }),
    lettuce: new THREE.MeshPhysicalMaterial({
      map: lettuce.map,
      bumpMap: lettuce.bump,
      bumpScale: 2,
      roughness: 0.45,
      clearcoat: 0.3,
      clearcoatRoughness: 0.4,
      side: THREE.DoubleSide,
    }),
  }
}

export function ProceduralBurger({ layerRef }: { layerRef: LayerRefCallback }) {
  const geometries = useMemo(
    () => ({
      topBun: createLathe(TOP_BUN_PROFILE),
      bottomBun: createLathe(BOTTOM_BUN_PROFILE),
      patty: createPattyGeometry(),
      cheese: createCheeseGeometry(),
      lettuceOuter: createLettuceGeometry(1.9, 0),
      lettuceInner: createLettuceGeometry(1.7, 1.3),
      tomato: new THREE.CylinderGeometry(0.62, 0.62, 0.1, 48),
      pickle: new THREE.CylinderGeometry(0.32, 0.3, 0.04, 32),
      sauce: createSauceGeometry(),
    }),
    []
  )
  const materials = useMemo(() => createMaterials(), [])

  useLayoutEffect(
    () => () => {
      Object.values(geometries).forEach((g) => g.dispose())
      const { textures, ...rest } = materials
      textures.forEach((t) => t.dispose())
      Object.values(rest)
        .flat()
        .forEach((m) => m.dispose())
    },
    [geometries, materials]
  )

  return (
    <>
      <group
        ref={layerRef("bun_top")}
        name="bun_top"
        position-y={assembledY.bun_top}
      >
        <mesh geometry={geometries.topBun} material={materials.bunTop} />
        <SesameSeeds />
      </group>

      <group
        ref={layerRef("pickles")}
        name="pickles"
        position-y={assembledY.pickles}
      >
        <mesh
          name="sauce_top"
          geometry={geometries.sauce}
          material={materials.sauce}
        />
        {PICKLE_SLICES.map((position, i) => (
          <mesh
            key={i}
            position={position}
            rotation-z={(i - 2) * 0.04}
            geometry={geometries.pickle}
            material={materials.pickle}
          />
        ))}
      </group>

      <group
        ref={layerRef("tomatoes")}
        name="tomatoes"
        position-y={assembledY.tomatoes}
      >
        {TOMATO_SLICES.map((position, i) => (
          <mesh
            key={i}
            position={position}
            rotation-y={i * 1.3}
            geometry={geometries.tomato}
            material={materials.tomato}
          />
        ))}
      </group>

      <group
        ref={layerRef("cheese")}
        name="cheese"
        position-y={assembledY.cheese}
      >
        <mesh
          geometry={geometries.cheese}
          material={materials.cheese}
          rotation-y={Math.PI / 4}
        />
      </group>

      <group ref={layerRef("patty")} name="patty" position-y={assembledY.patty}>
        <mesh geometry={geometries.patty} material={materials.patty} />
      </group>

      <group
        ref={layerRef("lettuce")}
        name="lettuce"
        position-y={assembledY.lettuce}
      >
        <mesh geometry={geometries.lettuceOuter} material={materials.lettuce} />
        <mesh
          geometry={geometries.lettuceInner}
          material={materials.lettuce}
          position-y={0.04}
          rotation-y={0.7}
        />
      </group>

      <group
        ref={layerRef("bun_bottom")}
        name="bun_bottom"
        position-y={assembledY.bun_bottom}
      >
        <mesh geometry={geometries.bottomBun} material={materials.bunBottom} />
      </group>
    </>
  )
}
