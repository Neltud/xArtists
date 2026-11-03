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
  assert.match(page,/mailto:hello@xartists\.art/)
  assert.match(page,/encodeURIComponent\(subject\)/)
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
