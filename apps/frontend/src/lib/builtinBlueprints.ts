/**
 * Plans 3D inspirés des typologies réelles (proportions, pas un jumeau BIM).
 */
import type { RoomBlueprint, WallSeg, ArtAnchor } from './roomBlueprint'

function polyWalls(id: string, pts: { x: number; y: number }[], h: number): WallSeg[] {
  const walls: WallSeg[] = []
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length]
    walls.push({ id: `${id}-w${i}`, x1: a.x, y1: a.y, x2: b.x, y2: b.y, height: h, thickness: 0.32 })
  }
  return walls
}

function anchorsAlong(id: string, walls: WallSeg[], cx: number, cy: number, spacing = 3.2): ArtAnchor[] {
  const anchors: ArtAnchor[] = []
  for (const w of walls) {
    const len = Math.hypot(w.x2 - w.x1, w.y2 - w.y1)
    if (len < 2.5) continue
    const n = Math.max(1, Math.floor(len / spacing))
    for (let i = 0; i < n; i++) {
      const t = (i + 1) / (n + 1)
      const x = w.x1 + (w.x2 - w.x1) * t
      const y = w.y1 + (w.y2 - w.y1) * t
      let nx = cx - x, ny = cy - y
      const nl = Math.hypot(nx, ny) || 1
      nx /= nl; ny /= nl
      anchors.push({
        id: `${id}-a-${w.id}-${i}`,
        wallId: w.id,
        x: x + nx * 0.15,
        y: y + ny * 0.15,
        facing: Math.atan2(nx, ny),
        height: 1.52 + (i % 2) * 0.08,
      })
    }
  }
  return anchors
}

function makePlan(
  id: string,
  name: string,
  pts: { x: number; y: number }[],
  h: number,
  opts: {
    description: string
    floor?: 'stone' | 'wood' | 'marble' | 'concrete'
    details?: RoomBlueprint['details']
    spacing?: number
    doorWallIndex?: number
  }
): RoomBlueprint {
  const walls = polyWalls(id, pts, h)
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const p of pts) {
    minX = Math.min(minX, p.x); minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y)
  }
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2
  const artAnchors = anchorsAlong(id, walls, cx, cy, opts.spacing ?? 3.4)
  const di = opts.doorWallIndex ?? 0
  const dw = walls[di] || walls[0]
  const dlen = Math.hypot(dw.x2 - dw.x1, dw.y2 - dw.y1)
  return {
    id,
    name,
    description: opts.description,
    wallHeight: h,
    wallThickness: 0.32,
    walls,
    openings: [
      { id: `${id}-door`, wallId: dw.id, type: 'door', offset: dlen * 0.4, width: Math.min(2.4, dlen * 0.25), height: Math.min(3.2, h * 0.68), sill: 0 },
      { id: `${id}-win1`, wallId: walls[Math.min(1, walls.length - 1)].id, type: 'window', offset: 2, width: 2.5, height: h * 0.32, sill: h * 0.28 },
    ],
    rooms: [{ id: `${id}-r`, name, polygon: pts, floor: opts.floor || 'stone' }],
    artAnchors,
    details: opts.details,
    schema: 'xartists.roomBlueprint.v1',
    source: 'builtin',
  }
}

const LOUVRE = makePlan('louvre-gal', 'Grande Galerie (esprit Louvre)', [{ x: 0, y: 0 }, { x: 72, y: 0 }, { x: 72, y: 8.5 }, { x: 0, y: 8.5 }], 5.8, {
  description: 'Enfilade type Denon', floor: 'stone', spacing: 3.0, doorWallIndex: 3,
  details: { era: 'Louvre', lighting: 'museum', ambient: 'Perspective forcée', capacity: 180, city: 'Paris' },
})
const HERMITAGE = makePlan('hermitage-hall', 'Salon impérial (esprit Ermitage)', [{ x: 0, y: 0 }, { x: 28, y: 0 }, { x: 28, y: 18 }, { x: 0, y: 18 }], 6.4, {
  description: 'Winter Palace', floor: 'marble', spacing: 3.6,
  details: { era: 'Ermitage', lighting: 'daylight', ambient: 'Hauteur impériale', capacity: 120, city: 'Saint Petersburg' },
})
const ORSAY = makePlan('orsay-nave', 'Nef (esprit Orsay)', [{ x: 0, y: 0 }, { x: 42, y: 0 }, { x: 42, y: 16 }, { x: 0, y: 16 }], 9.5, {
  description: 'Nef gare d’Orsay', floor: 'marble', spacing: 4.0,
  details: { era: 'Orsay', lighting: 'daylight', ambient: 'Verrière', capacity: 220, city: 'Paris' },
})
const POMPIDOU = makePlan('pompidou-plateau', 'Plateau (esprit Pompidou)', [{ x: 0, y: 0 }, { x: 30, y: 0 }, { x: 30, y: 18 }, { x: 0, y: 18 }], 5.5, {
  description: 'Plateau ouvert type Beaubourg', floor: 'concrete', spacing: 3.4,
  details: { era: 'Pompidou', lighting: 'daylight', ambient: 'Blanc · structure apparente', capacity: 140, city: 'Paris' },
})
const TOKYO = makePlan('tokyo-hall', 'Hall (esprit Palais de Tokyo)', [{ x: 0, y: 0 }, { x: 26, y: 0 }, { x: 26, y: 14 }, { x: 0, y: 14 }], 6.0, {
  description: 'Volume contemporain brut', floor: 'concrete', spacing: 3.5,
  details: { era: 'Palais de Tokyo', lighting: 'neon', ambient: 'Béton · lumière froide', capacity: 100, city: 'Paris' },
})
const MET = makePlan('met-wing', 'Aile Met (esprit)', [{ x: 0, y: 0 }, { x: 36, y: 0 }, { x: 36, y: 12 }, { x: 14, y: 12 }, { x: 14, y: 22 }, { x: 0, y: 22 }], 5.5, {
  description: 'Plan en L', floor: 'stone', spacing: 3.5,
  details: { era: 'The Met', lighting: 'museum', ambient: 'Enfilade + retour', capacity: 150, city: 'New York' },
})
const RIJKS = makePlan('rijks-cabinet', 'Cabinet d’âge d’or', [{ x: 0, y: 0 }, { x: 14, y: 0 }, { x: 14, y: 10 }, { x: 0, y: 10 }], 4.0, {
  description: 'Cabinet hollandais', floor: 'wood', spacing: 2.6,
  details: { era: 'XVIIe NL', lighting: 'spot', ambient: 'Bois', capacity: 40, city: 'Amsterdam' },
})
const UFFIZI = makePlan('uffizi-corr', 'Corridoio (esprit Uffizi)', [{ x: 0, y: 0 }, { x: 55, y: 0 }, { x: 55, y: 7 }, { x: 0, y: 7 }], 5.0, {
  description: 'Corridor étroit', floor: 'marble', spacing: 2.8,
  details: { era: 'Uffizi', lighting: 'daylight', ambient: 'Perspective', capacity: 100, city: 'Florence' },
})
const PRADO = makePlan('prado-hall', 'Sala (esprit Prado)', [{ x: 0, y: 0 }, { x: 32, y: 0 }, { x: 32, y: 14 }, { x: 0, y: 14 }], 5.2, {
  description: 'Salle classique', floor: 'stone', spacing: 3.3,
  details: { era: 'Prado', lighting: 'museum', ambient: 'Ocre', capacity: 90, city: 'Madrid' },
})
const NG = makePlan('ng-room', 'Room (National Gallery)', [{ x: 0, y: 0 }, { x: 22, y: 0 }, { x: 22, y: 14 }, { x: 0, y: 14 }], 5.0, {
  description: 'Salle claire', floor: 'wood', spacing: 3.2,
  details: { era: 'National Gallery', lighting: 'daylight', ambient: 'Cimaises', capacity: 70, city: 'London' },
})
const CYBER = makePlan('xartists-hall', 'Hall xArtists', [{ x: 0, y: 0 }, { x: 22, y: 0 }, { x: 22, y: 15 }, { x: 0, y: 15 }], 4.4, {
  description: 'Hall MultiversX', floor: 'concrete', spacing: 3.0,
  details: { era: '2026', lighting: 'neon', ambient: 'Cyan', capacity: 80, city: 'Virtuel' },
})
const CORRIDOR = makePlan('gallery-corridor', 'Grande Galerie', [{ x: 0, y: 0 }, { x: 48, y: 0 }, { x: 48, y: 9 }, { x: 0, y: 9 }], 5.2, {
  description: 'Enfilade', floor: 'stone', spacing: 3.2,
  details: { era: 'XIXe', lighting: 'museum', ambient: 'Enfilade', capacity: 100 },
})
const ROTUNDA = makePlan('rotunda', 'Rotonde', [{ x: 0, y: 4 }, { x: 4, y: 0 }, { x: 12, y: 0 }, { x: 16, y: 4 }, { x: 16, y: 12 }, { x: 12, y: 16 }, { x: 4, y: 16 }, { x: 0, y: 12 }], 6.0, {
  description: 'Rotonde', floor: 'marble', spacing: 3.5,
  details: { era: 'Renaissance', lighting: 'daylight', ambient: 'Circulaire', capacity: 60 },
})
const CABINET = makePlan('cabinet', 'Cabinet intime', [{ x: 0, y: 0 }, { x: 9, y: 0 }, { x: 9, y: 7 }, { x: 0, y: 7 }], 3.4, {
  description: 'Petite salle', floor: 'wood', spacing: 2.4,
  details: { era: 'XVIIe', lighting: 'spot', ambient: 'Dense', capacity: 18 },
})
const GLASS = makePlan('glass-nave', 'Nef vitrée', [{ x: 0, y: 0 }, { x: 36, y: 0 }, { x: 36, y: 16 }, { x: 0, y: 16 }], 7.5, {
  description: 'Nef ouverte', floor: 'marble', spacing: 3.8,
  details: { era: 'Beaux-Arts', lighting: 'daylight', ambient: 'Verrière', capacity: 200 },
})

export const BUILTIN_LAYOUTS: Record<string, RoomBlueprint> = {
  louvre: LOUVRE,
  hermitage: HERMITAGE,
  orsay: ORSAY,
  pompidou: POMPIDOU,
  palaisdetokyo: TOKYO,
  met: MET,
  rijks: RIJKS,
  uffizi: UFFIZI,
  prado: PRADO,
  nglondon: NG,
  xartists: CYBER,
  'gallery-corridor': CORRIDOR,
  'glass-nave': GLASS,
  cabinet: CABINET,
  rotunda: ROTUNDA,
  'cyber-grid': CYBER,
}

export const MUSEUM_TO_LAYOUT: Record<string, keyof typeof BUILTIN_LAYOUTS> = {
  xartists: 'xartists',
  louvre: 'louvre',
  hermitage: 'hermitage',
  orsay: 'orsay',
  pompidou: 'pompidou',
  palaisdetokyo: 'palaisdetokyo',
  met: 'met',
  rijks: 'rijks',
  vangogh: 'cabinet',
  mauritshuis: 'cabinet',
  uffizi: 'uffizi',
  prado: 'prado',
  nglondon: 'nglondon',
  tate: 'nglondon',
  vatican: 'gallery-corridor',
  gemaldegalerie: 'gallery-corridor',
  kunsthistorisches: 'rotunda',
  brera: 'rotunda',
  accademia: 'uffizi',
  mrbab: 'glass-nave',
  gulbenkian: 'glass-nave',
  mnac: 'rotunda',
}

export function builtinBlueprintForMuseum(museumId: string): RoomBlueprint {
  const key = MUSEUM_TO_LAYOUT[museumId] || 'gallery-corridor'
  const base = BUILTIN_LAYOUTS[key] || CORRIDOR
  return { ...base, id: `${base.id}:${museumId}`, name: base.name, details: { ...base.details } }
}
