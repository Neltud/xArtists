/**
 * Shared FPS locomotion constants — museum halls.
 */
export const MUSEUM_FPS = {
  eyeHeight: 1.65,
  walkSpeed: 3.6,
  sprintSpeed: 6.4,
  accel: 22,
  friction: 11,
  lookSens: 0.0019,
  pitchMax: 1.2,
  collisionRadius: 0.34,
  /** Min third-person cam distance when against wall */
  camMinDist: 0.55,
  camMaxDist: 4.2,
  bobAmp: 0.04,
  bobFreq: 8.5,
  fovWalk: 72,
  fovSprint: 78,
} as const

/** Map keyboard / numpad → wish WASD flags (diagonals supported). */
export function applyNavKey(
  keys: Record<string, boolean>,
  e: KeyboardEvent,
  down: boolean,
): void {
  const code = e.code
  const key = e.key

  // Arrows — preventDefault handled by caller when hall focused
  if (key === 'ArrowUp' || code === 'Numpad8') keys.w = down
  if (key === 'ArrowDown' || code === 'Numpad2') keys.s = down
  if (key === 'ArrowLeft' || code === 'Numpad4') keys.a = down
  if (key === 'ArrowRight' || code === 'Numpad6') keys.d = down

  // Numpad diagonals
  if (code === 'Numpad7') {
    keys.w = down
    keys.a = down
  }
  if (code === 'Numpad9') {
    keys.w = down
    keys.d = down
  }
  if (code === 'Numpad1') {
    keys.s = down
    keys.a = down
  }
  if (code === 'Numpad3') {
    keys.s = down
    keys.d = down
  }
  if (code === 'Numpad5') {
    // stop
    if (down) {
      keys.w = keys.a = keys.s = keys.d = false
    }
  }
}

export function isNavKey(e: KeyboardEvent): boolean {
  const k = e.key
  const c = e.code
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(k)) return true
  if (c.startsWith('Numpad') && c !== 'NumpadDecimal') return true
  if (['w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(k)) return true
  return false
}
