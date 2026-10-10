/**
 * Accueil 360° — galerie néon cyberpunk + résilience WebGL (context loss).
 * Mobile-safe: pixelRatio ≤ 1.25, pause onglet caché, fallback grille HTML.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import * as THREE from 'three'
import { isWebGLAvailable } from '../../lib/webglSupport'

type Exhibit = {
  id: string
  label: string
  sub: string
  path: string
  color: number
  neon: number
  glyph: 'museum' | 'market' | 'slot' | 'packs' | 'command' | 'lia' | 'stake' | 'studio'
}

const EXHIBITS: Exhibit[] = [
  { id: 'museum', label: 'Musée', sub: 'Galerie 3D', path: '/museum', color: 0xffd700, neon: 0xffd700, glyph: 'museum' },
  { id: 'market', label: 'Marché', sub: 'NFT · RWA', path: '/marketplace', color: 0x00f3ff, neon: 0x00f3ff, glyph: 'market' },
  { id: 'slot', label: 'Slot', sub: 'EGLD', path: '/slot', color: 0xff007f, neon: 0xff007f, glyph: 'slot' },
  { id: 'packs', label: 'Packs', sub: 'Pulse complet', path: '/agents', color: 0x00f3ff, neon: 0x22d3ee, glyph: 'packs' },
  { id: 'cc', label: 'Command', sub: 'Hub holo', path: '/command-center', color: 0xa855f7, neon: 0xc084fc, glyph: 'command' },
  { id: 'lia', label: 'LIA', sub: 'Signaux IA', path: '/lia', color: 0x00f3ff, neon: 0x60a5fa, glyph: 'lia' },
  { id: 'stake', label: 'Staking', sub: '$TRO', path: '/staking', color: 0xffd700, neon: 0x4ade80, glyph: 'stake' },
  { id: 'studio', label: 'Studio', sub: 'Phygital NFT', path: '/studio', color: 0xff007f, neon: 0xf472b6, glyph: 'studio' },
]

function drawGlyph(ctx: CanvasRenderingContext2D, glyph: Exhibit['glyph'], cx: number, cy: number, hex: string) {
  ctx.save()
  ctx.strokeStyle = hex
  ctx.fillStyle = hex
  ctx.lineWidth = 7
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  switch (glyph) {
    case 'museum': {
      ctx.beginPath()
      ctx.moveTo(cx - 55, cy + 45); ctx.lineTo(cx - 55, cy - 15)
      ctx.moveTo(cx, cy + 45); ctx.lineTo(cx, cy - 35)
      ctx.moveTo(cx + 55, cy + 45); ctx.lineTo(cx + 55, cy - 15)
      ctx.moveTo(cx - 75, cy - 15); ctx.lineTo(cx + 75, cy - 15)
      ctx.moveTo(cx - 75, cy - 15); ctx.lineTo(cx, cy - 55); ctx.lineTo(cx + 75, cy - 15)
      ctx.stroke(); break
    }
    case 'market': {
      ctx.strokeRect(cx - 50, cy - 20, 100, 65)
      ctx.beginPath(); ctx.moveTo(cx - 60, cy - 20); ctx.lineTo(cx, cy - 55); ctx.lineTo(cx + 60, cy - 20); ctx.stroke()
      ctx.strokeRect(cx - 18, cy + 5, 36, 40); break
    }
    case 'slot': {
      ctx.strokeRect(cx - 65, cy - 40, 130, 80)
      ctx.beginPath(); ctx.moveTo(cx - 22, cy - 40); ctx.lineTo(cx - 22, cy + 40); ctx.moveTo(cx + 22, cy - 40); ctx.lineTo(cx + 22, cy + 40); ctx.stroke()
      ctx.font = 'bold 32px system-ui'; ctx.textAlign = 'center'
      ctx.fillText('7', cx - 42, cy + 12); ctx.fillText('7', cx, cy + 12); ctx.fillText('7', cx + 42, cy + 12); break
    }
    case 'packs': {
      ctx.strokeRect(cx - 50, cy - 15, 75, 55); ctx.strokeRect(cx - 38, cy - 28, 75, 55); ctx.strokeRect(cx - 26, cy - 42, 75, 55)
      ctx.font = 'bold 28px system-ui'; ctx.textAlign = 'center'; ctx.fillText('3', cx + 10, cy - 5); break
    }
    case 'command': {
      ctx.beginPath(); ctx.arc(cx, cy, 50, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.arc(cx, cy, 28, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 45, cy - 30); ctx.stroke()
      for (let a = 0; a < 6; a++) {
        const ang = (a / 6) * Math.PI * 2
        ctx.beginPath(); ctx.arc(cx + Math.cos(ang) * 50, cy + Math.sin(ang) * 50, 5, 0, Math.PI * 2); ctx.fill()
      }
      break
    }
    case 'lia': {
      ctx.beginPath(); ctx.arc(cx, cy - 8, 38, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx - 20, cy - 8); ctx.lineTo(cx + 20, cy - 8); ctx.moveTo(cx, cy - 28); ctx.lineTo(cx, cy + 12); ctx.stroke()
      ctx.beginPath(); ctx.arc(cx - 28, cy + 28, 14, 0, Math.PI * 2); ctx.arc(cx + 28, cy + 28, 14, 0, Math.PI * 2); ctx.stroke(); break
    }
    case 'stake': {
      ctx.beginPath(); ctx.arc(cx, cy + 5, 42, 0, Math.PI * 2); ctx.stroke()
      ctx.font = 'bold 40px system-ui'; ctx.textAlign = 'center'; ctx.fillText('T', cx, cy + 20); break
    }
    case 'studio': {
      ctx.beginPath(); ctx.moveTo(cx - 40, cy + 40); ctx.lineTo(cx - 40, cy - 30); ctx.lineTo(cx + 45, cy - 40); ctx.lineTo(cx + 45, cy + 30); ctx.closePath(); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx - 15, cy + 5); ctx.lineTo(cx + 25, cy - 10); ctx.stroke(); break
    }
  }
  ctx.restore()
}

function paintArtwork(ctx: CanvasRenderingContext2D, ex: Exhibit, seed: number) {
  const hex = `#${ex.neon.toString(16).padStart(6, '0')}`
  const hex2 = `#${ex.color.toString(16).padStart(6, '0')}`
  const cx = 448, cy = 300
  const bg = ctx.createLinearGradient(80, 80, 816, 520)
  bg.addColorStop(0, '#0a0618'); bg.addColorStop(0.25, hex + '33'); bg.addColorStop(0.55, hex2 + '28'); bg.addColorStop(0.8, '#12081c'); bg.addColorStop(1, '#05020c')
  ctx.fillStyle = bg; ctx.fillRect(80, 80, 736, 440)
  for (let o = 0; o < 6; o++) {
    const ox = cx + Math.cos(seed + o * 1.1) * (40 + o * 18)
    const oy = cy + Math.sin(seed * 0.7 + o) * (30 + o * 12)
    const or = 90 - o * 12
    const og = ctx.createRadialGradient(ox, oy, 4, ox, oy, or)
    og.addColorStop(0, (o % 2 === 0 ? hex : hex2) + 'aa')
    og.addColorStop(0.4, (o % 2 === 0 ? hex2 : hex) + '44')
    og.addColorStop(1, 'transparent')
    ctx.fillStyle = og; ctx.beginPath(); ctx.arc(ox, oy, or, 0, Math.PI * 2); ctx.fill()
  }
  ctx.save(); ctx.globalCompositeOperation = 'lighter'
  for (let k = 0; k < 7; k++) {
    ctx.strokeStyle = k % 2 === 0 ? hex : hex2; ctx.lineWidth = 2.5 + k * 0.6; ctx.globalAlpha = 0.35 + (k % 3) * 0.08
    ctx.beginPath(); const base = cy + Math.sin(seed + k * 0.9) * 24; ctx.moveTo(100, base)
    for (let x = 100; x <= 796; x += 16) {
      const y = base + Math.sin(x * 0.014 + seed + k * 1.4) * (32 + k * 7) + Math.cos(x * 0.009 + k * 0.6) * 18
      ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  ctx.restore()
  ctx.save()
  for (let i = 0; i < 40; i++) {
    const x = 100 + ((seed * 97 + i * 53) % 696); const y = 100 + ((seed * 41 + i * 71) % 400)
    ctx.fillStyle = i % 3 === 0 ? '#ffffff' : hex; ctx.globalAlpha = 0.35 + (i % 5) * 0.1
    ctx.beginPath(); ctx.arc(x, y, 1 + (i % 4), 0, Math.PI * 2); ctx.fill()
  }
  ctx.restore()
  const vig = ctx.createRadialGradient(cx, cy, 40, cx, cy, 320)
  vig.addColorStop(0, 'transparent'); vig.addColorStop(0.7, 'transparent'); vig.addColorStop(1, 'rgba(0,0,0,0.55)')
  ctx.fillStyle = vig; ctx.fillRect(80, 80, 736, 440)
  const halo = ctx.createRadialGradient(cx, cy, 8, cx, cy, 180)
  halo.addColorStop(0, hex + '88'); halo.addColorStop(0.45, hex2 + '33'); halo.addColorStop(1, 'transparent')
  ctx.fillStyle = halo; ctx.fillRect(80, 80, 736, 440)
  drawGlyph(ctx, ex.glyph, cx, cy, hex)
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.roundRect(698, 98, 96, 30, 10); ctx.fill()
  ctx.strokeStyle = hex; ctx.lineWidth = 1.5; ctx.shadowColor = hex; ctx.shadowBlur = 8; ctx.stroke(); ctx.shadowBlur = 0
  ctx.fillStyle = hex; ctx.font = 'bold 14px system-ui'; ctx.textAlign = 'center'
  ctx.fillText(ex.id === 'stake' || ex.id === 'market' ? 'RWA' : 'NFT', 746, 118)
}

function paintPanel(ex: Exhibit, index: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas'); canvas.width = 896; canvas.height = 1120
  const ctx = canvas.getContext('2d')!
  const hex = `#${ex.neon.toString(16).padStart(6, '0')}`
  const frameColors = ['#ffd700', '#00f3ff', '#ff007f', hex]
  const outer = frameColors[index % frameColors.length]
  const g = ctx.createLinearGradient(0, 0, 0, 1120)
  g.addColorStop(0, '#0c0814'); g.addColorStop(0.45, '#06040c'); g.addColorStop(1, '#020208')
  ctx.fillStyle = g; ctx.fillRect(0, 0, 896, 1120)
  ctx.shadowColor = outer; ctx.shadowBlur = 36; ctx.strokeStyle = outer; ctx.lineWidth = 18; ctx.strokeRect(28, 28, 840, 1064)
  ctx.shadowBlur = 18; ctx.strokeStyle = hex; ctx.lineWidth = 8; ctx.strokeRect(48, 48, 800, 1024)
  ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 2; ctx.strokeRect(64, 64, 768, 992)
  paintArtwork(ctx, ex, index * 1.7 + 0.3)
  ctx.fillStyle = '#fafafa'; ctx.font = 'bold 78px system-ui,Segoe UI,sans-serif'; ctx.textAlign = 'center'
  ctx.shadowColor = hex; ctx.shadowBlur = 12; ctx.fillText(ex.label, 448, 620); ctx.shadowBlur = 0
  ctx.fillStyle = '#a1a1aa'; ctx.font = '36px system-ui,sans-serif'; ctx.fillText(ex.sub, 448, 680)
  ctx.fillStyle = hex; ctx.globalAlpha = 0.22; ctx.beginPath(); ctx.roundRect(260, 760, 376, 76, 38); ctx.fill(); ctx.globalAlpha = 1
  ctx.strokeStyle = hex; ctx.lineWidth = 3; ctx.shadowColor = hex; ctx.shadowBlur = 16
  ctx.beginPath(); ctx.roundRect(260, 760, 376, 76, 38); ctx.stroke(); ctx.shadowBlur = 0
  ctx.fillStyle = '#fff'; ctx.font = 'bold 30px system-ui'; ctx.fillText('ENTRER  →', 448, 808)
  ctx.fillStyle = '#71717a'; ctx.font = '22px system-ui'; ctx.fillText('clic · porte holographique', 448, 920)
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; return tex
}

function FallbackGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
      {EXHIBITS.map(ex => (
        <Link key={ex.id} to={ex.path} className="rounded-2xl border border-cyan-400/25 bg-black/70 p-4 hover:border-fuchsia-400/50 transition shadow-[0_0_20px_rgba(0,243,255,0.08)]">
          <p className="text-base font-semibold text-white">{ex.label}</p>
          <p className="text-[12px] text-zinc-400">{ex.sub}</p>
        </Link>
      ))}
    </div>
  )
}

export default function HomeMenuHall() {
  const hostRef = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(() => !isWebGLAvailable())
  const [contextLost, setContextLost] = useState(false)
  const [sceneKey, setSceneKey] = useState(0)

  const retryScene = useCallback(() => {
    setFailed(false)
    setContextLost(false)
    setSceneKey(k => k + 1)
  }, [])

  useEffect(() => {
    const host = hostRef.current
    if (!host || failed) return
    if (!isWebGLAvailable()) {
      setFailed(true)
      return
    }

    let renderer: THREE.WebGLRenderer | null = null
    let raf = 0
    let disposed = false
    let paused = false
    const disposables: { dispose: () => void }[] = []

    const onCtxLost = (e: Event) => {
      e.preventDefault()
      paused = true
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      setContextLost(true)
      console.warn('[HomeMenuHall] webglcontextlost')
    }
    const onCtxRestored = () => {
      console.info('[HomeMenuHall] webglcontextrestored → reinit')
      setContextLost(false)
      setSceneKey(k => k + 1)
    }
    const onVisibility = () => {
      paused = document.hidden
      if (!paused && !disposed && !raf) {
        ;(window as unknown as { __hmhKick?: () => void }).__hmhKick?.()
      }
    }

    try {
      const isMobile = (host.clientWidth || 400) < 640
      const w = Math.max(300, host.clientWidth || 400)
      const h = Math.max(isMobile ? 440 : 500, Math.min(isMobile ? 560 : 740, Math.floor(w * (isMobile ? 1.05 : 1.1))))

      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x000000)
      scene.fog = new THREE.FogExp2(0x05020c, 0.022)

      const camRadius = isMobile ? 3.6 : 4.2
      const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 90)
      camera.position.set(0, 1.8, camRadius)
      camera.lookAt(0, 1.4, 0)

      renderer = new THREE.WebGLRenderer({
        antialias: !isMobile,
        powerPreference: 'default',
        failIfMajorPerformanceCaveat: false,
        alpha: false,
      })
      renderer.setSize(w, h)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.75))
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.15
      host.innerHTML = ''
      host.appendChild(renderer.domElement)

      const canvas = renderer.domElement
      canvas.addEventListener('webglcontextlost', onCtxLost, false)
      canvas.addEventListener('webglcontextrestored', onCtxRestored, false)
      document.addEventListener('visibilitychange', onVisibility)

      scene.add(new THREE.AmbientLight(0xb0a8d0, 0.55))
      const key = new THREE.DirectionalLight(0xffe8ff, 0.85)
      key.position.set(3, 10, 2)
      scene.add(key)
      const spot = new THREE.SpotLight(0x00f3ff, 2.8, 32, Math.PI / 4.5, 0.4, 1.1)
      spot.position.set(0, 7.5, 0)
      spot.target.position.set(0, 0, 0)
      scene.add(spot)
      scene.add(spot.target)
      scene.add(new THREE.PointLight(0xff007f, 2.0, 18).translateX(-5).translateY(3.2))
      scene.add(new THREE.PointLight(0x00f3ff, 1.8, 18).translateX(5).translateY(2.8))
      scene.add(new THREE.PointLight(0xffd700, 1.4, 16).translateY(5).translateZ(-2))
      scene.add(new THREE.PointLight(0xa855f7, 1.6, 20).translateY(2))

      const floorGeo = new THREE.CircleGeometry(10, isMobile ? 32 : 48)
      const floorMat = new THREE.MeshStandardMaterial({
        color: 0x050508,
        metalness: 0.8,
        roughness: 0.2,
        emissive: new THREE.Color(0x0c0820),
        emissiveIntensity: 0.45,
      })
      const floor = new THREE.Mesh(floorGeo, floorMat)
      floor.rotation.x = -Math.PI / 2
      scene.add(floor)
      disposables.push(floorGeo, floorMat)

      const grid = new THREE.GridHelper(18, isMobile ? 24 : 36, 0xa855f7, 0x1a0a30)
      grid.position.y = 0.015
      const gridMat = grid.material as THREE.LineBasicMaterial | THREE.LineBasicMaterial[]
      if (Array.isArray(gridMat)) gridMat.forEach(m => { m.transparent = true; m.opacity = 0.85 })
      else { gridMat.transparent = true; gridMat.opacity = 0.85 }
      scene.add(grid)

      const floorRingGeo = new THREE.TorusGeometry(5.4, 0.025, 6, isMobile ? 48 : 64)
      const floorRingMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, transparent: true, opacity: 0.7 })
      const floorRing = new THREE.Mesh(floorRingGeo, floorRingMat)
      floorRing.rotation.x = Math.PI / 2
      floorRing.position.y = 0.04
      scene.add(floorRing)
      disposables.push(floorRingGeo, floorRingMat)

      const domeGeo = new THREE.SphereGeometry(11, isMobile ? 16 : 24, isMobile ? 10 : 14, 0, Math.PI * 2, 0, Math.PI * 0.5)
      const domeMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, wireframe: true, transparent: true, opacity: 0.42 })
      const dome = new THREE.Mesh(domeGeo, domeMat)
      dome.position.y = 0.05
      scene.add(dome)
      disposables.push(domeGeo, domeMat)

      const outerDomeGeo = new THREE.SphereGeometry(11.4, isMobile ? 12 : 18, isMobile ? 8 : 10, 0, Math.PI * 2, 0, Math.PI * 0.48)
      const outerDomeMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, wireframe: true, transparent: true, opacity: 0.22 })
      const outerDome = new THREE.Mesh(outerDomeGeo, outerDomeMat)
      outerDome.position.y = 0.08
      scene.add(outerDome)
      disposables.push(outerDomeGeo, outerDomeMat)

      const ringGeo = new THREE.TorusGeometry(6.4, 0.04, 8, isMobile ? 48 : 64)
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xc084fc })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.rotation.x = Math.PI / 2
      ring.position.y = 4.2
      scene.add(ring)
      disposables.push(ringGeo, ringMat)

      const panels: THREE.Mesh[] = []
      const beams: THREE.Mesh[] = []
      const particles: THREE.Points[] = []
      const n = EXHIBITS.length
      const radius = 5.0

      EXHIBITS.forEach((ex, i) => {
        const tex = paintPanel(ex, i)
        const mat = new THREE.MeshStandardMaterial({
          map: tex,
          emissive: new THREE.Color(ex.neon),
          emissiveIntensity: 1.25,
          roughness: 0.18,
          metalness: 0.5,
          transparent: true,
          opacity: 0.97,
        })
        const geo = new THREE.PlaneGeometry(2.15, 2.7)
        const mesh = new THREE.Mesh(geo, mat)
        const ang = (i / n) * Math.PI * 2 - Math.PI / 2
        const px = Math.cos(ang) * radius
        const pz = Math.sin(ang) * radius
        mesh.position.set(px, 1.55, pz)
        mesh.lookAt(0, 1.55, 0)
        mesh.userData.path = ex.path
        mesh.userData.baseY = 1.55
        scene.add(mesh)
        panels.push(mesh)
        disposables.push(geo, mat, tex)

        const pl = new THREE.PointLight(ex.neon, 1.85, 8)
        pl.position.set(px * 0.7, 1.9, pz * 0.7)
        scene.add(pl)

        const beamGeo = new THREE.ConeGeometry(0.7, 1.85, isMobile ? 10 : 16, 1, true)
        const beamMat = new THREE.MeshBasicMaterial({
          color: ex.neon,
          transparent: true,
          opacity: 0.28,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
        const beam = new THREE.Mesh(beamGeo, beamMat)
        beam.position.set(px, 0.9, pz)
        beam.rotation.x = Math.PI
        scene.add(beam)
        beams.push(beam)
        disposables.push(beamGeo, beamMat)

        if (!isMobile || i % 2 === 0) {
          const count = isMobile ? 14 : 28
          const positions = new Float32Array(count * 3)
          for (let p = 0; p < count; p++) {
            positions[p * 3] = (Math.random() - 0.5) * 0.85
            positions[p * 3 + 1] = Math.random() * 1.8
            positions[p * 3 + 2] = (Math.random() - 0.5) * 0.85
          }
          const pGeo = new THREE.BufferGeometry()
          pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
          const pMat = new THREE.PointsMaterial({
            color: ex.neon,
            size: isMobile ? 0.04 : 0.06,
            transparent: true,
            opacity: 0.85,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true,
          })
          const pts = new THREE.Points(pGeo, pMat)
          pts.position.set(px, 0.2, pz)
          scene.add(pts)
          particles.push(pts)
          disposables.push(pGeo, pMat)
        }
      })

      const raycaster = new THREE.Raycaster()
      const pointer = new THREE.Vector2()
      let dragging = false
      let lastX = 0
      let yaw = 0
      let targetYaw = 0

      const onDown = (ev: PointerEvent) => {
        dragging = true
        lastX = ev.clientX
        if (renderer) renderer.domElement.style.cursor = 'grabbing'
      }
      const onUp = (ev: PointerEvent) => {
        if (!dragging || !renderer) return
        const dx = Math.abs(ev.clientX - lastX)
        dragging = false
        renderer.domElement.style.cursor = 'grab'
        if (dx > 8) return
        const rect = renderer.domElement.getBoundingClientRect()
        pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1
        pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1
        raycaster.setFromCamera(pointer, camera)
        const hits = raycaster.intersectObjects(panels, false)
        if (hits.length) {
          const path = hits[0].object.userData.path as string
          if (path) window.location.hash = `#${path}`
        }
      }
      const onMove = (ev: PointerEvent) => {
        if (!dragging) return
        targetYaw -= (ev.clientX - lastX) * 0.005
        lastX = ev.clientX
      }

      canvas.style.cursor = 'grab'
      canvas.style.touchAction = 'none'
      canvas.addEventListener('pointerdown', onDown)
      canvas.addEventListener('pointerup', onUp)
      canvas.addEventListener('pointerleave', () => {
        dragging = false
        if (renderer) renderer.domElement.style.cursor = 'grab'
      })
      canvas.addEventListener('pointermove', onMove)

      const t0 = performance.now()
      const animate = () => {
        if (disposed || !renderer || paused) {
          raf = 0
          return
        }
        raf = requestAnimationFrame(animate)
        try {
          const t = (performance.now() - t0) / 1000
          if (!dragging) targetYaw += 0.00085
          yaw += (targetYaw - yaw) * 0.08
          camera.position.x = Math.sin(yaw) * camRadius
          camera.position.z = Math.cos(yaw) * camRadius
          camera.position.y = 1.8 + Math.sin(t * 0.35) * 0.04
          camera.lookAt(0, 1.35, 0)
          panels.forEach((p, i) => {
            p.position.y = (p.userData.baseY as number) + Math.sin(t * 0.9 + i * 0.5) * 0.1
            const m = p.material as THREE.MeshStandardMaterial
            m.emissiveIntensity = 0.95 + Math.sin(t * 1.4 + i) * 0.35
          })
          beams.forEach((b, i) => {
            const mat = b.material as THREE.MeshBasicMaterial
            mat.opacity = 0.22 + Math.sin(t * 1.8 + i * 0.7) * 0.12
            b.scale.y = 1 + Math.sin(t * 1.3 + i) * 0.12
            b.scale.x = 1 + Math.sin(t * 1.1 + i * 0.5) * 0.06
            b.scale.z = b.scale.x
          })
          particles.forEach((pts, i) => {
            const pos = pts.geometry.attributes.position as THREE.BufferAttribute
            for (let p = 0; p < pos.count; p++) {
              let y = pos.getY(p) + 0.012 + (i % 3) * 0.003
              if (y > 2.0) y = 0
              pos.setY(p, y)
              pos.setX(p, pos.getX(p) + Math.sin(t + p + i) * 0.0008)
              pos.setZ(p, pos.getZ(p) + Math.cos(t * 0.9 + p) * 0.0008)
            }
            pos.needsUpdate = true
          })
          ring.rotation.z = t * 0.15
          dome.rotation.y = t * 0.03
          outerDome.rotation.y = -t * 0.02
          floorRing.rotation.z = -t * 0.08
          renderer.render(scene, camera)
        } catch (err) {
          console.warn('[HomeMenuHall] render error', err)
          paused = true
          setContextLost(true)
        }
      }
      const kickAnimate = () => {
        if (disposed || !renderer || paused) return
        if (!raf) animate()
      }
      ;(window as unknown as { __hmhKick?: () => void }).__hmhKick = kickAnimate
      animate()

      const onResize = () => {
        if (!renderer || !host || disposed) return
        const mobile = (host.clientWidth || 400) < 640
        const nw = Math.max(300, host.clientWidth || 400)
        const nh = Math.max(mobile ? 440 : 500, Math.min(mobile ? 560 : 740, Math.floor(nw * (mobile ? 1.05 : 1.1))))
        camera.aspect = nw / nh
        camera.updateProjectionMatrix()
        renderer.setSize(nw, nh)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.75))
      }
      window.addEventListener('resize', onResize)

      return () => {
        disposed = true
        paused = true
        cancelAnimationFrame(raf)
        delete (window as unknown as { __hmhKick?: () => void }).__hmhKick
        window.removeEventListener('resize', onResize)
        document.removeEventListener('visibilitychange', onVisibility)
        if (renderer) {
          const el = renderer.domElement
          el.removeEventListener('webglcontextlost', onCtxLost)
          el.removeEventListener('webglcontextrestored', onCtxRestored)
          el.removeEventListener('pointerdown', onDown)
          el.removeEventListener('pointerup', onUp)
          el.removeEventListener('pointermove', onMove)
          renderer.dispose()
          if (host.contains(el)) host.removeChild(el)
        }
        disposables.forEach(d => {
          try {
            d.dispose()
          } catch {
            /* */
          }
        })
      }
    } catch (e) {
      console.warn('[HomeMenuHall] WebGL fail', e)
      setFailed(true)
      return () => {
        cancelAnimationFrame(raf)
      }
    }
  }, [failed, sceneKey])

  if (failed) {
    return (
      <div className="relative w-full overflow-hidden rounded-3xl border border-cyan-400/20 bg-black/90">
        <div className="px-4 pt-4 pb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[12px] text-amber-200/90">
            WebGL indisponible sur cet appareil — menu accessible ci-dessous.
          </p>
          <button type="button" className="btn-secondary text-[11px] px-2 py-1" onClick={retryScene}>
            Réessayer 3D
          </button>
        </div>
        <FallbackGrid />
      </div>
    )
  }

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-fuchsia-500/20 bg-black shadow-[0_0_80px_rgba(0,243,255,0.12),0_0_120px_rgba(168,85,247,0.1)]">
      <div ref={hostRef} className="w-full min-h-[440px] sm:min-h-[500px]" />
      {contextLost && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/75 backdrop-blur-sm p-4">
          <p className="text-sm text-amber-100 text-center max-w-sm">
            Contexte GPU perdu (mémoire / onglet en arrière-plan). La scène peut être relancée.
          </p>
          <button type="button" className="btn-primary text-sm" onClick={retryScene}>
            Relancer la galerie 3D
          </button>
          <button type="button" className="btn-secondary text-xs" onClick={() => setFailed(true)}>
            Afficher le menu simple
          </button>
        </div>
      )}
      <p className="absolute bottom-3 left-3 right-3 text-center text-[11px] text-cyan-100/70 pointer-events-none font-tech tracking-wide">
        Glisse pour tourner · clique une porte holographique
      </p>
    </div>
  )
}
