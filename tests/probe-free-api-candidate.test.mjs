import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {
  validateCandidateUrl,evaluateCandidate,probeCandidate,
} from '../scripts/ops/probe-free-api-candidate.mjs'

const SHA='a'.repeat(40)
const base='https://api-staging.xartists.art'
const health={
  ok:true,service:'access-api',source_sha:SHA,require_siwx:true,
  mint_live_enabled:false,mint_dispatch_enabled:false,
  mint_oidc_pull_enabled:false,mint_dry_run:true,
  stripe_live_checkout_enabled:false,paybox_checkout_enabled:false,
  auction_enabled:false,auction_demo_writes_enabled:false,
  walletless_account_session_enabled:false,xorus_private_analysis_enabled:false,
  studio_media_upload:'off',lia_live_trading:'0',
  tro_solana_bridge:'off',opensea_order_execution_enabled:false,
  auction_settle:false,
}
const build={
  ok:true,service:'access-api',source_sha:SHA,execution_authorized:false,
  stamp_source:'operator-environment',
}
const store=(status,ok)=>({httpStatus:status,body:{ok}})

test('candidate probe accepts exact HTTPS subdomain only; never arbitrary URLs or local targets',()=>{
  assert.equal(validateCandidateUrl(base),base)
  assert.equal(validateCandidateUrl(base+'/'),base)
  assert.equal(validateCandidateUrl('https://api.xartists.art'), 'https://api.xartists.art')
  for(const url of [
    'http://api-staging.xartists.art', 'https://evil.example.org',
    'https://api.xartists.art.evil.example.org',
    'https://api-staging.xartists.art/path',
    'https://api-staging.xartists.art?token=secret',
    'https://api-staging.xartists.art/#hash',
    'https://user:secret@api.xartists.art',
    'http://localhost:8787', 'https://127.0.0.1',
    'https://api-staging.xartists.art:8787',
    'https://xartists.art', 'https://xartists-access-api.onrender.com',
    'javascript:alert(1)',
  ])assert.throws(()=>validateCandidateUrl(url),/candidate_/)
})

test('exact SHA and paper flags are mandatory for staging health',()=>{
  const safe=evaluateCandidate({
    health,build,studio:store(503,false),orders:store(200,true),
    expectedSha:SHA,
  })
  assert.equal(safe.candidate_identity_verified,true)
  assert.equal(safe.studio_schema,'not_ready')
  assert.equal(safe.orders_schema,'probe_passed')
  assert.equal(safe.production_commerce_go,false)
  assert.equal(safe.commercial_operations,'off')
  assert.equal(safe.cutover_status,'manual_review_required')
  assert.throws(()=>evaluateCandidate({
    health:{...health,source_sha:'b'.repeat(40)},build,expectedSha:SHA,
  }),/candidate_identity_unverified/)
  assert.throws(()=>evaluateCandidate({
    health,build:{...build,execution_authorized:true},expectedSha:SHA,
  }),/candidate_identity_unverified/)
  assert.throws(()=>evaluateCandidate({health,build,expectedSha:'notasha'}),
    /candidate_expected_sha_required/)
})

test('all transaction, upload and account gates must remain OFF, not merely absent',()=>{
  for(const change of [
    {mint_live_enabled:true}, {mint_dispatch_enabled:true},
    {mint_oidc_pull_enabled:true},{mint_dry_run:false},
    {stripe_live_checkout_enabled:true},{paybox_checkout_enabled:true},
    {auction_enabled:true},{auction_demo_writes_enabled:true},
    {walletless_account_session_enabled:true},
    {xorus_private_analysis_enabled:true},
    {studio_media_upload:'pinata_ipfs'},
    {lia_live_trading:'1'}, {require_siwx:false},
    {tro_solana_bridge:'live'}, {opensea_order_execution_enabled:true},
    {auction_settle:true},{mint_live_enabled:undefined},
  ]){
    assert.throws(()=>evaluateCandidate({
      health:{...health,...change},build,expectedSha:SHA,
    }),/candidate_financial_or_upload_gate_unsafe/,
    'unsafe gate accepted: '+JSON.stringify(change))
  }
})

test('all four candidate endpoints are GET-only, no redirect and no credential leakage',async()=>{
  const seen=[]
  const fetchFn=async(url,opts)=>{
    seen.push({url,method:opts.method,redirect:opts.redirect,body:opts.body})
    let obj,status=200
    if(url.endsWith('/health'))obj=health
    else if(url.endsWith('/v1/ops/build-info'))obj=build
    else if(url.endsWith('/v1/ops/studio-store/status')){
      status=503;obj={ok:false,backend:'postgres'}
    }
    else if(url.endsWith('/v1/ops/orders-store/status')){
      status=503;obj={ok:false,backend:'postgres'}
    }
    else throw new Error('unexpected endpoint '+url)
    return {
      status,
      headers:{get:()=> 'application/json; charset=utf-8'},
      json:async()=>obj,
    }
  }
  const out=await probeCandidate({origin:base,expectedSha:SHA,fetchFn})
  assert.equal(out.studio_schema,'not_ready')
  assert.equal(out.orders_schema,'not_ready')
  assert.equal(seen.length,4)
  assert.ok(seen.every(x=>x.url.startsWith(base+'/')&&
    x.method==='GET'&&x.redirect==='error'&&x.body===undefined))
  assert.equal(out.production_commerce_go,false)
})

test('fail closed before any network if host or SHA is invalid',async()=>{
  let called=0
  const fetchFn=async()=>{called++;throw Error('network_should_not_be_called')}
  await assert.rejects(probeCandidate({
    origin:'http://localhost:8787',expectedSha:SHA,fetchFn,
  }),/candidate_/)
  await assert.rejects(probeCandidate({
    origin:base,expectedSha:'incomplete',fetchFn,
  }),/candidate_/)
  assert.equal(called,0)
})

test('readiness probe cannot be substituted for a deployment or commerce action',()=>{
  const src=readFileSync(new URL('../scripts/ops/probe-free-api-candidate.mjs',import.meta.url),'utf8')
  const guide=readFileSync(new URL('../deploy/free-hosting/README.md',import.meta.url),'utf8')
  assert.doesNotMatch(src,/method:\s*'POST'|method:\s*'PUT'|method:\s*'DELETE'/)
  assert.doesNotMatch(src,/wallet\.sign|paybox\.session|mintNFT|sendTransaction/)
  assert.match(guide,/VITE_ACCESS_API_BASE/)
  assert.match(guide,/rollback|fallback/)
  assert.match(guide,/api-staging\.xartists\.art/)
  assert.match(guide,/2 OCPU Arm \/ 12 Go RAM/)
  assert.match(guide,/ne déploie rien/)
})
