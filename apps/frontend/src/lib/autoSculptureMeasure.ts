/**
 * Saisie automatique H / L / P / circonférence depuis photo (+ vue latérale optionnelle).
 */
import type { SculptureDims } from './photoSculpture3d'
import { formatDims, parseDimensions, estimateDims } from './photoSculpture3d'

export type StructuredMeasureCm = {
  heightCm: number
  widthCm: number
  depthCm: number
  circumferenceCm: number
  label: string
  source: 'metadata' | 'auto-photo' | 'auto-multiview'
}

function toCm(d: SculptureDims): StructuredMeasureCm {
  return {
    heightCm: Math.round(d.heightM * 100),
    widthCm: Math.round(d.widthM * 100),
    depthCm: Math.round(d.depthM * 100),
    circumferenceCm: Math.round((d.circumferenceM || Math.PI * ((d.widthM + d.depthM) / 2)) * 100),
    label: d.label || formatDims(d),
    source: 'auto-photo',
  }
}

/** Priorité : metadata texte → estimation aspect image → raffinement vue latérale */
export function autoMeasureSculpture(opts: {
  dimensionsHint?: string | null
  imageAspectWH?: number
  sideAspectWH?: number
}): StructuredMeasureCm {
  const parsed = parseDimensions(opts.dimensionsHint)
  if (parsed.heightM && parsed.widthM) {
    const heightM = parsed.heightM
    const widthM = parsed.widthM
    const depthM = parsed.depthM ?? widthM * 0.7
    const circumferenceM = parsed.circumferenceM ?? Math.PI * ((widthM + depthM) / 2)
    const d: SculptureDims = {
      heightM,
      widthM,
      depthM,
      circumferenceM,
      label: parsed.label || formatDims({ heightM, widthM, depthM, circumferenceM, label: '' }),
    }
    return { ...toCm(d), source: 'metadata' }
  }

  const aspect = opts.imageAspectWH && opts.imageAspectWH > 0.05 ? opts.imageAspectWH : 0.55
  let base = estimateDims(aspect, aspect > 0.85 ? 'bust' : 'full')

  // Vue de côté : affine la profondeur (ratio largeur latérale / hauteur)
  if (opts.sideAspectWH && opts.sideAspectWH > 0.05) {
    const sideDepth = base.heightM * Math.min(1.2, Math.max(0.15, opts.sideAspectWH))
    base = {
      ...base,
      depthM: sideDepth,
      circumferenceM: Math.PI * ((base.widthM + sideDepth) / 2),
      label: '',
    }
    base.label = formatDims(base) + ' (multi-vue)'
    return { ...toCm(base), source: 'auto-multiview' }
  }

  return { ...toCm(base), source: 'auto-photo' }
}
