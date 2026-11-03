/**
 * Local Solana validator only: 1000-lamport transfer between in-memory keys.
 * NOT public Devnet/Mainnet; no wallet, PayBox, mint or bridge credentials.
 */
import assert from 'node:assert/strict'
import { sign } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import { decode58, encode58, keypair, uvarint } from './solana_devnet_micro_transfer.mjs'

const RPC = 'http://127.0.0.1:8899'
const MICRO = 1000
const TEST_FAUCET = 1_000_000
const SYSTEM = Buffer.alloc(32)
const sleep = ms => new Promise(r => setTimeout(r, ms))

async function rpc(method, params = []) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const r = await fetch(RPC, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      signal: controller.signal,
    })
    assert.equal(r.status, 200, 'local validator RPC HTTP ' + r.status)
    const data = await r.json()
    if (data.error) throw new Error(method + ': ' + String(data.error.message).slice(0, 160))
    assert.ok(Object.hasOwn(data, 'result'), 'RPC missing result')
    return data.result
  } finally { clearTimeout(timer) }
}
async function balance(address) {
  const d = await rpc('getBalance', [address, { commitment: 'confirmed' }])
  assert.ok(Number.isSafeInteger(d.value) && d.value >= 0)
  return d.value
}
async function waitBalance(address, minimum) {
  for (let i = 0; i < 35; i++) {
    if ((await balance(address)) >= minimum) return
    await sleep(250)
  }
  throw new Error('Local faucet not confirmed; transfer NOT attempted')
}
async function airdrop(address) {
  const s = await rpc('requestAirdrop', [address, TEST_FAUCET])
  assert.equal(decode58(s).length, 64, 'local airdrop signature invalid')
  await waitBalance(address, TEST_FAUCET)
}

export async function proveLocalTransfer() {
  assert.equal(process.env.XARTISTS_ALLOW_LOCAL_VALIDATOR_SEND, '1',
    'explicit isolated LOCAL validator opt-in required')
  assert.equal(RPC, 'http://127.0.0.1:8899')
  assert.equal(await rpc('getHealth'), 'ok')
  assert.equal(decode58(await rpc('getGenesisHash')).length, 32)
  const from = keypair(), to = keypair()
  assert.equal(await balance(from.address), 0)
  assert.equal(await balance(to.address), 0)
  // Prefund both in the disposable local ledger: micro recipient remains
  // rent-exempt, avoiding an unrelated rent-related rejection.
  await airdrop(from.address)
  await airdrop(to.address)
  const receiverBefore = await balance(to.address)
  const recent = decode58((await rpc('getLatestBlockhash', [
    { commitment: 'confirmed' },
  ])).value.blockhash)
  assert.equal(recent.length, 32)
  const data = Buffer.alloc(12)
  data.writeUInt32LE(2, 0) // SystemProgram::Transfer
  data.writeBigUInt64LE(BigInt(MICRO), 4)
  const msg = Buffer.concat([
    Buffer.from([1, 0, 1]), uvarint(3),
    from.pubkey, to.pubkey, SYSTEM, recent,
    uvarint(1), Buffer.from([2]), uvarint(2),
    Buffer.from([0, 1]), uvarint(data.length), data,
  ])
  const sigBytes = sign(null, msg, from.privateKey)
  assert.equal(sigBytes.length, 64)
  const txid = await rpc('sendTransaction', [
    Buffer.concat([uvarint(1), sigBytes, msg]).toString('base64'),
    { encoding: 'base64', skipPreflight: false,
      preflightCommitment: 'confirmed', maxRetries: 2 },
  ])
  assert.equal(txid, encode58(sigBytes))
  let confirmed = false
  for (let i = 0; i < 40; i++) {
    const d = await rpc('getSignatureStatuses', [[txid]])
    const status = d.value[0]
    if (status && ['confirmed', 'finalized'].includes(status.confirmationStatus)) {
      assert.equal(status.err, null, 'local ledger rejected transfer')
      confirmed = true
      break
    }
    await sleep(300)
  }
  assert.ok(confirmed, 'local ledger signature not confirmed')
  let delta
  for (let i = 0; i < 20; i++) {
    delta = (await balance(to.address)) - receiverBefore
    if (delta === MICRO) break
    await sleep(250)
  }
  assert.equal(delta, MICRO, 'recipient did not gain exactly 1000 lamports')
  console.log('LOCAL_SOL_MICRO_CONFIRMED: 1000 lamports on ephemeral local ledger')
  console.log('LOCAL_SOL_SIGNATURE=' + txid)
  if (process.env.GITHUB_STEP_SUMMARY) {
    const { appendFileSync } = await import('node:fs')
    appendFileSync(process.env.GITHUB_STEP_SUMMARY,
      'Solana **local validator only**: 1,000 lamports moved and confirmed. ' +
      'Signature: ' + txid + '. Not a public Devnet or Mainnet receipt.\n')
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  proveLocalTransfer().catch(e => {
    console.error('LOCAL_SOL_MICRO_BLOCKED: ' + String(e.message).slice(0, 220))
    process.exitCode = 1
  })
}
