/**
 * Offline MultiversX wallet message protocol checks.
 * Uses @multiversx/sdk-core MessageComputer + UserVerifier + UserSecretKey.
 * Ephemeral seeds only. NO production keys, NO broadcast, NO admin privilege.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { generateKeyPairSync, sign } from 'node:crypto'
import {
  Message,
  MessageComputer,
  UserSecretKey,
  UserVerifier,
} from '@multiversx/sdk-core'
import { buildAdminAuthMessage } from '../src/lib/adminAuthMessage.mjs'

function ephemeralSecret() {
  const { privateKey } = generateKeyPairSync('ed25519')
  const jwk = privateKey.export({ format: 'jwk' })
  const seed = Buffer.from(jwk.d, 'base64url')
  assert.equal(seed.length, 32)
  return { secretKey: new UserSecretKey(seed), nodePrivateKey: privateKey }
}

test('MessageComputer + UserVerifier accepts protocol signature on admin message', async () => {
  const { secretKey } = ephemeralSecret()
  const address = secretKey.generatePublicKey().toAddress()
  const now = 1_700_000_000_000
  const text = buildAdminAuthMessage({
    action: 'setPaused',
    adminBech32: address.toBech32(),
    nonce: 'nonce-message-computer-01',
    issuedAtMs: now,
    expiresAtMs: now + 300_000,
  })
  const message = new Message({
    data: new TextEncoder().encode(text),
    address,
  })
  const computer = new MessageComputer()
  const bytes = computer.computeBytesForSigning(message)
  assert.equal(bytes.length, 32)
  message.signature = await secretKey.sign(bytes)
  const verifier = UserVerifier.fromAddress(address)
  const ok = await verifier.verify(computer.computeBytesForVerifying(message), message.signature)
  assert.equal(ok, true)
})

test('UserVerifier rejects raw UTF-8 Ed25519 signatures (not wallet protocol)', async () => {
  const { secretKey, nodePrivateKey } = ephemeralSecret()
  const address = secretKey.generatePublicKey().toAddress()
  const now = 1_700_000_000_000
  const text = buildAdminAuthMessage({
    action: 'setPaused',
    adminBech32: address.toBech32(),
    nonce: 'nonce-message-computer-02',
    issuedAtMs: now,
    expiresAtMs: now + 300_000,
  })
  const message = new Message({
    data: new TextEncoder().encode(text),
    address,
  })
  const computer = new MessageComputer()
  // Node signs the UTF-8 bytes directly — this is what our earlier offline helper did.
  const rawSig = sign(null, Buffer.from(text, 'utf8'), nodePrivateKey)
  const accepted = await UserVerifier.fromAddress(address).verify(
    computer.computeBytesForVerifying(message),
    rawSig,
  )
  assert.equal(accepted, false)
})

test('tampered admin message fails UserVerifier', async () => {
  const { secretKey } = ephemeralSecret()
  const address = secretKey.generatePublicKey().toAddress()
  const now = 1_700_000_000_000
  const text = buildAdminAuthMessage({
    action: 'setPaused',
    adminBech32: address.toBech32(),
    nonce: 'nonce-message-computer-03',
    issuedAtMs: now,
    expiresAtMs: now + 300_000,
  })
  const message = new Message({
    data: new TextEncoder().encode(text),
    address,
  })
  const computer = new MessageComputer()
  message.signature = await secretKey.sign(computer.computeBytesForSigning(message))
  const tampered = new Message({
    data: new TextEncoder().encode(text.replace('action=setPaused', 'action=setAttestor')),
    address,
    signature: message.signature,
  })
  const ok = await UserVerifier.fromAddress(address).verify(
    computer.computeBytesForVerifying(tampered),
    tampered.signature,
  )
  assert.equal(ok, false)
})
