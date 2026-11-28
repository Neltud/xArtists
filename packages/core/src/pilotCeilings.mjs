/** Generic pilot ceilings, not account balances, provider grants or an execution ledger. */
export const MAX_REFERENCE_CAPITAL_CENTS = 10_000

export function pilotCeilings(referenceCapitalCents) {
  if (referenceCapitalCents !== null &&
      (!Number.isSafeInteger(referenceCapitalCents) || referenceCapitalCents < 0))
    throw new TypeError('nonnegative_integer_usd_cents_or_null_required')
  const capital = Math.min(referenceCapitalCents ?? 0, MAX_REFERENCE_CAPITAL_CENTS)
  const perNetwork = Math.floor(capital * 40 / 100)
  const network = () => ({ capital_ceiling_cents: perNetwork,
    max_order_cents: Math.floor(capital * 5 / 100), max_open_positions: 1,
    loss_stop_rolling_24h_cents: Math.floor(capital / 100),
    loss_stop_pilot_cents: Math.floor(capital * 25 / 1000) })
  return { currency: 'USD', mode: 'reference_only',
    reference_capital_provided: referenceCapitalCents !== null,
    reference_capital_cents: capital, maximum_reference_capital_cents: MAX_REFERENCE_CAPITAL_CENTS,
    live_budget_cents: 0, execution_authorized: false,
    networks: { multiversx: network(), solana: network() },
    other_paybox_networks: { capital_ceiling_cents: 0, max_order_cents: 0 },
    reserve_cents: capital - 2 * perNetwork,
    global: { max_open_positions: 2, max_open_notional_cents: Math.floor(capital * 10 / 100),
      loss_stop_rolling_24h_cents: Math.floor(capital * 2 / 100),
      loss_stop_pilot_cents: Math.floor(capital * 5 / 100) } }
}
