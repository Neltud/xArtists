/** MultiversX Supernova — mainnet live depuis epoch 2233 (10 sept 2026). */

export const SUPERNOVA = {
  configRelease: 'v2.0.6.0+',
  epoch: 2233,
  epochAtUtc: '2026-09-10T17:45:00.000Z',
  round: 32_157_661,
  roundAtUtc: '2026-09-10T18:05:00.000Z',
  /** Rounds ~600 ms post-activation */
  roundMs: 600,
  docs: 'https://github.com/multiversx/mx-chain-mainnet-config/releases/tag/v2.0.6.0',
  hub: 'https://supernova.multiversx.com/',
} as const

export function isBeforeSupernova(now = Date.now()): boolean {
  return now < Date.parse(SUPERNOVA.epochAtUtc)
}

export function isSupernovaLive(now = Date.now()): boolean {
  return !isBeforeSupernova(now)
}

/** Bandeau discret — post-activation = message stable. */
export function supernovaBannerText(now = Date.now()): string | null {
  if (isSupernovaLive(now)) {
    return `Supernova · epoch ${SUPERNOVA.epoch}+ · ~600 ms rounds`
  }
  const hours = Math.max(0, (Date.parse(SUPERNOVA.epochAtUtc) - now) / 3_600_000)
  return `Supernova epoch ${SUPERNOVA.epoch} · ~${hours.toFixed(0)}h`
}
