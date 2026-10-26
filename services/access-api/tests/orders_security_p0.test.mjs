/** P0 security regressions for the file-backed PayBox order ledger (mocks only). */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createOrder, applyIpn, getOrder, loadOrders } from '../src/orders.mjs'

const BUYER = 'erd1' + 'a'.repeat(58)
const PRICES = { pulse: 11000, yield: 7500, sentinel: 5000 }

function withStore(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xa-orders-p0-'))
  const old = process.env.PAYBOX_ORDERS_PATH
  process.env.PAYBOX_ORDERS_PATH = path.join(dir, 'orders.json')
  try { return fn(process.env.PAYBOX_ORDERS_PATH) }
  finally {
    if (old === undefined) delete process.env.PAYBOX_ORDERS_PATH
    else process.env.PAYBOX_ORDERS_PATH = old
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

function order(id, pack = 'pulse') {
  return createOrder({ order_id: id, pack_id: pack, amount_cents: PRICES[pack], buyer_address: BUYER })
}

for (const [pack, amount] of Object.entries(PRICES)) {
  test(`${pack}: IPN application amount matches server price (simulated only)`, () => withStore(() => {
    const id = `xa_${pack}_test`
    order(id, pack)
    const bad = applyIpn({ order_id: id, amount_cents: amount - 1, error_code: '00000' })
    assert.equal(bad.reason, 'amount_mismatch')
    const ok = applyIpn({ order_id: id, amount_cents: amount, error_code: '00000', provider_tx_id: `tx_${pack}` })
    assert.equal(ok.status, 'paid')
    assert.equal(ok.delivery, 'simulated')
    assert.notEqual(getOrder(id).status, 'active')
  }))
}

test('corrupt existing ledger fails closed and preserves bytes', () => withStore(file => {
  fs.writeFileSync(file, '{bad json', 'utf8')
  assert.throws(() => loadOrders(), { statusCode: 503 })
  assert.throws(() => order('xa_corrupt'), { statusCode: 503 })
  assert.equal(fs.readFileSync(file, 'utf8'), '{bad json')
}))

test('invalid ledger schema fails closed', () => withStore(file => {
  fs.writeFileSync(file, JSON.stringify({ schema: 'wrong', orders: {} }))
  assert.throws(() => loadOrders(), { statusCode: 503 })
}))

test('cancelled order cannot be revived by later success IPN', () => withStore(() => {
  order('xa_cancel')
  assert.equal(applyIpn({ order_id: 'xa_cancel', amount_cents: 11000, error_code: '00001' }).status, 'cancelled')
  assert.equal(applyIpn({ order_id: 'xa_cancel', amount_cents: 11000, error_code: '00000' }).reason, 'illegal_transition')
  assert.equal(getOrder('xa_cancel').status, 'cancelled')
}))

test('failed IPN after paid does not revoke paid status', () => withStore(() => {
  order('xa_paid', 'yield')
  assert.equal(applyIpn({ order_id: 'xa_paid', amount_cents: 7500, error_code: '00000', provider_tx_id: 'tx_1' }).status, 'paid')
  const later = applyIpn({ order_id: 'xa_paid', amount_cents: 7500, error_code: '00002' })
  assert.equal(later.duplicate, true)
  assert.equal(getOrder('xa_paid').status, 'paid')
}))

test('conflicting provider transaction for same order rejected', () => withStore(() => {
  order('xa_tx')
  applyIpn({ order_id: 'xa_tx', amount_cents: 11000, error_code: '00000', provider_tx_id: 'tx_A' })
  const conflict = applyIpn({ order_id: 'xa_tx', amount_cents: 11000, error_code: '00000', provider_tx_id: 'tx_B' })
  assert.equal(conflict.reason, 'provider_tx_mismatch')
  assert.equal(getOrder('xa_tx').provider_tx_id, 'tx_A')
}))

test('provider transaction reused across orders rejected', () => withStore(() => {
  order('xa_a')
  order('xa_b', 'sentinel')
  applyIpn({ order_id: 'xa_a', amount_cents: 11000, error_code: '00000', provider_tx_id: 'tx_same' })
  const reused = applyIpn({ order_id: 'xa_b', amount_cents: 5000, error_code: '00000', provider_tx_id: 'tx_same' })
  assert.equal(reused.reason, 'provider_tx_reused')
  assert.equal(getOrder('xa_b').status, 'created')
}))
