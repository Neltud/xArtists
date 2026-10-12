/**
 * TCA Classroom — hologram · prosody · lip-sync visemes · EMOTION
 * Sprint 1: ImmersiveErrorBoundary + MentorAskBar + ATC context badge.
 * No trading side-effects.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { createHologramMaterial } from '../components/tca/hologramMaterial'
import {
  createLipSyncState,
  speakWithLipSync,
  tickLipSync,
  stopLipSync,
  type LipSyncController,
} from '../components/tca/lipSync'
import { applyMouthShape } from '../components/tca/applyMouthShape'
import { MentorAskBar } from '../components/tca/MentorAskBar'
import { ImmersiveErrorBoundary } from '../components/ImmersiveErrorBoundary'
import { loadTcaContext } from '../lib/tcaVideoContext'

type Cue = {
  timestamp: number
  type: string
  payload: Record<string, unknown>
}

type CuePack = {
  ok?: boolean
  title?: string
  professor_id?: string
  total_duration_s?: number
  cues?: Cue[]
}

type SpeechStyle = {
  pitch?: number
  speed_multiplier?: number
  pause_frequency?: number
  pitch_variation?: number
}

type HoloSettings = {
  glow_color?: string
  flicker_rate?: number
  scanline_opacity?: number
  opacity_pulse?: number
  base_opacity?: number
}

type Professor = {
  id: string
  display_name?: string
  epoch?: string
  perspective?: string
  room?: { board?: string; ambient?: number }
  personality?: {
    tone?: string
    speech_style?: SpeechStyle
    gesture_style?: { intensity?: number; frequency?: number }
    look_style?: { eye_contact_intensity?: number; head_tilt_angle?: number }
    color_palette?: { primary_glow?: string; secondary_accent?: string }
  }
}

const BASE = `${import.meta.env.BASE_URL || '/'}data/tca/`
const FALLBACK = 'https://neltud.github.io/xArtists/data/tca/'
const MODEL_BASE = `${import.meta.env.BASE_URL || '/'}models/tca/`

async function loadJson<T>(name: string): Promise<T | null> {
  for (const root of [BASE, FALLBACK]) {
    try {
      const r = await fetch(`${root}${name}`, { cache: 'no-store' })
      if (r.ok) return (await r.json()) as T
    } catch {
      /* */
    }
  }
  return null
}

export default function TcaClassroom() {
  const mountRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState('Loading')
  const [subtitle, setSubtitle] = useState('')
  const [playing, setPlaying] = useState(false)
  const [t, setT] = useState(0)
  const [emotionLabel, setEmotionLabel] = useState('idle')
  const [professorId, setProfessorId] = useState('leonardo')
  const [pack, setPack] = useState<CuePack | null>(null)
  const [professors, setProfessors] = useState<Professor[]>([])
  const [agenda, setAgenda] = useState<{ professor_id?: string; title?: string }[]>([])

  const playingRef = useRef(false)
  const clockRef = useRef(0)
  const appliedRef = useRef<Set<number>>(new Set())
  const cuesRef = useRef<Cue[]>([])
  const professorRef = useRef<THREE.Object3D | null>(null)
  const lipSyncRef = useRef<LipSyncController | null>(null)
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)

  const prof = useMemo(
    () => professors.find(p => p.id === professorId) || professors[0],
    [professors, professorId],
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [cues, profs, ag] = await Promise.all([
        loadJson<CuePack>('cues_leo_w1_sfumato.json'),
        loadJson<{ professors?: Professor[] } | Professor[]>('professors.json'),
        loadJson<{ months?: { professor_id?: string; title?: string }[] } | { professor_id?: string; title?: string }[]>('agenda_season.json'),
      ])
      if (cancelled) return
      if (cues) {
        setPack(cues)
        cuesRef.current = cues.cues || []
        if (cues.professor_id) setProfessorId(cues.professor_id)
      }
      if (profs) {
        const list = Array.isArray(profs) ? profs : profs.professors || []
        setProfessors(list)
      }
      if (ag) {
        const months = Array.isArray(ag) ? ag : ag.months || []
        setAgenda(months)
      }
      setStatus('Ready')
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const host = mountRef.current
    if (!host) return

    let disposed = false
    let raf = 0
    let renderer: THREE.WebGLRenderer | null = null

    try {
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x050508)
      const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
      camera.position.set(0, 1.6, 3.4)
      camera.lookAt(0, 1.35, 0)

      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
      renderer.setSize(host.clientWidth || 640, host.clientHeight || 480, false)
      renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none'
      host.appendChild(renderer.domElement)

      scene.add(new THREE.AmbientLight(0x8899cc, 0.45))
      const key = new THREE.DirectionalLight(0xffffff, 0.9)
      key.position.set(2, 4, 3)
      scene.add(key)

      const holo = createHologramMaterial({
        glow_color: prof?.personality?.color_palette?.primary_glow || '#7dd3fc',
        base_opacity: 0.85,
      } as HoloSettings)

      const loader = new GLTFLoader()
      const modelUrl = `${MODEL_BASE}professor_placeholder.glb`
      loader.load(
        modelUrl,
        gltf => {
          if (disposed) return
          const root = gltf.scene
          root.traverse(o => {
            if ((o as THREE.Mesh).isMesh) {
              const m = o as THREE.Mesh
              m.material = holo
            }
          })
          root.position.set(0, 0, 0)
          scene.add(root)
          professorRef.current = root
          if (gltf.animations?.length) {
            const mixer = new THREE.AnimationMixer(root)
            mixerRef.current = mixer
            mixer.clipAction(gltf.animations[0]).play()
          }
          setStatus('Live')
        },
        undefined,
        () => {
          if (disposed) return
          const geo = new THREE.CapsuleGeometry(0.35, 1.1, 6, 12)
          const mesh = new THREE.Mesh(geo, holo)
          mesh.position.set(0, 1.0, 0)
          scene.add(mesh)
          professorRef.current = mesh
          setStatus('Live (proxy)')
        },
      )

      lipSyncRef.current = createLipSyncState()

      const clock = new THREE.Clock()
      const animate = () => {
        if (disposed) return
        raf = requestAnimationFrame(animate)
        const dt = clock.getDelta()
        mixerRef.current?.update(dt)
        if (playingRef.current) {
          clockRef.current += dt
          setT(clockRef.current)
          const cues = cuesRef.current
          for (let i = 0; i < cues.length; i++) {
            const c = cues[i]
            if (appliedRef.current.has(i)) continue
            if (clockRef.current >= c.timestamp) {
              appliedRef.current.add(i)
              if (c.type === 'TEXT' || c.type === 'DYNAMIC_TEXT') {
                setSubtitle(String(c.payload.text || ''))
              }
              if (c.type === 'EMOTION' || c.type === 'EMOTIONAL_SHIFT') {
                setEmotionLabel(String(c.payload.emotion || c.payload.to || 'idle'))
              }
              if (c.type === 'AUDIO') {
                const text = String(c.payload.text || '')
                if (text && lipSyncRef.current) {
                  speakWithLipSync(lipSyncRef.current, text, {
                    rate: prof?.personality?.speech_style?.speed_multiplier || 1,
                    pitch: prof?.personality?.speech_style?.pitch || 1,
                  })
                }
              }
            }
          }
          if (pack?.total_duration_s && clockRef.current >= pack.total_duration_s) {
            playingRef.current = false
            setPlaying(false)
          }
        }
        const ls = lipSyncRef.current
        if (ls) {
          tickLipSync(ls, dt)
          const root = professorRef.current
          if (root) applyMouthShape(root, ls)
        }
        try {
          renderer!.render(scene, camera)
        } catch {
          /* */
        }
      }
      animate()

      const ro = new ResizeObserver(() => {
        if (!renderer || disposed) return
        const w = host.clientWidth || 1
        const h = host.clientHeight || 1
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h, false)
      })
      ro.observe(host)

      return () => {
        disposed = true
        cancelAnimationFrame(raf)
        ro.disconnect()
        stopLipSync(lipSyncRef.current)
        window.speechSynthesis?.cancel()
        try {
          renderer?.dispose()
        } catch {
          /* */
        }
        if (renderer && host.contains(renderer.domElement)) host.removeChild(renderer.domElement)
      }
    } catch {
      setStatus('WebGL error')
      return () => {
        disposed = true
      }
    }
  }, [professorId, prof, pack?.total_duration_s])

  const start = useCallback(() => {
    clockRef.current = 0
    appliedRef.current = new Set()
    playingRef.current = true
    setPlaying(true)
    setT(0)
  }, [])

  const pause = useCallback(() => {
    playingRef.current = false
    setPlaying(false)
    window.speechSynthesis?.cancel()
    stopLipSync(lipSyncRef.current)
  }, [])

  const remaining = Math.max(0, Math.floor((pack?.total_duration_s || 58) - t))
  const month = agenda.find(m => m.professor_id === professorId)
  const tcaCtx = loadTcaContext()

  return (
    <ImmersiveErrorBoundary area="webgl">
      <div className="fixed inset-0 z-[60] bg-black text-white">
        <div ref={mountRef} className="absolute inset-0" data-xartists-3d="classroom" />
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 md:p-5">
          <header className="pointer-events-auto flex flex-wrap items-start justify-between gap-2">
            <div className="rounded-2xl border border-white/10 bg-black/45 backdrop-blur-md px-4 py-3 max-w-md">
              <p className="text-[10px] uppercase tracking-[0.22em] text-amber-200/80">TCA · Voice + hologram</p>
              <h1 className="text-base md:text-lg font-semibold">{pack?.title || 'Masterclass'}</h1>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {prof?.display_name || professorId}
                {prof?.epoch ? ` · ${prof.epoch}` : ''}
              </p>
              {month?.title ? <p className="text-[10px] text-zinc-500 mt-1">{month.title}</p> : null}
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="rounded-full border border-white/15 px-3 py-1 text-[10px] font-bold uppercase text-zinc-300">
                {status}
              </span>
              <span className="text-[10px] text-zinc-500 uppercase">{emotionLabel}</span>
              <Link to="/tca" className="text-[11px] text-cyan-300/80 underline">
                Exit
              </Link>
            </div>
          </header>
          <div className="flex flex-col items-center gap-3 pb-4">
            {subtitle ? (
              <p className="max-w-2xl text-center text-sm text-amber-50/95 bg-black/55 backdrop-blur-md border border-white/10 rounded-xl px-5 py-3">
                {subtitle}
              </p>
            ) : null}
            <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/10 bg-black/55 backdrop-blur-md px-4 py-2">
              {!playing ? (
                <button type="button" className="text-[12px] font-semibold text-amber-200" onClick={start}>
                  ▶ Start
                </button>
              ) : (
                <button type="button" className="text-[12px] font-semibold text-zinc-200" onClick={pause}>
                  ⏸ Pause
                </button>
              )}
              <span className="text-[11px] tabular-nums text-zinc-500">{remaining}s</span>
            </div>
          </div>
          <div className="pointer-events-auto absolute bottom-20 left-1/2 z-[80] w-[min(92vw,36rem)] -translate-x-1/2">
            <ImmersiveErrorBoundary area="rag">
              <MentorAskBar professorId={professorId} onCues={cues => { void cues }} />
            </ImmersiveErrorBoundary>
            {tcaCtx?.video_id ? (
              <p className="mt-1 text-center text-[10px] text-zinc-600">
                Context: {tcaCtx.lesson_id} · yt {tcaCtx.video_id}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </ImmersiveErrorBoundary>
  )
}
