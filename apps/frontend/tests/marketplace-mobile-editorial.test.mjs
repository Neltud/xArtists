import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8')
const market = read('../src/pages/MarketplacePage.tsx')
const css = read('../src/pages/marketplace-page.css')
const oldShellCss = read('../src/experience/experience.css')

test('Marketplace hero is a light-first, readable editorial surface in both themes', () => {
  assert.match(market, /import '\.\/marketplace-page\.css'/)
  assert.match(market, /<header className="xa-marketplace-hero">/)
  assert.match(css, /\.xa-marketplace-hero\s*\{[^}]*background:\s*var\(--xa-panel\)/)
  assert.match(css, /\.xa-marketplace-hero__lead\s*\{[^}]*color:\s*var\(--xa-muted\)/)
  assert.match(css, /\.xa-module-body \.xa-marketplace-hero h1\s*\{[^}]*color:\s*var\(--xa-text\)/)
  assert.match(css, /font-size:\s*clamp\(30px, 8vw, 39px\) !important/)
  assert.doesNotMatch(market, /from-zinc-950 via-slate-950 to-violet-950/)
  // Legacy light-theme utilities recolor .text-white dark regardless of panel.
  // This hero deliberately avoids that combination rather than globally removing it.
  assert.match(oldShellCss, /html\[data-theme=light\] \.xa-module-body \.text-white/)
})

test('Mobile marketplace shows four categories without oversized stacked CTA buttons', () => {
  assert.match(market, /href="#xa-market-categories"/)
  assert.match(market, /id="xa-market-categories"/)
  assert.match(market, /<nav aria-label="Catégories d’œuvres"/)
  assert.match(market, /SHELVES\.map\(\(s,i\)/)
  assert.match(market, /aria-current=\{selected===s\.id\?'page':undefined\}/)
  assert.match(css, /@media \(max-width: 540px\)/)
  assert.match(css, /\.xa-marketplace-categories__grid\s*\{\s*gap: 8px;/)
  assert.match(css, /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/)
  assert.match(css, /\.xa-marketplace-category:focus-visible/)
  assert.match(css, /prefers-reduced-motion: reduce/)
})

test('Browsing is walletless and NFT transaction safeguards remain unchanged', () => {
  assert.match(market, /<Link to="\/studio"/)
  assert.match(market, /<Link to="\/rwa"/)
  assert.match(market, /<Link to="\/auction"/)
  assert.doesNotMatch(market, /requestOpenConnect|useWallet/)
  assert.match(market, /const live=canListBuyNft\(\)/)
  assert.match(market, /transactions désactivées tant que le contrat et son codehash/)
  assert.match(market, /Les certificats ne sont pas automatiquement des titres de propriété/)
  assert.match(market, /<MainnetJourney current="market" \/>/)
  assert.match(market, /selected==='opensea'&&<OpenSeaCollectionPanel/)
})
