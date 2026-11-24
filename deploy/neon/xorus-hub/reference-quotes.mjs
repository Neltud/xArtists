/** Schema for a future licensed reference feed. No prices, no I/O, no execution. */

const UNIVERSE = Object.freeze([
  Object.freeze({ symbol: 'EGLD', network: 'multiversx', identity: 'native', swap_support_proven: false }),
  Object.freeze({ symbol: 'SOL', network: 'solana', identity: 'native', swap_support_proven: false }),
  Object.freeze({ symbol: 'ETH', network: 'ethereum', identity: 'native', swap_support_proven: false }),
  Object.freeze({ symbol: 'POL', network: 'polygon', identity: 'native', swap_support_proven: false }),
])

const MAX_AGE_MS = 15_000

export function referenceQuoteManifest(clock = Date.now) {
  const time = Number.isFinite(clock) ? clock : Date.now()
  return {
    schema_version: 1,
    policy_id: 'xorus-reference-quotes-v1',
    status: 'schema_only_no_licensed_feed',
    executable: false,
    execution_authorized: false,
    signing_authorized: false,
    trading_enabled: false,
    independently_verified_market_signals: 0,
    rights_status: 'no_market_data_used_or_commercially_licensed',
    valuation: 'not_a_fill_not_a_nav',
    feed: null,
    quotes: [],
    universe: UNIVERSE.map((row) => ({ ...row })),
    accept_rules: {
      max_age_ms: MAX_AGE_MS,
      require_source_url: true,
      require_observed_at: true,
      reject_if_marked_executable: true,
      prices_are_not_collected_by_this_module: true,
    },
    checked_at: new Date(time).toISOString(),
  }
}

function httpsSource(value) {
  if (typeof value !== 'string' || value.length < 12 || value.length > 200) return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.username === '' && url.password === '' && url.hostname.includes('.')
  } catch {
    return false
  }
}

/** Pure admission check for a quote an operator might later paste. Never a fill. */
export function assessReferenceQuote(input, now = Date.now()) {
  const locked = { executable: false, execution_authorized: false, signing_authorized: false }
  if (!input || typeof input !== 'object' || Array.isArray(input))
    return { ok: false, error: 'quote_object_required', ...locked }
  if (input.executable === true || input.execution_authorized === true || input.signing_authorized === true)
    return { ok: false, error: 'executable_quote_rejected', ...locked }
  const known = UNIVERSE.find((row) => row.symbol === input.symbol && row.network === input.network)
  if (!known) return { ok: false, error: 'asset_not_in_reference_universe', ...locked }
  if (typeof input.observed_at !== 'string') return { ok: false, error: 'observed_at_required', ...locked }
  const observed = Date.parse(input.observed_at)
  if (!Number.isFinite(observed)) return { ok: false, error: 'observed_at_invalid', ...locked }
  const age = now - observed
  if (!Number.isFinite(age) || age < 0 || age > MAX_AGE_MS)
    return { ok: false, error: 'quote_stale_or_future', ...locked }
  if (!httpsSource(input.source_url)) return { ok: false, error: 'https_source_url_required', ...locked }
  if (!Number.isSafeInteger(input.price_micro_usd) || input.price_micro_usd <= 0)
    return { ok: false, error: 'positive_integer_micro_usd_required', ...locked }
  return {
    ok: true,
    ...locked,
    quote: {
      symbol: known.symbol,
      network: known.network,
      identity: known.identity,
      price_micro_usd: input.price_micro_usd,
      observed_at: new Date(observed).toISOString(),
      source_url: input.source_url,
      swap_support_proven: false,
      independently_verified: false,
      usable_as_fill: false,
    },
  }
}
