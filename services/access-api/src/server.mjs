/**
 * Access API — JWT, SIWX, Paybox System (v8.3).
 * Paybox IPN: RSA-SHA256 / 2048 only. Buyer identity: JWT or SIWX.
 * Post-IPN: optional mintDispatch (dry_run default; live needs explicit env gates).
 * Signals: read-only daily signal (never executes trades).
 */
import http from 'node:http'
import { resolveAccessLevel, issueAccessToken, verifyJwt } from './verifyAccess.mjs'
import { createChallenge, verifySignedChallenge, requireSiwx } from './siwx.mjs'
import { moonpayConfig, signMoonpayUrl } from './moonpay.mjs'
import {
  payboxConfig, payboxCheckoutEnabled, createPayboxSession, verifyPayboxIpn, extractRawSignedData, resolveIpnAuthenticatedSource, IPN_POLICY,
} from './paybox.mjs'
import {
  createOrder, getOrder, getOrderForBuyer, applyIpn, markRedirected, newOrderId, resolveArtistBeneficiary,
  triggerMintDispatchSafe, publicOrderDelivery, probeOrdersStore,
} from './orders.mjs'
import { resolveAuthenticatedBuyer } from './buyerAuth.mjs'
import { buildPackQuote } from './quote.mjs'
import { loadDailySignal } from './signals.mjs'
import { mintDispatchConfig } from './mintDispatch.mjs'
import { oidcMintPullEnabled, verifyGitHubOidc, eligibleOidcOrders, claimOidcMintOrder, ackOidcMintOrder } from './mintOidcPull.mjs'
import { loadOrders } from './orders.mjs'
import { troBridgeStatus } from './troBridgeStatus.mjs'
import {studioMediaConfig,mediaJwt,mediaActor,readCreatorMedia,
  uploadStudioMedia,pinStudioMetadata} from './creatorMedia.mjs'
import {
  physicalConfig, issuePhysicalSession, physicalActor, merchantAuthorized,
  registerPhysicalWork, readPhysicalWork, changePhysicalWork,
  processShopifyPhysicalWebhook, readPhysicalRaw,
} from './physicalFulfillment.mjs'

const PORT = Number(process.env.PORT || 8787)
const JWT_SECRET = process.env.ACCESS_JWT_SECRET || process.env.JWT_SECRET || ''
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || ''
const CORS = process.env.CORS_ORIGIN || '*'
const RENDER_PUBLIC_FRONTEND = 'https://xartists-services-and-products.onrender.com'

// The canonical Pages origin is configured by CORS_ORIGIN in production.
// The second official frontend is hosted on Render. Match exact origins;
// never reflect arbitrary websites or send Access-Control-Allow-Credentials.
function responseCorsOrigin(origin) {
  if (CORS === '*') return '*'
  if (origin === CORS || origin === RENDER_PUBLIC_FRONTEND) return origin
  // Retain the legacy non-browser behavior for probes without Origin.
  if (!origin) return CORS
  return null
}
const MOONPAY = moonpayConfig()
const PAYBOX = payboxConfig()
const MINT_CFG = mintDispatchConfig()
const moonpayHits = new Map()
const MOONPAY_WINDOW_MS = 60_000
const MOONPAY_MAX = 30

const PACK_CATALOG = {
  pulse: { id: 'pulse', name: 'Pulse Pack (Gold)', price_eur: 110, price_cents: 11000 },
  yield: { id: 'yield', name: 'Yield Pack (Silver)', price_eur: 75, price_cents: 7500 },
  sentinel: { id: 'sentinel', name: 'Sentinel Pack (Platinum)', price_eur: 50, price_cents: 5000 },
}

function getPack(packId) {
  const p = PACK_CATALOG[(packId || '').toLowerCase()]
  if (!p) throw new Error(`unknown_pack_id: ${packId}`)
  return p
}

function envFxRate() {
  const n = Number(process.env.EGLD_EUR_RATE || process.env.ACCESS_FX_EUR_PER_EGLD || '')
  return Number.isFinite(n) && n > 0 ? n : null
}

function json(res, code, body) {
  const origin = responseCorsOrigin(res.req?.headers?.origin)
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-store',
    'Vary': 'Origin',
  }
  if (origin) headers['Access-Control-Allow-Origin'] = origin
  res.writeHead(code, headers)
  res.end(body === undefined ? '' : JSON.stringify(body))
}

async function readRawAndBody(req) {
  const chunks = []
  let size = 0
  for await (const c of req) {
    size += c.length
    if (size > 16_384) throw Object.assign(new Error('body_too_large'), { statusCode: 413 })
    chunks.push(c)
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return { raw: '', body: {} }
  const ct = String(req.headers['content-type'] || '')
  if (ct.includes('application/x-www-form-urlencoded')) {
    return { raw, body: Object.fromEntries(new URLSearchParams(raw)) }
  }
  try {
    const body = JSON.parse(raw)
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('invalid_json')
    return { raw, body }
  } catch {
    throw Object.assign(new Error('invalid_json'), { statusCode: 400 })
  }
}

function publicBase() {
  return String(process.env.ACCESS_PUBLIC_BASE || process.env.CORS_ORIGIN || 'https://neltud.github.io').replace(/\/$/, '')
}

async function handleRequest(req, res) {
  if (req.method === 'OPTIONS') { json(res, 204, {}); return }
  const u = new URL(req.url || '/', `http://127.0.0.1:${PORT}`)
  const pth = u.pathname.replace(/\/$/, '') || '/'

  if (req.method === 'GET' && pth === '/health') {
    json(res, 200, {
      ok: true,
      jwt: JWT_SECRET.length >= 16,
      require_siwx: requireSiwx(),
      moonpay_configured: Boolean(MOONPAY.ready),
      moonpay_mode: MOONPAY.ready ? MOONPAY.mode : 'off',
      stripe_configured: Boolean(STRIPE_KEY),
      paybox_configured: PAYBOX.ready,
      paybox_checkout_enabled: payboxCheckoutEnabled(),
      paybox_mode: PAYBOX.ready ? PAYBOX.mode : 'off',
      paybox_auth_outbound: 'hmac_sha512',
      paybox_auth_inbound: 'rsa_sha256_2048',
      paybox_ipn_policy: IPN_POLICY,
      fx_env_configured: envFxRate() != null,
      lia_live_trading: process.env.LIA_LIVE_TRADING === '1' ? '1' : '0',
      mint_dispatch_enabled: MINT_CFG.enabled,
      mint_oidc_pull_enabled: oidcMintPullEnabled(),
      mint_dry_run: MINT_CFG.dryRun,
      mint_live_enabled: MINT_CFG.liveEnabled,
      mint_micro_price: MINT_CFG.micro,
      signals_daily: true,
      service: 'access-api',
      packs: Object.keys(PACK_CATALOG),
      orders_backend: process.env.DATABASE_URL ? 'postgres' : 'file',
      physical_works: physicalConfig().enabled ? 'configured' : 'off',
      physical_store: physicalConfig().storage,
      studio_media_upload:studioMediaConfig().enabled ? 'pinata_ipfs' : 'off',
      tro_solana_bridge:'off',
    })
    return
  }



  // Separate operational dependency check: /health intentionally stays fast
  // and does not pretend that DATABASE_URL guarantees a working database.
  // Safe for public monitoring: SELECT only, no PII, no SQL errors or secrets.
  if (req.method === 'GET' && pth === '/v1/ops/orders-store/status') {
    const status = await probeOrdersStore()
    json(res, status.ok ? 200 : 503, status)
    return
  }

  // Secretless GitHub OIDC mint-pull: hard-disabled by default, PostgreSQL only.
  // This route never signs, mints, sends a chain transaction or confirms delivery.
  if (req.method === 'POST' && pth === '/v1/ops/mint-oidc-pull') {
    if (!oidcMintPullEnabled()) {
      json(res, 503, { ok: false, error: 'oidc_pull_disabled' })
      return
    }
    // Identity must be cryptographically verified before reading buyer records.
    let identity
    try {
      identity = await verifyGitHubOidc(req.headers.authorization)
    } catch {
      json(res, 401, { ok: false, error: 'github_oidc_denied' })
      return
    }
    const { body } = await readRawAndBody(req)
    if (body.action === 'list') {
      const db = await loadOrders()
      json(res, 200, { ok: true, orders: eligibleOidcOrders(db) })
      return
    }
    if (body.action === 'claim') {
      const id = String(body.order_id || '')
      if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) {
        json(res, 400, { ok: false, error: 'invalid_order_id' })
        return
      }
      const order = await getOrder(id)
      const result = await claimOidcMintOrder(order, identity)
      json(res, result.ok ? 200 : 409, result)
      return
    }
    if (body.action === 'ack') {
      const result = await ackOidcMintOrder(body, identity)
      json(res, result.ok ? 200 : 409, result)
      return
    }
    json(res, 400, { ok: false, error: 'unknown_action' })
    return
  }

  // The TRO Solana bridge and direct sale are not deployed.
  // Read-only status, intentionally no deposits, quotes or automated signing.
  if (req.method === 'GET' && pth === '/v1/tro/bridge/status') {
    json(res,200,troBridgeStatus())
    return
  }

  // Artist-owned image/video IPFS upload, disabled unless PINATA_JWT + PG + explicit gate.
  // The wallet alone signs the mint; this backend does NOT submit any tx.
  if (req.method === 'GET' && pth === '/v1/studio/media/config') {
    json(res,200,{ok:true,...studioMediaConfig(),mint_requires_artist_signature:true})
    return
  }
  if (req.method === 'POST' && pth === '/v1/studio/media/challenge') {
    if (!studioMediaConfig().enabled) {
      json(res,503,{ok:false,error:'studio_upload_not_configured'});return
    }
    const {body}=await readRawAndBody(req)
    try{
      const ch=createChallenge(String(body.address||'').trim(),Date.now(),'studio_media')
      json(res,200,{ok:true,...ch})
    }catch{json(res,400,{ok:false,error:'invalid_creator_challenge'})}
    return
  }
  if (req.method === 'POST' && pth === '/v1/studio/media/session') {
    if (!studioMediaConfig().enabled) {
      json(res,503,{ok:false,error:'studio_upload_not_configured'});return
    }
    const {body}=await readRawAndBody(req)
    const address=String(body.address||'').trim()
    const valid=typeof body.message==='string'
      && body.message.startsWith('xArtists Creator Studio media upload login\n')
      && verifySignedChallenge({address,message:body.message,
        nonce:body.nonce,signature:body.signature})
    if(!valid){json(res,401,{ok:false,error:'studio_media_siwx_invalid'});return}
    try{json(res,200,{ok:true,...mediaJwt(address,JWT_SECRET)})}
    catch{json(res,401,{ok:false,error:'media_session_unavailable'})}
    return
  }
  if (req.method === 'POST' && pth === '/v1/studio/media/upload') {
    if (!studioMediaConfig().enabled) {
      json(res,503,{ok:false,error:'studio_upload_not_configured'});return
    }
    const actor=mediaActor(req.headers,JWT_SECRET)
    if(!actor){json(res,401,{ok:false,error:'studio_media_wallet_required'});return}
    try{
      const media=await readCreatorMedia(req)
      const result=await uploadStudioMedia(media,actor)
      json(res,201,{ok:true,...result})
    }catch(e){
      json(res,e.statusCode||503,{ok:false,error:e.statusCode?e.message:'media_upload_unavailable'})
    }
    return
  }
  if (req.method === 'POST' && pth === '/v1/studio/media/metadata') {
    if (!studioMediaConfig().enabled) {
      json(res,503,{ok:false,error:'studio_upload_not_configured'});return
    }
    const actor=mediaActor(req.headers,JWT_SECRET)
    if(!actor){json(res,401,{ok:false,error:'studio_media_wallet_required'});return}
    const {body}=await readRawAndBody(req)
    try{json(res,200,{ok:true,...await pinStudioMetadata(actor,body)})}
    catch(e){json(res,e.statusCode||503,
      {ok:false,error:e.statusCode?e.message:'media_metadata_unavailable'})}
    return
  }

  // Physical work fulfillment is a separate, opt-in channel from PayBox packs.
  // No NFT mint, payment capture, escrow release, NFT transfer or AI appraisal.
  if (req.method === 'GET' && pth === '/v1/physical/config') {
    json(res, 200, { ok: true, ...physicalConfig(),
      shopify_webhook_registered: 'operator_must_verify',
      automatic_escrow_release: false, automatic_nft_transfer: false })
    return
  }

  if (req.method === 'POST' && pth === '/v1/webhooks/shopify/physical') {
    if (!physicalConfig().enabled) {
      json(res, 503, { ok: false, error: 'physical_fulfillment_not_configured' })
      return
    }
    const raw = await readPhysicalRaw(req)
    try {
      const result = await processShopifyPhysicalWebhook(raw, req.headers)
      json(res, 200, result)
    } catch (error) {
      json(res, error.statusCode || 503, { ok: false,
        error: error.statusCode ? error.message : 'physical_webhook_store_unavailable' })
    }
    return
  }

  if (req.method === 'POST' && pth === '/v1/physical/challenge') {
    if (!physicalConfig().enabled) {
      json(res, 503, { ok: false, error: 'physical_fulfillment_not_configured' })
      return
    }
    const { body } = await readRawAndBody(req)
    try {
      const challenge = createChallenge(String(body.address || '').trim(), Date.now(), 'physical')
      json(res, 200, { ok: true, ...challenge })
    } catch {
      json(res, 400, { ok: false, error: 'invalid_physical_challenge' })
    }
    return
  }

  if (req.method === 'POST' && pth === '/v1/physical/session') {
    if (!physicalConfig().enabled) {
      json(res, 503, { ok: false, error: 'physical_fulfillment_not_configured' })
      return
    }
    const { body } = await readRawAndBody(req)
    const address = String(body.address || '').trim()
    const accepted = typeof body.message === 'string' && body.message.startsWith('xArtists physical artwork login\n') && verifySignedChallenge({
      address, message: body.message, nonce: body.nonce, signature: body.signature,
    })
    if (!accepted) { json(res, 401, { ok: false, error: 'physical_siwx_invalid' }); return }
    try {
      const issued = issuePhysicalSession(address, JWT_SECRET)
      json(res, 200, { ok: true, ...issued })
    } catch { json(res, 401, { ok: false, error: 'physical_session_unavailable' }) }
    return
  }

  if (req.method === 'POST' && pth === '/v1/physical/works') {
    if (!physicalConfig().enabled) {
      json(res, 503, { ok: false, error: 'physical_fulfillment_not_configured' }); return
    }
    const actor = physicalActor(req.headers, JWT_SECRET)
    if (!actor) { json(res, 401, { ok: false, error: 'physical_wallet_auth_required' }); return }
    const { body } = await readRawAndBody(req)
    try { json(res, 201, { ok: true, work: await registerPhysicalWork(body, actor) }) }
    catch (e) { json(res, e.statusCode || 503, { ok: false, error: e.statusCode ? e.message : 'work_store_unavailable' }) }
    return
  }

  if (pth.startsWith('/v1/physical/works/')) {
    if (!physicalConfig().enabled) {
      json(res, 503, { ok: false, error: 'physical_fulfillment_not_configured' }); return
    }
    const parts = pth.slice('/v1/physical/works/'.length).split('/')
    const id = parts[0]
    const action = parts[1] || ''
    if (req.method === 'GET' && !action) {
      const actor = physicalActor(req.headers, JWT_SECRET)
      if (!actor) { json(res, 401, { ok: false, error: 'physical_wallet_auth_required' }); return }
      try {
        const work = await readPhysicalWork(id, actor)
        json(res, work ? 200 : 404, work ? { ok: true, work } : { ok: false, error: 'work_not_found' })
      } catch (e) {
        json(res, e.statusCode || 503, { ok: false, error: e.statusCode ? e.message : 'work_store_unavailable' })
      }
      return
    }
    const actionMap = { 'bind-buyer': 'bind_buyer', 'receipt': 'receipt', 'reassess': 'reassess', 'verify-nft': 'verify_nft' }
    if (req.method === 'POST' && actionMap[action] && parts.length === 2) {
      const isAdmin = action === 'bind-buyer' && merchantAuthorized(req.headers)
      const actor = isAdmin ? 'merchant' : physicalActor(req.headers, JWT_SECRET)
      if (!actor || (action === 'bind-buyer' && !isAdmin)) {
        json(res, 403, { ok: false, error: 'physical_actor_not_authorized' }); return
      }
      const { body } = await readRawAndBody(req)
      try {
        const updated = await changePhysicalWork(id, actor, actionMap[action], body, isAdmin)
        json(res, updated ? 200 : 404,
          updated ? { ok: true, ...updated } : { ok: false, error: 'work_not_found' })
      } catch (e) {
        json(res, e.statusCode || 503, { ok: false, error: e.statusCode ? e.message : 'work_store_unavailable' })
      }
      return
    }
    json(res, 405, { ok: false, error: 'physical_method_not_allowed' })
    return
  }

  if (req.method === 'GET' && (pth === '/v1/signals/daily' || pth === '/api/signals/daily')) {
    const out = loadDailySignal()
    json(res, 200, { ok: true, ...out, live_trading: 0, execution: 'disabled' })
    return
  }

  if (req.method === 'POST' && pth === '/moonpay/sign') {
    const origin = String(req.headers.origin || '')
    if (origin && origin !== 'https://neltud.github.io' && !origin.startsWith('http://127.0.0.1') && !origin.startsWith('http://localhost')) {
      json(res, 403, { ok: false, error: 'origin_not_allowed' })
      return
    }
    const now = Date.now()
    const client = req.socket.remoteAddress || 'unknown'
    for (const [key, value] of moonpayHits) if (value.expiresAt <= now) moonpayHits.delete(key)
    const previous = moonpayHits.get(client)
    const count = previous ? previous.count + 1 : 1
    if (count > MOONPAY_MAX || (!previous && moonpayHits.size >= 10000)) {
      json(res, 429, { ok: false, error: 'rate_limit' })
      return
    }
    moonpayHits.set(client, { expiresAt: previous?.expiresAt || now + MOONPAY_WINDOW_MS, count })
    const { body } = await readRawAndBody(req)
    try { json(res, 200, { ok: true, url: signMoonpayUrl(body.url, MOONPAY) }) }
    catch (error) {
      json(res, error.statusCode || 400, { ok: false, error: error.statusCode === 503 ? 'moonpay_not_configured' : 'invalid_moonpay_request' })
    }
    return
  }

  if (req.method === 'POST' && pth === '/v1/access/challenge') {
    const { body } = await readRawAndBody(req)
    try {
      const ch = createChallenge(typeof body.address === 'string' ? body.address.trim() : '')
      json(res, 200, { ok: true, ...ch, require_siwx: requireSiwx() })
    } catch { json(res, 400, { ok: false, error: 'invalid_or_unavailable_challenge' }) }
    return
  }

  if (req.method === 'POST' && (pth === '/v1/verify-access' || pth === '/api/verify-access')) {
    const { body } = await readRawAndBody(req)
    const address = typeof (body.address || body.wallet) === 'string' ? (body.address || body.wallet).trim() : ''
    const signature = body.signature || body.sig || ''
    const message = body.message || ''
    const nonce = body.nonce || ''
    const hasProof = Boolean(signature || message || nonce)
    const verified = hasProof && verifySignedChallenge({ address, signature, message, nonce })
    if ((requireSiwx() || hasProof) && !verified) {
      json(res, 401, { ok: false, status: 'SAMPLE', hasAccess: false, reason: 'siwx_invalid_or_missing_challenge' })
      return
    }
    const access = await resolveAccessLevel(address || null)
    if (access.status === 'FULL' && !verified) {
      json(res, 401, { ok: false, status: 'SAMPLE', hasAccess: false, reason: 'siwx_required_for_full_access' })
      return
    }
    const issued = issueAccessToken(access, address || null, JWT_SECRET)
    if (issued.error && access.status === 'FULL') {
      json(res, 503, { ok: false, error: issued.error, status: 'SAMPLE', hasAccess: false })
      return
    }
    json(res, 200, {
      ok: true, status: access.status, hasAccess: access.hasAccess, reason: access.reason,
      token: issued.token, expiresIn: issued.expiresIn || null,
    })
    return
  }

  if (req.method === 'POST' && pth === '/v1/checkout/quote') {
    const { body } = await readRawAndBody(req)
    try {
      const rate = body.rate_eur_per_egld ?? body.rate ?? body.fx ?? envFxRate()
      const quote = buildPackQuote({
        pack_id: body.pack_id || body.packId,
        rate_eur_per_egld: rate,
      })
      json(res, 200, quote)
    } catch (e) {
      json(res, e.statusCode || 400, { ok: false, error: String(e.message || e), gap: e.gap })
    }
    return
  }

  if (req.method === 'POST' && pth === '/v1/checkout/paybox') {
    const { body } = await readRawAndBody(req)
    const packId = (body.pack_id || body.packId || '').trim()
    const artistRaw = typeof (body.artist_beneficiary || body.artistBeneficiary) === 'string'
      ? (body.artist_beneficiary || body.artistBeneficiary).trim() : ''
    try {
      const pack = getPack(packId)
      const auth = resolveAuthenticatedBuyer({ headers: req.headers, body, jwtSecret: JWT_SECRET })
      if (!auth.ok) {
        json(res, auth.statusCode, { ok: false, error: auth.error })
        return
      }
      const buyer = auth.buyer
      // Auth must still return 401/403 first. A configured merchant is not
      // commercial approval; fail closed before creating any order/session.
      // Signed IPNs stay active for already-existing orders.
      if (!payboxCheckoutEnabled()) {
        json(res, 503, { ok: false, error: 'paybox_checkout_not_approved' })
        return
      }
      if (!PAYBOX.ready) {
        json(res, 501, {
          ok: false, error: 'paybox_not_configured', pack_id: pack.id, amount_cents: pack.price_cents,
          message: 'Paybox System merchant credentials missing. Fail-closed.',
        })
        return
      }
      let artist = null
      if (artistRaw) artist = resolveArtistBeneficiary(artistRaw)
      const origin = publicBase()
      const ipnUrl = String(process.env.PAYBOX_IPN_URL || '').trim()
      if (!/^https:\/\//i.test(ipnUrl)) {
        json(res, 503, {
          ok: false, error: 'paybox_ipn_url_required',
          message: 'Set PAYBOX_IPN_URL to an absolute https:// endpoint before accepting card sessions. No origin fallback.',
        })
        return
      }
      const orderId = newOrderId(pack.id, buyer)
      await createOrder({
        order_id: orderId, pack_id: pack.id, amount_cents: pack.price_cents,
        buyer_address: buyer, artist_beneficiary: artist,
      })
      const session = createPayboxSession({
        pack, buyerAddress: buyer, orderId,
        successUrl: typeof body.success_url === 'string' ? body.success_url : `${origin}/xArtists/#/my-packs?order=${orderId}`,
        cancelUrl: typeof body.cancel_url === 'string' ? body.cancel_url : `${origin}/xArtists/#/my-packs?cancelled=1`,
        ipnUrl, email: typeof body.email === 'string' ? body.email : undefined,
      }, PAYBOX)
      await markRedirected(orderId)
      json(res, 200, {
        ok: true, ...session, pack_id: pack.id, amount_eur: pack.price_cents / 100,
        artist_beneficiary: artist,
        artist_settlement: artist
          ? { merchant_capture: true, accounting_attribution: artist, payout: 'not_implemented' }
          : { merchant_capture: true, accounting_attribution: null, payout: 'n/a' },
        status: 'created',
      })
    } catch (e) {
      json(res, e.statusCode || 400, { ok: false, error: String(e.message || e) })
    }
    return
  }

  if ((req.method === 'POST' || req.method === 'GET') && pth === '/v1/checkout/paybox/ipn') {
    let bodyRaw = ''
    if (req.method === 'POST') {
      try {
        const r = await readRawAndBody(req)
        bodyRaw = r.raw || ''
      } catch (e) {
        const code = Number(e?.statusCode) || 400
        json(res, code, { ok: false, error: e?.message || 'invalid_body' })
        return
      }
    }
    const queryRaw = u.search ? u.search.slice(1) : ''
    const source = resolveIpnAuthenticatedSource(queryRaw, bodyRaw)
    if (!source.ok) {
      json(res, 400, { ok: false, error: source.reason })
      return
    }
    const result = verifyPayboxIpn(
      {},
      undefined,
      { site: PAYBOX.site, devise: PAYBOX.devise },
      { rawSignedData: source.rawSignedData, sign: source.sign },
    )
    if (!result.ok) {
      json(res, 400, { ok: false, error: result.reason })
      return
    }
    // A signed success without a PSP transaction identifier cannot be
    // reconciled or reliably deduplicated against other orders. Fail closed
    // before reading or modifying the buyer's ledger entry.
    if (result.paid && !String(result.provider_tx_id || '').trim()) {
      json(res, 400, { ok: false, error: 'missing_provider_transaction_id' })
      return
    }
    const order = await getOrder(result.ref)
    if (!order) {
      json(res, 400, { ok: false, error: 'unknown_order', order_id: result.ref })
      return
    }
    if (Number(result.amount_cents) !== Number(order.amount_cents)) {
      json(res, 400, {
        ok: false, error: 'amount_mismatch',
        expected: order.amount_cents, got: result.amount_cents, order_id: result.ref,
      })
      return
    }
    const applied = await applyIpn({
      order_id: result.ref,
      amount_cents: result.amount_cents,
      error_code: result.error,
      authorization: result.authorization,
      provider_tx_id: result.provider_tx_id,
    })

    let mint = null
    if (applied.ok && applied.dispatch_eligible) {
      const fresh = await getOrder(result.ref)
      mint = await triggerMintDispatchSafe(fresh)
    }

    json(res, applied.ok ? 200 : 400, {
      ok: applied.ok,
      error: applied.reason || undefined,
      order_id: result.ref,
      status: applied.status,
      duplicate: Boolean(applied.duplicate),
      late: Boolean(applied.late),
      delivery: applied.delivery || 'none',
      server_confirmed: Boolean(applied.server_confirmed),
      mint_dispatch: mint
        ? {
            ok: Boolean(mint.ok),
            skipped: Boolean(mint.skipped),
            reason: mint.reason || null,
            mode: mint.mode || null,
            note: mint.note || null,
          }
        : null,
    })
    return
  }

  if (req.method === 'GET' && pth.startsWith('/v1/checkout/paybox/order/')) {
    const orderId = pth.slice('/v1/checkout/paybox/order/'.length).split('?')[0]
    const auth = resolveAuthenticatedBuyer({
      headers: req.headers,
      body: { buyer_address: u.searchParams.get('buyer') || undefined },
      jwtSecret: JWT_SECRET,
    })
    if (!auth.ok) {
      json(res, auth.statusCode, { ok: false, error: auth.error })
      return
    }
    try {
      const order = await getOrderForBuyer(orderId, auth.buyer)
      if (!order) { json(res, 404, { ok: false, error: 'unknown_order' }); return }
      const delivery = publicOrderDelivery(order)
      json(res, 200, {
        ok: true,
        order_id: order.order_id,
        pack_id: order.pack_id,
        amount_cents: order.amount_cents,
        status: order.status,
        ...delivery,
        server_confirmed: order.server_confirmed === true,
        payment_verified: order.payment_verified === true,
        provider_tx_id: order.provider_tx_id || null,
      })
    } catch (e) {
      json(res, e.statusCode || 403, { ok: false, error: String(e.message || e) })
    }
    return
  }

  if (req.method === 'GET' && pth === '/v1/checkout/paybox') {
    json(res, 405, { ok: false, error: 'method_not_allowed' })
    return
  }

  if (req.method === 'GET' && pth === '/v1/access/introspect') {
    const auth = String(req.headers.authorization || '')
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
    if (!token || !JWT_SECRET || JWT_SECRET.length < 16) {
      json(res, 401, { ok: false, error: 'missing_or_invalid_token' })
      return
    }
    const payload = verifyJwt(token, JWT_SECRET)
    if (!payload) {
      json(res, 401, { ok: false, error: 'invalid_or_expired_token' })
      return
    }
    json(res, 200, {
      ok: true,
      payload,
      sub: payload.sub ?? null,
      status: payload.access_level || payload.status || null,
      exp: payload.exp ?? null,
    })
    return
  }

  json(res, 404, { error: 'not_found', path: pth })
}

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch(error => {
    if (!res.headersSent) json(res, error.statusCode || 500, { ok: false, error: error.statusCode ? error.message : 'internal_error' })
    else res.end()
  })
})

server.listen(PORT, () => {
  console.log(
    `access-api :${server.address().port} paybox=${PAYBOX.ready} ipn=${IPN_POLICY.algorithm}/${IPN_POLICY.keySize} mint=${MINT_CFG.enabled ? (MINT_CFG.dryRun ? 'dry_run' : 'live_armed') : 'off'} signals=on`,
  )
})
