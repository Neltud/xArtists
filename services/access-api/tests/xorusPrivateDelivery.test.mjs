import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {createXorusPrivateDelivery,validateXorusPrivateReport} from '../src/xorusPrivateDelivery.mjs'
import {startServer} from './server-fixture.mjs'

const now=Date.parse('2026-11-13T12:00:00Z')
const iso=n=>new Date(n).toISOString()
const payload=Object.freeze({
  schema:'xorus_private_analysis/v1',offer:'pulse',scope:'analysis:markets',
  title:'Marché EGLD — interprétation',summary:'Contexte incomplet ; prudence avant toute décision.',
  stance:'ABSTAIN',source_ts:iso(now-60000),generated_at:iso(now-15000),
  findings:[{family:'risk',reading:'insufficient_evidence',
    interpretation:'Une seule venue ne permet pas une validation indépendante.'}],
  risks:['Qualité et fraîcheur des sources à confirmer'],
  scenarios:[{condition:'Deuxième source licenciée disponible',
    interpretation:'Réévaluer la couverture et les divergences.'}],
  limitations:['Aucune exécution autonome','Aucun signal de rendement garanti'],
  raw_data_included:false,executable:false,
})
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?
  Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v
const hash=v=>createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex')
const reportId=hash(payload)
const meta={reportId,offer:'pulse',scope:'analysis:markets',
  kind:'derived_xartists_analysis',visibility:'private',status:'ready',
  rawDataIncluded:false,commercialUsageApproved:true,
  sourceTs:now-60000,generatedAt:now-15000,expiresAt:now+60000}
const email='550e8400-e29b-41d4-a716-446655440000'
const token='a'.repeat(80)+'.'+'b'.repeat(80)+'.'+'c'.repeat(80)
const request={offer:'pulse',reportId,authorization:'Bearer '+token,origin:'https://xartists.art'}
const fakeGrant=()=>({
  grantId:'xag_testprivateentitlement1234',subject:email,subjectKind:'email',
  offer:'pulse',scope:'analysis:markets',status:'active',issuedAt:now-60000,
  expiresAt:now+60000,ledgerCheckedAt:now-100,revokedAt:null,refundedAt:null,
  quotaRemaining:2,quotaResetAt:now+60000,
  evidence:{kind:'verified_psp_subscription',verified:true,checkedAt:now-100,
    eventId:'evt_synthetic1234567',settlement:'verified',billingStatus:'active'},
})
const service=(overrides={})=>{
  let reserves=0
  const repo={
    lookupReport:async()=>meta,lookupContent:async()=>payload,
    lookupGrant:async()=>fakeGrant(),reserveQuota:async({grantId})=>{
      reserves++;return {reserved:true,grantId,remaining:1}
    },
  }
  return {impl:createXorusPrivateDelivery({
    enabled:true,commercialUsageRightsVerified:true,
    clock:()=>now,originAllowed:o=>o==='https://xartists.art',
    verifyAccount:async()=>({kind:'email',subject:email,verified:true,proof:'verified_email_session'}),
    repo,...overrides,
  }),repo,reserves:()=>reserves}
}

test('only licensed derived payload with exact keys, timestamps and SHA256 is accepted',()=>{
  assert.deepEqual(validateXorusPrivateReport(payload,meta,now),payload)
  for(const [body,record] of [
    [{...payload,raw_data_included:true},meta],
    [{...payload,provider_payload:{prices:[3,4]}},meta],
    [{...payload,stance:'BUY'},meta],
    [{...payload,summary:'https://private-data.example'},meta],
    [{...payload,findings:[{...payload.findings[0],value:123}]},meta],
    [{...payload,executable:true},meta],
    [{...payload,source_ts:iso(now+1)},meta],
    [payload,{...meta,commercialUsageApproved:false}],
    [payload,{...meta,reportId:'a'.repeat(64)}],
    [payload,{...meta,expiresAt:now-1}],
  ]) assert.equal(validateXorusPrivateReport(body,record,now),null)
})

test('verified account + current grant + content digest yields bounded customer report',async()=>{
  const a=service()
  const out=await a.impl.read(request)
  assert.equal(out.status,200)
  assert.equal(out.body.reportId,reportId)
  assert.equal(out.body.report.summary,payload.summary)
  assert.equal(out.body.remainingQuota,1)
  assert.equal(a.reserves(),1)
  assert.equal(out.body.rawData,undefined)
  assert.equal(JSON.stringify(out).includes('evt_synthetic'),false)
})

test('unverified identity, wrong origin, forged report or disabled feature cannot reserve quota',async()=>{
  const a=service()
  for(const bad of [
    {...request,origin:'https://xartists.art.evil.example'},
    {...request,authorization:'Bearer invalid'},
    {...request,offer:'yield'},
    {...request,reportId:'0'.repeat(64)},
  ]) assert.notEqual((await a.impl.read(bad)).status,200)
  assert.equal(a.reserves(),0)
  const badIdentity=service({verifyAccount:async()=>null})
  assert.equal((await badIdentity.impl.read(request)).status,401)
  const corrupt=service({repo:{...a.repo,lookupContent:async()=>({...payload,summary:'tampered'})}})
  assert.equal((await corrupt.impl.read(request)).status,404)
  assert.equal(a.reserves(),0)
  assert.equal((await service({enabled:false}).impl.read(request)).status,503)
  assert.equal((await service({commercialUsageRightsVerified:false}).impl.read(request)).status,503)
})

test('refund/revocation or provider errors fail closed; no private report returned',async()=>{
  const a=service()
  const cancelled=service({repo:{...a.repo,lookupGrant:async()=>({...fakeGrant(),refundedAt:now-1})}})
  assert.equal((await cancelled.impl.read(request)).status,403)
  assert.equal((await service({repo:{...a.repo,lookupContent:async()=>{throw Error('private DSN')}}}).impl.read(request)).status,503)
  assert.equal((await service({verifyAccount:async()=>{throw Error('bad JWT')}}).impl.read(request)).status,401)
  assert.equal((await service({repo:{...a.repo,reserveQuota:async()=>{throw Error('private DB')}}}).impl.read(request)).status,503)
})

test('production HTTP private route exists but denies by default, never uses anonymous GET',async()=>{
  const server=await startServer({XORUS_PRIVATE_READ_ENABLED:'0',
    XORUS_PRIVATE_COMMERCIAL_RIGHTS_VERIFIED:'0',XORUS_PRIVATE_DELIVERY_CERTIFIED:'0'})
  try {
    const url=server.base+'/v1/xorus/private/pulse/'+reportId
    const get=await fetch(url)
    assert.equal(get.status,503)
    assert.equal(get.headers.get('cache-control'),'no-store')
    assert.deepEqual(await get.json(),{ok:false,error:'private_analysis_unavailable'})
    assert.equal((await fetch(url+'?provider=somewhere')).status,400)
    assert.equal((await fetch(url,{method:'POST'})).status,405)
    assert.equal((await fetch(server.base+'/v1/xorus/private/pulse/test')).status,404)
    const health=await(await fetch(server.base+'/health')).json()
    assert.equal(health.xorus_private_analysis_enabled,false)
  }finally{await server.close()}
})
