/**
 * xArtists LIA P0: structured BUY_PACK -> Rule1 read-only quote -> explicit paper simulation.
 * No NLP, intent mandate/signature, payment, NFT, relayer, wallet transfer or live branch.
 * Each process owns a bounded non-durable journal; stdout audit is observational only.
 */
import { randomUUID, createHash } from 'node:crypto'

const PRICES = Object.freeze({ pulse: '110', yield: '75', sentinel: '50' })
const ADDR = /^erd1[023456789acdefghjklmnpqrstuvwxyz]{58}$/
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i
const QUOTE_TTL = 30_000
const HOUR = 3_600_000
const fail = (code, statusCode = 400) => Object.assign(new Error(code), { code, statusCode })
const hash = str => createHash('sha256').update(str).digest('hex')
const plain = x => x !== null && typeof x === 'object' && !Array.isArray(x) && Object.getPrototypeOf(x) === Object.prototype
const exact = (x, keys) => plain(x) && Object.keys(x).length === keys.length && keys.every(k => Object.hasOwn(x, k))

export function isValidPack(packTier, amountEur) {
  return typeof packTier === 'string' && Object.hasOwn(PRICES, packTier) && PRICES[packTier] === amountEur
}
export const simplePackCatalogue = PRICES

/**
 * Host-only dependencies: quoteProvider must call server Rule1, guardian is trusted.
 * No consumer-supplied provider, actor or execution mode.
 */
export function createSimpleIntentService({
  quoteProvider,
  guardian,
  clock = Date.now,
  log = event => console.info(JSON.stringify(event)),
  maxRecords = 1000,
  maxPreparationsPerHour = 20,
} = {}) {
  if (typeof quoteProvider !== 'function' || typeof guardian !== 'function' ||
      typeof clock !== 'function' || typeof log !== 'function' ||
      !Number.isInteger(maxRecords) || maxRecords < 1 || maxRecords > 10000 ||
      !Number.isInteger(maxPreparationsPerHour) || maxPreparationsPerHour < 1 || maxPreparationsPerHour > 100) {
    throw fail('simple_intent_configuration_invalid', 500)
  }
  const records = new Map()
  const quotas = new Map()
  const now = () => {
    const value = clock()
    if (!Number.isSafeInteger(value) || value < 0) throw fail('simple_intent_clock_invalid', 503)
    return value
  }
  const checkGuardian = () => {
    let value
    try { value = guardian() } catch { throw fail('paper_guardian_unavailable', 503) }
    if (!value || value.mode !== 'paper' || value.paused !== false) throw fail('paper_guardian_paused', 503)
  }
  const actorAddress = actor => {
    const a = actor?.userAddress
    if (typeof a !== 'string' || !ADDR.test(a)) throw fail('wallet_auth_required', 401)
    return a
  }
  const owned = (confirmationId, actor) => {
    if (typeof confirmationId !== 'string' || !UUID.test(confirmationId)) throw fail('confirmation_id_invalid')
    const r = records.get(confirmationId)
    if (!r || r.user !== actor) throw fail('confirmation_not_found', 404)
    return r
  }
  const cleanup = t => {
    for (const [id, value] of records) if (value.expiresAtMs + 300_000 <= t) records.delete(id)
    for (const [key, value] of quotas) if (t - value.startedMs >= HOUR) quotas.delete(key)
  }
  function quota(address, t) {
    const row = quotas.get(address)
    if (!row) {
      if (quotas.size >= maxRecords) throw fail('paper_capacity_reached', 429)
      quotas.set(address, { count: 1, startedMs: t })
    } else {
      if (row.count >= maxPreparationsPerHour) throw fail('paper_rate_limit', 429)
      row.count++
    }
  }
  async function prepare(intent, actor) {
    const user = actorAddress(actor)
    checkGuardian()
    if (!exact(intent, ['type', 'packTier', 'amountEur', 'userAddress']) ||
        intent.type !== 'BUY_PACK' || !isValidPack(intent.packTier, intent.amountEur) ||
        typeof intent.userAddress !== 'string' || intent.userAddress !== user) {
      throw fail('invalid_or_unowned_pack')
    }
    const t = now()
    cleanup(t)
    if (records.size >= maxRecords) throw fail('paper_capacity_reached', 429)
    quota(user, t)
    let quote
    try {
      quote = await quoteProvider({ packTier: intent.packTier, nowMs: t })
    } catch { throw fail('rule1_quote_unavailable', 503) }
    checkGuardian()
    const finished = now()
    // The existing xArtists Rule1 source returns a 12-min legacy quote. This P0
    // intentionally shortens the confirmation lifetime to <=30 s.
    if (finished < t || finished >= t + QUOTE_TTL ||
        !plain(quote) || quote.ok !== true || quote.schema !== 'xartists.pack_quote.v1' ||
        quote.pack_id !== intent.packTier || quote.currency !== 'EUR' ||
        quote.amount_cents !== Number(intent.amountEur) * 100 ||
        quote.amount_eur !== Number(intent.amountEur) || quote.margin_internal !== 0.04 ||
        quote.tolerance_eur !== 0.02 || !Number.isFinite(quote.rounding_gap_eur) ||
        quote.rounding_gap_eur < 0 || quote.rounding_gap_eur > 0.02 ||
        !Number.isFinite(quote.amount_egld) || quote.amount_egld <= 0 ||
        !Number.isFinite(quote.rate_eur_per_egld) || quote.rate_eur_per_egld <= 0 ||
        quote.rails?.buyer?.includes('eur_paybox') !== true ||
        quote.rails?.buyer?.includes('egld_multiversx') !== true ||
        !Number.isFinite(Date.parse(quote.expires_at)) || Date.parse(quote.expires_at) <= finished) {
      throw fail('rule1_quote_invalid_or_expired', 503)
    }
    const id = randomUUID(), quoteId = randomUUID()
    const expiresAtMs = Math.min(t + QUOTE_TTL, Date.parse(quote.expires_at))
    const resultQuote = Object.freeze({
      id: quoteId, packTier: intent.packTier, asset: 'EUR',
      amountEur: intent.amountEur, amountCents: quote.amount_cents,
      estimatedEgld: String(quote.amount_egld),
      rateEurPerEgld: String(quote.rate_eur_per_egld),
      rule: 'Rule1', balanceChecked: false, gasChecked: false,
      payable: false, issuedAtMs: t, expiresAtMs,
    })
    records.set(id, { id, user, quote: resultQuote, expiresAtMs, state: 'ready', receipt: null })
    return {
      ok: true, status: 'ready', mode: 'paper', paperMode: true,
      requiresConfirmation: true, confirmationId: id, quote: resultQuote,
      plan: { action: 'BUY_PACK', tier: intent.packTier, quoteId, mode: 'paper',
        recipient: user, paymentSubmitted: false, nftMinted: false },
    }
  }
  function confirm(confirmationId, actor) {
    const user = actorAddress(actor)
    checkGuardian()
    const r = owned(confirmationId, user)
    if (r.receipt) return { ...r.receipt, replayed: true }
    if (r.state !== 'ready') throw fail('confirmation_not_available', 409)
    if (now() >= r.expiresAtMs) { r.state = 'expired'; throw fail('simple_quote_expired', 410) }
    // Synchronous one-shot transition: do not allow retries if the audit sink fails.
    r.state = 'pending_audit'
    const auditId = randomUUID()
    const event = Object.freeze({
      event: 'lia.simple.paper_execution', auditId,
      confirmationId: r.id, actorHash: hash(r.user),
      packTier: r.quote.packTier, amountCents: r.quote.amountCents,
      quoteId: r.quote.id, mode: 'paper', paymentVerified: false,
      deliveryVerified: false, chainStatus: 'not_submitted', atMs: now(),
    })
    try { log(event) } catch {
      r.state = 'audit_failed'
      throw fail('paper_audit_unavailable', 503)
    }
    const receipt = Object.freeze({
      ok: true, status: 'paper_success', mode: 'paper', paperMode: true,
      simulated: true, auditId, confirmationId: r.id,
      quoteId: r.quote.id, packTier: r.quote.packTier,
      paymentVerified: false, deliveryVerified: false, nftMinted: false,
      chainStatus: 'not_submitted', txHash: null,
      accessGranted: false, amountChargedCents: 0, replayed: false,
    })
    r.receipt = receipt
    r.state = 'simulated'
    return { ...receipt }
  }
  function cancel(confirmationId, actor) {
    const user = actorAddress(actor)
    const r = owned(confirmationId, user)
    if (r.receipt) throw fail('already_simulated', 409)
    r.state = 'cancelled'
    return { ok: true, status: 'cancelled', mode: 'paper' }
  }
  return Object.freeze({ prepare, confirm, cancel })
}
