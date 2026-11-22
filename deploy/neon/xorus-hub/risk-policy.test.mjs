import test from 'node:test'
import assert from 'node:assert/strict'
import { pilotCeilings, riskPolicy } from './risk-policy.mjs'
import { createHub } from './hub.mjs'

test('100 USD reference pilot separates capital, order caps, reserve and loss stops', () => {
  const plan = pilotCeilings(10_000)
  assert.equal(plan.networks.multiversx.capital_ceiling_cents, 4000)
  assert.equal(plan.networks.solana.capital_ceiling_cents, 4000)
  assert.equal(plan.reserve_cents, 2000)
  assert.equal(plan.networks.solana.max_order_cents, 500)
  assert.equal(plan.networks.solana.loss_stop_rolling_24h_cents, 100)
  assert.equal(plan.networks.multiversx.loss_stop_pilot_cents, 250)
  assert.equal(plan.global.loss_stop_rolling_24h_cents, 200)
  assert.equal(plan.global.loss_stop_pilot_cents, 500)
  assert.equal(plan.other_paybox_networks.capital_ceiling_cents, 0)
  assert.equal(plan.live_budget_cents, 0)
})

test('unknown, smaller and larger reference capital never invents or increases available funds', () => {
  const unknown = pilotCeilings(null)
  assert.equal(unknown.reference_capital_provided, false)
  assert.equal(unknown.reference_capital_cents, 0)
  assert.equal(unknown.networks.solana.max_order_cents, 0)
  const small = pilotCeilings(5000)
  assert.equal(small.networks.multiversx.capital_ceiling_cents, 2000)
  assert.equal(small.global.loss_stop_rolling_24h_cents, 100)
  assert.equal(small.global.loss_stop_pilot_cents, 250)
  assert.equal(pilotCeilings(100_000).reference_capital_cents, 10_000)
})

test('rounding cannot allocate more than the reference capital or create fractional cents', () => {
  for (const cents of [0, 1, 3, 99, 101, 9999, Number.MAX_SAFE_INTEGER]) {
    const plan = pilotCeilings(cents)
    assert.equal(plan.networks.solana.capital_ceiling_cents + plan.networks.multiversx.capital_ceiling_cents + plan.reserve_cents, plan.reference_capital_cents)
    assert.ok(Number.isInteger(plan.global.loss_stop_pilot_cents))
    assert.equal(plan.execution_authorized, false)
  }
})

test('invalid monetary inputs fail instead of coercing strings, booleans or unsafe values', () => {
  for (const value of [undefined, true, '10000', -1, 1.1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, {}, []])
    assert.throws(() => pilotCeilings(value), /nonnegative_integer/)
})

test('a broad token universe is not a wildcard signing grant or proof of support', () => {
  const policy = riskPolicy()
  assert.equal(policy.asset_universe.paybox.catalog_membership_proves_swap_support, false)
  assert.equal(policy.asset_universe.paybox.exact_chain_contract_or_mint_required, true)
  assert.equal(policy.asset_universe.multiversx.signer, 'separate_user_wallet')
  assert.equal(policy.asset_universe.eligible_for_execution_in_this_service, false)
  assert.equal(policy.loss_accounting.stop_threshold_is_guaranteed_maximum_loss, false)
  assert.equal(policy.loss_accounting.profits_refill_loss_allowance, false)
  assert.equal(policy.live_risk_ledger_implemented, false)
  policy.reference_pilot.networks.solana.capital_ceiling_cents = 999999
  assert.equal(riskPolicy().reference_pilot.networks.solana.capital_ceiling_cents, 4000)
})

test('policy reads use no wallets, network or database, and cannot enable execution even with old live flags', async () => {
  const fail = () => assert.fail('policy read attempted external access')
  const hub = createHub({ fetchImpl: fail, store: { read: fail, claim: fail },
    env: { LIA_LIVE_TRADING: '1', XORUS_ASSISTED_SWAP_ENABLED: '1' } })
  const response = await hub.fetch(new Request('https://hub.invalid/v1/xorus/risk-policy'))
  assert.equal(response.status, 200)
  const policy = await response.json()
  assert.equal(policy.actual_capital_allocation.reference_capital_cents, 0)
  assert.equal(policy.live_budget_cents, 0)
  assert.equal(policy.execution_authorized, false)
  for (const path of ['execute', 'sign', 'swap', 'orders', 'bet']) {
    const result = await hub.fetch(new Request('https://hub.invalid/v1/xorus/' + path, { method: 'POST' }))
    assert.equal(result.status, 503)
  }
})
