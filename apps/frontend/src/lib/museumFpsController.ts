/**
 * Shared FPS locomotion constants — museum halls (game-like, A1X / AI Nexus inspired).
 */
export const MUSEUM_FPS = {
  eyeHeight: 1.65,
  walkSpeed: 3.6,
  sprintSpeed: 6.4,
  accel: 22,
  friction: 11,
  lookSens: 0.0019,
  pitchMax: 1.2,
  collisionRadius: 0.28,
  bobAmp: 0.04,
  bobFreq: 8.5,
  fovWalk: 72,
  fovSprint: 78,
} as const
