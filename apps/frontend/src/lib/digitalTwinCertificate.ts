/**
 * Certificat de jumeau numérique métrique (sculpture 1/1).
 * grade metric-certified uniquement si pipeline labo + scale bar + hash mesh.
 */

export type TwinGrade = 'browser-approx' | 'relative' | 'metric-certified'

export type DigitalTwinCertificate = {
  version: '1.0'
  grade: TwinGrade
  title: string
  artist: string
  physical?: {
    objectId?: string
    inventoryNote?: string
    material?: string
  }
  capture: {
    imageCount: number
    overlapHint?: string
    scaleBarCm?: number
    scaleBarCount?: number
    capturedAt?: string
  }
  pipeline: {
    engine: 'colmap' | 'meshroom' | 'browser-approx'
    engineVersion?: string
    pipelineId: string
    workerHost?: string
  }
  metric: {
    heightCm: number
    widthCm: number
    depthCm: number
    circumferenceCm?: number
    unit: 'cm'
    scaleApplied: boolean
  }
  mesh: {
    format: 'glb' | 'gltf'
    sha256: string
    cid?: string
    vertexCount?: number
    faceCount?: number
  }
  qc: {
    holeRatio: number
    watertight: boolean
    notes?: string[]
  }
  issuer: string
  issuedAt: string
  disclaimer: string
}

export const TWIN_DISCLAIMER_METRIC =
  'Certificat xArtists paper — jumeau produit par pipeline photogrammétrie labo. ' +
  'Mint 1/1 on-chain uniquement après GO_LIVE et URI IPFS figée. ' +
  'Ce n’est pas un produit financier.'

export const TWIN_DISCLAIMER_BROWSER =
  'Approximation navigateur uniquement — non métrique, non certifiée labo. Paper only.'

export function createBrowserApproxCertificate(opts: {
  title: string
  artist: string
  heightCm: number
  widthCm: number
  depthCm: number
  circumferenceCm?: number
  imageCount: number
  sha256Placeholder?: string
}): DigitalTwinCertificate {
  return {
    version: '1.0',
    grade: 'browser-approx',
    title: opts.title,
    artist: opts.artist,
    capture: { imageCount: opts.imageCount },
    pipeline: {
      engine: 'browser-approx',
      pipelineId: `browser-${Date.now()}`,
    },
    metric: {
      heightCm: opts.heightCm,
      widthCm: opts.widthCm,
      depthCm: opts.depthCm,
      circumferenceCm: opts.circumferenceCm,
      unit: 'cm',
      scaleApplied: false,
    },
    mesh: {
      format: 'glb',
      sha256: opts.sha256Placeholder || 'pending',
    },
    qc: {
      holeRatio: 1,
      watertight: false,
      notes: ['browser-approx — not lab grade'],
    },
    issuer: 'xArtists browser pipeline',
    issuedAt: new Date().toISOString(),
    disclaimer: TWIN_DISCLAIMER_BROWSER,
  }
}

/** Construit un certificat metric-certified à partir du résultat worker COLMAP */
export function createMetricCertificate(opts: {
  title: string
  artist: string
  scaleBarCm: number
  imageCount: number
  heightCm: number
  widthCm: number
  depthCm: number
  circumferenceCm?: number
  sha256: string
  cid?: string
  vertexCount?: number
  faceCount?: number
  holeRatio: number
  watertight: boolean
  engine?: 'colmap' | 'meshroom'
  engineVersion?: string
  workerHost?: string
  physical?: DigitalTwinCertificate['physical']
}): DigitalTwinCertificate {
  return {
    version: '1.0',
    grade: 'metric-certified',
    title: opts.title,
    artist: opts.artist,
    physical: opts.physical,
    capture: {
      imageCount: opts.imageCount,
      scaleBarCm: opts.scaleBarCm,
      scaleBarCount: 1,
      overlapHint: '>=60%',
      capturedAt: new Date().toISOString(),
    },
    pipeline: {
      engine: opts.engine || 'colmap',
      engineVersion: opts.engineVersion,
      pipelineId: `lab-${opts.engine || 'colmap'}-${Date.now()}`,
      workerHost: opts.workerHost,
    },
    metric: {
      heightCm: opts.heightCm,
      widthCm: opts.widthCm,
      depthCm: opts.depthCm,
      circumferenceCm: opts.circumferenceCm,
      unit: 'cm',
      scaleApplied: true,
    },
    mesh: {
      format: 'glb',
      sha256: opts.sha256,
      cid: opts.cid,
      vertexCount: opts.vertexCount,
      faceCount: opts.faceCount,
    },
    qc: {
      holeRatio: opts.holeRatio,
      watertight: opts.watertight,
      notes:
        opts.holeRatio > 0.05
          ? ['holeRatio above soft threshold — review before mint']
          : ['qc pass soft thresholds'],
    },
    issuer: 'xArtists digital twin lab (paper until GO_LIVE)',
    issuedAt: new Date().toISOString(),
    disclaimer: TWIN_DISCLAIMER_METRIC,
  }
}

export function canMintOneOfOne(cert: DigitalTwinCertificate): {
  ok: boolean
  reason: string
} {
  if (cert.grade !== 'metric-certified') {
    return { ok: false, reason: 'Grade must be metric-certified (lab COLMAP + scale bar)' }
  }
  if (!cert.metric.scaleApplied) {
    return { ok: false, reason: 'Scale bar not applied' }
  }
  if (!cert.mesh.sha256 || cert.mesh.sha256 === 'pending') {
    return { ok: false, reason: 'Missing mesh SHA-256' }
  }
  if (cert.qc.holeRatio > 0.08) {
    return { ok: false, reason: 'QC holeRatio too high' }
  }
  if (cert.capture.imageCount < 40) {
    return { ok: false, reason: 'Need ≥ 40 images for lab grade' }
  }
  return { ok: true, reason: 'Eligible for paper mint 1/1 (SC after GO_LIVE)' }
}

export function dispatchMintSculpture1of1(cert: DigitalTwinCertificate, extra?: Record<string, unknown>) {
  const gate = canMintOneOfOne(cert)
  window.dispatchEvent(
    new CustomEvent('lia-intent', {
      detail: {
        lip: {
          type: 'MINT_SCULPTURE_1OF1',
          paper: true,
          raw: `mint sculpture 1of1 ${cert.title}`,
          eligible: gate.ok,
          gateReason: gate.reason,
          certificate: cert,
          ...extra,
          ts: new Date().toISOString(),
        },
      },
    }),
  )
  return gate
}
