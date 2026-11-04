/**
 * Simulation-only revenue ledger. Not a PSP or settlement event processor.
 * Persistent accounting and verified receipts require a different audited system.
 */
import { createHash } from 'node:crypto'
import { PlatformGateError } from './platform.mjs'

const ID = /^[a-z][a-z0-9.-]{2,63}$/
const KEY = /^[A-Za-z0-9._:-]{8,128}$/
const RESOURCE = /^[a-z][a-z0-9-]{1,31}:[A-Za-z0-9._-]{1,96}$/
const MONEY = /^(0|[1-9]\d{0,14})$/
const FIELD_NAMES = [
  'schema', 'pluginId', 'resource', 'idempotencyKey', 'currency', 'grossMinor',
  'pspMinor', 'providerMinor', 'storageMinor', 'relayerMinor', 'refundMinor', 'rebateMinor', 'creatorShareBps',
]
const FINANCE_NAMES = ['grossMinor', 'pspMinor', 'providerMinor', 'storageMinor', 'relayerMinor', 'refundMinor', 'rebateMinor']
function fail(code, status = 400) { throw new PlatformGateError(code, status) }
function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype }
function safeCtx(ctx) {
  if (!object(ctx) || ctx.authenticated !== true || typeof ctx.isAdmin !== 'boolean' ||
      typeof ctx.actorId !== 'string' || typeof ctx.tenantId !== 'string' ||
      !KEY.test(ctx.actorId) || !KEY.test(ctx.tenantId)) fail('authenticated_tenant_actor_required', 401)
  return ctx
}
function normalize(input) {
  if (!object(input) || Object.keys(input).length !== FIELD_NAMES.length || FIELD_NAMES.some(k => !Object.hasOwn(input, k))) fail('paper_revenue_schema_invalid')
  if (input.schema !== 'xartists.revenue.paper.v1' || !ID.test(input.pluginId) ||
      !RESOURCE.test(input.resource) || !KEY.test(input.idempotencyKey) || input.currency !== 'EUR' ||
      !Number.isInteger(input.creatorShareBps) || input.creatorShareBps < 0 || input.creatorShareBps > 10_000) fail('paper_revenue_schema_invalid')
  for (const f of FINANCE_NAMES) if (typeof input[f] !== 'string' || !MONEY.test(input[f])) fail('paper_revenue_amount_invalid')
  const gross = BigInt(input.grossMinor)
  if (gross <= 0n || gross > 1_000_000_000_000n) fail('paper_revenue_amount_invalid')
  const out = Object.fromEntries(FIELD_NAMES.map(k => [k, input[k]]))
  for (const f of FINANCE_NAMES) out[f] = BigInt(out[f]).toString()
  return out
}
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const zero = () => ({
  paymentVerified: false, settlementVerified: false, deliveryVerified: false,
  recognizedRevenueMinor: '0', actualCreatorPaidMinor: '0', actualTreasuryReceivedMinor: '0',
  txHash: null, settlementReference: null, transferSubmitted: false,
})

export function createPaperRevenueRouter({ authorize, clock = Date.now, maxRecords = 10_000 } = {}) {
  if (typeof authorize !== 'function' || typeof clock !== 'function' || !Number.isInteger(maxRecords) || maxRecords < 1 || maxRecords > 100_000) fail('paper_revenue_configuration_invalid', 503)
  const records = new Map() // bounded demo storage; not durable, atomic across replicas or real accounting
  function time() { const t = clock(); if (!Number.isSafeInteger(t) || t < 0) fail('paper_revenue_clock_invalid', 503); return t }
  function simulate(input, context) {
    const ctx = safeCtx(context)
    const value = normalize(input)
    const key = JSON.stringify([ctx.tenantId, value.pluginId, value.idempotencyKey])
    const hash = digest(value)
    const prior = records.get(key)
    if (prior) {
      if (prior.actorId !== ctx.actorId) fail('paper_revenue_not_found', 404)
      if (prior.hash !== hash) fail('paper_idempotency_conflict', 409)
      // This is a historic paper receipt, not an authorization to act or new credit.
      return structuredClone(prior.receipt)
    }
    if (records.size >= maxRecords) fail('paper_ledger_capacity', 429)
    const auth = authorize({ pluginId: value.pluginId, scope: 'orders:prepare:paper', resource: value.resource }, ctx)
    if (!auth || auth.authorized !== true || auth.mode !== 'paper' || auth.spendAuthorized !== false ||
        typeof auth.manifestDigest !== 'string' || !/^[a-f0-9]{64}$/.test(auth.manifestDigest)) fail('paper_revenue_not_authorized', 403)
    const gross = BigInt(value.grossMinor)
    const cost = ['pspMinor', 'providerMinor', 'storageMinor', 'relayerMinor', 'refundMinor', 'rebateMinor']
      .reduce((sum, f) => sum + BigInt(value[f]), 0n)
    const net = gross - cost
    const distributable = net > 0n ? net : 0n
    const creator = distributable * BigInt(value.creatorShareBps) / 10_000n
    const platform = distributable - creator
    const result = {
      schema: 'xartists.revenue.paper_receipt.v1', mode: 'paper',
      tenantId: ctx.tenantId, actorId: ctx.actorId, pluginId: value.pluginId,
      resource: value.resource, idempotencyKey: value.idempotencyKey,
      manifestDigest: auth.manifestDigest,
      currency: 'EUR', decimals: 2, createdAtMs: time(),
      grossEstimateMinor: gross.toString(), totalCostEstimateMinor: cost.toString(),
      netEstimateMinor: net.toString(), creatorEstimateMinor: creator.toString(),
      platformEstimateMinor: platform.toString(), unallocatedLossEstimateMinor: (net < 0n ? net : 0n).toString(),
      creatorShareBps: value.creatorShareBps,
      ...zero(),
    }
    records.set(key, { tenantId: ctx.tenantId, actorId: ctx.actorId, pluginId: value.pluginId, hash, receipt: result })
    return structuredClone(result)
  }
  function reconcile({ pluginId }, context) {
    const ctx = safeCtx(context)
    if (!ctx.isAdmin) fail('paper_revenue_admin_required', 403)
    if (!ID.test(pluginId)) fail('paper_revenue_plugin_invalid')
    const selected = [...records.values()].filter(r => r.tenantId === ctx.tenantId && r.pluginId === pluginId)
    const sums = selected.reduce((tot, row) => {
      for (const field of ['grossEstimateMinor', 'totalCostEstimateMinor', 'netEstimateMinor', 'creatorEstimateMinor', 'platformEstimateMinor']) {
        tot[field] += BigInt(row.receipt[field])
      }
      return tot
    }, Object.fromEntries(['grossEstimateMinor', 'totalCostEstimateMinor', 'netEstimateMinor', 'creatorEstimateMinor', 'platformEstimateMinor'].map(f => [f, 0n])))
    return {
      schema: 'xartists.revenue.paper_reconciliation.v1',
      mode: 'paper', tenantId: ctx.tenantId, pluginId,
      paperEventCount: selected.length,
      ...Object.fromEntries(Object.entries(sums).map(([k, v]) => [k, v.toString()])),
      actualRevenueVerifiedMinor: '0', settledEventsCount: 0, proofAvailable: false,
    }
  }
  return Object.freeze({ simulate, reconcile })
}
