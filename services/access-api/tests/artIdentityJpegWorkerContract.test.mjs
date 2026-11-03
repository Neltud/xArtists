import test from 'node:test'
import assert from 'node:assert/strict'
import { acceptJpegWorkerFrameV1, JPEG_WORKER_PROTOCOL } from '../src/artIdentityJpegWorkerContract.mjs'

test('accepts a well-formed frame, preserving certification off', () => {
  const rgba = new Uint8Array(2 * 2 * 4)
  const r = acceptJpegWorkerFrameV1({ width: 2, height: 2, rgba })
  assert.equal(r.ok, true)
  assert.equal(r.protocol, JPEG_WORKER_PROTOCOL)
  assert.equal(r.certified_authentic, false)
  assert.equal(r.next, 'computeArtPHash64V1')
  assert.equal(r.rgba.byteLength, 16)
})

test('validated RGBA is a defensive copy, not a shared caller view', () => {
  const rgba = new Uint8Array([255, 0, 0, 255])
  const r = acceptJpegWorkerFrameV1({ width: 1, height: 1, rgba })
  assert.equal(r.ok, true)
  assert.notStrictEqual(r.rgba, rgba)
  rgba[0] = 0
  assert.equal(r.rgba[0], 255)
})

test('rejects size mismatch and non-Uint8Array pixel data', () => {
  for (const rgba of [new Uint8Array(4), new Uint8ClampedArray(16), [0, 1], null, 'pixels']) {
    const r = acceptJpegWorkerFrameV1({ width: 2, height: 2, rgba })
    assert.equal(r.ok, false)
    assert.equal(r.error, 'rgba_length_mismatch')
    assert.equal(r.certified_authentic, false)
  }
})

test('rejects missing frames and arrays', () => {
  for (const frame of [null, undefined, false, [], 'frame']) {
    assert.equal(acceptJpegWorkerFrameV1(frame).ok, false)
  }
})

test('rejects non-integer, nonpositive and too-large dimensions', () => {
  for (const [width, height] of [
    [0, 2], [-1, 2], [1.1, 2], [NaN, 2], [Infinity, 2],
    [Number.MAX_SAFE_INTEGER + 1, 1], [4097, 1], [1, 4097], [2500, 2000],
  ]) {
    const r = acceptJpegWorkerFrameV1({ width, height, rgba: new Uint8Array(4) })
    assert.equal(r.ok, false)
    assert.equal(r.error, 'frame_dimensions_invalid')
  }
})

test('rejects objects with throwing property getters without crashing parent', () => {
  const frame = { get width() { throw new Error('hostile worker output') } }
  const r = acceptJpegWorkerFrameV1(frame)
  assert.deepEqual(r, { ok: false, error: 'invalid_frame_fields', certified_authentic: false })
})
