/**
 * xArtists catalog indexer — Node 20 (Akash / local).
 * GET /health  GET /catalog
 * Env: PORT MVX_API COLLECTIONS POLL_INTERVAL_SEC CORS_ORIGIN
 */
import http from 'node:http'

const PORT = Number(process.env.PORT || 8080)
const MVX = (process.env.MVX_API || 'https://api.multiversx.com').replace(/\/$/, '')
const COLLECTIONS = (process.env.COLLECTIONS || 'NFTUDURI-2990b6')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
const POLL = Number(process.env.POLL_INTERVAL_SEC || 120) * 1000
const CORS = process.env.CORS_ORIGIN || '*'

/** @type {{ timestamp: string, total_collections: number, total_nfts: number, version: string, collections: unknown[] }} */
let catalog = {
  timestamp: new Date(0).toISOString(),
  total_collections: 0,
  total_nfts: 0,
  version: 'akash-indexer-1',
  collections: [],
}

function mapNft(raw, collectionId, collectionName) {
  return {
    collection: collectionId,
    collection_name: collectionName || collectionId,
    nonce: raw.nonce ?? 0,
    name: raw.name || raw.identifier || 'NFT',
    identifier: raw.identifier || `${collectionId}-${raw.nonce}`,
    url: raw.url || raw.media?.[0]?.url,
    media: raw.media,
    metadata: raw.metadata,
    creator: raw.creator,
    owner: raw.owner,
    type: raw.type,
    royalties: raw.royalties,
  }
}

async function refresh() {
  const cols = []
  let total = 0
  for (const id of COLLECTIONS) {
    try {
      const r = await fetch(`${MVX}/collections/${id}/nfts?size=50&withMetadata=true`)
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const list = await r.json()
      const arr = Array.isArray(list) ? list : []
      const name = arr[0]?.collection || id
      const nfts = arr.map(n => mapNft(n, id, name))
      total += nfts.length
      cols.push({
        identifier: id,
        name,
        type: arr[0]?.type || 'NonFungibleESDT',
        nft_count: nfts.length,
        nfts,
      })
    } catch (e) {
      cols.push({
        identifier: id,
        name: id,
        type: 'Unknown',
        nft_count: 0,
        nfts: [],
        error: String(e),
      })
    }
  }
  catalog = {
    timestamp: new Date().toISOString(),
    total_collections: cols.length,
    total_nfts: total,
    version: 'akash-indexer-1',
    collections: cols,
  }
  console.log(
    JSON.stringify({
      event: 'refresh',
      ts: catalog.timestamp,
      total_nfts: total,
      collections: COLLECTIONS,
    }),
  )
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', CORS)
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(
      JSON.stringify({
        ok: true,
        ts: catalog.timestamp,
        collections: COLLECTIONS,
        total_nfts: catalog.total_nfts,
      }),
    )
    return
  }
  if (req.url === '/catalog' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(catalog))
    return
  }
  res.writeHead(404)
  res.end('not found')
})

server.listen(PORT, () => {
  console.log(`xartists-indexer :${PORT}`)
  void refresh()
  setInterval(() => void refresh(), POLL)
})
