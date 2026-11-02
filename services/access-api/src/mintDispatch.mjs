/**
 * Post-IPN mint dispatch → GitHub Actions mint-on-payment.yml (mainnet).
 *
 * Env:
 *   MINT_DISPATCH_ENABLED=1
 *   GITHUB_TOKEN or MINT_GITHUB_PAT — repo scope workflow
 *   MINT_GITHUB_OWNER=Neltud
 *   MINT_GITHUB_REPO=xArtists
 *   MINT_WORKFLOW_FILE=mint-on-payment.yml
 *   MINT_REF=main
 *   MINT_MICRO_PRICE=true|false  (default true while deployer underfunded)
 *
 * Does NOT hold PEM. Chain mint runs only in Actions env production.
 */

const PACK_IDS = new Set(['pulse', 'yield', 'sentinel'])

export function mintDispatchConfig(env = process.env) {
  const token = String(env.MINT_GITHUB_PAT || env.GITHUB_TOKEN || '').trim()
  const enabled = String(env.MINT_DISPATCH_ENABLED || '').trim() === '1'
  const owner = String(env.MINT_GITHUB_OWNER || 'Neltud').trim()
  const repo = String(env.MINT_GITHUB_REPO || 'xArtists').trim()
  const workflow = String(env.MINT_WORKFLOW_FILE || 'mint-on-payment.yml').trim()
  const ref = String(env.MINT_REF || 'main').trim()
  const micro = String(env.MINT_MICRO_PRICE || 'true').toLowerCase() !== 'false'
  return {
    enabled: enabled && Boolean(token),
    token,
    owner,
    repo,
    workflow,
    ref,
    micro,
  }
}

/**
 * @param {{ packId: string, buyer: string, edition?: string|number, orderId?: string }}
 * @returns {Promise<{ ok: boolean, skipped?: boolean, reason?: string, status?: number, body?: unknown }>}
 */
export async function dispatchMintOnPayment(input, env = process.env) {
  const cfg = mintDispatchConfig(env)
  if (!cfg.enabled) {
    return { ok: false, skipped: true, reason: 'mint_dispatch_disabled_or_no_token' }
  }
  const pack = String(input.packId || '').toLowerCase()
  const buyer = String(input.buyer || '').trim()
  if (!PACK_IDS.has(pack)) {
    return { ok: false, reason: 'invalid_pack' }
  }
  if (!/^erd1[a-z0-9]{58}$/.test(buyer)) {
    return { ok: false, reason: 'invalid_buyer' }
  }
  const edition = String(input.edition ?? '1')
  const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/actions/workflows/${cfg.workflow}/dispatches`
  const body = {
    ref: cfg.ref,
    inputs: {
      pack,
      edition,
      buyer,
      live_mint: 'true',
      confirm: 'LIVE_MINT_MAINNET',
      micro_price: cfg.micro ? 'true' : 'false',
    },
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${cfg.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      'User-Agent': 'xartists-access-api-mint-dispatch',
    },
    body: JSON.stringify(body),
  })
  if (res.status === 204) {
    return {
      ok: true,
      status: 204,
      orderId: input.orderId || null,
      pack,
      buyer,
      micro: cfg.micro,
    }
  }
  let errBody = null
  try {
    errBody = await res.json()
  } catch {
    errBody = await res.text().catch(() => null)
  }
  return { ok: false, status: res.status, body: errBody, reason: 'github_dispatch_failed' }
}

/**
 * Call after order marked server_confirmed / paid.
 * Failures are logged by caller — never fail the IPN HTTP 200.
 */
export async function maybeDispatchMintAfterPaid(order, env = process.env) {
  if (!order || order.server_confirmed !== true && order.status !== 'paid') {
    return { ok: false, skipped: true, reason: 'order_not_paid' }
  }
  const packId = order.pack_id || order.packId
  const buyer = order.buyer_address || order.buyer || order.erd
  return dispatchMintOnPayment(
    { packId, buyer, edition: order.edition || 1, orderId: order.id || order.order_id },
    env,
  )
}
