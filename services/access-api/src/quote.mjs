/**
 * Pack quote — Rule 1 (2026-10-27).
 * Client pays fiat anchors only. Margin 4% is internal (not added to client price,
 * not applied as a crypto FX markup). Server is sole authority for amounts.
 *
 * PAPER / SANDBOX: no payment execution in this module.
 */
export const RULE1 = Object.freeze({
  margin: 0.04,
  egldDecimals: 4,
  toleranceEur: 0.02,
  quoteTtlMs: 12 * 60 * 1000,
  currency: 'EUR',
})

/** Client-facing anchors (centimes). */
export const PACK_FIAT_CENTS = Object.freeze({
  pulse: 11000,
  yield: 7500,
  sentinel: 5000,
})

/** On-chain reference list (EGLD) — informational for crypto rail derivation. */
export const PACK_SC_EGLD = Object.freeze({
  pulse: 10,
  yield: 5,
  sentinel: 2.5,
})

/**
 * @param {number} n
 * @param {number} dp
 */
export function ceilDp(n, dp) {
  if (!Number.isFinite(n) || n < 0) return null
  const f = 10 ** dp
  return Math.ceil(n * f - Number.EPSILON) / f
}

/**
 * Build a signed-ready quote payload (HMAC left to caller / session layer).
 * @param {{ pack_id: string, rate_eur_per_egld: number, now?: number }} input
 */
export function buildPackQuote(input) {
  const packId = String(input.pack_id || '').toLowerCase()
  const listCents = PACK_FIAT_CENTS[packId]
  if (!listCents) {
    const err = new Error('unknown_pack_id')
    err.statusCode = 400
    throw err
  }
  const rate = Number(input.rate_eur_per_egld)
  if (!Number.isFinite(rate) || rate <= 0) {
    const err = new Error('invalid_fx_rate')
    err.statusCode = 400
    throw err
  }

  const now = Number(input.now) || Date.now()
  const listEur = listCents / 100
  // Internal economic base after removing embedded margin (merchant economics)
  const baseEur = listEur / (1 + RULE1.margin)
  const rawEgld = baseEur / rate
  const amountEgld = ceilDp(rawEgld, RULE1.egldDecimals)
  if (amountEgld == null || amountEgld <= 0) {
    const err = new Error('invalid_egld_amount')
    err.statusCode = 500
    throw err
  }

  const impliedEur = amountEgld * rate
  const roundingGapEur = Math.abs(impliedEur - baseEur)
  if (roundingGapEur > RULE1.toleranceEur + 1e-9) {
    const err = new Error('rounding_gap_exceeds_tolerance')
    err.statusCode = 422
    err.gap = roundingGapEur
    throw err
  }

  return {
    ok: true,
    schema: 'xartists.pack_quote.v1',
    pack_id: packId,
    currency: RULE1.currency,
    // What the client pays on the fiat rail
    amount_cents: listCents,
    amount_eur: listEur,
    // Crypto rail (derived) — same economic value at locked rate
    amount_egld: amountEgld,
    rate_eur_per_egld: rate,
    margin_internal: RULE1.margin,
    rounding_gap_eur: Number(roundingGapEur.toFixed(6)),
    tolerance_eur: RULE1.toleranceEur,
    sc_reference_egld: PACK_SC_EGLD[packId],
    created_at: new Date(now).toISOString(),
    expires_at: new Date(now + RULE1.quoteTtlMs).toISOString(),
    expires_in_ms: RULE1.quoteTtlMs,
    rails: {
      buyer: ['eur_paybox', 'egld_multiversx'],
      seller_settlement: ['egld_multiversx'],
    },
  }
}

export function isQuoteExpired(quote, now = Date.now()) {
  if (!quote?.expires_at) return true
  return Date.parse(quote.expires_at) <= now
}
