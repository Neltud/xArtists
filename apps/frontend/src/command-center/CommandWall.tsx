/**
 * CommandWall — interactive 3D wall + volatility noise / ambient intensity.
 */
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import ProjectionBridge from './ProjectionBridge'
import { createPulseAtmosphereMesh } from './PulseAtmosphere'
import { empireTxStart } from '../store/empireStore'

type Props = {
  sentiment?: number
  volatility?: number
  pulseSpeed?: number
  colorRgb?: [number, number, number]
  className?: string
  interactive?: boolean
}

type HitAction = 'STAKE' | 'MARKET' | 'PULSE'

export default function CommandWall({
  sentiment = 0,
  volatility = 0.3,
  pulseSpeed = 1,
  colorRgb,
  className = '',
  interactive = true,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const meshMatRef = useRef<THREE.MeshStandardMaterial | null>(null)
  const lightRef = useRef<THREE.PointLight | null>(null)
  const ambRef = useRef<THREE.AmbientLight | null>(null)
  const wallRef = useRef<THREE.Mesh | null>(null)
  const sentRef = useRef(sentiment)
  const volRef = useRef(volatility)
  const spdRef = useRef(pulseSpeed)
  const colRef = useRef<[number, number, number] | null>(colorRgb || null)
  sentRef.current = sentiment
  volRef.current = volatility
  spdRef.current = pulseSpeed
  colRef.current = colorRgb || null

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const w = host.clientWidth || 640
    const h = Math.max(280, Math.floor(w * 0.45))

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x05050a)

    const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100)
    camera.position.set(0, 0.2, 2.4)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    host.appendChild(renderer.domElement)

    const amb = new THREE.AmbientLight(0xffffff, 0.45)
    scene.add(amb)
    ambRef.current = amb

    const pt = new THREE.PointLight(0x22d3ee, 1.1, 14)
    pt.position.set(1, 2, 3)
    scene.add(pt)
    lightRef.current = pt

    const geo = new THREE.BoxGeometry(2.2, 1.2, 0.08)
    const mat = new THREE.MeshStandardMaterial({
      color: 0x0a0a12,
      emissive: 0x0e7490,
      emissiveIntensity: 0.4,
      metalness: 0.45,
      roughness: 0.32,
    })
    meshMatRef.current = mat
    const wall = new THREE.Mesh(geo, mat)
    wall.userData.action = 'PULSE' as HitAction
    scene.add(wall)
    wallRef.current = wall

    const atmo = createPulseAtmosphereMesh()
    scene.add(atmo.mesh)

    const nodeGeo = new THREE.BoxGeometry(0.35, 0.35, 0.12)
    const stakeMat = new THREE.MeshStandardMaterial({
      color: 0x0a1a12,
      emissive: 0x34d399,
      emissiveIntensity: 0.55,
      metalness: 0.5,
      roughness: 0.3,
    })
    const stakeNode = new THREE.Mesh(nodeGeo, stakeMat)
    stakeNode.position.set(-0.7, -0.15, 0.12)
    stakeNode.userData.action = 'STAKE' as HitAction
    scene.add(stakeNode)

    const marketMat = new THREE.MeshStandardMaterial({
      color: 0x120a1a,
      emissive: 0xa78bfa,
      emissiveIntensity: 0.5,
      metalness: 0.5,
      roughness: 0.3,
    })
    const marketNode = new THREE.Mesh(nodeGeo, marketMat)
    marketNode.position.set(0.7, -0.15, 0.12)
    marketNode.userData.action = 'MARKET' as HitAction
    scene.add(marketNode)

    const side = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 1.4, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x111118, metalness: 0.6, roughness: 0.3 }),
    )
    side.position.set(-1.2, 0, -0.2)
    scene.add(side)
    const side2 = side.clone()
    side2.position.x = 1.2
    scene.add(side2)

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const targets = [wall, stakeNode, marketNode]

    const flash = (mesh: THREE.Mesh) => {
      const m = mesh.material as THREE.MeshStandardMaterial
      const prev = m.emissiveIntensity
      m.emissiveIntensity = 1.4
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
      if (action === 'STAKE') {
        empireTxStart('CommandWall → Stake TRO')
        window.location.hash = '#/staking'
      } else if (action === 'MARKET') {
        empireTxStart('CommandWall → Marketplace')
        window.location.hash = '#/marketplace'
      } else {
        empireTxStart('CommandWall → Pulse inspect')
      }
    }
    renderer.domElement.style.cursor = interactive ? 'pointer' : 'default'
    renderer.domElement.addEventListener('pointerdown', onPointer)

    let raf = 0
    const t0 = performance.now()
    const animate = () => {
      raf = requestAnimationFrame(animate)
      const s = sentRef.current
      const v = volRef.current
      const bullish = s >= 0
      const highVol = v > 0.55
      const t = (performance.now() - t0) / 1000

      atmo.uniforms.uTime.value = t
      atmo.uniforms.uSentiment.value = s
      atmo.uniforms.uVolatility.value = v
      if ('uPulseSpeed' in atmo.uniforms) {
        ;(atmo.uniforms as { uPulseSpeed: { value: number } }).uPulseSpeed.value =
          spdRef.current * (1 + (highVol ? 0.35 : 0))
      }
      if ('uColor' in atmo.uniforms && colRef.current) {
        const c = colRef.current
        // High vol → mix toward electric violet
        if (highVol) {
          ;(atmo.uniforms as { uColor: { value: THREE.Vector3 } }).uColor.value.set(
            c[0] * 0.55 + 0.45,
            c[1] * 0.4 + 0.15,
            c[2] * 0.55 + 0.55,
          )
        } else {
          ;(atmo.uniforms as { uColor: { value: THREE.Vector3 } }).uColor.value.set(c[0], c[1], c[2])
        }
      }

      if (meshMatRef.current) {
        if (highVol) {
          meshMatRef.current.emissive.setHex(0x5b21b6)
          meshMatRef.current.emissiveIntensity = 0.55 + v * 0.55
        } else {
          meshMatRef.current.emissive.setHex(bullish ? 0x0e7490 : 0x7f1d1d)
          meshMatRef.current.emissiveIntensity = 0.35 + Math.abs(s) * 0.45 + v * 0.2
        }
      }
      if (lightRef.current) {
        lightRef.current.color.setHex(highVol ? 0xa78bfa : bullish ? 0x22d3ee : 0xf43f5e)
        lightRef.current.intensity = 0.9 + Math.abs(s) * 0.8 + v * 0.7
      }
      if (ambRef.current) {
        // Low liquidity proxy = low |sentiment| + low vol → dim
        const lowEnergy = Math.abs(s) < 0.15 && v < 0.35
        ambRef.current.intensity = lowEnergy ? 0.22 : 0.35 + Math.max(0, s) * 0.25 + (highVol ? 0.15 : 0)
      }
      const speed = bullish ? 5000 - Math.abs(s) * 1500 : 2200 - v * 800
      if (wallRef.current) {
        const amp = 0.06 + v * 0.12
        wallRef.current.rotation.y = Math.sin(Date.now() / Math.max(speed, 600)) * amp
        // Noise / micro-shake when high volatility
        if (highVol) {
          wallRef.current.position.x = (Math.random() - 0.5) * 0.04 * v
          wallRef.current.position.y = (Math.random() - 0.5) * 0.02 * v
        } else if (v > 0.4 && Math.random() > 0.9) {
          wallRef.current.position.x = (Math.random() - 0.5) * 0.015
        } else {
          wallRef.current.position.x *= 0.85
          wallRef.current.position.y *= 0.85
        }
      }
      stakeNode.rotation.y += 0.01 + v * 0.01
      marketNode.rotation.y -= 0.01 + v * 0.01
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      const nw = host.clientWidth || 640
      const nh = Math.max(280, Math.floor(nw * 0.45))
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
      renderer.setSize(nw, nh)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      renderer.domElement.removeEventListener('pointerdown', onPointer)
      geo.dispose()
      mat.dispose()
      nodeGeo.dispose()
      stakeMat.dispose()
      marketMat.dispose()
      atmo.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement)
      meshMatRef.current = null
      wallRef.current = null
      lightRef.current = null
      ambRef.current = null
    }
  }, [interactive])

  const onTexture = (tex: THREE.CanvasTexture) => {
    const mat = meshMatRef.current
    if (!mat) return
    mat.map = tex
    mat.emissiveMap = tex
    mat.needsUpdate = true
  }

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-cyan-500/20 ${className}`}
    >
      <div ref={hostRef} className="w-full min-h-[280px]" />
      <ProjectionBridge sentiment={sentiment} onTexture={onTexture} />
      {interactive && (
        <p className="absolute bottom-2 left-3 right-3 text-[9px] text-zinc-500 pointer-events-none">
          vert = Stake · violet = Market · mur = Pulse · vol {volatility.toFixed(2)}
        </p>
      )}
    </div>
  )
}
