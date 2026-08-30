/**
 * LIA Immersive Museum — spaces & access (honest freemium).
 * Catzligue = public · Mydee = wallet · VR Core = LIA Pass (pending).
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
    name: 'Catzligue',
    tagline: 'Galerie publique xArtists — cyber-minimal',
    access: 'free',
    theme: 'cyber',
  },
  {
    id: 'mydee',
    name: 'Mydee',
    tagline: 'Sanctuaire privé — tes NFTs on-chain',
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

/** Fallback stops if art_world_locations.json offline */
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
    `${import.meta.env.BASE_URL}data/art_world_locations.json`,
    'https://raw.githubusercontent.com/Neltud/xArtists/main/data/art_world_locations.json',
  ]
  for (const u of urls) {
    try {
      const r = await fetch(`${u}?t=${Date.now()}`, { cache: 'no-store' })
      if (!r.ok) continue
      const j = await r.json()
      const rows = Array.isArray(j) ? j : j.locations || j.cities || []
      if (!Array.isArray(rows) || !rows.length) continue
      return rows.map((x: Record<string, unknown>) => ({
        id: String(x.id || x.city || '').toLowerCase().replace(/\s+/g, '-'),
        city: String(x.city || x.name || '—'),
        country: String(x.country || ''),
        focus: String(x.focus || x.note || 'Art destination'),
        region: x.region ? String(x.region) : undefined,
        lat: typeof x.lat === 'number' ? x.lat : undefined,
        lng: typeof x.lng === 'number' ? x.lng : undefined,
      }))
    } catch {
      /* next */
    }
  }
  return FALLBACK_TOUR_STOPS
}

export const LIA_HOST_LINES: Record<MuseumSpaceId, string[]> = {
  catzligue: [
    'Bienvenue dans Catzligue — galerie publique xArtists.',
    'Les cadres affichent le catalogue MultiversX (lecture seule).',
    'Dis-moi « guide-moi » pour une visite, ou ouvre Mydee avec ton wallet.',
  ],
  mydee: [
    'Mydee — ton sanctuaire. Seuls tes NFTs on-chain apparaissent ici.',
    'Aucune transaction simulée : ce que tu vois vient de l’API MultiversX.',
  ],
  world_tour: [
    'Visite guidée mondiale — destinations culturelles (service Tours).',
    'Je te mène de ville en ville. Les expos live sont sur la carte Tours.',
  ],
  vr_core: [
    'VR Core nécessite un LIA Pass (NFT d’accès) — pas encore minté on-chain.',
    'WebXR (R3F + @react-three/xr) est sur la roadmap premium.',
  ],
}
