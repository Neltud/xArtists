/**
 * SOLANA DEVNET ONLY: ephemeral micro-transfer funded by a testnet faucet.
 * Two throwaway ed25519 accounts in memory; no user keys, mainnet, token,
 * card, PayBox checkout, NFT, bridge or production credentials.
 */
import assert from 'node:assert/strict'
import { generateKeyPairSync, sign } from 'node:crypto'
import { pathToFileURL } from 'node:url'

const RPC = 'https://api.devnet.solana.com'
const LAMPORTS = 1000
const AIRDROP = 1_000_000
const SYSTEM = Buffer.alloc(32)
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

export function encode58(bytes) {
  let value = BigInt('0x' + Buffer.from(bytes).toString('hex'))
  let result = ''
  while (value > 0n) {
    const i = Number(value % 58n)
    value /= 58n
    result = ALPHABET[i] + result
  }
  for (const b of bytes) {
    if (b !== 0) break
    result = '1' + result
  }
  return result || '1'
}
export function decode58(text) {
  let value = 0n
  for (const ch of text) {
    const i = ALPHABET.indexOf(ch)
    assert.ok(i >= 0, 'invalid base58 character')
    value = value * 58n + BigInt(i)
  }
  let hex = value.toString(16)
  if (hex.length % 2) hex = '0' + hex
  const data = value === 0n ? Buffer.alloc(0) : Buffer.from(hex, 'hex')
  const prefix = (text.match(/^1*/) || [''])[0].length
  return Buffer.concat([Buffer.alloc(prefix), data])
}
export function keypair() {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519')
  const spki = publicKey.export({ type: 'spki', format: 'der' })
  const pubkey = spki.subarray(-32)
  assert.equal(pubkey.length, 32)
  return { privateKey, pubkey, address: encode58(pubkey) }
}
export function uvarint(n) {
  const out = []
  do {
    let octet = n & 127
    n >>>= 7
    if (n) octet |= 128
    out.push(octet)
  } while (n)
  return Buffer.from(out)
}
async function rpc(method, params = []) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 18000)
  try {
    const response = await fetch(RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'xArtists-ephemeral-devnet-micro/1.0' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(method + ': Solana Devnet HTTP ' + response.status)
    const json = await response.json()
    if (json.error) throw new Error(method + ' RPC: ' + String(json.error.message).slice(0, 160))
    return json.result
  } finally {
    clearTimeout(timer)
  }
}
async function balance(address) {
  const result = await rpc('getBalance', [address, { commitment: 'confirmed' }])
  return result.value
}
async function main() {
  assert.equal(process.env.XARTISTS_ALLOW_DEVNET_SEND, '1', 'explicit DEVNET ONLY opt-in missing')
  assert.equal(RPC, 'https://api.devnet.solana.com', 'devnet RPC allowlist')
  const sender = keypair(), recipient = keypair()
  // Do not print, persist or export either ephemeral key or seed.
  console.log('Solana Devnet: ephemeral keypairs generated in memory.')
  assert.equal(await balance(sender.address), 0, 'ephemeral sender pre-funded')
  const airdropSignature = await rpc('requestAirdrop', [
    sender.address, AIRDROP, { commitment: 'confirmed' },
  ])
  assert.ok(typeof airdropSignature === 'string' && airdropSignature.length > 50)
  console.log('Devnet-only faucet request accepted.')
  let funded = 0
  for (let n = 0; n < 24; n++) {
    funded = await balance(sender.address)
    if (funded >= AIRDROP) break
    await wait(2500)
  }
  assert.ok(funded >= AIRDROP, 'Devnet faucet not confirmed; transfer NOT attempted')

  const network = await rpc('getLatestBlockhash', [{ commitment: 'confirmed' }])
  const blockhash = decode58(network.value.blockhash)
  assert.equal(blockhash.length, 32, 'unexpected Solana devnet blockhash')
  const data = Buffer.alloc(12)
  data.writeUInt32LE(2, 0) // SystemProgram::Transfer
  data.writeBigUInt64LE(BigInt(LAMPORTS), 4)
  const message = Buffer.concat([
    Buffer.from([1, 0, 1]), uvarint(3),
    sender.pubkey, recipient.pubkey, SYSTEM, blockhash,
    uvarint(1), Buffer.from([2]), uvarint(2), Buffer.from([0, 1]),
    uvarint(data.length), data,
  ])
  const signature = sign(null, message, sender.privateKey)
  assert.equal(signature.length, 64)
  const signed = Buffer.concat([uvarint(1), signature, message]).toString('base64')
  const txid = await rpc('sendTransaction', [
    signed, {
      encoding: 'base64', skipPreflight: false,
      preflightCommitment: 'confirmed', maxRetries: 2,
    },
  ])
  assert.equal(txid, encode58(signature), 'signature mismatch')
  let status
  for (let n = 0; n < 25; n++) {
    const states = await rpc('getSignatureStatuses', [[txid]])
    status = states.value[0]
    if (status && ['confirmed', 'finalized'].includes(status.confirmationStatus)) break
    await wait(2000)
  }
  assert.ok(status && status.err === null &&
    ['confirmed', 'finalized'].includes(status.confirmationStatus),
  'Micro-transfer unconfirmed, manual reconciliation required')
  assert.ok((await balance(recipient.address)) >= LAMPORTS,
    'Recipient not yet credited')
  const explorer = 'https://explorer.solana.com/tx/' + txid + '?cluster=devnet'
  console.log('DEVNET_SOL_MICRO_TRANSFER_CONFIRMED amount_lamports=' + LAMPORTS)
  console.log('DEVNET_SOL_TX=' + explorer)
  if (process.env.GITHUB_STEP_SUMMARY) {
    const { appendFileSync } = await import('node:fs')
    appendFileSync(process.env.GITHUB_STEP_SUMMARY,
      'Solana Devnet: **0.000001 test SOL transferred and confirmed**.\n' +
      'Transaction: ' + explorer + '\nNo mainnet transaction or real funds.\n')
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error('DEVNET_SOL_MICRO_BLOCKED:', String(error.message).slice(0, 240))
    process.exitCode = 1
  })
}
