import { test } from 'node:test'
import assert from 'node:assert/strict'
import { decodeErdAddress, matchingTransferEvent, verifyMainnetNftReceipt } from '../src/mvxReceiptVerifier.mjs'

const BUYER = 'erd1sg4u62lzvgkeu4grnlwn7h2s92rqf8a64z48pl9c7us37ajv9u8qj9w8xg'
const ISSUER = 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u'
const TX = 'a'.repeat(64)
const COLLECTION = 'TSFT-c867a3'
const GATEWAY = 'https://gateway.multiversx.com'
const b64 = bytes => Buffer.from(bytes).toString('base64')

function scenario() {
  const event = {
    identifier: 'ESDTNFTTransfer', address: ISSUER,
    topics: [b64(COLLECTION), b64([1]), b64([1]), b64(decodeErdAddress(BUYER))],
    data: null,
  }
  const tx = {
    code: 'successful',
    data: { transaction: { hash: TX, status: 'executed', logs: { events: [event] } } },
  }
  const process = { code: 'successful', data: { status: 'success' } }
  const nft = {
    code: 'successful',
    data: { tokenData: { tokenIdentifier: COLLECTION, nonce: 1, balance: '1' } },
  }
  const urls = [
    GATEWAY + '/transaction/' + TX + '?withResults=true',
    GATEWAY + '/transaction/' + TX + '/process-status',
    GATEWAY + '/address/' + BUYER + '/nft/' + COLLECTION + '/nonce/1',
  ]
  const responses = new Map([[urls[0], tx], [urls[1], process], [urls[2], nft]])
  const calls = []
  const fetchImpl = async (url, opts) => {
    calls.push({ url, opts })
    assert.equal(opts.method, 'GET', 'no chain writes')
    assert.equal(opts.headers.Accept, 'application/json')
    assert.ok(url.startsWith(GATEWAY + '/'), 'strict mainnet gateway')
    const body = responses.get(url)
    return { ok: Boolean(body), status: body ? 200 : 404, json: async () => body }
  }
  const input = { txHash: TX, buyer: BUYER, issuer: ISSUER, collection: COLLECTION, nonce: 1 }
  return { event, tx, process, nft, calls, fetchImpl, input }
}

test('accepts independently documented valid MultiversX Bech32 and rejects mutated checksum', () => {
  assert.equal(decodeErdAddress(BUYER)?.length, 32)
  assert.equal(decodeErdAddress(ISSUER)?.length, 32)
  assert.equal(decodeErdAddress(BUYER.slice(0, -1) + 'q'), null)
  assert.equal(decodeErdAddress('erd1invalid-address'), null)
})

test('S2 read-only candidate requires a successful tx, one NFT transfer and buyer ownership', async () => {
  const f = scenario()
  const result = await verifyMainnetNftReceipt(f.input, f.fetchImpl)
  assert.equal(result.verified, true)
  assert.equal(result.chain_tx_hash, TX)
  assert.equal(result.nft_collection, COLLECTION)
  assert.equal(result.buyer, BUYER)
  assert.equal(f.calls.length, 3)
  assert.ok(f.calls.every(c => c.opts.method === 'GET'))
})

test('untrusted buyer request cannot skip tx hash, collection or issuer validation', async () => {
  const f = scenario()
  for (const altered of [
    { txHash: '123' }, { collection: '../evil' },
    { buyer: 'erd1bad' }, { issuer: 'erd1bad' },
    { issuer: BUYER }, { nonce: 0 }, { amount: 0 }, { nonce: -2 },
  ]) {
    const result = await verifyMainnetNftReceipt({ ...f.input, ...altered }, f.fetchImpl)
    assert.equal(result.verified, false)
  }
  assert.equal(f.calls.length, 0, 'malformed input must not contact gateway')
})

test('not confirmed when tx, final process status or transaction hash is wrong', async () => {
  for (const edit of [
    f => { f.tx.data.transaction.status = 'pending' },
    f => { f.tx.data.transaction.status = 'invalid' },
    f => { f.tx.data.transaction.hash = 'b'.repeat(64) },
    f => { f.process.data.status = 'pending' },
    f => { f.process.data.status = 'fail' },
  ]) {
    const f = scenario()
    edit(f)
    assert.equal((await verifyMainnetNftReceipt(f.input, f.fetchImpl)).verified, false)
  }
})

test('rejects incorrect collection, nonce, qty, issuer, recipient or duplicate transfer log', async () => {
  const mismatch = [
    f => { f.event.topics[0] = b64('OTHER-fadc05') },
    f => { f.event.topics[1] = b64([2]) },
    f => { f.event.topics[2] = b64([2]) },
    f => { f.event.address = BUYER },
    f => { f.event.topics[3] = b64(decodeErdAddress(ISSUER)) },
    f => { f.event.topics[3] = '!!not-base64!!' },
    f => { f.tx.data.transaction.logs.events.push(structuredClone(f.event)) },
  ]
  for (const edit of mismatch) {
    const f = scenario()
    edit(f)
    assert.equal((await verifyMainnetNftReceipt(f.input, f.fetchImpl)).verified, false)
  }
  const f = scenario()
  assert.equal(matchingTransferEvent(f.tx.data.transaction, {
    buyerBytes: decodeErdAddress(BUYER), issuer: ISSUER, collection: COLLECTION,
    nonce: 1n, amount: 1n,
  }), true)
})

test('rejects absent or insufficient buyer NFT balance even with valid transfer log', async () => {
  for (const edit of [
    f => { f.nft.data.tokenData.balance = '0' },
    f => { f.nft.data.tokenData.balance = null },
    f => { f.nft.data.tokenData.tokenIdentifier = 'OTHER-12ab34' },
    f => { f.nft.data.tokenData.nonce = 2 },
    f => { f.nft.data.tokenData = null },
  ]) {
    const f = scenario()
    edit(f)
    assert.equal((await verifyMainnetNftReceipt(f.input, f.fetchImpl)).verified, false)
  }
})

test('gateway errors never claim delivery and do not sign, post or mutate an order', async () => {
  const f = scenario()
  const result = await verifyMainnetNftReceipt(f.input, async () => {
    throw Error('RPC connection refused (not a tx proof)')
  })
  assert.deepEqual(result, { verified: false, reason: 'mainnet_gateway_unavailable_or_invalid' })
  assert.equal(f.calls.length, 0)
})
