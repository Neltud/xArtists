/**
 * Spatial engine — kinematics, wall-segment collision, camera clamp.
 */

export type Vec2 = { x: number; z: number }

export type WallSeg2 = {
  x1: number
  y1: number
  x2: number
  y2: number
  thickness?: number
}

export function integrateWishVelocity(
  vx: number,
  vz: number,
  wishX: number,
  wishZ: number,
  speed: number,
  dt: number,
  moving: boolean,
  accel: number,
  friction: number,
): { vx: number; vz: number } {
  if (moving) {
    const targetVx = wishX * speed
    const targetVz = wishZ * speed
    const k = Math.min(1, accel * dt)
    return {
      vx: vx + (targetVx - vx) * k,
      vz: vz + (targetVz - vz) * k,
    }
  }
  const damp = Math.max(0, 1 - friction * dt)
  return { vx: vx * damp, vz: vz * damp }
}

/** Distance point → segment (plan XZ, y = z) */
export function distPointToSegment(
  px: number,
  pz: number,
  x1: number,
  z1: number,
  x2: number,
  z2: number,
): number {
  const dx = x2 - x1
  const dz = z2 - z1
  const len2 = dx * dx + dz * dz
  if (len2 < 1e-12) return Math.hypot(px - x1, pz - z1)
  let t = ((px - x1) * dx + (pz - z1) * dz) / len2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - (x1 + t * dx), pz - (z1 + t * dz))
}

/** True if point is too close to any wall segment */
export function hitsWallSegment(
  x: number,
  z: number,
  walls: WallSeg2[],
  radius: number,
): boolean {
  for (const w of walls) {
    const half = (w.thickness ?? 0.2) * 0.5 + radius
    if (distPointToSegment(x, z, w.x1, w.y1, w.x2, w.y2) < half) return true
  }
  return false
}

export function makeWalkableChecker(
  walls: WallSeg2[],
  floorOk: (x: number, z: number) => boolean,
  radius: number,
): (x: number, z: number) => boolean {
  return (x, z) => {
    if (!floorOk(x, z)) return false
    if (hitsWallSegment(x, z, walls, radius)) return false
    return true
  }
}

function discWalkable(
  x: number,
  z: number,
  isWalkable: (x: number, z: number) => boolean,
  radius: number,
): boolean {
  if (!isWalkable(x, z)) return false
  const steps = 12
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2
    if (!isWalkable(x + Math.cos(a) * radius, z + Math.sin(a) * radius)) return false
  }
  // mid-ring
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    const r = radius * 0.55
    if (!isWalkable(x + Math.cos(a) * r, z + Math.sin(a) * r)) return false
  }
  return true
}

export function trySlideMove(
  px: number,
  pz: number,
  vx: number,
  vz: number,
  dt: number,
  isWalkable: (x: number, z: number) => boolean,
  radius = 0.32,
): { x: number; z: number; vx: number; vz: number } {
  let x = px
  let z = pz
  let ovx = vx
  let ovz = vz

  const dx = vx * dt
  const dz = vz * dt

  // sub-step to reduce tunneling through thin walls
  const steps = Math.max(1, Math.min(4, Math.ceil(Math.hypot(dx, dz) / (radius * 0.4))))
  const sdx = dx / steps
  const sdz = dz / steps

  for (let s = 0; s < steps; s++) {
    if (Math.abs(sdx) > 1e-9) {
      const nx = x + sdx
      if (discWalkable(nx, z, isWalkable, radius)) {
        x = nx
      } else {
        ovx = 0
      }
    }
    if (Math.abs(sdz) > 1e-9) {
      const nz = z + sdz
      if (discWalkable(x, nz, isWalkable, radius)) {
        z = nz
      } else {
        ovz = 0
      }
    }
  }

  return { x, z, vx: ovx, vz: ovz }
}

export function clampCameraDistance(
  px: number,
  pz: number,
  yaw: number,
  pitch: number,
  maxDist: number,
  isWalkable: (x: number, z: number) => boolean,
  minDist = 0.55,
): number {
  const cosP = Math.cos(pitch)
  for (let i = 12; i >= 1; i--) {
    const d = minDist + ((maxDist - minDist) * i) / 12
    const cx = px - Math.sin(yaw) * d * cosP
    const cz = pz - Math.cos(yaw) * d * cosP
    let clear = true
    for (let s = 1; s <= 8; s++) {
      const t = s / 8
      const sx = px + (cx - px) * t
      const sz = pz + (cz - pz) * t
      if (!isWalkable(sx, sz)) {
        clear = false
        break
      }
    }
    if (clear) return d
  }
  return minDist
}
