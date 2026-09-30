/**
 * Capacités salle / mur — produit musée & packs.
 * 1 pack IA = 1 salle privée ; murs achetés = slots d'œuvres.
 */

export const MUSEUM_CAPACITY = {
  /** Max œuvres affichées en visite publique (grille + 3D) */
  maxArtworksPublic: 24,
  /** Œuvres max par mur (placement 3D) */
  maxArtworksPerWall: 4,
  /** Murs typiques salle pack (Pulse / Yield / Sentinel) */
  wallsPerPackRoom: 4,
  /** Capacité totale salle pack */
  artworksPerPackRoom: 16, // 4 murs × 4
  /** Sculpture pedestal slots */
  maxSculptures: 8,
  /** Distance min avatar–mur (m) — collision */
  wallClearanceM: 0.18,
} as const

export function artSlotsForWalls(wallCount: number): number {
  return Math.max(0, wallCount) * MUSEUM_CAPACITY.maxArtworksPerWall
}

export function packRoomSummary(packName?: string) {
  const w = MUSEUM_CAPACITY.wallsPerPackRoom
  const per = MUSEUM_CAPACITY.maxArtworksPerWall
  return {
    walls: w,
    perWall: per,
    totalSlots: w * per,
    label: packName
      ? `${packName} · ${w} murs · jusqu'à ${per} œuvres/mur (${w * per} max)`
      : `${w} murs · ${per} œuvres/mur · ${w * per} slots`,
  }
}

export function formatWallOccupancy(artCount: number, wallCount: number): string {
  const slots = artSlotsForWalls(wallCount)
  if (slots <= 0) return `${artCount} œuvre(s)`
  return `${Math.min(artCount, slots)} / ${slots} slots (${wallCount} murs × ${MUSEUM_CAPACITY.maxArtworksPerWall})`
}
