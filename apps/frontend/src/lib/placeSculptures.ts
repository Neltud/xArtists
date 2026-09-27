import * as THREE from 'three'
import type { FrameItem } from '../components/museum/MuseumCorridor'
import { loadPhotoSculpture, parseDimensions } from './photoSculpture3d'

type CorsFn = (raw: string) => string[]

/** Place des sculptures photo→3D au centre de la salle. */
export function placeSculpturesInScene(opts: {
  sculptures: FrameItem[]
  scene: THREE.Scene
  loader: THREE.TextureLoader
  corsSafeUrls: CorsFn
  loadArtOnWall: (
    urls: string[],
    apx: number,
    apz: number,
    nx: number,
    nz: number,
    angle: number,
    title?: string,
    sub?: string,
  ) => void
  artAnchors: { pos: THREE.Vector3; frame: FrameItem }[]
  cx: number
  cy: number
  pedestalColor: number
  emissive: number
  pointInFloor: (x: number, z: number) => boolean
  disposed: () => boolean
}) {
  const {
    sculptures,
    scene,
    loader,
    corsSafeUrls,
    loadArtOnWall,
    artAnchors,
    cx,
    cy,
    pedestalColor,
    emissive,
    pointInFloor,
    disposed,
  } = opts

  sculptures.forEach((frame, i) => {
    const ang = (i / Math.max(1, sculptures.length)) * Math.PI * 2
    let sx = cx + Math.cos(ang) * 1.85
    let sz = cy + Math.sin(ang) * 1.85
    if (!pointInFloor(sx, sz)) {
      sx = cx + 0.8
      sz = cy + 0.8
    }
    const yaw = Math.atan2(cx - sx, cy - sz)
    const dimsPartial = parseDimensions(frame.dimensions)
    void loadPhotoSculpture(corsSafeUrls(frame.image || ''), loader, {
      dims: dimsPartial,
      dimensionsHint: frame.dimensions,
      pedestalColor,
    }).then(res => {
      if (disposed()) return
      if (res) {
        const { group, dims } = res
        group.position.set(sx, 0, sz)
        group.rotation.y = yaw
        scene.add(group)
        if (!frame.dimensions) frame.dimensions = dims.label
        artAnchors.push({
          pos: new THREE.Vector3(sx, 0.9 + dims.heightM * 0.5, sz),
          frame,
        })
      } else {
        const pedestal = new THREE.Mesh(
          new THREE.CylinderGeometry(0.35, 0.4, 0.5, 16),
          new THREE.MeshStandardMaterial({ color: pedestalColor, roughness: 0.4, metalness: 0.3 }),
        )
        pedestal.position.set(sx, 0.25, sz)
        scene.add(pedestal)
        const form = new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.35, 0),
          new THREE.MeshStandardMaterial({
            color: emissive,
            roughness: 0.3,
            metalness: 0.5,
            emissive,
            emissiveIntensity: 0.4,
          }),
        )
        form.position.set(sx, 0.85, sz)
        scene.add(form)
        loadArtOnWall(
          corsSafeUrls(frame.image || ''),
          sx + Math.sin(yaw) * 0.5,
          sz + Math.cos(yaw) * 0.5,
          Math.sin(yaw),
          Math.cos(yaw),
          -yaw,
          frame.title,
          frame.artist || frame.subtitle,
        )
        artAnchors.push({ pos: new THREE.Vector3(sx, 1.2, sz), frame })
      }
    })
  })
}
