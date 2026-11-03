import test from 'node:test'
import assert from 'node:assert/strict'
import { deflateSync } from 'node:zlib'
import { decodePngToRgbaV1, phashFromPngBytesV1 } from '../src/artIdentityPngDecode.mjs'
import { computeArtPHash64V1 } from '../src/artIdentityVision.mjs'

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeB = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeB, data])))
  return Buffer.concat([len, typeB, data, crc])
}

/** Minimal 2×2 solid red RGBA PNG */
function solidRedPng() {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(2, 0)
  ihdr.writeUInt32BE(2, 4)
  ihdr[8] = 8
  ihdr[9] = 6 // RGBA
  // 2 rows: filter0 + 8 bytes each
  const raw = Buffer.alloc(2 * (1 + 8))
  for (let y = 0; y < 2; y++) {
    const o = y * 9
    raw[o] = 0
    for (let x = 0; x < 2; x++) {
      const p = o + 1 + x * 4
      raw[p] = 220
      raw[p + 1] = 20
      raw[p + 2] = 20
      raw[p + 3] = 255
    }
  }
  const idat = deflateSync(raw)
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

test('decode solid RGBA PNG to 2x2', () => {
  const frame = decodePngToRgbaV1(solidRedPng())
  assert.equal(frame.width, 2)
  assert.equal(frame.height, 2)
  assert.equal(frame.rgba.length, 16)
  assert.equal(frame.rgba[0], 220)
  assert.equal(frame.certified_authentic, false)
})

test('phash from png is candidate-only', () => {
  const out = phashFromPngBytesV1(solidRedPng(), computeArtPHash64V1)
  assert.equal(out.certified_authentic, false)
  assert.equal(out.disposition, 'human_review_required')
  if (out.phash64) assert.match(out.phash64, /^[a-f0-9]{16}$/)
})

test('reject non-png and empty', () => {
  assert.throws(() => decodePngToRgbaV1(Buffer.from('notpng')), /not_a_png/)
  assert.throws(() => decodePngToRgbaV1(Buffer.alloc(0)), /invalid_or_too_large/)
})
