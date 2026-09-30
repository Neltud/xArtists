/**
 * Shared FPS locomotion constants — museum halls (game-like).
 * Phase 2.5 spatial engine reads these for collision radius / look sens.
 */
export const MUSEUM_FPS = {
  eyeHeight: 1.65,
  walkSpeed: 3.6,
  sprintSpeed: 6.4,
  accel: 22,
  friction: 11,
  lookSens: 0.0019,
  pitchMax: 1.2,
  /** Avatar collision disc radius (no clipping) */
  collisionRadius: 0.32,
  bobAmp: 0.04,
  bobFreq: 8.5,
  fovWalk: 72,
  fovSprint: 78,
} as const
