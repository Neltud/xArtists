/**
 * Progressive catalog loading:
 * 1. index (~16 KB) → headers + 4 previews
 * 2. collections/{id}.json on expand
 * 3. fallback full slim catalog if index/pages missing
 */
import {
  type CollectionData,
  type CollectionsFile,
  type CollectionsIndexFile,
  type CollectionIndexEntry,
  DATA_URL,
  INDEX_URL,
  collectionPageUrl,
} from '../types/nft'

const cache = new Map<string, CollectionData>()

export async function loadCatalogIndex(): Promise<{
  index: CollectionsIndexFile | null
  full: CollectionsFile | null
}> {
  try {
    const r = await fetch(INDEX_URL, { cache: 'force-cache' })
    if (r.ok) {
      const index = (await r.json()) as CollectionsIndexFile
      if (index?.collections?.length) return { index, full: null }
    }
  } catch {
    /* fall through */
  }
  try {
    const r = await fetch(DATA_URL, { cache: 'force-cache' })
    if (!r.ok) return { index: null, full: null }
    const full = (await r.json()) as CollectionsFile
    return { index: null, full }
  } catch {
    return { index: null, full: null }
  }
}

export function indexToPartialCollections(entries: CollectionIndexEntry[]): CollectionData[] {
  return entries.map(e => ({
    identifier: e.identifier,
    name: e.name,
    type: e.type,
    nft_count: e.nft_count,
    nfts: e.preview || [],
  }))
}

export async function loadCollectionPage(id: string): Promise<CollectionData | null> {
  if (cache.has(id)) return cache.get(id)!
  try {
    const r = await fetch(collectionPageUrl(id), { cache: 'force-cache' })
    if (r.ok) {
      const col = (await r.json()) as CollectionData
      if (col?.identifier) {
        cache.set(id, col)
        return col
      }
    }
  } catch {
    /* fall through */
  }
  // Fallback: full catalog slice
  try {
    const r = await fetch(DATA_URL, { cache: 'force-cache' })
    if (!r.ok) return null
    const full = (await r.json()) as CollectionsFile
    const col = full.collections?.find(c => c.identifier === id)
    if (col) {
      cache.set(id, col)
      return col
    }
  } catch {
    /* ignore */
  }
  return null
}
