import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8')
const html = read('index.html')
const vite = read('vite.config.ts')
const main = read('src/main.tsx')
const availability = read('scripts/publicAvailability.mjs')
const workflow = read('../../.github/workflows/static.yml')
const manifest = JSON.parse(read('public/manifest.webmanifest'))
const robots = read('public/robots.txt')
const sitemap = read('public/sitemap.xml')
const release = read('scripts/write-build-info.mjs')
const verify = read('scripts/verify-pages-artifact.mjs')
const routes = read('src/lib/publicRoutes.ts')

test('custom domain build serves the app from root without old /xArtists/ base paths', () => {
  assert.match(vite, /base: '\/'/)
  assert.match(main, /basename=\{import\.meta\.env\.BASE_URL\}/)
  assert.match(html, /href="\/manifest\.webmanifest"/)
  assert.match(html, /href="\/icons\/icon-192\.png"/)
  assert.match(html, /href="\/icons\/apple-touch-icon\.png"/)
  assert.doesNotMatch(html, /href="\/xArtists\//)
})
test('PWA scope, icons, robots, sitemap and canonical are for xartists.art', () => {
  assert.equal(manifest.id, '/')
  assert.equal(manifest.start_url, '/')
  assert.equal(manifest.scope, '/')
  for (const icon of manifest.icons) assert.match(icon.src, /^\/icons\//)
  for (const s of manifest.shortcuts) assert.ok(s.url.startsWith('/'))
  assert.match(html, /https:\/\/xartists\.art\/og-image\.png/)
  assert.match(html, /rel="canonical" href="https:\/\/xartists\.art\/"/)
  assert.match(robots, /https:\/\/xartists\.art\/sitemap\.xml/)
  assert.match(sitemap, /https:\/\/xartists\.art\//)
  assert.doesNotMatch(sitemap, /neltud\.github\.io/)
  assert.match(availability, /https:\/\/xartists\.art\/offres\//)
})
test('artifact carries root base and rejects static asset route replay', () => {
  assert.match(release, /base_url: release\.base_path/)
  assert.match(verify, /const BASE = '\/'/)
  assert.match(routes, /new URL\('assets\/', root\)\.pathname/)
})
test('GitHub Pages deploy is blocked until both custom-domain ownership and web DNS are ready', () => {
  assert.match(workflow, /jq -r '\.cname \/\/ ""'/)
  assert.match(workflow, /cname" != "xartists\.art"/)
  for (const addr of ['185.199.108.153','185.199.109.153','185.199.110.153','185.199.111.153']) {
    assert.ok(workflow.includes(addr))
  }
  assert.match(workflow, /www\.xartists\.art CNAME/)
  assert.match(workflow, /neltud\.github\.io\./)
  assert.match(workflow, /::error::Unexpected apex A record/)
  assert.match(workflow, /needs: build/)
  assert.match(workflow, /VITE_DAPP_URL: https:\/\/xartists\.art\//)
})
test('domain cutover never authorizes a mint, card checkout or contact mailbox', () => {
  const status = read('src/config/scStatus.ts')
  assert.match(status, /AGENT_PACK_PUBLIC_COMMERCE_RELEASED = false/)
  assert.match(status, /AGENT_PACK_PUBLIC_MINT_RELEASED = false/)
  const guards = read('src/config/legalEntity.ts')
  assert.match(guards, /contact: 'Issues GitHub/)
  assert.doesNotMatch(guards, /hello@xartists\.art/)
  // Domain migration is independent of database/ledger infrastructure.
  assert.doesNotMatch(workflow, /\b(?:setPackPrice|buyPack|live_mint=true)\b/)
})
