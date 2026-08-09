/**
 * Progressive catalog: index first, page on expand, full fallback.
 * Timed fetchJson (abort 10–15s).
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
import { fetchJson } from './fetchJson'

const cache = new Map<string, CollectionData>()

export async function loadCatalogIndex(): Promise<{
  index: CollectionsIndexFile | null
  full: CollectionsFile | null
}> {
  try {
    const index = await fetchJson<CollectionsIndexFile>(INDEX_URL, {
      timeoutMs: 10000,
      cache: 'default',
    })
    if (index?.collections?.length) return { index, full: null }
  } catch {
    /* fall through */
  }
  try {
    const full = await fetchJson<CollectionsFile>(DATA_URL, {
      timeoutMs: 15000,
      cache: 'force-cache',
    })
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
    const col = await fetchJson<CollectionData>(collectionPageUrl(id), {
      timeoutMs: 10000,
      cache: 'default',
    })
    if (col?.identifier) {
      cache.set(id, col)
      return col
    }
  } catch {
    /* fall through */
  }
  try {
    const full = await fetchJson<CollectionsFile>(DATA_URL, {
      timeoutMs: 15000,
      cache: 'force-cache',
    })
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
