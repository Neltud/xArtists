import test from 'node:test'
import assert from 'node:assert/strict'
import { acceptJpegWorkerFrameV1, JPEG_WORKER_PROTOCOL } from '../src/artIdentityJpegWorkerContract.mjs'

test('accepts well-formed RGBA frame', () => {
  const width = 2
  const height = 2
  const rgba = new Uint8Array(width * height * 4)
  const r = acceptJpegWorkerFrameV1({ width, height, rgba })
  assert.equal(r.ok, true)
  assert.equal(r.protocol, JPEG_WORKER_PROTOCOL)
  assert.equal(r.certified_authentic, false)
})

test('rejects size mismatch', () => {
  const r = acceptJpegWorkerFrameV1({ width: 2, height: 2, rgba: new Uint8Array(4) })
  assert.equal(r.ok, false)
  assert.match(r.error, /rgba_length/)
})
