import { useEffect, useRef, useState } from 'react'

/**
 * Local GLB preview. Must never fetch external model dependencies:
 * the binary glTF JSON is inspected BEFORE passing bytes to GLTFLoader.
 * No network upload, wallet operation, attestation or IPFS request.
 */
const MAX_GLB = 32 * 1024 * 1024
const SAFE_EXTENSIONS = new Set(['KHR_materials_unlit', 'KHR_texture_transform'])

function checkLocalGlb(bytes: ArrayBuffer): void {
  if (bytes.byteLength < 28 || bytes.byteLength > MAX_GLB) throw new Error('Taille de GLB invalide (32 Mio maximum).')
  const view = new DataView(bytes)
  if (view.getUint32(0, true) !== 0x46546c67 ||
      view.getUint32(4, true) !== 2 ||
      view.getUint32(8, true) !== bytes.byteLength) throw new Error('GLB 2.0 : en-tête ou taille invalide.')
  const jsonSize = view.getUint32(12, true)
  if (view.getUint32(16, true) !== 0x4e4f534a ||
      jsonSize > 4 * 1024 * 1024 || jsonSize % 4 || jsonSize + 28 > bytes.byteLength)
    throw new Error('GLB : bloc JSON invalide.')
  let model: any
  try {
    model = JSON.parse(new TextDecoder().decode(new Uint8Array(bytes, 20, jsonSize)).trim())
  } catch { throw new Error('GLB : impossible de lire les données glTF.') }
  if (model?.asset?.version !== '2.0' || !Array.isArray(model.meshes) ||
      model.meshes.length === 0 || !Array.isArray(model.scenes) || !Array.isArray(model.nodes))
    throw new Error('GLB : scène ou maillage absent.')
  for (const group of [model.buffers, model.images || [], model.shaders || []]) {
    if (!Array.isArray(group) || group.some((part: any) => !part || typeof part !== 'object' || 'uri' in part))
      throw new Error('GLB : référence externe interdite.')
  }
  if (!Array.isArray(model.extensionsUsed || []) ||
      (model.extensionsUsed || []).some((name: string) => !SAFE_EXTENSIONS.has(name)))
    throw new Error('GLB : extension non prise en charge.')
  let offset = 12 + 8 + jsonSize
  if (offset + 8 > bytes.byteLength || view.getUint32(offset + 4, true) !== 0x004e4942)
    throw new Error('GLB : bloc binaire manquant.')
  const binarySize = view.getUint32(offset, true)
  if (!binarySize || binarySize % 4 || offset + 8 + binarySize !== bytes.byteLength ||
      model.buffers.length !== 1 || !Number.isSafeInteger(model.buffers[0].byteLength) ||
      model.buffers[0].byteLength <= 0 || model.buffers[0].byteLength > binarySize ||
      binarySize - model.buffers[0].byteLength > 3)
    throw new Error('GLB : données binaires invalides.')
}

export default function StudioGlbPreview({ file }: { file: File }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [paused, setPaused] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(false)
  const controlsRef = useRef<{ autoRotate: boolean } | null>(null)

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    setReducedMotion(Boolean(media?.matches))
    const update = () => setReducedMotion(Boolean(media?.matches))
    media?.addEventListener?.('change', update)
    return () => media?.removeEventListener?.('change', update)
  }, [])

  useEffect(() => {
    if (controlsRef.current) controlsRef.current.autoRotate = !paused && !reducedMotion
  }, [paused, reducedMotion])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !file) return
    let destroyed = false
    let animationFrame = 0
    let dispose: (() => void) | undefined
    setError('')
    setReady(false)
    setPaused(true)
    const build = async () => {
      const bytes = await file.arrayBuffer()
      if (destroyed) return
      checkLocalGlb(bytes)
      const [THREE, { GLTFLoader }, { OrbitControls }] = await Promise.all([
        import('three'),
        import('three/examples/jsm/loaders/GLTFLoader.js'),
        import('three/examples/jsm/controls/OrbitControls.js'),
      ])
      if (destroyed) return
      const loader = new GLTFLoader()
      const gltf = await loader.parseAsync(bytes, '')
      if (destroyed) return
      let triangles = 0
      gltf.scene.traverse((node: any) => {
        if (node.isMesh) {
          const geom = node.geometry as import('three').BufferGeometry
          triangles += geom.index ? geom.index.count / 3 : (geom.getAttribute('position')?.count || 0) / 3
        }
      })
      if (triangles > 500_000) throw new Error('GLB trop complexe pour l’aperçu mobile (500 000 triangles maximum).')
      const scene = new THREE.Scene()
      scene.background = new THREE.Color('#f5f2eb')
      scene.add(gltf.scene)
      scene.add(new THREE.HemisphereLight(0xffffff, 0x717171, 2.2))
      const light = new THREE.DirectionalLight(0xffffff, 1.7)
      light.position.set(1.5, 3, 3)
      scene.add(light)
      const box = new THREE.Box3().setFromObject(gltf.scene)
      if (box.isEmpty()) throw new Error('GLB sans géométrie visible.')
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      const extent = Math.max(size.x, size.y, size.z)
      if (!Number.isFinite(extent) || extent <= 0 || extent > 1000) throw new Error('Dimensions du modèle invalides.')
      const camera = new THREE.PerspectiveCamera(42, 1, extent / 1000, extent * 25)
      camera.position.copy(center).add(new THREE.Vector3(extent * 1.5, extent * .5, extent * 1.8))
      camera.lookAt(center)
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'low-power' })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
      renderer.outputColorSpace = THREE.SRGBColorSpace
      const controls = new OrbitControls(camera, canvas)
      controlsRef.current = controls
      controls.target.copy(center)
      controls.enableDamping = true
      controls.minDistance = extent * .8
      controls.maxDistance = extent * 8
      controls.autoRotate = false
      controls.autoRotateSpeed = 1.1
      const resize = () => {
        const width = Math.max(1, canvas.clientWidth)
        const height = Math.max(1, canvas.clientHeight)
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        renderer.setSize(width, height, false)
      }
      resize()
      const watcher = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null
      watcher?.observe(canvas)
      window.addEventListener('resize', resize)
      const draw = () => {
        if (destroyed || document.hidden) return
        animationFrame = requestAnimationFrame(draw)
        controls.update()
        renderer.render(scene, camera)
      }
      const onVisibility = () => {
        if (!document.hidden && !animationFrame && !destroyed) draw()
        if (document.hidden) {cancelAnimationFrame(animationFrame);animationFrame = 0}
      }
      document.addEventListener('visibilitychange', onVisibility)
      draw()
      dispose = () => {
        cancelAnimationFrame(animationFrame)
        window.removeEventListener('resize', resize)
        document.removeEventListener('visibilitychange', onVisibility)
        watcher?.disconnect()
        controls.dispose()
        controlsRef.current = null
        gltf.scene.traverse((node: any) => {
          if (!node.isMesh) return
          node.geometry?.dispose()
          const materials = Array.isArray(node.material) ? node.material : [node.material]
          for (const material of materials) {
            if (!material) continue
            for (const val of Object.values(material)) {
              if (val && typeof val === 'object' && (val as any).isTexture) (val as import('three').Texture).dispose()
            }
            material.dispose()
          }
        })
        renderer.dispose()
        renderer.forceContextLoss()
      }
      if (destroyed) {dispose();dispose=undefined;return}
      setReady(true)
    }
    void build().catch(reason => {
      if (!destroyed) setError(reason instanceof Error ? reason.message : 'Aperçu 3D indisponible sur cet appareil.')
    })
    return () => {
      destroyed = true
      dispose?.()
    }
  }, [file])

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-xl border border-white/15 bg-[#f5f2eb]">
        <canvas ref={canvasRef} className="block h-80 w-full touch-none" aria-label="Modèle 3D : tourner avec le doigt, pincer pour zoomer" />
      </div>
      {ready && <button type="button" className="btn-secondary text-xs"
        disabled={reducedMotion} aria-pressed={!paused}
        onClick={() => setPaused(value => !value)}>{paused ? 'Lancer la rotation 3D' : 'Arrêter la rotation'}</button>}
      {!ready && !error && <p role="status" className="text-xs text-zinc-400">Analyse et affichage du GLB local…</p>}
      {error && <p role="alert" className="text-xs text-amber-200">Aperçu 3D indisponible : {error}. Aucune publication n’a été faite.</p>}
      <p className="text-xs text-zinc-400">Prévisualisation locale uniquement. Ce rendu ne certifie ni la géométrie, ni l’échelle, ni l’authenticité de l’œuvre.</p>
    </div>
  )
}
