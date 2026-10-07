/**
 * Command wall 3D — real signal nodes (momentum / flow / pulse).
 * FIX: createPulseAtmosphereMesh() returns { mesh, uniforms, dispose } — never atmo.position.
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
    const h = Math.max(300, Math.floor(w * 0.5))

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x05050a)
    const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100)
    camera.position.set(0, 0.4, 3.35)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    host.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.45))
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

    // CRITICAL FIX: pack is { mesh, uniforms, dispose }
    const atmoPack = createPulseAtmosphereMesh()
    const atmoMesh = atmoPack.mesh
    if (atmoMesh?.position) atmoMesh.position.z = 0.06
    scene.add(atmoMesh)
    const atmoUniforms = atmoPack.uniforms

    const barGroup = new THREE.Group()
    const bars: THREE.Mesh[] = []
    for (let i = 0; i < 10; i++) {
      const bh = 0.15 + Math.random() * 0.55
      const geo = new THREE.BoxGeometry(0.12, bh, 0.06)
      const mat = new THREE.MeshStandardMaterial({
        color: i < 5 ? 0x22c55e : 0xa855f7,
        emissive: i < 5 ? 0x14532d : 0x4c1d95,
        emissiveIntensity: 0.35,
        metalness: 0.3,
        roughness: 0.45,
      })
      const m = new THREE.Mesh(geo, mat)
      m.position.set(-1.05 + i * 0.22, -0.55 + bh / 2, 0.1)
      bars.push(m)
      barGroup.add(m)
    }
    scene.add(barGroup)

    const nodeGeo = new THREE.SphereGeometry(0.11, 20, 20)
    const momNode = new THREE.Mesh(
      nodeGeo,
      new THREE.MeshStandardMaterial({
        color: 0x22c55e,
        emissive: 0x16a34a,
        emissiveIntensity: 0.7,
        metalness: 0.4,
        roughness: 0.3,
      }),
    )
    momNode.position.set(-0.9, -0.32, 0.14)
    momNode.userData.action = 'MOMENTUM' satisfies HitAction

    const flowNode = new THREE.Mesh(
      nodeGeo.clone(),
      new THREE.MeshStandardMaterial({
        color: 0xa855f7,
        emissive: 0x7c3aed,
        emissiveIntensity: 0.7,
        metalness: 0.4,
        roughness: 0.3,
      }),
    )
    flowNode.position.set(0.9, -0.32, 0.14)
    flowNode.userData.action = 'FLOW' satisfies HitAction
    scene.add(momNode, flowNode)

    const side1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.9, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x1e293b }),
    )
    side1.position.set(-1.2, 0.1, 0)
    const side2 = side1.clone()
    side2.position.x = 1.2
    scene.add(side1, side2)

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const targets = [wall, momNode, flowNode]

    const flash = (mesh: THREE.Mesh) => {
      const m = mesh.material as THREE.MeshStandardMaterial
      if (!m || m.emissiveIntensity == null) return
      const prev = m.emissiveIntensity
      m.emissiveIntensity = 1.5
      window.setTimeout(() => {
        m.emissiveIntensity = prev
      }, 220)
    }

    const onPointer = (ev: PointerEvent) => {
      if (!interactive) return
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObjects(targets, false)
      if (!hits.length) return
      const mesh = hits[0].object as THREE.Mesh
      flash(mesh)
      const action = mesh.userData.action as HitAction
      if (action === 'MOMENTUM') {
        window.dispatchEvent(new CustomEvent('xartists:cc-signal', { detail: { kind: 'momentum' } }))
      } else if (action === 'FLOW') {
        window.dispatchEvent(new CustomEvent('xartists:cc-signal', { detail: { kind: 'flow' } }))
      } else {
        window.dispatchEvent(new CustomEvent('xartists:cc-signal', { detail: { kind: 'pulse' } }))
      }
    }
    renderer.domElement.style.cursor = interactive ? 'pointer' : 'default'
    renderer.domElement.addEventListener('pointerdown', onPointer)

    let raf = 0
    const t0 = performance.now()
    const animate = () => {
      raf = requestAnimationFrame(animate)
      const t = (performance.now() - t0) / 1000
      const s = sentRef.current
      const v = volRef.current

      if (atmoUniforms) {
        atmoUniforms.uTime.value = t
        atmoUniforms.uSentiment.value = s
        atmoUniforms.uVolatility.value = v
        if ('uPulseSpeed' in atmoUniforms) {
          ;(atmoUniforms as { uPulseSpeed: { value: number } }).uPulseSpeed.value =
            spdRef.current || 1
        }
        if ('uColor' in atmoUniforms && colRef.current) {
          const c = colRef.current
          try {
            ;(atmoUniforms as { uColor: { value: THREE.Vector3 } }).uColor.value.set(
              c[0],
              c[1],
              c[2],
            )
          } catch {
            /* */
          }
        }
      }

      bars.forEach((b, i) => {
        const base = 0.2 + Math.abs(Math.sin(t * (1.2 + i * 0.15) + i)) * (0.4 + v * 0.5)
        const h = base * (0.7 + (s + 1) * 0.2)
        b.scale.y = Math.max(0.15, h)
        b.position.y = -0.55 + (h * b.scale.y) / 2
      })

      momNode.position.y = -0.32 + Math.sin(t * 2.1) * 0.04
      flowNode.position.y = -0.32 + Math.sin(t * 2.4 + 1) * 0.04

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
      try {
        atmoPack.dispose()
      } catch {
        /* */
      }
      renderer.dispose()
      if (host.contains(renderer.domElement)) host.removeChild(renderer.domElement)
    }
  }, [interactive])

  return <div ref={hostRef} className="w-full min-h-[300px] rounded-2xl overflow-hidden" />
}
