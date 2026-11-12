import type { Object3D } from 'three'

/** Each resource can be shared by several mesh instances in one GLB. */
export function disposeModelResources(root: Object3D): void {
  const geometries = new Set<any>()
  const materials = new Set<any>()
  const textures = new Set<any>()
  const images = new Set<any>()
  root.traverse((node: any) => {
    if (node.geometry) geometries.add(node.geometry)
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
      if (!material) continue
      materials.add(material)
      for (const value of Object.values(material)) {
        if (value && typeof value === 'object' && (value as any).isTexture) textures.add(value)
      }
    }
  })
  for (const texture of textures) {
    // GLTFLoader may use ImageBitmap; Texture.dispose() does not close it.
    if (texture.image) images.add(texture.image)
    texture.dispose()
  }
  for (const image of images) if (typeof image.close === 'function') image.close()
  for (const material of materials) material.dispose()
  for (const geometry of geometries) geometry.dispose()
}
