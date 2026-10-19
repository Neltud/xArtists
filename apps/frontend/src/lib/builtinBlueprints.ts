/**
 * Plans 3D inspirés des typologies réelles (proportions, pas un jumeau BIM).
 */
import type { RoomBlueprint, WallSeg, ArtAnchor } from './roomBlueprint'

function polyWalls(id: string, pts: { x: number; y: number }[], height = 4.2, thickness = 0.25, material: WallSeg['material'] = 'stone'): WallSeg[] {
  const walls: WallSeg[] = []
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    walls.push({
      id: `${id}-w${i}`,
      x1: a.x,
      y1: a.y,
      x2: b.x,
      y2: b.y,
      thickness,
      height,
      material,
    })
  }
  return walls
}

function rectRoom(id: string, name: string, w: number, d: number, opts?: Partial<RoomBlueprint>): RoomBlueprint {
  const hw = w / 2
  const hd = d / 2
  const walls = polyWalls(id, [
    { x: -hw, y: -hd },
    { x: hw, y: -hd },
    { x: hw, y: hd },
    { x: -hw, y: hd },
  ])
  const anchors: ArtAnchor[] = [
    { id: `${id}-a0`, wallId: `${id}-w0`, x: 0, y: -hd, facing: Math.PI / 2 },
    { id: `${id}-a1`, wallId: `${id}-w1`, x: hw, y: 0, facing: Math.PI },
    { id: `${id}-a2`, wallId: `${id}-w2`, x: 0, y: hd, facing: -Math.PI / 2 },
    { id: `${id}-a3`, wallId: `${id}-w3`, x: -hw, y: 0, facing: 0 },
  ]
  return {
    id,
    name,
    wallHeight: 4.2,
    wallThickness: 0.25,
    walls,
    openings: [],
    rooms: [{ id: `${id}-r`, name, polygon: [{ x: -hw, y: -hd }, { x: hw, y: -hd }, { x: hw, y: hd }, { x: -hw, y: hd }], floor: 'stone' }],
    artAnchors: anchors,
    ...opts,
  }
}

/** Corridor long type galerie classique */
export const GALLERY_CORRIDOR: RoomBlueprint = (() => {
  const id = 'gallery-corridor'
  const walls = polyWalls(id, [
    { x: -3, y: -12 },
    { x: 3, y: -12 },
    { x: 3, y: 12 },
    { x: -3, y: 12 },
  ], 4.5, 0.3, 'plaster')
  const anchors: ArtAnchor[] = []
  for (let i = 0; i < 8; i++) {
    const y = -10 + i * 2.8
    anchors.push({ id: `${id}-L${i}`, wallId: `${id}-w3`, x: -3, y, facing: 0 })
    anchors.push({ id: `${id}-R${i}`, wallId: `${id}-w1`, x: 3, y, facing: Math.PI })
  }
  return {
    id,
    name: 'Galerie corridor',
    description: 'Allée classique, œuvres face à face',
    wallHeight: 4.5,
    wallThickness: 0.3,
    walls,
    openings: [{ id: `${id}-door`, wallId: `${id}-w0`, type: 'door', offset: 0, width: 1.8, height: 2.4, sill: 0 }],
    rooms: [{ id: `${id}-r`, name: 'Corridor', polygon: [{ x: -3, y: -12 }, { x: 3, y: -12 }, { x: 3, y: 12 }, { x: -3, y: 12 }], floor: 'marble' }],
    artAnchors: anchors,
    details: { lighting: 'museum', ambient: 'quiet' },
  }
})()

/** Nef vitrée type Orsay / métropolitain */
export const GLASS_NAVE: RoomBlueprint = (() => {
  const id = 'glass-nave'
  const walls = polyWalls(id, [
    { x: -6, y: -8 },
    { x: 6, y: -8 },
    { x: 6, y: 8 },
    { x: -6, y: 8 },
  ], 7, 0.2, 'glass')
  return {
    id,
    name: 'Nef vitrée',
    description: 'Grand volume lumière zénithale',
    wallHeight: 7,
    wallThickness: 0.2,
    walls,
    openings: [],
    rooms: [{ id: `${id}-r`, name: 'Nave', polygon: [{ x: -6, y: -8 }, { x: 6, y: -8 }, { x: 6, y: 8 }, { x: -6, y: 8 }], floor: 'wood' }],
    artAnchors: [
      { id: `${id}-c`, x: 0, y: 0, facing: 0, height: 1.6 },
      { id: `${id}-n`, wallId: `${id}-w0`, x: 0, y: -8, facing: Math.PI / 2 },
      { id: `${id}-s`, wallId: `${id}-w2`, x: 0, y: 8, facing: -Math.PI / 2 },
    ],
    details: { lighting: 'daylight', ambient: 'open' },
  }
})()

/** Cabinet intime type maison de collectionneur */
export const CABINET: RoomBlueprint = rectRoom('cabinet', 'Cabinet', 5, 6, {
  description: 'Salle intime, proportions cabinet',
  details: { lighting: 'spot', ambient: 'intimate' },
})

/** Rotonde / salle centrale */
export const ROTUNDA: RoomBlueprint = (() => {
  const id = 'rotunda'
  const n = 12
  const r = 5.5
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2
    return { x: Math.cos(a) * r, y: Math.sin(a) * r }
  })
  const walls = polyWalls(id, pts, 5.2, 0.35, 'stone')
  const anchors: ArtAnchor[] = pts.map((p, i) => ({
    id: `${id}-a${i}`,
    wallId: `${id}-w${i}`,
    x: p.x * 0.92,
    y: p.y * 0.92,
    facing: Math.atan2(p.y, p.x) + Math.PI,
  }))
  return {
    id,
    name: 'Rotonde',
    description: 'Salle circulaire, œuvres en périphérie',
    wallHeight: 5.2,
    wallThickness: 0.35,
    walls,
    openings: [{ id: `${id}-door`, wallId: `${id}-w0`, type: 'door', offset: 0, width: 2, height: 2.6, sill: 0 }],
    rooms: [{ id: `${id}-r`, name: 'Rotunda', polygon: pts, floor: 'marble' }],
    artAnchors: anchors,
    details: { lighting: 'museum', ambient: 'ceremonial' },
  }
})()

/** Grille cyber / espace xArtists natif */
export const CYBER_GRID: RoomBlueprint = (() => {
  const id = 'cyber-grid'
  const walls = polyWalls(id, [
    { x: -8, y: -8 },
    { x: 8, y: -8 },
    { x: 8, y: 8 },
    { x: -8, y: 8 },
  ], 3.8, 0.15, 'metal')
  return {
    id,
    name: 'Cyber Grid',
    description: 'Espace digital xArtists — grilles et lumière néon',
    wallHeight: 3.8,
    wallThickness: 0.15,
    walls,
    openings: [],
    rooms: [{ id: `${id}-r`, name: 'Grid', polygon: [{ x: -8, y: -8 }, { x: 8, y: -8 }, { x: 8, y: 8 }, { x: -8, y: 8 }], floor: 'concrete' }],
    artAnchors: [
      { id: `${id}-c`, x: 0, y: 0, facing: 0 },
      { id: `${id}-ne`, x: 4, y: 4, facing: -Math.PI / 4 },
      { id: `${id}-nw`, x: -4, y: 4, facing: Math.PI / 4 },
      { id: `${id}-se`, x: 4, y: -4, facing: (-3 * Math.PI) / 4 },
      { id: `${id}-sw`, x: -4, y: -4, facing: (3 * Math.PI) / 4 },
    ],
    details: { lighting: 'neon', ambient: 'digital' },
  }
})()

export const BUILTIN_BLUEPRINTS: Record<string, RoomBlueprint> = {
  'gallery-corridor': GALLERY_CORRIDOR,
  'glass-nave': GLASS_NAVE,
  cabinet: CABINET,
  rotunda: ROTUNDA,
  'cyber-grid': CYBER_GRID,
}

export function resolveBlueprint(ref: string): RoomBlueprint | null {
  return BUILTIN_BLUEPRINTS[ref] || null
}

export function cloneBlueprintForMuseum(base: RoomBlueprint, museumId: string): RoomBlueprint {
  return { ...base, id: `${base.id}:${museumId}`, name: base.name, details: { ...base.details } }
}
