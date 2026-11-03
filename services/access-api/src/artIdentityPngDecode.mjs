/**
 * Bounded PNG → RGBA decode for xArt-ID lab use.
 * Supports only: 8-bit RGB/RGBA, non-interlaced, ≤4e6 pixels, ≤16 MiB file.
 * NO JPEG/WebP, NO HTTP handler, NO authenticity certificate.
 * Output is suitable for computeArtPHash64V1 only.
 */
import { inflateSync } from 'node:zlib'
import { createHash } from 'node:crypto'

const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
const MAX_BYTES = 16 * 1024 * 1024
const MAX_PIXELS = 4_000_000
const MAX_DIM = 4096

function readChunk(buf, offset) {
  if (offset + 8 > buf.length) throw new RangeError('png_truncated')
  const length = buf.readUInt32BE(offset)
  if (length > 32 * 1024 * 1024) throw new RangeError('png_chunk_too_large')
  const type = buf.toString('ascii', offset + 4, offset + 8)
  const dataStart = offset + 8
  const dataEnd = dataStart + length
  if (dataEnd + 4 > buf.length) throw new RangeError('png_truncated')
  return { type, data: buf.subarray(dataStart, dataEnd), next: dataEnd + 4 }
}

function paeth(a, b, c) {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)
  if (pa <= pb && pa <= pc) return a
  if (pb <= pc) return b
  return c
}

function unfilter(row, prev, bpp) {
  const type = row[0]
  const out = Buffer.alloc(row.length - 1)
  for (let i = 0; i < out.length; i++) {
    const x = row[i + 1]
    const a = i >= bpp ? out[i - bpp] : 0
    const b = prev ? prev[i] : 0
    const c = prev && i >= bpp ? prev[i - bpp] : 0
    let v
    if (type === 0) v = x
    else if (type === 1) v = (x + a) & 255
    else if (type === 2) v = (x + b) & 255
    else if (type === 3) v = (x + ((a + b) >> 1)) & 255
    else if (type === 4) v = (x + paeth(a, b, c)) & 255
    else throw new TypeError('png_unsupported_filter')
    out[i] = v
  }
  return out
}

/**
 * @param {Uint8Array|Buffer} bytes PNG file bytes
 * @returns {{ width: number, height: number, rgba: Uint8Array, media_sha256: string }}
 */
export function decodePngToRgbaV1(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength < 33 || bytes.byteLength > MAX_BYTES) {
    throw new RangeError('png_bytes_invalid_or_too_large')
  }
  const buf = Buffer.from(bytes)
  if (!buf.subarray(0, 8).equals(PNG_SIG)) throw new TypeError('not_a_png')

  let offset = 8
  let width = 0
  let height = 0
  let bitDepth = 0
  let colorType = 0
  let interlace = 0
  const idats = []

  while (offset < buf.length) {
    const chunk = readChunk(buf, offset)
    offset = chunk.next
    if (chunk.type === 'IHDR') {
      if (chunk.data.length !== 13) throw new TypeError('png_bad_ihdr')
      width = chunk.data.readUInt32BE(0)
      height = chunk.data.readUInt32BE(4)
      bitDepth = chunk.data[8]
      colorType = chunk.data[9]
      interlace = chunk.data[12]
      if (bitDepth !== 8) throw new TypeError('png_only_8bit')
      if (colorType !== 2 && colorType !== 6) throw new TypeError('png_only_rgb_or_rgba')
      if (interlace !== 0) throw new TypeError('png_no_interlace')
      if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) ||
          width < 1 || height < 1 || width > MAX_DIM || height > MAX_DIM ||
          width * height > MAX_PIXELS) {
        throw new RangeError('png_dimensions_out_of_bounds')
      }
    } else if (chunk.type === 'IDAT') {
      idats.push(chunk.data)
    } else if (chunk.type === 'IEND') {
      break
    }
  }
  if (!width || !idats.length) throw new TypeError('png_incomplete')

  const compressed = Buffer.concat(idats)
  let raw
  try {
    raw = inflateSync(compressed, { maxOutputLength: MAX_PIXELS * 5 + height + 1024 })
  } catch {
    throw new TypeError('png_inflate_failed')
  }

  const channels = colorType === 6 ? 4 : 3
  const bpp = channels
  const stride = width * channels
  const expected = height * (1 + stride)
  if (raw.length < expected) throw new TypeError('png_data_short')

  const rgba = new Uint8Array(width * height * 4)
  let prev = null
  let src = 0
  for (let y = 0; y < height; y++) {
    const row = raw.subarray(src, src + 1 + stride)
    src += 1 + stride
    const recon = unfilter(row, prev, bpp)
    prev = recon
    for (let x = 0; x < width; x++) {
      const si = x * channels
      const di = (y * width + x) * 4
      rgba[di] = recon[si]
      rgba[di + 1] = recon[si + 1]
      rgba[di + 2] = recon[si + 2]
      rgba[di + 3] = channels === 4 ? recon[si + 3] : 255
    }
  }

  return Object.freeze({
    width,
    height,
    rgba,
    media_sha256: createHash('sha256').update(buf).digest('hex'),
    decoder: 'xartists.png-rgba.v1',
    certified_authentic: false,
  })
}

/** Lab helper: PNG bytes → pHash candidate (still not authenticity). */
export function phashFromPngBytesV1(bytes, computeArtPHash64V1) {
  if (typeof computeArtPHash64V1 !== 'function') {
    throw new TypeError('computeArtPHash64V1_required')
  }
  const frame = decodePngToRgbaV1(bytes)
  const hash = computeArtPHash64V1({ width: frame.width, height: frame.height, rgba: frame.rgba })
  return Object.freeze({
    ...hash,
    media_sha256: frame.media_sha256,
    width: frame.width,
    height: frame.height,
    disposition: 'human_review_required',
    certified_authentic: false,
  })
}
