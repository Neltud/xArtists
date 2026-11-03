/**
 * Read-only MultiversX public-indexer snapshot for xArtists Art-ID.
 * A provider response is NOT independent consensus proof, NFT legal title,
 * copyright ownership, payment proof, or an authenticity certificate.
 * This module does not retrieve arbitrary URLs or trust client RPC endpoints.
 */
import { createHash } from 'node:crypto'
import { decodeErdAddress } from './claimVoucherCodec.mjs'

const NETWORK_BASE = Object.freeze({
  'multiversx-mainnet': 'https://api.multiversx.com',
  'multiversx-testnet': 'https://testnet-api.multiversx.com',
  'multiversx-devnet': 'https://devnet-api.multiversx.com',
})
const NFT_IDENTIFIER = /^([A-Z0-9]{3,20}-[a-f0-9]{6})-([a-f0-9]{2,16})$/
const MAX_URI = 1024
const MAX_ATTRIBUTES = 32768

function safeFields(raw, expectedId, collection, nonce) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) ||
      raw.identifier !== expectedId || raw.collection !== collection ||
      !(Number.isSafeInteger(raw.nonce) || (typeof raw.nonce === 'string' && /^\d+$/.test(raw.nonce))) ||
      BigInt(raw.nonce) !== nonce) {
    throw new Error('indexer_nft_identity_mismatch')
  }
  const uris = raw.uris
  if (!Array.isArray(uris) || uris.length > 32 ||
      uris.some(x => typeof x !== 'string' || x.length > MAX_URI)) {
    throw new Error('invalid_indexer_uris')
  }
  const attributes = raw.attributes
  if (!(attributes == null || (typeof attributes === 'string' &&
      attributes.length <= MAX_ATTRIBUTES))) {
    throw new Error('invalid_indexer_attributes')
  }
  const hash = raw.hash
  if (!(hash == null || (typeof hash === 'string' && hash.length <= 512))) {
    throw new Error('invalid_indexer_hash')
  }
  const creator = raw.creator
  if (!(creator == null || (typeof creator === 'string' &&
      creator.length === 62 && decodeErdAddress(creator).length === 32))) {
    throw new Error('invalid_indexer_creator')
  }
  return { creator: creator ?? null, uris, attributes: attributes ?? null, hash: hash ?? null }
}

/**
 * Result always remains a provider-reported read-only observation.
 * Must be corroborated by a separately approved source and reviewer.
 */
export async function probeMvxNftMetadataReadOnly(
  { network, nft_identifier, expected_creator = null } = {},
  request = fetch,
) {
  if (!Object.hasOwn(NETWORK_BASE, network) ||
      typeof nft_identifier !== 'string' || !NFT_IDENTIFIER.test(nft_identifier)) {
    return { checked: false, reason: 'invalid_nft_reference', verified: false }
  }
  if (expected_creator !== null) {
    try { decodeErdAddress(expected_creator) }
    catch { return { checked: false, reason: 'invalid_expected_creator', verified: false } }
  }
  const [, collection, nonceHex] = nft_identifier.match(NFT_IDENTIFIER)
  const nonce = BigInt('0x' + nonceHex)
  if (nonce < 1n) return { checked: false, reason: 'invalid_nft_nonce', verified: false }
  const provider = NETWORK_BASE[network]
  try {
    const response = await request(provider + '/nfts/' + nft_identifier, {
      method:'GET',
      headers:{ Accept:'application/json' },
      redirect:'error',
      signal:AbortSignal.timeout(8000),
    })
    if (!response?.ok || response.status !== 200) throw new Error('indexer_unavailable')
    const declared = Number(response.headers?.get?.('content-length') || 0)
    if (declared > 256 * 1024) throw new Error('indexer_payload_oversize')
    const raw = await response.json()
    const safe = safeFields(raw, nft_identifier, collection, nonce)
    const fingerprint = createHash('sha256')
      .update('xartists/mvx-indexer-metadata/v1\0')
      .update(JSON.stringify(safe))
      .digest('hex')
    return {
      checked: true,
      verified: false,
      network,
      nft_identifier,
      collection,
      nonce: nonce.toString(10),
      source: provider,
      provider_metadata_fingerprint: fingerprint,
      reported_creator_matches_expected: expected_creator === null
        ? null : safe.creator === expected_creator,
      uris_count: safe.uris.length,
      evidence_trust: 'single_public_indexer_report_requires_corroboration',
      certified_authentic: false,
      certified_owner: false,
    }
  } catch {
    return {
      checked: false, verified: false,
      reason: 'indexer_unavailable_or_response_invalid',
      certified_authentic: false,
    }
  }
}
