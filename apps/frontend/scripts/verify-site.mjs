import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const indexHtml = path.join(dist, 'index.html')

// Allow verify against source markers when dist not yet built (CI pre-build steps)
const sourceIndex = path.join(root, 'index.html')
const target = fs.existsSync(indexHtml) ? indexHtml : sourceIndex

if (!fs.existsSync(target)) {
  console.error('verify-site: index.html missing')
  process.exit(1)
}

const html = fs.readFileSync(target, 'utf8')
const markers = ['xArtists', 'root']
for (const m of markers) {
  if (!html.includes(m)) {
    console.error(`verify-site: missing marker ${m}`)
    process.exit(1)
  }
}

if (fs.existsSync(dist)) {
  const assets = path.join(dist, 'assets')
  if (!fs.existsSync(assets)) {
    console.error('verify-site: dist/assets missing')
    process.exit(1)
  }
  const files = fs.readdirSync(assets)
  if (!files.some(f => f.endsWith('.js'))) {
    console.error('verify-site: no JS assets in dist')
    process.exit(1)
  }
  console.log(`verify-site: ok (dist, ${files.length} assets)`)
} else {
  console.log('verify-site: ok (source index markers)')
}
