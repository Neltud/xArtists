/**
 * Réseau de musées par VILLE — clic ville → salle + œuvres (Met Open Access).
 * xArtists reste le premier (on-chain).
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
}[] = [
  { id: 'paris', name: 'Paris · Salons', city: 'Paris', country: 'France', tagline: 'Galeries · foires · street art', room: 'stone' },
  { id: 'london', name: 'London · Galleries', city: 'London', country: 'UK', tagline: 'National collections', room: 'white' },
  { id: 'amsterdam', name: 'Amsterdam · Golden Age', city: 'Amsterdam', country: 'Pays-Bas', tagline: 'Âge d’or hollandais', room: 'dark' },
  { id: 'florence', name: 'Florence · Renaissance', city: 'Florence', country: 'Italie', tagline: 'Renaissance toscane', room: 'white' },
  { id: 'madrid', name: 'Madrid · Prado spirit', city: 'Madrid', country: 'Espagne', tagline: 'Siècle d’or', room: 'stone' },
  { id: 'newyork', name: 'New York · Met spirit', city: 'New York', country: 'USA', tagline: 'Open Access Met', room: 'gold' },
  { id: 'berlin', name: 'Berlin · Modern', city: 'Berlin', country: 'Allemagne', tagline: 'Capitales culturelles', room: 'cyber' },
  { id: 'vienna', name: 'Vienna · Secession', city: 'Vienna', country: 'Autriche', tagline: 'Empires & salons', room: 'gold' },
  { id: 'rome', name: 'Rome · Eternal', city: 'Rome', country: 'Italie', tagline: 'Antiquité & baroque', room: 'stone' },
  { id: 'brussels', name: 'Brussels · Crossroads', city: 'Brussels', country: 'Belgique', tagline: 'Carrefour européen', room: 'white' },
  { id: 'milan', name: 'Milan · Design', city: 'Milan', country: 'Italie', tagline: 'Nord italien', room: 'white' },
  { id: 'prague', name: 'Prague · Central', city: 'Prague', country: 'Tchéquie', tagline: 'Europe centrale', room: 'dark' },
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
  const chunk = Math.max(1, Math.ceil(frames.length / n))

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
    const slice = frames.slice(i * chunk, (i + 1) * chunk)
    const worksForCity =
      slice.length > 0 ? slice : frames.length ? [frames[i % frames.length]] : []
    list.push({
      id: def.id,
      name: def.name,
      city: def.city,
      country: def.country,
      tagline: `${def.tagline} · ${worksForCity.length} œuvres`,
      source: 'public_domain',
      room: def.room,
      works: worksForCity,
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
  const hit = CITY_DEFS.find(
    d =>
      normalizeCity(d.city) === n ||
      normalizeCity(d.id) === n ||
      normalizeCity(d.name).includes(n)
  )
  return hit?.id ?? null
}

export const VIRTUAL_MUSEUMS: VirtualMuseum[] = buildMuseumNetwork('/')

export function getMuseum(id: string, list: VirtualMuseum[] = VIRTUAL_MUSEUMS) {
  return list.find(m => m.id === id)
}

export type VirtualMuseumId = string
