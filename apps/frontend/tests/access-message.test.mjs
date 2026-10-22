import assert from 'node:assert/strict'
import { test } from 'node:test'
import { loadSource } from './load-source.mjs'

test('access signing sends SDK Message bytes once and accepts a returned SDK byte signature', async () => {
  const { signAccessWithProvider } = loadSource('src/lib/accessMessagePayload.ts')
  let calls = 0
  const result = await signAccessWithProvider({ signMessage: async message => {
    calls++
    assert(message.data instanceof Uint8Array)
    assert.equal(new TextDecoder().decode(message.data), 'login challenge é')
    return { signature: new Uint8Array(64).fill(42) }
  } }, 'login challenge é')
  assert.equal(calls, 1)
  assert.equal(result.signature, '2a'.repeat(64))
})

test('declined access signature is never retried and invalid signatures are rejected', async () => {
  const { signAccessWithProvider } = loadSource('src/lib/accessMessagePayload.ts')
  let calls = 0
  const rejected = await signAccessWithProvider({ signMessage: async () => { calls++; throw new Error('user rejected') } }, 'challenge')
  assert.equal(calls, 1)
  assert.deepEqual(rejected, { ok: false, error: 'user_rejected' })
  const invalid = await signAccessWithProvider({ signMessage: async () => ({ signature: 'short' }) }, 'challenge')
  assert.equal(invalid.ok, false)
})
