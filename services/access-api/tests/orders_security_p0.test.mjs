/** P0 security regressions for the file-backed PayBox order ledger (mocks only). */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createOrder, applyIpn, getOrder, loadOrders, ordersBackend } from '../src/orders.mjs'

const BUYER = 'erd1' + 'a'.repeat(58)
const PRICES = { pulse: 11000, yield: 7500, sentinel: 5000 }

async function withStore(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xa-orders-p0-'))
  const oldPath = process.env.PAYBOX_ORDERS_PATH
  const oldDb = process.env.DATABASE_URL
  delete process.env.DATABASE_URL
  process.env.PAYBOX_ORDERS_PATH = path.join(dir, 'orders.json')
  try {
    return await fn(process.env.PAYBOX_ORDERS_PATH)
  } finally {
    if (oldPath === undefined) delete process.env.PAYBOX_ORDERS_PATH
    else process.env.PAYBOX_ORDERS_PATH = oldPath
    if (oldDb === undefined) delete process.env.DATABASE_URL
    else process.env.DATABASE_URL = oldDb
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

async function order(id, pack = 'pulse') {
  return createOrder({ order_id: id, pack_id: pack, amount_cents: PRICES[pack], buyer_address: BUYER })
}

test('backend is file when DATABASE_URL unset', async () => {
  const old = process.env.DATABASE_URL
  delete process.env.DATABASE_URL
  try {
    assert.equal(ordersBackend(), 'file')
  } finally {
    if (old !== undefined) process.env.DATABASE_URL = old
  }
})

for (const [pack, amount] of Object.entries(PRICES)) {
  test(`${pack}: IPN application amount matches server price (simulated only)`, async () => {
    await withStore(async () => {
      const id = `xa_${pack}_test`
      await order(id, pack)
      const bad = await applyIpn({ order_id: id, amount_cents: amount - 1, error_code: '00000' })
      assert.equal(bad.reason, 'amount_mismatch')
      const ok = await applyIpn({ order_id: id, amount_cents: amount, error_code: '00000', provider_tx_id: `tx_${pack}` })
      assert.equal(ok.status, 'paid')
      assert.equal(ok.delivery, 'simulated')
      assert.notEqual((await getOrder(id)).status, 'active')
    })
  })
}

test('corrupt existing ledger fails closed and preserves bytes', async () => {
  await withStore(async (file) => {
    fs.writeFileSync(file, '{bad json', 'utf8')
    await assert.rejects(() => loadOrders(), (e) => e.statusCode === 503)
    await assert.rejects(() => order('xa_corrupt'), (e) => e.statusCode === 503)
    assert.equal(fs.readFileSync(file, 'utf8'), '{bad json')
  })
})

test('invalid ledger schema fails closed', async () => {
  await withStore(async (file) => {
    fs.writeFileSync(file, JSON.stringify({ schema: 'wrong', orders: {} }))
    await assert.rejects(() => loadOrders(), (e) => e.statusCode === 503)
  })
})

test('cancelled order cannot be revived by later success IPN', async () => {
  await withStore(async () => {
    await order('xa_cancel')
    assert.equal((await applyIpn({ order_id: 'xa_cancel', amount_cents: 11000, error_code: '00001' })).status, 'cancelled')
    assert.equal((await applyIpn({ order_id: 'xa_cancel', amount_cents: 11000, error_code: '00000' })).reason, 'illegal_transition')
    assert.equal((await getOrder('xa_cancel')).status, 'cancelled')
  })
})

test('failed IPN after paid does not revoke paid status', async () => {
  await withStore(async () => {
    await order('xa_paid', 'yield')
    assert.equal((await applyIpn({ order_id: 'xa_paid', amount_cents: 7500, error_code: '00000', provider_tx_id: 'tx_1' })).status, 'paid')
    const later = await applyIpn({ order_id: 'xa_paid', amount_cents: 7500, error_code: '00002' })
    assert.equal(later.duplicate, true)
    assert.equal((await getOrder('xa_paid')).status, 'paid')
  })
})

test('conflicting provider transaction for same order rejected', async () => {
  await withStore(async () => {
    await order('xa_tx')
    await applyIpn({ order_id: 'xa_tx', amount_cents: 11000, error_code: '00000', provider_tx_id: 'tx_A' })
    const conflict = await applyIpn({ order_id: 'xa_tx', amount_cents: 11000, error_code: '00000', provider_tx_id: 'tx_B' })
    assert.equal(conflict.reason, 'provider_tx_mismatch')
    assert.equal((await getOrder('xa_tx')).provider_tx_id, 'tx_A')
  })
})

test('provider transaction reused across orders rejected', async () => {
  await withStore(async () => {
    await order('xa_a')
    await order('xa_b', 'sentinel')
    await applyIpn({ order_id: 'xa_a', amount_cents: 11000, error_code: '00000', provider_tx_id: 'tx_same' })
    const reused = await applyIpn({ order_id: 'xa_b', amount_cents: 5000, error_code: '00000', provider_tx_id: 'tx_same' })
    assert.equal(reused.reason, 'provider_tx_reused')
    assert.equal((await getOrder('xa_b')).status, 'created')
  })
})
