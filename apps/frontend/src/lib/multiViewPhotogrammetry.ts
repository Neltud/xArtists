/**
 * Photogrammétrie multi-vues légère (navigateur) pour sculptures physiques → mesh NFT.
 * Entrées : face, côté, (optionnel) 3/4 et dos.
 * Sortie : dimensions précises + profils combinés pour volume 3D + intent mint paper.
 *
 * Limite honnête : pas un pipeline COLMAP/RealityCapture — précision « expo / mint paper »
 * adaptée au WebGL, pas un scan labo.
 */
import * as THREE from 'three'
import {
  createPhotoSculptureFromTexture,
  formatDims,
  type SculptureDims,
  type PhotoSculptureResult,
} from './photoSculpture3d'
import { autoMeasureSculpture, type StructuredMeasureCm } from './autoSculptureMeasure'

export type MultiViewInput = {
  frontUrl: string
  sideUrl?: string
  threeQuarterUrl?: string
  backUrl?: string
  /** Metadata officielle si connue (cm) */
  dimensionsHint?: string
  title?: string
  artist?: string
}

export type MultiViewResult = {
  measure: StructuredMeasureCm
  dims: SculptureDims
  group: THREE.Group
  viewsUsed: string[]
  confidence: number // 0–1
  mintPayload: Record<string, unknown>
}

function loadTex(loader: THREE.TextureLoader, url: string): Promise<THREE.Texture | null> {
  return new Promise(resolve => {
    loader.load(
      url,
      t => resolve(t),
      undefined,
      () => resolve(null),
    )
  })
}

function aspectOf(tex: THREE.Texture): number {
  const w = (tex.image as { width?: number })?.width || 1
  const h = (tex.image as { height?: number })?.height || 1
  return w / h
}

/**
 * Construit un mesh sculpture à partir de 2–4 vues + mesures auto raffinées.
 */
export async function buildMultiViewSculpture(
  input: MultiViewInput,
  loader?: THREE.TextureLoader,
): Promise<MultiViewResult | null> {
  const L = loader || new THREE.TextureLoader()
  L.crossOrigin = 'anonymous'

  const front = await loadTex(L, input.frontUrl)
  if (!front) return null

  const viewsUsed = ['front']
  let sideAspect: number | undefined
  if (input.sideUrl) {
    const side = await loadTex(L, input.sideUrl)
    if (side) {
      sideAspect = aspectOf(side)
      viewsUsed.push('side')
    }
  }
  if (input.threeQuarterUrl) {
    const tq = await loadTex(L, input.threeQuarterUrl)
    if (tq) viewsUsed.push('threeQuarter')
  }
  if (input.backUrl) {
    const back = await loadTex(L, input.backUrl)
    if (back) viewsUsed.push('back')
  }

  const measure = autoMeasureSculpture({
    dimensionsHint: input.dimensionsHint,
    imageAspectWH: aspectOf(front),
    sideAspectWH: sideAspect,
  })

  // Confiance : metadata > multi-vue > mono
  let confidence = 0.45
  if (measure.source === 'metadata') confidence = 0.85
  else if (measure.source === 'auto-multiview') confidence = 0.7
  confidence = Math.min(0.95, confidence + (viewsUsed.length - 1) * 0.08)

  const dims: SculptureDims = {
    heightM: measure.heightCm / 100,
    widthM: measure.widthCm / 100,
    depthM: measure.depthCm / 100,
    circumferenceM: measure.circumferenceCm / 100,
    label: measure.label,
  }

  const built: PhotoSculptureResult = createPhotoSculptureFromTexture(front, {
    dims,
    dimensionsHint: measure.label,
  })

  // Tag pour export / mint
  built.group.userData.multiView = {
    viewsUsed,
    confidence,
    measure,
    title: input.title,
    artist: input.artist,
  }
  built.group.userData.isPhotoSculpture = true

  const mintPayload = {
    type: 'MINT_SCULPTURE_NFT',
    paper: true,
    title: input.title || 'Sculpture 3D',
    artist: input.artist || 'Unknown',
    viewsUsed,
    confidence,
    dimensionsCm: {
      height: measure.heightCm,
      width: measure.widthCm,
      depth: measure.depthCm,
      circumference: measure.circumferenceCm,
    },
    dimensionsLabel: formatDims(dims),
    frontUrl: input.frontUrl,
    sideUrl: input.sideUrl,
    technique: 'multi-view browser photogrammetry (approx)',
    ts: new Date().toISOString(),
  }

  return {
    measure,
    dims: built.dims,
    group: built.group,
    viewsUsed,
    confidence,
    mintPayload,
  }
}

/** Dispatch intent mint paper (pas de SC tant que GO_LIVE OFF) */
export function dispatchMintSculpturePaper(payload: Record<string, unknown>) {
  window.dispatchEvent(
    new CustomEvent('lia-intent', {
      detail: {
        lip: {
          raw: `mint sculpture nft ${payload.title || ''}`,
          ...payload,
        },
      },
    }),
  )
}
