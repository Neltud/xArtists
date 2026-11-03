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

test('catalogue has only the three approved fixed EUR list prices',()=>{
  for(const pattern of [/id:'pulse', price:110/,/id:'yield', price:75/,/id:'sentinel', price:50/]){
    assert.match(page,pattern)
  }
  assert.doesNotMatch(page,/price:200|price:12|price:15|price:18/)
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
  assert.match(page,/achats publics et la livraison/)
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
  assert.doesNotMatch(legacy,/mailto:|Réserver|reservation|createOrder/)
  assert.doesNotMatch(page,/mailto:|hello@xartists\.art|fetch\s*\(/)
})

test('direct campaign URLs are prebuilt as HTTP 200 entrypoints on GitHub Pages',()=>{
  const wf=read('../../.github/workflows/static.yml')
  assert.match(wf,/for page in offres offers; do/)
  assert.ok(wf.includes('cp _site/index.html "_site/$page/index.html"'))
  assert.ok(wf.includes('test -s "_site/$page/index.html"'))
  assert.ok(wf.includes('"https://neltud.github.io/xArtists/$page/"'))
  assert.match(wf,/Public campaign deep link \$page did not pass HTTP 200 check/)
})
