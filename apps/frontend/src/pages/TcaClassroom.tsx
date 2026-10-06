/**
 * TCA Classroom — T2/T3 graft:
 * hologram material · prosody TTS · micro-movement · EMOTION cues
 * No trading side-effects.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { applyProsody, createHologramMaterial } from '../components/tca/hologramMaterial'

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
  hologram_settings?: HoloSettings
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

function emotionSpeechMod(
  base: SpeechStyle | undefined,
  emotion: string,
): { pitch: number; rate: number } {
  let pitch = base?.pitch ?? 1
  let rate = base?.speed_multiplier ?? 1
  if (emotion === 'dramatic') {
    pitch *= 0.94
    rate *= 0.92
  } else if (emotion === 'curious') {
    pitch *= 1.06
    rate *= 1.02
  } else if (emotion === 'authoritative') {
    pitch *= 0.97
    rate *= 0.88
  } else if (emotion === 'thinking') {
    rate *= 0.85
  }
  return { pitch, rate }
}

function speakWithSoul(
  text: string,
  lang: string,
  speech: SpeechStyle | undefined,
  emotion: string,
) {
  try {
    window.speechSynthesis?.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang.startsWith('it')
      ? 'it-IT'
      : lang.startsWith('fr')
        ? 'fr-FR'
        : lang.startsWith('ru')
          ? 'ru-RU'
          : lang.startsWith('nl')
            ? 'nl-NL'
            : 'en-GB'
    const mod = emotionSpeechMod(speech, emotion)
    applyProsody(u, { pitch: mod.pitch, rate: mod.rate })
    window.speechSynthesis?.speak(u)
  } catch {
    /* */
  }
}

function makeProceduralProfessor(holo: THREE.ShaderMaterial): THREE.Group {
  const g = new THREE.Group()
  g.name = 'professor'
  const robe = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 1.15, 6, 12), holo)
  robe.position.y = 1.05
  robe.castShadow = false
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 20), holo.clone())
  head.position.y = 2.0
  head.name = 'head'
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.12), holo.clone())
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
  ctx.fillText(title.length > 42 ? title.slice(0, 40) + '…' : title, 512, 160)
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
  const professorRef = useRef<THREE.Object3D | null>(null)
  const holoMatsRef = useRef<THREE.ShaderMaterial[]>([])
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const actionsRef = useRef<Record<string, THREE.AnimationAction>>({})
  const targetAmbient = useRef(0.4)
  const projectOn = useRef(false)
  const emotionRef = useRef('calm')
  const gestureAmpRef = useRef(1)
  const gazeModeRef = useRef('user_camera')
  const speechStyleRef = useRef<SpeechStyle | undefined>(undefined)
  const headTiltRef = useRef(0.08)

  const [pack, setPack] = useState<CuePack | null>(null)
  const [professors, setProfessors] = useState<Professor[]>([])
  const [agenda, setAgenda] = useState<AgendaMonth[]>([])
  const [professorId, setProfessorId] = useState('leonardo')
  const [playing, setPlaying] = useState(false)
  const [t, setT] = useState(0)
  const [subtitle, setSubtitle] = useState('')
  const [status, setStatus] = useState<'IDLE' | 'PLAYING' | 'PROJECTING' | 'ENDED'>('IDLE')
  const [analysisNote, setAnalysisNote] = useState('')
  const [emotionLabel, setEmotionLabel] = useState('calm')

  const prof = useMemo(
    () => professors.find(p => p.id === professorId) || professors[0],
    [professors, professorId],
  )

  useEffect(() => {
    speechStyleRef.current = prof?.personality?.speech_style
    headTiltRef.current = prof?.personality?.look_style?.head_tilt_angle ?? 0.08
    const gi = prof?.personality?.gesture_style?.intensity ?? 0.55
    gestureAmpRef.current = 0.6 + gi
  }, [prof])

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
          title: 'Sfumato — holographic mentor',
          professor_id: 'leonardo',
          total_duration_s: 58,
          cues: [
            { timestamp: 0, type: 'EMOTION', payload: { emotion: 'calm' } },
            { timestamp: 0, type: 'GAZE_TARGET', payload: { target: 'user_camera' } },
            { timestamp: 0, type: 'MICRO_MOVEMENT', payload: { breathing: true, blink: true } },
            { timestamp: 0, type: 'TEXT', payload: { text: 'Welcome to my atelier.' } },
            { timestamp: 0, type: 'AUDIO', payload: { text: 'Welcome to my atelier.' } },
            { timestamp: 0, type: 'ANIMATION', payload: { animation_name: 'Idle' } },
            { timestamp: 5, type: 'CAMERA', payload: { camera_pos: { x: -0.2, y: 1.75, z: 2.4 }, look_at: [-0.6, 1.9, -1] } },
            { timestamp: 6, type: 'EMOTION', payload: { emotion: 'curious' } },
            {
              timestamp: 6,
              type: 'TEXT',
              payload: { text: 'Tonight we study sfumato — smoke between light and form.' },
            },
            {
              timestamp: 6,
              type: 'AUDIO',
              payload: { text: 'Tonight we study sfumato — smoke between light and form.' },
            },
            { timestamp: 6, type: 'ANIMATION', payload: { animation_name: 'Explain' } },
            { timestamp: 12, type: 'LIGHTS', payload: { ambient: 0.12, dim: true } },
            {
              timestamp: 13,
              type: 'PROJECT',
              payload: {
                on: true,
                title: 'Sfumato study plate',
                analysis: 'Process · Renaissance optics · soft edge',
              },
            },
            { timestamp: 13, type: 'GAZE_TARGET', payload: { target: 'board' } },
            { timestamp: 14, type: 'EMOTION', payload: { emotion: 'thinking' } },
            {
              timestamp: 14,
              type: 'CAMERA',
              payload: { camera_pos: { x: 0.9, y: 1.55, z: 2.0 }, look_at: [1.15, 1.55, -3.5] },
            },
            {
              timestamp: 28,
              type: 'TEXT',
              payload: { text: 'Notice: no hard contour — value does the drawing.' },
            },
            {
              timestamp: 28,
              type: 'AUDIO',
              payload: { text: 'Notice: no hard contour — value does the drawing.' },
            },
            { timestamp: 42, type: 'PROJECT', payload: { on: false } },
            { timestamp: 43, type: 'LIGHTS', payload: { ambient: 0.4, dim: false } },
            { timestamp: 43, type: 'GAZE_TARGET', payload: { target: 'user_camera' } },
            { timestamp: 44, type: 'EMOTION', payload: { emotion: 'calm' } },
            {
              timestamp: 45,
              type: 'TEXT',
              payload: { text: 'Practice without a hard line. Class dismissed.' },
            },
            {
              timestamp: 45,
              type: 'AUDIO',
              payload: { text: 'Practice without a hard line. Class dismissed.' },
            },
            {
              timestamp: 45,
              type: 'CAMERA',
              payload: { camera_pos: { x: 0, y: 1.7, z: 4.2 }, look_at: [0, 1.3, -1] },
            },
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

    const holoParams: HoloSettings = {
      ...(prof?.hologram_settings || {}),
      glow_color:
        prof?.hologram_settings?.glow_color ||
        prof?.personality?.color_palette?.primary_glow ||
        '#e0c097',
    }
    const holoMat = createHologramMaterial(holoParams)
    holoMatsRef.current = [holoMat]

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

    // soft hologram rim light from palette
    const glowHex = holoParams.glow_color || '#e0c097'
    const rim = new THREE.PointLight(new THREE.Color(glowHex), 0.55, 10)
    rim.position.set(-0.7, 2.2, 0.2)
    scene.add(rim)

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

    let professorRoot: THREE.Object3D = makeProceduralProfessor(holoMat)
    professorRef.current = professorRoot
    scene.add(professorRoot)
    jawRef.current = professorRoot.getObjectByName('jaw') || null

    const loader = new GLTFLoader()
    loader.load(
      `${MODEL_BASE}${professorId}.glb`,
      gltf => {
        scene.remove(professorRoot)
        professorRoot = gltf.scene
        professorRoot.position.set(-0.7, 0, -1.0)
        const mats: THREE.ShaderMaterial[] = []
        professorRoot.traverse(o => {
          const mesh = o as THREE.Mesh
          if (mesh.isMesh) {
            const hm = createHologramMaterial(holoParams)
            mats.push(hm)
            mesh.material = hm
            mesh.castShadow = false
          }
        })
        holoMatsRef.current = mats.length ? mats : [holoMat]
        scene.add(professorRoot)
        professorRef.current = professorRoot
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
        /* procedural hologram kept */
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

    const applyCue = (cue: Cue) => {
      if (cue.type === 'TEXT') {
        setSubtitle(String(cue.payload.text || ''))
      }
      if (cue.type === 'AUDIO') {
        speakWithSoul(
          String(cue.payload.text || ''),
          String(cue.payload.locale || 'en'),
          speechStyleRef.current,
          emotionRef.current,
        )
      }
      if (cue.type === 'EMOTION') {
        const em = String(cue.payload.emotion || 'calm')
        emotionRef.current = em
        setEmotionLabel(em)
        const base = prof?.personality?.gesture_style?.intensity ?? 0.55
        if (em === 'dramatic' || em === 'authoritative') gestureAmpRef.current = 0.9 + base
        else if (em === 'curious') gestureAmpRef.current = 0.75 + base * 0.5
        else if (em === 'thinking') gestureAmpRef.current = 0.35 + base * 0.3
        else gestureAmpRef.current = 0.55 + base * 0.4
      }
      if (cue.type === 'GAZE_TARGET') {
        gazeModeRef.current = String(cue.payload.target || 'user_camera')
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
          next && (next.setEffectiveWeight(gestureAmpRef.current))
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
            boardMatRef.current.map = makeProjectionTexture(title)
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

    const tick = () => {
      raf = requestAnimationFrame(tick)
      const dt = clock.getDelta()
      const elapsed = clock.elapsedTime
      mixerRef.current?.update(dt)

      // hologram time uniforms
      for (const m of holoMatsRef.current) {
        if (m.uniforms?.uTime) m.uniforms.uTime.value = elapsed
      }

      // dust
      const attr = dust.geometry.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < attr.count; i++) {
        let y = attr.getY(i) + 0.0018
        if (y > 4.5) y = 0
        attr.setY(i, y)
        attr.setX(i, attr.getX(i) + mx * 0.00025)
      }
      attr.needsUpdate = true

      if (ambientRef.current) {
        ambientRef.current.intensity += (targetAmbient.current - ambientRef.current.intensity) * 0.04
      }
      if (keyRef.current) {
        const want = projectOn.current ? 0.35 : 1.25
        keyRef.current.intensity += (want - keyRef.current.intensity) * 0.04
      }

      // --- micro-movement always (alive ghost) ---
      const root = professorRef.current
      if (root) {
        const amp = gestureAmpRef.current
        const breath = Math.sin(elapsed * 1.4) * 0.012 * amp
        root.position.y = breath
        const tilt = headTiltRef.current
        root.rotation.y = Math.sin(elapsed * 0.35) * 0.06 * amp
        root.rotation.z = Math.sin(elapsed * 0.5) * tilt * 0.5
        // gaze bias
        if (gazeModeRef.current === 'board') {
          root.rotation.y += 0.25
        } else if (gazeModeRef.current === 'art_object') {
          root.rotation.y += 0.15
        } else if (gazeModeRef.current === 'abstract_point') {
          root.rotation.y += Math.sin(elapsed * 0.2) * 0.2
        }
      }
      if (jawRef.current && window.speechSynthesis?.speaking) {
        jawRef.current.position.y = 1.82 + Math.sin(elapsed * 28) * 0.014
      }

      camera.position.lerp(camPosRef.current, 0.035)
      const look = camLookRef.current.clone()
      look.x += mx * 0.04
      look.y -= my * 0.025
      camera.lookAt(look)

      if (playingRef.current) {
        clockRef.current += dt
        setT(clockRef.current)
        for (const cue of cuesRef.current) {
          const key = `${cue.timestamp}|${cue.type}|${String(
            cue.payload.text || cue.payload.emotion || cue.payload.animation_name || cue.payload.on || '',
          )}`
          if (clockRef.current >= cue.timestamp && !appliedRef.current.has(key)) {
            appliedRef.current.add(key)
            applyCue(cue)
          }
        }
        const dur = pack?.total_duration_s || 58
        if (clockRef.current >= dur) {
          playingRef.current = false
          setPlaying(false)
          setStatus('ENDED')
          window.speechSynthesis?.cancel()
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
      window.speechSynthesis?.cancel()
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professorId, prof])

  const start = useCallback(() => {
    clockRef.current = 0
    appliedRef.current = new Set()
    playingRef.current = true
    setPlaying(true)
    setStatus('PLAYING')
    setSubtitle('')
    setAnalysisNote('')
    projectOn.current = false
    emotionRef.current = 'calm'
    setEmotionLabel('calm')
    targetAmbient.current = prof?.room?.ambient ?? 0.4
  }, [prof])

  const pause = useCallback(() => {
    playingRef.current = false
    setPlaying(false)
    window.speechSynthesis?.cancel()
  }, [])

  const remaining = Math.max(0, Math.floor((pack?.total_duration_s || 58) - t))
  const month = agenda.find(m => m.professor_id === professorId)

  return (
    <div className="fixed inset-0 z-[60] bg-black text-white">
      <div ref={mountRef} className="absolute inset-0" />

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 md:p-5">
        <header className="pointer-events-auto flex flex-wrap items-start justify-between gap-2">
          <div className="rounded-2xl border border-white/10 bg-black/45 backdrop-blur-md px-4 py-3 max-w-md">
            <p className="text-[10px] uppercase tracking-[0.22em] text-amber-200/80">
              TCA · Holographic mentor
            </p>
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
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{emotionLabel}</span>
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
