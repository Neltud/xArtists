/**
 * Holographic slot terminal — lightweight Three.js (Command Center / Slot page).
 * No re-render loop: refs only; result lights via imperative API.
 */
import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import * as THREE from 'three'

export type SlotHoloHandle = {
  setOutcome: (o: 'idle' | 'spin' | 'win' | 'loss' | 'jackpot') => void
}

type Props = {
  className?: string
  height?: number
}

const SlotHoloTerminal = forwardRef<SlotHoloHandle, Props>(function SlotHoloTerminal(
  { className = '', height = 220 },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null)
  const outcomeRef = useRef<'idle' | 'spin' | 'win' | 'loss' | 'jackpot'>('idle')
  const lightRef = useRef<THREE.PointLight | null>(null)
  const particlesRef = useRef<THREE.Points | null>(null)
  const reelRef = useRef<THREE.Group | null>(null)

  useImperativeHandle(ref, () => ({
    setOutcome: o => {
      outcomeRef.current = o
    },
  }))

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const w = host.clientWidth || 320
    const h = height
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x030308)

    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 50)
    camera.position.set(0, 0.35, 3.2)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    host.appendChild(renderer.domElement)

    const amb = new THREE.AmbientLight(0xffffff, 0.35)
    scene.add(amb)
    const pt = new THREE.PointLight(0x22d3ee, 1.2, 12)
    pt.position.set(0.5, 1.5, 2)
    scene.add(pt)
    lightRef.current = pt

    // Cabinet
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 2.0, 0.7),
      new THREE.MeshStandardMaterial({
        color: 0x0a0a14,
        metalness: 0.55,
        roughness: 0.35,
        emissive: 0x0e7490,
        emissiveIntensity: 0.25,
      }),
    )
    body.position.y = 0.1
    scene.add(body)

    // Screen plane
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.7),
      new THREE.MeshStandardMaterial({
        color: 0x020617,
        emissive: 0x22d3ee,
        emissiveIntensity: 0.4,
        metalness: 0.2,
        roughness: 0.5,
      }),
    )
    screen.position.set(0, 0.55, 0.36)
    scene.add(screen)

    // Reels group
    const reels = new THREE.Group()
    reels.position.set(0, 0.55, 0.38)
    for (let i = 0; i < 3; i++) {
      const r = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 0.5, 12),
        new THREE.MeshStandardMaterial({
          color: 0x111827,
          emissive: 0x67e8f9,
          emissiveIntensity: 0.3,
        }),
      )
      r.rotation.z = Math.PI / 2
      r.position.x = (i - 1) * 0.32
      reels.add(r)
    }
    scene.add(reels)
    reelRef.current = reels

    // Particles
    const count = 80
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 2
      pos[i * 3 + 1] = Math.random() * 2
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1.5
    }
    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const pMat = new THREE.PointsMaterial({
      color: 0x67e8f9,
      size: 0.04,
      transparent: true,
      opacity: 0,
    })
    const pts = new THREE.Points(pGeo, pMat)
    scene.add(pts)
    particlesRef.current = pts

    let raf = 0
    const t0 = performance.now()
    const loop = () => {
      raf = requestAnimationFrame(loop)
      const t = (performance.now() - t0) / 1000
      const o = outcomeRef.current

      if (reelRef.current) {
        const spin = o === 'spin' ? 12 : o === 'jackpot' ? 2 : 0.4
        reelRef.current.children.forEach((c, i) => {
          c.rotation.x += (spin + i * 0.3) * 0.05
        })
      }

      if (lightRef.current) {
        if (o === 'win' || o === 'jackpot') {
          lightRef.current.color.setHex(o === 'jackpot' ? 0xfbbf24 : 0x22d3ee)
          lightRef.current.intensity = 1.4 + Math.sin(t * 8) * 0.4
        } else if (o === 'loss') {
          lightRef.current.color.setHex(0xf59e0b)
          lightRef.current.intensity = 0.7
        } else if (o === 'spin') {
          lightRef.current.color.setHex(0xa78bfa)
          lightRef.current.intensity = 1.1 + Math.sin(t * 14) * 0.3
        } else {
          lightRef.current.color.setHex(0x22d3ee)
          lightRef.current.intensity = 0.9
        }
      }

      if (particlesRef.current) {
        const mat = particlesRef.current.material as THREE.PointsMaterial
        if (o === 'jackpot' || o === 'win') {
          mat.opacity = Math.min(1, mat.opacity + 0.05)
          mat.color.setHex(o === 'jackpot' ? 0xfbbf24 : 0x67e8f9)
          const arr = particlesRef.current.geometry.attributes.position.array as Float32Array
          for (let i = 0; i < count; i++) {
            arr[i * 3 + 1] += 0.02 + (o === 'jackpot' ? 0.03 : 0)
            if (arr[i * 3 + 1] > 2.2) arr[i * 3 + 1] = 0
          }
          particlesRef.current.geometry.attributes.position.needsUpdate = true
        } else {
          mat.opacity = Math.max(0, mat.opacity - 0.03)
        }
      }

      body.rotation.y = Math.sin(t * 0.4) * 0.08
      renderer.render(scene, camera)
    }
    loop()

    const onResize = () => {
      const nw = host.clientWidth || 320
      camera.aspect = nw / h
      camera.updateProjectionMatrix()
      renderer.setSize(nw, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      pGeo.dispose()
      pMat.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement)
      lightRef.current = null
      particlesRef.current = null
      reelRef.current = null
    }
  }, [height])

  return (
    <div
      ref={hostRef}
      className={`w-full overflow-hidden rounded-2xl border border-cyan-500/25 bg-black/60 ${className}`}
      style={{ height }}
      aria-hidden
    />
  )
})

export default SlotHoloTerminal
