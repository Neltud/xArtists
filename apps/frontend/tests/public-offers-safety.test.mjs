import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
const commercial = readFileSync(new URL('../src/pages/CommercialLaunchPage.tsx', import.meta.url), 'utf8')
const routeScript = readFileSync(new URL('../scripts/check-routes.mjs', import.meta.url), 'utf8')

test('public offers route resolves to the non-transactional page', () => {
  assert.match(app, /path="\/offres"[\s\S]*?CommercialLaunchPage/)
  assert.match(app, /path="\/offers"[\s\S]*?Alias to="\/offres"/)
})
test('commercial discovery explicitly discloses no checkout and no NFT delivery', () => {
  assert.match(commercial, /NO checkout, payment collection/)
  assert.match(commercial, /aucune commande ni paiement accepté sur cette page/)
  assert.match(commercial, /no orders or payments are accepted on this page/)
  assert.match(commercial, /no NFT certificate, automatic access or entitlement/)
})
test('public offers page has no direct wallet, mint or payment execution calls', () => {
  assert.doesNotMatch(commercial, /\b(?:fetch|axios\.post|window\.ethereum\.request|sendTransaction|signAndSendTransactions|mintNft|mintNFT|createCheckoutSession)\s*\(/)
})
test('route checker guards duplicates and unresolved public links', () => {
  assert.match(routeScript, /duplicate route/)
  assert.match(routeScript, /duplicate alias/)
  assert.match(routeScript, /Object\.keys\(unknown\)\.length/)
})
