/**
 * Réseau de musées — xArtists en premier.
 * 100+ peintures Met (domaine public) via catalog.json + CDN Met.
 */
import type { FrameItem } from '../components/museum/MuseumCorridor'

export type VirtualMuseumId =
  | 'xartists'
  | 'met_wing_a'
  | 'met_wing_b'
  | 'met_wing_c'
  | 'met_wing_d'
  | 'met_wing_e'
  | 'met_wing_f'
  | 'met_wing_g'
  | 'met_wing_h'
  | 'graphic'

export type VirtualMuseum = {
  id: VirtualMuseumId | string
  name: string
  city: string
  country: string
  tagline: string
  source: 'onchain' | 'public_domain'
  room: 'cyber' | 'stone' | 'gold' | 'white' | 'dark'
  works: FrameItem[]
}

export type CatalogWork = {
  id: string
  title: string
  artist: string
  year?: string
  museum?: string
  file?: string
  remote?: string | null
}

function toFrame(w: CatalogWork, base: string): FrameItem {
  const local = w.file ? `${base}${w.file}` : undefined
  // Prefer Met CDN (reliable) then local mirror under public/museum/
  const image = w.remote || local || undefined
  return {
    id: w.id,
    title: w.title,
    subtitle: [w.artist, w.year].filter(Boolean).join(' · '),
    collection: w.museum || 'The Met',
    description: `Domaine public — ${w.artist}${w.year ? `, ${w.year}` : ''}. Met Museum Open Access.`,
    image,
    type: 'Public domain',
    href: w.remote || local,
  }
}

const WING_META: { id: string; name: string; tagline: string; room: VirtualMuseum['room'] }[] = [
  { id: 'met_wing_a', name: 'Met · Aile A', tagline: 'Renaissance & premiers maîtres', room: 'stone' },
  { id: 'met_wing_b', name: 'Met · Aile B', tagline: 'Portraits européens', room: 'gold' },
  { id: 'met_wing_c', name: 'Met · Aile C', tagline: 'Paysages & marine', room: 'white' },
  { id: 'met_wing_d', name: 'Met · Aile D', tagline: 'Scènes de genre', room: 'dark' },
  { id: 'met_wing_e', name: 'Met · Aile E', tagline: 'Religieux & allégorie', room: 'stone' },
  { id: 'met_wing_f', name: 'Met · Aile F', tagline: 'XVIIe–XVIIIe', room: 'gold' },
  { id: 'met_wing_g', name: 'Met · Aile G', tagline: 'Études & figures', room: 'white' },
  { id: 'met_wing_h', name: 'Met · Aile H', tagline: 'Collection ouverte', room: 'cyber' },
]

/** Charge le catalogue local (100 œuvres) + construit les ailes */
export async function loadMuseumNetwork(baseUrl: string): Promise<VirtualMuseum[]> {
  const base = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'
  let works: CatalogWork[] = []
  try {
    const r = await fetch(`${base}museum/catalog.json?t=${Date.now()}`, { cache: 'no-store' })
    if (r.ok) works = await r.json()
  } catch {
    /* empty */
  }

  const frames = works.map(w => toFrame(w, base))
  const chunk = Math.max(1, Math.ceil((frames.length || 1) / WING_META.length))

  const museums: VirtualMuseum[] = [
    {
      id: 'xartists',
      name: 'Musée xArtists',
      city: 'MultiversX',
      country: 'On-chain',
      tagline: 'Premier musée — NFT mainnet',
      source: 'onchain',
      room: 'cyber',
      works: [],
    },
  ]

  WING_META.forEach((meta, i) => {
    const slice = frames.slice(i * chunk, (i + 1) * chunk)
    if (!slice.length && i > 0) return
    museums.push({
      id: meta.id,
      name: meta.name,
      city: 'New York',
      country: 'USA',
      tagline: `${meta.tagline} · ${slice.length} œuvres`,
      source: 'public_domain',
      room: meta.room,
      works: slice,
    })
  })

  return museums
}

export const VIRTUAL_MUSEUMS: VirtualMuseum[] = [
  {
    id: 'xartists',
    name: 'Musée xArtists',
    city: 'MultiversX',
    country: 'On-chain',
    tagline: 'Premier musée — NFT mainnet',
    source: 'onchain',
    room: 'cyber',
    works: [],
  },
]

export function getMuseum(id: string, list: VirtualMuseum[] = VIRTUAL_MUSEUMS) {
  return list.find(m => m.id === id)
}
