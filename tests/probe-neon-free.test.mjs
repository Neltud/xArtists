import {test} from 'node:test'
import assert from 'node:assert/strict'
import {probeNeonFree} from '../scripts/ops/probe-neon-free.mjs'
const SHA='07d7574da70d3ddd49b6c64d128e154aed1539cf'
const service='xartists-neon-readonly-staging'
const health={service,source_sha:SHA,backend_compatible_with_access_api:false,execution_authorized:false,
  accounts_enabled:false,mail_connected:false,database_connected:false,studio_media_upload:'off',
  mint_live_enabled:false,paybox_checkout_enabled:false,stripe_live_checkout_enabled:false,
  auction_enabled:false,xorus_live_trading:'0',mint_dry_run:true}
const fake=async url=>({
  status:/store\/status|media\/config/.test(url)?503:200,
  headers:new Headers({'content-type':'application/json','access-control-allow-origin':'https://xartists.art'}),
  json:async()=>url.endsWith('/health')?health:url.endsWith('/v1/ops/build-info')?
    {service,source_sha:SHA,backend_compatible_with_access_api:false,execution_authorized:false}:
    {ok:false,enabled:false,reason:'full_backend_not_deployed'},
})
test('read-only live probe rejects no-go flags and succeeds only on exact SHA',async()=>{
  const result=await probeNeonFree(fake)
  assert.equal(result.ok,true)
  assert.equal(result.production_access_api,false)
})
test('rejects stolen DNS/CORS and false media readiness',async()=>{
  await assert.rejects(probeNeonFree(async u=>{const r=await fake(u);r.headers.set('access-control-allow-origin','*');return r}),/cors_unverified/)
  await assert.rejects(probeNeonFree(async u=>{const r=await fake(u);if(u.endsWith('/v1/studio/media/config'))r.status=200;return r}),/disabled_routes_not_verified/)
})
test('GET only, precise Neon origin, no external data or secrets',async()=>{
  const requests=[]
  await probeNeonFree(async (url,options)=>{
    requests.push({url,options});return fake(url)
  })
  assert.equal(requests.length,5)
  assert.ok(requests.every(r=>r.url.startsWith('https://br-steep-sun-bab7l93p-xartistsfree.compute.c-8.eu-central-1.aws.neon.tech/')))
  assert.ok(requests.every(r=>r.options.method==='GET'&&r.options.redirect==='error'))
})
