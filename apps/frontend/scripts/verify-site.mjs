#!/usr/bin/env node
/**
 * verify-site.mjs — post-build checks on dist/
 * Requires: npm run build first (or CI after vite build).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')

if (!fs.existsSync(dist)) {
  console.error('verify-site FAILED: dist/ missing — run npm run build first')
  process.exit(1)
}

const indexPath = path.join(dist, 'index.html')
if (!fs.existsSync(indexPath)) {
  console.error('verify-site FAILED: dist/index.html missing')
  process.exit(1)
}

const html = fs.readFileSync(indexPath, 'utf8')
const errors = []

if (!html.includes('/xArtists/')) {
  errors.push('index.html assets must use base /xArtists/')
}
if (html.includes('src="/assets/') && !html.includes('/xArtists/assets/')) {
  errors.push('absolute /assets/ without /xArtists/ prefix')
}

const assetsDir = path.join(dist, 'assets')
if (!fs.existsSync(assetsDir)) {
  errors.push('dist/assets/ missing')
} else {
  const js = fs.readdirSync(assetsDir).filter(f => f.endsWith('.js'))
  if (js.length < 1) errors.push('no JS bundles in dist/assets')
}

// Optional build-info if present
const bi = path.join(dist, 'build-info.json')
if (fs.existsSync(bi)) {
  try {
    const j = JSON.parse(fs.readFileSync(bi, 'utf8'))
    if (!j.commit && !j.sha) console.warn('build-info.json present but no commit/sha field')
  } catch {
    errors.push('build-info.json invalid JSON')
  }
}

if (errors.length) {
  console.error('verify-site FAILED:')
  for (const e of errors) console.error(' -', e)
  process.exit(1)
}

console.log('verify-site OK — dist base paths and assets look valid')
