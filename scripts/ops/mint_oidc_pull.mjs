/**
 * Short-lived GitHub OIDC proof -> Render API, then ephemeral GITHUB_TOKEN
 * -> dry-run mint workflow. No long-lived PAT, no mainnet, no synthetic paid order.
 * Missing acknowledgement NEVER triggers automatic retry: PostgreSQL claim persists.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'

const API = 'https://xartists-access-api.onrender.com'
const RUN = 'https://api.github.com/repos/Neltud/xArtists/actions/workflows/mint-on-payment.yml/dispatches'
const ENDPOINT = API + '/v1/ops/mint-oidc-pull'
const MAX_BATCH = 3

function summary(message) {
  console.log(message)
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, '\n' + message + '\n')
  }
}

if (process.env.GITHUB_REPOSITORY !== 'Neltud/xArtists' ||
    process.env.GITHUB_REF !== 'refs/heads/main' ||
    !['schedule', 'workflow_dispatch'].includes(process.env.GITHUB_EVENT_NAME)) {
  throw new Error('untrusted_workflow_context')
}
assert.ok(process.env.GITHUB_TOKEN, 'ephemeral_github_token_missing')

const healthRes = await fetch(API + '/health', {
  signal: AbortSignal.timeout(25000),
  headers: { Accept: 'application/json' },
})
assert.equal(healthRes.status, 200)
const health = await healthRes.json()
assert.equal(health.service, 'access-api')
assert.equal(health.ok, true)
assert.equal(health.mint_dry_run, true)
assert.equal(health.mint_live_enabled, false)
assert.equal(health.mint_micro_price, false)
assert.equal(String(health.lia_live_trading), '0')
assert.equal(health.tro_solana_bridge, 'off')

if (health.mint_oidc_pull_enabled !== true) {
  summary('PASS: OIDC pull DISABLED on Render. No dispatch, payment or NFT operation.')
  process.exit(0)
}

const reqUrl = new URL(process.env.ACTIONS_ID_TOKEN_REQUEST_URL || '')
assert.equal(reqUrl.protocol, 'https:')
reqUrl.searchParams.set('audience', 'xartists-render-mint-pull-v1')
const issuerRes = await fetch(reqUrl, {
  headers: { Authorization: 'Bearer ' + process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN },
  signal: AbortSignal.timeout(10000),
})
assert.equal(issuerRes.status, 200, 'GitHub OIDC identity not issued')
const issued = await issuerRes.json()
const oidc = issued.value
assert.match(oidc, /^[A-Za-z0-9_.-]+$/)

async function callApi(action) {
  const r = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + oidc,
    },
    body: JSON.stringify(action),
    signal: AbortSignal.timeout(20000),
  })
  if (r.status === 401) throw new Error('OIDC identity denied by Render')
  if (r.status === 503) throw new Error('OIDC pull disabled during run')
  if (r.status !== 200 && r.status !== 409) throw new Error('Render queue HTTP ' + r.status)
  return { status: r.status, data: await r.json() }
}

const list = await callApi({ action: 'list' })
assert.equal(list.status, 200)
assert.equal(list.data.ok, true)
assert.ok(Array.isArray(list.data.orders))
let examined = 0
let accepted = 0
let skipped = 0
for (const o of list.data.orders.slice(0, MAX_BATCH)) {
  examined++
  const claimed = await callApi({ action: 'claim', order_id: o.order_id })
  if (claimed.status === 409 && claimed.data.reason === 'already_claimed_or_dispatched') {
    skipped++
    continue
  }
  assert.equal(claimed.status, 200, 'claim rejected')
  assert.equal(claimed.data.ok, true)
  const { inputs, claim_id } = claimed.data
  assert.equal(inputs.live_mint, 'false')
  assert.equal(inputs.confirm, 'DRY_RUN')
  assert.equal(inputs.micro_price, 'false')
  assert.match(inputs.order_id, /^[A-Za-z0-9_-]{1,64}$/)
  assert.match(inputs.buyer, /^erd1[a-z0-9]{58}$/)

  // Claim is durable before this request. A crash leaves reconciliation_required
  // or dispatching state and cannot cause duplicate auto-dispatch.
  let githubStatus = 0
  try {
    const r = await fetch(RUN, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + process.env.GITHUB_TOKEN,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ref: 'main', inputs }),
      signal: AbortSignal.timeout(20000),
    })
    githubStatus = r.status
  } catch {
    githubStatus = 0
  }

  const ack = await callApi({
    action: 'ack',
    order_id: inputs.order_id,
    claim_id,
    github_status: githubStatus,
  })
  assert.equal(ack.status, 200, 'ack needs human reconciliation')
  assert.equal(ack.data.ok, true)
  if (githubStatus !== 204) {
    throw new Error('GitHub rejected or timed out; durable claim requires manual reconciliation')
  }
  assert.equal(ack.data.status, 'submitted')
  assert.equal(ack.data.delivery_verified, false)
  accepted++
}
summary('OIDC dry-run pull: candidate orders=' + examined +
  ', GitHub HTTP 204=' + accepted + ', already reserved=' + skipped +
  '. Submitted is not delivered. No live on-chain effects.')
