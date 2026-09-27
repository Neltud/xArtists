/**
 * Mise à jour catalogue musée depuis sources Open Access (Met API).
 * Lecture seule — pas de PEM. Enrichit dimensions / images quand dispo.
 */

const MET_API = 'https://collectionapi.metmuseum.org/public/collection/v1'

export type MetObjectLite = {
  objectID: number
  title: string
  artistDisplayName: string
  objectDate: string
  primaryImageSmall: string
  primaryImage: string
  measurements?: string
  medium?: string
  dimensions?: string
  isPublicDomain: boolean
}

/** Récupère un objet Met par ID (CORS public Met API) */
export async function fetchMetObject(id: number): Promise<MetObjectLite | null> {
  try {
    const r = await fetch(`${MET_API}/objects/${id}`, { cache: 'force-cache' })
    if (!r.ok) return null
    const j = await r.json()
    if (!j.isPublicDomain) return null
    return {
      objectID: j.objectID,
      title: j.title || 'Untitled',
      artistDisplayName: j.artistDisplayName || 'Unknown',
      objectDate: j.objectDate || '',
      primaryImageSmall: j.primaryImageSmall || j.primaryImage || '',
      primaryImage: j.primaryImage || j.primaryImageSmall || '',
      measurements: j.measurements,
      medium: j.medium,
      dimensions: j.dimensions,
      isPublicDomain: !!j.isPublicDomain,
    }
  } catch {
    return null
  }
}

/** Parse dimensions Met (souvent en inches) → libellé cm approximatif */
export function metDimensionsToLabel(raw?: string): string | undefined {
  if (!raw) return undefined
  // ex. "70 1/4 × 48 3/4 in. (178.4 × 123.8 cm)"
  const cm = raw.match(/\(([^)]*cm[^)]*)\)/i)
  if (cm) return cm[1].replace(/\s+/g, ' ').trim()
  const nums = [...raw.matchAll(/(\d+(?:\.\d+)?)\s*cm/gi)].map(m => m[1])
  if (nums.length >= 2) return `${nums[0]} cm × ${nums[1]} cm`
  return raw.slice(0, 80)
}

/**
 * Enrichit une liste d’IDs Met connus (batch limité).
 * Utilisable pour rafraîchir le hall paper sans rebuild catalogue statique.
 */
export async function refreshMetBatch(ids: number[], limit = 8): Promise<MetObjectLite[]> {
  const out: MetObjectLite[] = []
  for (const id of ids.slice(0, limit)) {
    const o = await fetchMetObject(id)
    if (o?.primaryImageSmall || o?.primaryImage) out.push(o)
  }
  return out
}

/** IDs Met Open Access souvent stables (peintures / sculptures) — seed refresh */
export const MET_SEED_IDS = [
  436532, // Van Gogh straw hat
  437402, // Rembrandt
  436121, // Degas
  437658, // Seurat
  436105, // Dance Class
] as const
