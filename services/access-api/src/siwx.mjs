/** One-use, wallet-bound login challenges using MultiversX SDK message signing. */
import crypto from 'node:crypto'
import sdk from '@multiversx/sdk-core'

const { Address, Message, MessageComputer } = sdk
const nonces = new Map()
const NONCE_TTL_MS = 5 * 60 * 1000
const computer = new MessageComputer()

/** Check prefix, length, checksum and exact 32-byte key using the official SDK. */
export function erdToPubkey(address) {
  if (typeof address !== 'string' || !/^erd1[023456789acdefghjklmnpqrstuvwxyz]{58}$/.test(address)) throw new Error('invalid_address')
  const parsed = Address.newFromBech32(address)
  const key = parsed.getPublicKey()
  if (parsed.getHrp() !== 'erd' || key.length !== 32) throw new Error('invalid_address')
  return Buffer.from(key)
}

export function createChallenge(address, now = Date.now()) {
  erdToPubkey(address)
  for (const [key, value] of nonces) if (value.exp <= now) nonces.delete(key)
  if (nonces.size >= 10000) throw Object.assign(new Error('challenge_capacity'), { statusCode: 429 })
  const nonce = crypto.randomBytes(16).toString('hex')
  const issued = new Date(now).toISOString()
  const message = `xArtists TCA login\naddress:${address}\nnonce:${nonce}\nissued:${issued}\ndomain:neltud.github.io`
  nonces.set(nonce, { address, message, exp: now + NONCE_TTL_MS })
  return { message, nonce, issued, expiresIn: NONCE_TTL_MS / 1000 }
}

export function consumeNonce(nonce, address, message, now = Date.now()) {
  const row = nonces.get(nonce)
  if (!row) return false
  if (row.exp <= now) { nonces.delete(nonce); return false }
  if (row.address !== address || row.message !== message) return false
  nonces.delete(nonce)
  return true
}

export function verifyErdSignature(address, message, signature) {
  try {
    const pub = erdToPubkey(address)
    if (typeof message !== 'string' || typeof signature !== 'string') return false
    const encoded = signature.trim().replace(/^0x/i, '')
    let bytes
    if (/^[0-9a-f]{128}$/i.test(encoded)) bytes = Buffer.from(encoded, 'hex')
    else if (/^[A-Za-z0-9+/]{86}==$/.test(encoded)) bytes = Buffer.from(encoded, 'base64')
    else return false
    if (bytes.length !== 64) return false
    const payload = new Message({ data: Buffer.from(message, 'utf8') })
    const data = computer.computeBytesForVerifying(payload)
    const key = crypto.createPublicKey({
      key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), pub]),
      format: 'der', type: 'spki',
    })
    return crypto.verify(null, data, key, bytes)
  } catch { return false }
}

/** Invalid signatures cannot consume a legitimate challenge. A valid one works once. */
export function verifySignedChallenge({ address, message, signature, nonce }, now = Date.now()) {
  if (!address || !message || !signature || !nonce) return false
  return verifyErdSignature(address, message, signature) && consumeNonce(nonce, address, message, now)
}

export function requireSiwx() {
  return !['0', 'false'].includes(process.env.REQUIRE_SIWX || '')
}
