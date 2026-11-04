import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createHash } from 'node:crypto'
import { createPaperGenesisArtEngine } from '../src/paper.mjs'

const actor = { actorId: 'wallet:alice' }
const other = { actorId: 'wallet:bob' }
const cmd = { prompt: 'Abstract museum artwork', kind: 'image', collectionPurpose: 'creator_artwork', rightsAccepted: true }
const png = Buffer.from('89504e470d0a1a0a11223344', 'hex')
const validator = (b, mime) => {
  if (mime !== 'image/png' || !b.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')))
    throw Error('media_content_signature_invalid')
  return { mime, bytes: b.length, sha256: createHash('sha256').update(b).digest('hex') }
}
const make = (overrides = {}) => createPaperGenesisArtEngine({
  guardian: () => ({ paused: false, mode: 'paper' }),
  paperCreditsByActor: { 'wallet:alice': 6, 'wallet:bob': 6 },
  provider: async () => ({ buffer: png, mime: 'image/png' }),
  validateMedia: validator,
  clock: () => 100_000,
  ...overrides,
})

test('default is fail-closed without Guardian and without a verified provider adapter', () => {
  assert.throws(() => createPaperGenesisArtEngine(), /server_dependency_required/)
  const engine = make({ provider: null })
  assert.throws(() => engine.prepare(cmd, actor), /art_provider_unavailable/)
})
test('preview labels credits PAPER, requires explicit confirmation, never claims money or NFT', () => {
  const engine = make()
  const quote = engine.prepare(cmd, actor)
  assert.equal(quote.price.unit, 'PAPER_CREDITS')
  assert.equal(quote.price.paid, false)
  assert.equal(quote.expiresAt, 130_000)
  assert.equal(quote.requiresExplicitConfirmation, true)
  assert.equal(engine.readCredits(actor).balance, 6)
  assert.equal(engine.status({ quoteId: quote.id }, actor).nftMinted, false)
})
test('no user set price, wrong collection, video or 3D or absent rights', () => {
  const engine = make()
  for (const patch of [
    { customCredits: 0 }, { collectionPurpose: 'XAIPLS' },
    { kind: 'video' }, { kind: '3d' }, { rightsAccepted: false },
    { prompt: 'x' }, { prompt: 'x'.repeat(601) }, { prompt: 'bad\u0000command' },
  ]) assert.throws(() => engine.prepare({ ...cmd, ...patch }, actor))
})
test('wallet-bound quote digest, cancelled and expired state cannot execute', async () => {
  let t = 100_000
  const engine = make({ clock: () => t })
  const q = engine.prepare(cmd, actor)
  await assert.rejects(() => engine.confirmPaper({ quoteId: q.id, digest: q.digest }, other), /art_request_not_found/)
  await assert.rejects(() => engine.confirmPaper({ quoteId: q.id, digest: 'a'.repeat(64) }, actor), /art_quote_digest_mismatch/)
  engine.cancel({ quoteId: q.id }, actor)
  await assert.rejects(() => engine.confirmPaper({ quoteId: q.id, digest: q.digest }, actor), /art_quote_not_confirmable/)
  const next = engine.prepare(cmd, actor)
  t = next.expiresAt
  await assert.rejects(() => engine.confirmPaper({ quoteId: next.id, digest: next.digest }, actor), /art_quote_expired/)
})
test('single confirmed image is never pinned/minted or billed; idempotent on completed', async () => {
  let calls = 0
  const engine = make({ provider: async () => { calls += 1; return { buffer: png, mime: 'image/png' } } })
  const q = engine.prepare(cmd, actor)
  const receipt = await engine.confirmPaper({ quoteId: q.id, digest: q.digest }, actor)
  assert.equal(receipt.status, 'completed')
  assert.equal(receipt.media.uri, null)
  assert.equal(receipt.media.owner, actor.actorId)
  assert.equal(receipt.paymentVerified, false)
  assert.equal(receipt.metadataPinned, false)
  assert.equal(receipt.nftMinted, false)
  assert.equal(receipt.chainTxHash, null)
  assert.equal(engine.readCredits(actor).balance, 3)
  assert.deepEqual(await engine.confirmPaper({ quoteId: q.id, digest: q.digest }, actor), receipt)
  assert.equal(engine.readCredits(actor).balance, 3)
  assert.equal(calls, 1)
})
test('concurrent confirmation only calls provider once and reserves credits once', async () => {
  let resolve, calls = 0
  const engine = make({ provider: () => { calls += 1; return new Promise(r => { resolve = r }) } })
  const q = engine.prepare(cmd, actor)
  const first = engine.confirmPaper({ quoteId: q.id, digest: q.digest }, actor)
  await assert.rejects(() => engine.confirmPaper({ quoteId: q.id, digest: q.digest }, actor), /art_quote_not_confirmable/)
  assert.equal(engine.readCredits(actor).balance, 3)
  // Provider invocation is queued as a microtask; allow it to begin before resolution.
  await Promise.resolve()
  resolve({ buffer: png, mime: 'image/png' })
  await first
  assert.equal(calls, 1)
  assert.equal(engine.readCredits(actor).balance, 3)
})
test('invalid bytes and known provider failure release paper reservation only once', async () => {
  const engine = make({ provider: async () => ({ buffer: Buffer.from('not a png'), mime: 'image/png' }) })
  const q = engine.prepare(cmd, actor)
  await assert.rejects(() => engine.confirmPaper({ quoteId: q.id, digest: q.digest }, actor), /art_generation_failed/)
  assert.equal(engine.readCredits(actor).balance, 6)
  assert.equal(engine.status({ quoteId: q.id }, actor).status, 'failed_released')
  await assert.rejects(() => engine.confirmPaper({ quoteId: q.id, digest: q.digest }, actor), /art_quote_not_confirmable/)
  assert.equal(engine.readCredits(actor).balance, 6)
})
test('timeout with non-cooperative provider holds reservation for reconciliation, without retry', async () => {
  let calls = 0
  const engine = make({ providerTimeoutMs: 8, provider: () => { calls++; return new Promise(() => {}) } })
  const q = engine.prepare(cmd, actor)
  await assert.rejects(() => engine.confirmPaper({ quoteId: q.id, digest: q.digest }, actor), /art_provider_outcome_unknown/)
  assert.equal(engine.status({ quoteId: q.id }, actor).status, 'needs_reconciliation')
  assert.equal(engine.readCredits(actor).balance, 3)
  await assert.rejects(() => engine.confirmPaper({ quoteId: q.id, digest: q.digest }, actor), /art_quote_not_confirmable/)
  assert.equal(calls, 1)
})
test('Guardian unavailable, failed and non-paper mode deny; capacity and balance bound', async () => {
  const denied = make({ guardian: () => ({ paused: true, mode: 'paper' }) })
  assert.throws(() => denied.prepare(cmd, actor), /guardian_blocked/)
  assert.throws(() => make({ guardian: () => { throw Error('unreachable') } }).prepare(cmd, actor), /guardian_unavailable/)
  assert.throws(() => make({ guardian: () => ({ paused: false, mode: 'live' }) }).prepare(cmd, actor), /guardian_blocked/)
  const tooPoor = make({ paperCreditsByActor: { 'wallet:alice': 2 } })
  assert.throws(() => tooPoor.prepare(cmd, actor), /paper_credits_insufficient/)
  const busy = make({ maxQuotes: 1 })
  busy.prepare(cmd, actor)
  assert.throws(() => busy.prepare(cmd, actor), /paper_quote_capacity_exhausted/)
})
