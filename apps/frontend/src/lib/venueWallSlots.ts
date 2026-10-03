/**
 * Venue mur → slots d'œuvres (device + option on-chain rent).
 * wallId = même string que rentPay (ex. wall-1).
 * Affichage musée 3D = frames fusionnées par mur loué / assigné.
 */

import { MUSEUM_CAPACITY } from './museumCapacity'
import type { FrameItem } from '../components/museum/MuseumCorridor'

const OWNED_KEY = 'xartists_venue_walls_owned_v1'
const SLOTS_KEY = 'xartists_venue_wall_slots_v1'

export type WallSlotAssignment = {
  wallId: string
  /** NFT identifiers erd…-nonce or catalog ids */
  identifiers: string[]
  updatedAt: number
}

export type OwnedWall = {
  wallId: string
  /** paper | live */
  mode: 'paper' | 'live'
  amountEgld?: number
  txHash?: string
  at: number
}

/** Murs proposés (alignés rentPay tests + produit) */
export const VENUE_WALL_CATALOG: {
  wallId: string
  label: string
  priceEgld: number
  museumHint: string
}[] = [
  { wallId: 'wall-1', label: 'Mur Nord', priceEgld: 0.001, museumHint: 'Salle principale · mur N' },
  { wallId: 'wall-2', label: 'Mur Est', priceEgld: 0.001, museumHint: 'Salle principale · mur E' },
  { wallId: 'wall-3', label: 'Mur Sud', priceEgld: 0.001, museumHint: 'Salle principale · mur S' },
  { wallId: 'wall-4', label: 'Mur Ouest', priceEgld: 0.001, museumHint: 'Salle principale · mur O' },
]

export function maxSlotsPerWall(): number {
  return MUSEUM_CAPACITY.maxArtworksPerWall
}

export function loadOwnedWalls(): OwnedWall[] {
  try {
    const raw = localStorage.getItem(OWNED_KEY)
    if (!raw) return []
    const j = JSON.parse(raw) as OwnedWall[]
    return Array.isArray(j) ? j : []
  } catch {
    return []
  }
}

export function saveOwnedWalls(rows: OwnedWall[]): void {
  try {
    localStorage.setItem(OWNED_KEY, JSON.stringify(rows.slice(-40)))
  } catch {
    /* */
  }
}

export function markWallOwned(
  wallId: string,
  opts: { mode: 'paper' | 'live'; amountEgld?: number; txHash?: string },
): void {
  const prev = loadOwnedWalls().filter(w => w.wallId !== wallId)
  prev.push({
    wallId,
    mode: opts.mode,
    amountEgld: opts.amountEgld,
    txHash: opts.txHash,
    at: Date.now(),
  })
  saveOwnedWalls(prev)
}

export function isWallOwned(wallId: string): boolean {
  return loadOwnedWalls().some(w => w.wallId === wallId)
}

export function loadAllAssignments(): WallSlotAssignment[] {
  try {
    const raw = localStorage.getItem(SLOTS_KEY)
    if (!raw) return []
    const j = JSON.parse(raw) as WallSlotAssignment[]
    return Array.isArray(j) ? j : []
  } catch {
    return []
  }
}

function saveAllAssignments(rows: WallSlotAssignment[]): void {
  try {
    localStorage.setItem(SLOTS_KEY, JSON.stringify(rows))
  } catch {
    /* */
  }
}

export function getWallSlots(wallId: string): string[] {
  const row = loadAllAssignments().find(a => a.wallId === wallId)
  return row?.identifiers?.filter(Boolean) || []
}

export function setWallSlots(wallId: string, identifiers: string[]): void {
  const max = maxSlotsPerWall()
  const ids = [...new Set(identifiers.filter(Boolean))].slice(0, max)
  const rest = loadAllAssignments().filter(a => a.wallId !== wallId)
  rest.push({ wallId, identifiers: ids, updatedAt: Date.now() })
  saveAllAssignments(rest)
}

export function toggleNftOnWall(wallId: string, identifier: string): string[] {
  if (!isWallOwned(wallId)) return getWallSlots(wallId)
  const cur = getWallSlots(wallId)
  const max = maxSlotsPerWall()
  let next: string[]
  if (cur.includes(identifier)) {
    next = cur.filter(id => id !== identifier)
  } else {
    if (cur.length >= max) return cur
    next = [...cur, identifier]
  }
  setWallSlots(wallId, next)
  return next
}

/** Tous les identifiers assignés sur murs possédés */
export function allAssignedIdentifiers(): string[] {
  const owned = new Set(loadOwnedWalls().map(w => w.wallId))
  const ids: string[] = []
  for (const a of loadAllAssignments()) {
    if (!owned.has(a.wallId)) continue
    for (const id of a.identifiers || []) if (id) ids.push(id)
  }
  return [...new Set(ids)]
}

/**
 * Fusionne frames visite + œuvres assignées aux murs loués
 * (priorité aux assignations venue en tête pour le hall 3D).
 */
export function mergeVenueFrames(
  base: FrameItem[],
  fromWallet: FrameItem[],
): FrameItem[] {
  const assigned = new Set(allAssignedIdentifiers())
  if (assigned.size === 0) return base

  const byId = new Map<string, FrameItem>()
  for (const f of [...fromWallet, ...base]) {
    if (f?.id) byId.set(f.id, f)
  }

  const venueFirst: FrameItem[] = []
  for (const id of assigned) {
    const f = byId.get(id)
    if (f) venueFirst.push({ ...f, title: f.title || id })
  }
  const rest = base.filter(f => !assigned.has(f.id))
  const max = MUSEUM_CAPACITY.maxArtworksPublic
  return [...venueFirst, ...rest].slice(0, max)
}

export function wallLabel(wallId: string): string {
  return VENUE_WALL_CATALOG.find(w => w.wallId === wallId)?.label || wallId
}
