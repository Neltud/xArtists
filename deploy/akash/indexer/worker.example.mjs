/**
 * Minimal indexer sketch — run under Node 20 on Akash (or locally).
 * node worker.example.mjs
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

/** @type {{ ts: number, collections: Record<string, unknown[]> }} */
let catalog = { ts: 0, collections: {} }

async function refresh() {
  const next = { ts: Date.now(), collections: {} }
  for (const id of COLLECTIONS) {
    try {
      const r = await fetch(`${MVX}/collections/${id}/nfts?size=50&withMetadata=true`)
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      next.collections[id] = await r.json()
    } catch (e) {
      next.collections[id] = { error: String(e) }
    }
  }
  catalog = next
  console.log(JSON.stringify({ event: 'refresh', ts: catalog.ts, keys: Object.keys(catalog.collections) }))
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', CORS)
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true, ts: catalog.ts, collections: COLLECTIONS }))
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
