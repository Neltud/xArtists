import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { probeAssistedDisabled } from '../scripts/ops/probe-xorus-assisted-disabled.mjs'

const SHA='a'.repeat(40)
const BASE='https://api-staging.xartists.art'
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
const policy={
  ok:true,mode:'assisted_only',enabled:false,
  live_trading:false,autonomous_execution:false,
  policy:{allowed_tokens:['EGLD','ONE'],max_slippage_bps:300},
}
const blocked={
  ok:false,stage:'blocked',error:'assisted_swap_not_enabled',
}
function fixture({healthData=health,buildData=build,policyData=policy,postData=blocked,postStatus=503,cors='https://xartists.art'}={}){
  const calls=[]
  const fetchFn=async(url,opts)=>{
    calls.push({url,opts})
    const path=new URL(url).pathname
    let status=200,data
    if(path==='/health')data=healthData
    else if(path==='/v1/ops/build-info')data=buildData
    else if(path==='/v1/ops/studio-store/status') {status=503;data={ok:false}}
    else if(path==='/v1/ops/orders-store/status') {status=503;data={ok:false}}
    else if(path==='/v1/xorus/assisted-swap'&&opts.method==='GET')data=policyData
    else if(path==='/v1/xorus/assisted-swap'&&opts.method==='POST') {status=postStatus;data=postData}
    else throw Error('unexpected mock request')
    return {
      status,headers:{get:(k)=>k==='content-type'?'application/json':(k==='access-control-allow-origin'?cors:null)},
      json:async()=>data,
    }
  }
  return {fetchFn,calls}
}
test('disabled assisted proxy returns immutable nontrading verdict with only one invalid POST',async()=>{
  const f=fixture()
  const out=await probeAssistedDisabled({origin:BASE,expectedSha:SHA,fetchFn:f.fetchFn})
  assert.equal(out.assisted_policy_get,'pass')
  assert.equal(out.assisted_post_disabled,'pass')
  assert.equal(out.commerce_go,false)
  assert.equal(out.signing,false)
  assert.equal(f.calls.length,6)
  const [post]=f.calls.filter(x=>x.opts.method==='POST')
  assert.equal(post.url,BASE+'/v1/xorus/assisted-swap')
  const body=JSON.parse(post.opts.body)
  assert.equal(body.sender,'invalid-public-address')
  assert.ok(!JSON.stringify(body).includes('erd1'))
  assert.equal(post.opts.redirect,'error')
  assert.equal(post.opts.headers.Origin,'https://xartists.art')
  assert.ok(f.calls.every(x=>x.opts.redirect==='error'))
})
test('unsafe policy and enabled mode never trigger even invalid POST',async()=>{
  for(const policyData of [
    {...policy,enabled:true},
    {...policy,live_trading:true},
    {...policy,mode:'autonomous'},
    {...policy,policy:{allowed_tokens:[]}},
    {...policy,autonomous_execution:true},
  ]){
    const f=fixture({policyData})
    await assert.rejects(
      probeAssistedDisabled({origin:BASE,expectedSha:SHA,fetchFn:f.fetchFn}),
      /assisted_policy_not_strictly_disabled/
    )
    assert.equal(f.calls.some(x=>x.opts.method==='POST'),false)
  }
})
test('invalid SHA, wrong host and http scheme never send a network request',async()=>{
  for(const {origin,expectedSha} of [
    {origin:BASE,expectedSha:'wrong'},
    {origin:'https://evil.test',expectedSha:SHA},
    {origin:'http://api.xartists.art',expectedSha:SHA},
    {origin:'https://api.xartists.art.evil.test',expectedSha:SHA},
  ]){
    const f=fixture()
    await assert.rejects(probeAssistedDisabled({origin,expectedSha,fetchFn:f.fetchFn}), /^(Error: )?(assisted|candidate)_/)
    assert.equal(f.calls.length,0)
  }
})
test('SHA divergence, unauthorized CORS or unexpected POST response fail closed',async()=>{
  for(const f of [
    fixture({buildData:{...build,source_sha:'b'.repeat(40)}}),
    fixture({cors:'*'}),
    fixture({postStatus:200,postData:{ok:true,stage:'ready_to_sign',signingLink:'https://evil.test'}}),
  ]){
    await assert.rejects(probeAssistedDisabled({origin:BASE,expectedSha:SHA,fetchFn:f.fetchFn}))
  }
})
test('source has no signing, wallet SDK, direct OneDex or non-probe mutating methods',()=>{
  const src=readFileSync(new URL('../scripts/ops/probe-xorus-assisted-disabled.mjs',import.meta.url),'utf8')
  assert.doesNotMatch(src,/aggregator\.onedex\.app|privateKey|signTransaction|mintNFT|sendTransaction|method:\s*'DELETE'/)
  assert.match(src,/invalid-public-address/)
  assert.match(src,/enabled !== false/)
  assert.match(src,/post.status !== 503/)
})
