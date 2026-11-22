import { boundedText } from './probes.mjs'

export const CYCLE_MS = 15 * 60_000
export const RECEIPT_MAX_AGE_MS = 30 * 60_000
export const CYCLE_CRON = '*/15 * * * *'
const MVX = 'https://gateway.multiversx.com'
const SOLANA = 'https://api.mainnet.solana.com'
const SOLANA_MAINNET_GENESIS = '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d'
const MAX_BLOCK_AGE_SECONDS = 120
const SAFETY = Object.freeze({ kind: 'network_observation', implementation: 'deterministic_rules_v1',
  model_inference_configured: false, execution_authorized: false, executable: false,
  signing_authorized: false, independently_verified_market_signals: 0, stance: 'ABSTAIN' })
const AGENTS = [
  { id: 'multiversx-network-observer', network: 'multiversx', expected_network_id: '1',
    endpoint: MVX, reads: ['network/config', 'network/status/4294967295'], scope: 'metachain_only' },
  { id: 'solana-network-observer', network: 'solana', expected_network_id: SOLANA_MAINNET_GENESIS,
    endpoint: SOLANA, reads: ['getGenesisHash', 'getEpochInfo', 'getRecentPerformanceSamples', 'getBlockTime'],
    commitment: 'finalized' },
]

export function agentManifest() {
  return { ...SAFETY, target_cron_utc: CYCLE_CRON, receipt_max_age_seconds: RECEIPT_MAX_AGE_MS / 1000,
    max_block_age_seconds: MAX_BLOCK_AGE_SECONDS, scheduled_state_requires_provider_receipt: true,
    linked_wallets: 0, agents: structuredClone(AGENTS) }
}

class ObservationError extends Error {}
function requireValue(condition, reason = 'invalid_network_response') {
  if (!condition) throw new ObservationError(reason)
}
const uint = value => Number.isSafeInteger(value) && value >= 0
const positive = value => uint(value) && value > 0
const round = value => Math.round(value * 100) / 100

async function requestJson(fetchImpl, url, signal, body) {
  const response = await fetchImpl(url, { method: body ? 'POST' : 'GET', redirect: 'error', signal,
    headers: { accept: 'application/json', ...(body ? { 'content-type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}) })
  if (!response.ok) {
    await response.body?.cancel().catch(() => {})
    throw new ObservationError(response.status === 429 ? 'upstream_rate_limited' : 'upstream_http_error')
  }
  try { return JSON.parse(await boundedText(response, 8192)) }
  catch { throw new ObservationError('invalid_or_oversize_response') }
}

function blockAge(timestampSeconds, now) {
  requireValue(positive(timestampSeconds), 'block_time_unavailable')
  const age = (now - timestampSeconds * 1000) / 1000
  requireValue(Number.isFinite(age) && age >= -5, 'future_block_time')
  return round(Math.max(0, age))
}

async function observeMultiversx({ fetchImpl, clock, signal }) {
  const configEnvelope = await requestJson(fetchImpl, MVX + '/network/config', signal)
  const config = configEnvelope.data?.config
  requireValue(configEnvelope.code === 'successful' && configEnvelope.error === '' && config)
  requireValue(config.erd_chain_id === '1', 'wrong_network_identity')
  requireValue(positive(config.erd_round_duration) && positive(config.erd_num_shards_without_meta))
  // Exactly two sequential requests: stay within the public API's 2 requests/IP/second.
  const statusEnvelope = await requestJson(fetchImpl, MVX + '/network/status/4294967295', signal)
  const status = statusEnvelope.data?.status
  requireValue(statusEnvelope.code === 'successful' && statusEnvelope.error === '' && status)
  requireValue(positive(status.erd_nonce) && uint(status.erd_epoch_number) &&
    uint(status.erd_highest_final_nonce) && status.erd_highest_final_nonce <= status.erd_nonce)
  // Use the node's block timestamp, never nonce * round duration (protocol upgrades change it).
  const age = blockAge(status.erd_block_timestamp, clock())
  return { network_id: config.erd_chain_id, identity_verified: true,
    source_data_at: new Date(status.erd_block_timestamp * 1000).toISOString(), block_age_seconds: age,
    status: age <= MAX_BLOCK_AGE_SECONDS ? 'observed' : 'stale',
    reason: age <= MAX_BLOCK_AGE_SECONDS ? 'recent_metachain_observed' : 'block_data_too_old',
    observations: { scope: 'metachain_only', nonce: status.erd_nonce,
      highest_final_nonce: status.erd_highest_final_nonce,
      finality_gap_blocks: status.erd_nonce - status.erd_highest_final_nonce,
      epoch: status.erd_epoch_number, configured_round_duration_ms: config.erd_round_duration,
      regular_shards: config.erd_num_shards_without_meta } }
}

async function observeSolana({ fetchImpl, clock, signal }) {
  async function rpc(id, method, params = []) {
    const value = await requestJson(fetchImpl, SOLANA, signal, { jsonrpc: '2.0', id, method, params })
    requireValue(value.jsonrpc === '2.0' && value.id === id && !Object.hasOwn(value, 'error') && Object.hasOwn(value, 'result'), 'invalid_rpc_response')
    return value.result
  }
  const genesis = await rpc(1, 'getGenesisHash')
  requireValue(genesis === SOLANA_MAINNET_GENESIS, 'wrong_network_identity')
  const [epoch, samples] = await Promise.all([
    rpc(2, 'getEpochInfo', [{ commitment: 'finalized' }]), rpc(3, 'getRecentPerformanceSamples', [1]),
  ])
  requireValue(epoch && positive(epoch.absoluteSlot) && positive(epoch.blockHeight) && epoch.blockHeight <= epoch.absoluteSlot && uint(epoch.epoch) &&
    uint(epoch.slotIndex) && positive(epoch.slotsInEpoch) && epoch.slotIndex < epoch.slotsInEpoch)
  requireValue(Array.isArray(samples) && samples.length === 1)
  const sample = samples[0]
  requireValue(sample && positive(sample.slot) && positive(sample.samplePeriodSecs) && sample.samplePeriodSecs <= 120 &&
    positive(sample.numSlots) && uint(sample.numTransactions) &&
    (sample.numNonVoteTransactions == null || (uint(sample.numNonVoteTransactions) && sample.numNonVoteTransactions <= sample.numTransactions)))
  // Performance data must come from the same recent slot range; no stale TPS fallback.
  requireValue(Math.abs(sample.slot - epoch.absoluteSlot) <= 600, 'performance_sample_too_far_from_finalized_slot')
  const timestamp = await rpc(4, 'getBlockTime', [epoch.absoluteSlot])
  const age = blockAge(timestamp, clock())
  return { network_id: genesis, identity_verified: true,
    source_data_at: new Date(timestamp * 1000).toISOString(), block_age_seconds: age,
    status: age <= MAX_BLOCK_AGE_SECONDS ? 'observed' : 'stale',
    reason: age <= MAX_BLOCK_AGE_SECONDS ? 'recent_finalized_slot_observed' : 'block_data_too_old',
    observations: { commitment: 'finalized', absolute_slot: epoch.absoluteSlot,
      block_height: epoch.blockHeight, epoch: epoch.epoch, slot_index: epoch.slotIndex,
      slots_in_epoch: epoch.slotsInEpoch, performance_sample_slot: sample.slot,
      sample_period_seconds: sample.samplePeriodSecs,
      transactions_per_second: round(sample.numTransactions / sample.samplePeriodSecs),
      non_vote_transactions_per_second: sample.numNonVoteTransactions == null ? null : round(sample.numNonVoteTransactions / sample.samplePeriodSecs),
      sampled_slot_duration_ms: round(sample.samplePeriodSecs * 1000 / sample.numSlots) } }
}

/** Two bounded, independent observers. No keys, balances, quote endpoints, signers or order tools. */
export async function runNetworkAgents({ fetchImpl = fetch, clock = Date.now } = {}) {
  const implementations = [observeMultiversx, observeSolana]
  return Promise.all(AGENTS.map(async (agent, index) => {
    const started = clock()
    const controller = new AbortController()
    const base = { ...SAFETY, agent_id: agent.id, network: agent.network,
      endpoint: agent.endpoint, max_block_age_seconds: MAX_BLOCK_AGE_SECONDS }
    try {
      const result = await implementations[index]({ fetchImpl, clock,
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)]) })
      return { ...base, ...result, checked_at: new Date(clock()).toISOString(), duration_ms: Math.max(0, clock() - started) }
    } catch (error) {
      return { ...base, status: 'unavailable', identity_verified: false,
        reason: error instanceof ObservationError ? error.message : 'timeout_or_network_error',
        checked_at: new Date(clock()).toISOString(), duration_ms: Math.max(0, clock() - started) }
    } finally { controller.abort() }
  }))
}
