import assert from 'node:assert/strict'
import { test } from 'node:test'
import crypto from 'node:crypto'
import sdk from '@multiversx/sdk-core'
import {
  physicalConfig, verifyShopifyDelivery, issuePhysicalSession, physicalActor,
  createPhysicalRecord, applyPaidOrder, applyFulfillment, bindBuyer,
  confirmPhysicalReceipt, requestPhysicalReassessment, publicWorkView,
  merchantAuthorized, assessConditionRisk,
} from '../src/physicalFulfillment.mjs'
import { signJwt, verifyJwt } from '../src/verifyAccess.mjs'
import { startServer, post } from './server-fixture.mjs'

const { Address }=sdk
const pub=()=>crypto.generateKeyPairSync('ed25519').publicKey.export({type:'spki',format:'der'}).subarray(-32)
const artist=new Address(pub()).toBech32()
const buyer=new Address(pub()).toBech32()
const buyer2=new Address(pub()).toBech32()
const evidence='a'.repeat(64)
const makeWork=()=>createPhysicalRecord({
  title:'Original Painting #1',artist:'Creator',medium:'oil on canvas',
  photoSha256:evidence,nftIdentifier:'ART-abcdef-01',
},artist)
const paid=(sku,id='1234567')=>({id,financial_status:'paid',
  line_items:[{sku,quantity:1}],cancelled_at:null,refunds:[]})
const ship=(sku,shipment_status)=>({
  id:'f98765',order_id:'1234567',
  line_items:[{sku,quantity:1}],shipment_status,
  tracking_number:'safe-tracking-value',tracking_company:'Carrier',
  tracking_url:'https://tracking.example.com/detail',
})

test('physical module is disabled until all server-side gates are explicitly configured',()=>{
  const cfg=physicalConfig({
    PHYSICAL_FULFILLMENT_ENABLED:'1',
    SHOPIFY_WEBHOOK_SECRET:'a'.repeat(32),SHOPIFY_SHOP_DOMAIN:'g2vj0e-10.myshopify.com',
    ACCESS_JWT_SECRET:'secret-sufficiently-long',
    DATABASE_URL:'',PHYSICAL_ADMIN_TOKEN:'b'.repeat(40),
  })
  assert.equal(cfg.enabled,false)
  assert.equal(physicalConfig({}).enabled,false)
  assert.equal(physicalConfig({
    PHYSICAL_FULFILLMENT_ENABLED:'1',
    SHOPIFY_WEBHOOK_SECRET:'a'.repeat(32),SHOPIFY_SHOP_DOMAIN:'g2vj0e-10.myshopify.com',
    ACCESS_JWT_SECRET:'secret-sufficiently-long',
    DATABASE_URL:'postgres://placeholder',PHYSICAL_ADMIN_TOKEN:'b'.repeat(40),
  }).enabled,true)
})

test('Shopify webhook verifies raw bytes, domain, topic and HMAC, prevents signature bypass',()=>{
  const env={SHOPIFY_WEBHOOK_SECRET:'shopify-fixture-secret-long-and-unique',
    SHOPIFY_SHOP_DOMAIN:'g2vj0e-10.myshopify.com'}
  const raw=Buffer.from('{"id":123,"body":"unmodified"}')
  const headers={
    'x-shopify-hmac-sha256':crypto.createHmac('sha256',env.SHOPIFY_WEBHOOK_SECRET).update(raw).digest('base64'),
    'x-shopify-webhook-id':'11a234cd-a234-4eab-8abe-11bc00eabcd1',
    'x-shopify-shop-domain':env.SHOPIFY_SHOP_DOMAIN,'x-shopify-topic':'orders/paid',
  }
  assert.equal(verifyShopifyDelivery(raw,headers,env).ok,true)
  assert.equal(verifyShopifyDelivery(Buffer.from(raw+' '),headers,env).ok,false)
  assert.equal(verifyShopifyDelivery(raw,{...headers,'x-shopify-shop-domain':'evil.myshopify.com'},env).ok,false)
  assert.equal(verifyShopifyDelivery(raw,{...headers,'x-shopify-topic':'products/update'},env).ok,false)
  assert.equal(verifyShopifyDelivery(raw,{...headers,'x-shopify-hmac-sha256':''},env).ok,false)
  assert.equal(verifyShopifyDelivery(raw,{...headers,'x-shopify-webhook-id':''},env).ok,false)
})

test('physical wallet JWT is separate from paid TCA token, and admin key is constant-time gated',()=>{
  const secret='fixture-only-access-jwt-signature-secret'
  const session=issuePhysicalSession(artist,secret)
  assert.equal(physicalActor({authorization:'Bearer '+session.token},secret),artist)
  assert.equal(verifyJwt(session.token,secret).purpose,'physical_art')
  const tca=signJwt({sub:artist,access_level:'FULL',exp:Math.floor(Date.now()/1000)+900},secret)
  assert.equal(physicalActor({authorization:'Bearer '+tca},secret),null)
  assert.equal(physicalActor({authorization:'Bearer '+session.token+'a'},secret),null)
  const env={PHYSICAL_ADMIN_TOKEN:'random-super-secret-operator-token-123456789'}
  assert.equal(merchantAuthorized({authorization:'Admin '+env.PHYSICAL_ADMIN_TOKEN},env),true)
  assert.equal(merchantAuthorized({authorization:'Bearer '+env.PHYSICAL_ADMIN_TOKEN},env),false)
  assert.equal(merchantAuthorized({authorization:'Admin wrong'},env),false)
})

test('artist registry binds deterministic immutable SKU, marks claimed NFT unverified',()=>{
  const work=makeWork()
  assert.match(work.id,/^xa_phy_[a-f0-9]{18}$/)
  assert.match(work.sku,/^XAPHY-[A-F0-9]{14}$/)
  assert.equal(work.status,'REGISTERED')
  assert.equal(work.nftLinkVerified,false)
  assert.equal(work.events[0].type,'CREATED')
  assert.equal(work.events[0].prev,'GENESIS')
  assert.equal(work.events[0].hash.length,64)
  assert.throws(()=>createPhysicalRecord({
    title:'Artwork',artist:'Some Artist',medium:'oil',photoSha256:'not-a-digest',
  },artist),/photo_sha256_required/)
  assert.throws(()=>createPhysicalRecord({
    title:'Artwork',artist:'Some Artist',medium:'oil',photoSha256:evidence,
    nftIdentifier:'FAKE-abcdef',
  },artist),/invalid_nft_identifier/)
})

test('an unpaid, refunded, multi-item, wrong SKU, or cancelled order cannot start shipping',()=>{
  const work=makeWork()
  assert.equal(applyPaidOrder(work,{...paid(work.sku),financial_status:'pending'}).applied,false)
  assert.equal(applyPaidOrder(work,{...paid(work.sku),refunds:[{id:1}]}).applied,false)
  assert.equal(applyPaidOrder(work,{...paid(work.sku),cancelled_at:'2026-11-01'}).applied,false)
  assert.equal(applyPaidOrder(work,{...paid(work.sku),line_items:[{sku:work.sku,quantity:2}]}).applied,false)
  assert.equal(applyPaidOrder(work,paid('NOT_MATCHING')).applied,false)
  assert.equal(work.status,'REGISTERED')
  assert.equal(applyPaidOrder(work,paid(work.sku)).applied,true)
  assert.equal(work.status,'ORDER_PAID')
  assert.throws(()=>applyPaidOrder(work,paid(work.sku,'98765432')),/artwork_already_bound/)
})

test('carrier label or fulfillment success is not delivered, and delivery is not buyer receipt',()=>{
  const work=makeWork()
  assert.equal(applyFulfillment(work,ship(work.sku,'delivered')).applied,false)
  applyPaidOrder(work,paid(work.sku))
  assert.equal(applyFulfillment(work,ship(work.sku,'confirmed')).applied,false)
  assert.equal(work.status,'ORDER_PAID')
  assert.equal(applyFulfillment(work,ship(work.sku,'in_transit')).applied,true)
  assert.equal(work.status,'SHIPPED')
  assert.equal(applyFulfillment(work,ship(work.sku,'delivered')).applied,true)
  assert.equal(work.status,'CARRIER_DELIVERED')
  assert.equal(work.receipt,null)
  assert.equal(publicWorkView(work).shipment.trackingNumber,'safe-tracking-value')
})

test('merchant binds buyer only after paid order; buyer receipt is explicitly signed and evidenced',()=>{
  const work=makeWork()
  assert.throws(()=>bindBuyer(work,buyer),/order_not_paid/)
  applyPaidOrder(work,paid(work.sku))
  bindBuyer(work,buyer)
  assert.throws(()=>bindBuyer(work,buyer2),/buyer_binding_is_immutable/)
  assert.throws(()=>confirmPhysicalReceipt(work,buyer2,{decision:'accepted',evidenceSha256:evidence}),/buyer_not_authorized/)
  assert.throws(()=>confirmPhysicalReceipt(work,buyer,{decision:'accepted',evidenceSha256:evidence}),/carrier_delivery_not_confirmed/)
  applyFulfillment(work,ship(work.sku,'delivered'))
  assert.equal(confirmPhysicalReceipt(work,buyer,{decision:'accepted',evidenceSha256:evidence}).applied,true)
  assert.equal(work.status,'BUYER_ACCEPTED')
  assert.throws(()=>confirmPhysicalReceipt(work,buyer,{decision:'accepted',evidenceSha256:evidence}),/receipt_already_recorded/)
})

test('loss and damage raise dispute, not automatic refund or NFT title transfer',()=>{
  const work=makeWork()
  applyPaidOrder(work,paid(work.sku))
  bindBuyer(work,buyer)
  applyFulfillment(work,ship(work.sku,'in_transit'))
  assert.equal(confirmPhysicalReceipt(work,buyer,{decision:'damaged',evidenceSha256:evidence}).applied,true)
  assert.equal(work.status,'DISPUTED')
  assert.equal(work.events.at(-1).type,'DISPUTE_OPENED')
  assert.equal(work.escrowReleased,undefined)
  assert.equal(work.nftTransferred,undefined)
})

test('condition re-assessment is bounded risk triage; human verification required',()=>{
  const work=makeWork()
  assert.throws(()=>requestPhysicalReassessment(work,buyer,{reason:'damaged',evidenceSha256:evidence}),/reassessment_access_denied/)
  const result=requestPhysicalReassessment(work,artist,{reason:'provenance_question',evidenceSha256:evidence})
  assert.equal(result.applied,true)
  assert.equal(result.advisory.risk,'manual')
  assert.equal(work.assessment.reviewStatus,'pending_human')
  assert.equal(work.assessment.approvedValue,null)
  assert.equal(assessConditionRisk('missing','SHIPPED').risk,'critical')
  assert.throws(()=>requestPhysicalReassessment(work,artist,{reason:'damaged',evidenceSha256:evidence}),/existing_review_pending/)
  assert.equal(JSON.stringify(publicWorkView(work)).includes('"email"'),false)
})

test('HTTP path is fail-closed before a database/shop webhook is configured',async()=>{
  const server=await startServer({
    PHYSICAL_FULFILLMENT_ENABLED:'0',
    SHOPIFY_WEBHOOK_SECRET:'',SHOPIFY_SHOP_DOMAIN:'',
  })
  try{
    const cfg=await (await fetch(server.base+'/v1/physical/config')).json()
    assert.equal(cfg.enabled,false)
    assert.equal(cfg.automatic_escrow_release,false)
    assert.equal((await post(server.base+'/v1/physical/challenge',{address:artist})).status,503)
    assert.equal((await post(server.base+'/v1/physical/works',{title:'test'})).status,503)
    assert.equal((await post(server.base+'/v1/physical/session',{address:artist})).status,503)
  }finally{await server.close()}
})
