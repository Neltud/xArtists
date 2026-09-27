/**
 * Photo → sculpture 3D approximative (navigateur).
 * Silhouette + volume + texture photo + dimensions (+ vue latérale optionnelle).
 */
import * as THREE from 'three'

export type SculptureDims = {
  heightM: number
  widthM: number
  depthM: number
  circumferenceM?: number
  label: string
}

const ROWS = 48
const COLS = 32

export function parseDimensions(raw?: string | null): Partial<SculptureDims> {
  if (!raw || !raw.trim()) return {}
  const s = raw.toLowerCase().replace(/,/g, '.')
  const nums = [...s.matchAll(/(\d+(?:\.\d+)?)\s*(cm|m|mm)?/g)].map(m => {
    let v = parseFloat(m[1])
    const u = m[2] || (v > 10 ? 'cm' : 'm')
    if (u === 'cm') v /= 100
    if (u === 'mm') v /= 1000
    return v
  })
  if (!nums.length) return {}
  const heightM = nums[0]
  const widthM = nums[1] ?? heightM * 0.35
  const depthM = nums[2] ?? widthM * 0.7
  const circumferenceM = nums[3] ?? Math.PI * ((widthM + depthM) / 2)
  return {
    heightM,
    widthM,
    depthM,
    circumferenceM,
    label: formatDims({ heightM, widthM, depthM, circumferenceM, label: '' }),
  }
}

export function formatDims(d: SculptureDims): string {
  const cm = (m: number) => `${Math.round(m * 100)} cm`
  let s = `H ${cm(d.heightM)} · L ${cm(d.widthM)} · P ${cm(d.depthM)}`
  if (d.circumferenceM && d.circumferenceM > 0) s += ` · ⌀ ~${cm(d.circumferenceM)}`
  return s
}

export function estimateDims(aspectWH: number, mode: 'bust' | 'full' | 'relief' = 'full'): SculptureDims {
  const aspect = aspectWH > 0.05 ? aspectWH : 0.55
  let heightM = mode === 'bust' ? 0.55 : mode === 'relief' ? 0.9 : 1.35
  let widthM = heightM * Math.min(1.1, Math.max(0.25, aspect))
  let depthM = mode === 'relief' ? widthM * 0.12 : widthM * 0.55
  if (mode === 'full' && heightM < 1) heightM = 1.2
  const circumferenceM = Math.PI * ((widthM + depthM) / 2)
  const dims: SculptureDims = { heightM, widthM, depthM, circumferenceM, label: '' }
  dims.label = formatDims(dims) + ' (estim.)'
  return dims
}

function resolveDims(
  tex: THREE.Texture,
  partial?: Partial<SculptureDims> | null,
  hint?: string | null,
): SculptureDims {
  const img = tex.image as { width?: number; height?: number } | undefined
  const aspect = (img?.width || 512) / (img?.height || 768)
  const parsed = parseDimensions(hint || undefined)
  const base = estimateDims(aspect, aspect > 0.85 ? 'bust' : 'full')
  const heightM = partial?.heightM ?? parsed.heightM ?? base.heightM
  const widthM = partial?.widthM ?? parsed.widthM ?? base.widthM
  const depthM = partial?.depthM ?? parsed.depthM ?? base.depthM
  const circumferenceM =
    partial?.circumferenceM ?? parsed.circumferenceM ?? Math.PI * ((widthM + depthM) / 2)
  const dims: SculptureDims = {
    heightM: Math.min(2.4, Math.max(0.25, heightM)),
    widthM: Math.min(1.6, Math.max(0.12, widthM)),
    depthM: Math.min(1.2, Math.max(0.06, depthM)),
    circumferenceM,
    label: '',
  }
  dims.label =
    partial?.label || parsed.label || formatDims(dims) + (parsed.heightM ? '' : ' (estim.)')
  return dims
}

function sampleSilhouetteProfile(image: CanvasImageSource): Float32Array {
  const canvas = document.createElement('canvas')
  canvas.width = COLS
  canvas.height = ROWS
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const profile = new Float32Array(ROWS)
  if (!ctx) {
    profile.fill(0.55)
    return profile
  }
  ctx.drawImage(image, 0, 0, COLS, ROWS)
  let data: ImageData
  try {
    data = ctx.getImageData(0, 0, COLS, ROWS)
  } catch {
    profile.fill(0.55)
    return profile
  }
  const px = data.data
  for (let y = 0; y < ROWS; y++) {
    let left = COLS
    let right = 0
    let rowSum = 0
    for (let x = 0; x < COLS; x++) {
      const i = (y * COLS + x) * 4
      const lum = (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) / 255
      const a = px[i + 3] / 255
      const on = a > 0.15 && lum > 0.12 && lum < 0.92
      if (on) {
        left = Math.min(left, x)
        right = Math.max(right, x)
        rowSum++
      }
    }
    if (rowSum < 2 || left >= right) profile[y] = y < ROWS * 0.15 ? 0.25 : 0.45
    else profile[y] = Math.min(1, Math.max(0.12, (right - left + 1) / COLS))
  }
  const smooth = new Float32Array(ROWS)
  for (let y = 0; y < ROWS; y++) {
    const a = profile[Math.max(0, y - 1)]
    const b = profile[y]
    const c = profile[Math.min(ROWS - 1, y + 1)]
    smooth[y] = a * 0.25 + b * 0.5 + c * 0.25
  }
  return smooth
}

function buildVolumeGeometry(profile: Float32Array, dims: SculptureDims): THREE.BufferGeometry {
  const radial = 12
  const positions: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  for (let y = 0; y <= ROWS; y++) {
    const t = y / ROWS
    const p = profile[Math.min(ROWS - 1, y)] ?? 0.5
    const ry = dims.widthM * 0.5 * p
    const rz = dims.depthM * 0.5 * (0.65 + p * 0.35)
    const py = dims.heightM * (1 - t)
    for (let i = 0; i <= radial; i++) {
      const a = (i / radial) * Math.PI * 2
      const x = Math.cos(a) * ry
      const z = Math.sin(a) * rz
      positions.push(x, py, z)
      const len = Math.hypot(x / Math.max(ry, 1e-6), z / Math.max(rz, 1e-6)) || 1
      normals.push(x / (ry * len || 1), 0.05, z / (rz * len || 1))
      uvs.push(i / radial, 1 - t)
    }
  }
  const ring = radial + 1
  for (let y = 0; y < ROWS; y++) {
    for (let i = 0; i < radial; i++) {
      const a = y * ring + i
      const b = a + 1
      const c = a + ring
      const d = c + 1
      indices.push(a, c, b, b, c, d)
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

function makeDimPlaque(label: string): THREE.Mesh {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 128
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#1a1510'
  ctx.fillRect(0, 0, 512, 128)
  ctx.strokeStyle = '#c4a574'
  ctx.lineWidth = 4
  ctx.strokeRect(6, 6, 500, 116)
  ctx.fillStyle = '#f5e6c8'
  ctx.font = 'bold 28px system-ui,sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Sculpture 3D · photo', 256, 48)
  ctx.font = '22px system-ui,sans-serif'
  ctx.fillStyle = '#d4c4a8'
  const lines = label.length > 42 ? [label.slice(0, 42), label.slice(42, 84)] : [label]
  lines.forEach((ln, i) => ctx.fillText(ln, 256, 82 + i * 26))
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return new THREE.Mesh(
    new THREE.PlaneGeometry(0.7, 0.18),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true }),
  )
}

export type PhotoSculptureResult = { group: THREE.Group; dims: SculptureDims }

export function createPhotoSculptureFromTexture(
  tex: THREE.Texture,
  options?: {
    dims?: Partial<SculptureDims> | null
    dimensionsHint?: string | null
    pedestalColor?: number
  },
): PhotoSculptureResult {
  tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  const dims = resolveDims(tex, options?.dims, options?.dimensionsHint)
  const profile = sampleSilhouetteProfile(tex.image as CanvasImageSource)
  const geo = buildVolumeGeometry(profile, dims)
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.45,
    metalness: 0.12,
    side: THREE.DoubleSide,
  })
  const body = new THREE.Mesh(geo, mat)
  const faceH = dims.heightM
  const faceW = dims.widthM * 0.92
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(faceW, faceH),
    new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.55,
      metalness: 0.05,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
    }),
  )
  face.position.set(0, faceH / 2, dims.depthM * 0.52)
  const pedestalH = 0.42
  const pedestalR = Math.max(0.28, Math.max(dims.widthM, dims.depthM) * 0.55)
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(pedestalR * 0.92, pedestalR, pedestalH, 24),
    new THREE.MeshStandardMaterial({
      color: options?.pedestalColor ?? 0x6b5a48,
      roughness: 0.35,
      metalness: 0.4,
    }),
  )
  pedestal.position.y = pedestalH / 2
  const sculptureRoot = new THREE.Group()
  body.position.y = pedestalH
  face.position.y = pedestalH + faceH / 2
  sculptureRoot.add(pedestal)
  sculptureRoot.add(body)
  sculptureRoot.add(face)
  const plaque = makeDimPlaque(dims.label)
  plaque.position.set(0, 0.08, pedestalR + 0.02)
  sculptureRoot.add(plaque)
  const group = new THREE.Group()
  group.add(sculptureRoot)
  group.userData.sculptureDims = dims
  group.userData.isPhotoSculpture = true
  return { group, dims }
}

export function loadPhotoSculpture(
  urls: string[],
  loader: THREE.TextureLoader,
  options?: {
    dims?: Partial<SculptureDims> | null
    dimensionsHint?: string | null
    pedestalColor?: number
    sideUrls?: string[]
  },
): Promise<PhotoSculptureResult | null> {
  return new Promise(resolve => {
    const tryAt = (idx: number) => {
      if (idx >= urls.length) {
        resolve(null)
        return
      }
      loader.load(
        urls[idx],
        async tex => {
          try {
            let opts = { ...options }
            const sideUrls = options?.sideUrls
            if (sideUrls?.length) {
              await new Promise<void>(res => {
                const trySide = (si: number) => {
                  if (si >= sideUrls.length) {
                    res()
                    return
                  }
                  loader.load(
                    sideUrls[si],
                    sideTex => {
                      const sw = (sideTex.image as { width?: number })?.width || 1
                      const sh = (sideTex.image as { height?: number })?.height || 1
                      const sideAspect = sw / sh
                      const h = opts.dims?.heightM
                      if (h && sideAspect > 0.05) {
                        const depthM = Math.min(1.2, Math.max(0.08, h * sideAspect * 0.9))
                        opts = {
                          ...opts,
                          dims: {
                            ...opts.dims,
                            depthM,
                            circumferenceM:
                              Math.PI * (((opts.dims?.widthM || depthM) + depthM) / 2),
                          },
                        }
                      }
                      res()
                    },
                    undefined,
                    () => trySide(si + 1),
                  )
                }
                trySide(0)
              })
            }
            resolve(createPhotoSculptureFromTexture(tex, opts))
          } catch {
            tryAt(idx + 1)
          }
        },
        undefined,
        () => tryAt(idx + 1),
      )
    }
    tryAt(0)
  })
}
