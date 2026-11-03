import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'

test('pack checkout does not claim gateway availability based on frontend build flags', async () => {
  const source = await fs.readFile(new URL('../src/components/PackCheckout.tsx', import.meta.url), 'utf8')
  assert.match(source, /fetch\(api \+ '\/health'/)
  assert.match(source, /health\?\.paybox_checkout_enabled === true/)
  assert.match(source, /setMerchantCheckoutReady\(false\)/)
  assert.match(source, /merchantCheckoutReady \? t\('packCheckout\.gatewayOn'\) : t\('packCheckout\.soon'\)/)
  assert.doesNotMatch(source, /hasPaidRail \? t\('packCheckout\.gatewayOn'\)/)
})

test('Genesis buy CTA stays disabled unless independent commercial GO and API runtime are verified', async () => {
  const source = await fs.readFile(new URL('../src/components/PackCheckout.tsx', import.meta.url), 'utf8')
  assert.match(source, /VITE_GENESIS_COMMERCIAL_GO === '1'/)
  assert.match(source, /health\?\.service === 'access-api'/)
  assert.match(source, /health\?\.mint_live_enabled === true/)
  assert.match(source, /health\?\.mint_dry_run === false/)
  assert.match(source, /disabled=\{!checkoutAvailable\}/)
  assert.match(source, /selected && checkoutAvailable &&/)
  assert.match(source, /sans paiement ni NFT/)
})
