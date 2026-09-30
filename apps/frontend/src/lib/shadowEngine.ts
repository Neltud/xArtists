/**
 * Shadow Engine — predictive / fallback layer while LIA is thinking.
 * Never blocks the UI (Rule #1).
 */

import type { PulseEnvironment } from './pulseDemo'
import { compileSemantic, type ShaderUniformsTarget } from './semanticCompiler'

export type ShadowState = {
  /** Anticipated uniforms before full LIA text */
  predicted: ShaderUniformsTarget
  /** True while waiting on LIA > threshold */
  liaPending: boolean
  /** Switched to raw market pulse after timeout */
  fallbackActive: boolean
  lastLiaMs: number | null
  lastError: string | null
}

const LIA_TIMEOUT_MS = 2000

export function createShadowState(env: PulseEnvironment): ShadowState {
  return {
    predicted: compileSemantic(env),
    liaPending: false,
    fallbackActive: false,
    lastLiaMs: null,
    lastError: null,
  }
}

/** Start anticipatory tension when a LIA request begins */
export function shadowOnLiaStart(prev: ShadowState, env: PulseEnvironment): ShadowState {
  const base = compileSemantic(env)
  // bump volatility slightly so room “breathes” before text arrives
  return {
    ...prev,
    liaPending: true,
    fallbackActive: false,
    lastError: null,
    predicted: {
      ...base,
      uVolatility: Math.min(1, base.uVolatility + 0.12),
      uPulseSpeed: base.uPulseSpeed * 1.15,
      label: 'LIA thinking…',
    },
  }
}

export function shadowOnLiaDone(
  prev: ShadowState,
  env: PulseEnvironment,
  phrase: string,
): ShadowState {
  return {
    ...prev,
    liaPending: false,
    fallbackActive: false,
    lastLiaMs: Date.now(),
    lastError: null,
    predicted: compileSemantic(env, phrase),
  }
}

export function shadowOnLiaTimeout(prev: ShadowState, env: PulseEnvironment): ShadowState {
  return {
    ...prev,
    liaPending: false,
    fallbackActive: true,
    lastError: `LIA >${LIA_TIMEOUT_MS}ms — market pulse fallback`,
    predicted: compileSemantic(env),
  }
}

export function shadowOnLiaError(prev: ShadowState, env: PulseEnvironment, err: string): ShadowState {
  return {
    ...prev,
    liaPending: false,
    fallbackActive: true,
    lastError: err,
    predicted: compileSemantic(env),
  }
}

export { LIA_TIMEOUT_MS }
