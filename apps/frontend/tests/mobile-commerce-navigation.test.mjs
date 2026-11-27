import {architecture as a,catalogue,navigation as n} from './architecture-catalogue.mjs'
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

test('mobile dock includes personal assets and selects related art routes',()=>{
  assert.equal(a.MOBILE_AREAS.length,5)
  assert.equal(a.MOBILE_AREAS.at(-1).id,'wallet')
  assert.match(shell,/MOBILE_AREAS.map/)
  assert.match(shell,/aria-current=\{active\?'page':undefined\}/)
  for(const path of ['/auction','/museum','/marketplace'])assert.equal(n.currentPrimarySection(path,catalogue),'art')
})

test('mobile one-row layout reserves safe-area and content space', () => {
  assert.match(css, /\.xa-mobile-dock\{[^\}]*grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/)
  assert.match(css, /\.xa-mobile-dock>a\{[^\}]*min-width:0;min-height:44px/)
  assert.match(css, /\.xa-app > main\{[^\}]*padding-bottom:calc\(86px \+ env\(safe-area-inset-bottom,0px\)\)/)
  assert.match(css, /\.xa-mobile-dock>a>span\{[^\}]*-webkit-line-clamp:2/)
})

test('Marketplace and Auctions remain routed and linked through art context',()=>{
  assert.ok(catalogue.some(x=>x.id==='market'&&x.aliases.includes('/marketplace')))
  assert.ok(catalogue.some(x=>x.id==='auction'&&x.aliases.includes('/auction')))
  assert.match(shell,/contextualModules\(modules/)
  assert.match(home,/PRIMARY_AREAS.map/)
  assert.match(market,/<Link to="\/auction"/)
  assert.match(auction,/<Link to="\/marketplace"/)
  assert.match(icons,/gavel:/)
  assert.match(availability,/for \(const route of routes\.filter/)
})

test('static deployment prepares and verifies actual public market and auction URLs', () => {
  assert.match(deploy, /_site\/marketplace\/index\.html/)
  assert.match(deploy, /_site\/auction\/index\.html/)
  assert.ok(deploy.includes('https://xartists.art/$page/'))
  assert.match(deploy, /for page in marketplace auction; do/)
  assert.doesNotMatch(deploy, /cp _site\/index\.html _site\/404\.html/)
})

test('Studio preflight warns before selecting files when uploads are disabled', () => {
  const warning = media.indexOf('L’envoi de fichiers est momentanément indisponible')
  const selector = media.indexOf('Image, vidéo ou musique (ou fichier 3D)')
  assert.ok(warning > 0 && selector > warning, 'warning must be before chooser')
  assert.match(media, /enabled===false/)
  assert.match(media, /Aperçu local uniquement/)
  assert.match(media, /disabled=\{!enabled\|\|pending/)
  assert.match(auction, /Aucune enchère ni adjudication réelle n’est acceptée actuellement/)
  const gallery=read('src/components/market/MarketplaceDiscoveryGrid.tsx')
  assert.match(market, /c\(live\?'marketStatusLive':'marketStatusOff'\)/)
  assert.match(gallery, /marketGridDriveMint/)
  assert.doesNotMatch(gallery, /DRIVE_EXHIBITION|art\/drive\//)
  assert.match(gallery, /marketGridSaleUnverified/)
  assert.match(gallery, /marketGridDeposit/)
  assert.doesNotMatch(gallery, /buyNow|buyNft|sendTransaction|requestOpenConnect/)

})
