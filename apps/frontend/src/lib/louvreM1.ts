/**
 * Louvre M1 — aile virtuelle multi-salles (proportions typologiques, pas un jumeau BIM).
 * 6 salles reliées · ancrages œuvres · collections ALISTOR / BGG / XAUS.
 */
import type { RoomBlueprint, WallSeg, ArtAnchor, RoomMeta } from './roomBlueprint'

export type LouvreRoomId =
  | 'denon-gal'
  | 'salle-des-etats'
  | 'cour-carree'
  | 'cabinet-nord'
  | 'aile-richelieu'
  | 'passage-sully'

export type LouvreRoomDef = {
  id: LouvreRoomId
  label: string
  short: string
  collections: string[]
  blueprint: RoomBlueprint
}

function polyWalls(id: string, pts: { x: number; y: number }[], h: number): WallSeg[] {
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
      height: h,
      thickness: 0.34,
      material: 'stone',
    })
  }
  return walls
}

function anchorsAlong(
  id: string,
  walls: WallSeg[],
  cx: number,
  cy: number,
  spacing = 2.8,
): ArtAnchor[] {
  const anchors: ArtAnchor[] = []
  for (const w of walls) {
    const len = Math.hypot(w.x2 - w.x1, w.y2 - w.y1)
    if (len < 2.2) continue
    const n = Math.max(1, Math.floor(len / spacing))
    for (let i = 0; i < n; i++) {
      const t = (i + 1) / (n + 1)
      const x = w.x1 + (w.x2 - w.x1) * t
      const y = w.y1 + (w.y2 - w.y1) * t
      let nx = cx - x
      let ny = cy - y
      const nl = Math.hypot(nx, ny) || 1
      nx /= nl
      ny /= nl
      anchors.push({
        id: `${id}-a-${w.id}-${i}`,
        wallId: w.id,
        x: x + nx * 0.18,
        y: y + ny * 0.18,
        facing: Math.atan2(nx, ny),
        height: 1.55 + (i % 3) * 0.06,
      })
    }
  }
  return anchors
}

function makeRoom(
  id: LouvreRoomId,
  name: string,
  pts: { x: number; y: number }[],
  h: number,
  opts: {
    description: string
    floor?: RoomMeta['floor']
    spacing?: number
    ambient?: string
    capacity?: number
  },
): RoomBlueprint {
  const walls = polyWalls(id, pts, h)
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of pts) {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  }
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const artAnchors = anchorsAlong(id, walls, cx, cy, opts.spacing ?? 2.9)
  const dw = walls[0]
  const dlen = Math.hypot(dw.x2 - dw.x1, dw.y2 - dw.y1)
  return {
    id,
    name,
    description: opts.description,
    wallHeight: h,
    wallThickness: 0.34,
    walls,
    openings: [
      {
        id: `${id}-door`,
        wallId: dw.id,
        type: 'door',
        offset: dlen * 0.42,
        width: Math.min(2.6, dlen * 0.28),
        height: Math.min(3.4, h * 0.7),
        sill: 0,
      },
      {
        id: `${id}-win`,
        wallId: walls[Math.min(2, walls.length - 1)].id,
        type: 'window',
        offset: 1.8,
        width: 2.8,
        height: h * 0.3,
        sill: h * 0.32,
      },
    ],
    rooms: [{ id: `${id}-r`, name, polygon: pts, floor: opts.floor || 'marble' }],
    artAnchors,
    details: {
      era: 'Louvre M1',
      city: 'Paris',
      lighting: 'museum',
      ambient: opts.ambient || 'Musée · lumière contrôlée',
      capacity: opts.capacity ?? 80,
    },
    schema: 'xartists.roomBlueprint.v1',
    source: 'louvre-m1',
  }
}

const DENON = makeRoom(
  'denon-gal',
  'Grande Galerie Denon',
  [
    { x: 0, y: 0 },
    { x: 48, y: 0 },
    { x: 48, y: 9 },
    { x: 0, y: 9 },
  ],
  5.6,
  {
    description: 'Enfilade Denon — perspective forcée, 8–12 toiles',
    floor: 'stone',
    spacing: 2.7,
    ambient: 'Perspective Denon',
    capacity: 120,
  },
)

const ETATS = makeRoom(
  'salle-des-etats',
  'Salle des États',
  [
    { x: 0, y: 0 },
    { x: 22, y: 0 },
    { x: 22, y: 16 },
    { x: 0, y: 16 },
  ],
  7.2,
  {
    description: 'Volume monumental — pièce maîtresse',
    floor: 'marble',
    spacing: 3.2,
    ambient: 'Hauteur · silence',
    capacity: 90,
  },
)

const CARREE = makeRoom(
  'cour-carree',
  'Cour Carrée (cloître)',
  [
    { x: 0, y: 0 },
    { x: 20, y: 0 },
    { x: 20, y: 20 },
    { x: 14, y: 20 },
    { x: 14, y: 6 },
    { x: 6, y: 6 },
    { x: 6, y: 20 },
    { x: 0, y: 20 },
  ],
  5.0,
  {
    description: 'Cloître ouvert — circulation libre',
    floor: 'stone',
    spacing: 3.0,
    ambient: 'Lumière zénithale douce',
    capacity: 100,
  },
)

const NORD = makeRoom(
  'cabinet-nord',
  'Cabinet Nord',
  [
    { x: 0, y: 0 },
    { x: 12, y: 0 },
    { x: 12, y: 10 },
    { x: 0, y: 10 },
  ],
  4.2,
  {
    description: 'Cabinet intimiste — formats moyens',
    floor: 'wood',
    spacing: 2.4,
    ambient: 'Bois · spots discrets',
    capacity: 35,
  },
)

const RICHELIEU = makeRoom(
  'aile-richelieu',
  'Aile Richelieu',
  [
    { x: 0, y: 0 },
    { x: 36, y: 0 },
    { x: 36, y: 11 },
    { x: 0, y: 11 },
  ],
  5.4,
  {
    description: 'Aile longue — enfilade secondaire',
    floor: 'stone',
    spacing: 2.8,
    ambient: 'Pierre claire',
    capacity: 100,
  },
)

const SULLY = makeRoom(
  'passage-sully',
  'Passage Sully',
  [
    { x: 0, y: 0 },
    { x: 28, y: 0 },
    { x: 28, y: 7 },
    { x: 0, y: 7 },
  ],
  4.6,
  {
    description: 'Passage de liaison — rythme serré',
    floor: 'marble',
    spacing: 2.5,
    ambient: 'Couloir muséal',
    capacity: 50,
  },
)

/** Ordre de visite M1 (minimap). */
export const LOUVRE_M1_WING: LouvreRoomDef[] = [
  {
    id: 'denon-gal',
    label: 'Grande Galerie Denon',
    short: 'Denon',
    collections: ['ALISTOR-a646bc', 'BGG-2b627c'],
    blueprint: DENON,
  },
  {
    id: 'salle-des-etats',
    label: 'Salle des États',
    short: 'États',
    collections: ['ALISTOR-a646bc'],
    blueprint: ETATS,
  },
  {
    id: 'cour-carree',
    label: 'Cour Carrée',
    short: 'Cour',
    collections: ['BGG-2b627c', 'XAUS-d9cf1f'],
    blueprint: CARREE,
  },
  {
    id: 'cabinet-nord',
    label: 'Cabinet Nord',
    short: 'Cabinet',
    collections: ['XAUS-d9cf1f'],
    blueprint: NORD,
  },
  {
    id: 'aile-richelieu',
    label: 'Aile Richelieu',
    short: 'Richelieu',
    collections: ['BGG-2b627c', 'ALISTOR-a646bc'],
    blueprint: RICHELIEU,
  },
  {
    id: 'passage-sully',
    label: 'Passage Sully',
    short: 'Sully',
    collections: ['XAUS-d9cf1f', 'BGG-2b627c'],
    blueprint: SULLY,
  },
]

export function louvreRoomById(id: string): LouvreRoomDef {
  return LOUVRE_M1_WING.find(r => r.id === id) || LOUVRE_M1_WING[0]
}

/** Blueprint d’entrée (compat builtinBlueprintForMuseum). */
export const LOUVRE_M1_ENTRY: RoomBlueprint = {
  ...DENON,
  id: 'louvre-m1-entry',
  name: 'Louvre M1 · Grande Galerie Denon',
  description: 'Aile virtuelle xArtists — 6 salles · collections on-chain',
}

export type LouvreFrameSeed = {
  id: string
  title: string
  image: string
  collection: string
  kind?: 'painting'
}

type CollectionPayload = {
  collections?: Array<{
    identifier?: string
    name?: string
    nfts?: Array<{
      identifier?: string
      name?: string
      url?: string
      media?: Array<{ url?: string; thumbnailUrl?: string }>
    }>
  }>
}

/** Charge jusqu’à `limit` frames depuis public/data/xartists_collections.json. */
export async function loadLouvreFrames(
  collectionIds: string[],
  limit = 12,
): Promise<LouvreFrameSeed[]> {
  const base = import.meta.env.BASE_URL || '/'
  try {
    const res = await fetch(`${base}data/xartists_collections.json`, { cache: 'force-cache' })
    if (!res.ok) return []
    const data = (await res.json()) as CollectionPayload
    const wanted = new Set(collectionIds.map(c => c.toLowerCase()))
    const out: LouvreFrameSeed[] = []
    for (const col of data.collections || []) {
      const cid = (col.identifier || '').toLowerCase()
      if (!wanted.has(cid)) continue
      for (const nft of col.nfts || []) {
        const url =
          nft.url ||
          nft.media?.[0]?.url ||
          nft.media?.[0]?.thumbnailUrl ||
          ''
        if (!url) continue
        out.push({
          id: nft.identifier || `${col.identifier}-${out.length}`,
          title: nft.name || col.name || 'Œuvre',
          image: url,
          collection: col.identifier || '',
          kind: 'painting',
        })
        if (out.length >= limit) return out
      }
    }
    return out
  } catch {
    return []
  }
}
