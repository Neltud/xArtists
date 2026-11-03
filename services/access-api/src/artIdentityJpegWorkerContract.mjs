/**
 * Contract between API parent and future OS-isolated JPEG decoder.
 * No decoder implementation here — strict RGBA frame validation only.
 *
 * The worker protocol is NOT a reason to trust its bytes or to certify art.
 */
export const JPEG_WORKER_PROTOCOL = 'xartists.jpeg-worker.v1'

const MAX_DIM = 4096
const MAX_PIXELS = 4_000_000

function rejected(error) {
  return Object.freeze({ ok: false, error, certified_authentic: false })
}

/**
 * Validate decoded worker output before pHash.
 * Snapshot RGBA so the caller cannot mutate previously validated input.
 * Hostile input and hostile property getters must not throw into the API.
 *
 * @param {{ width: number, height: number, rgba: Uint8Array }} frame
 */
export function acceptJpegWorkerFrameV1(frame) {
  if (!frame || typeof frame !== 'object' || Array.isArray(frame)) {
    return rejected('missing_frame')
  }
  try {
    const { width, height, rgba } = frame
    if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) ||
        width < 1 || height < 1 || width > MAX_DIM || height > MAX_DIM ||
        width * height > MAX_PIXELS) {
      return rejected('frame_dimensions_invalid')
    }
    if (!(rgba instanceof Uint8Array) || rgba.byteLength !== width * height * 4) {
      return rejected('rgba_length_mismatch')
    }
    const pixels = Uint8Array.from(rgba)
    return Object.freeze({
      ok: true,
      width,
      height,
      rgba: pixels,
      protocol: JPEG_WORKER_PROTOCOL,
      certified_authentic: false,
      next: 'computeArtPHash64V1',
    })
  } catch {
    // Includes throwing accessors and detached/inaccessible typed arrays.
    return rejected('invalid_frame_fields')
  }
}
