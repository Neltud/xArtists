import { useEffect, useRef, useState, type ChangeEvent, type PointerEvent } from 'react'
import { extractLocalMp4Frames, inspectLocalMp4, STUDIO_VIDEO_FRAME_COUNTS, type VideoInfo } from '../lib/studioVideoFrames'

/**
 * Artist-side turntable: local previews ONLY. No upload, IPFS, wallet action,
 * inferred camera pose, photogrammetry or synthetic proof of authorship.
 */
type Frame = { name: string; src: string }
const ACCEPTED = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_FILES = 36
const MAX_FILE_BYTES = 16 * 1024 * 1024
const MAX_TOTAL_BYTES = 96 * 1024 * 1024
const MIN_FRAMES = 4
const PER_FRAME_PX = 22

function cycle(value: number, length: number): number {
  return ((value % length) + length) % length
}

export default function ArtworkTurntableLab() {
  const [frames, setFrames] = useState<Frame[]>([])
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [error, setError] = useState('')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [clipStart, setClipStart] = useState(0)
  const [clipEnd, setClipEnd] = useState(20)
  const [frameCount, setFrameCount] = useState(16)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')
  const activeJobRef = useRef<AbortController | null>(null)
  const [motionReduced, setMotionReduced] = useState(false)
  const urlsRef = useRef<string[]>([])
  const startRef = useRef<{ x: number; frame: number } | null>(null)
  const imageInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!media) return
    const sync = () => setMotionReduced(media.matches)
    sync()
    media.addEventListener?.('change', sync)
    return () => media.removeEventListener?.('change', sync)
  }, [])

  useEffect(() => {
    if (!playing || motionReduced || frames.length < MIN_FRAMES) return
    const timer = window.setInterval(() => {
      setIndex(current => cycle(current + 1, frames.length))
    }, 260)
    return () => window.clearInterval(timer)
  }, [playing, motionReduced, frames.length])

  useEffect(() => {
    const onHidden = () => { if (document.hidden) setPlaying(false) }
    document.addEventListener('visibilitychange', onHidden)
    return () => document.removeEventListener('visibilitychange', onHidden)
  }, [])

  useEffect(() => () => {
    activeJobRef.current?.abort()
    urlsRef.current.forEach(url => URL.revokeObjectURL(url))
    urlsRef.current = []
  }, [])

  const publishFrames = (next: Frame[]) => {
    urlsRef.current.forEach(url => URL.revokeObjectURL(url))
    urlsRef.current = next.map(frame => frame.src)
    setFrames(next)
    setIndex(0)
    setZoom(1)
    setPlaying(false)
    setError('')
  }

  const loadFiles = (event: ChangeEvent<HTMLInputElement>) => {
    activeJobRef.current?.abort()
    setBusy(false)
    setProgress('')
    setVideoFile(null)
    setVideoInfo(null)
    setPlaying(false)
    const selected = Array.from(event.target.files || [])
    if (!selected.length) return
    if (selected.length < MIN_FRAMES || selected.length > MAX_FILES) {
      setError('Sélectionne entre 4 et 36 photographies, dans l’ordre de rotation.')
      event.target.value = ''
      return
    }
    if (selected.some(file => !ACCEPTED.has(file.type) || file.size === 0 || file.size > MAX_FILE_BYTES)) {
      setError('Seuls JPEG, PNG et WebP sont acceptés (16 Mio maximum par image).')
      event.target.value = ''
      return
    }
    if (selected.reduce((sum, file) => sum + file.size, 0) > MAX_TOTAL_BYTES) {
      setError('Les images dépassent la limite locale de 96 Mio.')
      event.target.value = ''
      return
    }
    let next: Frame[] = []
    try {
      next = selected.map(file => ({ name: file.name, src: URL.createObjectURL(file) }))
    } catch {
      next.forEach(frame => URL.revokeObjectURL(frame.src))
      setError('Impossible de préparer les aperçus locaux.')
      event.target.value = ''
      return
    }
    publishFrames(next)
    event.target.value = ''
  }

  const loadVideo = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    activeJobRef.current?.abort()
    const controller = new AbortController()
    activeJobRef.current = controller
    setVideoFile(null)
    setVideoInfo(null)
    setProgress('Lecture des informations vidéo…')
    setError('')
    setBusy(true)
    setPlaying(false)
    try {
      const info = await inspectLocalMp4(file, controller.signal)
      if (activeJobRef.current !== controller || controller.signal.aborted) return
      setVideoFile(file)
      setVideoInfo(info)
      setClipStart(0)
      setClipEnd(Math.min(20, Number(info.duration.toFixed(2))))
      setProgress('Choisis la portion où l’objet tourne puis extrais les vues.')
    } catch (reason) {
      if (!controller.signal.aborted && activeJobRef.current === controller) {
        setError(reason instanceof Error ? reason.message : 'Vidéo non lisible.')
        setProgress('')
      }
    } finally {
      if (activeJobRef.current === controller) {activeJobRef.current = null;setBusy(false)}
    }
  }

  const extractVideo = async () => {
    if (!videoFile || !videoInfo || busy) return
    activeJobRef.current?.abort()
    const controller = new AbortController()
    activeJobRef.current = controller
    setBusy(true)
    setPlaying(false)
    setError('')
    setProgress('Préparation du décodage…')
    try {
      const samples = await extractLocalMp4Frames({
        file: videoFile, start: clipStart, end: clipEnd, count: frameCount,
        signal: controller.signal,
        onProgress: (done, total) => {
          if (!controller.signal.aborted && activeJobRef.current === controller) {
            setProgress(`Extraction des images : ${done}/${total}`)
          }
        },
      })
      if (controller.signal.aborted || activeJobRef.current !== controller) return
      const next: Frame[] = []
      try {
        samples.forEach(sample => next.push({ name: sample.name, src: URL.createObjectURL(sample.blob) }))
      } catch (cause) {
        next.forEach(frame => URL.revokeObjectURL(frame.src))
        throw cause
      }
      if (controller.signal.aborted || activeJobRef.current !== controller) {
        next.forEach(frame => URL.revokeObjectURL(frame.src))
        return
      }
      publishFrames(next)
      setProgress(`${next.length} vues prêtes. Vérifie leur ordre et leurs angles avant diffusion.`)
    } catch (reason) {
      if (!controller.signal.aborted && activeJobRef.current === controller) {
        setError(reason instanceof Error ? reason.message : 'Extraction impossible dans ce navigateur.')
        setProgress('')
      }
    } finally {
      if (activeJobRef.current === controller) {activeJobRef.current = null;setBusy(false)}
    }
  }

  const move = (offset: number) => {
    setPlaying(false)
    setIndex(current => cycle(current + offset, frames.length))
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (frames.length < MIN_FRAMES) return
    setPlaying(false)
    startRef.current = { x: event.clientX, frame: index }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!startRef.current || frames.length < MIN_FRAMES) return
    const amount = Math.round((startRef.current.x - event.clientX) / PER_FRAME_PX)
    setIndex(cycle(startRef.current.frame + amount, frames.length))
  }

  const swap = (position: number, offset: number) => {
    setPlaying(false)
    const target = position + offset
    if (target < 0 || target >= frames.length) return
    setFrames(current => {
      const updated = [...current]
      ;[updated[position], updated[target]] = [updated[target], updated[position]]
      return updated
    })
    setIndex(target)
  }

  const ready = frames.length >= MIN_FRAMES
  const angle = ready ? Math.round(index * 360 / frames.length) : 0
  const frame = ready ? frames[index] : null
  return (
    <section aria-label="xArtists 3D Lab — rotation photographique" className="rounded-2xl border border-zinc-200 bg-white p-4 text-zinc-900 space-y-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">xArtists · 3D Lab</p>
        <h3 className="text-lg font-semibold">Faire tourner une sculpture</h3>
        <p className="text-sm text-zinc-600">
          Importe 4 à 36 photos ou sélectionne un extrait de vidéo MP4 pour générer les vues.
          Fais pivoter l’aperçu avec le doigt, les flèches ou en mode automatique.
        </p>
      </div>
      <label htmlFor="xa-turntable-photos" className="block text-sm font-medium">
        Photos de l’objet (JPEG, PNG ou WebP)
      </label>
      <input
        id="xa-turntable-photos"
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={busy}
        onChange={loadFiles}
        aria-describedby="xa-turntable-privacy"
        className="block w-full max-w-full text-sm text-zinc-700 file:mr-3 file:rounded-lg file:border file:border-zinc-300 file:bg-zinc-50 file:px-3 file:py-2 file:text-zinc-900"
      />
      <fieldset className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
        <legend className="px-1 text-sm font-semibold">Ou extraire des vues d’une vidéo MP4</legend>
        <input type="file" accept="video/mp4,.mp4" aria-label="Choisir une vidéo MP4 locale"
          disabled={busy} onChange={e => { void loadVideo(e) }}
          className="block w-full text-sm text-zinc-700 file:mr-3 file:rounded-lg file:border file:border-zinc-300 file:px-3 file:py-2" />
        <p className="text-xs text-zinc-600">MP4 jusqu’à 120 Mio et 3 minutes. HEVC/H.265 peut ne pas être décodé par tous les navigateurs ; MP4 H.264 recommandé. L’extraction ne téléverse rien.</p>
        {videoInfo && (
          <>
            <p className="text-xs text-zinc-700">Vidéo : {videoInfo.duration.toFixed(1)} s · {videoInfo.width} × {videoInfo.height} px</p>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-zinc-700">Début (secondes)
                <input type="number" min={0} max={videoInfo.duration} step={0.1}
                  value={clipStart} onChange={e => setClipStart(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-2 py-2" />
              </label>
              <label className="text-xs text-zinc-700">Fin (secondes)
                <input type="number" min={0} max={videoInfo.duration} step={0.1}
                  value={clipEnd} onChange={e => setClipEnd(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-2 py-2" />
              </label>
            </div>
            <label className="block text-xs text-zinc-700">Nombre d’images
              <select value={frameCount} onChange={e => setFrameCount(Number(e.target.value))}
                className="ml-2 rounded-lg border border-zinc-300 bg-white px-3 py-2">
                {STUDIO_VIDEO_FRAME_COUNTS.map(count => <option key={count} value={count}>{count} vues</option>)}
              </select>
            </label>
            <button type="button" disabled={busy || !Number.isFinite(clipStart) || !Number.isFinite(clipEnd) || clipStart < 0 || clipEnd > videoInfo.duration || clipEnd - clipStart < 0.5}
              onClick={() => { void extractVideo() }}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Extraire les vues</button>
          </>
        )}
        {busy && <button type="button" className="ml-2 rounded-lg border border-zinc-400 px-3 py-2 text-sm" onClick={() => {activeJobRef.current?.abort();setBusy(false);setProgress('Extraction annulée.')}}>Annuler</button>}
        {progress && <p role="status" aria-live="polite" className="text-xs text-zinc-700">{progress}</p>}
        <p className="text-xs text-zinc-600">Une vidéo avec mouvements de caméra, gros plans ou retournements ne représente pas forcément un tour complet. Les angles affichés sont indicatifs : vérifie le résultat.</p>
      </fieldset>
      <p id="xa-turntable-privacy" className="text-xs text-zinc-600">
        Aperçu sur cet appareil uniquement : aucun fichier n’est envoyé au serveur, publié ou minté.
        Ce mode affiche des photographies, pas une reconstruction 3D certifiée.
      </p>
      {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
      {ready ? (
        <>
          <div
            role="group"
            tabIndex={0}
            aria-label="Faire tourner la sculpture avec les flèches du clavier ou en glissant"
            className="relative overflow-hidden rounded-xl border border-zinc-200 bg-[#f5f1e9] select-none cursor-grab focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            style={{ aspectRatio: '1 / 1', maxHeight: 'min(60vh, 560px)', touchAction: 'pan-y' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={() => { startRef.current = null }}
            onPointerCancel={() => { startRef.current = null }}
            onLostPointerCapture={() => { startRef.current = null }}
            onKeyDown={event => {
              if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                event.preventDefault()
                move(event.key === 'ArrowRight' ? 1 : -1)
              }
            }}
          >
            <img
              src={frame?.src}
              alt={`Photo ${index + 1} sur ${frames.length} : ${frame?.name || 'sculpture'}`}
              draggable={false}
              className="absolute inset-0 h-full w-full object-contain pointer-events-none"
              style={{ transform: `scale(${zoom})` }}
            />
            <output className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold tabular-nums" aria-label="Angle indicatif">
              ≈ {angle}°
            </output>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button type="button" className="rounded-lg border border-zinc-300 px-4 py-2" aria-label="Vue précédente" onClick={() => move(-1)}>←</button>
            <button
              type="button"
              className="rounded-lg border border-zinc-300 px-4 py-2 font-semibold disabled:opacity-50"
              disabled={motionReduced}
              aria-pressed={playing}
              onClick={() => setPlaying(current => !current)}
            >{playing ? 'Ⅱ Pause' : '▶ Rotation'}</button>
            <button type="button" className="rounded-lg border border-zinc-300 px-4 py-2" aria-label="Vue suivante" onClick={() => move(1)}>→</button>
            <button type="button" className="rounded-lg border border-zinc-300 px-3 py-2" onClick={() => {setPlaying(false);setIndex(0)}}>Face</button>
          </div>
          <label className="flex items-center gap-3 text-xs text-zinc-700">
            Angle
            <input type="range" min={0} max={frames.length - 1} value={index}
              className="min-w-0 flex-1 accent-cyan-800" aria-label="Choisir une vue"
              onChange={e => {setPlaying(false);setIndex(Number(e.target.value))}} />
          </label>
          <label className="flex items-center gap-3 text-xs text-zinc-700">
            Zoom
            <input type="range" min={1} max={1.8} step={0.05} value={zoom}
              className="min-w-0 flex-1 accent-cyan-800" aria-label="Zoom du visuel"
              onChange={e => setZoom(Number(e.target.value))} />
          </label>
          <p className="text-xs text-zinc-600" aria-live="polite">Vue {index + 1}/{frames.length} · {frame?.name}</p>
          <div className="max-h-36 overflow-y-auto rounded-xl border border-zinc-200 p-2">
            <p className="text-[11px] font-semibold text-zinc-600 mb-2">Ordre des vues (à corriger si besoin)</p>
            {frames.map((item, position) => (
              <div key={item.src} className="flex items-center gap-2 border-b border-zinc-100 py-1 last:border-none">
                <span className="min-w-0 flex-1 truncate text-xs">{position + 1}. {item.name}</span>
                <button type="button" disabled={position === 0}
                  aria-label={`Déplacer ${item.name} vers la gauche`}
                  className="rounded border border-zinc-300 px-2 py-1 text-xs disabled:opacity-30"
                  onClick={() => swap(position, -1)}>↑</button>
                <button type="button" disabled={position === frames.length - 1}
                  aria-label={`Déplacer ${item.name} vers la droite`}
                  className="rounded border border-zinc-300 px-2 py-1 text-xs disabled:opacity-30"
                  onClick={() => swap(position, 1)}>↓</button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-5 py-12 text-center text-sm text-zinc-600">
          Ajoute au moins quatre photos, ou extrais des vues d’une vidéo MP4, pour commencer.
        </div>
      )}
      {motionReduced && <p className="text-xs text-zinc-600">Rotation automatique désactivée selon les préférences d’accessibilité de l’appareil.</p>}
    </section>
  )
}
