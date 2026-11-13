import test from 'node:test'
import assert from 'node:assert/strict'
import {
  verifiedNeonAuthBase,verifiedXartistsApiBase,
  requestWalletlessOtp,completeWalletlessOtp,PUBLIC_ACCESS_API,
} from '../src/lib/walletlessOtp.mjs'
import {readFileSync} from 'node:fs'

const neon='https://ep-synthetic.neonauth.c-8.eu-central-1.aws.neon.tech/xartists_access/auth'
const api=PUBLIC_ACCESS_API
const email='artist@example.test',otp='123456'
const token='a'.repeat(80)+'.'+'b'.repeat(80)+'.'+'c'.repeat(80)
const uid='550e8400-e29b-41d4-a716-446655440000'
const resp=(body={},opts={})=>({
  ok:opts.ok!==false,
  json:async()=>body,
  headers:{get:name=>name==='set-auth-jwt'?opts.jwt||null:null},
})
const errorCode=async fn=>{
  try{await fn();assert.fail('expected rejection')}catch(e){
    assert.notEqual(e?.message,'expected rejection')
    return e?.message
  }
}
test('OTP destination pin rejects hostile domains, HTTP, credentials and query tokens',()=>{
  assert.equal(verifiedNeonAuthBase(neon),neon)
  assert.equal(verifiedXartistsApiBase(api),api)
  assert.equal(verifiedXartistsApiBase('https://api.xartists.art'),'https://api.xartists.art')
  for(const value of [
    'http://ep-synthetic.neonauth.c-8.eu-central-1.aws.neon.tech/xartists_access/auth',
    'https://neon.tech/xartists_access/auth',
    'https://ep-synthetic.neonauth.c-8.eu-central-1.aws.neon.tech/xartists_access/auth?redirect=evil',
    'https://ep-synthetic.neonauth.c-8.eu-central-1.aws.neon.tech.evil.test/xartists_access/auth',
    'https://user:password@ep-synthetic.neonauth.c-8.eu-central-1.aws.neon.tech/xartists_access/auth',
    'https://ep-synthetic.neonauth.c-8.eu-central-1.aws.neon.tech/other',
  ])assert.equal(verifiedNeonAuthBase(value),null,value)
  for(const value of [
    'https://xartists-access-api.onrender.com.evil.test',
    'https://xartists.art',
    'http://xartists-access-api.onrender.com',
    'https://api.xartists.art?q=1',
  ])assert.equal(verifiedXartistsApiBase(value),null,value)
})
test('request OTP only posts email to pinned Neon and never sends email to xArtists API',async()=>{
  const calls=[]
  const fetchImpl=async(url,options)=>{calls.push({url,options});return resp({})}
  assert.deepEqual(await requestWalletlessOtp({email,authBase:neon,apiBase:api,fetchImpl}),{accepted:true})
  assert.equal(calls.length,1)
  assert.equal(calls[0].url,neon+'/email-otp/send-verification-otp')
  assert.equal(calls[0].options.method,'POST')
  assert.equal(calls[0].options.credentials,'include')
  assert.deepEqual(JSON.parse(calls[0].options.body),{email,type:'sign-in'})
  assert.equal(calls[0].options.redirect,'error')
  for(const bad of ['x@y','a'.repeat(255)+'@example.test','x@y.example\nX:evil']){
    assert.equal(await errorCode(()=>requestWalletlessOtp({email:bad,authBase:neon,fetchImpl})),
      'invalid_email')
  }
})
test('OTP completion verifies hosted session, passes only JWT to xArtists and returns no secret',async()=>{
  const calls=[]
  const replies=[
    resp({ok:true}),resp({session:{token}}),
    resp({ok:true,account:{id:uid},checkoutAuthorized:false,nftEntitlement:false}),
    resp({ok:true,account:{id:uid,type:'walletless',linkedWalletCount:0},
      subscriptionAccess:'not_checked',xorusPrivateAccess:'not_checked',
      checkoutAuthorized:false,mintAuthorized:false,nftEntitlement:false}),
  ]
  const fetchImpl=async(url,options)=>{
    calls.push({url,options});return replies.shift()
  }
  const p=await completeWalletlessOtp({email,otp,authBase:neon,apiBase:api,fetchImpl})
  assert.deepEqual(p,{
    id:uid,type:'walletless',linkedWalletCount:0,
    subscriptionAccess:'not_checked',xorusPrivateAccess:'not_checked',
  })
  assert.equal(calls.length,4)
  assert.equal(calls[0].url,neon+'/sign-in/email-otp')
  assert.deepEqual(JSON.parse(calls[0].options.body),{email,otp})
  assert.equal(calls[0].options.credentials,'include')
  assert.equal(calls[1].url,neon+'/get-session')
  assert.equal(calls[2].url,api+'/v1/account/session')
  assert.equal(calls[2].options.method,'POST')
  assert.equal(calls[2].options.credentials,'omit')
  assert.equal(calls[2].options.headers.Authorization,'Bearer '+token)
  assert.equal(calls[2].options.body,undefined)
  assert.equal(calls[3].url,api+'/v1/account/me')
  assert.equal(calls[3].options.credentials,'omit')
  assert.equal(calls[3].options.headers.Authorization,'Bearer '+token)
  assert.equal(JSON.stringify(p).includes(token),false)
  assert.equal(JSON.stringify(p).includes(email),false)
  assert.equal(JSON.stringify(p).includes(otp),false)
})
test('invalid OTP, opaque session token and false checkout / forged profile fail closed',async()=>{
  const mock=(replies)=>async()=>replies.shift()||resp({}, {ok:false})
  assert.equal(await errorCode(()=>completeWalletlessOtp({
    email,otp:'1',authBase:neon,fetchImpl:async()=>{throw Error('never')}})),'invalid_otp_request')
  assert.equal(await errorCode(()=>completeWalletlessOtp({
    email,otp,authBase:neon,fetchImpl:mock([resp({},{ok:false})])})),'otp_not_verified')
  assert.equal(await errorCode(()=>completeWalletlessOtp({
    email,otp,authBase:neon,fetchImpl:mock([resp({}),resp({session:{token:'opaque-token'}})])})),
    'verified_session_unavailable')
  assert.equal(await errorCode(()=>completeWalletlessOtp({
    email,otp,authBase:neon,fetchImpl:mock([
      resp({}),resp({session:{token}}),
      resp({ok:true,account:{id:uid},checkoutAuthorized:true,nftEntitlement:false}),
    ])})),'account_bridge_unavailable')
  assert.equal(await errorCode(()=>completeWalletlessOtp({
    email,otp,authBase:neon,fetchImpl:mock([
      resp({}),resp({session:{token}}),
      resp({ok:true,account:{id:uid},checkoutAuthorized:false,nftEntitlement:false}),
      resp({ok:true,account:{id:uid,type:'walletless',linkedWalletCount:0},
        checkoutAuthorized:false,nftEntitlement:false,mintAuthorized:true,
        subscriptionAccess:'not_checked',xorusPrivateAccess:'not_checked'}),
    ])})),'account_profile_unavailable')
})
test('account route & mail OTP UI stay gated and do not store JWT or sign wallets',()=>{
  const base=new URL('../src/',import.meta.url)
  const page=readFileSync(new URL('pages/AccountPage.tsx',base),'utf8')
  const router=readFileSync(new URL('experience/modules.ts',base),'utf8')
  const modal=readFileSync(new URL('components/LoginModal.tsx',base),'utf8')
  const source=readFileSync(new URL('lib/walletlessOtp.mjs',base),'utf8')
  assert.match(router,/module\('account','\/workspace\/account'/)
  assert.match(router,/Compte sans wallet/)
  assert.match(modal,/to="\/workspace\/account"/)
  assert.match(page,/catalog\?\.walletless_account_session_enabled===true/)
  assert.match(page,/verifiedNeonAuthBase/)
  assert.match(page,/if\(!live\|\|busy\|\|!neonBase\|\|!apiBase\)return/)
  assert.match(page,/walletOwnership|preuve de propriété|SIWX/)
  assert.doesNotMatch(source,/localStorage|sessionStorage|document\.cookie|window\.open|sendTransaction|mintNft/)
  assert.doesNotMatch(page,/localStorage|sessionStorage|sendTransaction|executeTransactions|createCheckoutSession/)
})
