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
 * Static true after 10 Sep 2026; live epoch comes from /stats via networkProbe.
 */
export function isSupernovaLive(): boolean {
  return true
}

export const SUPERNOVA_HUB = 'https://supernova.multiversx.com/'

/** Short banner copy for DemoModeBanner */
export function supernovaBannerText(): string {
  return isSupernovaLive()
    ? `Supernova ${SUPERNOVA_ROUND_MS} ms · live`
    : 'Pre-Supernova cadence'
}
