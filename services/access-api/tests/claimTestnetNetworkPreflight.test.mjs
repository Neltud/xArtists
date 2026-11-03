import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  verifyPublicTestnetNetworkPreflight, validateNetworkConfig,
} from '../src/claimTestnetNetworkPreflight.mjs'

const TESTNET = 'https://testnet-gateway.multiversx.com/network/config'
const MAINNET = 'https://gateway.multiversx.com/network/config'

const payload = id => ({
  code: 'successful',
  data: { config: {
    erd_chain_id: id, erd_min_transaction_version: 1,
    erd_num_shards_without_meta: 3,
  }},
})
function mockServer({
  testnet = payload('T'), mainnet = payload('1'),
  status = 200, redirect = false, contentType = 'application/json',
  contentLength = null, bodyOverride = null, stream = false,
} = {}) {
  const urls = []
  const send = async (url, options) => {
    urls.push({ url, options })
    const body = bodyOverride ?? JSON.stringify(url === TESTNET ? testnet : mainnet)
    return {
      ok: status === 200, status,
      url: redirect ? 'https://evil.example/config' : url,
      headers: { get: key => key === 'content-type' ? contentType :
        key === 'content-length' ? contentLength : null },
      ...(stream
        ? { body: new ReadableStream({ start(controller) {
          controller.enqueue(new TextEncoder().encode(body))
          controller.close()
        }}) }
        : { text: async () => body }),
    }
  }
  return { send, urls }
}

test('testnet T and mainnet 1 only — fixed official GET hosts', async () => {
  const f = mockServer()
  const result = await verifyPublicTestnetNetworkPreflight(f.send)
  assert.equal(result.ok, true)
  assert.equal(result.testnet_chain_id, 'T')
  assert.equal(result.mainnet_chain_id, '1')
  assert.equal(result.min_transaction_version, 1)
  assert.deepEqual(f.urls.map(x=>x.url), [TESTNET, MAINNET])
  assert.ok(f.urls.every(x=>x.options.method==='GET'&&x.options.redirect==='error'))
  assert.equal(result.chain_id_verified_offchain_only, true)
  assert.equal(result.chain_id_verified_inside_sc, false)
  assert.equal(result.deployment_permitted_by_this_check, false)
  assert.equal(result.signer_permitted_by_this_check, false)
  assert.equal(result.commercial_rails_unchanged, 'NO-GO')
})

test('fail closed on testnet wrong chain, not 1/D/T spoof', async () => {
  for(const chainId of ['1','D','t','','mainnet',0,null]) {
    const f=mockServer({testnet:payload(chainId)})
    await assert.rejects(
      verifyPublicTestnetNetworkPreflight(f.send), /public_testnet_preflight_failed/,
    )
    assert.equal(f.urls.length, 1, 'do not contact mainnet after testnet mismatch')
  }
})

test('mainnet independent reference must really identify as 1', async () => {
  for(const bad of ['T','D','',null]) {
    const f=mockServer({mainnet:payload(bad)})
    await assert.rejects(verifyPublicTestnetNetworkPreflight(f.send), /failed/)
    assert.equal(f.urls.length, 2)
  }
})

test('invalid JSON, status, redirect and mime must refuse any success', async () => {
  for(const options of [
    {bodyOverride:'not-json'},
    {status:503},
    {redirect:true},
    {contentType:'text/html'},
    {contentLength:'70000'},
    {contentLength:'oops'},
  ]) {
    const f=mockServer(options)
    await assert.rejects(verifyPublicTestnetNetworkPreflight(f.send), /failed/)
  }
})

test('reject oversized streaming body even without Content-Length', async () => {
  const f=mockServer({bodyOverride:'x'.repeat(65*1024),stream:true})
  await assert.rejects(verifyPublicTestnetNetworkPreflight(f.send), /gateway_json_too_large/)
})

test('bounded streaming JSON is supported', async () => {
  const f=mockServer({stream:true})
  const result=await verifyPublicTestnetNetworkPreflight(f.send)
  assert.equal(result.ok,true)
  assert.equal(f.urls.length,2)
})

test('required config schema is type checked and cannot be relaxed',()=>{
  assert.deepEqual(validateNetworkConfig(payload('T'),'T'),{
    chain_id:'T',min_transaction_version:1,num_shards_without_meta:3,
  })
  for(const invalid of [
    {},{code:'successful',data:{}},
    {...payload('T'),code:'error'},
    payload('D'),
    {code:'successful',data:{config:{erd_chain_id:'T',erd_min_transaction_version:'1',erd_num_shards_without_meta:3}}},
    {code:'successful',data:{config:{erd_chain_id:'T',erd_min_transaction_version:1,erd_num_shards_without_meta:0}}},
  ])assert.throws(()=>validateNetworkConfig(invalid,'T'),/public_gateway_chain_config_inconsistent/)
  assert.throws(()=>validateNetworkConfig(payload('T'),'D'),/unexpected_expected_chain_id/)
})

test('preflight is read-only: no signed transactions, credentials or claimed onchain attestation',async()=>{
  const f=mockServer()
  const result=await verifyPublicTestnetNetworkPreflight(f.send)
  assert.equal(result.chain_id_verified_inside_sc,false)
  assert.equal(result.deployment_permitted_by_this_check,false)
  assert.equal(result.signer_permitted_by_this_check,false)
  assert.ok(f.urls.every(x=>x.options.method==='GET'))
  assert.ok(f.urls.every(x=>!Object.keys(x.options.headers).some(k=>/auth|key|token|pem/i.test(k))))
})
