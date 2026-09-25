/**
 * Pools LP éligibles gouvernance DAO (vote weight).
 * Identifiers token / paires xExchange-style — match fuzzy sur ticker.
 */

export type EligiblePair = {
  id: string
  label: string
  /** Sous-chaînes pour matcher identifier / name token LP */
  match: string[]
}

export const ELIGIBLE_LP_PAIRS: EligiblePair[] = [
  { id: 'tro-usdc', label: 'TRO/USDC', match: ['TRO', 'USDC'] },
  { id: 'tro-mex', label: 'TRO/MEX', match: ['TRO', 'MEX'] },
  { id: 'tro-egld', label: 'TRO/EGLD', match: ['TRO', 'EGLD', 'WEGLD'] },
  { id: 'tro-usdt', label: 'TRO/USDT', match: ['TRO', 'USDT'] },
  { id: 'tro-wbtc', label: 'TRO/WBTC', match: ['TRO', 'WBTC', 'BTC'] },
  { id: 'tro-weth', label: 'TRO/WETH', match: ['TRO', 'WETH', 'ETH'] },
  { id: 'tro-xoxno', label: 'TRO/XOXNO', match: ['TRO', 'XOXNO'] },
  { id: 'tro-wdai', label: 'TRO/WDAI', match: ['TRO', 'WDAI', 'DAI'] },
]

/** ArtPass collection identifiers (fuzzy) */
export const ARTPASS_MATCH = ['ARTPASS', 'ART-PASS', 'XARTISTS', 'NFTUDURI']

export function matchEligiblePair(
  tokenId: string,
  tokenName?: string,
): EligiblePair | null {
  const hay = `${tokenId} ${tokenName || ''}`.toUpperCase()
  // Prefer explicit LP markers
  const isLp = /LP|LIQUIDITY|POOL/.test(hay) || hay.includes('/')
  for (const pair of ELIGIBLE_LP_PAIRS) {
    const ok = pair.match.every(m => hay.includes(m.toUpperCase()))
    if (ok && (isLp || pair.match.length >= 2)) return pair
  }
  return null
}

export function isArtPassNft(collection: string, name?: string): boolean {
  const hay = `${collection} ${name || ''}`.toUpperCase()
  return ARTPASS_MATCH.some(m => hay.includes(m))
}
