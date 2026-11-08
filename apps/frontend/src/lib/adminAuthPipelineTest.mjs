/**
 * Offline end-to-end admin auth pipeline (paper only).
 * challenge issue → MessageComputer sign → UserVerifier → nonce consume
 * Does NOT open HTTP, bind sessions, or grant on-chain rights.
 */
import { generateKeyPairSync } from 'node:crypto'
import {
  Message,
  MessageComputer,
  UserSecretKey,
  UserVerifier,
} from '@multiversx/sdk-core'
import { parseAndValidateAdminAuthMessage } from './adminAuthMessage.mjs'
import { createAdminChallengeStore } from './adminAuthChallenge.mjs'

function ephemeralSecret() {
  const { privateKey } = generateKeyPairSync('ed25519')
  const jwk = privateKey.export({ format: 'jwk' })
  const seed = Buffer.from(jwk.d, 'base64url')
  return new UserSecretKey(seed)
}

/**
 * @param {object} [opts]
 * @param {string} [opts.action]
 * @param {number} [opts.nowMs]
 * @param {number} [opts.ttlMs]
 * @param {object} [opts.extra] fields for challenge (escrowId, favorSeller, …)
 * @param {boolean} [opts.tamperAfterSign] mutate message after signing (integrity check)
 * @param {boolean} [opts.skipConsume]
 * @param {boolean} [opts.doubleConsume]
 */
export async function runAdminAuthPipelineOffline(opts = {}) {
  const nowMs = opts.nowMs ?? 1_700_000_000_000
  const action = opts.action || 'setPaused'
  const secretKey = ephemeralSecret()
  const address = secretKey.generatePublicKey().toAddress()
  const admin = address.toBech32()

  let clock = nowMs
  const store = createAdminChallengeStore({
    nowMs: () => clock,
  })

  const issued = store.issue({
    adminBech32: admin,
    action,
    ttlMs: opts.ttlMs ?? 120_000,
    ...(opts.extra || {}),
  })
  if (!issued.ok) return { ok: false, stage: 'issue', error: issued.error }

  const messageText = issued.message
  const parsed = parseAndValidateAdminAuthMessage(messageText, {
    expectedAdminBech32: admin,
    nowMs: clock + 1_000,
  })
  if (!parsed.ok) return { ok: false, stage: 'parse', error: parsed.error }

  const message = new Message({
    data: new TextEncoder().encode(messageText),
    address,
  })
  const computer = new MessageComputer()
  message.signature = await secretKey.sign(computer.computeBytesForSigning(message))

  let verifyMessage = message
  if (opts.tamperAfterSign) {
    const tamperedText = messageText.replace(`action=${action}`, 'action=setAttestor')
    verifyMessage = new Message({
      data: new TextEncoder().encode(tamperedText),
      address,
      signature: message.signature,
    })
  }

  const verified = await UserVerifier.fromAddress(address).verify(
    computer.computeBytesForVerifying(verifyMessage),
    verifyMessage.signature,
  )
  if (!verified) return { ok: false, stage: 'verify', error: 'invalid_signature' }

  if (opts.skipConsume) {
    return {
      ok: true,
      stage: 'verify',
      mode: 'paper_pipeline_verify_only',
      admin,
      action: parsed.action,
      nonce: parsed.nonce,
    }
  }

  const consumed = store.consume({
    nonce: parsed.nonce,
    adminBech32: admin,
    action: parsed.action,
    atMs: clock + 2_000,
  })
  if (!consumed.ok) return { ok: false, stage: 'consume', error: consumed.error }

  if (opts.doubleConsume) {
    const again = store.consume({
      nonce: parsed.nonce,
      adminBech32: admin,
      action: parsed.action,
      atMs: clock + 3_000,
    })
    if (again.ok) return { ok: false, stage: 'replay', error: 'replay_accepted' }
    return {
      ok: true,
      stage: 'replay_blocked',
      mode: 'paper_pipeline_complete',
      admin,
      action: parsed.action,
      replayError: again.error,
    }
  }

  return {
    ok: true,
    stage: 'complete',
    mode: 'paper_pipeline_complete',
    admin,
    action: parsed.action,
    nonce: parsed.nonce,
  }
}
