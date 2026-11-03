import test from 'node:test'
import assert from 'node:assert/strict'
import { isJpegMagicV1, rejectInProcessJpegDecodeV1 } from '../src/artIdentityJpegGate.mjs'

test('detect JPEG SOI', () => {
  assert.equal(isJpegMagicV1(Buffer.from([0xff, 0xd8, 0xff, 0xe0])), true)
  assert.equal(isJpegMagicV1(Buffer.from([137, 80, 78])), false)
})

test('in-process JPEG always refused without authenticity claim', () => {
  const r = rejectInProcessJpegDecodeV1(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]))
  assert.equal(r.ok, false)
  assert.match(r.error, /isolated_worker/)
  assert.equal(r.certified_authentic, false)
})
