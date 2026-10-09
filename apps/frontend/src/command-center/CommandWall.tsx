/**
 * Command wall 3D — momentum / flow / pulse nodes.
 * Fix: createPulseAtmosphereMesh() → { mesh, uniforms, dispose }
 * Accepts color or colorRgb prop.
 */
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { createPulseAtmosphereMesh } from './PulseAtmosphere'

type HitAction = 'MOMENTUM' | 'FLOW' | 'PULSE'

type Props = {
  sentiment?: number
  volatility?: number
  interactive?: boolean
  pulseSpeed?: number
  color?: [number, number, number]
  /** alias used by CommandCenterPage */
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
  const resolved = color ?? colorRgb ?? ([0.2, 0.7, 0.9] as [number, number, number])
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
      const w = host.clientWidth || 320
      const h = Math.max(300, Math.floor(w * 0.5))

      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x05050a)
      const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100)
      camera.position.set(0, 0.4, 3.35)

      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'default',
        failIfMajorPerformanceCaveat: false,
      })
      renderer.setSize(w, h)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      host.appendChild(renderer.domElement)

      const amb = new THREE.AmbientLight(0xffffff, 0.45)
      scene.add(amb)
      const dir = new THREE.DirectionalLight(0xaaccff, 0.85)
      dir.position.set(2, 3, 4)
      scene.add(dir)

      const wallGeo = new THREE.BoxGeometry(2.5, 1.4, 0.08)
      const wallMat = new THREE.MeshStandardMaterial({
        color: 0x12121a,
        metalness: 0.45,
        roughness: 0.4,
        emissive: 0x112233,
        emissiveIntensity: 0.35,
      })
      const wall = new THREE.Mesh(wallGeo, wallMat)
      wall.userData.action = 'PULSE' satisfies HitAction
      scene.add(wall)

      const atmo = createPulseAtmosphereMesh()
      atmo.mesh.position.z = 0.06
      scene.add(atmo.mesh)

      const barGroup = new THREE.Group()
      const bars: THREE.Mesh[] = []
      for (let i = 0; i < 10; i++) {
        const bh = 0.15 + Math.random() * 0.55
        const geo = new THREE.BoxGeometry(0.12, bh, 0.06)
        const mat = new THREE.MeshStandardMaterial({
          color: i < 5 ? 0x22c55e : 0x7c3aed,
          emissive: i < 5 ? 0x14532d : 0x4c1d95,
          emissiveIntensity: 0.35,
          transparent: true,
          opacity: 0.9,
        })
        const m = new THREE.Mesh(geo, mat)
        m.position.set(-1.05 + i * 0.22, -0.55 + bh / 2, 0.1)
        barGroup.add(m)
        bars.push(m)
      }
      scene.add(barGroup)

      const nodeGeo = new THREE.BoxGeometry(0.3, 0.3, 0.12)
      const momMat = new THREE.MeshStandardMaterial({
        color: 0x22c55e,
        emissive: 0x14532d,
        emissiveIntensity: 0.55,
      })
      const flowMat = new THREE.MeshStandardMaterial({
        color: 0xa855f7,
        emissive: 0x4c1d95,
        emissiveIntensity: 0.55,
      })
      const momNode = new THREE.Mesh(nodeGeo, momMat)
      momNode.position.set(-0.9, -0.32, 0.14)
      momNode.userData.action = 'MOMENTUM' satisfies HitAction
      const flowNode = new THREE.Mesh(nodeGeo, flowMat)
      flowNode.position.set(0.9, -0.32, 0.14)
      flowNode.userData.action = 'FLOW' satisfies HitAction
      scene.add(momNode, flowNode)

      const raycaster = new THREE.Raycaster()
      const pointer = new THREE.Vector2()
      const targets = [wall, momNode, flowNode]

      const flash = (mesh: THREE.Mesh) => {
        const m = mesh.material as THREE.MeshStandardMaterial
        const prev = m.emissiveIntensity
        m.emissiveIntensity = 1.5
        setTimeout(() => {
          m.emissiveIntensity = prev
        }, 200)
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
        else flash(wall)
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
        atmo.uniforms.uPulseSpeed.value = spdRef.current * (1 + (highVol ? 0.35 : 0))
        const c = colRef.current
        if (highVol) atmo.uniforms.uColor.value.set(c[0] * 0.55 + 0.45, c[1] * 0.4 + 0.15, c[2] * 0.55 + 0.55)
        else atmo.uniforms.uColor.value.set(c[0], c[1], c[2])

        wallMat.emissiveIntensity = 0.35 + Math.abs(s) * 0.45 + v * 0.2
        amb.intensity = 0.35 + Math.max(0, s) * 0.25 + (highVol ? 0.15 : 0)
        wall.rotation.y = Math.sin(Date.now() / Math.max(600, 1200 - v * 800)) * (0.02 + Math.abs(s) * 0.03)

        bars.forEach((b, i) => {
          const base = 0.12 + ((Math.sin(t * 1.4 + i * 0.55) + 1) / 2) * (0.25 + v * 0.5)
          const bias = i < 5 ? Math.max(0, s) * 0.35 : Math.max(0, -s) * 0.25 + v * 0.2
          const bh = Math.min(0.85, base + bias)
          b.scale.y = bh / 0.4
          b.position.y = -0.55 + (bh * b.scale.y) / 2
        })

        momNode.rotation.y = t * 0.6
        flowNode.rotation.y = -t * 0.55
        renderer.render(scene, camera)
      }
      animate()

      const onResize = () => {
        const nw = host.clientWidth || 320
        const nh = Math.max(300, Math.floor(nw * 0.5))
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
        nodeGeo.dispose()
        momMat.dispose()
        flowMat.dispose()
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

  const bullPct = Math.round(50 + Math.max(-40, Math.min(40, sentiment * 50)))

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-black/40">
      <div className="absolute top-2 left-3 z-10 flex flex-wrap gap-2 pointer-events-none">
        <span className="text-[9px] uppercase tracking-wider text-cyan-300/90 font-tech">LIVE · COMMAND CENTER</span>
        <span className="text-[9px] rounded-full border border-white/15 px-2 py-0.5 text-zinc-300">
          {sentiment >= 0 ? 'BULLISH' : 'BEARISH'} {bullPct}%
        </span>
        <span className="text-[9px] rounded-full border border-violet-500/30 px-2 py-0.5 text-violet-200/90">
          vol {(volatility * 100).toFixed(0)}%
        </span>
      </div>
      <div ref={hostRef} className="w-full min-h-[300px]" />
      <p className="absolute bottom-2 left-3 right-3 text-[10px] text-zinc-500 pointer-events-none">
        vert = momentum · violet = flux · mur = Pulse
      </p>
    </div>
  )
}
