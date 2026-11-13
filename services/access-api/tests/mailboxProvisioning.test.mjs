import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mailboxAddress,createMailboxProvisioningService} from '../src/mailboxProvisioning.mjs'
const USER='550e8400-e29b-41d4-a716-446655440000'
const ID='550e8400-e29b-41d4-a716-446655440001'
const token='verified-jwt-marker-sufficient-length'
function deps() {
  const calls=[]
  const store={
    async reserve(args){calls.push(['reserve',args]);return {state:'reserved',id:ID}},
    async markProvisioned(args){calls.push(['provisioned',args])},
    async markNeedsReconciliation(args){calls.push(['reconcile',args])},
  }
  const provider={accountLoginVerified:true,async createMailbox(args){calls.push(['create',args]);return {providerId:'mail-v1'}}}
  const opts={enabled:true,verifySession:async()=>USER,store,provider,originAllowed:origin=>origin==='https://xartists.art'}
  return {calls,opts,store,provider}
}
test('address policy: canonical valid and protected identities',()=>{
  assert.equal(mailboxAddress('  Alice.Art '),'alice.art@xartists.art')
  for(const s of ['','a','jo@evil.test','hello','postmaster','ADMIN','no-reply','a..b','a+b','a/b','x '.repeat(20),'xn--fake','bob@xartists.art','a'.repeat(33)])
    assert.throws(()=>mailboxAddress(s),/invalid_mailbox_name/)
})
test('default disabled refuses without provider/network call',async()=>{
  const s=createMailboxProvisioningService()
  assert.deepEqual(s.readiness(),{enabled:false,mailbox_delivery_verified:false})
  assert.deepEqual(await s.request({bearerToken:token,localPart:'alice'}),{ok:false,error:'mailbox_service_unavailable'})
})
test('verified server-side UUID, fixed origin and provider acknowledgment only',async()=>{
  const {calls,opts}=deps()
  const s=createMailboxProvisioningService(opts)
  const result=await s.request({bearerToken:token,localPart:'ALICE',origin:'https://xartists.art'})
  assert.deepEqual(result,{ok:true,status:'provisioned',address:'alice@xartists.art',receiptVerified:false,outboundVerified:false,inboxAccessVerified:false})
  assert.equal(calls.length,3)
  assert.equal(calls[1][1].address,'alice@xartists.art')
  assert.equal(calls[1][1].accountId,USER)
  assert.equal(JSON.stringify(result).includes('mail-v1'),false)
})
test('unknown origin, unverified account or forbidden name cause zero mutations',async()=>{
  const {calls,opts}=deps();const s=createMailboxProvisioningService(opts)
  assert.equal((await s.request({bearerToken:token,localPart:'alice',origin:'https://evil.com'})).error,'origin_not_allowed')
  assert.equal((await s.request({bearerToken:token,localPart:'admin',origin:'https://xartists.art'})).error,'invalid_mailbox_name')
  const bad=createMailboxProvisioningService({...opts,verifySession:async()=>null})
  assert.equal((await bad.request({bearerToken:token,localPart:'alice',origin:'https://xartists.art'})).error,'session_not_verified')
  assert.deepEqual(calls,[])
})
test('name collision and existing account never call mail provider',async()=>{
  for (const state of ['taken','exists']) {
    const {calls,opts,store}=deps()
    store.reserve=async()=>({state})
    const s=createMailboxProvisioningService(opts)
    const r=await s.request({bearerToken:token,localPart:'alice',origin:'https://xartists.art'})
    assert.equal(r.ok,false);assert.deepEqual(calls,[])
  }
})
test('provider failure leaves reconciliation, never retries automatically',async()=>{
  const {calls,opts,provider}=deps()
  provider.createMailbox=async()=>{throw new Error('secret: upstream 500')}
  const result=await createMailboxProvisioningService(opts).request({bearerToken:token,localPart:'alice',origin:'https://xartists.art'})
  assert.deepEqual(result,{ok:false,error:'mailbox_requires_reconciliation'})
  assert.deepEqual(calls.map(c=>c[0]),['reserve','reconcile'])
})
test('rejects adapter without proven account login integration',async()=>{
  const {opts,provider}=deps()
  provider.accountLoginVerified=false
  const s=createMailboxProvisioningService(opts)
  assert.equal(s.readiness().enabled,false)
})
