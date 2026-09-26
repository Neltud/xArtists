/**
 * Réseau de musées virtuels — œuvres Met Open Access via un seul proxy weserv.
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
    aliases: ['palais de tokyo', 'tokyo'],
    match: ['contemporary', 'performance'],
  },
]

export const VIRTUAL_MUSEUMS: VirtualMuseum[] = PROFILES.map(p => ({
  ...p,
  source: p.id === 'xartists' ? 'onchain' : 'catalog',
  works: [],
}))

function guessTechnique(title: string, artist: string): string {
  const t = `${title} ${artist}`.toLowerCase()
  if (/bronze|marble|sculpture|bust/.test(t)) return 'Sculpture'
  if (/watercolor|aquarelle/.test(t)) return 'Aquarelle'
  if (/drawing|dessin|chalk/.test(t)) return 'Dessin'
  return 'Huile sur toile (typique) · Met Open Access'
}

/** Un seul passage weserv — jamais re-wrapper une URL déjà proxifiée */
export function proxyImg(raw: string): string {
  const u = (raw || '').trim()
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
  {
    remote: 'https://images.metmuseum.org/CRDImages/eg/web-large/DT202.jpg',
    title: 'The Temple of Dendur',
    artist: 'Egyptian',
    year: '15 B.C.',
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
    image: proxyImg(pick.remote),
    kind: 'sculpture' as const,
    type: 'Sculpture',
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
      if (list.length >= 24) break
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
      list.push(toFrame(w, base, p.name))
      used.add(w.id)
    }
    // sculpures PD pour chaque salle
    list.push(...proceduralSculptures(p.id, p.name).slice(0, 2))
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
        ? proceduralSculptures('xartists', 'Musée xArtists')
        : assigned.get(p.id) || [],
  }))
}

export async function loadMuseumNetwork(base: string): Promise<VirtualMuseum[]> {
  return buildMuseumNetwork(base)
}

export function museumIdForCity(city: string): string | null {
  const c = city.toLowerCase()
  const hit = PROFILES.find(p => p.city.toLowerCase() === c || p.aliases?.some(a => c.includes(a)))
  return hit?.id || null
}
