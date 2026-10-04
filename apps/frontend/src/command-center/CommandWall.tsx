/**
 * Command wall 3D — sentiment / volatility driven.
 * Pulse inspect = local UI only (never starts TX watchdog).
 */
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { createPulseAtmosphereMesh } from './PulseAtmosphere'
import { empireTxStart } from '../store/empireStore'

type HitAction = 'STAKE' | 'MARKET' | 'PULSE'

type Props = {
  sentiment?: number
  volatility?: number
  interactive?: boolean
  pulseSpeed?: number
  color?: [number, number, number]
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
  sentRef.current = sentiment
  volRef.current = volatility
  spdRef.current = pulseSpeed
  colRef.current = color

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const w = host.clientWidth || 320
    const h = Math.max(280, Math.floor(w * 0.45))

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x05050a)
    const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100)
    camera.position.set(0, 0.35, 3.2)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    host.appendChild(renderer.domElement)

    const amb = new THREE.AmbientLight(0xffffff, 0.45)
    scene.add(amb)
    const dir = new THREE.DirectionalLight(0xaaccff, 0.8)
    dir.position.set(2, 3, 4)
    scene.add(dir)

    const wallGeo = new THREE.BoxGeometry(2.4, 1.35, 0.08)
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
    atmo.position.z = 0.06
    scene.add(atmo)

    const nodeGeo = new THREE.BoxGeometry(0.28, 0.28, 0.12)
    const stakeMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x14532d,
      emissiveIntensity: 0.5,
    })
    const marketMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x4c1d95,
      emissiveIntensity: 0.5,
    })
    const stakeNode = new THREE.Mesh(nodeGeo, stakeMat)
    stakeNode.position.set(-0.85, -0.35, 0.12)
    stakeNode.userData.action = 'STAKE' satisfies HitAction
    const marketNode = new THREE.Mesh(nodeGeo, marketMat)
    marketNode.position.set(0.85, -0.35, 0.12)
    marketNode.userData.action = 'MARKET' satisfies HitAction
    scene.add(stakeNode, marketNode)

    const side1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.9, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x1e293b }),
    )
    side1.position.set(-1.15, 0.1, 0)
    const side2 = side1.clone()
    side2.position.x = 1.15
    scene.add(side1, side2)

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const targets = [wall, stakeNode, marketNode]
    const meshMatRef = { current: wallMat }
    const ambRef = { current: amb }
    const wallRef = { current: wall }

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
        // Pulse inspect = visual only — do NOT arm 45s network watchdog
        flash(wall)
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
        meshMatRef.current.emissiveIntensity = 0.35 + Math.abs(s) * 0.45 + v * 0.2
      }
      if (ambRef.current) {
        ambRef.current.intensity = 0.35 + Math.max(0, s) * 0.25 + (highVol ? 0.15 : 0)
      }
      if (wallRef.current) {
        const speed = Math.max(600, 1200 - v * 800)
        const amp = 0.02 + Math.abs(s) * 0.03
        wallRef.current.rotation.y = Math.sin(Date.now() / speed) * amp
      }
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      const nw = host.clientWidth || 320
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
      renderer.dispose()
      host.removeChild(renderer.domElement)
    }
  }, [interactive])

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-black/40">
      <div ref={hostRef} className="w-full min-h-[280px]" />
      <p className="absolute bottom-2 left-3 right-3 text-[10px] text-zinc-500 pointer-events-none">
        vert = Stake · violet = Market · mur = Pulse (inspect local, pas de TX)
      </p>
    </div>
  )
}
