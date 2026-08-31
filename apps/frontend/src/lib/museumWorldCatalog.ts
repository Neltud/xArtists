/**
 * Réseau de musées par VILLE — clic ville → salle + œuvres (Met Open Access).
 */
import type { FrameItem } from '../components/museum/MuseumCorridor'
import { MET_WORKS } from '../data/metCatalog'

export type VirtualMuseum = {
  id: string
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

const CITY_DEFS: {
  id: string
  name: string
  city: string
  country: string
  tagline: string
  room: VirtualMuseum['room']
  aliases?: string[]
}[] = [
  { id: 'paris', name: 'Paris · Salons', city: 'Paris', country: 'France', tagline: 'Galeries · foires · street art', room: 'stone', aliases: ['paris'] },
  { id: 'london', name: 'London · Galleries', city: 'London', country: 'UK', tagline: 'National collections', room: 'white', aliases: ['london', 'londres'] },
  { id: 'amsterdam', name: 'Amsterdam · Golden Age', city: 'Amsterdam', country: 'Pays-Bas', tagline: 'Âge d’or', room: 'dark' },
  { id: 'florence', name: 'Florence · Renaissance', city: 'Florence', country: 'Italie', tagline: 'Renaissance', room: 'white', aliases: ['florence', 'firenze'] },
  { id: 'madrid', name: 'Madrid · Prado spirit', city: 'Madrid', country: 'Espagne', tagline: 'Siècle d’or', room: 'stone' },
  { id: 'newyork', name: 'New York · Met spirit', city: 'New York', country: 'USA', tagline: 'Open Access Met', room: 'gold', aliases: ['newyork', 'nyc', 'new york'] },
  { id: 'berlin', name: 'Berlin · Modern', city: 'Berlin', country: 'Allemagne', tagline: 'Capitales', room: 'cyber' },
  { id: 'vienna', name: 'Vienna · Secession', city: 'Vienna', country: 'Autriche', tagline: 'Empires', room: 'gold', aliases: ['vienna', 'wien', 'vienne'] },
  { id: 'rome', name: 'Rome · Eternal', city: 'Rome', country: 'Italie', tagline: 'Éternelle', room: 'stone', aliases: ['rome', 'roma'] },
  { id: 'brussels', name: 'Brussels · Crossroads', city: 'Brussels', country: 'Belgique', tagline: 'Carrefour', room: 'white', aliases: ['brussels', 'bruxelles'] },
  { id: 'milan', name: 'Milan · Design', city: 'Milan', country: 'Italie', tagline: 'Nord italien', room: 'white', aliases: ['milan', 'milano'] },
  { id: 'prague', name: 'Prague · Central', city: 'Prague', country: 'Tchéquie', tagline: 'Europe centrale', room: 'dark', aliases: ['prague', 'praha'] },
  { id: 'lisbon', name: 'Lisbon · Atlantic', city: 'Lisbon', country: 'Portugal', tagline: 'Atlantique', room: 'white', aliases: ['lisbon', 'lisbonne', 'lisboa'] },
  { id: 'porto', name: 'Porto · Douro', city: 'Porto', country: 'Portugal', tagline: 'Douro', room: 'stone' },
  { id: 'moscow', name: 'Moscow · Hermitage spirit', city: 'Moscow', country: 'Russie', tagline: 'Collections impériales', room: 'gold', aliases: ['moscow', 'moscou'] },
  { id: 'warsaw', name: 'Warsaw · Central', city: 'Warsaw', country: 'Pologne', tagline: 'Europe centrale', room: 'dark', aliases: ['warsaw', 'varsovie'] },
  { id: 'budapest', name: 'Budapest · Danube', city: 'Budapest', country: 'Hongrie', tagline: 'Danube', room: 'gold' },
  { id: 'barcelona', name: 'Barcelona · Modernisme', city: 'Barcelona', country: 'Espagne', tagline: 'Modernisme', room: 'white', aliases: ['barcelona', 'barcelone'] },
  { id: 'venice', name: 'Venice · Lagoon', city: 'Venice', country: 'Italie', tagline: 'Lagune', room: 'gold', aliases: ['venice', 'venise', 'venezia'] },
]

function toFrame(w: CatalogWork, base: string): FrameItem {
  const local = w.file ? `${base}${w.file}` : undefined
  const image = w.remote || local || undefined
  return {
    id: w.id,
    title: w.title,
    subtitle: [w.artist, w.year].filter(Boolean).join(' · '),
    collection: w.museum || 'The Met',
    description: `Domaine public — ${w.artist}${w.year ? `, ${w.year}` : ''}. Met Open Access.`,
    image,
    type: 'Public domain',
    href: w.remote || local,
  }
}

function normalizeCity(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z]/g, '')
}

export function buildMuseumNetwork(baseUrl = '/'): VirtualMuseum[] {
  const base = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'
  const works = (MET_WORKS as CatalogWork[]).filter(w => w.remote || w.file)
  const frames = works.map(w => toFrame(w, base))
  const n = CITY_DEFS.length || 1
  const chunk = Math.max(1, Math.ceil((frames.length || 1) / n))

  const list: VirtualMuseum[] = [
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

  CITY_DEFS.forEach((def, i) => {
    let slice = frames.slice(i * chunk, (i + 1) * chunk)
    if (!slice.length && frames.length) slice = [frames[i % frames.length]]
    list.push({
      id: def.id,
      name: def.name,
      city: def.city,
      country: def.country,
      tagline: `${def.tagline} · ${slice.length} œuvres`,
      source: 'public_domain',
      room: def.room,
      works: slice,
    })
  })

  return list
}

export async function loadMuseumNetwork(baseUrl: string): Promise<VirtualMuseum[]> {
  return buildMuseumNetwork(baseUrl)
}

export function museumIdForCity(city: string | undefined | null): string | null {
  if (!city) return null
  const n = normalizeCity(city)
  const hit = CITY_DEFS.find(d => {
    if (normalizeCity(d.city) === n || normalizeCity(d.id) === n) return true
    if (d.aliases?.some(a => normalizeCity(a) === n)) return true
    return normalizeCity(d.name).includes(n)
  })
  return hit?.id ?? null
}

export const VIRTUAL_MUSEUMS: VirtualMuseum[] = buildMuseumNetwork('/')

export function getMuseum(id: string, list: VirtualMuseum[] = VIRTUAL_MUSEUMS) {
  return list.find(m => m.id === id)
}

export type VirtualMuseumId = string
