/**
 * TCA Classroom T2 — projection board, dim lights, TTS, multi-professor agenda.
 * GLB ready when /models/tca/{id}.glb exists; procedural professor until then.
 * No trading / ledger side-effects.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

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

type Professor = {
  id: string
  display_name?: string
  epoch?: string
  perspective?: string
  room?: { board?: string; ambient?: number }
}

type AgendaMonth = {
  id: string
  title: string
  professor_id: string
  weeks: { week: number; theme: string; lesson_id: string }[]
}

const BASE = `${import.meta.env.BASE_URL || '/'}data/tca/`
const FALLBACK = 'https://neltud.github.io/xArtists/data/tca/'
const MODEL_BASE = `${import.meta.env.BASE_URL || '/'}models/tca/`

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

function speak(text: string, lang = 'en') {
  try {
    window.speechSynthesis?.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang.startsWith('it') ? 'it-IT' : lang.startsWith('fr') ? 'fr-FR' : lang.startsWith('ru') ? 'ru-RU' : lang.startsWith('nl') ? 'nl-NL' : 'en-GB'
    u.rate = 0.92
    window.speechSynthesis?.speak(u)
  } catch {
    /* */
  }
}

function makeProceduralProfessor(): THREE.Group {
  const g = new THREE.Group()
  g.name = 'professor'
  const robe = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.38, 1.15, 6, 12),
    new THREE.MeshStandardMaterial({ color: 0x5c4a32, roughness: 0.75 }),
  )
  robe.position.y = 1.05
  robe.castShadow = true
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 20, 20),
    new THREE.MeshStandardMaterial({ color: 0xc9a882, roughness: 0.55 }),
  )
  head.position.y = 2.0
  head.name = 'head'
  const jaw = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.06, 0.12),
    new THREE.MeshStandardMaterial({ color: 0xb08968 }),
  )
  jaw.position.set(0, 1.82, 0.22)
  jaw.name = 'jaw'
  g.add(robe, head, jaw)
  g.position.set(-0.7, 0, -1.0)
  return g
}

function makeProjectionTexture(title: string): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 1280
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#0a0a0a'
  ctx.fillRect(0, 0, c.width, c.height)
  // soft vignette art plate
  const grd = ctx.createRadialGradient(512, 560, 80, 512, 600, 520)
  grd.addColorStop(0, '#c4a574')
  grd.addColorStop(0.45, '#6b5344')
  grd.addColorStop(1, '#1a1210')
  ctx.fillStyle = grd
  ctx.fillRect(80, 120, 864, 980)
  ctx.strokeStyle = '#d4af37'
  ctx.lineWidth = 6
  ctx.strokeRect(80, 120, 864, 980)
  ctx.fillStyle = '#f5e6c8'
  ctx.font = '600 42px Georgia, serif'
  ctx.textAlign = 'center'
  const lines = title.length > 42 ? [title.slice(0, 40) + '…'] : [title]
  ctx.fillText(lines[0], 512, 160)
  ctx.font = '28px Georgia, serif'
  ctx.fillStyle = '#b8a990'
  ctx.fillText('TCA · projected study plate', 512, 1180)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export default function TcaClassroom() {
  const mountRef = useRef<HTMLDivElement>(null)
  const clockRef = useRef(0)
  const playingRef = useRef(false)
  const cuesRef = useRef<Cue[]>([])
  const appliedRef = useRef(new Set<string>())
  const camPosRef = useRef(new THREE.Vector3(0, 1.7, 4.2))
  const camLookRef = useRef(new THREE.Vector3(0, 1.3, -1))
  const ambientRef = useRef<THREE.AmbientLight | null>(null)
  const keyRef = useRef<THREE.DirectionalLight | null>(null)
  const boardMatRef = useRef<THREE.MeshStandardMaterial | null>(null)
  const jawRef = useRef<THREE.Object3D | null>(null)
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const actionsRef = useRef<Record<string, THREE.AnimationAction>>({})
  const targetAmbient = useRef(0.4)
  const projectOn = useRef(false)

  const [pack, setPack] = useState<CuePack | null>(null)
  const [professors, setProfessors] = useState<Professor[]>([])
  const [agenda, setAgenda] = useState<AgendaMonth[]>([])
  const [professorId, setProfessorId] = useState('leonardo')
  const [playing, setPlaying] = useState(false)
  const [t, setT] = useState(0)
  const [subtitle, setSubtitle] = useState('')
  const [status, setStatus] = useState<'IDLE' | 'PLAYING' | 'PROJECTING' | 'ENDED'>('IDLE')
  const [analysisNote, setAnalysisNote] = useState('')

  const prof = useMemo(
    () => professors.find(p => p.id === professorId) || professors[0],
    [professors, professorId],
  )

  useEffect(() => {
    let c = false
    ;(async () => {
      const [cues, profs, ag] = await Promise.all([
        loadJson<CuePack>('cues_leo_w1_sfumato.json'),
        loadJson<{ professors: Professor[] }>('professors.json'),
        loadJson<{ months: AgendaMonth[] }>('agenda_season.json'),
      ])
      if (c) return
      if (profs?.professors) setProfessors(profs.professors)
      if (ag?.months) setAgenda(ag.months)
      if (cues?.cues?.length) {
        setPack(cues)
        cuesRef.current = cues.cues
        if (cues.professor_id) setProfessorId(cues.professor_id)
      } else {
        const offline: CuePack = {
          title: 'Sfumato — first projection',
          professor_id: 'leonardo',
          total_duration_s: 55,
          cues: [
            { timestamp: 0, type: 'TEXT', payload: { text: 'Welcome to my atelier.' } },
            { timestamp: 0, type: 'ANIMATION', payload: { animation_name: 'Idle' } },
            { timestamp: 5, type: 'CAMERA', payload: { camera_pos: { x: -0.2, y: 1.75, z: 2.4 }, look_at: [-0.6, 1.9, -1] } },
            { timestamp: 6, type: 'TEXT', payload: { text: 'Tonight we study sfumato — smoke between light and form.' } },
            { timestamp: 6, type: 'AUDIO', payload: { text: 'Tonight we study sfumato — smoke between light and form.' } },
            { timestamp: 6, type: 'ANIMATION', payload: { animation_name: 'Explain' } },
            { timestamp: 12, type: 'LIGHTS', payload: { ambient: 0.12, dim: true } },
            { timestamp: 13, type: 'PROJECT', payload: { on: true, title: 'Sfumato study plate', analysis: 'Process · Renaissance optics · soft edge' } },
            { timestamp: 14, type: 'CAMERA', payload: { camera_pos: { x: 0.9, y: 1.55, z: 2.0 }, look_at: [1.15, 1.55, -3.5] } },
            { timestamp: 28, type: 'TEXT', payload: { text: 'Notice: no hard contour — value does the drawing.' } },
            { timestamp: 28, type: 'AUDIO', payload: { text: 'Notice: no hard contour — value does the drawing.' } },
            { timestamp: 42, type: 'PROJECT', payload: { on: false } },
            { timestamp: 43, type: 'LIGHTS', payload: { ambient: 0.4, dim: false } },
            { timestamp: 45, type: 'TEXT', payload: { text: 'Practice without a hard line. Class dismissed.' } },
            { timestamp: 45, type: 'CAMERA', payload: { camera_pos: { x: 0, y: 1.7, z: 4.2 }, look_at: [0, 1.3, -1] } },
          ],
        }
        setPack(offline)
        cuesRef.current = offline.cues || []
      }
    })()
    return () => {
      c = true
    }
  }, [])

  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0806)
    scene.fog = new THREE.FogExp2(0x0a0806, 0.06)

    const camera = new THREE.PerspectiveCamera(42, el.clientWidth / el.clientHeight, 0.1, 60)
    camera.position.copy(camPosRef.current)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.setSize(el.clientWidth, el.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.outputColorSpace = THREE.SRGBColorSpace
    el.appendChild(renderer.domElement)

    // Room
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 16),
      new THREE.MeshStandardMaterial({ color: 0x1c1610, roughness: 0.9 }),
    )
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    scene.add(floor)

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x2a221a, roughness: 0.95 })
    const back = new THREE.Mesh(new THREE.PlaneGeometry(16, 7), wallMat)
    back.position.set(0, 3.2, -4.2)
    scene.add(back)

    // Projection board
    const boardColor = prof?.room?.board === 'dark' ? 0x0e0e0e : 0xf2efe6
    const boardMat = new THREE.MeshStandardMaterial({
      color: boardColor,
      roughness: 0.55,
      metalness: 0.05,
      emissive: new THREE.Color(0x000000),
      emissiveIntensity: 0,
    })
    boardMatRef.current = boardMat
    const board = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.8), boardMat)
    board.position.set(1.15, 1.7, -3.95)
    board.name = 'board'
    scene.add(board)

    // Lights
    const ambient = new THREE.AmbientLight(0x3d342c, prof?.room?.ambient ?? 0.4)
    ambientRef.current = ambient
    targetAmbient.current = prof?.room?.ambient ?? 0.4
    scene.add(ambient)
    const key = new THREE.DirectionalLight(0xffe6c8, 1.25)
    key.position.set(3.5, 5.5, 2.5)
    key.castShadow = true
    keyRef.current = key
    scene.add(key)
    const fill = new THREE.PointLight(0x886644, 0.35, 14)
    fill.position.set(-2.5, 2.2, 1)
    scene.add(fill)

    // Dust
    const n = 350
    const pos = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12
      pos[i * 3 + 1] = Math.random() * 4.5
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8
    }
    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const dust = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({ color: 0xd4af37, size: 0.022, transparent: true, opacity: 0.5 }),
    )
    scene.add(dust)

    // Professor: try GLB then procedural
    let professorRoot: THREE.Object3D = makeProceduralProfessor()
    scene.add(professorRoot)
    jawRef.current = professorRoot.getObjectByName('jaw') || null

    const loader = new GLTFLoader()
    const glbUrl = `${MODEL_BASE}${professorId}.glb`
    loader.load(
      glbUrl,
      gltf => {
        scene.remove(professorRoot)
        professorRoot = gltf.scene
        professorRoot.position.set(-0.7, 0, -1.0)
        professorRoot.traverse(o => {
          if ((o as THREE.Mesh).isMesh) {
            o.castShadow = true
          }
        })
        scene.add(professorRoot)
        if (gltf.animations?.length) {
          const mixer = new THREE.AnimationMixer(professorRoot)
          mixerRef.current = mixer
          const map: Record<string, THREE.AnimationAction> = {}
          for (const clip of gltf.animations) {
            map[clip.name] = mixer.clipAction(clip)
          }
          actionsRef.current = map
          const idle = map.Idle || Object.values(map)[0]
          idle?.reset().fadeIn(0.3).play()
        }
      },
      undefined,
      () => {
        /* keep procedural */
      },
    )

    let mx = 0
    let my = 0
    const onMove = (e: PointerEvent) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2
      my = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('pointermove', onMove)

    const clock = new THREE.Clock()
    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const dt = clock.getDelta()
      mixerRef.current?.update(dt)

      // dust
      const attr = dust.geometry.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < attr.count; i++) {
        let y = attr.getY(i) + 0.0018
        if (y > 4.5) y = 0
        attr.setY(i, y)
        attr.setX(i, attr.getX(i) + mx * 0.00025)
      }
      attr.needsUpdate = true

      // ambient lerp (dim for projection)
      if (ambientRef.current) {
        ambientRef.current.intensity += (targetAmbient.current - ambientRef.current.intensity) * 0.04
      }
      if (keyRef.current) {
        const want = projectOn.current ? 0.35 : 1.25
        keyRef.current.intensity += (want - keyRef.current.intensity) * 0.04
      }

      // lip approx
      if (jawRef.current && window.speechSynthesis?.speaking) {
        jawRef.current.position.y = 1.82 + Math.sin(performance.now() * 0.03) * 0.012
      }

      // camera smooth
      camera.position.lerp(camPosRef.current, 0.035)
      const look = camLookRef.current.clone()
      look.x += mx * 0.04
      look.y -= my * 0.025
      camera.lookAt(look)

      if (playingRef.current) {
        clockRef.current += dt
        setT(clockRef.current)
        for (const cue of cuesRef.current) {
          const key = `${cue.timestamp}|${cue.type}|${String(cue.payload.text || cue.payload.animation_name || cue.payload.on || '')}`
          if (clockRef.current >= cue.timestamp && !appliedRef.current.has(key)) {
            appliedRef.current.add(key)
            applyCue(cue)
          }
        }
        const dur = pack?.total_duration_s || 55
        if (clockRef.current >= dur) {
          playingRef.current = false
          setPlaying(false)
          setStatus('ENDED')
          window.speechSynthesis?.cancel()
        }
      }

      renderer.render(scene, camera)
    }

    const applyCue = (cue: Cue) => {
      if (cue.type === 'TEXT') {
        setSubtitle(String(cue.payload.text || ''))
      }
      if (cue.type === 'AUDIO') {
        speak(String(cue.payload.text || ''), String(cue.payload.locale || 'en'))
      }
      if (cue.type === 'CAMERA') {
        const p = cue.payload.camera_pos as { x: number; y: number; z: number } | undefined
        const la = cue.payload.look_at as number[] | undefined
        if (p) camPosRef.current.set(p.x, p.y, p.z)
        if (la && la.length >= 3) camLookRef.current.set(la[0], la[1], la[2])
      }
      if (cue.type === 'ANIMATION') {
        const name = String(cue.payload.animation_name || 'Idle')
        const acts = actionsRef.current
        if (Object.keys(acts).length) {
          Object.values(acts).forEach(a => a.fadeOut(0.25))
          const next = acts[name] || acts.Idle || Object.values(acts)[0]
          next?.reset().fadeIn(0.25).play()
        }
      }
      if (cue.type === 'LIGHTS') {
        const a = Number(cue.payload.ambient)
        if (!Number.isNaN(a)) targetAmbient.current = a
        if (cue.payload.dim) setStatus('PROJECTING')
      }
      if (cue.type === 'PROJECT') {
        const on = Boolean(cue.payload.on)
        projectOn.current = on
        if (boardMatRef.current) {
          if (on) {
            const title = String(cue.payload.title || pack?.title || 'Study')
            const tex = makeProjectionTexture(title)
            boardMatRef.current.map = tex
            boardMatRef.current.emissive = new THREE.Color(0x222218)
            boardMatRef.current.emissiveIntensity = 0.35
            boardMatRef.current.needsUpdate = true
            setAnalysisNote(String(cue.payload.analysis || ''))
            setStatus('PROJECTING')
          } else {
            boardMatRef.current.map = null
            boardMatRef.current.emissiveIntensity = 0
            boardMatRef.current.needsUpdate = true
            setAnalysisNote('')
          }
        }
      }
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
      window.speechSynthesis?.cancel()
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professorId])

  const start = useCallback(() => {
    clockRef.current = 0
    appliedRef.current = new Set()
    playingRef.current = true
    setPlaying(true)
    setStatus('PLAYING')
    setSubtitle('')
    setAnalysisNote('')
    projectOn.current = false
    targetAmbient.current = prof?.room?.ambient ?? 0.4
  }, [prof])

  const pause = useCallback(() => {
    playingRef.current = false
    setPlaying(false)
    window.speechSynthesis?.cancel()
  }, [])

  const remaining = Math.max(0, Math.floor((pack?.total_duration_s || 55) - t))
  const month = agenda.find(m => m.professor_id === professorId)

  return (
    <div className="fixed inset-0 z-[60] bg-black text-white">
      <div ref={mountRef} className="absolute inset-0" />

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 md:p-5">
        <header className="pointer-events-auto flex flex-wrap items-start justify-between gap-2">
          <div className="rounded-2xl border border-white/10 bg-black/45 backdrop-blur-md px-4 py-3 max-w-md">
            <p className="text-[10px] uppercase tracking-[0.22em] text-amber-200/80">TCA · Cinematic class</p>
            <h1 className="text-base md:text-lg font-semibold">{pack?.title || 'Masterclass'}</h1>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {prof?.display_name || professorId}
              {prof?.epoch ? ` · ${prof.epoch}` : ''}
            </p>
            {prof?.perspective && (
              <p className="text-[10px] text-zinc-500 mt-1 italic">{prof.perspective}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase ${
                status === 'PROJECTING'
                  ? 'border-amber-400/50 text-amber-200'
                  : status === 'PLAYING'
                    ? 'border-emerald-500/40 text-emerald-300'
                    : 'border-white/15 text-zinc-400'
              }`}
            >
              {status}
            </span>
            <select
              className="pointer-events-auto rounded-lg border border-white/15 bg-black/60 text-[11px] px-2 py-1"
              value={professorId}
              onChange={e => setProfessorId(e.target.value)}
            >
              {professors.map(p => (
                <option key={p.id} value={p.id}>
                  {p.display_name || p.id}
                </option>
              ))}
            </select>
            <Link to="/lia" className="text-[11px] text-zinc-400 hover:text-white underline">
              Exit → LIA
            </Link>
          </div>
        </header>

        {/* Agenda rail */}
        {month && (
          <div className="pointer-events-auto absolute left-3 top-1/2 -translate-y-1/2 hidden lg:block w-44">
            <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-md p-3 space-y-2">
              <p className="text-[9px] uppercase tracking-wider text-zinc-500">Agenda</p>
              <p className="text-[11px] text-amber-100/90 font-medium leading-snug">{month.title}</p>
              <ul className="space-y-1.5">
                {month.weeks.map(w => (
                  <li key={w.week} className="text-[10px] text-zinc-400">
                    <span className="text-zinc-600">W{w.week}</span> {w.theme}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center gap-2 mb-2">
          {analysisNote && (
            <p className="text-[11px] text-amber-200/90 bg-black/50 border border-amber-500/20 rounded-lg px-3 py-1.5">
              Analysis · {analysisNote}
            </p>
          )}
          {subtitle && (
            <p className="max-w-2xl text-center text-sm md:text-[15px] text-amber-50/95 bg-black/55 backdrop-blur-md border border-white/10 rounded-xl px-5 py-3 leading-relaxed">
              {subtitle}
            </p>
          )}
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
      </div>
    </div>
  )
}
