/**
 * JPEG gate for xArt-ID — reject or hand-off, no decode in-process yet.
 * Full JPEG decode must run in an isolated worker with memory limits (#324).
 * Never authenticity certificate.
 */

const JPEG_SOI = Buffer.from([0xff, 0xd8, 0xff])

export function isJpegMagicV1(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength < 3) return false
  return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
}

/**
 * @returns {{ ok: false, error: string, next: string, certified_authentic: false }}
 */
export function rejectInProcessJpegDecodeV1(bytes) {
  if (!isJpegMagicV1(bytes)) {
    return Object.freeze({
      ok: false,
      error: 'not_jpeg_magic',
      next: 'use_png_lab_or_rgba_frame',
      certified_authentic: false,
    })
  }
  return Object.freeze({
    ok: false,
    error: 'jpeg_decode_requires_isolated_worker',
    next: 'spawn_worker_with_memory_cap_then_computeArtPHash64V1',
    certified_authentic: false,
  })
}
