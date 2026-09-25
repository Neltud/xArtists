/**
 * Supernova mainnet markers + live API helpers.
 * Activation epoch 2233 · round ~600 ms (refreshRate from /stats).
 */

export const SUPERNOVA_ACTIVATION_EPOCH = 2233
export const SUPERNOVA_ROUND_MS = 600
export const SUPERNOVA_HUB = 'https://supernova.multiversx.com/'

/** Static post-activation default; prefer useSupernovaStats for live. */
export function isSupernovaLive(): boolean {
  return true
}

export function supernovaBannerText(): string {
  return isSupernovaLive()
    ? `Supernova ${SUPERNOVA_ROUND_MS} ms · live`
    : 'Pre-Supernova cadence'
}

/** Docs: prepare SC timing for 600ms rounds */
export const SUPERNOVA_SC_PREP_DOC =
  'https://docs.multiversx.com/developers/best-practices/prepare-sc-supernova'
