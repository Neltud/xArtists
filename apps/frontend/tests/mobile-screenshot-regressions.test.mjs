import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8')
const styles = read('../src/experience/mobile-contrast-fixes.css')
const shell = read('../src/experience/Shell.tsx')
const auction = read('../src/pages/AuctionPage.tsx')
const staking = read('../src/pages/StakingPage.tsx')
const nft = read('../src/pages/NftDistributorPage.tsx')
const tour = read('../src/pages/DemoTourPage.tsx')
const app = read('../src/App.tsx')
const locale = read('../src/experience/locale.ts')

test('screenshot fixes load after the base and public theme CSS', () => {
 assert.match(app, /import '\.\/experience\/experience\.css'[\s\S]*import '\.\/experience\/public-finish\.css'[\s\S]*import '\.\/experience\/mobile-contrast-fixes\.css'/)
 assert.match(styles, /html\[data-theme="light"\] \.xa-module-body \[class\*="text-amber-"\]/)
 assert.match(styles, /html\[data-theme="light"\] \.xa-module-body \[class\*="text-green-"\]/)
 assert.match(styles, /html\[data-theme="light"\] \.xa-module-body \[class\*="text-emerald-"\]/)
 assert.doesNotMatch(styles, /html\[data-theme="dark"\] \.xa-module-body \[class\*="text-amber-"\]/)
})

test('mobile header keeps menu accessible even when wallet is connected', () => {
 assert.match(styles, /@media \(max-width: 840px\)/)
 assert.match(styles, /\.xa-connect span \{ display: none; \}/)
 assert.match(styles, /\.xa-connect svg \{ display: block;/)
 assert.match(styles, /\.xa-mobile-trigger \{ display: inline-flex;/)
 assert.match(shell, /xa-mobile-lang/)
 assert.match(shell, /xa-mobile-music/)
 assert.match(shell, /openPlaylistModal\(\)/)
 assert.match(styles, /\.music-player-toggle \{ display: none; \}/)
 const row = locale.match(/musicLabel: (\[[^\n]*\]),/)
 assert.ok(row)
 assert.equal(JSON.parse(row[1]).length, 8)
})

test('auction has explicit light/dark design contrast and no leaked server flags to visitors', () => {
 assert.match(auction, /xa-auction-preview/)
 assert.match(auction, /xa-auction-status/)
 assert.match(auction, /Enchères en préparation — aucune mise possible/)
 assert.match(auction, /Aucune enchère ni adjudication réelle n’est acceptée actuellement/)
 assert.doesNotMatch(auction, /Flag serveur|<code.*AUCTION_ENABLED/)
 assert.match(styles, /html\[data-theme="light"\] \.xa-module-body \.xa-auction-preview/)
 assert.match(styles, /background: #20251e !important/)
 assert.match(tour, /guideSaleNotice/)
})

test('NFT layer editor and disabled commercial CTA reflow safely on small screens', () => {
 assert.match(nft, /xa-nft-factory/)
 assert.match(nft, /xa-nft-layer-row/)
 assert.match(nft, /xa-nft-variant-row/)
 assert.match(nft, /disabled className="btn-primary mt-3 text-xs"/)
 assert.match(styles, /\.xa-nft-factory \.grid \{ grid-template-columns: minmax\(0, 1fr\) !important; \}/)
 assert.match(styles, /\.xa-nft-factory \.xa-nft-variant-row/)
 assert.match(styles, /\.xa-nft-factory \.btn-primary:disabled/)
 assert.doesNotMatch(nft, /mintLiveEnabled = true|checkoutEnabled = true/)
})

test('staking repairs contrast and accurately explains DAO $TRO-only vote weight', () => {
 assert.match(staking, /xa-staking-page/)
 assert.match(staking, /xa-staking-pool-card/)
 assert.match(staking, /le vote DAO dépend uniquement du montant de \$TRO staké/)
 assert.doesNotMatch(staking, /vote = holders \+ LP power/)
 assert.match(styles, /\.xa-staking-pool-card/)
})
