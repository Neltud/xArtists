/**
 * Sprint 1.1b — SIWX challenge + Ed25519 verify (MultiversX erd1).
 * Optional: set REQUIRE_SIWX=1 to reject unsigned verify-access.
 */
import crypto from 'node:crypto'

const nonces = new Map() // nonce -> { address?, exp }
const NONCE_TTL_MS = 5 * 60 * 1000

function b32Decode(str) {
  const ALPH = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'
  const data = []
  for (const c of str.toLowerCase()) {
    const v = ALPH.indexOf(c)
    if (v < 0) throw new Error('bad bech32')
    data.push(v)
  }
  return data
}

function convertBits(data, from, to, pad) {
  let acc = 0
  let bits = 0
  const ret = []
  const maxv = (1 << to) - 1
  for (const value of data) {
    acc = (acc << from) | value
    bits += from
    while (bits >= to) {
      bits -= to
      ret.push((acc >> bits) & maxv)
    }
  }
  if (pad && bits > 0) ret.push((acc << (to - bits)) & maxv)
  return ret
}

/** erd1… → 32-byte public key */
export function erdToPubkey(address) {
  const s = String(address).trim()
  if (!s.startsWith('erd1')) throw new Error('not erd1')
  const hrpEnd = s.indexOf('1')
  const dataPart = s.slice(hrpEnd + 1)
  const decoded = b32Decode(dataPart)
  // drop 6 checksum chars
  const values = decoded.slice(0, decoded.length - 6)
  const bytes = convertBits(values, 5, 8, false)
  if (bytes.length < 32) throw new Error('short pubkey')
  return Buffer.from(bytes.slice(0, 32))
}

export function createChallenge(address) {
  const nonce = crypto.randomBytes(16).toString('hex')
  const issued = new Date().toISOString()
  const exp = Date.now() + NONCE_TTL_MS
  nonces.set(nonce, { address: address || null, exp })
  // purge old
  for (const [k, v] of nonces) {
    if (v.exp < Date.now()) nonces.delete(k)
  }
  const message =
    `xArtists TCA login\n` +
    `address:${address || ''}\n` +
    `nonce:${nonce}\n` +
    `issued:${issued}\n` +
    `domain:neltud.github.io`
  return { message, nonce, issued, expiresIn: Math.floor(NONCE_TTL_MS / 1000) }
}

export function consumeNonce(nonce, address) {
  const row = nonces.get(nonce)
  if (!row) return false
  if (row.exp < Date.now()) {
    nonces.delete(nonce)
    return false
  }
  if (row.address && address && row.address.toLowerCase() !== address.toLowerCase()) {
    return false
  }
  nonces.delete(nonce)
  return true
}

/**
 * Verify MultiversX wallet signature over message bytes.
 * signature: hex string (128 hex chars = 64 bytes) or base64.
 */
export function verifyErdSignature(address, message, signature) {
  try {
    const pub = erdToPubkey(address)
    let sigBuf
    const sig = String(signature).trim()
    if (/^[0-9a-fA-F]+$/.test(sig) && sig.length === 128) {
      sigBuf = Buffer.from(sig, 'hex')
    } else {
      sigBuf = Buffer.from(sig, 'base64')
    }
    if (sigBuf.length !== 64) return false
    const msgBuf = Buffer.from(String(message), 'utf8')
    // Node Ed25519 verify (raw key)
    return crypto.verify(
      null,
      msgBuf,
      {
        key: crypto.createPublicKey({
          key: Buffer.concat([
            Buffer.from('302a300506032b6570032100', 'hex'),
            pub,
          ]),
          format: 'der',
          type: 'spki',
        }),
      },
      sigBuf,
    )
  } catch {
    return false
  }
}

export function requireSiwx() {
  return process.env.REQUIRE_SIWX === '1' || process.env.REQUIRE_SIWX === 'true'
}
