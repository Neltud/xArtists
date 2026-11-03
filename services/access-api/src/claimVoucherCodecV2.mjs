/**
 * claimPack V2: OFFLINE ONLY deployment-instance-separated voucher preimage.
 *
 * This codec signs nothing and authorizes no deployment, HTTP issuance, sale,
 * mint or entitlement. A supplied deployment tx hash is NOT chain attestation.
 * #328 stays blocked until the SC captures the hash inside init(), VM semantics
 * are verified, and an independent security review approves the protocol.
 */
import { createPublicKey, verify as edVerify } from 'node:crypto'
import { encodeClaimVoucherV1 } from './claimVoucherCodec.mjs'

export const CLAIM_V2_DOMAIN = Buffer.from('XA-CLAIM-PACK-V2\0', 'ascii')
export const CLAIM_V2_SIZE = 178
const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex')

function deploymentTxHashBytes(value) {
  let bytes
  if (typeof value === 'string') {
    if (!/^[0-9a-f]{64}$/.test(value)) throw new TypeError('invalid_deployment_tx_hash_hex')
    bytes = Buffer.from(value, 'hex')
  } else if (value instanceof Uint8Array && value.byteLength === 32) {
    bytes = Buffer.from(value)
  } else {
    throw new TypeError('deployment_tx_hash_must_be_32_bytes')
  }
  if (bytes.every((v) => v === 0)) throw new TypeError('deployment_tx_hash_zero')
  return bytes
}

/**
 * Exact bytes: V2 domain[17] | (chain len=1, intent='T')[2] |
 * immutable VM-captured deployment tx hash[32] | V1 remaining fields[127].
 * Total: 178 bytes. Does NOT attest that the supplied hash came from a VM.
 */
export function encodeClaimVoucherV2(input) {
  if (!input || typeof input !== 'object' || input.chain_id !== 'T') {
    throw new TypeError('v2_testnet_chain_intent_required')
  }
  const deploymentTxHash = deploymentTxHashBytes(input.deployment_tx_hash)
  // Reuse ALL existing V1 field/price/TTL/Bech32 checks; no reimplemented
  // address parser and no fallback during V2 signature verification.
  const v1 = encodeClaimVoucherV1(input)
  const out = Buffer.concat([
    CLAIM_V2_DOMAIN,
    v1.subarray(17, 19),
    deploymentTxHash,
    v1.subarray(19),
  ])
  if (out.byteLength !== CLAIM_V2_SIZE) throw new Error('unexpected_v2_voucher_length')
  return out
}

/** Offline-only signature verification; not proof of payment, network or NFT. */
export function verifyClaimVoucherSignatureOfflineV2(input, signature, publicKey) {
  if (!(signature instanceof Uint8Array) || signature.byteLength !== 64 ||
      !(publicKey instanceof Uint8Array) || publicKey.byteLength !== 32) {
    return false
  }
  try {
    const key = createPublicKey({
      key: Buffer.concat([ED25519_SPKI_PREFIX, Buffer.from(publicKey)]),
      format: 'der',
      type: 'spki',
    })
    return edVerify(null, encodeClaimVoucherV2(input), key, Buffer.from(signature))
  } catch {
    return false
  }
}
