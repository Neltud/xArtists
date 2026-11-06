import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = path => readFileSync(new URL('../src/' + path, import.meta.url), 'utf8')
const docs = path => readFileSync(new URL('../../../docs/' + path, import.meta.url), 'utf8')

test('Art-first hierarchy prioritizes museum, auction, RWA and Studio', () => {
  const modules = src('experience/modules.ts')
  const core = src('experience/softLaunch.ts')
  const nav = src('experience/Shell.tsx')
  const ids = ['museum','auction','rwa','market']
  const indexes = ids.map(id => modules.indexOf("module('" + id + "'"))
  assert.ok(indexes.every(i => i >= 0))
  assert.deepEqual([...indexes].sort((a,b) => a-b), indexes)
  assert.match(core, /'auction'/)
  assert.match(core, /'rwa'/)
  // Desktop now surfaces Marketplace before Auctions; RWA remains discoverable
  // in the mobile menu and Explore. Do not assert the superseded desktop nav.
  const links = ["/explore/museum',c('explore')","/create/studio',c('create')","/explore/market',c('market')","/finance/governance',c('dao')","/guide',c('help')"]
  const navIndexes = links.map(link => nav.indexOf(link))
  assert.ok(navIndexes.every(i => i >= 0), 'explore, create, market, DAO and beginner help must be direct desktop destinations')
  assert.deepEqual([...navIndexes].sort((a,b) => a-b), navIndexes)
  assert.match(nav, /to="\/rwa"/)
  assert.match(nav, /to="\/auction" onClick=\{closeMobile\}/)
})

test('Maison is a real public route and GitBook page, not a placeholder', () => {
  assert.match(src('App.tsx'), /path="\/maison"/)
  assert.match(src('App.tsx'), /path="\/manifesto"/)
  const house = src('pages/HousePage.tsx')
  assert.match(house, /TUDURI_WORKS/)
  assert.match(house, /ATELIER_EXPLORER/)
  assert.match(house, /NFT is not automatically legal title/)
  assert.match(house, /No real bids, awards or settlements/)
  assert.match(docs('SUMMARY.md'), /presentation\/maison-manifeste\.md/)
  assert.match(docs('presentation/maison-manifeste.md'), /NO-GO/)
})

test('Auction witness cannot masquerade as a paid or available listing', () => {
  const auction = src('pages/AuctionPage.tsx')
  assert.match(auction, /TUDURI_WORKS\[0\]/)
  assert.match(auction, /Non proposé à la vente/)
  assert.match(auction, /aucune enchère, prix, garde ni adjudication attestés/)
  assert.doesNotMatch(auction, /placeBid\(/)
})
