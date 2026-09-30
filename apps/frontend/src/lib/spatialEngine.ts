/**
 * Spatial engine — kinematics, slide collision, camera wall clamp.
 */

export type Vec2 = { x: number; z: number }

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

function discWalkable(
  x: number,
  z: number,
  isWalkable: (x: number, z: number) => boolean,
  radius: number,
): boolean {
  if (!isWalkable(x, z)) return false
  const steps = 8
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2
    if (!isWalkable(x + Math.cos(a) * radius, z + Math.sin(a) * radius)) return false
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
  radius = 0.28,
): { x: number; z: number; vx: number; vz: number } {
  let x = px
  let z = pz
  let ovx = vx
  let ovz = vz

  const dx = vx * dt
  const dz = vz * dt

  if (Math.abs(dx) > 1e-8) {
    const nx = x + dx
    if (discWalkable(nx, z, isWalkable, radius)) {
      x = nx
    } else {
      ovx = 0
      const step = Math.sign(dx) * Math.min(Math.abs(dx), radius * 0.35)
      if (discWalkable(x + step, z, isWalkable, radius * 0.85)) x += step
    }
  }

  if (Math.abs(dz) > 1e-8) {
    const nz = z + dz
    if (discWalkable(x, nz, isWalkable, radius)) {
      z = nz
    } else {
      ovz = 0
      const step = Math.sign(dz) * Math.min(Math.abs(dz), radius * 0.35)
      if (discWalkable(x, z + step, isWalkable, radius * 0.85)) z += step
    }
  }

  return { x, z, vx: ovx, vz: ovz }
}

/**
 * Third-person camera distance: never leave the walkable floor (no see-through walls).
 * Pulls cam in when path to ideal camera position crosses a wall.
 */
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
    // sample corridor from player to camera
    let clear = true
    for (let s = 1; s <= 6; s++) {
      const t = s / 6
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

export function rayBlocked(
  originX: number,
  originZ: number,
  dirX: number,
  dirZ: number,
  maxDist: number,
  isWalkable: (x: number, z: number) => boolean,
  samples = 6,
): boolean {
  const len = Math.hypot(dirX, dirZ) || 1
  const dx = dirX / len
  const dz = dirZ / len
  for (let i = 1; i <= samples; i++) {
    const t = (i / samples) * maxDist
    if (!isWalkable(originX + dx * t, originZ + dz * t)) return true
  }
  return false
}
