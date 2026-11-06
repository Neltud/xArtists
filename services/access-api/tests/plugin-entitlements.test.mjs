import assert from 'node:assert/strict'
import {test} from 'node:test'
import {checkPluginEntitlement,signPluginEntitlement} from '../src/pluginEntitlements.mjs'

const secret='sandbox_secret_for_tests_only_'.padEnd(40,'z')
const base=1700000000000
const grant={v:1,kid:'sandbox-key',grantId:'grant:example-0001',product:'xa-world-rights',subject:'account:alice-0001',
  environment:'sandbox',issuerEvent:'evt_test_0001',issuedAt:base-60000,expiresAt:base+86400000}
const record={...grant,status:'active',settlementVerification:'verified_provider_event',revokedAt:null,refundedAt:null}
const keyring={'sandbox-key':secret}
const token=signPluginEntitlement(grant,secret)
const options={enabled:true,token,product:grant.product,authenticatedSubject:grant.subject,environment:'sandbox',secrets:keyring,now:base,lookupGrant:async()=>record}
const check=extra=>checkPluginEntitlement({...options,...extra})

test('feature is disabled by default, even with valid server proof',async()=>{
  assert.deepEqual(await check({enabled:false}),{allowed:false,reason:'disabled'})
})
test('signed, subject-bound and persisted settled grant may authorize a paid plugin',async()=>{
  const r=await check();assert.equal(r.allowed,true);assert.equal(r.kind,'paid');assert.equal(r.product,'xa-world-rights')
})
test('unverified wallet address never gives a free owner exception',async()=>{
  const r=await check({token:null,ownerWalletText:'erd1exampleadminaddress'})
  assert.equal(r.allowed,false)
})
test('wrong identity, product or environment never reuses the same paid proof',async()=>{
  for(const extra of [{authenticatedSubject:'account:other-0001'}, {product:'other-plugin'}, {environment:'production'}])
    assert.equal((await check(extra)).allowed,false)
})
test('tamper, missing issuer key, expired grant and future grant fail closed',async()=>{
  const other=signPluginEntitlement({...grant,expiresAt:base+86400001},secret)
  assert.equal((await check({token:other})).allowed,false)
  assert.equal((await check({secrets:{}})).allowed,false)
  assert.equal((await check({now:grant.expiresAt})).allowed,false)
  assert.equal((await check({now:grant.issuedAt-60001})).allowed,false)
})
test('refund, revoke, cancelled payment and failed settlement verification deny access',async()=>{
  for(const patch of [{refundedAt:base}, {revokedAt:base}, {status:'cancelled'}, {settlementVerification:'client_asserted'}])
    assert.equal((await check({lookupGrant:async()=>({...record,...patch})})).allowed,false)
})
test('changed event identity, missing row or a down database cannot authorize',async()=>{
  assert.equal((await check({lookupGrant:async()=>({...record,issuerEvent:'evt_replayed_0002'})})).allowed,false)
  assert.equal((await check({lookupGrant:async()=>null})).allowed,false)
  assert.equal((await check({lookupGrant:async()=>{throw Error('DB down')}})).allowed,false)
})
test('issuer rejects unsigned, extra or overly long lived grants',()=>{
  assert.throws(()=>signPluginEntitlement({...grant,extra:true},secret))
  assert.throws(()=>signPluginEntitlement({...grant,expiresAt:base+400*86400000},secret))
  assert.throws(()=>signPluginEntitlement(grant,'weak'))
})
test('invalid base64url or signature length denies authorization',async()=>{
  for(const bad of [token+'x',token.split('.')[0]+'.-',token.split('.')[0]+'.YQ','e30.YQ'])
    assert.equal((await check({token:bad})).allowed,false)
})