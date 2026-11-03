/** Offline, dependency-free Solana Devnet codec tests. No RPC or funds. */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createPublicKey, sign, verify } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { encode58, decode58, keypair, uvarint } from './solana_devnet_micro_transfer.mjs'

test('base58 round-trip preserves leading zero bytes', () => {
  const samples = [
    Buffer.alloc(32),
    Buffer.from([0, 0, 0, 1, 2, 3, 255]),
    Buffer.from(Array.from({ length: 32 }, (_, n) => n + 1)),
  ]
  for (const bytes of samples) {
    assert.deepEqual(decode58(encode58(bytes)), bytes)
  }
  assert.equal(encode58(Buffer.alloc(32)), '1'.repeat(32))
})

test('Solana shortvec length codec emits expected unsigned bytes', () => {
  assert.deepEqual([...uvarint(0)], [0])
  assert.deepEqual([...uvarint(1)], [1])
  assert.deepEqual([...uvarint(127)], [127])
  assert.deepEqual([...uvarint(128)], [128, 1])
  assert.deepEqual([...uvarint(16384)], [128, 128, 1])
})

test('ephemeral sender public address matches a valid Ed25519 signing key', () => {
  const sender = keypair()
  assert.equal(sender.pubkey.length, 32)
  assert.equal(decode58(sender.address).length, 32)
  assert.deepEqual(decode58(sender.address), sender.pubkey)
  const message = Buffer.from('xArtists Solana Devnet only: offline signature fixture')
  const signature = sign(null, message, sender.privateKey)
  assert.equal(signature.length, 64)
  assert.equal(verify(null, message, createPublicKey(sender.privateKey), signature), true)
  assert.equal(verify(null, Buffer.from('wrong'), createPublicKey(sender.privateKey), signature), false)
})

test('importing codec helpers does not require the live Devnet send opt-in', () => {
  // The test process never sets XARTISTS_ALLOW_DEVNET_SEND=1 or calls RPC.
  // Any accidental top-level send would have caused the test import to fail.
  assert.equal(typeof encode58, 'function')
  assert.equal(typeof keypair, 'function')
})

test('refuses an unapproved devnet send before any RPC or faucet call', () => {
  const file = fileURLToPath(new URL('./solana_devnet_micro_transfer.mjs', import.meta.url))
  const child = spawnSync(process.execPath, [file], {
    env: { ...process.env, XARTISTS_ALLOW_DEVNET_SEND: '0' },
    encoding: 'utf8',
    timeout: 10000,
  })
  assert.equal(child.status, 1)
  assert.match(child.stderr, /explicit DEVNET ONLY opt-in missing/)
  assert.doesNotMatch(child.stdout, /MICRO_TRANSFER_CONFIRMED/)
})
