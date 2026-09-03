/**
 * Contrat d’import plan→salle pour la galerie 3D.
 * Aligné sur FloorPlan de https://github.com/Neltud/blend-glade-wolf-grove
 * (src/lib/plan/types.ts) — source de vérité architecture.
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
  /** position monde plan (m) */
  x: number
  y: number
  /** orientation mur (rad) */
  facing: number
  /** id œuvre optionnel (frame catalog) */
  frameId?: string
}

/** Blueprint exportable depuis blend-glade-wolf-grove → xArtists MuseumGameHall / R3F. */
export type RoomBlueprint = {
  id: string
  name: string
  description?: string
  wallHeight: number
  wallThickness: number
  walls: WallSeg[]
  openings: Opening[]
  /** polygones de salles (sol) */
  rooms?: { id: string; name: string; polygon: Vec2[] }[]
  /** ancrages pour accrocher les œuvres */
  artAnchors?: ArtAnchor[]
  /** id layout CSS fallback si mesh pas chargé */
  layoutFallback?: string
}

/** Map musée xArtists → plan sample ou export JSON futur. */
export const MUSEUM_BLUEPRINT_REF: Record<
  string,
  { source: 'blend-sample' | 'json'; ref: string }
> = {
  louvre: { source: 'blend-sample', ref: 'haussmann' }, // grande enfilade — proxy
  orsay: { source: 'blend-sample', ref: 'villa' },
  xartists: { source: 'blend-sample', ref: 'studio' },
  nglondon: { source: 'blend-sample', ref: 'haussmann' },
  rijks: { source: 'blend-sample', ref: 'studio' },
  uffizi: { source: 'blend-sample', ref: 'villa' },
  met: { source: 'blend-sample', ref: 'villa' },
}

export const BLEND_STUDIO_REPO = 'https://github.com/Neltud/blend-glade-wolf-grove'
