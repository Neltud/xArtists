/** P0 regression: PSP payment verification is not NFT delivery. */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  createOrder, getOrder, applyIpn, publicOrderDelivery,
} from '../src/orders.mjs'

const BUYER = 'erd1' + 'a'.repeat(58)

async function withTestLedger(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xa-delivery-proof-'))
  const oldPath = process.env.PAYBOX_ORDERS_PATH
  const oldDb = process.env.DATABASE_URL
  process.env.PAYBOX_ORDERS_PATH = path.join(dir, 'orders.json')
  delete process.env.DATABASE_URL
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

test('verified PayBox IPN stays pending with no NFT delivery timestamp', async () => {
  await withTestLedger(async () => {
    const id = 'xa_delivery_pending'
    await createOrder({order_id:id,pack_id:'sentinel',amount_cents:5000,buyer_address:BUYER})
    const result = await applyIpn({order_id:id,amount_cents:5000,error_code:'00000',provider_tx_id:'provider_delivery_test'})
    const stored = await getOrder(id)
    assert.equal(result.status, 'paid')
    assert.equal(result.delivery, 'pending')
    assert.equal(stored.server_confirmed, true)
    assert.equal(stored.payment_verified, true)
    assert.equal(stored.delivery, 'pending')
    assert.equal(stored.delivered_at, null)
    assert.deepEqual(publicOrderDelivery(stored), {delivery:'pending',delivery_verified:false,delivered_at:null})
    const duplicate = await applyIpn({order_id:id,amount_cents:5000,error_code:'00000',provider_tx_id:'provider_delivery_test'})
    assert.equal(duplicate.duplicate, true)
    assert.equal(duplicate.delivery, 'pending')
    assert.equal((await getOrder(id)).delivered_at, null)
  })
})

test('legacy simulated payment cannot masquerade as delivered NFT', async () => {
  await withTestLedger(async (filename) => {
    const id = 'xa_legacy_paid'
    await createOrder({order_id:id,pack_id:'sentinel',amount_cents:5000,buyer_address:BUYER})
    const ledger = JSON.parse(fs.readFileSync(filename,'utf8'))
    const row = ledger.orders[id]
    row.status = 'paid'
    row.server_confirmed = true
    row.payment_verified = true
    row.provider_tx_id = 'legacy_tx'
    row.delivery = 'simulated'
    row.mint_status = 'mint_confirmed' // Old simulated marker, NOT chain proof.
    row.delivered_at = '2026-10-28T12:00:00.000Z'
    fs.writeFileSync(filename,JSON.stringify(ledger)+'\n')
    assert.deepEqual(publicOrderDelivery(await getOrder(id)),{delivery:'pending',delivery_verified:false,delivered_at:null})
    const duplicated = await applyIpn({order_id:id,amount_cents:5000,error_code:'00000',provider_tx_id:'legacy_tx'})
    assert.equal(duplicated.duplicate,true)
    assert.equal(duplicated.delivery,'pending')
    const repaired = await getOrder(id)
    assert.equal(repaired.delivery,'pending')
    assert.equal(repaired.delivered_at,null)
    assert.equal(repaired.mint_status,'awaiting_dispatch')
  })
})

test('on-chain delivery presentation requires all three proof fields', () => {
  const paid = {status:'paid',server_confirmed:true,payment_verified:true,provider_tx_id:'psp_test_1',
    delivery:'confirmed',delivered_at:'2026-11-02T19:00:00.000Z'}
  assert.equal(publicOrderDelivery(paid).delivery_verified,false)
  assert.equal(publicOrderDelivery({...paid,chain_tx_hash:'tx'}).delivery_verified,false)
  const unverified = {...paid,chain_tx_hash:'ab'.repeat(32),nft_identifier:'XAISNT-3d8a6b-01'}
  assert.equal(publicOrderDelivery(unverified).delivery_verified,false)
  const verified = {...unverified,delivery_verified:true}
  assert.deepEqual(publicOrderDelivery(verified),{
    delivery:'confirmed',delivery_verified:true,delivered_at:paid.delivered_at,
  })
  assert.deepEqual(publicOrderDelivery({...verified,status:'refunded'}),{
    delivery:'none',delivery_verified:false,delivered_at:null,
  })
})

const storedProof = () => ({
  status:'paid',server_confirmed:true,payment_verified:true,provider_tx_id:'psp_verified_fixture',
  delivery:'confirmed',delivery_verified:true,chain_tx_hash:'ab'.repeat(32),
  nft_identifier:'XAISNT-3d8a6b-01',delivered_at:'2026-11-02T19:00:00.000Z',
})

test('a failed or expired order cannot present an old stored proof as confirmed', () => {
  for (const status of ['created','redirected','failed','expired','late_paid','refused','cancelled','refunded','unknown']) {
    const result=publicOrderDelivery({...storedProof(),status})
    assert.equal(result.delivery_verified,false,status)
    assert.equal(result.delivered_at,null,status)
    assert.notEqual(result.delivery,'confirmed',status)
  }
})

test('payment revocation or a missing PSP binding invalidates a stored confirmation', () => {
  for (const patch of [
    {server_confirmed:false},{payment_verified:false},{server_confirmed:'true'},
    {payment_verified:'true'},{provider_tx_id:null},{provider_tx_id:''},
    {provider_tx_id:'id with spaces'},
  ]) {
    const result=publicOrderDelivery({...storedProof(),...patch})
    assert.equal(result.delivery_verified,false,JSON.stringify(patch))
    assert.equal(result.delivered_at,null)
  }
})

test('truthy malformed chain evidence never becomes a public NFT receipt', () => {
  for (const patch of [
    {chain_tx_hash:'tx'},{chain_tx_hash:[]},{chain_tx_hash:'g'.repeat(64)},
    {nft_identifier:'not-an-nft'},{nft_identifier:'XAISNT-3d8a6b-00'},
    {nft_identifier:'XAISNT-3d8a6b-1'},{nft_identifier:{id:'XAISNT-3d8a6b-01'}},
    {delivered_at:'not-a-date'},{delivered_at:true},{delivered_at:'2026-11-02'},
    {delivered_at:'2026-02-30T12:00:00.000Z'},
    {delivered_at:'2199-01-01T00:00:00.000Z'},
  ]) {
    const result=publicOrderDelivery({...storedProof(),...patch})
    assert.equal(result.delivery_verified,false,JSON.stringify(patch))
    assert.equal(result.delivered_at,null)
  }
})

test('coherent stored proof is presented across paid and mint lifecycle states without mutating the ledger', () => {
  for (const status of ['paid','mint_queued','mint_confirmed','active']) {
    const row=Object.freeze({...storedProof(),status})
    const before=JSON.stringify(row)
    assert.deepEqual(publicOrderDelivery(row),{
      delivery:'confirmed',delivery_verified:true,delivered_at:row.delivered_at,
    })
    assert.equal(JSON.stringify(row),before)
  }
})
