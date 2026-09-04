/**
 * Lieux carte / guide → musées 3D + métadonnées.
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
  medium?: string
  dimensions?: string
}

const PLACE_MUSEUMS: {
  id: string
  name: string
  city: string
  country: string
  tagline: string
  room: VirtualMuseum['room']
  aliases: string[]
  match: string[]
}[] = [
  {
    id: 'louvre',
    name: 'Musée du Louvre',
    city: 'Paris',
    country: 'France',
    tagline: 'Chefs-d’œuvre · Paris',
    room: 'stone',
    aliases: ['paris', 'louvre', 'marais'],
    match: ['rembrandt', 'raphael', 'lippi', 'mantegna', 'delacroix', 'courbet', 'david', 'holy', 'madonna'],
  },
  {
    id: 'orsay',
    name: 'Musée d’Orsay',
    city: 'Paris',
    country: 'France',
    tagline: 'XIXe · impressionnisme',
    room: 'gold',
    aliases: ['orsay'],
    match: ['manet', 'degas', 'monet', 'renoir', 'pissarro', 'cezanne', 'gauguin', 'fantin', 'seurat', 'toulouse', 'van gogh'],
  },
  {
    id: 'pompidou',
    name: 'Centre Pompidou',
    city: 'Paris',
    country: 'France',
    tagline: 'Art moderne & contemporain',
    room: 'white',
    aliases: ['pompidou', 'beaubourg'],
    match: ['picasso', 'matisse', 'kandinsky', 'miro', 'duchamp'],
  },
  {
    id: 'palaisdetokyo',
    name: 'Palais de Tokyo',
    city: 'Paris',
    country: 'France',
    tagline: 'Art contemporain · Paris',
    room: 'cyber',
    aliases: ['palais de tokyo', 'tokyo'],
    match: ['contemporary', 'performance'],
  },
  {
    id: 'nglondon',
    name: 'National Gallery',
    city: 'London',
    country: 'UK',
    tagline: 'Collection nationale · Londres',
    room: 'white',
    aliases: ['london', 'londres', 'national gallery'],
    match: ['turner', 'constable', 'holbein', 'van eyck', 'vermeer', 'hogarth'],
  },
  {
    id: 'rijks',
    name: 'Rijksmuseum',
    city: 'Amsterdam',
    country: 'Pays-Bas',
    tagline: 'Âge d’or hollandais',
    room: 'dark',
    aliases: ['amsterdam', 'rijks', 'rijksmuseum'],
    match: ['rembrandt', 'vermeer', 'steen', 'claesz', 'van goyen', 'hals', 'ruysch'],
  },
  {
    id: 'vangogh',
    name: 'Van Gogh Museum',
    city: 'Amsterdam',
    country: 'Pays-Bas',
    tagline: 'Vincent van Gogh',
    room: 'white',
    aliases: ['vangogh', 'van gogh museum'],
    match: ['van gogh', 'gogh'],
  },
  {
    id: 'uffizi',
    name: 'Galerie des Offices',
    city: 'Florence',
    country: 'Italie',
    tagline: 'Renaissance florentine',
    room: 'white',
    aliases: ['florence', 'firenze', 'uffizi'],
    match: ['botticelli', 'lippi', 'cosimo'],
  },
  {
    id: 'prado',
    name: 'Musée du Prado',
    city: 'Madrid',
    country: 'Espagne',
    tagline: 'Siècle d’or espagnol',
    room: 'stone',
    aliases: ['madrid', 'prado'],
    match: ['goya', 'velazquez', 'el greco', 'greco', 'murillo'],
  },
  {
    id: 'met',
    name: 'The Met',
    city: 'New York',
    country: 'USA',
    tagline: 'Metropolitan · Open Access',
    room: 'gold',
    aliases: ['new york', 'newyork', 'nyc', 'met'],
    match: [],
  },
  {
    id: 'hermitage',
    name: 'Musée de l’Ermitage',
    city: 'Saint Petersburg',
    country: 'Russie',
    tagline: 'Collection impériale',
    room: 'gold',
    aliases: ['petersburg', 'hermitage', 'moscow', 'moscou'],
    match: ['rembrandt', 'leonardo'],
  },
  {
    id: 'gemaldegalerie',
    name: 'Gemäldegalerie',
    city: 'Berlin',
    country: 'Allemagne',
    tagline: 'Peinture européenne · Berlin',
    room: 'stone',
    aliases: ['berlin'],
    match: ['cranach', 'holbein'],
  },
  {
    id: 'kunsthistorisches',
    name: 'Kunsthistorisches Museum',
    city: 'Vienna',
    country: 'Autriche',
    tagline: 'Collections impériales',
    room: 'gold',
    aliases: ['vienna', 'wien', 'vienne'],
    match: ['bruegel', 'rubens', 'titian'],
  },
  {
    id: 'vatican',
    name: 'Musées du Vatican',
    city: 'Rome',
    country: 'Italie',
    tagline: 'Vatican · Rome',
    room: 'stone',
    aliases: ['rome', 'roma', 'vatican'],
    match: ['raphael', 'caravaggio'],
  },
  {
    id: 'mrbab',
    name: 'Musées royaux des Beaux-Arts',
    city: 'Brussels',
    country: 'Belgique',
    tagline: 'Bruxelles',
    room: 'white',
    aliases: ['brussels', 'bruxelles'],
    match: ['rubens', 'bruegel'],
  },
  {
    id: 'brera',
    name: 'Pinacoteca di Brera',
    city: 'Milan',
    country: 'Italie',
    tagline: 'Milan',
    room: 'white',
    aliases: ['milan', 'milano', 'brera'],
    match: ['mantegna', 'hayez'],
  },
  {
    id: 'mauritshuis',
    name: 'Mauritshuis',
    city: 'The Hague',
    country: 'Pays-Bas',
    tagline: 'La Haye · Vermeer',
    room: 'gold',
    aliases: ['hague', 'la haye', 'den haag', 'mauritshuis'],
    match: ['vermeer', 'fabritius'],
  },
  {
    id: 'tate',
    name: 'Tate Britain',
    city: 'London',
    country: 'UK',
    tagline: 'Art britannique',
    room: 'white',
    aliases: ['tate'],
    match: ['turner', 'millais', 'constable'],
  },
  {
    id: 'accademia',
    name: 'Gallerie dell’Accademia',
    city: 'Venice',
    country: 'Italie',
    tagline: 'Venise',
    room: 'gold',
    aliases: ['venice', 'venise', 'venezia'],
    match: ['titian', 'canaletto', 'bellini'],
  },
  {
    id: 'mnac',
    name: 'MNAC',
    city: 'Barcelona',
    country: 'Espagne',
    tagline: 'Barcelone',
    room: 'white',
    aliases: ['barcelona', 'barcelone'],
    match: ['picasso'],
  },
  {
    id: 'gulbenkian',
    name: 'Fondation Gulbenkian',
    city: 'Lisbon',
    country: 'Portugal',
    tagline: 'Lisbonne',
    room: 'white',
    aliases: ['lisbon', 'lisbonne', 'lisboa'],
    match: ['renoir', 'monet', 'degas'],
  },
]

function guessTechnique(title: string, artist: string): string {
  const t = `${title} ${artist}`.toLowerCase()
  if (/bronze|marble|sculpture|bust/.test(t)) return 'Sculpture'
  if (/watercolor|aquarelle/.test(t)) return 'Aquarelle'
  if (/drawing|dessin|chalk/.test(t)) return 'Dessin'
  return 'Huile sur toile (typique) · Met Open Access'
}

function toFrame(w: CatalogWork, base: string, museumLabel: string): FrameItem {
  const local = w.file ? `${base}${w.file}` : undefined
  const image = w.remote || local || undefined
  const isSculpture = /sculpt|bronze|marble|bust/i.test(`${w.title} ${w.artist}`)
  return {
    id: w.id,
    title: w.title,
    subtitle: [w.artist, w.year].filter(Boolean).join(' · '),
    artist: w.artist,
    date: w.year,
    collection: museumLabel,
    description: `Présenté dans l’esprit de ${museumLabel}. Met Open Access (PD).`,
    image,
    type: isSculpture ? 'Sculpture' : 'Peinture',
    kind: isSculpture ? 'sculpture' : 'painting',
    medium: 'physical',
    technique: w.medium || guessTechnique(w.title, w.artist),
    dimensions: w.dimensions || 'Voir source Met',
    onSale: false,
    priceLabel: 'Collection — pas en vente',
    license: 'Public domain (Met Open Access)',
    provenance: museumLabel,
    href: w.remote || local,
  }
}

function proceduralSculptures(museumId: string, museumLabel: string): FrameItem[] {
  return [
    {
      id: `sculpt-${museumId}-0`,
      title: 'Figure debout (3D)',
      artist: 'Atelier xArtists',
      date: '2026',
      kind: 'sculpture',
      medium: 'digital',
      technique: 'Mesh procédural',
      dimensions: '≈ 1,6 m',
      onSale: false,
      priceLabel: 'Pas en vente',
      collection: museumLabel,
      description: 'Sculpture procédurale — volume de salle.',
    },
  ]
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function workBlob(w: CatalogWork): string {
  return normalize(`${w.title} ${w.artist}`)
}

function assignWorks(base: string): Map<string, FrameItem[]> {
  const byId = new Map<string, FrameItem[]>()
  for (const p of PLACE_MUSEUMS) byId.set(p.id, [])
  const works = (MET_WORKS as CatalogWork[]).filter(w => w.remote || w.file)
  const used = new Set<string>()

  for (const p of PLACE_MUSEUMS) {
    const keys = p.match.filter(k => k.trim().length > 1)
    if (!keys.length) continue
    for (const w of works) {
      if (used.has(w.id)) continue
      if (keys.some(k => workBlob(w).includes(normalize(k)))) {
        byId.get(p.id)!.push(toFrame(w, base, p.name))
        used.add(w.id)
      }
    }
  }

  const rest = works.filter(w => !used.has(w.id))
  const metList = byId.get('met')!
  for (const w of rest) {
    metList.push(toFrame(w, base, 'The Met'))
    used.add(w.id)
  }

  const pool = metList.length ? metList : [...byId.values()].flat()
  for (const p of PLACE_MUSEUMS) {
    const arr = byId.get(p.id)!
    if (arr.length < 2 && pool.length) {
      let i = 0
      while (arr.length < 3 && i < pool.length) {
        const src = pool[(p.id.length * 3 + i) % pool.length]
        arr.push({
          ...src,
          id: `${src.id}-${p.id}-${i}`,
          collection: p.name,
          provenance: p.name,
        })
        i++
      }
    }
    arr.push(...proceduralSculptures(p.id, p.name))
  }
  return byId
}

export function buildMuseumNetwork(baseUrl = '/'): VirtualMuseum[] {
  const base = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'
  const assigned = assignWorks(base)
  const list: VirtualMuseum[] = [
    {
      id: 'xartists',
      name: 'Musée xArtists',
      city: 'MultiversX',
      country: 'On-chain',
      tagline: 'Premier musée — NFT mainnet',
      source: 'onchain',
      room: 'cyber',
      works: proceduralSculptures('xartists', 'Musée xArtists'),
    },
  ]
  for (const p of PLACE_MUSEUMS) {
    const works = assigned.get(p.id) || []
    list.push({
      id: p.id,
      name: p.name,
      city: p.city,
      country: p.country,
      tagline: p.tagline,
      source: 'public_domain',
      room: p.room,
      works,
    })
  }
  return list
}

export async function loadMuseumNetwork(baseUrl: string): Promise<VirtualMuseum[]> {
  return buildMuseumNetwork(baseUrl)
}

export function museumIdForCity(city: string | undefined | null): string | null {
  if (!city) return null
  const n = normalize(city).replace(/\s/g, '')
  if (n === 'paris') return 'louvre'
  if (n === 'amsterdam') return 'rijks'
  if (n === 'london' || n === 'londres') return 'nglondon'
  for (const p of PLACE_MUSEUMS) {
    if (normalize(p.city).replace(/\s/g, '') === n) return p.id
    if (normalize(p.id).replace(/\s/g, '') === n) return p.id
    if (p.aliases.some(a => normalize(a).replace(/\s/g, '') === n)) return p.id
  }
  return null
}

export const VIRTUAL_MUSEUMS: VirtualMuseum[] = buildMuseumNetwork('/')

export function getMuseum(id: string, list: VirtualMuseum[] = VIRTUAL_MUSEUMS) {
  return list.find(m => m.id === id)
}

export type VirtualMuseumId = string

/** Liste exposée UI Galerie */
export function listAllMuseums(): { id: string; name: string; city: string }[] {
  return buildMuseumNetwork('/').map(m => ({ id: m.id, name: m.name, city: m.city }))
}
