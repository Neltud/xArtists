#!/usr/bin/env node
/**
 * Compress xartists_collections.json for the dApp:
 * - drop heavy media[] arrays (keep one url/thumb)
 * - truncate metadata descriptions
 * - write slim catalog + index + per-collection pages
 *
 * Usage: node scripts/slim_collections.mjs
 * Input: data/xartists_collections.full.json OR data/xartists_collections.json
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DATA = path.join(ROOT, 'data')
const PUBLIC = path.join(ROOT, 'apps/frontend/public/data')

const fullCandidates = [
  path.join(DATA, 'xartists_collections.full.json'),
  path.join(DATA, 'xartists_collections.json'),
  path.join(PUBLIC, 'xartists_collections.json'),
]

const srcPath = fullCandidates.find(p => fs.existsSync(p))
if (!srcPath) {
  console.error('No collections source found')
  process.exit(1)
}

const raw = JSON.parse(fs.readFileSync(srcPath, 'utf8'))
const slimCols = []

for (const c of raw.collections || []) {
  const nfts = []
  for (const n of c.nfts || []) {
    const media = n.media || []
    const m0 = media[0] || {}
    const thumb = m0.thumbnailUrl || m0.url || n.url
    const slim = {
      collection: n.collection,
      collection_name: n.collection_name,
      nonce: n.nonce,
      name: n.name,
      identifier: n.identifier,
      url: thumb || n.url,
      type: n.type,
      creator: n.creator,
      owner: n.owner,
    }
    const md = n.metadata
    if (md && typeof md === 'object' && md.description) {
      slim.metadata = { description: String(md.description).slice(0, 180) }
    }
    const roy = n.royalties ?? n[' royalties']
    if (roy != null) slim.royalties = roy
    nfts.push(slim)
  }
  slimCols.push({
    identifier: c.identifier,
    name: c.name,
    type: c.type,
    nft_count: nfts.length,
    nfts,
  })
}

const slim = {
  timestamp: raw.timestamp || new Date().toISOString(),
  total_collections: slimCols.length,
  total_nfts: slimCols.reduce((s, c) => s + c.nft_count, 0),
  version: 'slim-1',
  collections: slimCols,
}

const index = {
  timestamp: slim.timestamp,
  total_collections: slim.total_collections,
  total_nfts: slim.total_nfts,
  version: 'index-1',
  collections: slimCols.map(c => ({
    identifier: c.identifier,
    name: c.name,
    type: c.type,
    nft_count: c.nft_count,
    preview: c.nfts.slice(0, 4),
  })),
}

function write(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, JSON.stringify(obj))
  console.log('wrote', p, (fs.statSync(p).size / 1024).toFixed(1) + ' KB')
}

write(path.join(DATA, 'xartists_collections.json'), slim)
write(path.join(PUBLIC, 'xartists_collections.json'), slim)
write(path.join(DATA, 'xartists_collections.index.json'), index)
write(path.join(PUBLIC, 'xartists_collections.index.json'), index)

const pagesDir = path.join(PUBLIC, 'collections')
fs.mkdirSync(pagesDir, { recursive: true })
for (const c of slimCols) {
  write(path.join(pagesDir, `${c.identifier}.json`), c)
}

console.log('OK slim catalog from', srcPath)
