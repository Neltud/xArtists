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
  height?: number
  frameId?: string
}

export type RoomBlueprint = {
  id: string
  name: string
  description?: string
  wallHeight: number
  wallThickness: number
  walls: WallSeg[]
  openings: Opening[]
  rooms?: { id: string; name: string; polygon: Vec2[]; floor?: string }[]
  artAnchors?: ArtAnchor[]
  layoutFallback?: string
  schema?: string
  source?: string
}

/**
 * museumId → fichier blueprint (public/blueprints/{ref}.json)
 * Générés depuis les samples musée du studio (Export JSON).
 */
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
}

export const BLEND_STUDIO_REPO = 'https://github.com/Neltud/blend-glade-wolf-grove'
