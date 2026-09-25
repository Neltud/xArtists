/**
 * Catalogue œuvres — Akash indexer (VITE_CATALOG_API) puis JSON GitHub Pages.
 */
import {
  DATA_URL,
  type CollectionData,
  type CollectionsFile,
  type NFT,
} from '../types/nft'
import { catalogApiUrls } from '../config/catalogApi'

const RAW_CATALOG =
  'https://raw.githubusercontent.com/Neltud/xArtists/main/apps/frontend/public/data/xartists_collections.json'

let catalogPromise: Promise<{ collections: CollectionData[]; nfts: NFT[] }> | null = null

export async function loadFullCatalog(): Promise<{ collections: CollectionData[]; nfts: NFT[] }> {
  if (catalogPromise) return catalogPromise
  catalogPromise = (async () => {
    const base = import.meta.env.BASE_URL || '/'
    const urls = [
      ...catalogApiUrls(),
      DATA_URL,
      `${base}data/xartists_collections.json`,
      '/xArtists/data/xartists_collections.json',
      RAW_CATALOG,
    ]
    for (const u of urls) {
      try {
        const r = await fetch(u, { cache: 'no-store' })
        if (!r.ok) continue
        const j = (await r.json()) as CollectionsFile
        const cols = j.collections || []
        if (!cols.length) continue
        const nfts = cols.flatMap(c =>
          (c.nfts || []).map(n => ({
            ...n,
            collection: n.collection || c.identifier,
            collection_name: n.collection_name || c.name,
          })),
        )
        if (nfts.length) return { collections: cols, nfts }
      } catch {
        /* next */
      }
    }
    return { collections: [], nfts: [] }
  })()
  return catalogPromise
}

/** Force re-fetch (ex. après changement d’API). */
export function resetCatalogCache() {
  catalogPromise = null
}
