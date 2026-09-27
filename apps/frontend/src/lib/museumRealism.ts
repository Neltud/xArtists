/**
 * Réglages rendu « plus réaliste » pour halls musée (WebGL temps réel).
 * Pas de path-tracing — ACES + lumières clés/fill/rim + brouillard doux.
 */
import * as THREE from 'three'

export type RealismLevel = 'demo' | 'balanced' | 'high'

export function applyMuseumRealism(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  level: RealismLevel = 'balanced',
) {
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = level === 'high' ? 1.05 : level === 'demo' ? 1.2 : 1.1
  if ('shadowMap' in renderer) {
    renderer.shadowMap.enabled = level !== 'demo'
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
  }
}

export function addMuseumLights(
  scene: THREE.Scene,
  cx: number,
  cy: number,
  wallH: number,
  level: RealismLevel = 'balanced',
) {
  const amb = new THREE.AmbientLight(0xfff8f0, level === 'high' ? 0.35 : 0.45)
  scene.add(amb)

  const key = new THREE.DirectionalLight(0xfff5e6, level === 'high' ? 1.25 : 1.05)
  key.position.set(cx + 5, wallH - 0.3, cy - 4)
  if (level !== 'demo') {
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    key.shadow.camera.near = 0.5
    key.shadow.camera.far = 40
  }
  scene.add(key)

  const fill = new THREE.DirectionalLight(0xc8d8ff, 0.35)
  fill.position.set(cx - 4, wallH * 0.6, cy + 3)
  scene.add(fill)

  const rim = new THREE.PointLight(0xffe0b0, 0.4, 18, 2)
  rim.position.set(cx, wallH - 0.4, cy)
  scene.add(rim)

  // Spots œuvres (plafond)
  for (let i = 0; i < 3; i++) {
    const spot = new THREE.SpotLight(0xfff0dd, 0.55, 12, Math.PI / 7, 0.45, 1.2)
    const a = (i / 3) * Math.PI * 2
    spot.position.set(cx + Math.cos(a) * 1.2, wallH - 0.15, cy + Math.sin(a) * 1.2)
    spot.target.position.set(cx + Math.cos(a) * 2.2, 1.4, cy + Math.sin(a) * 2.2)
    scene.add(spot)
    scene.add(spot.target)
  }

  return { amb, key, fill, rim }
}
