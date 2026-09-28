/**
 * Réseau de musées virtuels — œuvres EXCLUSIVES par lieu (pas de Joconde au MoMA).
 * Met Open Access + slots « Your art here » + sculptures uniques par salle.
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
  /** Keywords that must NOT appear in this museum's works */
  ban?: string[]
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
    match: ['rembrandt', 'raphael', 'lippi', 'mantegna', 'delacroix', 'courbet', 'david', 'holy', 'madonna', 'leonardo', 'joconde', 'mona lisa'],
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
    ban: ['joconde', 'mona lisa', 'warhol', 'pollock'],
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
    ban: ['joconde', 'mona lisa', 'rembrandt', 'vermeer'],
  },
  {
    id: 'palaisdetokyo',
    name: 'Palais de Tokyo',
    city: 'Paris',
    country: 'France',
    tagline: 'Art contemporain · Paris',
    room: 'cyber',
    aliases: ['palais de tokyo'],
    match: ['contemporary', 'performance', 'installation'],
    ban: ['joconde', 'mona lisa', 'raphael', 'botticelli'],
  },
  {
    id: 'met',
    name: 'The Met',
    city: 'New York',
    country: 'USA',
    tagline: 'Open Access · encyclopedic',
    room: 'stone',
    aliases: ['met', 'metropolitan'],
    match: ['egyptian', 'greek', 'roman', 'asian', 'american', 'met'],
    ban: ['joconde', 'mona lisa'],
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
    ban: ['joconde', 'mona lisa', 'warhol', 'pollock', 'monet'],
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
    ban: ['joconde', 'mona lisa', 'warhol'],
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
    ban: ['joconde', 'mona lisa', 'raphael'],
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
    ban: ['joconde', 'mona lisa', 'warhol', 'pollock'],
  },
  {
    id: 'moma',
    name: 'MoMA',
    city: 'New York',
    country: 'USA',
    tagline: 'Modern art',
    room: 'white',
    aliases: ['moma'],
    match: ['warhol', 'pollock', 'rothko', 'modern', 'picasso'],
    ban: ['joconde', 'mona lisa', 'rembrandt', 'vermeer', 'raphael', 'botticelli', 'holy family'],
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
    ban: ['joconde', 'mona lisa'],
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
    ban: ['joconde', 'mona lisa', 'rembrandt', 'warhol'],
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
    ban: ['joconde', 'mona lisa'],
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
      'Réservez ce mur pour votre œuvre (NFT ou photo). Paiement paper → #/venues · venue-split on-chain.',
    type: 'Slot expo',
    kind: 'painting' as const,
    medium: 'digital' as const,
    onSale: true,
    priceLabel: 'Buy spot · paper',
    href: '#/venues',
  }))
}

/** Distinct Met Open Access sculpture URLs — one pool, sliced uniquely per museum */
const SCULPT_POOL: { remote: string; title: string; artist: string; year: string }[] = [
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
  {
    remote: 'https://images.metmuseum.org/CRDImages/gr/web-large/DP145611.jpg',
    title: 'Marble statue of a woman',
    artist: 'Greek',
    year: 'ca. 150 BCE',
  },
  {
    remote: 'https://images.metmuseum.org/CRDImages/eg/web-large/DT553.jpg',
    title: 'Cat coffin',
    artist: 'Egyptian',
    year: 'ca. 332–30 BCE',
  },
  {
    remote: 'https://images.metmuseum.org/CRDImages/as/web-large/DP-15581-001.jpg',
    title: 'Seated Buddha',
    artist: 'China',
    year: 'ca. 338',
  },
  {
    remote: 'https://images.metmuseum.org/CRDImages/gr/web-large/DP145549.jpg',
    title: 'Bronze mirror with a support',
    artist: 'Greek',
    year: 'mid-5th century BCE',
  },
  {
    remote: 'https://images.metmuseum.org/CRDImages/eg/web-large/DT564.jpg',
    title: 'Sphinx of Hatshepsut',
    artist: 'Egyptian',
    year: 'ca. 1479–1458 BCE',
  },
  {
    remote: 'https://images.metmuseum.org/CRDImages/as/web-large/DP-14786-001.jpg',
    title: 'Guardian lion',
    artist: 'China',
    year: '6th century',
  },
]

function hashMuseum(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h
}

/** Exactly 2 unique sculptures per museum — no shared images across venues */
function uniqueSculptures(museumId: string, label: string): FrameItem[] {
  const start = hashMuseum(museumId) % SCULPT_POOL.length
  const picks = [SCULPT_POOL[start], SCULPT_POOL[(start + 1) % SCULPT_POOL.length]]
  return picks.map((pick, i) => ({
    id: `${museumId}-sculpt-${i}-${pick.title.slice(0, 12).replace(/\s/g, '')}`,
    title: pick.title,
    subtitle: `${pick.artist} · ${pick.year}`,
    artist: pick.artist,
    date: pick.year,
    collection: label,
    description: `Sculpture (Met Open Access) exclusive à ${label}.`,
    image: proxyImg(pick.remote),
    type: 'Sculpture',
    kind: 'sculpture' as const,
    medium: 'physical' as const,
    onSale: true,
    priceLabel: 'Paper · intent BUY_NFT',
    href: pick.remote,
  }))
}

function isBanned(w: CatalogWork, ban?: string[]): boolean {
  if (!ban?.length) return false
  const blob = `${w.title} ${w.artist}`.toLowerCase()
  return ban.some(b => blob.includes(b.toLowerCase()))
}

/**
 * Assign each Met work to at most ONE museum (exclusive).
 * Match keywords first, then fill from rest without violating ban lists.
 * Sculptures / YAH are per-museum unique ids.
 */
function assignWorks(base: string): Map<string, FrameItem[]> {
  const works = (MET_WORKS as CatalogWork[]).filter(w => w.remote || w.file)
  const assigned = new Map<string, FrameItem[]>()
  const used = new Set<string>()

  for (const p of PROFILES) {
    if (p.id === 'xartists') continue
    const list: FrameItem[] = []
    for (const w of works) {
      if (used.has(w.id)) continue
      if (isBanned(w, p.ban)) continue
      const blob = `${w.title} ${w.artist}`.toLowerCase()
      if (p.match?.some(m => blob.includes(m))) {
        list.push(toFrame(w, base, p.name))
        used.add(w.id)
      }
      if (list.length >= 18) break
    }
    assigned.set(p.id, list)
  }

  const rest = works.filter(w => !used.has(w.id))
  let ri = 0
  for (const p of PROFILES) {
    if (p.id === 'xartists') continue
    const list = assigned.get(p.id) || []
    while (list.length < 8 && ri < rest.length) {
      const w = rest[ri++]
      if (used.has(w.id)) continue
      if (isBanned(w, p.ban)) continue
      list.push(toFrame(w, base, p.name))
      used.add(w.id)
    }
    list.push(...uniqueSculptures(p.id, p.name))
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
            ...uniqueSculptures('xartists', 'Musée xArtists'),
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
