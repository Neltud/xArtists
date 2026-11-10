import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8')
const targets = read('../src/config/commercialTargets.ts')
const offers = read('../src/pages/CommercialLaunchPage.tsx')
const pack = read('../src/pages/PackLandingPage.tsx')

test('approved commercial targets keep Pulse/Yield/Sentinel order and close all checkouts', () => {
  assert.ok(targets.indexOf("id: 'pulse', targetEgld: '33'") < targets.indexOf("id: 'yield', targetEgld: '22'"))
  assert.ok(targets.indexOf("id: 'yield', targetEgld: '22'") < targets.indexOf("id: 'sentinel', targetEgld: '11'"))
  assert.match(targets, /PUBLIC_PURCHASE_ENABLED = false/)
  assert.match(targets, /PUBLIC_COMMERCE_TARGETS_ONLY = true/)
  assert.match(targets, /Historica[l]? VM 2026-11-08|Historical VM 2026-11-08/)
  assert.match(targets, /1 \/ 5 \/ 2\.5 EGLD/)
})
test('three monthly Stripe tiers are VAT-inclusive and always NFT-free and walletless', () => {
  for (const [sku, cents] of [['fiat_379', 379], ['fiat_579', 579], ['fiat_979', 979]]) {
    assert.match(targets, new RegExp("sku: '" + sku + "'[^\\n]*cents: " + cents))
  }
  assert.equal((targets.match(/includesNft: false, requiresWallet: false/g) || []).length, 3)
  assert.match(offers, /TTC \/ mois/)
  assert.match(offers, /incl\. VAT \/ month/)
  assert.match(offers, /servicesNoNft/)
  assert.match(offers, /MAINSTREAM_PREVIEW\.map/)
  assert.match(offers, /Stripe Nelsonprods/)
})
test('Genesis quotes require EUR policy 2; not on-chain fixed list prices', () => {
  assert.match(offers, /TTL prévu 180 secondes/)
  assert.match(offers, /base EUR non encore définie/)
  assert.match(offers, /GENESIS_PREVIEW\.map/)
  assert.match(offers, /Écart contrat \/ objectif : vente bloquée/)
  assert.match(pack, /plafonds de devis commerciaux/)
  assert.match(pack, /Relevé contrat du 08\/11/)
  assert.match(pack, /Aucun paiement ni NFT livré/)
})
test('public discovery is readable and non-transactional; no password, checkout or dead domain email', () => {
  for (const page of [offers, pack]) {
    assert.doesNotMatch(page, /mailto:hello@|hello@xartists\.art|createCheckoutSession\s*\(|startPackPayment\s*\(|buyPack\s*\(/)
    assert.doesNotMatch(page, /pack\.priceEur\.list|10 € \/|22,5 \/ 15 EGLD/)
  }
  assert.doesNotMatch(offers, /<PackCheckout|<CheckoutModal|Whop.*(?:checkout|subscription)/i)
  assert.doesNotMatch(pack, /<PackCheckout|<CheckoutModal|Whop/)
  assert.match(offers, /text-zinc-900 dark:text-zinc-100/)
  assert.match(offers, /href="#commercial-services"/)
  assert.match(offers, /href="#commercial-genesis"/)
})
