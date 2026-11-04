/**
 * PayBox Solana wallet-control verification, isolated and READ-ONLY.
 * No provider connection, transaction, token transfer, funds, mint or swap.
 * Host must inject an authenticated PayBox credential reader; client JSON
 * must never provide the wallet address, actor, Guardian or credential metadata.
 */
import { createHash, createPublicKey, randomBytes, randomUUID, verify as verifyEd25519 } from 'node:crypto'

const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const SPKI_ED25519_PREFIX = Buffer.from('302a300506032b6570032100', 'hex')
const HEX_SIG = /^[a-f0-9]{128}$/i
const error = (code, status = 400) => Object.assign(new Error(code), { code, status })
const digest = value => createHash('sha256').update(value).digest('hex')

export function solanaAddressBytes(address) {
  if (typeof address !== 'string' || address.length < 32 || address.length > 44) {
    throw error('invalid_solana_address')
  }
  let number = 0n
  for (const c of address) {
    const digit = BASE58.indexOf(c)
    if (digit === -1) throw error('invalid_solana_address')
    number = number * 58n + BigInt(digit)
  }
  const rest = []
  while (number > 0n) {
    rest.push(Number(number & 255n))
    number >>= 8n
  }
  const zeroes = address.match(/^1*/)[0].length
  const decoded = Buffer.concat([Buffer.alloc(zeroes), Buffer.from(rest.reverse())])
  if (decoded.length !== 32) throw error('invalid_solana_address')
  return decoded
}

function authenticatedActor(actor) {
  const id = actor?.id
  if (typeof id !== 'string' || !/^[a-zA-Z0-9_:.-]{3,128}$/.test(id)) {
    throw error('authenticated_actor_required', 401)
  }
  return id
}

export function verifySolanaMessageSignature({ address, message, signatureHex }) {
  const bytes = solanaAddressBytes(address)
  if (typeof message !== 'string' || message.length === 0 || message.length > 2048
      || typeof signatureHex !== 'string' || !HEX_SIG.test(signatureHex)) return false
  try {
    const key = createPublicKey({
      key: Buffer.concat([SPKI_ED25519_PREFIX, bytes]),
      format: 'der',
      type: 'spki',
    })
    return verifyEd25519(null, Buffer.from(message, 'utf8'), key, Buffer.from(signatureHex, 'hex'))
  } catch {
    return false
  }
}

/**
 * Read-only prototype, not a production authentication or spend authorization API.
 * getCredential is a server-owned adapter around an actual OAuth-granted PayBox
 * list_credentials result, scoped to the authenticated owner.
 */
export function createPayboxSolanaProofGate({
  expectedAddress,
  getCredential,
  guardian,
  clock = () => Date.now(),
  ttlMs = 120_000,
  maxRecords = 100,
  providerTimeoutMs = 5_000,
} = {}) {
  solanaAddressBytes(expectedAddress)
  if (typeof getCredential !== 'function' || typeof guardian !== 'function'
      || typeof clock !== 'function' || !Number.isSafeInteger(ttlMs)
      || ttlMs < 1_000 || ttlMs > 120_000 || !Number.isInteger(maxRecords)
      || maxRecords < 1 || maxRecords > 10_000
      || !Number.isInteger(providerTimeoutMs) || providerTimeoutMs < 1
      || providerTimeoutMs > 30_000) throw error('invalid_proof_gate_configuration', 500)

  const records = new Map()
  const guard = () => {
    let s
    try { s = guardian() } catch { throw error('proof_guardian_unavailable', 503) }
    if (!s || s.paused !== false || s.mode !== 'proof-only') throw error('proof_guardian_blocked', 503)
  }
  const now = () => {
    const t = clock()
    if (!Number.isSafeInteger(t) || t < 0) throw error('proof_clock_invalid', 503)
    return t
  }
  async function verifyGrant(actorId, credentialId) {
    const controller = new AbortController()
    let timeoutHandle
    try {
      const response = await Promise.race([
        Promise.resolve().then(() => getCredential({ actorId, credentialId, signal: controller.signal })),
        new Promise((_, reject) => {
          timeoutHandle = setTimeout(() => {
            controller.abort()
            reject(error('paybox_credential_unavailable', 503))
          }, providerTimeoutMs)
        }),
      ])
      if (response?.credential_id !== credentialId || response?.kind !== 'wallet'
          || response?.metadata?.address !== expectedAddress
          || !Array.isArray(response?.metadata?.chains)
          || !response.metadata.chains.includes('solana')) {
        throw error('paybox_grant_or_wallet_mismatch', 403)
      }
    } catch (e) {
      if (e?.code === 'paybox_grant_or_wallet_mismatch') throw e
      throw error('paybox_credential_unavailable', 503)
    } finally { clearTimeout(timeoutHandle) }
  }
  function ownedRecord(challengeId, actorId) {
    const record = records.get(challengeId)
    if (!record || record.actorId !== actorId) throw error('proof_challenge_not_found', 404)
    return record
  }

  async function prepare({ credentialId } = {}, actor) {
    const actorId = authenticatedActor(actor)
    guard()
    if (typeof credentialId !== 'string' || !/^[a-zA-Z0-9_.:-]{1,128}$/.test(credentialId)) {
      throw error('paybox_credential_id_invalid')
    }
    if (records.size >= maxRecords) throw error('proof_gate_capacity_exhausted', 429)
    await verifyGrant(actorId, credentialId)
    const issuedAt = now()
    const expiresAt = issuedAt + ttlMs
    if (!Number.isSafeInteger(expiresAt)) throw error('proof_clock_invalid', 503)
    const id = randomUUID()
    const message = [
      'xArtists PayBox Solana wallet-control proof v1',
      'Purpose: verify a wallet signature ONLY; NO transfer, swap, or payment.',
      'Chain: solana:mainnet',
      'Wallet: ' + expectedAddress,
      'Audience: xartists-access-api',
      'Actor-SHA256: ' + digest(actorId),
      'Credential-SHA256: ' + digest(credentialId),
      'Challenge: ' + id,
      'Nonce: ' + randomBytes(32).toString('hex'),
      'Issued-ms: ' + issuedAt,
      'Expires-ms: ' + expiresAt,
    ].join('\n')
    const record = { id, actorId, credentialId, message, issuedAt, expiresAt,
      status: 'issued', proofSha256: null }
    records.set(id, record)
    return {
      challengeId: id,
      status: 'issued',
      mode: 'proof-only',
      expiresAt,
      credentialId,
      intent: { op: 'solanaMessage', address: expectedAddress, message },
      digest: digest(message),
      requiresUserSignature: true,
      financialAuthorityGranted: false,
    }
  }

  function status({ challengeId } = {}, actor) {
    const actorId = authenticatedActor(actor)
    const r = ownedRecord(challengeId, actorId)
    return {
      challengeId, status: r.status, expiresAt: r.expiresAt,
      signatureValid: r.status === 'verified',
      payboxLiveIntegrationVerified: false,
      spendAuthorized: false,
      chainTransactionHash: null,
    }
  }

  async function confirm({ challengeId, signatureHex } = {}, actor) {
    const actorId = authenticatedActor(actor)
    const r = ownedRecord(challengeId, actorId)
    if (r.status !== 'issued') throw error('proof_challenge_not_confirmable', 409)
    guard()
    if (now() >= r.expiresAt) { r.status = 'expired'; throw error('proof_challenge_expired', 410) }
    if (typeof signatureHex !== 'string' || !HEX_SIG.test(signatureHex)) {
      throw error('proof_signature_format_invalid')
    }
    // One attempt; even concurrent calls cannot reuse a pending challenge.
    r.status = 'verifying'
    try {
      await verifyGrant(actorId, r.credentialId)
      if (now() >= r.expiresAt) throw error('proof_challenge_expired', 410)
      if (!verifySolanaMessageSignature({
        address: expectedAddress, message: r.message, signatureHex,
      })) throw error('proof_signature_invalid', 403)
      r.status = 'verified'
      r.proofSha256 = digest(Buffer.from(signatureHex, 'hex'))
      return { ...status({ challengeId }, actor), walletAddress: expectedAddress,
        signatureSha256: r.proofSha256,
        verifiedAt: now(),
      }
    } catch (e) {
      r.status = 'rejected'
      throw e
    }
  }

  function cancel({ challengeId } = {}, actor) {
    const actorId = authenticatedActor(actor)
    const r = ownedRecord(challengeId, actorId)
    if (r.status === 'issued') r.status = 'cancelled'
    return status({ challengeId }, actor)
  }
  return Object.freeze({ prepare, confirm, cancel, status })
}
