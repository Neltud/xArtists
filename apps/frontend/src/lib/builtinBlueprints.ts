/**
 * Plans 3D embarqués — la démo live n’attend pas le fetch JSON.
 * Chaque musée mappe vers un de ces layouts.
 */
import type { RoomBlueprint } from './roomBlueprint'

function rect(
  id: string,
  name: string,
  w: number,
  d: number,
  h: number,
  opts: Partial<RoomBlueprint> & {
    description: string
    floor?: 'stone' | 'wood' | 'marble' | 'concrete'
    details?: RoomBlueprint['details']
  }
): RoomBlueprint {
  const walls = [
    { id: `${id}-s`, x1: 0, y1: 0, x2: w, y2: 0, height: h, thickness: 0.3 },
    { id: `${id}-e`, x1: w, y1: 0, x2: w, y2: d, height: h, thickness: 0.3 },
    { id: `${id}-n`, x1: w, y1: d, x2: 0, y2: d, height: h, thickness: 0.3 },
    { id: `${id}-w`, x1: 0, y1: d, x2: 0, y2: 0, height: h, thickness: 0.3 },
  ]
  const anchors: RoomBlueprint['artAnchors'] = []
  const stepS = Math.max(2, w / 8)
  for (let x = stepS; x < w - 0.5; x += stepS) {
    anchors.push({
      id: `${id}-s-${x}`,
      wallId: `${id}-s`,
      x,
      y: 0,
      facing: Math.PI / 2,
      height: 1.55,
    })
  }
  for (let x = stepS; x < w - 0.5; x += stepS) {
    anchors.push({
      id: `${id}-n-${x}`,
      wallId: `${id}-n`,
      x,
      y: d,
      facing: -Math.PI / 2,
      height: 1.55,
    })
  }
  for (let y = 2; y < d - 1; y += Math.max(2, d / 4)) {
    anchors.push({
      id: `${id}-e-${y}`,
      wallId: `${id}-e`,
      x: w,
      y,
      facing: Math.PI,
      height: 1.55,
    })
    anchors.push({
      id: `${id}-w-${y}`,
      wallId: `${id}-w`,
      x: 0,
      y,
      facing: 0,
      height: 1.55,
    })
  }
  return {
    id,
    name,
    description: opts.description,
    wallHeight: h,
    wallThickness: 0.3,
    walls,
    openings: [
      {
        id: `${id}-door`,
        wallId: `${id}-w`,
        type: 'door',
        offset: d / 2 - 1,
        width: 2,
        height: Math.min(3, h * 0.7),
        sill: 0,
      },
      {
        id: `${id}-win1`,
        wallId: `${id}-n`,
        type: 'window',
        offset: w * 0.2,
        width: w * 0.15,
        height: h * 0.35,
        sill: h * 0.25,
      },
      {
        id: `${id}-win2`,
        wallId: `${id}-n`,
        type: 'window',
        offset: w * 0.55,
        width: w * 0.15,
        height: h * 0.35,
        sill: h * 0.25,
      },
    ],
    rooms: [
      {
        id: `${id}-r`,
        name,
        polygon: [
          { x: 0, y: 0 },
          { x: w, y: 0 },
          { x: w, y: d },
          { x: 0, y: d },
        ],
        floor: opts.floor || 'stone',
      },
    ],
    artAnchors: anchors,
    details: opts.details,
    schema: 'xartists.roomBlueprint.v1',
    source: 'builtin',
  }
}

export const BUILTIN_LAYOUTS: Record<string, RoomBlueprint> = {
  'gallery-corridor': rect('gallery-corridor', 'Grande Galerie', 48, 9, 5.2, {
    description: 'Enfilade classique — Louvre / Prado / National Gallery',
    floor: 'stone',
    details: {
      era: 'XIXe',
      lighting: 'museum',
      ambient: 'Enfilade longue · baies latérales',
      capacity: 120,
    },
  }),
  'glass-nave': rect('glass-nave', 'Nef vitrée', 36, 16, 7.5, {
    description: 'Grande nef ouverte — Orsay / Met',
    floor: 'marble',
    details: {
      era: 'Beaux-Arts',
      lighting: 'daylight',
      ambient: 'Verrière · volume aéré',
      capacity: 200,
    },
  }),
  cabinet: rect('cabinet', 'Cabinet intime', 9, 7, 3.4, {
    description: 'Petite salle feutrée — Rijks / Mauritshuis / Van Gogh',
    floor: 'wood',
    details: {
      era: 'XVIIe',
      lighting: 'spot',
      ambient: 'Bois sombre · accrochage dense',
      capacity: 18,
    },
  }),
  rotunda: rect('rotunda', 'Rotonde', 16, 16, 6, {
    description: 'Salle large — Uffizi / Brera',
    floor: 'marble',
    details: {
      era: 'Renaissance',
      lighting: 'daylight',
      ambient: 'Parcours circulaire',
      capacity: 60,
    },
  }),
  'cyber-grid': rect('cyber-grid', 'Hall xArtists', 20, 14, 4.2, {
    description: 'Salle signature MultiversX — NFT on-chain',
    floor: 'concrete',
    details: {
      era: '2026',
      city: 'Virtuel',
      lighting: 'neon',
      ambient: 'Grille cyan · slots NFT',
      capacity: 80,
    },
  }),
}

/** museumId → layout key */
export const MUSEUM_TO_LAYOUT: Record<string, keyof typeof BUILTIN_LAYOUTS> = {
  xartists: 'cyber-grid',
  louvre: 'gallery-corridor',
  prado: 'gallery-corridor',
  nglondon: 'gallery-corridor',
  kmska: 'gallery-corridor',
  gemaldegalerie: 'gallery-corridor',
  vatican: 'gallery-corridor',
  hermitage: 'gallery-corridor',
  tate: 'gallery-corridor',
  orsay: 'glass-nave',
  met: 'glass-nave',
  bozar: 'glass-nave',
  gulbenkian: 'glass-nave',
  mrbab: 'glass-nave',
  rijks: 'cabinet',
  mauritshuis: 'cabinet',
  vangogh: 'cabinet',
  ngprague: 'cabinet',
  mnw: 'cabinet',
  soares: 'cabinet',
  uffizi: 'rotunda',
  pinacoteca: 'rotunda',
  brera: 'rotunda',
  kunsthistorisches: 'rotunda',
  accademia: 'rotunda',
  mnac: 'rotunda',
  mfabudapest: 'cabinet',
}

export function builtinBlueprintForMuseum(museumId: string): RoomBlueprint {
  const key = MUSEUM_TO_LAYOUT[museumId] || 'gallery-corridor'
  const base = BUILTIN_LAYOUTS[key]
  // clone léger avec id musée pour le HUD
  return {
    ...base,
    id: `${base.id}:${museumId}`,
    name: base.name,
    details: {
      ...base.details,
      city: base.details?.city,
    },
  }
}
