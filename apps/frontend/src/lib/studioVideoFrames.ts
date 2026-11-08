/**
 * Browser-local MP4 sampling for the xArtists artist preview.
 * A video's timeline is not a measured camera orbit: sample order and
 * nominal angles are previews, not photogrammetry or proof of a real 360°.
 */
export const STUDIO_VIDEO_MAX_BYTES = 120 * 1024 * 1024
export const STUDIO_VIDEO_MAX_SECONDS = 180
export const STUDIO_VIDEO_FRAME_COUNTS = [8, 12, 16, 24, 36] as const

export function sampleFrameTimes(start: number, end: number, count: number): number[] {
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end - start < 0.5) {
    throw new Error('Sélectionne un extrait vidéo d’au moins une demi-seconde.')
  }
  if (!Number.isInteger(count) || count < 4 || count > 36) {
    throw new Error('Le nombre de vues doit être compris entre 4 et 36.')
  }
  return Array.from({ length: count }, (_, index) => start + (index + 0.5) * (end - start) / count)
}

function aborted(signal: AbortSignal): void {
  if (signal.aborted) throw new DOMException('Extraction annulée.', 'AbortError')
}

function waitForVideo(
  video: HTMLVideoElement,
  eventName: 'loadedmetadata' | 'seeked' | 'loadeddata',
  signal: AbortSignal,
  timeoutMs: number,
): Promise<void> {
  aborted(signal)
  return new Promise((resolve, reject) => {
    let timeout: number
    const cleanup = () => {
      video.removeEventListener(eventName, ready)
      video.removeEventListener('error', failed)
      signal.removeEventListener('abort', cancelled)
      window.clearTimeout(timeout)
    }
    const ready = () => { cleanup(); resolve() }
    const failed = () => {
      cleanup()
      reject(new Error('Vidéo impossible à décoder dans ce navigateur (codec HEVC/H.265 possible). Essaie un MP4 H.264.'))
    }
    const cancelled = () => { cleanup(); reject(new DOMException('Extraction annulée.', 'AbortError')) }
    video.addEventListener(eventName, ready, { once: true })
    video.addEventListener('error', failed, { once: true })
    signal.addEventListener('abort', cancelled, { once: true })
    timeout = window.setTimeout(() => {
      cleanup()
      reject(new Error('Décodage vidéo trop lent ou bloqué. Essaie un MP4 H.264 plus court.'))
    }, timeoutMs)
  })
}

export type VideoSample = { name: string; blob: Blob; timeSeconds: number }
export type VideoInfo = { duration: number; width: number; height: number }

export async function inspectLocalMp4(file: File, signal: AbortSignal): Promise<VideoInfo> {
  if (!(file.type === 'video/mp4' || (file.type === '' && /\.mp4$/i.test(file.name)))) {
    throw new Error('Choisis un fichier vidéo MP4.')
  }
  if (file.size <= 0 || file.size > STUDIO_VIDEO_MAX_BYTES) {
    throw new Error('Vidéo vide ou supérieure à 120 Mio : utilise un extrait ou compresse la vidéo.')
  }
  const url = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.preload = 'auto'
  try {
    const ready = waitForVideo(video, 'loadedmetadata', signal, 15000)
    video.src = url
    video.load()
    await ready
    aborted(signal)
    const duration = video.duration
    if (!Number.isFinite(duration) || duration < 0.5 || duration > STUDIO_VIDEO_MAX_SECONDS) {
      throw new Error('Durée vidéo non prise en charge (0,5 à 180 secondes).')
    }
    if (!video.videoWidth || !video.videoHeight) throw new Error('La vidéo ne contient aucune image lisible.')
    return { duration, width: video.videoWidth, height: video.videoHeight }
  } finally {
    video.pause()
    video.removeAttribute('src')
    video.load()
    URL.revokeObjectURL(url)
  }
}

export async function extractLocalMp4Frames({
  file, start, end, count, signal, onProgress,
}: {
  file: File
  start: number
  end: number
  count: number
  signal: AbortSignal
  onProgress?: (complete: number, total: number) => void
}): Promise<VideoSample[]> {
  const times = sampleFrameTimes(start, end, count)
  if (!(file.type === 'video/mp4' || (file.type === '' && /\.mp4$/i.test(file.name)))) {
    throw new Error('Choisis un MP4 compatible.')
  }
  if (file.size <= 0 || file.size > STUDIO_VIDEO_MAX_BYTES) throw new Error('Vidéo trop volumineuse (120 Mio maximum).')
  const url = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.preload = 'auto'
  video.muted = true
  video.playsInline = true
  try {
    const metadata = waitForVideo(video, 'loadedmetadata', signal, 15000)
    video.src = url
    video.load()
    await metadata
    aborted(signal)
    if (!Number.isFinite(video.duration) || video.duration > STUDIO_VIDEO_MAX_SECONDS ||
        end > video.duration + 0.05 || !video.videoWidth || !video.videoHeight) {
      throw new Error('Plage vidéo invalide ou vidéo illisible.')
    }
    const maxEdge = 720
    const scale = Math.min(1, maxEdge / Math.max(video.videoWidth, video.videoHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale))
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale))
    const context = canvas.getContext('2d', { alpha: false })
    if (!context) throw new Error('Canvas indisponible sur cet appareil.')
    const result: VideoSample[] = []
    for (const [index, time] of times.entries()) {
      aborted(signal)
      // Seek first, then decode the desired frame before drawing. A timestamp
      // close to 0 can otherwise accidentally reuse the preceding frame.
      const seeking = waitForVideo(video, 'seeked', signal, 12000)
      video.currentTime = Math.min(video.duration - 0.01, Math.max(0, time))
      await seeking
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        await waitForVideo(video, 'loadeddata', signal, 12000)
      }
      aborted(signal)
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(encoded => encoded ? resolve(encoded) : reject(new Error('Impossible d’encoder une image vidéo.')), 'image/jpeg', 0.86),
      )
      aborted(signal)
      result.push({
        name: `vue_video_${String(index + 1).padStart(2, '0')}_${time.toFixed(1)}s.jpg`,
        blob,
        timeSeconds: time,
      })
      onProgress?.(index + 1, count)
    }
    return result
  } finally {
    video.pause()
    video.removeAttribute('src')
    video.load()
    URL.revokeObjectURL(url)
  }
}
