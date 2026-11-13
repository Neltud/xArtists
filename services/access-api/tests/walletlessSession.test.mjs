import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createWalletlessSessionService} from '../src/walletlessSession.mjs'
import {startServer,post} from './server-fixture.mjs'

const id='550e8400-e29b-41d4-a716-446655440000'
const validToken='a'.repeat(90)+'.'+'b'.repeat(90)+'.'+'c'.repeat(90)
const authorized=()=>({
  authorization:'Bearer '+validToken,origin:'https://xartists.art',contentLength:'0',
})
const service=(opts={})=>createWalletlessSessionService({
  enabled:true,originAllowed:o=>o==='https://xartists.art',
  resolveVerifiedAccount:async()=>({user_id:id,created:false}),...opts,
})

test('disabled walletless service never validates tokens or touches the DB',async()=>{
  let called=0
  const instance=service({enabled:false,resolveVerifiedAccount:async()=>{called++;throw Error('never')}})
  const result=await instance.exchange(authorized())
  assert.equal(result.status,503)
  assert.equal(called,0)
})

test('verified opaque account mapping returns no email, JWT, wallet claim or paid rights',async()=>{
  let captured
  const instance=service({resolveVerifiedAccount:async token=>{
    captured=token;return {user_id:id,created:true,email:'private@example.test'}
  }})
  const result=await instance.exchange(authorized())
  assert.equal(captured,validToken)
  assert.equal(result.status,200)
  assert.deepEqual(result.body,{
    ok:true,account:{id,type:'email_verified',created:true},
    walletLink:'not_checked',subscriptionAccess:'not_checked',
    nftEntitlement:false,checkoutAuthorized:false,
  })
  assert.ok(!JSON.stringify(result).includes('private@example.test'))
  assert.ok(!JSON.stringify(result).includes(validToken))
})

test('origin spoofing, no token and body never invoke auth or account writes',async()=>{
  let called=0
  const instance=service({resolveVerifiedAccount:async()=>{called++;throw Error('never')}})
  for(const args of [
    {...authorized(),origin:'https://xartists.art.evil.example'},
    {...authorized(),origin:'http://xartists.art'},
    {...authorized(),origin:'null'},
    {...authorized(),authorization:''},
    {...authorized(),authorization:'Bearer short'},
    {...authorized(),authorization:'Bearer '+validToken+' extra'},
    {...authorized(),contentLength:'2'},
    {...authorized(),transferEncoding:'chunked'},
  ]){
    assert.notEqual((await instance.exchange(args)).status,200)
  }
  assert.equal(called,0)
})

test('unverified Neon claims, disabled accounts, DB errors and invalid UUIDs fail closed',async()=>{
  for(const [error,status] of [
    ['neon_auth_identity_unverified',401],['identity_account_disabled',403],
    ['private-database-host-and-credentials',503],
  ]){
    assert.equal((await service({resolveVerifiedAccount:async()=>{throw Error(error)}})
      .exchange(authorized())).status,status)
  }
  for(const user_id of [null,'usr_example','test@example.com','550e8400-e29b-41d4-a716-446655440000.evil']){
    assert.equal((await service({resolveVerifiedAccount:async()=>({user_id})})
      .exchange(authorized())).status,503)
  }
})

test('HTTP route exists but is disabled by default, supports only POST with no query/body',async()=>{
  const server=await startServer({WALLETLESS_ACCOUNT_SESSION_ENABLED:'0',
    WALLETLESS_DATABASE_TARGET_CONFIRMED:'0',NEON_AUTH_BASE_URL:''})
  try{
    assert.equal((await fetch(server.base+'/v1/account/session')).status,405)
    assert.equal((await post(server.base+'/v1/account/session',{token:'fake'})).status,503)
    const response=await fetch(server.base+'/v1/account/session',{method:'POST',
      headers:{Origin:'https://xartists.art',Authorization:'Bearer '+validToken,'Content-Length':'0'}})
    assert.equal(response.status,503)
    assert.deepEqual(await response.json(),{ok:false,error:'account_session_not_enabled'})
    assert.equal((await fetch(server.base+'/v1/account/session?auth=token',
      {method:'POST'})).status,400)
    const health=await(await fetch(server.base+'/health')).json()
    assert.equal(health.walletless_account_session_enabled,false)
  }finally{await server.close()}
})
