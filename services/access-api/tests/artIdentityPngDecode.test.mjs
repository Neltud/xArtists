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

function solidRedPng() {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(2, 0)
  ihdr.writeUInt32BE(2, 4)
  ihdr[8] = 8
  ihdr[9] = 6
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
  assert.throws(() => decodePngToRgbaV1(Buffer.alloc(40, 1)), /not_a_png/)
  assert.throws(() => decodePngToRgbaV1(Buffer.alloc(0)), /invalid_or_too_large/)
})


function splitSolidPng() {
  const whole = solidRedPng()
  return {
    sig: whole.subarray(0, 8),
    ihdr: whole.subarray(8, 33),
    idat: whole.subarray(33, whole.length - 12),
    iend: whole.subarray(whole.length - 12),
  }
}

test('PNG CRC is checked against chunk data (not only signature)', () => {
  const corrupted = Buffer.from(solidRedPng())
  corrupted[18] ^= 0x01 // change IHDR without updating CRC
  assert.throws(() => decodePngToRgbaV1(corrupted), /png_crc_mismatch/)
})

test('IEND is mandatory, unique final chunk with no trailing bytes', () => {
  const v = splitSolidPng()
  assert.throws(
    () => decodePngToRgbaV1(Buffer.concat([v.sig, v.ihdr, v.idat])),
    /png_incomplete/
  )
  assert.throws(
    () => decodePngToRgbaV1(Buffer.concat([solidRedPng(), Buffer.from('junk')])),
    /png_invalid_iend_or_trailing_bytes/
  )
  assert.throws(
    () => decodePngToRgbaV1(Buffer.concat([v.sig, v.ihdr, v.idat, chunk('IEND', Buffer.from([42]))])),
    /png_invalid_iend_or_trailing_bytes/
  )
})

test('IHDR must be first and exactly once', () => {
  const v = splitSolidPng()
  const text = chunk('tEXt', Buffer.from('x'))
  assert.throws(
    () => decodePngToRgbaV1(Buffer.concat([v.sig, text, v.ihdr, v.idat, v.iend])),
    /png_ihdr_must_be_first/
  )
  assert.throws(
    () => decodePngToRgbaV1(Buffer.concat([v.sig, v.ihdr, v.ihdr, v.idat, v.iend])),
    /png_duplicate_or_bad_ihdr/
  )
})

test('reject nonconsecutive IDAT, forbidden critical chunks and tRNS', () => {
  const v = splitSolidPng()
  const text = chunk('tEXt', Buffer.from('safe text'))
  assert.throws(
    () => decodePngToRgbaV1(Buffer.concat([v.sig, v.ihdr, v.idat, text, v.idat, v.iend])),
    /png_noncontiguous_idat/
  )
  assert.throws(
    () => decodePngToRgbaV1(Buffer.concat([v.sig, v.ihdr, chunk('PLTE', Buffer.from([0,0,0])), v.idat, v.iend])),
    /png_unsupported_critical_chunk/
  )
  assert.throws(
    () => decodePngToRgbaV1(Buffer.concat([v.sig, v.ihdr, chunk('tRNS', Buffer.alloc(6)), v.idat, v.iend])),
    /png_unhandled_transparency/
  )
})

test('reject invalid IHDR compression and reserved flags after correct CRC', () => {
  const v = splitSolidPng()
  for(const pos of [10, 11, 12]) {
    const bytes = Buffer.from(v.ihdr.subarray(8, 21))
    bytes[pos] = 1
    const png = Buffer.concat([v.sig, chunk('IHDR', bytes), v.idat, v.iend])
    assert.throws(
      () => decodePngToRgbaV1(png),
      /png_unsupported_compression_or_filter|png_no_interlace/
    )
  }
})

test('PNG inflate output must have exactly expected pixel bytes', () => {
  const v = splitSolidPng()
  const raw = Buffer.alloc(19)
  const idat = chunk('IDAT', deflateSync(raw))
  assert.throws(
    () => decodePngToRgbaV1(Buffer.concat([v.sig, v.ihdr, idat, v.iend])),
    /png_unexpected_decoded_size|png_inflate_failed/
  )
})

test('image bytes are SHA-256 hashed separately from visual candidate evidence', () => {
  const original = solidRedPng()
  const frame = decodePngToRgbaV1(original)
  const out = phashFromPngBytesV1(original, computeArtPHash64V1)
  assert.equal(frame.media_sha256, out.media_sha256)
  assert.match(out.media_sha256, /^[a-f0-9]{64}$/)
  assert.equal(out.certified_authentic, false)
  assert.equal(out.disposition, 'human_review_required')
})
