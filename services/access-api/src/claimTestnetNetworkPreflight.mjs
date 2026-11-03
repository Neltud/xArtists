/**
 * Read-only public MultiversX chain identity preflight.
 *
 * This is an OPERATOR preflight, NOT an on-chain chain ID proof.
 * It never signs, broadcasts, deploys, issues a claim or mutates DB state.
 * Fixed official gateways; deliberately no user-supplied endpoint/URL.
 */
const TESTNET_CONFIG = 'https://testnet-gateway.multiversx.com/network/config'
const MAINNET_CONFIG = 'https://gateway.multiversx.com/network/config'
const MAX_CONFIG_BYTES = 64 * 1024

function fail(reason) {
  return Object.assign(new Error(reason), { code: 'XA_TESTNET_PREFLIGHT_DENIED' })
}

export function validateNetworkConfig(payload, expectedChainId) {
  if (!['T','1'].includes(expectedChainId)) throw fail('unexpected_expected_chain_id')
  const config = payload?.data?.config
  if (payload?.code !== 'successful' || !config || typeof config !== 'object' ||
      config.erd_chain_id !== expectedChainId ||
      !Number.isSafeInteger(config.erd_min_transaction_version) ||
      config.erd_min_transaction_version < 1 ||
      !Number.isSafeInteger(config.erd_num_shards_without_meta) ||
      config.erd_num_shards_without_meta < 1) {
    throw fail('public_gateway_chain_config_inconsistent')
  }
  return Object.freeze({
    chain_id: config.erd_chain_id,
    min_transaction_version: config.erd_min_transaction_version,
    num_shards_without_meta: config.erd_num_shards_without_meta,
  })
}

async function readGatewayConfig(fixedUrl, request) {
  const response = await request(fixedUrl, {
    method: 'GET',
    redirect: 'error',
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(8_000),
  })
  if (!response?.ok || response.status !== 200) throw fail('public_gateway_not_available')
  if (response.url && response.url !== fixedUrl) throw fail('gateway_redirect_denied')
  const type = response.headers?.get?.('content-type') ?? ''
  if (type && !type.toLowerCase().includes('application/json')) {
    throw fail('unexpected_gateway_content_type')
  }
  const len = response.headers?.get?.('content-length')
  if (len != null && len !== '' && (!/^\d+$/.test(String(len)) || Number(len) > MAX_CONFIG_BYTES)) {
    throw fail('gateway_content_length_invalid')
  }
  // Stream and bound JSON body even when Content-Length is absent; a public
  // endpoint must not force an unbounded buffer allocation.
  let body
  if (response.body && typeof response.body.getReader === 'function') {
    const reader = response.body.getReader()
    let size = 0
    const chunks = []
    try {
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        if (!(value instanceof Uint8Array)) throw fail('gateway_body_not_bytes')
        size += value.byteLength
        if (size > MAX_CONFIG_BYTES) throw fail('gateway_json_too_large')
        chunks.push(value)
      }
    } finally {
      reader.releaseLock()
    }
    body = Buffer.concat(chunks.map(v => Buffer.from(v))).toString('utf8')
  } else {
    if (typeof response.text !== 'function') throw fail('gateway_response_not_readable')
    body = await response.text()
    if (Buffer.byteLength(body, 'utf8') > MAX_CONFIG_BYTES) throw fail('gateway_json_too_large')
  }
  try { return JSON.parse(body) }
  catch { throw fail('gateway_invalid_json') }
}

/**
 * A successful result means TWO provider responses had the expected chain IDs.
 * It does not prove runtime chain ID *inside* a deployed smart contract.
 */
export async function verifyPublicTestnetNetworkPreflight(request = fetch) {
  if (typeof request !== 'function') throw fail('fetch_unavailable')
  let testnet, mainnet
  try {
    testnet = validateNetworkConfig(
      await readGatewayConfig(TESTNET_CONFIG, request), 'T',
    )
    mainnet = validateNetworkConfig(
      await readGatewayConfig(MAINNET_CONFIG, request), '1',
    )
  } catch (e) {
    throw fail('public_testnet_preflight_failed:' + (e?.message || 'unknown'))
  }
  return Object.freeze({
    ok: true,
    action: 'read_only_public_gateway_probe',
    testnet_gateway: TESTNET_CONFIG,
    mainnet_reference: MAINNET_CONFIG,
    testnet_chain_id: testnet.chain_id,
    mainnet_chain_id: mainnet.chain_id,
    min_transaction_version: testnet.min_transaction_version,
    chain_id_verified_offchain_only: true,
    chain_id_verified_inside_sc: false,
    deployment_permitted_by_this_check: false,
    signer_permitted_by_this_check: false,
    commercial_rails_unchanged: 'NO-GO',
  })
}
