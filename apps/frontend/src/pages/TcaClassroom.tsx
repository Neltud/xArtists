/**
 * TCA Cinematic Classroom — T1
 * Full-viewport Three.js atelier + glass HUD + beat player.
 * Reads public/data/tca cues — no trading side-effects.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import * as THREE from 'three'

type Cue = {
  timestamp: number
  type: 'TEXT' | 'ANIMATION' | 'CAMERA' | 'AUDIO' | 'EFFECT' | string
  payload: Record<string, unknown>
}

type CuePack = {
  ok?: boolean
  title?: string
  professor_id?: string
  total_duration_s?: number
  cues?: Cue[]
}

type Session = {
  event?: string
  active_slot?: { label?: string; id?: string } | null
  next_slot?: { label?: string; start_h?: number }
  access_default?: string
}

const BASE = `${import.meta.env.BASE_URL || '/'}data/tca/`
const FALLBACK = 'https://neltud.github.io/xArtists/data/tca/'

async function loadJson<T>(name: string): Promise<T | null> {
  for (const b of [BASE, FALLBACK]) {
    try {
      const r = await fetch(`${b}${name}`, { cache: 'no-store' })
      if (r.ok) return (await r.json()) as T
    } catch {
      /* */
    }
  }
  return null
}

function buildAtelier(scene: THREE.Scene) {
  // floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 14),
    new THREE.MeshStandardMaterial({ color: 0x1a1510, roughness: 0.85, metalness: 0.05 }),
  )
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  scene.add(floor)

  // back wall
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 6),
    new THREE.MeshStandardMaterial({ color: 0x2a2218, roughness: 0.9 }),
  )
  wall.position.set(0, 3, -4)
  scene.add(wall)

  // canvas frame (art focus)
  const canvas = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 2.0),
    new THREE.MeshStandardMaterial({ color: 0xc4a574, roughness: 0.7 }),
  )
  canvas.position.set(1.2, 1.6, -3.7)
  canvas.name = 'canvas'
  scene.add(canvas)

  // simple professor placeholder (capsule) until GLB
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.35, 1.1, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.6 }),
  )
  body.position.set(-0.6, 1.1, -1.2)
  body.castShadow = true
  body.name = 'professor'
  scene.add(body)

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xc4a882 }),
  )
  head.position.set(-0.6, 2.05, -1.2)
  head.name = 'professor_head'
  scene.add(head)

  // key light
  const key = new THREE.DirectionalLight(0xffe6c0, 1.4)
  key.position.set(3, 5, 2)
  key.castShadow = true
  scene.add(key)
  scene.add(new THREE.AmbientLight(0x3a342c, 0.45))
  const rim = new THREE.PointLight(0xd4a017, 0.6, 12)
  rim.position.set(-2, 2.5, 1)
  scene.add(rim)

  // dust particles
  const count = 400
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 10
    positions[i * 3 + 1] = Math.random() * 4
    positions[i * 3 + 2] = (Math.random() - 0.5) * 8
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const points = new THREE.Points(
    geo,
    new THREE.PointsMaterial({ color: 0xd4af37, size: 0.025, transparent: true, opacity: 0.55 }),
  )
  points.name = 'dust'
  scene.add(points)

  return { points, body, head }
}

export default function TcaClassroom() {
  const mountRef = useRef<HTMLDivElement>(null)
  const clockRef = useRef(0)
  const playingRef = useRef(false)
  const cuesRef = useRef<Cue[]>([])
  const appliedRef = useRef(new Set<string>())
  const camTargetRef = useRef(new THREE.Vector3(0, 1.4, 0))
  const camPosRef = useRef(new THREE.Vector3(0, 1.6, 3.2))

  const [pack, setPack] = useState<CuePack | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [playing, setPlaying] = useState(false)
  const [t, setT] = useState(0)
  const [subtitle, setSubtitle] = useState('')
  const [status, setStatus] = useState<'IDLE' | 'LIVE' | 'PLAYING' | 'ENDED'>('IDLE')

  useEffect(() => {
    let c = false
    ;(async () => {
      const [cues, sess] = await Promise.all([
        loadJson<CuePack>('cues_leo_w1_sfumato.json'),
        loadJson<Session>('sessions_today.json'),
      ])
      if (c) return
      if (cues?.cues) {
        setPack(cues)
        cuesRef.current = cues.cues
      } else {
        // minimal offline pack
        const offline: CuePack = {
          ok: true,
          title: 'Sfumato: smoke between light and dark',
          professor_id: 'leonardo',
          total_duration_s: 90,
          cues: [
            { timestamp: 0, type: 'TEXT', payload: { text: 'Welcome to the atelier. Sfumato is atmosphere, not blur.' } },
            { timestamp: 0, type: 'CAMERA', payload: { camera_pos: { x: 0, y: 1.8, z: 4.5 }, look_at: [0, 1.3, 0] } },
            { timestamp: 12, type: 'TEXT', payload: { text: 'Find three values on a cheek — not two.' } },
            { timestamp: 12, type: 'CAMERA', payload: { camera_pos: { x: -1, y: 1.5, z: 2.5 }, look_at: [1, 1.4, -1] } },
            { timestamp: 40, type: 'TEXT', payload: { text: 'Class dismissed. Practice without hard edges.' } },
          ],
        }
        setPack(offline)
        cuesRef.current = offline.cues || []
      }
      if (sess) setSession(sess)
      setStatus(sess?.active_slot ? 'LIVE' : 'IDLE')
    })()
    return () => {
      c = true
    }
  }, [])

  // Three scene
  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0c0a08)
    scene.fog = new THREE.Fog(0x0c0a08, 6, 16)

    const camera = new THREE.PerspectiveCamera(45, el.clientWidth / el.clientHeight, 0.1, 50)
    camera.position.copy(camPosRef.current)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(el.clientWidth, el.clientHeight)
    renderer.shadowMap.enabled = true
    el.appendChild(renderer.domElement)

    const { points, body } = buildAtelier(scene)

    let mouseX = 0
    let mouseY = 0
    const onMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('pointermove', onMove)

    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      // dust drift + mouse react
      const pos = points.geometry.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) + 0.002
        if (y > 4) y = 0
        pos.setY(i, y)
        pos.setX(i, pos.getX(i) + mouseX * 0.0003)
      }
      pos.needsUpdate = true

      // subtle professor sway
      body.rotation.y = Math.sin(performance.now() * 0.001) * 0.08

      // lerp camera
      camera.position.lerp(camPosRef.current, 0.04)
      const look = camTargetRef.current
      camera.lookAt(look.x + mouseX * 0.05, look.y - mouseY * 0.03, look.z)

      // beat clock
      if (playingRef.current) {
        clockRef.current += 1 / 60
        setT(clockRef.current)
        const cues = cuesRef.current
        for (const cue of cues) {
          const key = `${cue.timestamp}:${cue.type}:${JSON.stringify(cue.payload).slice(0, 40)}`
          if (clockRef.current >= cue.timestamp && !appliedRef.current.has(key)) {
            appliedRef.current.add(key)
            if (cue.type === 'TEXT') {
              setSubtitle(String(cue.payload.text || ''))
            }
            if (cue.type === 'CAMERA') {
              const p = cue.payload.camera_pos as { x: number; y: number; z: number } | undefined
              const la = cue.payload.look_at as number[] | undefined
              if (p) camPosRef.current.set(p.x, p.y, p.z)
              if (la && la.length >= 3) camTargetRef.current.set(la[0], la[1], la[2])
            }
          }
        }
        const dur = pack?.total_duration_s || 90
        if (clockRef.current >= dur) {
          playingRef.current = false
          setPlaying(false)
          setStatus('ENDED')
        }
      }

      renderer.render(scene, camera)
    }
    tick()

    const onResize = () => {
      if (!mountRef.current) return
      const w = mountRef.current.clientWidth
      const h = mountRef.current.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      el.removeChild(renderer.domElement)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const start = useCallback(() => {
    clockRef.current = 0
    appliedRef.current = new Set()
    playingRef.current = true
    setPlaying(true)
    setStatus('PLAYING')
    setSubtitle('')
  }, [])

  const pause = useCallback(() => {
    playingRef.current = false
    setPlaying(false)
  }, [])

  const remaining = useMemo(() => {
    const dur = pack?.total_duration_s || 90
    return Math.max(0, Math.floor(dur - t))
  }, [pack, t])

  return (
    <div className="fixed inset-0 z-[60] bg-black text-white">
      <div ref={mountRef} className="absolute inset-0" />

      {/* Glass HUD */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 md:p-6">
        <header className="pointer-events-auto flex flex-wrap items-start justify-between gap-3">
          <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md px-4 py-3 max-w-lg">
            <p className="text-[10px] uppercase tracking-[0.25em] text-amber-200/80">TCA · Atelier</p>
            <h1 className="text-lg md:text-xl font-semibold text-white">
              {pack?.title || 'Leonardo Masterclass'}
            </h1>
            <p className="text-[11px] text-zinc-400 mt-1">
              {pack?.professor_id || 'leonardo'} · {session?.access_default || 'public'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                status === 'PLAYING' || status === 'LIVE'
                  ? 'border-emerald-500/40 text-emerald-300'
                  : status === 'ENDED'
                    ? 'border-zinc-500/40 text-zinc-400'
                    : 'border-white/15 text-zinc-300'
              }`}
            >
              {status}
            </span>
            <Link
              to="/lia"
              className="pointer-events-auto rounded-full border border-white/15 bg-black/50 px-3 py-1 text-[11px] text-zinc-300 hover:text-white"
            >
              Exit → LIA
            </Link>
          </div>
        </header>

        <div className="flex flex-col items-center gap-3">
          {subtitle && (
            <p className="max-w-2xl text-center text-sm md:text-base text-amber-50/95 bg-black/50 backdrop-blur-md border border-white/10 rounded-xl px-5 py-3 leading-relaxed">
              {subtitle}
            </p>
          )}
          <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/10 bg-black/50 backdrop-blur-md px-4 py-2">
            {!playing ? (
              <button type="button" onClick={start} className="text-[12px] font-semibold text-amber-200">
                ▶ Start lesson
              </button>
            ) : (
              <button type="button" onClick={pause} className="text-[12px] font-semibold text-zinc-200">
                ⏸ Pause
              </button>
            )}
            <span className="text-[11px] tabular-nums text-zinc-400">{remaining}s</span>
            {session?.next_slot && (
              <span className="text-[10px] text-zinc-500 hidden sm:inline">
                Next slot {session.next_slot.start_h}:00 Paris
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
