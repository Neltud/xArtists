import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createHmac, generateKeyPairSync, sign } from 'node:crypto'
import sdk from '@multiversx/sdk-core'
import { createChallenge, consumeNonce, erdToPubkey, verifyErdSignature, verifySignedChallenge } from '../src/siwx.mjs'
import { issueAccessToken, signJwt, verifyJwt } from '../src/verifyAccess.mjs'
import { startServer, post } from './server-fixture.mjs'

const { Address, Message, MessageComputer } = sdk
const computer = new MessageComputer()
const keys = generateKeyPairSync('ed25519')
const publicBytes = keys.publicKey.export({ type: 'spki', format: 'der' }).subarray(-32)
const address = new Address(publicBytes).toBech32()
const signature = message => sign(null, computer.computeBytesForSigning(new Message({ data: Buffer.from(message) })), keys.privateKey).toString('hex')

test('SDK addresses require a valid checksum and SDK message signatures, not raw-message signatures', () => {
  assert.deepEqual(erdToPubkey(address), publicBytes)
  assert.throws(() => erdToPubkey(address.slice(0, -1) + (address.endsWith('q') ? 'p' : 'q')))
  assert.throws(() => erdToPubkey('erd1' + 'q'.repeat(58)))
  const message = 'xArtists signed login fixture'
  assert.equal(verifyErdSignature(address, message, signature(message)), true)
  assert.equal(verifyErdSignature(address, message, sign(null, Buffer.from(message), keys.privateKey).toString('hex')), false)
  assert.equal(verifyErdSignature(address, message + ' changed', signature(message)), false)
})

test('challenge is bound to the exact message and address, expires, and can only be consumed once', () => {
  const now = Date.now()
  const challenge = createChallenge(address, now)
  assert.equal(consumeNonce(challenge.nonce, address, challenge.message + ' changed', now), false)
  assert.equal(consumeNonce(challenge.nonce, 'other', challenge.message, now), false)
  assert.equal(consumeNonce(challenge.nonce, address, challenge.message, now), true)
  assert.equal(consumeNonce(challenge.nonce, address, challenge.message, now), false)
  const expired = createChallenge(address, now)
  assert.equal(consumeNonce(expired.nonce, address, expired.message, now + 300000), false)
})

test('omitted or exchanged nonces and invalid signatures cannot authenticate or burn the valid challenge', () => {
  const first = createChallenge(address)
  const second = createChallenge(address)
  const proof = { ...first, address, signature: signature(first.message) }
  assert.equal(verifySignedChallenge({ ...proof, nonce: '' }), false)
  assert.equal(verifySignedChallenge({ ...proof, nonce: second.nonce }), false)
  assert.equal(verifySignedChallenge({ ...proof, signature: '0'.repeat(128) }), false)
  assert.equal(verifySignedChallenge(proof), true)
  assert.equal(verifySignedChallenge(proof), false)
})

test('JWT validation requires correct MAC, algorithm and finite expiry', () => {
  const secret = 'test-only-not-a-production-secret-1234'
  const token = issueAccessToken({ status: 'FULL', reason: 'fixture' }, address, secret).token
  assert.equal(verifyJwt(token, secret).sub, address)
  assert.equal(verifyJwt(token + 'x', secret), null)
  assert.equal(verifyJwt(token.split('.').slice(0, 2).join('.') + '.' + 'é'.repeat(43), secret), null)
  assert.equal(verifyJwt(signJwt({ sub: address }, secret), secret), null)
  assert.equal(verifyJwt(signJwt({ exp: 1 }, secret), secret), null)
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() / 1000 + 60 })).toString('base64url')
  const mac = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url')
  assert.equal(verifyJwt(`${header}.${payload}.${mac}`, secret), null)
})

test('HTTP access issues a token once after a signed challenge; rejects missing proof, nonce substitution and replay', async () => {
  const server = await startServer({ PULSE_ALLOWLIST: address, ACCESS_JWT_SECRET: 'fixture-only-access-secret-12345678' })
  try {
    assert.equal((await post(server.base + '/v1/verify-access', { address })).status, 401)
    assert.equal((await post(server.base + '/v1/access/challenge', { address: 'erd1invalid' })).status, 400)
    const challenge = await (await post(server.base + '/v1/access/challenge', { address })).json()
    const another = await (await post(server.base + '/v1/access/challenge', { address })).json()
    const proof = { address, message: challenge.message, nonce: challenge.nonce, signature: signature(challenge.message) }
    assert.equal((await post(server.base + '/v1/verify-access', { ...proof, nonce: '' })).status, 401)
    assert.equal((await post(server.base + '/v1/verify-access', { ...proof, nonce: another.nonce })).status, 401)
    const response = await post(server.base + '/v1/verify-access', proof)
    assert.equal(response.status, 200)
    const body = await response.json()
    assert.equal(body.status, 'FULL')
    assert.equal(body.hasAccess, true)
    const introspection = await fetch(server.base + '/v1/access/introspect', { headers: { Authorization: `Bearer ${body.token}` } })
    assert.equal(introspection.status, 200)
    assert.equal((await post(server.base + '/v1/verify-access', proof)).status, 401)
  } finally { await server.close() }
})

test('disabling the mandatory signature flag never grants FULL access to an unsigned wallet', async () => {
  const server = await startServer({ REQUIRE_SIWX: '0', PULSE_ALLOWLIST: address, ACCESS_JWT_SECRET: 'fixture-only-access-secret-12345678' })
  try {
    const response = await post(server.base + '/v1/verify-access', { address })
    assert.equal(response.status, 401)
    assert.equal((await response.json()).token, undefined)
  } finally { await server.close() }
})
