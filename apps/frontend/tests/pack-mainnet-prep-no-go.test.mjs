import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const readSource = (path) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8')

test('Agents pack crypto transaction remains explicitly fail-closed in PREP', () => {
  const sc = readSource('config/scStatus.ts')
  assert.match(sc, /export const AGENT_PACK_PUBLIC_MINT_RELEASED = false/)
  assert.match(sc, /export const AGENT_PACK_PUBLIC_COMMERCE_RELEASED = false/)
  assert.match(sc, /export function canBuyAgent\(\): boolean\s*\{\s*return \(\s*AGENT_PACK_PUBLIC_MINT_RELEASED &&/)
})

test('Pack checkout shows dated contract snapshot, not an executable catalog anchor', () => {
  const source = readSource('components/PackCheckout.tsx')
  assert.match(source, /AGENT_PACK_SC_SNAPSHOT\.pricesEgld\[p\.id\]/)
  assert.match(source, /pas un devis/)
  assert.doesNotMatch(source, /p\.priceEgld\.list/)
})

test('CheckoutModal crypto rail and action stay closed without mint readiness', () => {
  const source = readSource('components/CheckoutModal.tsx')
  assert.match(source, /disabled=\{railLocked \|\| !mintLive\}/)
  assert.match(source, /\(rail === 'crypto' && !mintLive\)/)
  assert.match(source, /Crypto : tarif à revalider sur la chaîne/)
})

test('Last observed SC price values stay distinct from fiat catalogue anchors', () => {
  const source = readSource('config/agentPacks.ts')
  assert.match(source, /pricesEgld: \{ pulse: 1, yield: 5, sentinel: 2\.5 \}/)
  assert.match(source, /commerceGo: false/)
  assert.match(source, /priceEur: \{ min: 50, max: PACK_PRICE_EUR\.max, list: 110 \}/)
})

test('All pack checkout rails require explicit content-ready commercial clearance', () => {
  const panel = readSource('components/PackCheckout.tsx')
  const modal = readSource('components/CheckoutModal.tsx')
  assert.match(panel, /const checkoutAvailable = AGENT_PACK_PUBLIC_COMMERCE_RELEASED && commercialGoRequested/)
  assert.match(modal, /if \(!AGENT_PACK_PUBLIC_COMMERCE_RELEASED \|\| import\.meta\.env\.VITE_GENESIS_COMMERCIAL_GO !== '1'\) return false/)
})
