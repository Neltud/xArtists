import test from 'node:test'
import assert from 'node:assert/strict'
import {createWalletlessAccountProfileService} from '../src/walletlessProfile.mjs'
import {startServer} from './server-fixture.mjs'

const id='550e8400-e29b-41d4-a716-446655440000'
const token='a'.repeat(90)+'.'+'b'.repeat(90)+'.'+'c'.repeat(90)
const request={authorization:'Bearer '+token,origin:'https://xartists.art'}
const make=options=>createWalletlessAccountProfileService({
  enabled:true,originAllowed:o=>o==='https://xartists.art',
  lookupVerifiedProfile:async()=>({user_id:id,account_type:'walletless',wallet_count:0}),
  ...options,
})

test('disabled /me does not verify JWT or query any account',async()=>{
  let calls=0
  const out=await make({enabled:false,lookupVerifiedProfile:async()=>{calls++;throw Error('must not query')}}).read(request)
  assert.equal(out.status,503);assert.equal(calls,0)
})

test('read-only self returns only anonymous account projection with NO paid rights',async()=>{
  let seen
  const a=make({lookupVerifiedProfile:async jwt=>{
    seen=jwt
    return {user_id:id,account_type:'walletless',wallet_count:0,
      email:'private@example.test',provider_subscription_id:'sub_sensitive',
      wallet_address:'erd1private_fake',secret:'never'}
  }})
  const res=await a.read(request)
  assert.equal(res.status,200);assert.equal(seen,token)
  assert.deepEqual(res.body,{
    ok:true,account:{id,type:'walletless',linkedWalletCount:0},
    walletOwnership:'not_reverified',
    subscriptionAccess:'not_checked',
    xorusPrivateAccess:'not_checked',
    nftEntitlement:false,checkoutAuthorized:false,mintAuthorized:false,
  })
  for(const forbidden of [token,'private@example.test','sub_sensitive','erd1private_fake','never'])
    assert.ok(!JSON.stringify(res).includes(forbidden))
  const linked=make({lookupVerifiedProfile:async()=>({user_id:id,account_type:'wallet_linked',wallet_count:1})})
  assert.equal((await linked.read(request)).body.account.linkedWalletCount,1)
})

test('origin, JWT and malformed account ID/profile always fail closed',async()=>{
  let calls=0
  const service=make({lookupVerifiedProfile:async()=>{calls++;throw Error('unexpected query')}})
  for(const input of [
    {...request,origin:'https://xartists.art.evil.test'},
    {...request,origin:'null'},
    {...request,authorization:'Bearer invalid'},
    {...request,authorization:'Bearer '+token+' text'},
    {...request,authorization:''},
  ])assert.notEqual((await service.read(input)).status,200)
  assert.equal(calls,0)
  const invalidProfiles=[
    undefined,{user_id:'private@example.test',account_type:'walletless',wallet_count:0},
    {user_id:id,account_type:'walletless',wallet_count:1},
    {user_id:id,account_type:'wallet_linked',wallet_count:0},
    {user_id:id,account_type:'walletless',wallet_count:NaN},
    {user_id:id,account_type:'walletless',wallet_count:-1},
  ]
  for(const profile of invalidProfiles){
    assert.equal((await make({lookupVerifiedProfile:async()=>profile}).read(request)).status,503)
  }
  assert.equal((await make({lookupVerifiedProfile:async()=>null}).read(request)).status,404)
})

test('identity verification, blocked account, DB down surface generic code not details',async()=>{
  for(const [error,status] of [
    ['neon_auth_identity_unverified',401],
    ['identity_account_disabled',403],
    ['postgres://host:password@example.test',503],
  ]){
    const res=await make({lookupVerifiedProfile:async()=>{throw Error(error)}}).read(request)
    assert.equal(res.status,status)
    assert.ok(!JSON.stringify(res).includes(error))
  }
})

test('public HTTP /v1/account/me is read-only and safely OFF in production defaults',async()=>{
  const server=await startServer({
    WALLETLESS_ACCOUNT_SESSION_ENABLED:'0',WALLETLESS_DATABASE_TARGET_CONFIRMED:'0',
    NEON_AUTH_BASE_URL:'',DATABASE_URL:'',
  })
  try{
    const url=server.base+'/v1/account/me'
    const result=await fetch(url,{headers:{Origin:'https://xartists.art',Authorization:'Bearer '+token}})
    assert.equal(result.status,503)
    assert.equal(result.headers.get('cache-control'),'no-store')
    assert.deepEqual(await result.json(),{ok:false,error:'account_profile_not_enabled'})
    assert.equal((await fetch(url+'?email=a@b.test')).status,400)
    assert.equal((await fetch(url,{method:'POST'})).status,405)
    assert.equal((await fetch(url,{method:'PUT'})).status,405)
  }finally{await server.close()}
})
