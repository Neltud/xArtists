/**
 * Narrow, safe smoke test for the restored xOrus OneDex access-api route.
 *
 * Never sends a valid swap intent: the sole POST is intentionally malformed
 * and occurs only AFTER the correct runtime SHA, paper flags and disabled
 * assisted mode have been independently confirmed by GET probes.
 *
 * Does not sign, call OneDex directly, pay, deploy, or change DNS.
 */
import { probeCandidate, validateCandidateUrl } from './probe-free-api-candidate.mjs'

const SHA = /^[a-f0-9]{40}$/
const ALLOWED_ORIGIN = 'https://xartists.art'
const TIMEOUT_MS = 8000

async function requestJson(url, { method = 'GET', body, fetchFn = fetch } = {}) {
  const opts = {
    method,
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      Accept: 'application/json',
      Origin: ALLOWED_ORIGIN,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  }
  const response = await fetchFn(url, opts)
  const allowOrigin = response.headers.get('access-control-allow-origin')
  if (allowOrigin !== ALLOWED_ORIGIN) throw Error('assisted_cors_not_exact_origin')
  if (response.status !== 200 && response.status !== 503)
    throw Error('assisted_unexpected_http_status')
  if (!String(response.headers.get('content-type') || '').toLowerCase().includes('application/json'))
    throw Error('assisted_invalid_content_type')
  const json = await response.json()
  if (!json || typeof json !== 'object' || Array.isArray(json))
    throw Error('assisted_invalid_json')
  return { status: response.status, body: json }
}

/**
 * Domain, identity, nontrading policy and GET mode must be verifiable.
 * No request is sent to OneDex by this probe.
 */
export async function probeAssistedDisabled({ origin, expectedSha, fetchFn = fetch } = {}) {
  const base = validateCandidateUrl(origin)
  if (!SHA.test(expectedSha || '')) throw Error('assisted_sha_required')

  // 4 GETs: existing trusted identity/status probe, strictly paper-only.
  const candidate = await probeCandidate({origin:base, expectedSha, fetchFn})
  if (candidate.candidate_identity_verified !== true ||
      candidate.production_commerce_go !== false)
    throw Error('assisted_candidate_identity_unsafe')

  // 5th request: exact public policy route.
  const get = await requestJson(base + '/v1/xorus/assisted-swap', {fetchFn})
  if (get.status !== 200) throw Error('assisted_policy_status_invalid')
  const policy = get.body
  if (policy.ok !== true || policy.mode !== 'assisted_only' ||
      policy.enabled !== false || policy.live_trading !== false ||
      policy.autonomous_execution !== false ||
      !policy.policy || typeof policy.policy !== 'object' ||
      !Array.isArray(policy.policy.allowed_tokens) ||
      policy.policy.allowed_tokens.length === 0)
    throw Error('assisted_policy_not_strictly_disabled')

  // 6th request: intentionally INVALID sender. Never a real wallet.
  // Even in an unexpected flag race, the malformed sender must fail policy
  // before any upstream MCP request. If gate has changed since GET, fail.
  const post = await requestJson(base + '/v1/xorus/assisted-swap', {
    method:'POST',
    body:{tokenIn:'EGLD',tokenOut:'ONE',amountIn:'0.1',sender:'invalid-public-address'},
    fetchFn,
  })
  if (post.status !== 503 || post.body.ok !== false ||
      post.body.stage !== 'blocked' ||
      post.body.error !== 'assisted_swap_not_enabled' ||
      post.body.build || post.body.signingLink || post.body.transaction)
    throw Error('assisted_post_gate_not_closed')

  return Object.freeze({
    candidate_identity_verified:true,
    source_sha:expectedSha,
    assisted_policy_get:'pass',
    assisted_post_disabled:'pass',
    cors_exact_origin:'pass',
    live_trading:false,
    signing:false,
    broadcast:false,
    commerce_go:false,
    deployment_verified_for:'source_and_disabled_route_only',
  })
}

if (process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href) {
  const args = process.argv.slice(2)
  const urlIdx = args.indexOf('--url'), shaIdx = args.indexOf('--sha')
  const origin = urlIdx >= 0 ? args[urlIdx + 1] : undefined
  const expectedSha = shaIdx >= 0 ? args[shaIdx + 1] : undefined
  try {
    console.log(JSON.stringify(await probeAssistedDisabled({origin,expectedSha}), null, 2))
  } catch (error) {
    const code = error instanceof Error ? error.message : ''
    console.error(/^((assisted|candidate)_[a-z_]+)$/.test(code) ? code : 'assisted_probe_failed')
    process.exitCode = 1
  }
}
