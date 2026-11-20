import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createNeonAccountApi} from '../services/access-api/src/neonAccountApi.mjs'
import {probeNeonAccountsOff} from '../scripts/ops/probe-neon-accounts-off.mjs'

const sha='a'.repeat(40)
const app=createNeonAccountApi({env:{XARTISTS_SOURCE_SHA:sha}})
const fetchImpl=(url,options)=>app.fetch(new Request(url,options))

test('external OFF probe exercises the real handler with no token or body',async()=>{
  const seen=[]
  const result=await probeNeonAccountsOff({expectedSha:sha,fetchImpl:(url,options)=>{
    seen.push({url,options})
    return fetchImpl(url,options)
  }})
  assert.equal(result.ok,true)
  assert.equal(result.checks.length,7)
  assert.ok(seen.every(({url,options})=>url.startsWith('https://br-steep-sun-bab7l93p-xartistsaccounts.')&&
    !options.body&&!options.headers.Authorization&&options.redirect==='error'))
})

test('requires an exact source SHA and refuses stale runtime or any enabled gate',async()=>{
  await assert.rejects(probeNeonAccountsOff({fetchImpl}),/expected_source_sha_required/)
  await assert.rejects(probeNeonAccountsOff({expectedSha:'b'.repeat(40),fetchImpl}),/account_safety_or_source_unverified/)
  for(const key of ['account_profile_enabled','walletless_account_session_enabled',
    'mint_live_enabled','trading_enabled','production_access_api']){
    await assert.rejects(probeNeonAccountsOff({expectedSha:sha,fetchImpl:async(url,options)=>{
      const response=await fetchImpl(url,options)
      if(new URL(url).pathname!=='/health'||options.headers.Origin!=='https://xartists.art')return response
      return Response.json({...await response.json(),[key]:true},{status:200,headers:response.headers})
    }}),/account_safety_or_source_unverified/)
  }
})

test('refuses missing CORS and an accidentally accepted session',async()=>{
  await assert.rejects(probeNeonAccountsOff({expectedSha:sha,fetchImpl:async(url,options)=>{
    const r=await fetchImpl(url,options)
    if(new URL(url).pathname==='/health')r.headers.delete('access-control-allow-origin')
    return r
  }}),/response_policy_unverified/)
  await assert.rejects(probeNeonAccountsOff({expectedSha:sha,fetchImpl:async(url,options)=>{
    const r=await fetchImpl(url,options)
    return options.method==='POST'&&url.endsWith('/session')?
      Response.json({ok:true},{status:200,headers:r.headers}):r
  }}),/unexpected_status_POST_\/v1\/account\/session/)
})
