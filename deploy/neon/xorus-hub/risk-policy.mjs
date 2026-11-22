/** Generic pilot ceilings, not account balances, provider grants or an execution ledger. */
const MAX_REFERENCE_CAPITAL_CENTS = 10_000

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

export function riskPolicy() {
  return { schema_version: 1, policy_id: 'xorus-conservative-pilot-v1',
    status: 'reference_policy_execution_disabled', currency: 'USD',
    execution_authorized: false, signing_authorized: false, live_budget_cents: 0,
    model_inference_configured: false, live_risk_ledger_implemented: false,
    paper_risk_ledger_implemented: true, paper_ledger_scope: 'operator_virtual_pilot_only',
    account_balances_verified: false, dedicated_capital_verified: false,
    paybox_grants_verified: false, provider_grants_modified: false,
    asset_universe: { requested_scope: 'all_provider_compatible_tokens_plus_multiversx',
      paybox: { families: ['solana', 'evm'],
        source: 'https://docs.paybox.sh/reference/mcp-tools',
        catalog_membership_proves_swap_support: false,
        exact_chain_contract_or_mint_required: true, supported_route_required: true },
      multiversx: { network_id: '1', signer: 'separate_user_wallet',
        exact_native_or_esdt_identifier_required: true },
      eligible_for_execution_in_this_service: false,
      new_assets_must_pass: ['exact_identity', 'wallet_grant', 'liquidity_and_exit_route',
        'fresh_quote_and_usd_valuation', 'transaction_simulation', 'fee_and_risk_ledger'] },
    reference_pilot: pilotCeilings(MAX_REFERENCE_CAPITAL_CENTS),
    actual_capital_allocation: pilotCeilings(null),
    trading_constraints: { spot_only: true, leverage_max: 1, max_slippage_bps: 50,
      max_quote_age_seconds: 30, unpriced_asset_action: 'ABSTAIN',
      max_open_positions_per_network: 1, unlimited_allowances_allowed: false,
      automatic_deposits_allowed: false, automatic_bridges_allowed: false,
      martingale_allowed: false, automatic_budget_increase_allowed: false,
      native_gas_reserve_required: true, unknown_costs_action: 'ABSTAIN' },
    loss_accounting: { window: 'rolling_24h',
      includes: ['realized_losses', 'unrealized_losses', 'network_fees', 'platform_fees'],
      profits_refill_loss_allowance: false, pilot_stop_resets_automatically: false,
      threshold_action: 'halt_new_entries', permitted_exit: 'separately_authorized_risk_reducing_exit',
      stop_threshold_is_guaranteed_maximum_loss: false,
      enforcement: 'not_implemented_for_live_execution' },
    readiness_requires: ['dedicated_capital_and_balances_verified', 'provider_wallet_grants_verified',
      'exact_asset_and_venue_support_verified', 'persistent_atomic_risk_ledger',
      'reviewed_signing_adapter', 'authorized_transaction_and_fee_limits'],
    limits: { policy_is_provider_approval: false, policy_is_deposit_instruction: false,
      policy_overrides_existing_stricter_limits: false, funds_moved: false } }
}
