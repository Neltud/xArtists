import test from 'node:test'
import assert from 'node:assert/strict'
import {publicCommercialCatalog} from '../src/publicCommercialCatalog.mjs'
import {previewCommercialOffer} from '../src/commercialRails.mjs'
import {XORUS_OFFER_SCOPES} from '../src/xorusEntitlements.mjs'
import {startServer} from './server-fixture.mjs'

const sku=['fiat_379','fiat_579','fiat_979']
const cents=[379,579,979]
const ids=['pulse','yield','sentinel']

test('commercial API always separates three EUR subscriptions and analysis tracks',()=>{
  const catalog=publicCommercialCatalog()
  assert.equal(catalog.schema,'xartists_public_commercial_catalog/v1')
  assert.equal(catalog.mode,'prelaunch')
  assert.equal(catalog.sale_open,false)
  assert.equal(catalog.billing_checkout_enabled,false)
  assert.equal(catalog.mint_enabled,false)
  assert.deepEqual(catalog.monthly_services.map(x=>x.sku),sku)
  assert.deepEqual(catalog.monthly_services.map(x=>x.target_cents),cents)
  assert.deepEqual(catalog.analysis_tracks.map(x=>x.id),ids)
  assert.deepEqual(catalog.genesis_nft.map(x=>x.id),ids)
  for(const [i,plan] of catalog.monthly_services.entries()){
    assert.equal(plan.scope_mapping_approved,false)
    assert.equal(plan.checkout_enabled,false)
    assert.equal(plan.requires_wallet,false)
    assert.equal(plan.includes_nft,false)
    assert.equal(plan.target_cents,previewCommercialOffer({sku:sku[i],provider:'stripe'}).cents)
    assert.equal(plan.status,'not_available')
  }
  for(const track of catalog.analysis_tracks){
    assert.equal(track.scope,XORUS_OFFER_SCOPES[track.id])
    assert.equal(track.report_delivery_status,'not_commercially_available')
    assert.equal(track.source_commercial_rights_verified,false)
  }
  for(const [i,nft] of catalog.genesis_nft.entries()){
    assert.equal(nft.includes_nft,true)
    assert.equal(nft.requires_wallet,true)
    assert.equal(nft.checkout_enabled,false)
    assert.equal(nft.price_chain_verified,false)
    assert.equal(nft.target_egld,previewCommercialOffer({sku:ids[i],provider:'multiversx_wallet'}).egld)
  }
})

test('even positive readiness diagnostics cannot imply billing, entitlement, license or mint',()=>{
  for(const flags of [
    {walletlessAccountEnabled:true,privateAnalysisEnabled:true},
    {walletlessAccountEnabled:1,privateAnalysisEnabled:'true'},
    {walletlessAccountEnabled:false,privateAnalysisEnabled:true},
  ]){
    const catalog=publicCommercialCatalog(flags)
    assert.equal(catalog.sale_open,false)
    assert.equal(catalog.billing_checkout_enabled,false)
    assert.equal(catalog.contract_purchase_enabled,false)
    assert.equal(catalog.mint_enabled,false)
    assert.equal(catalog.monthly_services.every(x=>x.checkout_enabled===false&&x.scope_mapping_approved===false),true)
    assert.equal(catalog.analysis_tracks.every(x=>x.source_commercial_rights_verified===false),true)
  }
})

test('public GET catalog is no-store, queryless and cannot be used for payment actions',async()=>{
  const server=await startServer({STRIPE_SECRET_KEY:'',WALLETLESS_ACCOUNT_SESSION_ENABLED:'0',
    XORUS_PRIVATE_READ_ENABLED:'0',PAYBOX_CHECKOUT_ENABLED:'0',MINT_LIVE_ENABLED:'0'})
  try{
    const url=server.base+'/v1/commercial/catalog'
    const res=await fetch(url,{headers:{Origin:'https://xartists.art'}})
    assert.equal(res.status,200)
    assert.match(res.headers.get('content-type')||'',/application\/json/)
    assert.equal(res.headers.get('cache-control'),'no-store')
    assert.equal(res.headers.get('access-control-allow-origin'),'https://xartists.art')
    const body=await res.json()
    assert.equal(body.sale_open,false)
    assert.equal(body.walletless_account_session_enabled,false)
    assert.equal(body.xorus_private_analysis_enabled,false)
    assert.equal(body.monthly_services.length,3)
    assert.equal((await fetch(url+'?sku=fiat_379')).status,400)
    for(const method of ['POST','PUT','DELETE']){
      const reply=await fetch(url,{method})
      assert.equal(reply.status,405)
    }
  }finally{await server.close()}
})

test('global payment roadmap cannot enable funds, accounts or cards, even when other services are ready',()=>{
  const flags={walletlessAccountEnabled:true,privateAnalysisEnabled:true,
    checkout_enabled:true,transfer_enabled:true,card_issuance_enabled:true}
  const roadmap=publicCommercialCatalog(flags).global_pay
  assert.equal(roadmap.mode,'planning_only')
  assert.equal(roadmap.custody_by_xartists,false)
  assert.deepEqual(roadmap.supported_display_currencies_target,['EUR','USD','GBP'])
  assert.deepEqual(roadmap.rails.map(r=>r.id),['service_checkout','artist_payout','crypto_onramp','payment_account','debit_card'])
  for(const r of roadmap.rails){
    assert.equal(r.status,'not_released')
    assert.equal(r.checkout_enabled,false)
    assert.equal(r.transfer_enabled,false)
    assert.equal(r.stored_balance_enabled,false)
    assert.equal(r.card_issuance_enabled,false)
    assert.ok(r.required_evidence.length>=3)
  }
  assert.equal(roadmap.rails[2].purpose,'external_wallet_delivery')
  assert.deepEqual(roadmap.rails[3].candidates,[])
  assert.deepEqual(roadmap.rails[4].candidates,[])
  roadmap.rails[4].card_issuance_enabled=true
  assert.equal(publicCommercialCatalog().global_pay.rails[4].card_issuance_enabled,false)
})
