import { useMultiversXContext } from '../context/MultiversXContext'

export type { Prices, LIAPortfolio, LIAStatus, XArtistsData, VoteOption, XExchangePool, BonData } from '../context/MultiversXContext'

/**
 * Returns shared MultiversX data from the single context provider.
 * All components using this hook share one polling interval (no duplicate timers).
 */
export function useMultiversX() {
  return useMultiversXContext()
}
