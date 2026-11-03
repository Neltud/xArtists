/**
 * xArtists xArt-ID v1: pure, read-only artwork evidence and similarity primitives.
 *
 * NO C2PA validator, stolen-art registry integration, image model, mint, or
 * external chain verification here. Data passed to assessArtEvidenceV1 is
 * UNTRUSTED until separately authenticated by authorized, bounded verifiers.
 * Never promote these signals into a fraud verdict, ownership right or a
 * public authenticity certificate.
 */
import { createHash } from 'node:crypto'

const HASH = /^[a-f0-9]{64}$/
const PHASH = /^[a-f0-9]{16}$/
const ART_ID = /^xart:v1:[a-f0-9]{64}$/
const NAMESPACE = /^[a-z0-9][a-z0-9._:/-]{2,127}$/
const EDITION = /^[a-z0-9][a-z0-9_-]{0,47}$/
const MAX_MEDIA_BYTES = 64 * 1024 * 1024
const MAX_CANDIDATES = 100
const MAX_REGISTRIES = 30
const DOMAIN = Buffer.from('xartists/art-id/v1\0', 'ascii')
const EVIDENCE_DOMAIN = Buffer.from('xartists/art-assessment/v1\0', 'ascii')

function hex64(value, field) {
  if (typeof value !== 'string' || !HASH.test(value)) {
    throw new TypeError(field + '_must_be_lowercase_sha256')
  }
  return value
}
function addLengthHash(hash, text) {
  const bytes = Buffer.from(text, 'utf8')
  const len = Buffer.allocUnsafe(4)
  len.writeUInt32BE(bytes.length)
  return hash.update(len).update(bytes)
}
function limitText(value, length) {
  return typeof value === 'string' ? value.slice(0, length) : ''
}

/** SHA-256 over exactly the supplied bytes; media content is NOT trusted. */
export function hashArtMediaBytesV1(bytes) {
  if (!(bytes instanceof Uint8Array) ||
      bytes.byteLength === 0 || bytes.byteLength > MAX_MEDIA_BYTES) {
    throw new RangeError('invalid_media_bytes_or_size')
  }
  return createHash('sha256').update(bytes).digest('hex')
}

/**
 * Stable technical REGISTRATION ANCHOR, not a globally unique artistic work
 * or proof that the first registrant is the true artist. Use server-verified
 * namespace ownership and independent artist attestations before publishing.
 */
export function deriveArtIdV1({
  creator_namespace, master_sha256, edition_id = 'original',
} = {}) {
  if (typeof creator_namespace !== 'string' ||
      !NAMESPACE.test(creator_namespace)) {
    throw new TypeError('invalid_creator_namespace')
  }
  if (typeof edition_id !== 'string' || !EDITION.test(edition_id)) {
    throw new TypeError('invalid_edition_id')
  }
  const master = hex64(master_sha256, 'master')
  const hash = createHash('sha256').update(DOMAIN)
  for (const field of [creator_namespace, master, edition_id]) {
    addLengthHash(hash, field)
  }
  return 'xart:v1:' + hash.digest('hex')
}

/**
 * Hamming distance of two 64-bit externally generated perceptual hashes.
 * pHash is only a non-unique soft visual signal and can be manipulated.
 * This function does NOT generate a pHash or verify the provenance of hashes.
 */
export function compareVisualHash64V1(left, right, threshold = 8) {
  if (typeof left !== 'string' || !PHASH.test(left) ||
      typeof right !== 'string' || !PHASH.test(right)) {
    throw new TypeError('phash64_lowercase_hex_required')
  }
  if (!Number.isInteger(threshold) || threshold < 0 || threshold > 16) {
    throw new RangeError('invalid_visual_threshold')
  }
  let xor = BigInt('0x' + left) ^ BigInt('0x' + right)
  let distance = 0
  while (xor) { distance += Number(xor & 1n); xor >>= 1n }
  return Object.freeze({
    distance,
    candidate_similarity: distance <= threshold,
    method: 'phash64_hamming_candidate_only',
    proof_of_authenticity: false,
  })
}

const REGISTRY_STATUS = new Set(['not_checked', 'no_match_reported', 'possible_match', 'inconclusive'])
const C2PA_STATUS = new Set(['not_checked', 'claimed_valid', 'claimed_invalid', 'validator_reported_valid', 'validator_reported_invalid'])
const NETWORK = new Set(['multiversx-mainnet', 'multiversx-testnet', 'multiversx-devnet'])

/**
 * Conservative, deterministic human-review dossier snapshot.
 * No input field is treated as a trusted fact without server-side provenance.
 * In particular, reported registry negatives never establish "not stolen".
 */
export function assessArtEvidenceV1(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('art_evidence_object_required')
  }
  const artId = input.art_id
  if (typeof artId !== 'string' || !ART_ID.test(artId)) {
    throw new TypeError('invalid_art_id')
  }
  const master = hex64(input.master_sha256, 'master')
  const observed = input.observed_sha256 == null ? null
    : hex64(input.observed_sha256, 'observed')
  const rawCandidates = input.visual_candidates ?? []
  const rawRegistries = input.theft_registry_checks ?? []
  if (!Array.isArray(rawCandidates) || rawCandidates.length > MAX_CANDIDATES ||
      !Array.isArray(rawRegistries) || rawRegistries.length > MAX_REGISTRIES) {
    throw new RangeError('art_evidence_list_invalid_or_too_large')
  }
  const flags = []
  const visual = rawCandidates.map((c) => {
    if (!c || typeof c !== 'object' ||
        typeof c.reference !== 'string' || !/^[a-zA-Z0-9:/._-]{3,160}$/.test(c.reference)) {
      throw new TypeError('invalid_visual_candidate_reference')
    }
    const hit = compareVisualHash64V1(c.reference_phash64, c.observed_phash64)
    return { reference: c.reference, distance: hit.distance,
      candidate_similarity: hit.candidate_similarity, method: hit.method }
  })
  if (observed !== null && observed !== master) flags.push('media_bytes_mismatch')
  if (visual.some(v => v.candidate_similarity)) flags.push('potential_visual_duplicate_review')
  const registries = rawRegistries.map(r => {
    if (!r || typeof r !== 'object' ||
        typeof r.source !== 'string' || !/^[a-zA-Z0-9 ._-]{2,64}$/.test(r.source) ||
        !REGISTRY_STATUS.has(r.reported_status)) {
      throw new TypeError('invalid_theft_registry_screen')
    }
    return {
      source: r.source,
      reported_status: r.reported_status,
      checked_at_utc: limitText(r.checked_at_utc, 40) || null,
      evidence_ref: limitText(r.evidence_ref, 180) || null,
      independently_verified: false,
    }
  })
  if (!registries.length || registries.some(r=>r.reported_status==='not_checked')) {
    flags.push('stolen_art_screening_incomplete')
  }
  if (registries.some(r=>r.reported_status==='possible_match')) {
    flags.push('reported_stolen_registry_possible_match_requires_review')
  }
  if (input.rights_to_mint_attested !== true) flags.push('mint_rights_not_established')
  const c2pa = input.c2pa ?? { reported_status: 'not_checked' }
  if (!c2pa || !C2PA_STATUS.has(c2pa.reported_status)) {
    throw new TypeError('invalid_c2pa_status')
  }
  if (c2pa.reported_status === 'not_checked') flags.push('c2pa_not_checked')
  if (c2pa.reported_status.includes('invalid')) flags.push('c2pa_reported_validation_issue')
  const chain = input.nft_snapshot ?? null
  let nft = null
  if (chain !== null) {
    if (typeof chain !== 'object' || !NETWORK.has(chain.network) ||
        typeof chain.collection !== 'string' ||
        !/^[A-Z0-9]{3,10}-[a-f0-9]{6}$/.test(chain.collection) ||
        !Number.isSafeInteger(chain.nonce) || chain.nonce < 1) {
      throw new TypeError('invalid_nft_snapshot_identity')
    }
    const expected = chain.expected_metadata_sha256 == null ? null
      : hex64(chain.expected_metadata_sha256, 'expected_metadata')
    const observedMeta = chain.observed_metadata_sha256 == null ? null
      : hex64(chain.observed_metadata_sha256, 'observed_metadata')
    nft = {
      network: chain.network, collection: chain.collection, nonce: chain.nonce,
      reported_metadata_hash_match: expected && observedMeta ? expected === observedMeta : null,
      independently_verified: false,
    }
    if (nft.reported_metadata_hash_match === false) flags.push('nft_metadata_mismatch')
    if (nft.reported_metadata_hash_match === null) flags.push('nft_metadata_not_checked')
  } else flags.push('onchain_not_checked')
  const stable = {
    art_id: artId, master_sha256: master, observed_sha256: observed,
    visual_candidates: visual, theft_registry_checks: registries,
    c2pa_reported_status: c2pa.reported_status,
    rights_to_mint_attested: input.rights_to_mint_attested === true,
    nft, flags,
  }
  const evidenceHash = createHash('sha256')
    .update(EVIDENCE_DOMAIN).update(JSON.stringify(stable)).digest('hex')
  return Object.freeze({
    schema: 'xartists.art_assessment.v1',
    art_id: artId,
    evidence_digest: evidenceHash,
    exact_media_match: observed === null ? 'not_checked' : observed === master ? 'same_bytes' : 'different_bytes',
    visual_candidates: visual,
    registry_checks: registries,
    nft,
    flags,
    disposition: 'human_review_required',
    certified_authentic: false,
    certified_not_stolen: false,
    onchain_verified_by_this_module: false,
    evidence_trust: 'caller_supplied_unverified',
  })
}

export function diffArtEvidenceV1(previous, current) {
  if (!previous || !current || previous.art_id !== current.art_id ||
      !ART_ID.test(String(previous.art_id || '')) ||
      !HASH.test(String(previous.evidence_digest || '')) ||
      !HASH.test(String(current.evidence_digest || ''))) {
    throw new TypeError('incompatible_art_assessments')
  }
  const changed = previous.evidence_digest !== current.evidence_digest
  return Object.freeze({
    art_id: previous.art_id, changed,
    previous_evidence_digest: previous.evidence_digest,
    current_evidence_digest: current.evidence_digest,
    requires_human_reassessment: changed,
    automated_authenticity_verdict: false,
  })
}
