import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  hashArtMediaBytesV1, deriveArtIdV1, compareVisualHash64V1,
  assessArtEvidenceV1, diffArtEvidenceV1,
} from '../src/artIdentity.mjs'

const HASH_A = 'a'.repeat(64)
const HASH_B = 'b'.repeat(64)
const creator_namespace = 'erd1:studio-demo' // PRIVATE test namespace only, not an authenticated wallet
const edition_id = 'edition-1'
const anchor = deriveArtIdV1({ creator_namespace, master_sha256: HASH_A, edition_id })
const fresh = () => ({ art_id: anchor, creator_namespace, master_sha256: HASH_A, edition_id })

test('byte SHA256 deterministic and bounded — does not assert authorship', () => {
  assert.equal(hashArtMediaBytesV1(Buffer.from('abc')),
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  assert.throws(() => hashArtMediaBytesV1(Buffer.alloc(0)), /invalid_media/)
  assert.throws(() => hashArtMediaBytesV1('abc'), /invalid_media/)
})

test('registration anchor is deterministic but namespace and edition separated', () => {
  assert.match(anchor, /^xart:v1:[a-f0-9]{64}$/)
  assert.equal(deriveArtIdV1({ creator_namespace, master_sha256: HASH_A, edition_id }), anchor)
  assert.notEqual(deriveArtIdV1({ creator_namespace, master_sha256: HASH_B, edition_id }), anchor)
  assert.notEqual(deriveArtIdV1({ creator_namespace, master_sha256: HASH_A, edition_id:'edition-2' }), anchor)
  assert.notEqual(deriveArtIdV1({ creator_namespace:'other:artist', master_sha256:HASH_A, edition_id }), anchor)
  assert.throws(() => deriveArtIdV1({ creator_namespace:'Artist Name', master_sha256: HASH_A }), /namespace/)
  assert.throws(() => deriveArtIdV1({ creator_namespace, master_sha256:'deadbeef' }), /sha256/)
  assert.throws(() => assessArtEvidenceV1({ ...fresh(), master_sha256: HASH_B }), /derivation/)
})

test('visual similarity is candidate-only, even identical external hashes', () => {
  assert.deepEqual(compareVisualHash64V1('0000000000000000', '0000000000000000'), {
    distance:0, candidate_similarity:true,
    method:'phash64_hamming_candidate_only', proof_of_authenticity:false,
  })
  assert.equal(compareVisualHash64V1('0000000000000000', 'ffffffffffffffff').distance,64)
  assert.equal(compareVisualHash64V1('0000000000000000', 'ffffffffffffffff').candidate_similarity,false)
  assert.equal(compareVisualHash64V1('0000000000000000', '0000000000000001',0).candidate_similarity,false)
  assert.throws(() => compareVisualHash64V1('zzz','0000000000000000'),/phash64/)
  assert.throws(() => compareVisualHash64V1('0000000000000000','0000000000000000',64),/threshold/)
})

test('missing external checks means UNKNOWN, not stolen-clear or certified', () => {
  const a = assessArtEvidenceV1(fresh())
  assert.equal(a.disposition,'human_review_required')
  assert.equal(a.certified_authentic,false)
  assert.equal(a.certified_not_stolen,false)
  assert.equal(a.onchain_verified_by_this_module,false)
  assert.equal(a.evidence_trust,'caller_supplied_unverified')
  assert.equal(a.exact_media_match,'not_checked')
  assert.deepEqual(a.flags, ['stolen_art_screening_incomplete','mint_rights_not_established','c2pa_not_checked','onchain_not_checked'])
})

test('byte mismatch and candidate visual match flag review, no fraud conviction', () => {
  const a = assessArtEvidenceV1({
    ...fresh(), observed_sha256: HASH_B,
    visual_candidates: [{
      reference:'archive:match1', reference_phash64:'0000000000000000',
      observed_phash64:'0000000000000001',
    }],
  })
  assert.equal(a.exact_media_match,'different_bytes')
  assert.ok(a.flags.includes('media_bytes_mismatch'))
  assert.ok(a.flags.includes('potential_visual_duplicate_review'))
  assert.equal(a.visual_candidates[0].distance,1)
  assert.equal(a.certified_authentic,false)
})

test('reported theft result triggers curator review, never public assertion', () => {
  const a = assessArtEvidenceV1({
    ...fresh(), rights_to_mint_attested:true,
    theft_registry_checks:[{
      source:'INTERPOL', reported_status:'possible_match',
      checked_at_utc:'2026-11-03T14:00:00Z', evidence_ref:'case:test-only',
    }],
    c2pa:{reported_status:'validator_reported_valid'},
  })
  assert.ok(a.flags.includes('reported_stolen_registry_possible_match_requires_review'))
  assert.equal(a.registry_checks[0].independently_verified,false)
  assert.equal(a.certified_not_stolen,false)
  assert.equal(a.certified_authentic,false)
})

test('reported clean registry search never certifies not stolen', () => {
  const a = assessArtEvidenceV1({
    ...fresh(),
    theft_registry_checks:[{source:'ALR',reported_status:'no_match_reported'}],
    c2pa:{reported_status:'claimed_valid'},
    rights_to_mint_attested:true,
  })
  assert.equal(a.certified_not_stolen,false)
  assert.equal(a.disposition,'human_review_required')
  assert.equal(a.onchain_verified_by_this_module,false)
})

test('NFT metadata mismatch flags inconsistency, not NFT theft', () => {
  const a=assessArtEvidenceV1({
    ...fresh(),
    nft_snapshot: {
      network:'multiversx-testnet',collection:'ARTID-abcdef',nonce:7,
      expected_metadata_sha256:HASH_A,observed_metadata_sha256:HASH_B,
    },
  })
  assert.equal(a.nft.reported_metadata_hash_match,false)
  assert.equal(a.nft.independently_verified,false)
  assert.ok(a.flags.includes('nft_metadata_mismatch'))
  assert.equal(a.certified_authentic,false)
})

test('wrong network, token identity and list injection fail closed', () => {
  assert.throws(()=>assessArtEvidenceV1({...fresh(),nft_snapshot:{
    network:'eth-mainnet',collection:'ARTID-abcdef',nonce:1,
  }}),/nft_snapshot_identity/)
  assert.throws(()=>assessArtEvidenceV1({...fresh(),nft_snapshot:{
    network:'multiversx-mainnet',collection:'ARTID-abcdef',nonce:0,
  }}),/nft_snapshot_identity/)
  assert.throws(()=>assessArtEvidenceV1({...fresh(),
    theft_registry_checks:[{source:'INTERPOL',reported_status:'cleared'}],
  }),/theft_registry_screen/)
  assert.throws(()=>assessArtEvidenceV1({...fresh(),c2pa:{reported_status:'verified_original'}}),/c2pa/)
  assert.throws(()=>assessArtEvidenceV1({...fresh(),
    visual_candidates:[{reference:'url',reference_phash64:'bad',observed_phash64:'0000000000000000'}],
  }),/phash64/)
  assert.throws(()=>assessArtEvidenceV1({...fresh(),visual_candidates:Array(101).fill(null)}),/list_invalid/)
})

test('reassessment diff recognizes changed evidence without auto-verdict', () => {
  const previous=assessArtEvidenceV1(fresh())
  const same=assessArtEvidenceV1(fresh())
  const updated=assessArtEvidenceV1({...fresh(),observed_sha256:HASH_B})
  assert.equal(previous.evidence_digest,same.evidence_digest)
  assert.equal(diffArtEvidenceV1(previous,same).changed,false)
  const delta=diffArtEvidenceV1(previous,updated)
  assert.equal(delta.changed,true)
  assert.equal(delta.requires_human_reassessment,true)
  assert.equal(delta.automated_authenticity_verdict,false)
  assert.throws(()=>diffArtEvidenceV1(previous,{...updated,art_id:'xart:v1:'+'f'.repeat(64)}),/incompatible/)
})
