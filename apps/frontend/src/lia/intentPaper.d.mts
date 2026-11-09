export const SNAPSHOT_AS_OF: string
export const PACKS: Readonly<Record<string, {
  name: string
  tier: string
  eur: string
  editionCap: number
  snapshotEgld: string
}>>
export const POSTURE: Readonly<{
  probedAt: string
  source: string
  epoch: number
  roundsPassed: number
  roundsPerEpoch: number
  refreshRateMs: number
  egldUsd: string
  egldMarketCapUsd: string
  egldApr: string
  troId: string
  troSupply: string
  troAccounts: number
  troTransactions: number
  site: string
  trading: string
  packSales: string
  paybox: string
  krReviewWindow: string
  allowLiveTrading: false
}>
export type PaperIntent = Readonly<{
  intent: string
  reason?: string
  executable: false
  liveAuthorized: false
  pack?: string
  name?: string
  tier?: string
  rail?: string
  catalogueEur?: string | null
  snapshotEgld?: string | null
  snapshotAsOf?: string
  snapshotIsExecutableQuote?: false
  editionCap?: number
  sales?: string
  mediaUriVerified?: false
  paybox?: string
  posture?: typeof POSTURE
}>
export function quoteBuyPack(packId: string, rail: string): PaperIntent
export function classifyUtterance(text: string): PaperIntent
