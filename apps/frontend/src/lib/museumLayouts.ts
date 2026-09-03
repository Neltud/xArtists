/**
 * Architecture 3D par lieu — plans distincts (empreinte, murs, placement œuvres).
 * V1 : schémas CSS-3D. V2 : import plan/élévation depuis pipeline floorplan→mesh.
 */

export type LayoutId =
  | 'cyber_grid'
  | 'grand_corridor'
  | 'glass_nave'
  | 'rotunda'
  | 'dual_gallery'
  | 'courtyard'
  | 'cabinet'
  | 'sky_hall'

export type MuseumLayout = {
  id: LayoutId
  /** Libellé UI */
  label: string
  /** Largeur relative du couloir central (0.4–0.7) */
  naveWidth: number
  /** Angle mur latéral (deg) — plus faible = salle plus ouverte */
  wallYaw: number
  /** Hauteur mur / plafond (perspective) */
  wallPitch: number
  /** Espacement Z entre œuvres */
  artSpacing: number
  /** Décalage latéral des cadres (% depuis centre) */
  artSide: number
  /** Motif placement : alternate | left_heavy | ring | grid */
  placement: 'alternate' | 'left_heavy' | 'ring' | 'grid'
  /** Plafond plus bas / plus haut (échelle visuelle) */
  ceilingScale: number
  /** Largeur max d’un cadre (px scale) */
  frameScale: number
}

export const LAYOUTS: Record<LayoutId, MuseumLayout> = {
  cyber_grid: {
    id: 'cyber_grid',
    label: 'Grille cyber',
    naveWidth: 0.55,
    wallYaw: 58,
    wallPitch: 55,
    artSpacing: 0.5,
    artSide: 16,
    placement: 'grid',
    ceilingScale: 0.22,
    frameScale: 92,
  },
  grand_corridor: {
    id: 'grand_corridor',
    label: 'Grande galerie',
    naveWidth: 0.42,
    wallYaw: 62,
    wallPitch: 52,
    artSpacing: 0.55,
    artSide: 20,
    placement: 'alternate',
    ceilingScale: 0.18,
    frameScale: 88,
  },
  glass_nave: {
    id: 'glass_nave',
    label: 'Nef vitrée',
    naveWidth: 0.62,
    wallYaw: 48,
    wallPitch: 50,
    artSpacing: 0.48,
    artSide: 14,
    placement: 'alternate',
    ceilingScale: 0.26,
    frameScale: 96,
  },
  rotunda: {
    id: 'rotunda',
    label: 'Rotonde',
    naveWidth: 0.7,
    wallYaw: 40,
    wallPitch: 45,
    artSpacing: 0.42,
    artSide: 22,
    placement: 'ring',
    ceilingScale: 0.28,
    frameScale: 84,
  },
  dual_gallery: {
    id: 'dual_gallery',
    label: 'Double aile',
    naveWidth: 0.48,
    wallYaw: 56,
    wallPitch: 54,
    artSpacing: 0.52,
    artSide: 24,
    placement: 'left_heavy',
    ceilingScale: 0.2,
    frameScale: 90,
  },
  courtyard: {
    id: 'courtyard',
    label: 'Cour intérieure',
    naveWidth: 0.68,
    wallYaw: 44,
    wallPitch: 48,
    artSpacing: 0.46,
    artSide: 18,
    placement: 'ring',
    ceilingScale: 0.3,
    frameScale: 86,
  },
  cabinet: {
    id: 'cabinet',
    label: 'Cabinet',
    naveWidth: 0.38,
    wallYaw: 64,
    wallPitch: 58,
    artSpacing: 0.4,
    artSide: 12,
    placement: 'alternate',
    ceilingScale: 0.16,
    frameScale: 78,
  },
  sky_hall: {
    id: 'sky_hall',
    label: 'Hall lumineux',
    naveWidth: 0.6,
    wallYaw: 50,
    wallPitch: 46,
    artSpacing: 0.5,
    artSide: 15,
    placement: 'grid',
    ceilingScale: 0.32,
    frameScale: 94,
  },
}

/** Mapping musée → plan d’architecture (unique par lieu). */
export const MUSEUM_LAYOUT: Record<string, LayoutId> = {
  xartists: 'cyber_grid',
  louvre: 'grand_corridor',
  orsay: 'glass_nave',
  nglondon: 'dual_gallery',
  rijks: 'cabinet',
  vangogh: 'sky_hall',
  uffizi: 'rotunda',
  prado: 'grand_corridor',
  met: 'courtyard',
  mauritshuis: 'cabinet',
  kmska: 'dual_gallery',
  bozar: 'sky_hall',
  pinacoteca: 'rotunda',
  mfabudapest: 'courtyard',
  mnw: 'cabinet',
}

export function layoutForMuseum(museumId: string): MuseumLayout {
  const id = MUSEUM_LAYOUT[museumId] || 'grand_corridor'
  return LAYOUTS[id]
}

/** Position d’une œuvre selon le plan (index, total, progression z). */
export function artPosition(
  layout: MuseumLayout,
  index: number,
  total: number,
  maxZ: number
): { artZ: number; side: number; xBias: number } {
  const artZ = (index + 1) * (maxZ / (total + 1))
  let side = index % 2 === 0 ? -1 : 1
  let xBias = 0

  switch (layout.placement) {
    case 'left_heavy':
      side = index % 3 === 2 ? 1 : -1
      xBias = side * 2
      break
    case 'ring': {
      // placement quasi circulaire en X
      const t = (index / Math.max(1, total - 1)) * Math.PI * 2
      side = Math.cos(t) >= 0 ? 1 : -1
      xBias = Math.sin(t) * 6
      break
    }
    case 'grid':
      side = index % 2 === 0 ? -1 : 1
      xBias = (index % 4 < 2 ? -1 : 1) * 3
      break
    default:
      break
  }

  return { artZ, side, xBias }
}
