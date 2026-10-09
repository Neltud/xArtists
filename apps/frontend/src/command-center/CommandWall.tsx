/**
 * Cyber Command Wall — perspective grid, scanlines, particles, neon volumetric bars.
 */
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { createPulseAtmosphereMesh } from './PulseAtmosphere'
import LivePriceRail from './LivePriceRail'

type HitAction = 'MOMENTUM' | 'FLOW' | 'PULSE'

type Props = {
  sentiment?: number
  volatility?: number
  interactive?: boolean
  pulseSpeed?: number
  color?: [number, number, number]
  colorRgb?: [number, number, number]
}

export default function CommandWall({
  sentiment = 0,
  volatility = 0.35,
  interactive = true,
  pulseSpeed = 1,
  color,
  colorRgb,
}: Props) {
  const resolved = color ?? colorRgb ?? ([0.15, 0.85, 0.95] as [number, number, number])
  const hostRef = useRef<HTMLDivElement>(null)
  const sentRef = useRef(sentiment)
  const volRef = useRef(volatility)
  const spdRef = useRef(pulseSpeed)
  const colRef = useRef(resolved)
  sentRef.current = sentiment
  volRef.current = volatility
  spdRef.current = pulseSpeed
  colRef.current = resolved

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let renderer: THREE.WebGLRenderer
    try {
      const w = host.clientWidth || 360
      const h = Math.max(340, Math.floor(w * 0.55))

      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x03050c)
      scene.fog = new THREE.FogExp2(0x03050c, 0.045)

      const camera = new THREE.PerspectiveCamera(48, w / h, 0.1, 100)
      camera.position.set(0, 0.55, 3.6)

      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'default',
        failIfMajorPerformanceCaveat: false,
      })
      renderer.setSize(w, h)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      host.innerHTML = ''
      host.appendChild(renderer.domElement)

      const amb = new THREE.AmbientLight(0x88aacc, 0.35)
      scene.add(amb)
      const dir = new THREE.DirectionalLight(0xaaffff, 0.9)
      dir.position.set(2, 4, 5)
      scene.add(dir)
      const neon = new THREE.PointLight(0x22d3ee, 1.8, 12)
      neon.position.set(-1.5, 1.2, 2)
      scene.add(neon)
      const neon2 = new THREE.PointLight(0xa855f7, 1.2, 10)
      neon2.position.set(1.8, 0.8, 1.5)
      scene.add(neon2)

      // Perspective floor grid
      const grid = new THREE.GridHelper(10, 40, 0x22d3ee, 0x0a2030)
      grid.position.y = -0.85
      scene.add(grid)

      // Back wall plate
      const wallGeo = new THREE.BoxGeometry(3.2, 1.7, 0.06)
      const wallMat = new THREE.MeshPhongMaterial({
        color: 0x0a1018,
        emissive: 0x0a3040,
        emissiveIntensity: 0.4,
        shininess: 80,
        transparent: true,
        opacity: 0.92,
      })
      const wall = new THREE.Mesh(wallGeo, wallMat)
      wall.position.z = -0.2
      wall.userData.action = 'PULSE' satisfies HitAction
      scene.add(wall)

      // Scanline plane (subtle)
      const scanGeo = new THREE.PlaneGeometry(3.1, 1.6)
      const scanMat = new THREE.MeshBasicMaterial({
        color: 0x22d3ee,
        transparent: true,
        opacity: 0.04,
        depthWrite: false,
      })
      const scan = new THREE.Mesh(scanGeo, scanMat)
      scan.position.z = -0.16
      scene.add(scan)

      const atmo = createPulseAtmosphereMesh()
      atmo.mesh.position.z = 0.02
      scene.add(atmo.mesh)

      // Volumetric neon bars (Phong + emissive)
      const barGroup = new THREE.Group()
      const bars: THREE.Mesh[] = []
      for (let i = 0; i < 12; i++) {
        const bh = 0.2 + Math.random() * 0.5
        const geo = new THREE.BoxGeometry(0.14, bh, 0.14)
        const isGreen = i < 6
        const mat = new THREE.MeshPhongMaterial({
          color: isGreen ? 0x22c55e : 0xa855f7,
          emissive: isGreen ? 0x16a34a : 0x7c3aed,
          emissiveIntensity: 0.75,
          transparent: true,
          opacity: 0.85,
          shininess: 120,
        })
        const m = new THREE.Mesh(geo, mat)
        m.position.set(-1.25 + i * 0.22, -0.7 + bh / 2, 0.15)
        barGroup.add(m)
        bars.push(m)
      }
      scene.add(barGroup)

      // Particles
      const pCount = 120
      const pGeo = new THREE.BufferGeometry()
      const pPos = new Float32Array(pCount * 3)
      for (let i = 0; i < pCount; i++) {
        pPos[i * 3] = (Math.random() - 0.5) * 4
        pPos[i * 3 + 1] = (Math.random() - 0.5) * 2
        pPos[i * 3 + 2] = Math.random() * 2 - 0.5
      }
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
      const pMat = new THREE.PointsMaterial({
        color: 0x67e8f9,
        size: 0.03,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
      })
      const points = new THREE.Points(pGeo, pMat)
      scene.add(points)

      const nodeGeo = new THREE.BoxGeometry(0.28, 0.28, 0.14)
      const momMat = new THREE.MeshPhongMaterial({
        color: 0x22c55e,
        emissive: 0x14532d,
        emissiveIntensity: 0.85,
        shininess: 100,
      })
      const flowMat = new THREE.MeshPhongMaterial({
        color: 0xa855f7,
        emissive: 0x4c1d95,
        emissiveIntensity: 0.85,
        shininess: 100,
      })
      const momNode = new THREE.Mesh(nodeGeo, momMat)
      momNode.position.set(-1.15, -0.25, 0.35)
      momNode.userData.action = 'MOMENTUM' satisfies HitAction
      const flowNode = new THREE.Mesh(nodeGeo, flowMat)
      flowNode.position.set(1.15, -0.25, 0.35)
      flowNode.userData.action = 'FLOW' satisfies HitAction
      scene.add(momNode, flowNode)

      const raycaster = new THREE.Raycaster()
      const pointer = new THREE.Vector2()
      const targets = [wall, momNode, flowNode]

      const flash = (mesh: THREE.Mesh) => {
        const m = mesh.material as THREE.MeshPhongMaterial
        const prev = m.emissiveIntensity
        m.emissiveIntensity = 1.8
        setTimeout(() => {
          m.emissiveIntensity = prev
        }, 180)
      }

      const onPointer = (ev: PointerEvent) => {
        if (!interactive) return
        const rect = renderer.domElement.getBoundingClientRect()
        pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1
        pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1
        raycaster.setFromCamera(pointer, camera)
        const hits = raycaster.intersectObjects(targets, false)
        if (!hits.length) return
        const obj = hits[0].object as THREE.Mesh
        flash(obj)
        const action = (obj.userData.action || 'PULSE') as HitAction
        if (action === 'MOMENTUM') window.location.hash = '#/lia'
        else if (action === 'FLOW') window.location.hash = '#/trading'
      }
      renderer.domElement.style.cursor = interactive ? 'pointer' : 'default'
      renderer.domElement.addEventListener('pointerdown', onPointer)

      let raf = 0
      const t0 = performance.now()
      const animate = () => {
        raf = requestAnimationFrame(animate)
        const s = sentRef.current
        const v = volRef.current
        const highVol = v > 0.55
        const t = (performance.now() - t0) / 1000

        atmo.uniforms.uTime.value = t
        atmo.uniforms.uSentiment.value = s
        atmo.uniforms.uVolatility.value = v
        atmo.uniforms.uPulseSpeed.value = spdRef.current * (1 + (highVol ? 0.4 : 0))
        const c = colRef.current
        if (highVol) atmo.uniforms.uColor.value.set(c[0] * 0.5 + 0.4, c[1] * 0.35 + 0.2, c[2] * 0.5 + 0.5)
        else atmo.uniforms.uColor.value.set(c[0], c[1], c[2])

        wallMat.emissiveIntensity = 0.35 + Math.abs(s) * 0.5 + v * 0.25
        scan.position.y = Math.sin(t * 1.2) * 0.15
        scanMat.opacity = 0.03 + Math.abs(Math.sin(t * 2)) * 0.05

        bars.forEach((b, i) => {
          const base = 0.15 + ((Math.sin(t * 1.6 + i * 0.5) + 1) / 2) * (0.3 + v * 0.55)
          const bias = i < 6 ? Math.max(0, s) * 0.4 : Math.max(0, -s) * 0.3 + v * 0.25
          const bh = Math.min(1.0, base + bias)
          b.scale.y = Math.max(0.15, bh / 0.35)
          b.position.y = -0.7 + (0.35 * b.scale.y) / 2
          const mat = b.material as THREE.MeshPhongMaterial
          mat.emissiveIntensity = 0.55 + Math.sin(t * 3 + i) * 0.25
        })

        const pos = pGeo.getAttribute('position') as THREE.BufferAttribute
        for (let i = 0; i < pCount; i++) {
          let y = pos.getY(i) + 0.004 + (i % 5) * 0.0005
          if (y > 1.2) y = -1.1
          pos.setY(i, y)
        }
        pos.needsUpdate = true

        momNode.rotation.y = t * 0.7
        flowNode.rotation.y = -t * 0.65
        grid.position.z = ((t * 0.15) % 0.5) - 0.25

        renderer.render(scene, camera)
      }
      animate()

      const onResize = () => {
        const nw = host.clientWidth || 360
        const nh = Math.max(340, Math.floor(nw * 0.55))
        camera.aspect = nw / nh
        camera.updateProjectionMatrix()
        renderer.setSize(nw, nh)
      }
      window.addEventListener('resize', onResize)

      return () => {
        cancelAnimationFrame(raf)
        window.removeEventListener('resize', onResize)
        renderer.domElement.removeEventListener('pointerdown', onPointer)
        atmo.dispose()
        wallGeo.dispose()
        wallMat.dispose()
        scanGeo.dispose()
        scanMat.dispose()
        nodeGeo.dispose()
        momMat.dispose()
        flowMat.dispose()
        pGeo.dispose()
        pMat.dispose()
        bars.forEach(b => {
          b.geometry.dispose()
          ;(b.material as THREE.Material).dispose()
        })
        renderer.dispose()
        if (host.contains(renderer.domElement)) host.removeChild(renderer.domElement)
      }
    } catch (e) {
      console.warn('[CommandWall] WebGL fail', e)
      return
    }
  }, [interactive])

  const bullPct = (50 + Math.max(-40, Math.min(40, sentiment * 50))).toFixed(1)
  const volPct = (volatility * 100).toFixed(1)
  const bullish = sentiment >= 0

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-cyan-500/20 bg-[#03050c] shadow-[0_0_40px_rgba(34,211,238,0.12)]">
      <div className="absolute top-2 left-3 z-10 flex flex-wrap gap-2 pointer-events-none">
        <span className="text-[9px] uppercase tracking-[0.18em] text-cyan-300/95 font-tech">
          LIVE · CYBER DECK
        </span>
        <span
          className={`pill-hud ${bullish ? 'pill-bull' : 'pill-bear'}`}
        >
          {bullish ? 'BULLISH' : 'BEARISH'} {bullPct}%
        </span>
        <span className="pill-hud pill-vol">VOL {volPct}%</span>
      </div>
      <LivePriceRail />
      <div ref={hostRef} className="w-full min-h-[340px]" />
      <div className="pointer-events-none absolute inset-0 scanlines opacity-[0.12]" />
      <p className="absolute bottom-2 left-3 right-24 text-[10px] text-zinc-500 pointer-events-none font-tech">
        NEON BARS · GRID · PARTICLES · vert momentum · violet flow
      </p>
    </div>
  )
}
