import test from 'node:test'
import assert from 'node:assert/strict'
import { agentManifest, runNetworkAgents } from './network-agents.mjs'

const NOW = Date.parse('2026-11-22T11:00:00Z')
const GENESIS = '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d'
function fixtureFetch(mutate = () => {}, requests = []) {
  return async (url, options) => {
    const body = options.body ? JSON.parse(options.body) : null
    requests.push({ url, options, body })
    let result
    if (url.endsWith('/network/config')) result = { code: 'successful', error: '', data: { config: {
      erd_chain_id: '1', erd_round_duration: 600, erd_num_shards_without_meta: 3 } } }
    else if (url.endsWith('/network/status/4294967295')) result = { code: 'successful', error: '', data: { status: {
      erd_nonce: 41724927, erd_highest_final_nonce: 41724927, erd_epoch_number: 2301,
      erd_block_timestamp: NOW / 1000 - 2 } } }
    else {
      const results = {
        getGenesisHash: GENESIS,
        getEpochInfo: { absoluteSlot: 472514650, blockHeight: 450528537, epoch: 1093, slotIndex: 338650, slotsInEpoch: 432000 },
        getRecentPerformanceSamples: [{ slot: 472514658, numSlots: 279, numTransactions: 120000,
          numNonVoteTransactions: 60000, samplePeriodSecs: 60 }],
        getBlockTime: NOW / 1000 - 12,
      }
      assert.ok(Object.hasOwn(results, body.method), 'only allowlisted read RPCs')
      result = { jsonrpc: '2.0', id: body.id, result: results[body.method] }
    }
    const replacement = mutate(result, body?.method || url)
    return replacement instanceof Response ? replacement : Response.json(result)
  }
}
const run = fetchImpl => runNetworkAgents({ fetchImpl, clock: () => NOW })

test('two real-shaped mainnet observations distinguish identity, finality, source age and non-vote TPS', async () => {
  const reports = await run(fixtureFetch())
  assert.deepEqual(reports.map(r => r.status), ['observed', 'observed'])
  const [mvx, sol] = reports
  assert.equal(mvx.network_id, '1')
  assert.equal(mvx.observations.scope, 'metachain_only')
  assert.equal(mvx.observations.configured_round_duration_ms, 600)
  assert.equal(mvx.observations.finality_gap_blocks, 0)
  assert.equal(mvx.block_age_seconds, 2)
  assert.equal(sol.network_id, GENESIS)
  assert.equal(sol.observations.commitment, 'finalized')
  assert.equal(sol.observations.transactions_per_second, 2000)
  assert.equal(sol.observations.non_vote_transactions_per_second, 1000)
  assert.equal(sol.block_age_seconds, 12)
  for (const report of reports) {
    assert.equal(report.identity_verified, true)
    assert.equal(report.stance, 'ABSTAIN')
    assert.equal(report.executable, false)
    assert.equal(report.model_inference_configured, false)
    assert.equal(report.independently_verified_market_signals, 0)
  }
})

test('manifest is a detached capability description, never a receipt of a running schedule', () => {
  const manifest = agentManifest()
  assert.equal(manifest.target_cron_utc, '*/15 * * * *')
  assert.equal(manifest.scheduled_state_requires_provider_receipt, true)
  assert.equal(manifest.linked_wallets, 0)
  manifest.agents[0].reads.push('transaction/send')
  assert.equal(agentManifest().agents[0].reads.includes('transaction/send'), false)
})

test('wrong mainnet identity stops that agent before further reads; the other still completes', async () => {
  for (const badNetwork of ['multiversx', 'solana']) {
    const requests = []
    const reports = await run(fixtureFetch((value, method) => {
      if (badNetwork === 'multiversx' && method.endsWith('/network/config')) value.data.config.erd_chain_id = 'D'
      if (badNetwork === 'solana' && method === 'getGenesisHash') value.result = 'devnet-genesis'
    }, requests))
    const rejected = reports.find(r => r.network === badNetwork)
    assert.equal(rejected.status, 'unavailable')
    assert.equal(rejected.reason, 'wrong_network_identity')
    assert.equal(Object.hasOwn(rejected, 'observations'), false)
    assert.equal(reports.find(r => r.network !== badNetwork).status, 'observed')
    if (badNetwork === 'solana') assert.equal(requests.filter(r => r.body).length, 1)
    else assert.equal(requests.filter(r => r.url.includes('multiversx')).length, 1)
  }
})

test('fresh checking time cannot refresh old chain data; future and missing times are unavailable', async () => {
  for (const offset of [-121, 6, null]) {
    const reports = await run(fixtureFetch((value, method) => {
      const time = offset === null ? null : NOW / 1000 + offset
      if (method.endsWith('/network/status/4294967295')) value.data.status.erd_block_timestamp = time
      if (method === 'getBlockTime') value.result = time
    }))
    for (const report of reports) {
      assert.equal(report.status, offset === -121 ? 'stale' : 'unavailable')
      assert.equal(report.checked_at, new Date(NOW).toISOString())
      assert.equal(report.executable, false)
    }
  }
})

test('RPC errors, wrong ids, inconsistent samples and unsafe counters fail without echoing provider text', async () => {
  const mutations = [
    value => { value.error = { message: 'SECRET-untrusted-instruction' } },
    value => { value.error = null },
    value => { value.id = 999 },
    value => { value.result = { absoluteSlot: Number.MAX_SAFE_INTEGER + 1 } },
    value => { value.result = null },
  ]
  for (const mutate of mutations) {
    const reports = await run(fixtureFetch((value, method) => { if (method === 'getEpochInfo') mutate(value) }))
    assert.equal(reports[1].status, 'unavailable')
    assert.equal(JSON.stringify(reports).includes('SECRET'), false)
  }
  for (const mutate of [
    sample => { sample.slot = 472514650 - 601 }, sample => { sample.samplePeriodSecs = 0 },
    sample => { sample.numNonVoteTransactions = sample.numTransactions + 1 }, sample => { sample.numSlots = -1 },
  ]) {
    const reports = await run(fixtureFetch((value, method) => {
      if (method === 'getRecentPerformanceSamples') mutate(value.result[0])
    }))
    assert.equal(reports[1].status, 'unavailable')
  }
})

test('missing non-vote count remains unknown, never guessed from all transactions', async () => {
  const reports = await run(fixtureFetch((value, method) => {
    if (method === 'getRecentPerformanceSamples') value.result[0].numNonVoteTransactions = null
  }))
  assert.equal(reports[1].status, 'observed')
  assert.equal(reports[1].observations.non_vote_transactions_per_second, null)
})

test('rate limits, oversized responses and network failures do not reuse another cycle', async () => {
  assert.equal((await run(fixtureFetch()))[0].status, 'observed')
  for (const fetchImpl of [async () => new Response('limited', { status: 429 }),
    async () => new Response('x'.repeat(8193)), async () => { throw new Error('SECRET') }]) {
    const reports = await run(fetchImpl)
    assert.ok(reports.every(r => r.status === 'unavailable' && !Object.hasOwn(r, 'observations')))
    assert.equal(JSON.stringify(reports).includes('SECRET'), false)
  }
})

test('all requests have a deadline, refuse redirects, use fixed hosts and never send financial methods', async () => {
  const requests = []
  await run(fixtureFetch(() => {}, requests))
  assert.equal(requests.length, 6)
  assert.deepEqual(new Set(requests.map(r => new URL(r.url).origin)), new Set(['https://gateway.multiversx.com', 'https://api.mainnet.solana.com']))
  assert.ok(requests.every(r => r.options.signal instanceof AbortSignal && r.options.redirect === 'error'))
  assert.ok(requests.every(r => r.options.signal.aborted), 'completed or failed agents cancel remaining work')
  const rpc = requests.filter(r => r.body)
  assert.deepEqual(rpc.find(r => r.body.method === 'getBlockTime').body.params, [472514650])
  assert.deepEqual(rpc.find(r => r.body.method === 'getEpochInfo').body.params, [{ commitment: 'finalized' }])
  assert.ok(rpc.every(r => /^get/.test(r.body.method)))
  assert.ok(requests.every(r => !Object.hasOwn(r.options.headers, 'authorization')))
})
