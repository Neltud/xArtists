import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {interpretReleaseEvidence,fetchPublicReleaseEvidence} from '../src/lib/releaseEvidence.mjs'
const sha='a'.repeat(40),other='b'.repeat(40)
const base={
  site:{source_sha:sha},
  api:{source_sha:sha,ok:true,service:'access-api'},
  health:{ok:true,service:'access-api',walletless_account_session_enabled:false,
    paybox_checkout_enabled:false,mint_live_enabled:false,lia_live_trading:'0'},
  catalog:{ok:true,schema:'xartists_public_commercial_catalog/v1',
    walletless_account_session_enabled:false,billing_checkout_enabled:false,
    mint_enabled:false},
  studio:{ok:false,table_ready:false},
  xorus:{ok:true,report:{schema:'xorus_analysis/v2'}},
}
const row=(result,key)=>result.rows.find(x=>x.key===key)
test('observed API and matching SHA never become commercial go-live',()=>{
  const r=interpretReleaseEvidence(base)
  assert.equal(r.matchingBuilds,true)
  assert.equal(row(r,'site').state,'observed')
  assert.equal(row(r,'xorus').state,'observed')
  for(const key of ['mail','xportal','market','fiat','chains','factory','gallery','physical','art_id','trailer']){
    assert.equal(row(r,key).state,'blocked')
  }
  assert.equal(row(r,'accounts').state,'blocked')
  assert.equal(row(r,'studio').state,'blocked')
  assert.equal(r.unsafeFlagReported,false)
})
test('configured account and PG Studio probe count only as partial',()=>{
  const r=interpretReleaseEvidence({
    ...base,health:{...base.health,walletless_account_session_enabled:true},
    catalog:{...base.catalog,walletless_account_session_enabled:true},
    studio:{ok:true,table_ready:true},
  })
  assert.equal(row(r,'accounts').state,'partial')
  assert.equal(row(r,'studio').state,'partial')
  assert.equal(row(r,'fiat').state,'blocked')
})
test('mismatched stamps and suspicious financial flags are never accepted as live proof',()=>{
  const r=interpretReleaseEvidence({
    ...base,site:{source_sha:other},health:{...base.health,mint_live_enabled:true},
  })
  assert.equal(r.matchingBuilds,false)
  assert.equal(r.unsafeFlagReported,true)
  assert.equal(row(r,'deployment').state,'unknown')
  assert.equal(row(r,'fiat').state,'blocked')
})
test('execution flags in boolean, numeric or environment form raise a safety alert',()=>{
  const scenarios=[
    {health:{lia_live_trading:1}},
    {health:{lia_live_trading:true}},
    {health:{lia_live_trading:'true'}},
    {health:{paybox_checkout_enabled:1}},
    {health:{mint_live_enabled:'1'}},
    {health:{mint_dry_run:false}},
    {health:{auction_enabled:true}},
    {catalog:{billing_checkout_enabled:1}},
    {catalog:{contract_purchase_enabled:true}},
    {catalog:{mint_enabled:'true'}},
    {catalog:{sale_open:'1'}},
  ]
  for(const scenario of scenarios){
    const r=interpretReleaseEvidence({
      ...base,
      health:{...base.health,...scenario.health},
      catalog:{...base.catalog,...scenario.catalog},
    })
    assert.equal(r.unsafeFlagReported,true,JSON.stringify(scenario))
    assert.equal(row(r,'fiat').state,'blocked')
    assert.equal(row(r,'market').state,'blocked')
  }
  const nonLive=interpretReleaseEvidence({
    ...base,health:{...base.health,lia_live_trading:0,mint_dry_run:true},
    catalog:{...base.catalog,sale_open:false},
  })
  assert.equal(nonLive.unsafeFlagReported,false)
  // A broken health endpoint or an invalid catalog schema must not hide
  // an explicit sale/checkout announcement; this is an alert only.
  const missingHealth=interpretReleaseEvidence({
    ...base,health:null,catalog:{sale_open:true},
  })
  assert.equal(missingHealth.unsafeFlagReported,true)
  const malformedCatalog=interpretReleaseEvidence({
    ...base,catalog:{schema:'unrecognized',mint_enabled:'1'},
  })
  assert.equal(malformedCatalog.unsafeFlagReported,true)
})
test('creator, gallery, physical art, forensics and trailer gates never claim live delivery',()=>{
  const r=interpretReleaseEvidence({
    ...base,
    studio:{ok:true,table_ready:true},
    health:{...base.health,walletless_account_session_enabled:true},
    catalog:{...base.catalog,walletless_account_session_enabled:true},
  })
  for(const key of ['factory','gallery','physical','art_id','trailer']){
    assert.equal(row(r,key).state,'blocked',key)
    assert.ok(row(r,key).detail.length>35,key)
  }
  assert.equal(row(r,'studio').state,'partial')
  assert.equal(row(r,'mail').state,'blocked')
})
test('network failures, invalid payloads and missing data remain unknown or blocked',()=>{
  const r=interpretReleaseEvidence({site:{source_sha:'not-sha'},health:{ok:true},catalog:{sale_open:true}})
  assert.equal(row(r,'site').state,'unknown')
  assert.equal(row(r,'backend').state,'unknown')
  assert.equal(row(r,'accounts').state,'blocked')
  assert.equal(row(r,'xorus').state,'unknown')
})
test('fetch uses only public fixed GET requests and refuses foreign API origins',async()=>{
  const calls=[]
  const urls=[
    'https://xartists.art/build-info.json',
    'https://xartists-access-api.onrender.com/v1/ops/build-info',
    'https://xartists-access-api.onrender.com/health',
    'https://xartists-access-api.onrender.com/v1/commercial/catalog',
    'https://xartists-access-api.onrender.com/v1/ops/studio-store/status',
    'https://xartists-access-api.onrender.com/v1/xorus/analysis',
  ]
  const fetchImpl=async(url,init)=>{
    calls.push({url,init})
    const i=urls.indexOf(url)
    assert.ok(i>=0,'unexpected endpoint '+url)
    assert.equal(init.method,'GET')
    assert.equal(init.credentials,'omit')
    assert.equal(init.cache,'no-store')
    return {ok:true,json:async()=>[base.site,base.api,base.health,base.catalog,base.studio,base.xorus][i]}
  }
  const result=await fetchPublicReleaseEvidence({
    siteBase:'https://xartists.art/',apiBase:'https://xartists-access-api.onrender.com/',
    fetchImpl,
  })
  assert.equal(calls.length,6)
  assert.deepEqual(calls.map(x=>x.url),urls)
  assert.equal(result.matchingBuilds,true)
  assert.match(result.observedAt,/^\d{4}-\d{2}-\d{2}T/)
  await assert.rejects(fetchPublicReleaseEvidence({
    siteBase:'https://xartists.art/',apiBase:'https://evil.example/',fetchImpl,
  }),/invalid_release_probe_origin/)
})
test('503 or malformed xOrus never relabels as real analysis',async()=>{
  const result=await fetchPublicReleaseEvidence({
    siteBase:'https://xartists.art/',apiBase:'https://xartists-access-api.onrender.com/',
    fetchImpl:async(url)=>url.endsWith('/v1/xorus/analysis')?{ok:false,status:503}:
      {ok:true,json:async()=>({})},
  })
  assert.equal(row(result,'xorus').state,'unknown')
  assert.equal(row(result,'studio').state,'blocked')
  assert.equal(row(result,'xportal').state,'blocked')
})
test('status page embeds evidence without public financial switch',()=>{
  const code=readFileSync(new URL('../src/pages/GoLivePage.tsx',import.meta.url),'utf8')
  const panel=readFileSync(new URL('../src/components/PublicReleaseEvidence.tsx',import.meta.url),'utf8')
  assert.match(code,/<PublicReleaseEvidence \/>/)
  assert.match(panel,/data-testid="public-release-evidence"/)
  assert.match(panel,/fetchPublicReleaseEvidence/)
  assert.doesNotMatch(panel,/sendTransactions|signAndSend|createCheckout|mintDispatch|placeTrade/)
})
