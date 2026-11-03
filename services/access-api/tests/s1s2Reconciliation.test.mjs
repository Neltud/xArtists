import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  attestS1S2Candidate, verifyOrderReceiptBindings, expectedNftIdentifier,
} from '../src/s1s2Reconciliation.mjs'
import { decodeErdAddress } from '../src/mvxReceiptVerifier.mjs'

const BUYER = 'erd1sg4u62lzvgkeu4grnlwn7h2s92rqf8a64z48pl9c7us37ajv9u8qj9w8xg'
const ISSUER = 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u'
const TX = 'a'.repeat(64)
const COLLECTION = 'TSFT-c867a3'
const NFT = COLLECTION + '-01'
const GW = 'https://gateway.multiversx.com'
const b64 = x => Buffer.from(x).toString('base64')

function fixture() {
  const order = {
    order_id: 'xa_sentinel_verified_01',
    provider_tx_id: 'psp_verified_01',
    amount_cents: 5000, currency: 'EUR', pack_id: 'sentinel',
    buyer_address: BUYER, status: 'paid',
    server_confirmed: true, payment_verified: true,
    delivery_verified: false, delivery: 'pending', delivered_at: null,
  }
  const mintJob = {
    order_id: order.order_id,
    provider_tx_id: order.provider_tx_id,
    amount_cents: 5000, pack_id: 'sentinel',
    buyer_address: BUYER,
    mode: 'live', micro_price: false,
    status: 'submitted', github_dispatch_accepted: true,
    chain_tx_hash: TX, nft_identifier: NFT,
  }
  const receipt = {
    txHash: TX, nonce: 1, amount: 1, collection: COLLECTION,
    issuer: ISSUER,
    buyer: BUYER,
  }
  const approved = { pack_id: 'sentinel', collection: COLLECTION, issuer: ISSUER }
  const event = {
    identifier: 'ESDTNFTTransfer',
    address: ISSUER,
    topics: [
      b64(COLLECTION), b64([1]), b64([1]),
      b64(decodeErdAddress(BUYER)),
    ],
  }
  const data = new Map([
    [GW + '/transaction/' + TX + '?withResults=true',
      { code: 'successful', data: { transaction: {
        hash: TX, status: 'executed', logs: { events: [event] },
      } } }],
    [GW + '/transaction/' + TX + '/process-status',
      { code: 'successful', data: { status: 'success' } }],
    [GW + '/address/' + BUYER + '/nft/' + COLLECTION + '/nonce/1',
      { code: 'successful', data: { tokenData: {
        tokenIdentifier: COLLECTION, nonce: 1, balance: '1',
      } } }],
  ])
  const calls = []
  const fetchImpl = async (url, opts) => {
    assert.equal(opts.method, 'GET', 'chain verification must not mutate')
    assert.ok(url.startsWith(GW + '/'))
    calls.push(url)
    return { ok: data.has(url), status: data.has(url) ? 200 : 404,
      json: async () => data.get(url) }
  }
  return {
    order, mintJob, receipt, approved,
    ordersSnapshot: [order], jobsSnapshot: [mintJob],
    fetchImpl, calls, data,
  }
}

test('S1 + independently verified S2 returns only a candidate, never delivered', async () => {
  const f = fixture()
  const before = JSON.stringify({ order: f.order, mintJob: f.mintJob })
  const result = await attestS1S2Candidate(f, f.fetchImpl)
  assert.deepEqual(result, {
    candidate_verified: true,
    delivery_verified: false,
    order_id: f.order.order_id,
    chain_tx_hash: TX,
    nft_identifier: NFT,
    reason: 'operator_review_and_atomic_delivery_commit_required',
  })
  assert.equal(f.calls.length, 3)
  assert.equal(JSON.stringify({ order: f.order, mintJob: f.mintJob }), before)
})

test('numeric NFT nonce converts to exact canonical identifier', () => {
  assert.equal(expectedNftIdentifier(COLLECTION, 1), NFT)
  assert.equal(expectedNftIdentifier(COLLECTION, 16), COLLECTION + '-10')
  assert.equal(expectedNftIdentifier(COLLECTION, 255), COLLECTION + '-ff')
  assert.equal(expectedNftIdentifier(COLLECTION, 256), COLLECTION + '-0100')
  for (const value of [0, -1, '0', 'abc', null]) {
    assert.equal(expectedNftIdentifier(COLLECTION, value), null)
  }
})

test('S1 must be authentic verified, paid, non-refundable and EXACT server catalogue amount', async () => {
  const bad = [
    f => { f.order.status = 'redirected' },
    f => { f.order.status = 'refunded' },
    f => { f.order.server_confirmed = false },
    f => { f.order.payment_verified = false },
    f => { f.order.amount_cents = 1; f.mintJob.amount_cents = 1 },
    f => { f.order.currency = 'USD' },
    f => { f.order.provider_tx_id = null; f.mintJob.provider_tx_id = null },
    f => { f.order.delivery_verified = true },
    f => { f.order.delivery = 'confirmed' },
    f => { f.order.delivered_at = '2026-11-03T10:00:00Z' },
    f => { f.order.buyer_address = 'erd1bad'; f.mintJob.buyer_address = 'erd1bad' },
    f => { f.order.pack_id = 'other'; f.mintJob.pack_id = 'other' },
  ]
  for (const change of bad) {
    const f = fixture()
    change(f)
    const r = await attestS1S2Candidate(f, f.fetchImpl)
    assert.equal(r.candidate_verified, false)
    assert.equal(r.delivery_verified, false)
    assert.equal(f.calls.length, 0, 'bad payment must not query chain')
  }
})

test('dry-run job, missing tx, mismatched buyer, pack or PSP proof never becomes S2', async () => {
  const changes = [
    f => { f.mintJob.mode = 'dry_run' },
    f => { f.mintJob.status = 'dispatching' },
    f => { f.mintJob.github_dispatch_accepted = false },
    f => { f.mintJob.micro_price = true },
    f => { f.mintJob.order_id = 'different' },
    f => { f.mintJob.provider_tx_id = 'other_psp' },
    f => { f.mintJob.amount_cents = 1 },
    f => { f.mintJob.buyer_address = ISSUER },
    f => { f.mintJob.pack_id = 'yield' },
    f => { f.mintJob.chain_tx_hash = null },
    f => { f.mintJob.nft_identifier = 'OTHER-123456-01' },
    f => { f.receipt.txHash = 'b'.repeat(64) },
    f => { f.receipt.collection = 'OTHER-123456' },
    f => { f.approved.collection = 'OTHER-123456' },
    f => { f.approved.pack_id = 'yield' },
    f => { f.approved.issuer = BUYER },
    f => { f.receipt.issuer = BUYER },
    f => { f.receipt.buyer = ISSUER },
    f => { f.receipt.amount = 2 },
    f => { f.receipt.nonce = 2 },
  ]
  for (const change of changes) {
    const f = fixture()
    change(f)
    assert.equal((await attestS1S2Candidate(f, f.fetchImpl)).candidate_verified, false)
    assert.equal(f.calls.length, 0)
  }
})

test('duplicate PSP transaction, NFT or tx in ledger must block candidate before RPC', async () => {
  for (const reuse of [
    f => f.ordersSnapshot.push({ order_id: 'other_order', provider_tx_id: f.order.provider_tx_id }),
    f => f.jobsSnapshot.push({ order_id: 'other_order', chain_tx_hash: TX }),
    f => f.jobsSnapshot.push({ order_id: 'other_order', nft_identifier: NFT }),
    f => f.ordersSnapshot.splice(0),
    f => f.jobsSnapshot.splice(0),
    f => f.ordersSnapshot.push({ ...f.order }),
  ]) {
    const f = fixture()
    reuse(f)
    const r = await attestS1S2Candidate(f, f.fetchImpl)
    assert.equal(r.candidate_verified, false)
    assert.equal(f.calls.length, 0)
  }
})

test('chain transaction failure, fake transfer or unknown buyer balance cannot attest S2', async () => {
  const edits = [
    f => f.data.get(GW + '/transaction/' + TX + '?withResults=true').data.transaction.status = 'pending',
    f => f.data.get(GW + '/transaction/' + TX + '/process-status').data.status = 'fail',
    f => f.data.get(GW + '/transaction/' + TX + '?withResults=true').data.transaction.logs.events[0].topics[3] = b64(decodeErdAddress(ISSUER)),
    f => f.data.get(GW + '/address/' + BUYER + '/nft/' + COLLECTION + '/nonce/1').data.tokenData.balance = '0',
  ]
  for (const edit of edits) {
    const f = fixture()
    edit(f)
    const r = await attestS1S2Candidate(f, f.fetchImpl)
    assert.equal(r.candidate_verified, false)
    assert.equal(r.delivery_verified, false)
  }
})
