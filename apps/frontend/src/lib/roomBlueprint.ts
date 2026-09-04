/**
 * Contrat d’import plan→salle pour la galerie 3D.
 * Aligné sur FloorPlan de https://github.com/Neltud/blend-glade-wolf-grove
 */

export type Vec2 = { x: number; y: number }

export type WallSeg = {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
  thickness: number
  height: number
  /** Material hint for renderer */
  material?: 'stone' | 'plaster' | 'wood' | 'glass' | 'metal' | 'concrete'
}

export type Opening = {
  id: string
  wallId: string
  type: 'door' | 'window'
  offset: number
  width: number
  height: number
  sill: number
}

export type ArtAnchor = {
  id: string
  wallId?: string
  x: number
  y: number
  facing: number
  /** Hauteur centre cadre depuis le sol (m) */
  height?: number
  frameId?: string
  /** Plaque murale optionnelle */
  plaque?: string
}

export type RoomMeta = {
  id: string
  name: string
  polygon: Vec2[]
  floor?: 'stone' | 'wood' | 'marble' | 'concrete' | 'tile'
  /** Texte d’ambiance / cartouche */
  note?: string
}

export type RoomBlueprint = {
  id: string
  name: string
  description?: string
  wallHeight: number
  wallThickness: number
  walls: WallSeg[]
  openings: Opening[]
  rooms?: RoomMeta[]
  artAnchors?: ArtAnchor[]
  layoutFallback?: string
  schema?: string
  source?: string
  /** Détails scénographiques */
  details?: {
    era?: string
    city?: string
    capacity?: number
    lighting?: 'daylight' | 'spot' | 'museum' | 'neon'
    ambient?: string
  }
}

export const MUSEUM_BLUEPRINT_REF: Record<
  string,
  { source: 'blend-sample' | 'json'; ref: string }
> = {
  louvre: { source: 'json', ref: 'gallery-corridor' },
  prado: { source: 'json', ref: 'gallery-corridor' },
  orsay: { source: 'json', ref: 'glass-nave' },
  nglondon: { source: 'json', ref: 'gallery-corridor' },
  rijks: { source: 'json', ref: 'cabinet' },
  mauritshuis: { source: 'json', ref: 'cabinet' },
  vangogh: { source: 'json', ref: 'cabinet' },
  uffizi: { source: 'json', ref: 'rotunda' },
  met: { source: 'json', ref: 'glass-nave' },
  xartists: { source: 'json', ref: 'cyber-grid' },
  kmska: { source: 'json', ref: 'gallery-corridor' },
  pinacoteca: { source: 'json', ref: 'rotunda' },
  bozar: { source: 'json', ref: 'glass-nave' },
}

export const BLEND_STUDIO_REPO = 'https://github.com/Neltud/blend-glade-wolf-grove'

/** Surface approximative m² depuis le premier polygone room. */
export function blueprintAreaM2(bp: RoomBlueprint): number {
  const poly = bp.rooms?.[0]?.polygon
  if (!poly || poly.length < 3) {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity
    for (const w of bp.walls) {
      minX = Math.min(minX, w.x1, w.x2)
      minY = Math.min(minY, w.y1, w.y2)
      maxX = Math.max(maxX, w.x1, w.x2)
      maxY = Math.max(maxY, w.y1, w.y2)
    }
    return Math.max(0, (maxX - minX) * (maxY - minY))
  }
  let a = 0
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    a += poly[j].x * poly[i].y - poly[i].x * poly[j].y
  }
  return Math.abs(a) / 2
}
