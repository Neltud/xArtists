/**
 * Command wall 3D — momentum / flow / pulse + live EGLD bar series.
 * Geometry/material dispose on unmount.
 */
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { createPulseAtmosphereMesh } from './PulseAtmosphere'
import { fetchEgldSeries, seriesToBarHeights } from '../lib/livePrices'

type HitAction = 'MOMENTUM' | 'FLOW' | 'PULSE'

type Props = {
  sentiment?: number
  volatility?: number
  interactive?: boolean
  pulseSpeed?: number
  color?: [number, number, number]
}

function disposeScene(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
  scene.traverse(obj => {
    const m = obj as THREE.Mesh
    if (m.geometry) m.geometry.dispose()
    const mat = m.material as THREE.Material | THREE.Material[] | undefined
    if (mat) {
      const list = Array.isArray(mat) ? mat : [mat]
      for (const material of list) {
        const std = material as THREE.MeshStandardMaterial
        if (std.map) std.map.dispose()
        material.dispose()
      }
    }
  })
  renderer.dispose()
}

export default function CommandWall({
  sentiment = 0,
  volatility = 0.35,
  interactive = true,
  pulseSpeed = 1,
  color = [0.2, 0.7, 0.9],
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const sentRef = useRef(sentiment)
  const volRef = useRef(volatility)
  const spdRef = useRef(pulseSpeed)
  const colRef = useRef(color)
  const heightsRef = useRef<number[]>([])
  const [priceLabel, setPriceLabel] = useState<string>('')
  const [liveOk, setLiveOk] = useState(false)
  sentRef.current = sentiment
  volRef.current = volatility
  spdRef.current = pulseSpeed
  colRef.current = color

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const series = await fetchEgldSeries(10)
      if (cancelled) return
      heightsRef.current = seriesToBarHeights(series)
      const last = series[series.length - 1]
      setPriceLabel(`EGLD $${last.toFixed(2)}`)
      setLiveOk(series.length >= 4)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const w = host.clientWidth || 320
    const h = Math.max(300, Math.floor(w * 0.5))

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x05050a)
    const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100)
    camera.position.set(0, 0.4, 3.35)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    host.appendChild(renderer.domElement)

    const amb = new THREE.AmbientLight(0xffffff, 0.45)
    scene.add(amb)
    const dir = new THREE.DirectionalLight(0xaaccff, 0.85)
    dir.position.set(2, 3, 4)
    scene.add(dir)

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x12121a,
      metalness: 0.45,
      roughness: 0.4,
      emissive: 0x112233,
      emissiveIntensity: 0.35,
    })
    const wall = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.4, 0.08), wallMat)
    wall.userData.action = 'PULSE' satisfies HitAction
    scene.add(wall)

    const atmo = createPulseAtmosphereMesh()
    atmo.position.z = 0.06
    scene.add(atmo)

    const bars: THREE.Mesh[] = []
    for (let i = 0; i < 10; i++) {
      const geo = new THREE.BoxGeometry(0.12, 0.4, 0.06)
      const mat = new THREE.MeshStandardMaterial({
        color: i < 5 ? 0x22c55e : 0x7c3aed,
        emissive: i < 5 ? 0x14532d : 0x4c1d95,
        emissiveIntensity: 0.35,
        transparent: true,
        opacity: 0.9,
      })
      const m = new THREE.Mesh(geo, mat)
      m.position.set(-1.05 + i * 0.22, -0.35, 0.1)
      scene.add(m)
      bars.push(m)
    }

    const nodeGeo = new THREE.BoxGeometry(0.3, 0.3, 0.12)
    const momNode = new THREE.Mesh(
      nodeGeo,
      new THREE.MeshStandardMaterial({
        color: 0x22c55e,
        emissive: 0x14532d,
        emissiveIntensity: 0.55,
      }),
    )
    momNode.position.set(-0.9, -0.32, 0.14)
    momNode.userData.action = 'MOMENTUM' satisfies HitAction
    const flowNode = new THREE.Mesh(
      nodeGeo.clone(),
      new THREE.MeshStandardMaterial({
        color: 0xa855f7,
        emissive: 0x4c1d95,
        emissiveIntensity: 0.55,
      }),
    )
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
      if ('uPulseSpeed' in atmo.uniforms) {
        ;(atmo.uniforms as { uPulseSpeed: { value: number } }).uPulseSpeed.value =
          spdRef.current * (1 + (highVol ? 0.35 : 0))
      }
      wallMat.emissiveIntensity = 0.35 + Math.abs(s) * 0.45 + v * 0.2
      amb.intensity = 0.35 + Math.max(0, s) * 0.25 + (highVol ? 0.15 : 0)
      wall.rotation.y = Math.sin(Date.now() / Math.max(600, 1200 - v * 800)) * (0.02 + Math.abs(s) * 0.03)

      const hs = heightsRef.current
      bars.forEach((b, i) => {
        const target =
          hs[i] ??
          0.12 + ((Math.sin(t * 1.4 + i * 0.55) + 1) / 2) * (0.25 + v * 0.5)
        const hNow = target * (0.92 + Math.sin(t * 2 + i) * 0.04)
        b.scale.y = hNow / 0.4
        b.position.y = -0.55 + (0.4 * b.scale.y) / 2
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
      disposeScene(scene, renderer)
      if (host.contains(renderer.domElement)) host.removeChild(renderer.domElement)
    }
  }, [interactive])

  const bullPct = Math.round(50 + Math.max(-40, Math.min(40, sentiment * 50)))

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-black/40">
      <div className="absolute top-2 left-3 z-10 flex flex-wrap gap-2 pointer-events-none">
        <span className="text-[9px] uppercase tracking-wider text-cyan-300/90 font-tech">
          LIVE · COMMAND CENTER
        </span>
        <span className="text-[9px] rounded-full border border-white/15 px-2 py-0.5 text-zinc-300">
          {sentiment >= 0 ? 'BULLISH' : 'BEARISH'} {bullPct}%
        </span>
        <span className="text-[9px] rounded-full border border-violet-500/30 px-2 py-0.5 text-violet-200/90">
          vol {(volatility * 100).toFixed(0)}%
        </span>
        {priceLabel ? (
          <span
            className={`text-[9px] rounded-full border px-2 py-0.5 ${
              liveOk
                ? 'border-emerald-500/30 text-emerald-200/90'
                : 'border-white/10 text-zinc-500'
            }`}
          >
            {priceLabel}
            {liveOk ? '' : ' · synth'}
          </span>
        ) : null}
      </div>
      <div ref={hostRef} className="w-full min-h-[300px]" />
      <p className="absolute bottom-2 left-3 right-3 text-[10px] text-zinc-500 pointer-events-none">
        vert = momentum · violet = flux · mur = Pulse · barres = série EGLD (indexeur)
      </p>
    </div>
  )
}
