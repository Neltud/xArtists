/**
 * Genesis Art Engine: SERVER-ONLY, PAPER-ONLY image workflow.
 * No paid credits, model provider, storage, metadata pin, NFT mint or relayer.
 * Host must authenticate actorId; NEVER accept it from client JSON.
 * Memory state is not safe for multi-process billing, replay protection or money.
 */
import { createHash, randomUUID } from 'node:crypto'

const SHA256 = /^[a-f0-9]{64}$/
const MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])
const ALLOWED_FIELDS = new Set(['prompt', 'kind', 'collectionPurpose', 'rightsAccepted'])
const MAX_PROMPT = 600
const MAX_IMAGE_BYTES = 16 * 1024 * 1024
const hash = value => createHash('sha256').update(value).digest('hex')
const error = (code, status = 400) => Object.assign(new Error(code), { code, status })
const clone = v => JSON.parse(JSON.stringify(v))

const actorKey = actor => {
  const id = actor?.actorId
  if (typeof id !== 'string' || !/^[a-zA-Z0-9_:.-]{3,150}$/.test(id)) {
    throw error('authenticated_actor_required', 401)
  }
  return id
}

/** Validate paper-only settings and create a stateful, in-memory evaluation service. */
export function createPaperGenesisArtEngine({
  paperCreditsByActor = {},
  price = { version: 'paper-1', creditsPerImage: 3 },
  guardian,
  provider = null,
  validateMedia = null,
  clock = () => Date.now(),
  quoteTtlMs = 30_000,
  providerTimeoutMs = 15_000,
  maxQuotes = 500,
} = {}) {
  if (typeof guardian !== 'function' || typeof clock !== 'function') throw error('server_dependency_required', 500)
  if (typeof price?.version !== 'string' || !/^[\w.-]{1,32}$/.test(price.version)
      || !Number.isSafeInteger(price.creditsPerImage) || price.creditsPerImage <= 0
      || !Number.isInteger(quoteTtlMs) || quoteTtlMs <= 0 || quoteTtlMs > 30_000
      || !Number.isInteger(providerTimeoutMs) || providerTimeoutMs < 1 || providerTimeoutMs > 120_000
      || !Number.isInteger(maxQuotes) || maxQuotes < 1 || maxQuotes > 10_000) {
    throw error('invalid_server_policy', 500)
  }
  if (provider !== null && typeof provider !== 'function') throw error('invalid_server_provider', 500)
  if (validateMedia !== null && typeof validateMedia !== 'function') throw error('invalid_media_validator', 500)
  const balances = new Map()
  for (const [id, credits] of Object.entries(paperCreditsByActor)) {
    actorKey({ actorId: id })
    if (!Number.isSafeInteger(credits) || credits < 0) throw error('invalid_paper_credit_seed', 500)
    balances.set(id, credits)
  }
  const quotes = new Map()
  const jobs = new Map()

  function guard() {
    let result
    try { result = guardian() } catch { throw error('guardian_unavailable', 503) }
    if (!result || result.paused !== false || result.mode !== 'paper') throw error('guardian_blocked', 503)
  }
  function ownership(record, actor) {
    if (!record || record.actorId !== actorKey(actor)) throw error('art_request_not_found', 404)
  }
  function readCredits(actor) {
    return Object.freeze({ balance: balances.get(actorKey(actor)) ?? 0, unit: 'PAPER_CREDITS', paid: false })
  }
  function prepare(command, actor) {
    const actorId = actorKey(actor)
    guard()
    if (!provider || !validateMedia) throw error('art_provider_unavailable', 503)
    if (!command || typeof command !== 'object' || Array.isArray(command)
        || Object.keys(command).some(k => !ALLOWED_FIELDS.has(k))) throw error('art_command_invalid')
    if (command.kind !== 'image') throw error('art_kind_unsupported')
    if (command.collectionPurpose !== 'creator_artwork') throw error('pack_collection_not_artwork')
    if (command.rightsAccepted !== true) throw error('creator_rights_confirmation_required', 403)
    if (typeof command.prompt !== 'string' || command.prompt.trim().length < 3
        || command.prompt.length > MAX_PROMPT || /[\u0000-\u001f\u007f]/.test(command.prompt)) {
      throw error('art_prompt_invalid')
    }
    if (quotes.size >= maxQuotes) throw error('paper_quote_capacity_exhausted', 429)
    const credits = price.creditsPerImage
    if ((balances.get(actorId) ?? 0) < credits) throw error('paper_credits_insufficient', 402)
    const issuedAt = clock()
    if (!Number.isSafeInteger(issuedAt) || issuedAt < 0) throw error('invalid_clock', 503)
    const id = randomUUID()
    const expiresAt = issuedAt + quoteTtlMs
    const digest = hash(JSON.stringify({ domain: 'xartists.genesis-art.paper.v1', id,
      actorId, promptHash: hash(command.prompt.trim()), kind: 'image',
      collectionPurpose: 'creator_artwork', version: price.version, credits, issuedAt, expiresAt }))
    const record = { id, actorId, prompt: command.prompt.trim(), digest, issuedAt, expiresAt,
      cost: credits, version: price.version, status: 'quoted' }
    quotes.set(id, record)
    return clone({ id, digest, status: 'quoted', mode: 'paper', price: { credits, version: price.version,
      unit: 'PAPER_CREDITS', paid: false }, expiresAt, promptSha256: hash(record.prompt),
      collectionPurpose: 'creator_artwork', kind: 'image',
      requiresExplicitConfirmation: true, storage: 'not_uploaded', mint: 'not_submitted' })
  }
  function cancel({ quoteId }, actor) {
    const record = quotes.get(quoteId)
    ownership(record, actor)
    if (record.status === 'quoted') record.status = 'cancelled'
    return { quoteId, status: record.status }
  }
  function status({ quoteId }, actor) {
    const record = quotes.get(quoteId)
    ownership(record, actor)
    const job = jobs.get(quoteId)
    return clone({ quoteId, status: record.status, mode: 'paper', priceVersion: record.version,
      ...(job?.media ? { media: job.media } : {}),
      paymentVerified: false, metadataPinned: false, nftMinted: false, chainTxHash: null })
  }
  async function confirmPaper({ quoteId, digest }, actor) {
    const record = quotes.get(quoteId)
    ownership(record, actor)
    if (typeof digest !== 'string' || !SHA256.test(digest) || digest !== record.digest) {
      throw error('art_quote_digest_mismatch', 409)
    }
    if (record.status === 'completed') return status({ quoteId }, actor)
    if (record.status !== 'quoted') throw error('art_quote_not_confirmable', 409)
    guard()
    if (clock() >= record.expiresAt) { record.status = 'expired'; throw error('art_quote_expired', 410) }
    if (!provider || !validateMedia) throw error('art_provider_unavailable', 503)
    if ((balances.get(record.actorId) ?? 0) < record.cost) throw error('paper_credits_insufficient', 402)
    // Synchronous reservation before awaits prevents parallel double charge in this process.
    balances.set(record.actorId, balances.get(record.actorId) - record.cost)
    record.status = 'reserved'
    const controller = new AbortController()
    let timer
    try {
      const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => { controller.abort(); reject(error('art_provider_outcome_unknown', 504)) }, providerTimeoutMs)
      })
      const generated = await Promise.race([
        Promise.resolve().then(() => provider({ prompt: record.prompt, kind: 'image', signal: controller.signal })),
        timeout,
      ])
      if (!generated || !Buffer.isBuffer(generated.buffer) || generated.buffer.length > MAX_IMAGE_BYTES
          || !MIME.has(generated.mime)) throw error('art_provider_media_invalid', 502)
      // Host must inject actual Creator Studio validateCreatorMedia(), never trust MIME alone.
      const checked = validateMedia(generated.buffer, generated.mime)
      if (!checked || checked.mime !== generated.mime || checked.bytes !== generated.buffer.length
          || !SHA256.test(checked.sha256)) throw error('art_media_validation_failed', 502)
      jobs.set(quoteId, { media: { mime: checked.mime, bytes: checked.bytes,
        sha256: checked.sha256, uri: null, owner: record.actorId,
        source: 'provider_adapter', storage: 'not_uploaded' } })
      record.status = 'completed'
      return status({ quoteId }, actor)
    } catch (e) {
      if (e?.code === 'art_provider_outcome_unknown') {
        // Provider may have completed/charged despite timeout; NEVER auto-retry.
        record.status = 'needs_reconciliation'
      } else {
        balances.set(record.actorId, balances.get(record.actorId) + record.cost)
        record.status = 'failed_released'
      }
      throw error(e?.code || 'art_generation_failed', e?.status || 502)
    } finally { clearTimeout(timer) }
  }
  return Object.freeze({ prepare, confirmPaper, cancel, status, readCredits })
}
