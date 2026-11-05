import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const panel = await readFile(new URL('../src/components/market/OpenSeaCollectionPanel.tsx', import.meta.url), 'utf8')
const marketplace = await readFile(new URL('../src/pages/MarketplacePage.tsx', import.meta.url), 'utf8')

test('Marketplace exposes a fourth, discoverable tab, without changing MultiversX buying gates', () => {
  assert.match(marketplace, /id:'opensea'/)
  assert.match(marketplace, /selected==='opensea'&&<OpenSeaCollectionPanel/)
  assert.match(marketplace, /to="\/marketplace\?tab=opensea"/)
  assert.match(marketplace, /const live=canListBuyNft\(\)/)
})
test('OpenSea panel is external read-only, with no wallet transaction or checkout flow', () => {
  assert.match(panel, /'v1\/marketplace\/opensea\/collection'|\/v1\/marketplace\/opensea\/collection/)
  assert.match(panel, /payload\.mode !== 'read_only'/)
  assert.match(panel, /payload\.on_site_order_enabled !== false/)
  assert.match(panel, /target="_blank" rel="noopener noreferrer"/)
  assert.match(panel, /Prix et listing non vérifiés/)
  assert.doesNotMatch(panel, /sendTransaction|signTransaction|mintNft|createOrder|CheckoutModal|executeOrder|window\.ethereum|requestOpenConnect/)
})
test('Only the two explicitly selected chains are exposed', () => {
  assert.match(panel, /value="solana"/)
  assert.match(panel, /value="polygon"/)
  assert.match(panel, /collectionPattern\.test\(cleanSlug\)/)
  assert.doesNotMatch(panel, /x-api-key|OPEN_SEA_API_KEY|VITE_OPENSEA_API_KEY/)
})
