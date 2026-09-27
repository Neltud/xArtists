import * as THREE from 'three'
import type { FrameItem } from '../components/museum/MuseumCorridor'
import { loadPhotoSculpture, parseDimensions } from './photoSculpture3d'
import { autoMeasureSculpture } from './autoSculptureMeasure'

type CorsFn = (raw: string) => string[]

/** Place des sculptures photo→3D au centre de la salle + mesures auto. */
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

    // Mesures auto (metadata ou estimation aspect) avant chargement texture
    const measure = autoMeasureSculpture({
      dimensionsHint: frame.dimensions,
      imageAspectWH: 0.55,
    })
    frame.heightCm = measure.heightCm
    frame.widthCm = measure.widthCm
    frame.depthCm = measure.depthCm
    frame.circumferenceCm = measure.circumferenceCm
    if (!frame.dimensions) frame.dimensions = measure.label

    void loadPhotoSculpture(corsSafeUrls(frame.image || ''), loader, {
      dims: dimsPartial.heightM
        ? dimsPartial
        : {
            heightM: measure.heightCm / 100,
            widthM: measure.widthCm / 100,
            depthM: measure.depthCm / 100,
            circumferenceM: measure.circumferenceCm / 100,
          },
      dimensionsHint: frame.dimensions,
      pedestalColor,
      sideUrls: frame.sideImage ? corsSafeUrls(frame.sideImage) : undefined,
    }).then(res => {
      if (disposed()) return
      if (res) {
        const { group, dims } = res
        group.position.set(sx, 0, sz)
        group.rotation.y = yaw
        group.userData.frameId = frame.id
        group.userData.exportTitle = frame.title
        scene.add(group)
        frame.dimensions = dims.label
        frame.heightCm = Math.round(dims.heightM * 100)
        frame.widthCm = Math.round(dims.widthM * 100)
        frame.depthCm = Math.round(dims.depthM * 100)
        frame.circumferenceCm = Math.round(
          (dims.circumferenceM || Math.PI * ((dims.widthM + dims.depthM) / 2)) * 100,
        )
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
