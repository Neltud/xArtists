import {test} from 'node:test'
import assert from 'node:assert/strict'
import {probeNeonAuthPilot} from '../scripts/ops/probe-neon-auth-pilot.mjs'
const sha='e2a39d406b67e16dea220e0b2d08548bbd26a36f'
const health={ok:true,service:'xartists-neon-authenticated-pilot',source_sha:sha,environment:'sandbox',
  identity_verifier_configured:true,database_mapping_enabled:false,
  studio_media_upload:'off',mint_live_enabled:false,stripe_live_checkout_enabled:false,
  paybox_checkout_enabled:false,trading_enabled:false,execution_authorized:false,
  production_access_api:false}
const fetchMock=async (url,opts)=>{
  const bad=opts.headers.Origin==='https://evil.example'
  const content=url.endsWith('/health')?health:url.endsWith('/v1/studio/drafts/config')?
    {storage_bucket:'xartists-studio-drafts',bucket_access:'private',upload_enabled:false,
      upload_authorized:false,mint_authorized:false}:
    {error:bad?'origin_not_allowed':'verified_neon_identity_required'}
  return {status:url.endsWith('/health')||url.endsWith('/config')?200:bad?403:401,
    headers:new Headers({'content-type':'application/json',
      ...(!bad?{'access-control-allow-origin':'https://xartists.art'}:{})}),
    json:async()=>content}
}
test('strict read-only public health and anonymous deny probe',async()=>{
  const result=await probeNeonAuthPilot(fetchMock)
  assert.equal(result.ok,true)
  assert.equal(result.production_access_api,false)
  assert.equal(result.anonymous_account_access,'denied')
})
test('denies false claim that media upload or production identity is ready',async()=>{
  await assert.rejects(probeNeonAuthPilot(async (url,opt)=>{
    const out=await fetchMock(url,opt)
    if(url.endsWith('/v1/studio/drafts/config')){
      const v=await out.json();out.json=async()=>({...v,upload_enabled:true})
    }
    return out
  }),/private_storage_gate_unverified/)
})
test('all live requests are GET without tokens or user data',async()=>{
  const requests=[]
  await probeNeonAuthPilot(async (url,options)=>{
    requests.push({url,options})
    return fetchMock(url,options)
  })
  assert.equal(requests.length,4)
  assert.ok(requests.every(x=>x.url.startsWith('https://br-steep-sun-bab7l93p-xartistsauthpilot.compute.c-8.eu-central-1.aws.neon.tech/')))
  assert.ok(requests.every(x=>x.options.method==='GET'&&x.options.redirect==='error'&&!x.options.headers.Authorization))
})
