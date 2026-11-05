import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8')
const shell = read('src/experience/Shell.tsx')
const css = read('src/experience/experience.css')
const modules = read('src/experience/modules.ts')
const home = read('src/experience/Pages.tsx')
const market = read('src/pages/MarketplacePage.tsx')
const auction = read('src/pages/AuctionPage.tsx')
const media = read('src/components/CreatorMediaUpload.tsx')
const icons = read('src/experience/Icon.tsx')
const availability = read('scripts/publicAvailability.mjs')
const deploy = read('../../.github/workflows/static.yml')

test('mobile dock has exactly five independent direct destinations, with Marketplace and Auction', () => {
  const match = shell.match(/const MOBILE_DESTINATIONS = \[([\s\S]*?)\] as const/)
  assert.ok(match, 'must have explicit, testable dock destination registry')
  const destinations = [...match[1].matchAll(/to:'([^']+)'/g)].map(m=>m[1])
  assert.deepEqual(destinations, ['/', '/marketplace', '/auction', '/studio', '/finance/governance'])
  assert.match(shell, /<Link to="\/museum" onClick=\{closeMobile\}>/)
  assert.match(shell, /<Link to="\/dao" onClick=\{closeMobile\}>/)
  assert.match(shell, /aria-current=\{active\?'page':undefined\}/)
  assert.match(shell, /'\/explore\/market'/)
  assert.match(shell, /'\/explore\/auction'/)
  assert.match(shell, /'\/create\/studio'/)
  assert.match(shell, /aria-label=\{c\(item.label\)\}/)
})

test('mobile one-row layout reserves safe-area and content space', () => {
  assert.match(css, /\.xa-mobile-dock\{[^\}]*grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/)
  assert.match(css, /\.xa-mobile-dock>a\{[^\}]*min-width:0;min-height:44px/)
  assert.match(css, /\.xa-app > main\{[^\}]*padding-bottom:calc\(86px \+ env\(safe-area-inset-bottom,0px\)\)/)
  assert.match(css, /\.xa-mobile-dock>a>span\{[^\}]*-webkit-line-clamp:2/)
})

test('Marketplace and Auctions always reachable through real module routes, menus and hero', () => {
  assert.match(modules, /module\('market','\/explore\/market',\['\/market','\/marketplace'/)
  assert.match(modules, /module\('auction','\/explore\/auction',\['\/auction','\/encheres'/)
  assert.match(shell, /<Link to="\/marketplace" onClick=\{closeMobile\}>/)
  assert.match(shell, /<Link to="\/auction" onClick=\{closeMobile\}>/)
  assert.match(home, /id:'market',to:'\/marketplace'/)
  assert.match(home, /<Link to="\/auction" className="xa-text-link">/)
  assert.match(market, /<Link to="\/auction"/)
  assert.match(auction, /<Link to="\/marketplace"/)
  assert.match(icons, /gavel:/)
  assert.match(availability, /for \(const route of routes\.filter/)
})

test('static deployment prepares and verifies actual public market and auction URLs', () => {
  assert.match(deploy, /_site\/marketplace\/index\.html/)
  assert.match(deploy, /_site\/auction\/index\.html/)
  assert.ok(deploy.includes('https://neltud.github.io/xArtists/$page/'))
  assert.match(deploy, /for page in marketplace auction; do/)
  assert.doesNotMatch(deploy, /cp _site\/index\.html _site\/404\.html/)
})

test('Studio preflight warns before selecting files when uploads are disabled', () => {
  const warning = media.indexOf('Upload IPFS indisponible')
  const selector = media.indexOf('Photo ou vidéo originale')
  assert.ok(warning > 0 && selector > warning, 'warning must be before chooser')
  assert.match(media, /enabled===false/)
  assert.match(media, /Aperçu local uniquement/)
  assert.match(media, /disabled=\{!enabled\|\|pending/)
  assert.match(auction, /Aucune enchère ni adjudication réelle n’est acceptée actuellement/)
  assert.match(market, /Achat désactivé · contrat non validé/)
})
