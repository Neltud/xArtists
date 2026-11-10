import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import test from 'node:test'

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8')
const page = read('src/pages/CommercialLaunchPage.tsx')
const routes = read('src/App.tsx')
const house = read('src/pages/HousePage.tsx')
const home = read('src/experience/Pages.tsx')

test('public /offres route and /offers alias are discoverable',()=>{
  assert.match(routes,/path="\/offres"/)
  assert.match(routes,/path="\/offers"/)
  assert.match(routes,/CommercialLaunchPage/)
  assert.match(house,/to="\/offres"/)
  assert.match(home,/to="\/offres"/)
})

test('catalogue displays approved subscription targets and dated non-executable Genesis targets',()=>{
  const targets=read('src/config/commercialTargets.ts')
  for(const pattern of [/id: 'pulse', targetEgld: '33'/,/id: 'yield', targetEgld: '22'/,/id: 'sentinel', targetEgld: '11'/]){
    assert.match(targets,pattern)
  }
  for(const pattern of [/sku: 'fiat_379', price: '3,79'/,/sku: 'fiat_579', price: '5,79'/,/sku: 'fiat_979', price: '9,79'/]){
    assert.match(targets,pattern)
  }
  assert.match(page,/GENESIS_PREVIEW/)
  assert.match(page,/MAINSTREAM_PREVIEW/)
  assert.doesNotMatch(page,/price:110|price:75|price:50|10 € \/|Whop subscriptions are separate/)
})

test('prelaunch discovery page cannot take money, mint or record an order',()=>{
  for(const forbidden of [
    /\bfetch\s*\(/,/axios/,/CheckoutModal/,/\bPackCheckout\b/,
    /createOrder\s*\(/,/paybox.*checkout\s*\(/i,
    /window\.open\s*\(\s*['"]https:\/\/.*\/pay/i,
    /\bexecuteTransactions\b/,/signTransaction\s*\(/,
    /localStorage\.setItem\s*\(/,/sessionStorage\.setItem\s*\(/,
  ]){
    assert.doesNotMatch(page, forbidden)
  }
  assert.doesNotMatch(page,/mailto:|hello@xartists\.art/)
  assert.match(page,/issues\/new\?template=commercial-introduction\.yml/)
  assert.match(page,/PUBLIC_INTAKE_URL/)
  assert.match(page,/publicNote/)
  assert.match(page,/x\.com\/tudurioriginal/)
  assert.match(page,/no orders or payments are accepted/)
  assert.match(page,/aucune commande ni paiement accepté sur cette page/)
})

test('all contact CTA are inquiries, not promises of purchase or delivery',()=>{
  assert.match(page,/certificat|authenticity/i)
  assert.match(page,/No financial return is guaranteed|No financial returns are promised/i)
  assert.match(page,/Whop/)
  assert.match(page,/certified_authentic|aucun certificat|not authenticity certificates/)
  assert.doesNotMatch(page,/\bcheckout_enabled\s*=\s*true/)
  assert.doesNotMatch(page,/mint_live_enabled\s*=\s*true/)
})

test('public contact requires GitHub consent and must never collect private information',()=>{
  const form=read('../../.github/ISSUE_TEMPLATE/commercial-introduction.yml')
  const legacy=read('src/pages/SalePage.tsx')
  assert.match(form,/type: checkboxes/)
  assert.match(form,/required: true/)
  assert.match(form,/This GitHub issue is \*\*public\*\*/)
  assert.match(form,/no payment|No payment|no payment/i)
  assert.match(form,/private key/i)
  assert.match(legacy,/Navigate to="\/offres" replace/)
  assert.doesNotMatch(legacy,/<form|mailto:|onReserve|createOrder/)
  assert.doesNotMatch(page,/mailto:|hello@xartists\.art|fetch\s*\(/)
})

test('direct campaign URLs are prebuilt as HTTP 200 entrypoints on GitHub Pages',()=>{
  const wf=read('../../.github/workflows/static.yml')
  assert.match(wf,/for page in offres offers; do/)
  assert.ok(wf.includes('test -s "_site/$page/index.html"'))
  assert.ok(wf.includes('Vite generates route-specific titles/descriptions/OG metadata.'))
  assert.doesNotMatch(wf, /cp _site\/index\.html "_site\/\$page\/index\.html"/)
  const generator = read('scripts/publicAvailability.mjs')
  assert.match(generator, /commercialSeoHtml\(html, route\)/)
  assert.ok(wf.includes('test -s "_site/$page/index.html"'))
  assert.ok(wf.includes('"https://xartists.art/$page/"'))
  assert.match(wf,/Public campaign deep link \$page did not pass HTTP 200 check/)
})

test('Pages artifact retains Vite route-aware 404 recovery, never generic index.html',()=>{
  const wf=read('../../.github/workflows/static.yml')
  const generator=read('scripts/publicAvailability.mjs')
  const browser=read('src/lib/publicRoutes.ts')
  assert.doesNotMatch(wf,/cp\s+_site\/index\.html\s+_site\/404\.html/)
  assert.match(wf,/test -s _site\/404\.html/)
  assert.match(wf,/grep -q '_xa_route' _site\/404\.html/)
  assert.match(wf,/grep -q 'noindex' _site\/404\.html/)
  assert.match(generator,/fallbackHtml\(config\.base\)/)
  assert.match(generator,/_xa_route/)
  assert.match(browser,/searchParams\.get\('_xa_route'\)/)
})

test('commercial trailing slash cannot downgrade the browser title to NotFound',()=>{
  const shell = read('src/experience/Shell.tsx')
  assert.match(shell,/const key=pathname\.split\('\/'\)\.filter\(Boolean\)\.join\('\/'\)/)
  assert.match(shell,/const isOffers=key==='offres'\|\|key==='offers'/)
  assert.match(shell,/const title=isOffers\?/)
  assert.match(shell,/const canonical=isOffers\?new URL\('offres\/'/)
  for (const route of ['/offres', '/offres/', '/offers', '/offers/']) {
    const key = route.split('/').filter(Boolean).join('/')
    assert.ok(key === 'offres' || key === 'offers', route)
  }
})
