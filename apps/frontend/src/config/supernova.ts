/** MultiversX Supernova mainnet activation — config v2.0.6.0 */

export const SUPERNOVA = {
  configRelease: 'v2.0.6.0',
  epoch: 2233,
  /** ISO UTC — epoch start */
  epochAtUtc: '2026-09-10T17:45:00.000Z',
  round: 32_157_661,
  /** ISO UTC — round activation */
  roundAtUtc: '2026-09-10T18:05:00.000Z',
  docs: 'https://github.com/multiversx/mx-chain-mainnet-config/releases/tag/v2.0.6.0',
  binary: 'https://github.com/multiversx/mx-chain-go/releases/tag/v2.0.6',
} as const

export function isBeforeSupernova(now = Date.now()): boolean {
  return now < Date.parse(SUPERNOVA.epochAtUtc)
}

export function supernovaBannerText(now = Date.now()): string | null {
  if (!isBeforeSupernova(now)) {
    return `Supernova live · epoch ${SUPERNOVA.epoch}+ · config ${SUPERNOVA.configRelease}`
  }
  const hours = Math.max(0, (Date.parse(SUPERNOVA.epochAtUtc) - now) / 3_600_000)
  return `Supernova epoch ${SUPERNOVA.epoch} · 10 sept 17:45 UTC (~${hours.toFixed(0)}h)`
}
