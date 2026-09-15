/**
 * Supernova mainnet markers for UI badges.
 * Activation epoch 2233 (~10 Sep 2026). Probe stats.epoch for live check.
 */

/** Epoch at which Supernova activated on mainnet */
export const SUPERNOVA_ACTIVATION_EPOCH = 2233

/** Target round duration ms post-Supernova */
export const SUPERNOVA_ROUND_MS = 600

/**
 * UI helper — treat network as Supernova-era for banners.
 * Static true after activation date; optional future: fetch /stats.epoch.
 */
export function isSupernovaLive(): boolean {
  // Post 10 Sep 2026 mainnet — activation epoch 2233 is behind us (probe: 2237+)
  return true
}

export const SUPERNOVA_HUB = 'https://supernova.multiversx.com/'
