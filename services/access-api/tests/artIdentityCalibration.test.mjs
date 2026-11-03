/**
 * Calibration fixtures for xArt-ID visual Hamming thresholds.
 * Synthetic only — never treats similarity as authenticity.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { computeArtPHash64V1, rankArtPHashCandidatesV1 } from '../src/artIdentityVision.mjs'
import { compareVisualHash64V1 } from '../src/artIdentity.mjs'

function frame(width, height, fn, alpha = 255) {
  const rgba = new Uint8Array(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = 4 * (y * width + x)
      const v = fn(x, y, width, height)
      rgba.set([v, v, v, alpha], i)
    }
  }
  return { width, height, rgba }
}

const vertical = (x, y, w, h) => (x / w < 0.5 ? 30 : 220) + (y / h < 0.5 ? 0 : 15)
const horizontal = (x, y, w, h) => (y / h < 0.5 ? 30 : 220)
const noise = (x, y) => ((x * 17 + y * 31) % 200) + 20

test('identical patterns → distance 0 candidate', () => {
  const a = computeArtPHash64V1(frame(48, 48, vertical))
  const b = computeArtPHash64V1(frame(96, 96, vertical))
  assert.ok(a.phash64)
  assert.equal(a.phash64, b.phash64)
  const cmp = compareVisualHash64V1(a.phash64, b.phash64, 8)
  assert.equal(cmp.distance, 0)
  assert.equal(cmp.candidate_similarity, true)
  assert.equal(cmp.proof_of_authenticity, false)
})

test('orthogonal layouts → higher Hamming than threshold 8', () => {
  const v = computeArtPHash64V1(frame(64, 64, vertical))
  const h = computeArtPHash64V1(frame(64, 64, horizontal))
  const cmp = compareVisualHash64V1(v.phash64, h.phash64, 8)
  assert.ok(cmp.distance > 8, `expected distance>8 got ${cmp.distance}`)
  assert.equal(cmp.candidate_similarity, false)
})

test('rank returns nearest only as candidate list', () => {
  const query = computeArtPHash64V1(frame(40, 40, vertical)).phash64
  const refs = [
    { reference: 'lab:vertical', phash64: computeArtPHash64V1(frame(40, 40, vertical)).phash64 },
    { reference: 'lab:horizontal', phash64: computeArtPHash64V1(frame(40, 40, horizontal)).phash64 },
    { reference: 'lab:noise', phash64: computeArtPHash64V1(frame(40, 40, noise)).phash64 },
  ]
  const ranked = rankArtPHashCandidatesV1(query, refs, { threshold: 8, limit: 5 })
  assert.equal(ranked.matches_are_proof, false)
  assert.equal(ranked.disposition, 'human_review_required')
  assert.ok(ranked.candidates.some((c) => c.reference === 'lab:vertical'))
  assert.ok(!ranked.candidates.some((c) => c.reference === 'lab:horizontal'))
})

test('low-information frame does not mint a false fingerprint', () => {
  const flat = computeArtPHash64V1(frame(32, 32, () => 128))
  assert.equal(flat.phash64, null)
  assert.equal(flat.quality, 'low_information')
  assert.equal(flat.certified_authentic, false)
})
