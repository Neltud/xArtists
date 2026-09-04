/**
 * Atmosphère surréaliste pour salles musée WebGL.
 * Particules flottantes + lumières irisées.
 */
import * as THREE from 'three'

export type Theme = 'cyber' | 'stone' | 'gold' | 'white' | 'dark'

/** Palette enrichie — rêves / surréalisme */
export const SURREAL_PALETTE: Record<
  Theme,
  { wall: number; floor: number; ceil: number; fog: number; frame: number; emissive: number; trim: number; accent: number }
> = {
  cyber: {
    wall: 0x12122a,
    floor: 0x050510,
    ceil: 0x0c0c1c,
    fog: 0x060612,
    frame: 0x1e293b,
    emissive: 0x0e7490,
    trim: 0x22d3ee,
    accent: 0xa78bfa,
  },
  stone: {
    wall: 0x3a322c,
    floor: 0x181410,
    ceil: 0x2a221c,
    fog: 0x0c0a08,
    frame: 0x5c4a38,
    emissive: 0x2a1808,
    trim: 0xc4a574,
    accent: 0xf59e0b,
  },
  gold: {
    wall: 0x3a2c14,
    floor: 0x140f08,
    ceil: 0x2a1e10,
    fog: 0x0c0a06,
    frame: 0x6b5528,
    emissive: 0x3a2808,
    trim: 0xeab308,
    accent: 0xfbbf24,
  },
  white: {
    wall: 0xe4ddd4,
    floor: 0xc0b8ac,
    ceil: 0xf0ebe4,
    fog: 0xd0c8bc,
    frame: 0xd4ccc0,
    emissive: 0xa09080,
    trim: 0x9a9080,
    accent: 0xf472b6,
  },
  dark: {
    wall: 0x141210,
    floor: 0x060504,
    ceil: 0x0c0a08,
    fog: 0x030201,
    frame: 0x2a2218,
    emissive: 0x1a1008,
    trim: 0x55504c,
    accent: 0xe879f9,
  },
}

/** Nuée de particules / orbes flottants */
export function createSurrealParticles(
  scene: THREE.Scene,
  cx: number,
  cy: number,
  wallH: number,
  count = 80,
  accent = 0xa78bfa
): THREE.Points {
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3)
  const col = new Float32Array(count * 3)
  const c = new THREE.Color(accent)
  for (let i = 0; i < count; i++) {
    pos[i * 3] = cx + (Math.random() - 0.5) * 14
    pos[i * 3 + 1] = 0.4 + Math.random() * (wallH - 0.6)
    pos[i * 3 + 2] = cy + (Math.random() - 0.5) * 14
    const t = 0.4 + Math.random() * 0.6
    col[i * 3] = c.r * t
    col[i * 3 + 1] = c.g * t
    col[i * 3 + 2] = c.b * t
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
  const mat = new THREE.PointsMaterial({
    size: 0.06,
    vertexColors: true,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const pts = new THREE.Points(geo, mat)
  pts.name = 'surrealParticles'
  scene.add(pts)
  return pts
}

export function tickSurrealParticles(pts: THREE.Points, t: number) {
  const pos = pts.geometry.attributes.position as THREE.BufferAttribute
  const arr = pos.array as Float32Array
  for (let i = 0; i < arr.length; i += 3) {
    arr[i + 1] += Math.sin(t * 0.6 + i) * 0.002
    arr[i] += Math.cos(t * 0.3 + i * 0.1) * 0.001
  }
  pos.needsUpdate = true
  pts.rotation.y = t * 0.02
}

/** Lumières accent surréalistes (magenta / cyan / or) */
export function addSurrealLights(
  scene: THREE.Scene,
  cx: number,
  cy: number,
  wallH: number,
  room: Theme
) {
  const a = new THREE.PointLight(0xe879f9, room === 'cyber' ? 1.2 : 0.55, 22, 2)
  a.position.set(cx - 3, wallH * 0.7, cy + 2)
  scene.add(a)
  const b = new THREE.PointLight(0x22d3ee, room === 'cyber' ? 1.0 : 0.4, 20, 2)
  b.position.set(cx + 3.5, wallH * 0.55, cy - 2)
  scene.add(b)
  if (room === 'gold' || room === 'stone') {
    const g = new THREE.PointLight(0xfbbf24, 0.7, 18, 2)
    g.position.set(cx, wallH * 0.9, cy)
    scene.add(g)
  }
}
