/**
 * Noms de lieux (carte / expos) → id musée 3D xArtists.
 */
import { museumIdForCity } from './museumWorldCatalog'

const VENUE_TO_MUSEUM: Record<string, string> = {
  // Paris
  louvre: 'louvre',
  'musee du louvre': 'louvre',
  'musée du louvre': 'louvre',
  orsay: 'orsay',
  'musee d orsay': 'orsay',
  "musee d'orsay": 'orsay',
  "musée d'orsay": 'orsay',
  pompidou: 'pompidou',
  'centre pompidou': 'pompidou',
  'palais de tokyo': 'palaisdetokyo',
  'palais tokyo': 'palaisdetokyo',
  marais: 'louvre',
  // London
  'national gallery': 'nglondon',
  tate: 'tate',
  'tate britain': 'tate',
  // Amsterdam
  rijksmuseum: 'rijks',
  rijks: 'rijks',
  'van gogh museum': 'vangogh',
  'van gogh': 'vangogh',
  // Others
  prado: 'prado',
  uffizi: 'uffizi',
  'the met': 'met',
  met: 'met',
  hermitage: 'hermitage',
  ermitage: 'hermitage',
  mauritshuis: 'mauritshuis',
  brera: 'brera',
  vatican: 'vatican',
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/['’]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

/** Résout un libellé venue ou ville → museumId */
export function museumIdForVenue(venueOrCity: string, cityFallback?: string): string {
  const n = norm(venueOrCity)
  if (VENUE_TO_MUSEUM[n]) return VENUE_TO_MUSEUM[n]
  for (const [k, id] of Object.entries(VENUE_TO_MUSEUM)) {
    if (n.includes(k) || k.includes(n)) return id
  }
  const fromCity = museumIdForCity(cityFallback || venueOrCity)
  return fromCity || 'xartists'
}

export const FEATURED_VENUES_BY_CITY: Record<
  string,
  { label: string; museumId: string }[]
> = {
  paris: [
    { label: 'Musée du Louvre', museumId: 'louvre' },
    { label: "Musée d'Orsay", museumId: 'orsay' },
    { label: 'Centre Pompidou', museumId: 'pompidou' },
    { label: 'Palais de Tokyo', museumId: 'palaisdetokyo' },
  ],
  london: [
    { label: 'National Gallery', museumId: 'nglondon' },
    { label: 'Tate Britain', museumId: 'tate' },
  ],
  amsterdam: [
    { label: 'Rijksmuseum', museumId: 'rijks' },
    { label: 'Van Gogh Museum', museumId: 'vangogh' },
  ],
  'new york': [{ label: 'The Met', museumId: 'met' }],
  madrid: [{ label: 'Prado', museumId: 'prado' }],
  florence: [{ label: 'Uffizi', museumId: 'uffizi' }],
  'saint petersburg': [{ label: 'Ermitage', museumId: 'hermitage' }],
}

export function venuesForCity(city: string): { label: string; museumId: string }[] {
  const n = norm(city).replace(/\s/g, '')
  for (const [k, list] of Object.entries(FEATURED_VENUES_BY_CITY)) {
    if (norm(k).replace(/\s/g, '') === n) return list
  }
  return []
}
