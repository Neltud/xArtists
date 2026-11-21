/** Logical ownership does not merge provider accounts or multiply free quotas. */
export const ORGANIZATION = 'xartists'
export const NETWORKS = Object.freeze({
  ethereum: { family: 'evm', chain_id: '1', signing: 'external_wallet' },
  base: { family: 'evm', chain_id: '8453', signing: 'external_wallet' },
  arbitrum: { family: 'evm', chain_id: '42161', signing: 'external_wallet' },
  optimism: { family: 'evm', chain_id: '10', signing: 'external_wallet' },
  polygon: { family: 'evm', chain_id: '137', signing: 'external_wallet' },
  blast: { family: 'evm', chain_id: '81457', signing: 'external_wallet' },
  solana: { family: 'solana', chain_id: 'mainnet', signing: 'external_wallet' },
  bitcoin: { family: 'bitcoin', chain_id: 'mainnet', signing: 'external_wallet' },
  multiversx: { family: 'multiversx', chain_id: '1', signing: 'external_wallet' },
})

const PLATFORMS = [
  { id: 'bitcoin', label: 'Bitcoin', kind: 'network', networks: ['bitcoin'],
    integration: 'technical_probe', probe_id: 'bitcoin',
    docs: 'https://mempool.space/docs/api/rest', wallet_link: 'not_implemented' },
  { id: 'solana', label: 'Solana', kind: 'network', networks: ['solana'],
    integration: 'technical_probe', probe_id: 'solana',
    docs: 'https://solana.com/docs/rpc/http', wallet_link: 'not_implemented' },
  { id: 'multiversx', label: 'MultiversX', kind: 'network', networks: ['multiversx'],
    integration: 'existing_app_connector', probe_id: null,
    docs: 'https://docs.multiversx.com/sdk-and-tools/dapp-core/', wallet_link: 'existing_app_proof_required' },
  { id: 'polymarket', label: 'Polymarket', kind: 'prediction_market', networks: ['polygon'],
    integration: 'technical_probe', probe_id: 'polymarket',
    docs: 'https://docs.polymarket.com/api-reference/data/get-server-time',
    geography: 'user_location_and_account_eligibility_required', known_blocked_country: 'FR',
    wallet_link: 'not_implemented' },
  { id: 'jupiter', label: 'Jupiter', kind: 'dex_aggregator', networks: ['solana'],
    integration: 'not_configured', probe_id: null,
    docs: 'https://dev.jup.ag/docs', wallet_link: 'not_implemented' },
  { id: 'kraken', label: 'Kraken', kind: 'centralized_exchange', networks: [],
    integration: 'technical_probe', probe_id: 'kraken',
    docs: 'https://docs.kraken.com/api/docs/rest-api/get-server-time/',
    account_api_required: true, wallet_link: 'not_applicable' },
  { id: 'metawin', label: 'MetaWin', kind: 'gaming',
    networks: ['ethereum', 'base', 'arbitrum', 'optimism', 'polygon', 'blast', 'solana'],
    integration: 'manual_only', probe_id: null,
    docs: 'https://metawin.com/faq/',
    geography: 'user_location_account_and_game_eligibility_unverified',
    automation_api: 'official_public_api_not_verified', wallet_link: 'not_implemented',
    note: 'FAQ network list; BTC acceptance does not prove a native BTC Web3 connection.' },
]

export function platformRegistry() {
  return {
    organization_id: ORGANIZATION, organization_model: 'one_logical_organization',
    provider_account_merge_performed: false, shared_quota_multiplication: false,
    mode: 'read_only', execution_authorized: false,
    custody_enabled: false, signing_authorized: false, linked_wallets: 0,
    platforms: structuredClone(PLATFORMS), networks: structuredClone(NETWORKS),
    costs: { hosting_target: 'neon_free', network_and_venue_fees_included: false,
      model_inference_configured: false, unlimited_or_hft_service: false },
  }
}

/** This is a compatibility plan, never proof of ownership or an authorization. */
export function walletRoutePlan(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) ||
      Object.keys(input).some(k => !['platform', 'network'].includes(k)) ||
      typeof input.platform !== 'string' || typeof input.network !== 'string') {
    return { ok: false, error: 'only_platform_and_network_accepted' }
  }
  const platform = PLATFORMS.find(p => p.id === input.platform)
  const network = Object.hasOwn(NETWORKS, input.network) ? NETWORKS[input.network] : null
  if (!platform || !network) return { ok: false, error: 'unknown_platform_or_network' }
  if (!platform.networks.includes(input.network)) {
    return { ok: false, error: platform.account_api_required ? 'exchange_account_api_required' : 'network_not_supported' }
  }
  return {
    ok: true, organization_id: ORGANIZATION, platform: platform.id, network: input.network,
    wallet_family: network.family, chain_id: network.chain_id,
    signing_location: 'user_wallet', custody_enabled: false,
    ownership_verified: false, connected: false, executable: false,
    connection_implemented: platform.wallet_link === 'existing_app_proof_required',
    next_step: platform.integration === 'manual_only' ? 'verify_platform_rules_and_connect_manually' : 'implement_and_verify_wallet_ownership',
    geo_eligibility: 'not_verified', server_region_grants_eligibility: false,
    transfers_created: false, approvals_created: false,
  }
}
