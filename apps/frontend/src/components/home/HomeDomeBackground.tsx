/**
 * Dôme 360° WebGL — fond fixed inset-0, rotation orbitale douce, dispose strict.
 * Pas d’écran noir : fond CSS + loader discret jusqu’à sceneReady.
 */
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

const TEX_FPS = 1000 / 24 // fond léger

export default function HomeDomeBackground() {
  const mountRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const host = mountRef.current
    if (!host) return

    let disposed = false
    let raf = 0
    let renderer: THREE.WebGLRenderer | null = null
    const disposables: { dispose: () => void }[] = []

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x05050c)
    scene.fog = new THREE.FogExp2(0x08061a, 0.035)

    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200)
    camera.position.set(0, 1.2, 0.01)

    try {
      const isMobile = window.innerWidth < 768 || window.devicePixelRatio <= 1.5
      renderer = new THREE.WebGLRenderer({
        antialias: !isMobile,
        alpha: false,
        powerPreference: 'high-performance',
      })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.15 : 1.5))
      renderer.setSize(host.clientWidth || window.innerWidth, host.clientHeight || window.innerHeight, false)
      renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;pointer-events:none'
      host.appendChild(renderer.domElement)

      // Hemisphere / sky dome (inverted sphere)
      const domeGeo = new THREE.SphereGeometry(40, isMobile ? 32 : 48, isMobile ? 24 : 32)
      const domeCanvas = document.createElement('canvas')
      domeCanvas.width = isMobile ? 512 : 1024
      domeCanvas.height = isMobile ? 256 : 512
      const dctx = domeCanvas.getContext('2d')!
      const grad = dctx.createLinearGradient(0, 0, 0, domeCanvas.height)
      grad.addColorStop(0, '#0a0618')
      grad.addColorStop(0.35, '#1a0a3a')
      grad.addColorStop(0.55, '#2d1b69')
      grad.addColorStop(0.75, '#0e7490')
      grad.addColorStop(1, '#020617')
      dctx.fillStyle = grad
      dctx.fillRect(0, 0, domeCanvas.width, domeCanvas.height)
      // stars
      for (let i = 0; i < (isMobile ? 80 : 180); i++) {
        const x = Math.random() * domeCanvas.width
        const y = Math.random() * domeCanvas.height * 0.7
        dctx.fillStyle = `rgba(255,255,255,${0.25 + Math.random() * 0.7})`
        dctx.fillRect(x, y, Math.random() > 0.9 ? 2 : 1, Math.random() > 0.9 ? 2 : 1)
      }
      // nebula blobs
      for (let i = 0; i < 5; i++) {
        const x = Math.random() * domeCanvas.width
        const y = Math.random() * domeCanvas.height * 0.5
        const r = 40 + Math.random() * 80
        const g2 = dctx.createRadialGradient(x, y, 0, x, y, r)
        g2.addColorStop(0, `rgba(${120 + i * 20},80,255,0.12)`)
        g2.addColorStop(1, 'rgba(0,0,0,0)')
        dctx.fillStyle = g2
        dctx.fillRect(x - r, y - r, r * 2, r * 2)
      }
      const domeTex = new THREE.CanvasTexture(domeCanvas)
      domeTex.colorSpace = THREE.SRGBColorSpace
      disposables.push(domeTex)
      const domeMat = new THREE.MeshBasicMaterial({
        map: domeTex,
        side: THREE.BackSide,
        depthWrite: false,
      })
      disposables.push(domeMat)
      disposables.push(domeGeo)
      const dome = new THREE.Mesh(domeGeo, domeMat)
      scene.add(dome)

      // Wireframe inner ring (cyber)
      const ringGeo = new THREE.SphereGeometry(38.5, 24, 16)
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x7c3aed,
        wireframe: true,
        transparent: true,
        opacity: 0.08,
        side: THREE.BackSide,
        depthWrite: false,
      })
      disposables.push(ringGeo, ringMat)
      const ring = new THREE.Mesh(ringGeo, ringMat)
      scene.add(ring)

      // Floor grid hint
      const grid = new THREE.GridHelper(30, 40, 0x4c1d95, 0x1e1b4b)
      grid.position.y = -1.2
      ;(grid.material as THREE.Material).transparent = true
      ;(grid.material as THREE.Material).opacity = 0.35
      scene.add(grid)

      const clock = new THREE.Clock()
      let last = 0

      const animate = () => {
        if (disposed || !renderer) return
        raf = requestAnimationFrame(animate)
        const t = clock.getElapsedTime()
        const now = performance.now()
        // soft orbital yaw
        camera.position.x = Math.sin(t * 0.06) * 0.35
        camera.position.z = Math.cos(t * 0.06) * 0.35
        camera.position.y = 1.15 + Math.sin(t * 0.12) * 0.05
        camera.lookAt(0, 1.1, -8)
        dome.rotation.y = t * 0.02
        ring.rotation.y = -t * 0.015
        if (now - last >= TEX_FPS) {
          last = now
        }
        try {
          renderer.render(scene, camera)
        } catch {
          /* */
        }
      }
      animate()
      setReady(true)

      const onResize = () => {
        if (!renderer || disposed) return
        const w = host.clientWidth || window.innerWidth
        const h = host.clientHeight || window.innerHeight
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h, false)
      }
      window.addEventListener('resize', onResize)

      return () => {
        disposed = true
        cancelAnimationFrame(raf)
        window.removeEventListener('resize', onResize)
        disposables.forEach(d => {
          try {
            d.dispose()
          } catch {
            /* */
          }
        })
        scene.traverse(obj => {
          const mesh = obj as THREE.Mesh
          if (mesh.geometry) mesh.geometry.dispose()
          const mat = mesh.material
          if (mat) {
            const list = Array.isArray(mat) ? mat : [mat]
            list.forEach(m => m.dispose())
          }
        })
        try {
          renderer?.dispose()
        } catch {
          /* */
        }
        if (renderer && host.contains(renderer.domElement)) {
          host.removeChild(renderer.domElement)
        }
      }
    } catch {
      setReady(true)
      return () => {
        disposed = true
      }
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 -z-10 bg-[#05050c]"
      aria-hidden
    >
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#05050c]">
          <p className="text-[11px] uppercase tracking-[0.2em] text-violet-300/60">
            Dôme 360°…
          </p>
        </div>
      )}
    </div>
  )
}
