/**
 * Location d’espace d’exposition — tarifs paper selon notoriété + durée dégressive.
 * Split revenus (cible SC) : institution · associations · LIA · holders TRO.
 */

export type VenueTierId = 'iconic' | 'major' | 'regional' | 'indie' | 'xartists'

export type VenueRentalTier = {
  id: VenueTierId
  label: string
  examples: string[]
  /** EUR / mois (1 mur / slot salle) — prix catalogue 1 mois */
  priceEurMonth: number
  slotsHint: string
}

/** Split cible des loyers d’expo (somme = 100) */
export const VENUE_REVENUE_SPLIT = {
  institution: 40,
  associations: 20,
  liaTreasury: 25,
  holdersRewards: 15,
} as const

export const VENUE_RENTAL_TIERS: VenueRentalTier[] = [
  {
    id: 'iconic',
    label: 'Iconique',
    examples: ['Louvre', 'MoMA', 'Uffizi'],
    priceEurMonth: 100,
    slotsHint: '1 mur · grille durée dégressive',
  },
  {
    id: 'major',
    label: 'Majeur',
    examples: ['Orsay', 'Pompidou', 'Tate Modern'],
    priceEurMonth: 70,
    slotsHint: '1 mur · grille durée dégressive',
  },
  {
    id: 'regional',
    label: 'Régional / national',
    examples: ['Palais de Tokyo', 'musées nationaux'],
    priceEurMonth: 45,
    slotsHint: '1 mur · grille durée dégressive',
  },
  {
    id: 'indie',
    label: 'Indépendant',
    examples: ['galeries partenaires', 'pop-up'],
    priceEurMonth: 25,
    slotsHint: '1 mur · grille durée dégressive',
  },
  {
    id: 'xartists',
    label: 'Hall xArtists (on-chain)',
    examples: ['Musée xArtists · NFTUDURI'],
    priceEurMonth: 15,
    slotsHint: '1 mur · priorité holders',
  },
]

/** Multiplicateur total vs (prix_mensuel × mois) — dégressif */
export const DURATION_OPTIONS = [
  { months: 1, label: '1 mois', multiplier: 1 },
  { months: 3, label: '3 mois', multiplier: 0.92 },
  { months: 6, label: '6 mois', multiplier: 0.85 },
  { months: 12, label: '12 mois', multiplier: 0.75 },
] as const

/** Réduction mur supplémentaire (2e, 3e…) sur le même lieu */
export const WALL_COUNT_DISCOUNT = [
  { walls: 1, factor: 1 },
  { walls: 2, factor: 0.95 },
  { walls: 3, factor: 0.9 },
  { walls: 4, factor: 0.85 },
] as const

export function wallFactor(walls: number): number {
  const w = Math.max(1, Math.min(4, Math.round(walls)))
  return WALL_COUNT_DISCOUNT.find(x => x.walls === w)?.factor ?? 0.85
}

export function durationFactor(months: number): number {
  const hit = DURATION_OPTIONS.find(d => d.months === months)
  return hit?.multiplier ?? 1
}

/** Prix total EUR paper pour N murs × M mois */
export function quoteVenueRental(opts: {
  priceEurMonth: number
  months: number
  walls?: number
}): { totalEur: number; perMonthEffective: number; savingsPct: number } {
  const walls = opts.walls ?? 1
  const list = opts.priceEurMonth * opts.months * walls
  const total = opts.priceEurMonth * opts.months * walls * durationFactor(opts.months) * wallFactor(walls)
  const savingsPct = list > 0 ? Math.round((1 - total / list) * 100) : 0
  return {
    totalEur: Math.round(total * 100) / 100,
    perMonthEffective: Math.round((total / opts.months) * 100) / 100,
    savingsPct,
  }
}

export function splitVenuePayment(amountEur: number) {
  const s = VENUE_REVENUE_SPLIT
  return {
    institution: (amountEur * s.institution) / 100,
    associations: (amountEur * s.associations) / 100,
    liaTreasury: (amountEur * s.liaTreasury) / 100,
    holdersRewards: (amountEur * s.holdersRewards) / 100,
  }
}

export function tierForMuseumId(museumId: string): VenueTierId {
  const m = museumId.toLowerCase()
  if (m.includes('louvre') || m.includes('moma') || m.includes('uffizi')) return 'iconic'
  if (m.includes('orsay') || m.includes('pompidou') || m.includes('tate')) return 'major'
  if (m.includes('tokyo') || m.includes('national')) return 'regional'
  if (m === 'xartists' || m.includes('xartist')) return 'xartists'
  return 'indie'
}

export function tierById(id: VenueTierId): VenueRentalTier {
  return VENUE_RENTAL_TIERS.find(t => t.id === id) || VENUE_RENTAL_TIERS[VENUE_RENTAL_TIERS.length - 1]
}
