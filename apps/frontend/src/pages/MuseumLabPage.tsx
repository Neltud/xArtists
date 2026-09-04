/**
 * LAB ONLY — multiplayer presence overlay (Three.js, no R3F required).
 * Route: /museum/lab?museum=louvre
 * Full R3F MultiplayerScene activates if @react-three/fiber is installed + VITE_MULTIPLAYER_URL.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import * as THREE from 'three'
import { multiplayerEnabled } from '../lab/museum/MultiplayerScene'
import { builtinBlueprintForMuseum } from '../lib/builtinBlueprints'
import { pointInBlueprintFloor } from '../lib/loadBlueprint'
import type { RoomBlueprint } from '../lib/roomBlueprint'

const EYE = 1.62
const WALK = 3.0

export default function MuseumLabPage() {
  const [params] = useSearchParams()
  const museumId = params.get('museum') || 'xartists'
  const blueprint = useMemo(() => builtinBlueprintForMuseum(museumId), [museumId])
  const mountRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState('Init lab…')
  const mp = multiplayerEnabled()

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    let disposed = false

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity
    for (const w of blueprint.walls) {
      minX = Math.min(minX, w.x1, w.x2)
      minY = Math.min(minY, w.y1, w.y2)
      maxX = Math.max(maxX, w.x1, w.x2)
      maxY = Math.max(maxY, w.y1, w.y2)
    }
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2
    const wallH = blueprint.wallHeight || 4

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a12)
    scene.fog = new THREE.FogExp2(0x0a0a12, 0.028)
    const camera = new THREE.PerspectiveCamera(75, 1, 0.05, 80)
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
    mount.appendChild(renderer.domElement)
    const canvas = renderer.domElement
    canvas.style.cssText = 'display:block;width:100%;height:100%'

    scene.add(new THREE.AmbientLight(0xfff5eb, 0.35))
    const pl = new THREE.PointLight(0xffe8d0, 1.2, 40)
    pl.position.set(cx, wallH - 0.5, cy)
    scene.add(pl)

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(maxX - minX + 2, maxY - minY + 2),
      new THREE.MeshStandardMaterial({ color: 0x1a1512, roughness: 0.9 })
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.set(cx, 0, cy)
    scene.add(floor)

    for (const w of blueprint.walls.slice(0, 12)) {
      const len = Math.hypot(w.x2 - w.x1, w.y2 - w.y1) || 0.01
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(len, wallH, 0.28),
        new THREE.MeshStandardMaterial({ color: 0x2a2420, roughness: 0.85 })
      )
      mesh.position.set((w.x1 + w.x2) / 2, wallH / 2, (w.y1 + w.y2) / 2)
      mesh.rotation.y = -Math.atan2(w.y2 - w.y1, w.x2 - w.x1)
      scene.add(mesh)
    }

    // Local avatar marker (lab)
    const me = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x0e7490, emissiveIntensity: 0.5 })
    )
    scene.add(me)

    let px = cx,
      pz = cy,
      yaw = 0
    camera.position.set(px, EYE, pz)
    const keys: Record<string, boolean> = {}

    const onKey = (e: KeyboardEvent, down: boolean) => {
      const k = e.key.toLowerCase()
      if (['w', 'a', 's', 'd'].includes(k)) {
        e.preventDefault()
        keys[k] = down
      }
    }
    const kd = (e: KeyboardEvent) => onKey(e, true)
    const ku = (e: KeyboardEvent) => onKey(e, false)
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)

    const resize = () => {
      const w = mount.clientWidth || 640
      const h = mount.clientHeight || 400
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h, false)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(mount)

    // Optional socket presence (same protocol as MultiplayerScene)
    let sock: { emit: (e: string, d?: unknown) => void; disconnect: () => void } | null = null
    const remotes = new Map<string, THREE.Mesh>()
    ;(async () => {
      if (!mp) {
        setStatus(`Lab · ${museumId} · multiplayer OFF (pas de VITE_MULTIPLAYER_URL)`)
        return
      }
      try {
        const { io } = await import('socket.io-client')
        const url = import.meta.env.VITE_MULTIPLAYER_URL as string
        const s = io(url, { transports: ['websocket', 'polling'] })
        sock = s
        s.emit('join_room', { room_id: museumId, color: '#22d3ee' })
        s.on('user_moved', (data: { user_id: string; position: number[] }) => {
          if (!data?.user_id || !data.position) return
          let m = remotes.get(data.user_id)
          if (!m) {
            m = new THREE.Mesh(
              new THREE.SphereGeometry(0.25, 12, 12),
              new THREE.MeshStandardMaterial({ color: 0xa78bfa, emissive: 0x5b21b6, emissiveIntensity: 0.4 })
            )
            scene.add(m)
            remotes.set(data.user_id, m)
          }
          m.position.set(data.position[0], data.position[1] || EYE, data.position[2])
        })
        setStatus(`Lab · ${museumId} · multiplayer ON`)
      } catch {
        setStatus(`Lab · ${museumId} · socket.io non dispo`)
      }
    })()

    let lastEmit = 0
    let raf = 0
    const clock = new THREE.Clock()
    const loop = () => {
      raf = requestAnimationFrame(loop)
      if (disposed) return
      const dt = Math.min(clock.getDelta(), 0.05)
      const f = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw))
      const r = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw))
      let mx = 0,
        mz = 0
      if (keys.w) {
        mx += f.x * WALK * dt
        mz += f.z * WALK * dt
      }
      if (keys.s) {
        mx -= f.x * WALK * dt
        mz -= f.z * WALK * dt
      }
      if (keys.a) {
        mx -= r.x * WALK * dt
        mz -= r.z * WALK * dt
      }
      if (keys.d) {
        mx += r.x * WALK * dt
        mz += r.z * WALK * dt
      }
      if (mx || mz) {
        const nx = px + mx,
          nz = pz + mz
        if (pointInBlueprintFloor(blueprint, nx, nz)) {
          px = nx
          pz = nz
        }
      }
      camera.position.set(px, EYE, pz)
      camera.rotation.order = 'YXZ'
      camera.rotation.y = yaw
      me.position.set(px, 0.9, pz)

      const now = performance.now()
      if (sock && now - lastEmit > 80) {
        lastEmit = now
        sock.emit('update_position', { room_id: museumId, position: [px, EYE, pz] })
      }
      renderer.render(scene, camera)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', kd)
      window.removeEventListener('keyup', ku)
      ro.disconnect()
      try {
        sock?.disconnect()
      } catch {
        /* */
      }
      renderer.dispose()
      if (canvas.parentNode === mount) mount.removeChild(canvas)
    }
  }, [blueprint, museumId, mp])

  return (
    <div className="animate-fade-in pb-12 max-w-5xl mx-auto space-y-4">
      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-400/80">
          Lab · multiplayer
        </p>
        <h1 className="text-2xl font-semibold text-white">Musée lab</h1>
        <p className="text-[13px] text-zinc-500 max-w-lg">
          Chemin expérimental. WASD. Multiplayer réel uniquement si{' '}
          <code className="text-zinc-400">VITE_MULTIPLAYER_URL</code> + serveur Socket.IO.
        </p>
        <p className="text-[11px] text-zinc-600">{status}</p>
      </header>

      <div
        ref={mountRef}
        className="rounded-2xl border border-amber-500/25 overflow-hidden bg-black"
        style={{ height: 'min(70vh, 520px)' }}
      />

      <p className="text-[12px] text-zinc-500">
        <Link to="/museum" className="text-cyan-400/90 hover:underline">
          ← Galerie principale
        </Link>
        {' · salle '}
        <span className="text-zinc-400">{museumId}</span>
      </p>
    </div>
  )
}
