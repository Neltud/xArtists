/**
 * LIA Immersive Museum — spaces & access (honest freemium).
 * Galerie publique = free · Mes NFTs = wallet · VR Core = LIA Pass (pending).
 */

export type MuseumSpaceId = 'catzligue' | 'mydee' | 'vr_core' | 'world_tour'

export type MuseumSpace = {
  id: MuseumSpaceId
  name: string
  tagline: string
  access: 'free' | 'wallet' | 'lia_pass'
  theme: 'cyber' | 'sanctuary' | 'void' | 'globe'
}

export const MUSEUM_SPACES: MuseumSpace[] = [
  {
    id: 'catzligue',
    name: 'Galerie publique',
    tagline: 'Visite libre — collections xArtists & musées-ville',
    access: 'free',
    theme: 'cyber',
  },
  {
    id: 'mydee',
    name: 'Mes NFTs',
    tagline: 'Tes œuvres on-chain (wallet connecté)',
    access: 'wallet',
    theme: 'sanctuary',
  },
  {
    id: 'world_tour',
    name: 'Visite guidée mondiale',
    tagline: 'LIA guide les destinations artistiques (carte Tours)',
    access: 'free',
    theme: 'globe',
  },
  {
    id: 'vr_core',
    name: 'VR Core',
    tagline: 'WebXR full immersion — LIA Pass (à venir)',
    access: 'lia_pass',
    theme: 'void',
  },
]

export type TourStop = {
  id: string
  city: string
  country: string
  focus: string
  region?: string
  lat?: number
  lng?: number
}

/** Fallback stops if art_tour_locations.json offline */
export const FALLBACK_TOUR_STOPS: TourStop[] = [
  { id: 'paris', city: 'Paris', country: 'France', focus: 'Modern & phygital', region: 'europe' },
  { id: 'london', city: 'London', country: 'UK', focus: 'Contemporary', region: 'europe' },
  { id: 'berlin', city: 'Berlin', country: 'Germany', focus: 'Avant-garde', region: 'europe' },
  { id: 'nyc', city: 'New York', country: 'USA', focus: 'Gallery district', region: 'americas' },
  { id: 'tokyo', city: 'Tokyo', country: 'Japan', focus: 'Digital art', region: 'asia' },
  { id: 'seoul', city: 'Seoul', country: 'Korea', focus: 'Media art', region: 'asia' },
  { id: 'lagos', city: 'Lagos', country: 'Nigeria', focus: 'Contemporary Africa', region: 'africa' },
  { id: 'sao-paulo', city: 'São Paulo', country: 'Brazil', focus: 'Latin modern', region: 'americas' },
  { id: 'sydney', city: 'Sydney', country: 'Australia', focus: 'Pacific', region: 'oceania' },
  { id: 'dubai', city: 'Dubai', country: 'UAE', focus: 'Crossroads', region: 'asia' },
]

export async function loadTourStops(): Promise<TourStop[]> {
  const urls = [
    `${import.meta.env.BASE_URL}data/art_tour_locations.json`,
    'https://raw.githubusercontent.com/Neltud/xArtists/main/data/art_tour_locations.json',
  ]
  for (const u of urls) {
    try {
      const r = await fetch(`${u}?t=${Date.now()}`, { cache: 'no-store' })
      if (!r.ok) continue
      const j = await r.json()
      const rows = Array.isArray(j) ? j : j.stops || j.locations || []
      if (rows.length) {
        return rows.map((x: Record<string, unknown>, i: number) => ({
          id: String(x.id || x.city || i),
          city: String(x.city || x.label || '—'),
          country: String(x.country || ''),
          focus: String(x.focus || x.note || ''),
          region: x.region ? String(x.region) : undefined,
          lat: typeof x.lat === 'number' ? x.lat : undefined,
          lng: typeof x.lng === 'number' ? x.lng : undefined,
        }))
      }
    } catch {
      /* next */
    }
  }
  return FALLBACK_TOUR_STOPS
}
