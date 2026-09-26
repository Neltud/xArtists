/**
 * Location d’espace d’exposition — tarifs paper selon notoriété.
 * Split revenus (cible SC) : institution · associations · LIA · holders TRO.
 * Paper-first : pas de prélèvement on-chain tant que codeHash OFF.
 */

export type VenueTierId = 'iconic' | 'major' | 'regional' | 'indie' | 'xartists'

export type VenueRentalTier = {
  id: VenueTierId
  label: string
  examples: string[]
  /** EUR / mois (1 mur / slot salle) */
  priceEurMonth: number
  slotsHint: string
}

/** Split cible des loyers d’expo (somme = 100) */
export const VENUE_REVENUE_SPLIT = {
  institution: 40, // musée / lieu (ex. Louvre partenaires)
  associations: 20, // art numérique / associations artistes
  liaTreasury: 25, // ops LIA · indexeur · maintenance
  holdersRewards: 15, // pool SC rewards (TRO LP + ArtPass staked)
} as const

export const VENUE_RENTAL_TIERS: VenueRentalTier[] = [
  {
    id: 'iconic',
    label: 'Iconique',
    examples: ['Louvre', 'MoMA', 'Uffizi'],
    priceEurMonth: 100,
    slotsHint: '1 mur · 1 mois · 4–6 œuvres',
  },
  {
    id: 'major',
    label: 'Majeur',
    examples: ['Orsay', 'Pompidou', 'Tate Modern'],
    priceEurMonth: 70,
    slotsHint: '1 mur · 1 mois',
  },
  {
    id: 'regional',
    label: 'Régional / national',
    examples: ['Palais de Tokyo', 'musées nationaux'],
    priceEurMonth: 45,
    slotsHint: '1 mur · 1 mois',
  },
  {
    id: 'indie',
    label: 'Indépendant',
    examples: ['galeries partenaires', 'pop-up'],
    priceEurMonth: 25,
    slotsHint: '1 mur · 1 mois',
  },
  {
    id: 'xartists',
    label: 'Hall xArtists (on-chain)',
    examples: ['Musée xArtists · NFTUDURI'],
    priceEurMonth: 15,
    slotsHint: '1 mur · 1 mois · priorité holders',
  },
]

export function splitVenuePayment(amountEur: number) {
  const s = VENUE_REVENUE_SPLIT
  return {
    institution: (amountEur * s.institution) / 100,
    associations: (amountEur * s.associations) / 100,
    liaTreasury: (amountEur * s.liaTreasury) / 100,
    holdersRewards: (amountEur * s.holdersRewards) / 100,
  }
}

/** Mapping musée virtuel → tier tarifaire */
export function tierForMuseumId(museumId: string): VenueTierId {
  const m = museumId.toLowerCase()
  if (m.includes('louvre') || m.includes('moma') || m.includes('uffizi')) return 'iconic'
  if (m.includes('orsay') || m.includes('pompidou') || m.includes('tate')) return 'major'
  if (m.includes('tokyo') || m.includes('national')) return 'regional'
  if (m === 'xartists' || m.includes('xartist')) return 'xartists'
  return 'indie'
}
