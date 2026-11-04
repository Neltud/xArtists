import { z } from 'zod'
import { requireCondition } from './errors.js'
import { PackTierSchema, QuoteSnapshotSchema } from './schema.js'
import type { PackTier, PaymentRail, QuoteSnapshot } from './schema.js'

const LegacyQuoteSchema = z.strictObject({
  ok: z.literal(true), schema: z.literal('xartists.pack_quote.v1'),
  pack_id: PackTierSchema, currency: z.literal('EUR'), amount_cents: z.number().int().positive().safe(),
  amount_eur: z.number().finite().positive(), amount_egld: z.number().finite().positive(),
  rate_eur_per_egld: z.number().finite().positive(), margin_internal: z.literal(0.04),
  margin_eur_accounting: z.number().finite().nonnegative(), rounding_gap_eur: z.number().finite().nonnegative(),
  tolerance_eur: z.literal(0.02), sc_reference_egld: z.number().finite().positive(),
  created_at: z.iso.datetime(), expires_at: z.iso.datetime(), expires_in_ms: z.number().int().positive().safe(),
  rails: z.strictObject({ buyer: z.array(z.enum(['eur_paybox', 'egld_multiversx'])), seller_settlement: z.array(z.literal('egld_multiversx')) }),
})
const RATE_SCALE = 10n ** 12n
const EGLD_TICKS = 10_000n
const ATOMIC_PER_TICK = 10n ** 14n

/** Decimal text only; no floating arithmetic, exponents, negative or zero amounts. */
export function decimalToAtomic(value: string, decimals: number): string {
  requireCondition(Number.isInteger(decimals) && decimals >= 0 && decimals <= 18, 'INVALID_DECIMALS')
  requireCondition(/^(0|[1-9]\d{0,30})(\.\d+)?$/.test(value) && value.length <= 64, 'INVALID_DECIMAL')
  const [whole, fraction = ''] = value.split('.')
  requireCondition(fraction.length <= decimals, 'DECIMAL_PRECISION')
  return (BigInt(whole!) * 10n ** BigInt(decimals) + BigInt(fraction.padEnd(decimals, '0') || '0')).toString()
}

// The legacy quote engine remains authoritative for catalogue/FX retrieval. This adapter
// verifies its money leg with exact integer arithmetic; its 4% margin never changes payment.
export function normalizePackQuote(input: unknown, scope: {
  id: string; userAddress: string; packTier: PackTier; paymentRail: PaymentRail;
  amountCents: number; nowMs: number;
}): QuoteSnapshot {
  const q = LegacyQuoteSchema.parse(input)
  requireCondition(q.pack_id === scope.packTier && q.amount_cents === scope.amountCents &&
    q.amount_eur === scope.amountCents / 100, 'QUOTE_CATALOGUE_MISMATCH')
  requireCondition(q.rails.buyer.includes(scope.paymentRail), 'QUOTE_RAIL_MISMATCH')
  const rateText = String(q.rate_eur_per_egld)
  const rate = BigInt(decimalToAtomic(rateText, 12))
  requireCondition(rate > 0n, 'INVALID_FX_RATE')
  const numerator = BigInt(scope.amountCents) * RATE_SCALE * EGLD_TICKS
  const denominator = 100n * rate
  const ticks = (numerator + denominator - 1n) / denominator
  const expectedAtomic = ticks * ATOMIC_PER_TICK
  const actualAtomic = BigInt(decimalToAtomic(String(q.amount_egld), 18))
  requireCondition(expectedAtomic > 0n && actualAtomic === expectedAtomic, 'RULE1_AMOUNT_MISMATCH')
  // Gap <= 2 EUR cents, with the full rational denominator retained.
  requireCondition(ticks * rate * 100n - numerator <= 2n * RATE_SCALE * EGLD_TICKS, 'RULE1_ROUNDING_GAP')
  const issuedAtMs = Date.parse(q.created_at)
  const sourceExpiresAtMs = Date.parse(q.expires_at)
  requireCondition(Number.isSafeInteger(scope.nowMs) && issuedAtMs <= scope.nowMs &&
    sourceExpiresAtMs - issuedAtMs === q.expires_in_ms, 'QUOTE_TIME_INVALID')
  const expiresAtMs = Math.min(sourceExpiresAtMs, issuedAtMs + 30_000)
  requireCondition(expiresAtMs > scope.nowMs, 'QUOTE_EXPIRED')
  const fiat = scope.paymentRail === 'eur_paybox'
  return QuoteSnapshotSchema.parse({
    schema: 'xartists.lia.quote.v1', id: scope.id, userAddress: scope.userAddress,
    packTier: scope.packTier, paymentRail: scope.paymentRail, amountCents: scope.amountCents,
    payment: { asset: fiat ? 'EUR' : 'EGLD', decimals: fiat ? 2 : 18,
      amountAtomic: fiat ? String(scope.amountCents) : expectedAtomic.toString() },
    cryptoAmountAtomic: expectedAtomic.toString(), rateEurPerEgld: rateText,
    marginBpsInternal: 400, issuedAtMs, expiresAtMs, balanceStatus: 'not_checked',
  })
}
