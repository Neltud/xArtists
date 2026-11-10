import test from 'node:test'
import assert from 'node:assert/strict'
import { artpriceReadiness, ARTPRICE_SOURCE, validatePotentialArtpriceRecord } from '../src/artpriceLicensed.mjs'
import { physicalConfig, processShopifyPhysicalWebhook } from '../src/physicalFulfillment.mjs'
import { startServer } from './server-fixture.mjs'

test('Artprice source is official Artmarket.com, no fabricated paid data, no cached values', () => {
  const ready = artpriceReadiness()
  assert.equal(ready.provider, 'Artprice by Artmarket.com')
  assert.equal(ready.integration, 'pending_written_license')
  assert.equal(ready.licensed, false)
  assert.equal(ready.records_available, false)
  assert.deepEqual(ready.data, [])
  assert.equal(ready.scraped, false)
  assert.equal(ready.auto_import, false)
  assert.equal(ready.artprice_partner, false)
  assert.match(ready.official_source, /^https:\/\/fr\.artprice\.com\/$/)
  assert.match(ready.official_report, /^https:\/\/fr\.artprice\.com\/artprice-reports\/le-marche-de-lart-contemporain-2026$/)
  assert.match(ready.official_report_2025, /^https:\/\/fr\.artprice\.com\/artprice-news\//)
  assert.match(ARTPRICE_SOURCE.terms, /^https:\/\/fr\.artprice\.com\/block\/cgv/)
})
test('Artprice export shape is only preparatory; estimates or unknown prices are invalid', () => {
  const normal = {
    artist:'Un artiste',source_record_id:'licensed-record-1234',
    auction_date:'2025-05-21',hammer_price:23456,currency:'EUR',
    price_basis:'hammer_excluding_fees',
  }
  assert.deepEqual(validatePotentialArtpriceRecord(normal), {
    source:'Artprice by Artmarket.com',...normal,
  })
  for (const bad of [
    null, [], {}, {...normal,artist:''}, {...normal,source_record_id:''},
    {...normal,hammer_price:-1}, {...normal,hammer_price:'NaN'},
    {...normal,hammer_price:1e20}, {...normal,price_basis:'estimated'},
    {...normal,price_basis:'fees_included'}, {...normal,currency:'EGLD'},
    {...normal,auction_date:'2025'}, {...normal,auction_date:null},
  ]) assert.equal(validatePotentialArtpriceRecord(bad), null)
})
test('API returns license-required metadata, never paid rows, even under fake license flags', async () => {
  const server = await startServer({
    ARTPRICE_LICENSE_APPROVED:'1',
    ARTPRICE_API_KEY:'fake-do-not-log',
    ARTPRICE_LICENSE_CONTRACT_ID:'fake-contract',
    SHOPIFY_WEBHOOK_SECRET:'fake-secret-but-over-24-characters',
    SHOPIFY_SHOP_DOMAIN:'fake.myshopify.com',
    PHYSICAL_FULFILLMENT_ENABLED:'1',
  })
  try {
    const statusRes = await fetch(server.base+'/v1/artprice/status')
    assert.equal(statusRes.status,200)
    const body=await statusRes.json()
    assert.equal(body.licensed,false)
    assert.equal(body.records_available,false)
    assert.deepEqual(body.data,[])
    assert.equal(JSON.stringify(body).includes('fake-do-not-log'),false)
    const recordsRes=await fetch(server.base+'/v1/artprice/records')
    assert.equal(recordsRes.status,403)
    const records=await recordsRes.json()
    assert.deepEqual(records.data,[])
    assert.equal(records.error,'artprice_written_license_required')
    assert.equal((await fetch(server.base+'/v1/artprice/status',{method:'POST'})).status,405)
    const cfg=await (await fetch(server.base+'/v1/physical/config')).json()
    assert.equal(cfg.enabled,false)
    assert.equal(cfg.commerce_provider,'none')
    const webhook=await fetch(server.base+'/v1/webhooks/shopify/physical',{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:'{"id":1}',
    })
    assert.equal(webhook.status,410)
    assert.equal((await webhook.json()).error,'retired_commerce_provider')
  } finally {await server.close()}
})
test('retired merchant ingestion refuses direct function calls and all legacy credentials', async () => {
  const cfg=physicalConfig({
    PHYSICAL_FULFILLMENT_ENABLED:'1',
    SHOPIFY_WEBHOOK_SECRET:'a'.repeat(40),
    SHOPIFY_SHOP_DOMAIN:'fake.myshopify.com',
    DATABASE_URL:'postgres://example',
    PHYSICAL_ADMIN_TOKEN:'b'.repeat(40),
    ACCESS_JWT_SECRET:'c'.repeat(40),
  })
  assert.equal(cfg.enabled,false)
  assert.equal(cfg.mode,'vendor_retired')
  await assert.rejects(
    processShopifyPhysicalWebhook(Buffer.from('{}'), {}),
    e=>e.statusCode===410 && e.message==='retired_commerce_provider',
  )
})
