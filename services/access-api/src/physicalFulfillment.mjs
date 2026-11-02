/**
 * xArtists physical art fulfillment ledger — PRODUCTION-SAFE DEFAULTS.
 *
 * Explicitly separate:
 *   merchant-paid -> carrier-shipped -> carrier-delivered -> buyer-accepted.
 * A carrier webhook NEVER confirms a buyer receipt, legal title, NFT transfer or escrow release.
 *
 * Only Shopify HMAC-signed webhooks update carrier/order state.
 * Only a wallet-signed, physical-purpose JWT can create work or acknowledge receipt.
 * Only a server-side merchant secret can bind a customer's wallet to a paid order.
 * No photographs, street addresses, customer emails or raw Shopify payload are persisted.
 */
import crypto from 'node:crypto'
import { erdToPubkey } from './siwx.mjs'
import { signJwt, verifyJwt } from './verifyAccess.mjs'

const PG_LOCK = 87231521
const MAX_BODY = 256 * 1024
const TOPICS = new Set(['orders/paid', 'fulfillments/create', 'fulfillments/update'])
const SHIPPED = new Set(['in_transit', 'out_for_delivery', 'delivered'])
const HEX64 = /^[a-f0-9]{64}$/i
const NFT_ID = /^[A-Z0-9]{3,10}-[a-f0-9]{6}-[a-f0-9]+$/i
const CONDITION_REASONS = new Set(['damaged', 'missing', 'condition_changed', 'provenance_question'])
let pool, ready = false

const fail = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode })
const shortText = (value, max = 160) => String(value || '').trim().slice(0, max)
const sha = input => crypto.createHash('sha256').update(input).digest('hex')
const normal = addr => String(addr || '').toLowerCase()
function validWallet(wallet) {
  try { erdToPubkey(wallet); return true } catch { return false }
}

export function physicalConfig(env = process.env) {
  const configured = env.PHYSICAL_FULFILLMENT_ENABLED === '1'
    && String(env.SHOPIFY_WEBHOOK_SECRET || '').length >= 24
    && /^[a-z0-9-]+\.myshopify\.com$/.test(String(env.SHOPIFY_SHOP_DOMAIN || ''))
    && String(env.DATABASE_URL || '').trim().length > 0
    && String(env.PHYSICAL_ADMIN_TOKEN || '').length >= 32
    && String(env.ACCESS_JWT_SECRET || env.JWT_SECRET || '').length >= 16
  return {
    enabled: configured,
    mode: configured ? 'configured_requires_webhook_registration' : 'disabled',
    storage: env.DATABASE_URL ? 'postgres' : 'not_configured',
  }
}

/** Shopify HMAC must be calculated from the unmodified raw bytes. */
export function verifyShopifyDelivery(raw, headers, env = process.env) {
  const secret = String(env.SHOPIFY_WEBHOOK_SECRET || '')
  const shop = String(headers['x-shopify-shop-domain'] || '').toLowerCase()
  const topic = String(headers['x-shopify-topic'] || '').toLowerCase()
  const id = String(headers['x-shopify-webhook-id'] || '')
  const given = String(headers['x-shopify-hmac-sha256'] || '')
  if (secret.length < 24 || shop !== env.SHOPIFY_SHOP_DOMAIN || !TOPICS.has(topic)
    || !/^[a-zA-Z0-9_-]{8,100}$/.test(id) || !/^[A-Za-z0-9+/]{43}=$/.test(given)) {
    return { ok: false, error: 'invalid_shopify_delivery_headers' }
  }
  const expected = crypto.createHmac('sha256', secret).update(raw).digest()
  const received = Buffer.from(given, 'base64')
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
    return { ok: false, error: 'invalid_shopify_hmac' }
  }
  return { ok: true, shop, topic, id, hash: sha(raw) }
}

/** Authorization is independent from the TCA paid-pack JWT. */
export function issuePhysicalSession(address, secret) {
  if (!validWallet(address) || String(secret || '').length < 16) throw fail('invalid_wallet_or_auth_config', 401)
  const now = Math.floor(Date.now() / 1000)
  return {
    token: signJwt({
      sub: address, purpose: 'physical_art', iss: 'xartists-access-api',
      iat: now, exp: now + 900,
    }, secret),
    expiresIn: 900,
  }
}
export function physicalActor(headers, secret) {
  const auth = String(headers.authorization || '')
  const jwt = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  const payload = verifyJwt(jwt, secret)
  return payload?.purpose === 'physical_art' && validWallet(payload.sub) ? payload.sub : null
}
export function merchantAuthorized(headers, env = process.env) {
  const token = String(headers.authorization || '').replace(/^Admin\s+/i, '')
  const configured = String(env.PHYSICAL_ADMIN_TOKEN || '')
  if (!String(headers.authorization || '').startsWith('Admin ') ||
      configured.length < 32 || token.length !== configured.length) return false
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(configured))
}

/** No user-controlled URLs, photos, address, emails or raw metadata are stored. */
export function createPhysicalRecord(input, owner) {
  if (!validWallet(owner)) throw fail('wallet_signature_required', 401)
  const title = shortText(input?.title, 120)
  const artist = shortText(input?.artist, 100)
  const medium = shortText(input?.medium, 80)
  const evidenceSha256 = String(input?.photoSha256 || '').toLowerCase()
  const nftIdentifier = shortText(input?.nftIdentifier, 100)
  if (title.length < 3 || artist.length < 2 || medium.length < 2) throw fail('missing_artwork_metadata')
  if (!HEX64.test(evidenceSha256)) throw fail('photo_sha256_required')
  if (nftIdentifier && !NFT_ID.test(nftIdentifier)) throw fail('invalid_nft_identifier')
  const id = 'xa_phy_' + crypto.randomBytes(9).toString('hex')
  const record = {
    schema: 'xartists_physical_work/v1', id,
    sku: 'XAPHY-' + id.slice(-14).toUpperCase(), owner,
    title, artist, medium,
    photoSha256: evidenceSha256,
    nftIdentifier: nftIdentifier || null,
    nftLinkVerified: false, // not an on-chain ownership proof
    status: 'REGISTERED', shopifyOrderId: null,
    buyerWallet: null, shipment: null, receipt: null, assessment: null,
    events: [],
    createdAt: new Date().toISOString(),
  }
  append(record, 'CREATED', 'artist', { media_digest: true, nft_claim_unverified: Boolean(nftIdentifier) })
  return record
}

function append(record, type, actor, detail = {}) {
  if (record.events.length >= 300) throw fail('physical_ledger_capacity_review_required', 409)
  const prev = record.events.at(-1)?.hash || 'GENESIS'
  const event = { type, actor, at: new Date().toISOString(), detail, prev }
  event.hash = sha(JSON.stringify(event))
  record.events.push(event)
  return record
}
/**
 * Read-only proof that the declared creator wallet holds an NFT it created.
 * Not proof of legal ownership of the physical piece or of independent authenticity.
 */
export async function verifyDeclaredPhysicalNft(work, actor) {
  if (normal(actor) !== normal(work.owner)) throw fail('artist_wallet_required', 403)
  if (!work.nftIdentifier || !NFT_ID.test(work.nftIdentifier)) throw fail('nft_not_declared')
  const endpoint = 'https://api.multiversx.com/accounts/'
    + encodeURIComponent(work.owner) + '/nfts/' + encodeURIComponent(work.nftIdentifier)
  let response
  try {
    response = await fetch(endpoint, { headers: {Accept:'application/json'},
      signal: AbortSignal.timeout(9000) })
  } catch { throw fail('multiversx_verification_unavailable', 503) }
  if (!response.ok) throw fail('nft_not_confirmed_for_artist', 409)
  const data = await response.json()
  if (data?.identifier !== work.nftIdentifier
      || normal(data.creator) !== normal(work.owner)
      || (data.type && data.type !== 'NonFungibleESDT')
      || (data.balance != null && !(Number(data.balance) >= 1))) {
    throw fail('nft_ownership_or_creator_mismatch', 409)
  }
  if (work.nftLinkVerified) return { applied: false, reason: 'already_verified' }
  work.nftLinkVerified = true
  work.nftVerifiedAt = new Date().toISOString()
  append(work, 'NFT_LINK_VERIFIED', 'multiversx_api', {
    nftIdHash: sha(work.nftIdentifier).slice(0, 20),
    scope:'creator_wallet_holds_self_created_nft_only',
  })
  return { applied:true }
}

export function assessConditionRisk(reason, status) {
  if (reason === 'missing') return {
    risk: 'critical', actions: ['verify_carrier_chain', 'request_human_claim_review'],
  }
  if (reason === 'damaged') return {
    risk: 'high', actions: ['preserve_unmodified_photos', 'request_independent_inspection'],
  }
  if (reason === 'provenance_question') return {
    risk: 'manual', actions: ['verify_artist_documents', 'inspect_nft_attestation'],
  }
  return {
    risk: status === 'BUYER_ACCEPTED' ? 'medium' : 'high',
    actions: ['request_before_after_photos', 'independent_condition_review'],
  }
}

/** Pure, tested transition functions — may only be invoked after the correct authentication. */
export function applyPaidOrder(work, payload) {
  const id = String(payload?.id || '')
  if (!/^[0-9]{1,24}$/.test(id) || String(payload?.financial_status) !== 'paid'
    || payload?.cancelled_at || (Array.isArray(payload?.refunds) && payload.refunds.length)) {
    return { applied: false, reason: 'payment_not_confirmed_or_refunded' }
  }
  const matching = (Array.isArray(payload?.line_items) ? payload.line_items : [])
    .filter(line => line.sku === work.sku && Number(line.quantity) === 1)
  if (matching.length !== 1) return { applied: false, reason: 'work_sku_not_found_or_quantity_invalid' }
  if (work.shopifyOrderId && work.shopifyOrderId !== id) {
    throw fail('artwork_already_bound_to_another_order', 409)
  }
  if (work.shopifyOrderId === id) return { applied: false, reason: 'already_paid' }
  work.shopifyOrderId = id
  work.status = 'ORDER_PAID'
  append(work, 'ORDER_PAID', 'shopify', { orderIdHash: sha(id).slice(0, 20) })
  return { applied: true }
}
export function applyFulfillment(work, payload) {
  if (!work.shopifyOrderId || String(payload?.order_id || '') !== work.shopifyOrderId) {
    return { applied: false, reason: 'unmatched_order' }
  }
  const lines = Array.isArray(payload?.line_items) ? payload.line_items : []
  if (!lines.some(line => line.sku === work.sku && Number(line.quantity) === 1)) {
    return { applied: false, reason: 'unmatched_work_sku' }
  }
  const shipmentStatus = String(payload?.shipment_status || '').toLowerCase()
  if (!SHIPPED.has(shipmentStatus)) {
    return { applied: false, reason: 'not_in_carrier_possession' }
  }
  const trackingNumber = shortText(payload?.tracking_number, 100)
  const trackingCompany = shortText(payload?.tracking_company, 80)
  const rawUrl = String(payload?.tracking_url || '')
  let trackingUrl = null
  try {
    const u = new URL(rawUrl)
    if (u.protocol === 'https:') trackingUrl = u.href.slice(0, 500)
  } catch { /* no externally trusted link */ }
  const delivery = shipmentStatus === 'delivered'
  const prior = work.status
  const previousCarrierStatus = work.shipment?.carrierStatus || null
  const previousTrackingNumber = work.shipment?.trackingNumber || null
  if (['CARRIER_DELIVERED','BUYER_ACCEPTED'].includes(work.status) && !delivery) {
    return { applied: false, reason: 'out_of_order_carrier_update' }
  }
  if (!work.shipment) work.shipment = {
    fulfillmentId: String(payload?.id || ''), trackingNumber,
    trackingCompany, trackingUrl, carrierStatus: shipmentStatus,
  }
  else {
    if (work.shipment.fulfillmentId && String(payload?.id || '') !== work.shipment.fulfillmentId) {
      throw fail('multiple_fulfillments_require_manual_review', 409)
    }
    work.shipment = { ...work.shipment, trackingNumber, trackingCompany, trackingUrl,
      carrierStatus: shipmentStatus }
  }
  if (!['DISPUTED','BUYER_ACCEPTED'].includes(work.status)) {
    if (delivery) work.status = 'CARRIER_DELIVERED'
    else if (work.status !== 'CARRIER_DELIVERED') work.status = 'SHIPPED'
  }
  if (prior === work.status && previousCarrierStatus === shipmentStatus
      && previousTrackingNumber === trackingNumber) {
    return { applied: false, reason: 'carrier_status_unchanged' }
  }
  append(work, delivery ? 'CARRIER_DELIVERED' : 'CARRIER_IN_TRANSIT', 'shopify', {
    company: trackingCompany, trackingHash: trackingNumber ? sha(trackingNumber).slice(0, 16) : null,
  })
  return { applied: true }
}

export function bindBuyer(work, address) {
  if (!validWallet(address)) throw fail('invalid_buyer_wallet')
  if (!work.shopifyOrderId || work.status === 'REGISTERED') throw fail('order_not_paid', 409)
  if (work.buyerWallet && normal(work.buyerWallet) !== normal(address)) {
    throw fail('buyer_binding_is_immutable', 409)
  }
  if (work.buyerWallet) return { applied: false, reason: 'already_bound' }
  work.buyerWallet = address
  append(work, 'BUYER_BOUND', 'merchant_verified', { buyer_wallet_bound: true })
  return { applied: true }
}
export function confirmPhysicalReceipt(work, buyer, input) {
  if (!work.buyerWallet || normal(work.buyerWallet) !== normal(buyer)) throw fail('buyer_not_authorized', 403)
  if (work.receipt) throw fail('receipt_already_recorded', 409)
  const decision = String(input?.decision || '')
  const proof = String(input?.evidenceSha256 || '').toLowerCase()
  if (!HEX64.test(proof)) throw fail('receipt_photo_digest_required')
  if (decision === 'accepted') {
    if (work.status !== 'CARRIER_DELIVERED') throw fail('carrier_delivery_not_confirmed', 409)
    work.status = 'BUYER_ACCEPTED'
  } else if (decision === 'damaged' || decision === 'missing') {
    if (!['SHIPPED','CARRIER_DELIVERED'].includes(work.status)) throw fail('shipping_not_in_progress', 409)
    work.status = 'DISPUTED'
  } else throw fail('invalid_receipt_decision')
  work.receipt = {
    decision, evidenceSha256: proof, confirmedAt: new Date().toISOString(),
    buyerWallet: buyer, signatureType: 'wallet_siwx_session',
  }
  append(work, decision === 'accepted' ? 'BUYER_ACCEPTED' : 'DISPUTE_OPENED', 'buyer_wallet', {
    decision, photo_digest: true,
  })
  return { applied: true }
}
export function requestPhysicalReassessment(work, actor, input) {
  if (![work.owner, work.buyerWallet].some(x => x && normal(x) === normal(actor))) {
    throw fail('reassessment_access_denied', 403)
  }
  const reason = String(input?.reason || '')
  const proof = String(input?.evidenceSha256 || '').toLowerCase()
  if (!CONDITION_REASONS.has(reason) || !HEX64.test(proof)) throw fail('invalid_assessment_evidence')
  if (work.assessment?.reviewStatus === 'pending_human') throw fail('existing_review_pending', 409)
  const advisory = assessConditionRisk(reason, work.status)
  work.assessment = {
    reason, evidenceSha256: proof,
    requestedAt: new Date().toISOString(),
    reviewStatus: 'pending_human', advisory, // rules-based triage, NOT an AI appraisal
    reviewer: null, approvedValue: null,
  }
  // A condition review before any dispatch is NOT a delivery dispute.
  if ((reason === 'missing' || reason === 'damaged')
    && ['SHIPPED','CARRIER_DELIVERED','BUYER_ACCEPTED'].includes(work.status)) {
    work.status = 'DISPUTED'
  }
  append(work, 'CONDITION_REVIEW_REQUESTED', 'wallet', {
    reason, risk: advisory.risk, human_review_required: true,
  })
  return { applied: true, advisory }
}

/** Public responses never reveal street addresses, phone, email or evidence raw media. */
export function publicWorkView(work) {
  return {
    id:work.id, sku:work.sku, title:work.title, artist:work.artist, medium:work.medium,
    nftIdentifier:work.nftIdentifier, nftLinkVerified:work.nftLinkVerified,
    nftVerifiedAt:work.nftVerifiedAt || null,
    status:work.status, buyerBound:!!work.buyerWallet,
    shipment:work.shipment, receipt:work.receipt ? {
      decision:work.receipt.decision, confirmedAt:work.receipt.confirmedAt,
    } : null,
    assessment:work.assessment ? {
      reason:work.assessment.reason, reviewStatus:work.assessment.reviewStatus,
      advisory:work.assessment.advisory, requestedAt:work.assessment.requestedAt,
    } : null,
    events:work.events.map(({ type, at, actor, detail, hash, prev }) => ({ type, at, actor, detail, hash, prev })),
  }
}

export async function readPhysicalRaw(req, limit = MAX_BODY) {
  const chunks = []; let total = 0
  for await (const chunk of req) {
    total += chunk.length
    if (total > limit) throw fail('physical_body_too_large', 413)
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

async function database() {
  if (!process.env.DATABASE_URL) throw fail('physical_postgres_required', 503)
  if (!pool) {
    const { default: pg } = await import('pg')
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === '0' ? false : { rejectUnauthorized: true }, max: 3,
    })
  }
  return pool
}

async function physicalTx(operation) {
  const p = await database()
  const client = await p.connect()
  let schemaCreated = false
  try {
    await client.query('BEGIN')
    await client.query('SELECT pg_advisory_xact_lock($1)', [PG_LOCK])
    if (!ready) {
      await client.query('CREATE TABLE IF NOT EXISTS xartists_physical_works (id TEXT PRIMARY KEY, sku TEXT UNIQUE NOT NULL, payload JSONB NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW())')
      await client.query('CREATE TABLE IF NOT EXISTS xartists_physical_deliveries (webhook_id TEXT PRIMARY KEY, body_sha256 TEXT NOT NULL, received_at TIMESTAMPTZ DEFAULT NOW())')
      schemaCreated = true
    }
    const result = await operation(client)
    await client.query('COMMIT')
    // PG DDL is transactional. Never cache schema readiness until the transaction commits:
    // otherwise an operation failure could roll back CREATE TABLE and leave ready=true.
    if (schemaCreated) ready = true
    return result
  } catch (e) {
    await client.query('ROLLBACK').catch(()=>{})
    throw e
  } finally { client.release() }
}

export async function registerPhysicalWork(input, owner) {
  const record = createPhysicalRecord(input, owner)
  return physicalTx(async c => {
    await c.query('INSERT INTO xartists_physical_works (id, sku, payload) VALUES ($1,$2,$3::jsonb)',
      [record.id,record.sku,JSON.stringify(record)])
    return publicWorkView(record)
  })
}
async function fromId(client, id) {
  const result = await client.query('SELECT payload FROM xartists_physical_works WHERE id=$1', [id])
  return result.rows[0]?.payload || null
}
async function writeWork(client, work) {
  await client.query('UPDATE xartists_physical_works SET payload=$2::jsonb,updated_at=NOW() WHERE id=$1',
    [work.id,JSON.stringify(work)])
}
export async function readPhysicalWork(id, actor) {
  if (!/^xa_phy_[a-f0-9]{18}$/.test(id)) throw fail('invalid_physical_id')
  return physicalTx(async c => {
    const work=await fromId(c,id)
    if (!work) return null
    if (![work.owner,work.buyerWallet].some(x=>x&&normal(x)===normal(actor))) throw fail('work_access_denied',403)
    return publicWorkView(work)
  })
}
export async function changePhysicalWork(id, actor, type, input, isAdmin = false) {
  if (!/^xa_phy_[a-f0-9]{18}$/.test(id)) throw fail('invalid_physical_id')
  return physicalTx(async c => {
    const work=await fromId(c,id)
    if(!work) return null
    let result
    if(type==='bind_buyer'){
      if(!isAdmin) throw fail('merchant_authorization_required',403)
      result=bindBuyer(work,input?.buyerWallet)
    } else if(type==='receipt'){
      result=confirmPhysicalReceipt(work,actor,input)
    } else if(type==='reassess'){
      result=requestPhysicalReassessment(work,actor,input)
    } else if(type==='verify_nft'){
      result=await verifyDeclaredPhysicalNft(work,actor)
    } else throw fail('invalid_physical_action')
    if(result.applied)await writeWork(c,work)
    return { ...result, work:publicWorkView(work) }
  })
}

/** Duplicate Shopify deliveries are persisted; schema & transaction are all-or-nothing. */
export async function processShopifyPhysicalWebhook(raw, headers) {
  const check=verifyShopifyDelivery(raw,headers)
  if(!check.ok) throw fail(check.error,401)
  let data
  try{data=JSON.parse(raw.toString('utf8'))}catch{throw fail('invalid_shopify_json')}
  if(!data || typeof data!=='object' || Array.isArray(data))throw fail('invalid_shopify_json')
  return physicalTx(async c=>{
    const old=await c.query('SELECT body_sha256 FROM xartists_physical_deliveries WHERE webhook_id=$1',[check.id])
    if(old.rows.length){
      if(old.rows[0].body_sha256!==check.hash)throw fail('webhook_id_reused_with_different_payload',409)
      return {ok:true,duplicate:true,updated:0}
    }
    const skus = (Array.isArray(data.line_items) ? data.line_items : [])
      .map(item => String(item.sku || '')).filter(sku => /^XAPHY-[A-F0-9]{14}$/.test(sku))
    const targets = skus.length
      ? await c.query('SELECT payload FROM xartists_physical_works WHERE sku = ANY($1::text[])', [skus])
      : { rows: [] }
    let updated=0
    for(const row of targets.rows){
      const work=row.payload
      const change=check.topic==='orders/paid'
        ? applyPaidOrder(work,data)
        : applyFulfillment(work,data)
      if(change.applied){await writeWork(c,work);updated++}
    }
    await c.query('INSERT INTO xartists_physical_deliveries (webhook_id,body_sha256) VALUES ($1,$2)',[check.id,check.hash])
    return {ok:true,duplicate:false,updated}
  })
}
