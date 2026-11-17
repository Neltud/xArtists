import {test} from 'node:test'
import assert from 'node:assert/strict'
import {generateKeyPairSync,sign} from 'node:crypto'
import {createAccountPilot} from '../../../deploy/neon/account-pilot/index.mjs'
import {createNeonAuthIdentityVerifier} from '../../../deploy/neon/account-pilot/neon-verifier.mjs'
const AUTH='https://example.neonauth.c-8.eu-central-1.aws.neon.tech/xartists_access/auth'
const {publicKey,privateKey}=generateKeyPairSync('ed25519')
const jwk=publicKey.export({format:'jwk'})
const clock=()=>1763391600000 // 2025? deterministic fixed time irrelevant
const now=Math.floor(clock()/1000)
const claims={iss:new URL(AUTH).origin,aud:new URL(AUTH).origin,sub:'user-test-0001',
  email:'artist@example.org',emailVerified:true,banned:false,iat:now-10,exp:now+600}
const encode=o=>Buffer.from(JSON.stringify(o)).toString('base64url')
const jwt=payload=>{
  const signed=encode({alg:'EdDSA',typ:'JWT',kid:'test-key-1'})+'.'+encode(payload)
  return signed+'.'+sign(null,Buffer.from(signed),privateKey).toString('base64url')
}
const verifier=createNeonAuthIdentityVerifier({baseUrl:AUTH,clock,fetchImpl:async url=>{
  assert.equal(url,AUTH+'/.well-known/jwks.json')
  return {ok:true,text:async()=>JSON.stringify({keys:[{...jwk,kid:'test-key-1',alg:'EdDSA',use:'sig'}]})}
}})
const app=createAccountPilot({env:{XARTISTS_SOURCE_SHA:'a'.repeat(40)},verifier})
const call=(p,o)=>app.fetch(new Request('https://staging.neon.invalid'+p,o))

test('real Ed25519 Neon signature gives verified identity without inventing wallets or entitlements',async()=>{
  const res=await call('/v1/account/me',{headers:{authorization:'Bearer '+jwt(claims),origin:'https://xartists.art'}})
  assert.equal(res.status,200)
  const body=await res.json()
  assert.match(body.account.id,/^na_[a-f0-9]{32}$/)
  assert.equal(body.account.type,'email_verified')
  assert.equal(body.account.email_verified,true)
  assert.equal(body.account.persisted_in_xartists_account_db,false)
  assert.equal(body.account.walletLink,'not_checked')
  assert.equal(body.checkoutAuthorized,false)
  assert.equal(body.mintAuthorized,false)
  assert.equal(body.nftEntitlement,false)
  assert.doesNotMatch(JSON.stringify(body),/artist@example.org|user-test-0001/)
  assert.equal(res.headers.get('access-control-allow-origin'),'https://xartists.art')
})
test('unsigned / expired / unverified email is never accepted',async()=>{
  const good=jwt(claims)
  const altered=good.slice(0,-2)+'XX'
  for(const value of [altered,jwt({...claims,exp:now-1}),jwt({...claims,emailVerified:false}),
    jwt({...claims,aud:'https://other.example'}),jwt({...claims,banned:true})]){
    const r=await call('/v1/account/me',{headers:{authorization:'Bearer '+value}})
    assert.equal(r.status,401)
  }
  assert.equal((await call('/v1/account/me')).status,401)
  assert.equal((await call('/v1/account/me',{headers:{authorization:'Bearer garbage'}})).status,401)
})
test('all writes remain rejected and the private bucket is not claimed operational',async()=>{
  for(const method of ['POST','PUT','PATCH','DELETE']){
    const r=await call('/v1/studio/drafts/config',{method})
    assert.equal(r.status,405)
  }
  const cfg=await call('/v1/studio/drafts/config')
  assert.equal(cfg.status,200)
  const data=await cfg.json()
  assert.equal(data.bucket_access,'private')
  assert.equal(data.upload_enabled,false)
  assert.equal(data.upload_authorized,false)
  assert.equal(data.mint_authorized,false)
  assert.equal((await call('/v1/studio/media/upload')).status,404)
})
test('unknown origin rejected; OPTIONS accepts only exact public origins',async()=>{
  assert.equal((await call('/health',{headers:{Origin:'https://evil.example'}})).status,403)
  const ok=await call('/v1/account/me',{method:'OPTIONS',headers:{Origin:'https://www.xartists.art'}})
  assert.equal(ok.status,204)
  assert.equal(ok.headers.get('access-control-allow-origin'),'https://www.xartists.art')
})
test('misconfigured Auth never falls back to anonymous user',async()=>{
  const x=createAccountPilot({env:{NEON_AUTH_BASE_URL:'http://evil.com',XARTISTS_SOURCE_SHA:'bad'}})
  const h=await x.fetch(new Request('https://pilot.example/health'))
  assert.equal((await h.json()).identity_verifier_configured,false)
  assert.equal((await x.fetch(new Request('https://pilot.example/v1/account/me',{headers:{authorization:'Bearer '+jwt(claims)}}))).status,503)
})
