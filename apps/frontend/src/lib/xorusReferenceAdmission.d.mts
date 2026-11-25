export type ReferenceAsset = Readonly<{
  symbol: 'EGLD' | 'SOL' | 'ETH' | 'POL'
  network: 'multiversx' | 'solana' | 'ethereum' | 'polygon'
  identity: 'native'
  swap_support_proven: false
}>

export type ReferenceQuoteManifest = Readonly<{
  schema_version: 1
  policy_id: 'xorus-reference-quotes-v1'
  status: 'schema_only_no_licensed_feed'
  executable: false
  execution_authorized: false
  signing_authorized: false
  trading_enabled: false
  independently_verified_market_signals: 0
  rights_status: 'no_market_data_used_or_commercially_licensed'
  valuation: 'not_a_fill_not_a_nav'
  feed: null
  quotes: readonly []
  universe: readonly ReferenceAsset[]
  accept_rules: Readonly<{
    max_age_ms: 15000
    require_source_url: true
    require_observed_at: true
    reject_if_marked_executable: true
    prices_are_not_collected_by_this_module: true
  }>
  checked_at: string
  published_runtime: 'not_on_current_neon_hub'
}>

export type AdmittedQuote = Readonly<{
  symbol: ReferenceAsset['symbol']
  network: ReferenceAsset['network']
  identity: 'native'
  price_micro_usd: number
  observed_at: string
  source_url: string
  swap_support_proven: false
  independently_verified: false
  usable_as_fill: false
}>

export type QuoteAssessment = Readonly<{
  ok: boolean
  error?: string
  executable: false
  execution_authorized: false
  signing_authorized: false
  quote?: AdmittedQuote
}>

export function referenceQuoteManifest(clock?: number | (() => number)): ReferenceQuoteManifest
export function assessReferenceQuote(input: unknown, now?: number): QuoteAssessment
