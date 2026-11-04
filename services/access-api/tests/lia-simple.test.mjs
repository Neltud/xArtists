import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createSimpleIntentService, isValidPack } from '../src/liaSimple.mjs'
import { buildPackQuote } from '../src/quote.mjs'

const A = 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6'
const B = 'erd1qqqqqqqqqqqqqpgq4mdf8u7y0luq8x6qtzk66g0a77sf9nt9t0fqca9jh7'
const pack = (tier = 'pulse') => ({
  type: 'BUY_PACK', packTier: tier,
  amountEur: tier === 'pulse' ? '110' : tier === 'yield' ? '75' : '50',
  userAddress: A,
})
const setup = (extras = {}) => {
  let t = 1_000_000
  const logs = []
  const quoteProvider = ({ packTier, nowMs }) => buildPackQuote({
    pack_id: packTier, rate_eur_per_egld: 10, now: nowMs,
  })
  const args = {
    clock: () => t,
    guardian: () => ({ mode: 'paper', paused: false }),
    quoteProvider,
    log: event => logs.push(event),
    ...extras,
  }
  return {
    service: createSimpleIntentService(args),
    logs,
    setClock: ms => { t = ms },
  }
}
const expectReject = async (call, code) => assert.rejects(call, e => e.code === code)

test('allowlist enforces the exact three tier/price pairs', () => {
  assert.equal(isValidPack('pulse', '110'), true)
  assert.equal(isValidPack('yield', '75'), true)
  assert.equal(isValidPack('sentinel', '50'), true)
  assert.equal(isValidPack('pulse', '75'), false)
  assert.equal(isValidPack('sentinel', 50), false)
  assert.equal(isValidPack('SWAP', '110'), false)
})

test('valid structured packs prepare Rule1 quotes with at most 30s TTL', async () => {
  for (const tier of ['pulse', 'yield', 'sentinel']) {
    const { service } = setup()
    const prepared = await service.prepare(pack(tier), { userAddress: A })
    assert.equal(prepared.status, 'ready')
    assert.equal(prepared.paperMode, true)
    assert.equal(prepared.requiresConfirmation, true)
    assert.equal(prepared.quote.rule, 'Rule1')
    assert.equal(prepared.quote.payable, false)
    assert.equal(prepared.quote.amountEur, pack(tier).amountEur)
    assert.equal(prepared.quote.amountCents, Number(pack(tier).amountEur) * 100)
    assert.ok(prepared.quote.expiresAtMs - prepared.quote.issuedAtMs <= 30_000)
    assert.equal(prepared.plan.paymentSubmitted, false)
    assert.equal(prepared.plan.nftMinted, false)
  }
})

test('invalid price, tier, user, action and extra live parameter are rejected', async () => {
  const { service } = setup()
  for (const request of [
    { ...pack(), amountEur: '50' },
    { ...pack(), packTier: 'premium' },
    { ...pack(), userAddress: B },
    { ...pack(), type: 'SWAP' },
    { ...pack(), paperMode: false },
    { ...pack(), live: true },
  ]) await expectReject(() => service.prepare(request, { userAddress: A }), 'invalid_or_unowned_pack')
})

test('no audit before confirmation; one confirmation emits only one paper audit event', async () => {
  const { service, logs } = setup()
  const ready = await service.prepare(pack(), { userAddress: A })
  assert.equal(logs.length, 0)
  const result = service.confirm(ready.confirmationId, { userAddress: A })
  assert.equal(result.status, 'paper_success')
  assert.equal(result.paymentVerified, false)
  assert.equal(result.deliveryVerified, false)
  assert.equal(result.nftMinted, false)
  assert.equal(result.txHash, null)
  assert.equal(result.accessGranted, false)
  assert.equal(result.amountChargedCents, 0)
  assert.equal(logs.length, 1)
  assert.equal(logs[0].event, 'lia.simple.paper_execution')
  assert.equal(logs[0].actorHash.length, 64)
  assert.equal('userAddress' in logs[0], false)
  assert.equal('token' in logs[0], false)
})

test('duplicate confirmation is idempotent and does not log or charge twice', async () => {
  const { service, logs } = setup()
  const ready = await service.prepare(pack(), { userAddress: A })
  const first = service.confirm(ready.confirmationId, { userAddress: A })
  const second = service.confirm(ready.confirmationId, { userAddress: A })
  assert.equal(first.auditId, second.auditId)
  assert.equal(second.replayed, true)
  assert.equal(logs.length, 1)
})

test('cannot confirm an expired Rule1 paper quote', async () => {
  const { service, setClock } = setup()
  const ready = await service.prepare(pack(), { userAddress: A })
  setClock(ready.quote.expiresAtMs)
  assert.throws(() => service.confirm(ready.confirmationId, { userAddress: A }), e => e.code === 'simple_quote_expired')
})

test('one actor cannot read, cancel or confirm another actor’s request', async () => {
  const { service } = setup()
  const ready = await service.prepare(pack(), { userAddress: A })
  assert.throws(() => service.confirm(ready.confirmationId, { userAddress: B }), e => e.code === 'confirmation_not_found')
  assert.throws(() => service.cancel(ready.confirmationId, { userAddress: B }), e => e.code === 'confirmation_not_found')
})

test('cancel prevents paper execution and is harmless on repeat', async () => {
  const { service, logs } = setup()
  const ready = await service.prepare(pack(), { userAddress: A })
  assert.equal(service.cancel(ready.confirmationId, { userAddress: A }).status, 'cancelled')
  assert.equal(service.cancel(ready.confirmationId, { userAddress: A }).status, 'cancelled')
  assert.throws(() => service.confirm(ready.confirmationId, { userAddress: A }), e => e.code === 'confirmation_not_available')
  assert.equal(logs.length, 0)
})

test('Guardian fail-closed during preparation and confirmation', async () => {
  let paused = false
  const x = setup({ guardian: () => ({ mode: 'paper', paused }) })
  const ready = await x.service.prepare(pack(), { userAddress: A })
  paused = true
  assert.throws(() => x.service.confirm(ready.confirmationId, { userAddress: A }), e => e.code === 'paper_guardian_paused')
  await expectReject(() => x.service.prepare(pack(), { userAddress: A }), 'paper_guardian_paused')
})

test('no API or model can switch from PAPER to live via config or input', async () => {
  const x = setup({ guardian: () => ({ mode: 'live', paused: false }) })
  await expectReject(() => x.service.prepare(pack(), { userAddress: A }), 'paper_guardian_paused')
  const y = setup()
  await expectReject(() => y.service.prepare({ ...pack(), opts: { paperMode: false } }, { userAddress: A }), 'invalid_or_unowned_pack')
})

test('quote provider outage and bad Rule1 margin fail closed', async () => {
  const x = setup({ quoteProvider: async () => { throw new Error('offline') } })
  await expectReject(() => x.service.prepare(pack(), { userAddress: A }), 'rule1_quote_unavailable')
  const y = setup({ quoteProvider: ({ packTier, nowMs }) => ({
    ...buildPackQuote({ pack_id: packTier, rate_eur_per_egld: 10, now: nowMs }),
    margin_internal: 0.01,
  }) })
  await expectReject(() => y.service.prepare(pack(), { userAddress: A }), 'rule1_quote_invalid_or_expired')
})

test('wrong Rule1 price, rounding gap and rail are rejected', async () => {
  for (const alteration of [
    { amount_cents: 1 },
    { amount_eur: 0 },
    { rounding_gap_eur: 1 },
    { rails: { buyer: ['egld_multiversx'] } },
  ]) {
    const x = setup({ quoteProvider: ({ packTier, nowMs }) => ({
      ...buildPackQuote({ pack_id: packTier, rate_eur_per_egld: 10, now: nowMs }),
      ...alteration,
    }) })
    await expectReject(() => x.service.prepare(pack(), { userAddress: A }), 'rule1_quote_invalid_or_expired')
  }
})

test('per-user bounded preparation quota and capacity fail closed', async () => {
  const x = setup({ maxPreparationsPerHour: 1 })
  await x.service.prepare(pack(), { userAddress: A })
  await expectReject(() => x.service.prepare(pack(), { userAddress: A }), 'paper_rate_limit')
  const y = setup({ maxRecords: 1, maxPreparationsPerHour: 2 })
  await y.service.prepare(pack(), { userAddress: A })
  await expectReject(() => y.service.prepare(pack(), { userAddress: A }), 'paper_capacity_reached')
})

test('audit logger fails: no false paper success or retry', async () => {
  const { service } = setup({ log: () => { throw new Error('logger offline') } })
  const ready = await service.prepare(pack(), { userAddress: A })
  assert.throws(() => service.confirm(ready.confirmationId, { userAddress: A }), e => e.code === 'paper_audit_unavailable')
  assert.throws(() => service.confirm(ready.confirmationId, { userAddress: A }), e => e.code === 'confirmation_not_available')
})
