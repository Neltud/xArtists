/**
 * Contract between API parent and future OS-isolated JPEG decoder.
 * No decoder implementation here — schema + validation only.
 */

export const JPEG_WORKER_PROTOCOL = 'xartists.jpeg-worker.v1'

const MAX_DIM = 4096
const MAX_PIXELS = 4_000_000

/**
 * Validate decoder worker stdout payload before pHash.
 * @param {{ width: number, height: number, rgba: Uint8Array }} frame
 */
export function acceptJpegWorkerFrameV1(frame) {
  if (!frame || typeof frame !== 'object') {
    return Object.freeze({ ok: false, error: 'missing_frame', certified_authentic: false })
  }
  const { width, height, rgba } = frame
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) ||
      width < 1 || height < 1 || width > MAX_DIM || height > MAX_DIM ||
      width * height > MAX_PIXELS) {
    return Object.freeze({ ok: false, error: 'frame_dimensions_invalid', certified_authentic: false })
  }
  if (!(rgba instanceof Uint8Array) || rgba.byteLength !== width * height * 4) {
    return Object.freeze({ ok: false, error: 'rgba_length_mismatch', certified_authentic: false })
  }
  return Object.freeze({
    ok: true,
    width,
    height,
    rgba,
    protocol: JPEG_WORKER_PROTOCOL,
    certified_authentic: false,
    next: 'computeArtPHash64V1',
  })
}
