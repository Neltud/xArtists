import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8')
const market = read('../src/pages/MarketplacePage.tsx')
const css = read('../src/pages/marketplace-page.css')
const oldShellCss = read('../src/experience/experience.css')
const gallery = read('../src/components/market/MarketplaceDiscoveryGrid.tsx')

test('Marketplace hero is a light-first, readable editorial surface in both themes', () => {
  const app = read('../src/App.tsx')
  assert.match(app, /import '\.\/pages\/marketplace-page\.css'/)
  assert.doesNotMatch(market, /import '\.\/marketplace-page\.css'/)
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
  assert.match(market, /href="#xa-market-grid"/)
  assert.match(market, /<MarketplaceDiscoveryGrid/)
  assert.match(market, /id="xa-market-categories"/)
  assert.match(market, /<nav aria-label=\{c\('marketCategoriesLabel'\)\}/)
  assert.match(market, /SHELVES\.map\(\(s,i\)/)
  assert.match(market, /aria-current=\{selected===s\.id\?'page':undefined\}/)
  assert.match(css, /@media \(max-width: 540px\)/)
  assert.match(css, /\.xa-marketplace-categories__grid\s*\{\s*display:\s*flex/)
  assert.match(css, /\.xa-marketplace-category__summary\s*\{\s*display:\s*none/ )
  assert.match(css, /\.xa-market-grid__cards\s*\{\s*grid-template-columns:\s*repeat\(2,minmax\(0,1fr\)\)/)
  assert.match(css, /\.xa-marketplace-category:focus-visible/)
  assert.match(css, /prefers-reduced-motion: reduce/)
})

test('Browsing is walletless and NFT transaction safeguards remain unchanged', () => {
  assert.match(market, /<Link to="\/studio"/)
  assert.match(market, /<Link to="\/rwa"/)
  assert.match(market, /<Link to="\/auction"/)
  assert.doesNotMatch(market, /requestOpenConnect|useWallet/)
  assert.match(market, /const live=canListBuyNft\(\)/)
  assert.match(market, /c\(live\?'marketStatusLive':'marketStatusOff'\)/)
  assert.match(market, /c\('marketStatusOwnership'\)/)
  assert.match(market, /<MainnetJourney current="market" \/>/)
  assert.match(market, /selected==='opensea'&&<OpenSeaCollectionPanel/)
})

test('Marketplace visitor entry copy is complete in all eight supported languages', () => {
  const locale = read('../src/experience/locale.ts')
  const keys = [
    'marketHeroEyebrow','marketHeroTitleA','marketHeroTitleB','marketHeroLead',
    'marketPrimaryCta','marketStudioCta','marketSecondaryLabel','marketPhysicalLink',
    'marketAuctionPreview','marketIndexLabel','marketIndexDigital','marketIndexPhysical',
    'marketIndexCreative','marketIndexDataDisclaimer','marketIndexPriceDisclaimer','marketPriceUnknown',
    'marketStatusPrefix','marketStatusLive','marketStatusOff',
    'marketStatusOwnership','marketExploreTitle','marketExploreIntro','marketCategoriesLabel',
    'marketShelfArtName','marketShelfArtSummary','marketShelfRwaName','marketShelfRwaSummary',
    'marketShelfPacksName','marketShelfPacksSummary','marketShelfOpenSeaName','marketShelfOpenSeaSummary',
  ]
  for (const key of keys) {
    const line = locale.split('\n').find(value => value.trim().startsWith(key + ': '))
    assert.ok(line, 'Missing localized key: ' + key)
    const values = JSON.parse(line.trim().slice((key + ': ').length).replace(/,\s*$/, ''))
    assert.equal(values.length, 8, key + ' must cover fr,en,es,de,ru,uk,zh,ar')
    for (const entry of values) assert.ok(typeof entry === 'string' && entry.trim().length > 0, key)
    assert.ok(market.includes("c('" + key + "')") || market.includes("name:'" + key + "'") ||
      market.includes("summary:'" + key + "'") || market.includes("'"+key+"'") ||
      gallery.includes("'"+key+"'"),
      key + ' needs to be consumed by the marketplace page')
  }
  assert.match(market, /const c=useCopy\(\)/)
  assert.match(market, /<strong>\{c\(s\.name\)\}<\/strong>/)
  assert.match(market, /<span className="xa-marketplace-category__summary">\{c\(s\.summary\)\}<\/span>/)
})

test('Unverified index prices are never presented as confirmed on-chain offers', () => {
  assert.match(market, /const raw=l\.price_egld/)
  assert.doesNotMatch(market, /l\.price_egld\s*\?\?\s*l\.price/)
  assert.match(gallery, /sourceReady&&listings\.length>0&&<p className="xa-market-grid__source-note" role="note"/)
  assert.match(gallery, /c\('marketIndexDataDisclaimer'\)/)
  assert.match(gallery, /c\('marketGridUnverified'\)/)
  assert.match(gallery, /card\.price\.toFixed\(4\)\+' EGLD · '/)
  assert.match(market, /c\(live\?'marketStatusLive':'marketStatusOff'\)/)
  assert.match(market, /const live=canListBuyNft\(\)/)
})

test('Marketplace critical CSS is bundled eagerly instead of requiring lazy CSS preloading', () => {
  const app = read('../src/App.tsx')
  const main = read('../src/main.tsx')
  assert.match(main, /import App from '\.\/App'/)
  assert.match(app, /import '\.\/pages\/marketplace-page\.css'/)
  assert.doesNotMatch(market, /import '\.\/marketplace-page\.css'/)
  assert.match(css, /\.xa-marketplace-hero\s*\{/)
  assert.match(css, /\.xa-marketplace-category\s*\{/)
})


test('Marketplace is an artwork grid first, not a technical dashboard', () => {
  assert.match(market, /import MarketplaceDiscoveryGrid from/)
  assert.doesNotMatch(market, /<DriveArtShowcase compact/)
  const gridPos=market.indexOf("<MarketplaceDiscoveryGrid")
  const techPos=market.indexOf('<details className="xa-market-tech"')
  const statusPos=market.indexOf('<p className="xa-marketplace-status"')
  assert.ok(gridPos>0 && techPos>gridPos && statusPos>gridPos,
    'real artworks must appear before technical stock data and legal status')
  assert.match(market, /selected!=='art'&&<header className="xa-marketplace-hero"/)
  assert.match(market, /showTech&&<div><LiaAndEscrowNfts/)
  assert.match(gallery, /DRIVE_EXHIBITION\.map/)
  assert.match(gallery, /art\/drive\//)
  assert.match(gallery, /<ul className="xa-market-grid__cards"/)
  assert.match(gallery, /<img src=\{card\.image\}/)
  assert.match(gallery, /role="group" aria-label=\{c\('marketGridFilters'\)\}/)
  assert.match(gallery, /type="search"/)
  assert.match(gallery, /setFilter\(f\)/)
  assert.match(css, /\.xa-market-grid__cards\s*\{[^}]*repeat\(4, minmax\(0, 1fr\)\)/)
  assert.match(css, /\.xa-market-grid__media\s*\{[^}]*aspect-ratio:\s*1 \/ 1/)
})

test('Marketplace must not invent listings, prices or buy buttons from NFTs', () => {
  assert.match(gallery, /API\+'\/accounts\/'\+encodeURIComponent\(address\)\+'\/nfts\?size=60'/)
  assert.match(gallery, /source:'studio'/)
  assert.match(gallery, /fromNft\(n,'escrow'\)/)
  assert.match(gallery, /fromNft\(n,'owned'\)/)
  assert.match(gallery, /href:explorer\(identifier\),price:indexedEgld\(l\.price_egld\)/)
  assert.doesNotMatch(gallery, /requestOpenConnect|buyPack|buyNft|window\.ethereum|sendTransaction/)
  assert.doesNotMatch(gallery, /price\s*\?\?\s*0|price_egld\s*\?\?\s*l\.price/)
  assert.match(gallery, /marketGridExhibit/)
  assert.match(gallery, /marketGridDeposit/)
  assert.match(gallery, /marketGridHeld/)
  assert.match(gallery, /marketGridIndexed/)
  assert.match(gallery, /marketGridSaleUnverified/)
})

test('Marketplace grid controls are translated for all eight locales', () => {
  const locale = read('../src/experience/locale.ts')
  const keys = [
    'marketGridTitle','marketGridDescription','marketGridResults','marketGridSearch',
    'marketGridSort','marketGridFilters','marketGridAll','marketGridStudio',
    'marketGridChain','marketGridIndex','marketGridRecent','marketGridLow',
    'marketGridHigh','marketGridNotice','marketGridExhibit','marketGridHeld',
    'marketGridDeposit','marketGridIndexed','marketGridUnverified',
    'marketGridNotListed','marketGridSaleUnverified','marketGridViewArt',
    'marketGridVerify','marketGridNoLink','marketGridLoading','marketGridEmpty',
    'marketGridReset','marketGridChainUnavailable','marketGridIndexUnavailable',
    'marketGridTechTitle',
  ]
  for (const key of keys) {
    const line=locale.split('\n').find(value=>value.trim().startsWith(key+': '))
    assert.ok(line, 'missing marketplace translation '+key)
    const translated=JSON.parse(line.trim().slice((key+': ').length).replace(/,\s*$/,''))
    assert.equal(translated.length,8,key)
    assert.ok(translated.every(value=>typeof value==='string'&&value.trim()),key)
    assert.ok(gallery.includes("'"+key+"'")||market.includes("'"+key+"'"),'unused key '+key)
  }
})
