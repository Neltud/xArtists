/**
 * Réseau de musées virtuels — Met Open Access + slots « Your art here ».
 */
import { MET_WORKS } from '../data/metCatalog'
import type { FrameItem } from '../components/museum/MuseumCorridor'

export type VirtualMuseum = {
  id: string
  name: string
  city: string
  country?: string
  tagline: string
  room: 'cyber' | 'stone' | 'gold' | 'white' | 'dark'
  source: 'onchain' | 'catalog'
  aliases?: string[]
  match?: string[]
  works?: FrameItem[]
}

type CatalogWork = {
  id: string
  title: string
  artist: string
  year?: string
  museum?: string
  remote?: string | null
  file?: string
  medium?: string
  dimensions?: string
}

const PROFILES: Omit<VirtualMuseum, 'works' | 'source'>[] = [
  {
    id: 'xartists',
    name: 'Musée xArtists',
    city: 'MultiversX',
    tagline: 'Premier musée — NFT mainnet',
    room: 'cyber',
    aliases: ['xartists', 'home'],
    match: ['nftuduri', 'tro', 'xtr'],
  },
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
    aliases: ['palais de tokyo'],
    match: ['contemporary', 'performance'],
  },
  {
    id: 'met',
    name: 'The Met',
    city: 'New York',
    country: 'USA',
    tagline: 'Open Access · encyclopedic',
    room: 'stone',
    aliases: ['met', 'metropolitan', 'nyc', 'new york'],
    match: ['egyptian', 'greek', 'roman', 'asian', 'american'],
  },
  {
    id: 'uffizi',
    name: 'Galleria degli Uffizi',
    city: 'Florence',
    country: 'Italy',
    tagline: 'Renaissance · Florence',
    room: 'gold',
    aliases: ['uffizi', 'florence', 'firenze'],
    match: ['botticelli', 'leonardo', 'michelangelo', 'titian', 'caravaggio'],
  },
  {
    id: 'prado',
    name: 'Museo del Prado',
    city: 'Madrid',
    country: 'Spain',
    tagline: 'Espagne · maîtres',
    room: 'stone',
    aliases: ['prado', 'madrid'],
    match: ['velazquez', 'goya', 'el greco', 'rubens'],
  },
  {
    id: 'tate',
    name: 'Tate Modern',
    city: 'London',
    country: 'UK',
    tagline: 'Moderne & contemporain',
    room: 'white',
    aliases: ['tate', 'london'],
    match: ['turner', 'constable', 'british', 'modern'],
  },
  {
    id: 'rijks',
    name: 'Rijksmuseum',
    city: 'Amsterdam',
    country: 'Netherlands',
    tagline: 'Âge d’or hollandais',
    room: 'gold',
    aliases: ['rijksmuseum', 'amsterdam'],
    match: ['rembrandt', 'vermeer', 'dutch', 'hollands'],
  },
  {
    id: 'moma',
    name: 'MoMA',
    city: 'New York',
    country: 'USA',
    tagline: 'Modern art',
    room: 'white',
    aliases: ['moma'],
    match: ['warhol', 'pollock', 'rothko', 'modern'],
  },
  {
    id: 'getty',
    name: 'Getty Center',
    city: 'Los Angeles',
    country: 'USA',
    tagline: 'Collection · LA',
    room: 'stone',
    aliases: ['getty', 'los angeles', 'la'],
    match: ['european', 'photographs', 'manuscripts'],
  },
  {
    id: 'tokyo_nm',
    name: 'Tokyo National Museum',
    city: 'Tokyo',
    country: 'Japan',
    tagline: 'Asie · patrimoine',
    room: 'dark',
    aliases: ['tokyo', 'japan'],
    match: ['japan', 'japanese', 'asia', 'buddha'],
  },
  {
    id: 'hermitage',
    name: 'Hermitage',
    city: 'Saint Petersburg',
    country: 'Russia',
    tagline: 'Collection impériale',
    room: 'gold',
    aliases: ['hermitage'],
    match: ['russian', 'impressionist'],
  },
]

function guessTechnique(title: string, artist: string): string {
  const t = `${title} ${artist}`.toLowerCase()
  if (/bronze|marble|sculpture|bust/.test(t)) return 'Sculpture'
  if (/watercolor|aquarelle/.test(t)) return 'Aquarelle'
  if (/drawing|dessin|chalk/.test(t)) return 'Dessin'
  return 'Huile sur toile (typique) · Met Open Access'
}

export function proxyImg(u: string): string {
  if (!u) return u
  if (/images\.weserv\.nl|wsrv\.nl/i.test(u)) return u
  if (/^\//.test(u) || u.startsWith(import.meta.env.BASE_URL || '/')) return u
  const bare = u.replace(/^https?:\/\//i, '')
  return `https://images.weserv.nl/?url=${encodeURIComponent(bare)}&w=720&h=900&fit=cover&output=jpg&q=82`
}

function toFrame(w: CatalogWork, base: string, museumLabel: string): FrameItem {
  const local = w.file ? `${base}${w.file}` : undefined
  const raw = w.remote || local || undefined
  const image = raw ? proxyImg(raw) : undefined
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
    onSale: true,
    priceLabel: 'Paper · intent BUY_NFT',
    license: 'Met Open Access / PD',
    href: w.remote || local,
  }
}

function yourArtHereSpots(museumId: string, label: string, n = 2): FrameItem[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `${museumId}-yah-${i}`,
    title: 'Your art here',
    subtitle: 'Emplacement à louer · expo 30 j',
    artist: 'xArtists venues',
    collection: label,
    description:
      'Réservez ce mur pour votre œuvre (NFT ou photo). Paiement paper → #/venues · venue-split après SC.',
    type: 'Slot expo',
    kind: 'painting' as const,
    medium: 'digital' as const,
    onSale: true,
    priceLabel: 'Buy spot · paper',
    href: '#/venues',
  }))
}

const EXTRA_SCULPT: { remote: string; title: string; artist: string; year: string }[] = [
  {
    remote: 'https://images.metmuseum.org/CRDImages/gr/web-large/DP-16774-001.jpg',
    title: 'Marble statue of a wounded warrior',
    artist: 'Roman',
    year: 'ca. 138–181 CE',
  },
  {
    remote: 'https://images.metmuseum.org/CRDImages/gr/web-large/DP-14287-001.jpg',
    title: 'Marble statue of a kouros',
    artist: 'Greek',
    year: 'ca. 590–580 BCE',
  },
]

function proceduralSculptures(museumId: string, label: string): FrameItem[] {
  return EXTRA_SCULPT.map((pick, i) => ({
    id: `${museumId}-sculpt-${i}`,
    title: pick.title,
    subtitle: `${pick.artist} · ${pick.year}`,
    artist: pick.artist,
    date: pick.year,
    collection: label,
    description: `Sculpture (Met Open Access) · ${label}.`,
    image: proxyImg(pick.remote),
    type: 'Sculpture',
    kind: 'sculpture' as const,
    medium: 'physical' as const,
    onSale: true,
    priceLabel: 'Paper · intent BUY_NFT',
    href: pick.remote,
  }))
}

function assignWorks(base: string): Map<string, FrameItem[]> {
  const works = (MET_WORKS as CatalogWork[]).filter(w => w.remote || w.file)
  const assigned = new Map<string, FrameItem[]>()
  const used = new Set<string>()
  for (const p of PROFILES) {
    if (p.id === 'xartists') continue
    const list: FrameItem[] = []
    for (const w of works) {
      if (used.has(w.id)) continue
      const blob = `${w.title} ${w.artist}`.toLowerCase()
      if (p.match?.some(m => blob.includes(m))) {
        list.push(toFrame(w, base, p.name))
        used.add(w.id)
      }
      if (list.length >= 20) break
    }
    assigned.set(p.id, list)
  }
  const rest = works.filter(w => !used.has(w.id))
  let ri = 0
  for (const p of PROFILES) {
    if (p.id === 'xartists') continue
    const list = assigned.get(p.id) || []
    while (list.length < 10 && ri < rest.length) {
      const w = rest[ri++]
      list.push(toFrame(w, base, p.name))
      used.add(w.id)
    }
    list.push(...proceduralSculptures(p.id, p.name).slice(0, 2))
    list.push(...yourArtHereSpots(p.id, p.name, 2))
    assigned.set(p.id, list)
  }
  return assigned
}

export function buildMuseumNetwork(base: string): VirtualMuseum[] {
  const assigned = assignWorks(base)
  return PROFILES.map(p => ({
    ...p,
    source: p.id === 'xartists' ? ('onchain' as const) : ('catalog' as const),
    works:
      p.id === 'xartists'
        ? [
            ...proceduralSculptures('xartists', 'Musée xArtists'),
            ...yourArtHereSpots('xartists', 'Musée xArtists', 3),
          ]
        : assigned.get(p.id) || [],
  }))
}

export async function loadMuseumNetwork(base: string): Promise<VirtualMuseum[]> {
  return buildMuseumNetwork(base)
}

export const VIRTUAL_MUSEUMS: VirtualMuseum[] = buildMuseumNetwork('/')

export function getMuseum(id: string | null | undefined): VirtualMuseum | undefined {
  if (!id) return undefined
  const key = id.toLowerCase().trim()
  return (
    VIRTUAL_MUSEUMS.find(m => m.id === key) ||
    VIRTUAL_MUSEUMS.find(m => m.aliases?.some(a => a.toLowerCase() === key)) ||
    VIRTUAL_MUSEUMS.find(m => m.name.toLowerCase().includes(key))
  )
}

export function museumIdForCity(city: string): string | null {
  const c = city.toLowerCase()
  const hit = PROFILES.find(
    p => p.city.toLowerCase() === c || p.aliases?.some(a => c.includes(a)),
  )
  return hit?.id || null
}
