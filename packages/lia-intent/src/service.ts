import { createHash, randomUUID } from 'node:crypto'
import { z } from 'zod'
import { classifyPackCommand, parseCandidate } from './classifier.js'
import { LiaIntentError, requireCondition } from './errors.js'
import { decimalToAtomic, normalizePackQuote } from './quote.js'
import {
  ActorSchema, CatalogueSchema, CommandRequestSchema, ConfirmationSchema,
  PaperMandateSchema, PaperPlanSchema, PaperReceiptSchema,
} from './schema.js'
import type { Actor, Catalogue, PackTier, PaymentRail, PaperMandate, PaperPlan, PaperReceipt } from './schema.js'

const PolicySchema = z.strictObject({
  maxPreparationsPerUserDay: z.number().int().min(1).max(1000).default(30),
  maxSimulationsPerUserDay: z.number().int().min(1).max(1000).default(10),
  maxOpenPerUser: z.number().int().min(1).max(20).default(5),
  maxRecords: z.number().int().min(1).max(10_000).default(1000),
  adapterTimeoutMs: z.number().int().min(10).max(10_000).default(1500),
})
type Policy = z.input<typeof PolicySchema>
export interface PaperIntentDependencies {
  catalogue: Catalogue
  // This is an internal, read-only host adapter, never a URL or client-provided quote.
  quoteProvider: (input: { packTier: PackTier; paymentRail: PaymentRail; nowMs: number; signal: AbortSignal }) => Promise<unknown>
  classifier?: (input: { raw: string; signal: AbortSignal }) => Promise<unknown>
  guardian: () => { paused: boolean }
  clock?: () => number
  newId?: () => string
  policy?: Policy
}
export type PreparationResult =
  | { status: 'clarify'; code: string; fields: string[] }
  | { status: 'blocked'; code: string }
  | { status: 'ready'; mode: 'paper'; requiresConfirmation: true; digest: string; mandate: PaperMandate; plan: PaperPlan }

interface RecordEntry {
  mandate: PaperMandate; plan: PaperPlan; digest: string
  state: 'quoted' | 'cancelled' | 'simulated'; receipt?: PaperReceipt
}
interface DailyUsage { day: number; preparations: number; simulations: number }
const GuardianSchema = z.strictObject({ paused: z.boolean() })
const STEP_ACTIONS = ['CREATE_ORDER', 'VERIFY_PAYMENT', 'REQUEST_DELIVERY', 'VERIFY_DELIVERY'] as const
const sha256 = (text: string) => createHash('sha256').update(text).digest('hex')
const copy = <T>(value: T): T => structuredClone(value)

async function bounded<T>(run: (signal: AbortSignal) => Promise<T>, ms: number, external?: AbortSignal): Promise<T> {
  const controller = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined
  let onAbort: (() => void) | undefined
  try {
    return await Promise.race([
      new Promise<T>((_, reject) => {
        onAbort = () => { controller.abort(); reject(new LiaIntentError('CANCELLED')) }
        if (external?.aborted) { onAbort(); return }
        external?.addEventListener('abort', onAbort, { once: true })
        timer = setTimeout(() => { controller.abort(); reject(new LiaIntentError('ADAPTER_TIMEOUT')) }, ms)
      }),
      Promise.resolve().then(() => {
        requireCondition(!controller.signal.aborted, 'CANCELLED')
        return run(controller.signal)
      }),
    ])
  } finally {
    clearTimeout(timer)
    if (onAbort) external?.removeEventListener('abort', onAbort)
  }
}

/**
 * Isolated paper-only server service. It has no signer, HTTP writer or relayer port.
 * The in-memory ledger is bounded and intentionally unsuitable for live authorization.
 */
export function createPaperIntentService(dependencies: PaperIntentDependencies) {
  const catalogue = CatalogueSchema.parse(dependencies.catalogue)
  requireCondition(typeof dependencies.quoteProvider === 'function' && typeof dependencies.guardian === 'function', 'INVALID_CONFIGURATION')
  const policy = PolicySchema.parse(dependencies.policy ?? {})
  const clock = dependencies.clock ?? Date.now
  const newId = dependencies.newId ?? randomUUID
  const catalogueDigest = sha256(JSON.stringify(catalogue))
  const records = new Map<string, RecordEntry>()
  const usage = new Map<string, DailyUsage>()
  let lastTime = 0

  function now() {
    const value = clock()
    requireCondition(Number.isSafeInteger(value) && value >= lastTime, 'CLOCK_INVALID')
    lastTime = value
    return value
  }
  function checkGuardian() {
    try { requireCondition(!GuardianSchema.parse(dependencies.guardian()).paused, 'GUARDIAN_PAUSED') }
    catch (error) {
      if (error instanceof LiaIntentError) throw error
      throw new LiaIntentError('GUARDIAN_UNAVAILABLE')
    }
  }
  function quota(user: string, time: number) {
    const day = Math.floor(time / 86_400_000)
    for (const [key, row] of usage) if (row.day !== day) usage.delete(key)
    let row = usage.get(user)
    if (!row) {
      requireCondition(usage.size < policy.maxRecords, 'CAPACITY_LIMIT')
      row = { day, preparations: 0, simulations: 0 }
      usage.set(user, row)
    }
    return row
  }
  function find(input: unknown, actorInput: unknown) {
    const actor = ActorSchema.parse(actorInput)
    const confirmation = ConfirmationSchema.parse(input)
    const record = records.get(confirmation.mandateId)
    // Avoid exposing whether a mandate exists for another user.
    requireCondition(record && record.mandate.userAddress === actor.userAddress, 'MANDATE_NOT_FOUND')
    requireCondition(record.digest === confirmation.digest, 'MANDATE_CHANGED')
    return { actor, record }
  }

  async function processCommand(input: unknown, actorInput: unknown, signal?: AbortSignal): Promise<PreparationResult> {
    try {
      const request = CommandRequestSchema.parse(input)
      const actor = ActorSchema.parse(actorInput)
      const time = now()
      checkGuardian()
      const daily = quota(actor.userAddress, time)
      requireCondition(daily.preparations < policy.maxPreparationsPerUserDay, 'PREPARATION_LIMIT')
      daily.preparations++ // Invalid/low-confidence model answers still consume a bounded request.
      for (const [id, record] of records) if (record.mandate.expiresAtMs + 300_000 <= time) records.delete(id)
      requireCondition(records.size < policy.maxRecords, 'CAPACITY_LIMIT')
      const open = [...records.values()].filter(r => r.mandate.userAddress === actor.userAddress && r.state === 'quoted' && r.mandate.expiresAtMs > time).length
      requireCondition(open < policy.maxOpenPerUser, 'OPEN_MANDATE_LIMIT')

      const candidate = dependencies.classifier
        ? parseCandidate(await bounded(s => dependencies.classifier!({ raw: request.raw, signal: s }), policy.adapterTimeoutMs, signal))
        : classifyPackCommand(request.raw)
      if (!candidate || candidate.type === 'UNKNOWN' || candidate.confidence < 0.75) {
        return { status: 'clarify', code: 'INTENT_UNCLEAR', fields: ['action', 'packTier'] }
      }
      requireCondition(candidate.type === 'BUY_PACK', 'ACTION_NOT_ALLOWED')
      if (!candidate.slots.packTier) return { status: 'clarify', code: 'PACK_REQUIRED', fields: ['packTier'] }
      if (!request.paymentRail) return { status: 'clarify', code: 'PAYMENT_RAIL_REQUIRED', fields: ['paymentRail'] }
      const packTier = candidate.slots.packTier
      const price = catalogue[packTier]
      requireCondition(!candidate.slots.recipient || candidate.slots.recipient === actor.userAddress, 'SELF_DELIVERY_ONLY')
      requireCondition((candidate.slots.amount === undefined) === (candidate.slots.currency === undefined), 'AMOUNT_CURRENCY_REQUIRED')
      if (candidate.slots.amount !== undefined) {
        requireCondition(BigInt(decimalToAtomic(candidate.slots.amount, 2)) === BigInt(price), 'CATALOGUE_PRICE_MISMATCH')
      }
      const quoteTime = now()
      const legacyQuote = await bounded(s => dependencies.quoteProvider({ packTier, paymentRail: request.paymentRail!, nowMs: quoteTime, signal: s }), policy.adapterTimeoutMs, signal)
      if (signal?.aborted) throw new LiaIntentError('CANCELLED')
      checkGuardian()
      const quote = normalizePackQuote(legacyQuote, {
        id: newId(), userAddress: actor.userAddress, packTier,
        paymentRail: request.paymentRail, amountCents: price, nowMs: now(),
      })
      const mandate = PaperMandateSchema.parse({
        schema: 'xartists.lia.paper_mandate.v1', id: newId(), mode: 'paper', authorization: 'none', requiresConfirmation: true,
        userAddress: actor.userAddress, network: 'multiversx-mainnet', action: 'BUY_PACK',
        packTier, recipient: actor.userAddress, quantity: 1, catalogueDigest,
        rawDigest: sha256(request.raw), quote, issuedAtMs: quote.issuedAtMs, expiresAtMs: quote.expiresAtMs,
      })
      const digest = sha256(JSON.stringify(mandate))
      const plan = PaperPlanSchema.parse({
        mandateId: mandate.id, mode: 'paper', estimatedGas: null, gasStatus: 'not_quoted',
        steps: STEP_ACTIONS.map((action, i) => ({ id: String(i + 1), action, status: 'pending' })),
      })
      // Recheck after asynchronous reads: overlapping preparations cannot overfill the ledger.
      requireCondition(records.size < policy.maxRecords, 'CAPACITY_LIMIT')
      const currentOpen = [...records.values()].filter(r => r.mandate.userAddress === actor.userAddress && r.state === 'quoted' && r.mandate.expiresAtMs > now()).length
      requireCondition(currentOpen < policy.maxOpenPerUser && !records.has(mandate.id), 'OPEN_MANDATE_LIMIT')
      records.set(mandate.id, { mandate, plan, digest, state: 'quoted' })
      return copy({ status: 'ready', mode: 'paper', requiresConfirmation: true, digest, mandate, plan })
    } catch (error) {
      return { status: 'blocked', code: error instanceof LiaIntentError ? error.code : 'INVALID_OR_UNAVAILABLE_INPUT' }
    }
  }

  function confirmMandate(input: unknown, actorInput: unknown): PaperReceipt {
    const { record, actor } = find(input, actorInput)
    const time = now()
    checkGuardian()
    if (record.receipt) return copy(record.receipt) // Idempotent replay; no new simulation or quota charge.
    requireCondition(record.state === 'quoted', 'MANDATE_CANCELLED')
    requireCondition(record.mandate.expiresAtMs > time, 'QUOTE_EXPIRED')
    const daily = quota(actor.userAddress, time)
    requireCondition(daily.simulations < policy.maxSimulationsPerUserDay, 'SIMULATION_LIMIT')
    const receipt = PaperReceiptSchema.parse({
      schema: 'xartists.lia.paper_receipt.v1', mandateId: record.mandate.id,
      digest: record.digest, mode: 'paper', status: 'simulated',
      paymentVerified: false, deliveryVerified: false, chainStatus: 'not_submitted', simulatedAtMs: time,
      steps: record.plan.steps.map(step => ({ ...step, status: 'simulated' })),
    })
    daily.simulations++
    record.receipt = receipt
    record.state = 'simulated'
    return copy(receipt)
  }

  function cancelMandate(input: unknown, actorInput: unknown): { status: 'cancelled' } {
    const { record } = find(input, actorInput)
    requireCondition(record.state !== 'simulated', 'ALREADY_SIMULATED')
    record.state = 'cancelled'
    return { status: 'cancelled' }
  }

  return { processCommand, confirmMandate, cancelMandate }
}
