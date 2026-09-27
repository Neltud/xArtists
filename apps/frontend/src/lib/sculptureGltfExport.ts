/**
 * Export mesh sculpture → glTF / GLB (léger) pour NFT / archive.
 * Utilise THREE.GLTFExporter (addon three).
 */
import * as THREE from 'three'

export async function exportGroupToGlb(group: THREE.Object3D, fileName = 'sculpture.glb'): Promise<Blob | null> {
  try {
    const mod = await import('three/examples/jsm/exporters/GLTFExporter.js')
    const GLTFExporter = mod.GLTFExporter
    const exporter = new GLTFExporter()
    const clone = group.clone(true)
    // Appliquer world matrix pour export autonome
    clone.updateMatrixWorld(true)
    const result = await new Promise<ArrayBuffer | { [k: string]: unknown }>((resolve, reject) => {
      exporter.parse(
        clone,
        (gltf: ArrayBuffer | { [k: string]: unknown }) => resolve(gltf),
        (err: unknown) => reject(err),
        { binary: true, onlyVisible: true, embedImages: true },
      )
    })
    if (result instanceof ArrayBuffer) {
      return new Blob([result], { type: 'model/gltf-binary' })
    }
    // JSON glTF fallback
    const json = JSON.stringify(result)
    return new Blob([json], { type: 'model/gltf+json' })
  } catch {
    return null
  }
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

/** Exporte le groupe sculpture le plus proche du point (si userData.isPhotoSculpture) */
export async function exportNearestSculptureGlb(
  scene: THREE.Scene,
  near: THREE.Vector3,
  title = 'sculpture',
): Promise<boolean> {
  let best: THREE.Object3D | null = null
  let bestD = 8
  scene.traverse(obj => {
    if (obj.userData?.isPhotoSculpture) {
      const p = new THREE.Vector3()
      obj.getWorldPosition(p)
      const d = p.distanceTo(near)
      if (d < bestD) {
        bestD = d
        best = obj
      }
    }
  })
  if (!best) return false
  const blob = await exportGroupToGlb(best, `${slug(title)}.glb`)
  if (!blob) return false
  downloadBlob(blob, `${slug(title)}.glb`)
  return true
}

function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'sculpture'
}
