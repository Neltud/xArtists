import test from 'node:test'
import assert from 'node:assert/strict'
import { runAssistedSwap, XORUS_ASSISTED_SWAP_POLICY } from '../src/xorusAssistedSwap.mjs'

const SENDER = 'erd1' + 'q'.repeat(58)
const LINK = 'https://wallet.multiversx.com/hook/transaction?unsigned=test'
const INTENT = {tokenIn:'EGLD', tokenOut:'ONE', amountIn:'0.1', sender:SENDER}

function responses({
  quote = {quotedOut:'100', minOut:{human:'99.5',raw:'99500000'}, warnings:[]},
  build = {transaction:{sender:SENDER, mock:'unsigned'}, minOut:{human:'99.5',raw:'99500000'}, signingLink:LINK},
  sim = {status:'success',meetsMinOut:true},
}={}) {
  return {get_quote:quote, build_swap_tx:build, simulate_swap_tx:sim}
}

async function withMockMcp(payloads, fn) {
  const original = globalThis.fetch
  const calls = []
  globalThis.fetch = async (_url, init) => {
    const rpc = JSON.parse(init.body)
    const name = rpc.params.name
    calls.push({name,arguments:rpc.params.arguments})
    if (!Object.hasOwn(payloads,name)) throw new Error('unexpected MCP tool: '+name)
    return {
      ok:true,
      text:async () => JSON.stringify({jsonrpc:'2.0',id:1,result:{structuredContent:payloads[name]}}),
    }
  }
  try { return await fn(calls) } finally { globalThis.fetch = original }
}

test('policy excludes bad tokens, invalid amounts, bad senders and extreme slippage', async () => {
  await withMockMcp({}, async calls => {
    for (const changed of [
      {tokenIn:'USDC-unverified'}, {tokenOut:'USDC-fake'},
      {tokenOut:'EGLD'}, {amountIn:'Infinity'}, {amountIn:'NaN'},
      {amountIn:'9999'}, {amountIn:'0'}, {amountIn:'-1'},
      {amountIn:'0,1'}, {sender:'erd1'+'1'.repeat(58)},
      {sender:'erd1'+'q'.repeat(59)},
      {maxSlippageBps:-1}, {maxSlippageBps:301},
      {maxSlippageBps:'1'}, {maxSlippageBps:1.5},
    ]) {
      const result = await runAssistedSwap({...INTENT,...changed})
      assert.equal(result.ok,false,JSON.stringify(changed))
      assert.equal(result.stage,'blocked')
    }
    assert.equal(calls.length,0,'invalid input must never call OneDex')
  })
})

test('valid quote/build/sim returns ONLY human-signable approved link', async () => {
  await withMockMcp(responses(),async calls=>{
    const out = await runAssistedSwap(INTENT)
    assert.equal(out.ok,true)
    assert.equal(out.stage,'ready_to_sign')
    assert.equal(out.build.signingLink, LINK)
    assert.equal(out.requiresHumanSignature,true)
    assert.deepEqual(calls.map(c=>c.name),['get_quote','build_swap_tx','simulate_swap_tx'])
    assert.equal(calls[2].arguments.minOut, '99500000','simulation must use RAW not human minOut')
    assert.equal(XORUS_ASSISTED_SWAP_POLICY.autonomous_execution,false)
  })
})

test('missing or excessive quoted minOut blocks before build', async () => {
  for (const quote of [
    {quotedOut:'100'},
    {quotedOut:'100',minOut:{human:'90',raw:'90000000'}},
    {quotedOut:'NaN',minOut:{human:'99',raw:'99000000'}},
  ]) {
    await withMockMcp(responses({quote}),async calls=>{
      const out=await runAssistedSwap(INTENT)
      assert.equal(out.ok,false)
      assert.equal(out.stage,'quote')
      assert.deepEqual(calls.map(c=>c.name),['get_quote'])
    })
  }
})

test('missing raw minOut or worse build minimum always blocks before simulation', async () => {
  for (const build of [
    {transaction:{mock:'unsigned'}, minOut:{human:'99'},signingLink:LINK},
    {transaction:{mock:'unsigned'}, minOut:{human:'99',raw:'95000000'},signingLink:LINK},
    {transaction:{mock:'unsigned'}, minOutRaw:'0',signingLink:LINK},
  ]) {
    await withMockMcp(responses({build}),async calls=>{
      const out=await runAssistedSwap(INTENT)
      assert.equal(out.ok,false)
      assert.equal(out.stage,'build')
      assert.deepEqual(calls.map(c=>c.name),['get_quote','build_swap_tx'])
      assert.ok(!out.build?.signingLink)
    })
  }
})

test('simulation must be status success AND exact boolean meetsMinOut',async()=>{
  for (const sim of [
    {status:'success'}, {status:'success',meetsMinOut:'true'},
    {status:'success',meetsMinOut:1},{status:'success',meetsMinOut:false},
    {status:'fail',meetsMinOut:true},
  ]) {
    await withMockMcp(responses({sim}),async ()=>{
      const out=await runAssistedSwap(INTENT)
      assert.equal(out.ok,false,JSON.stringify(sim))
      assert.equal(out.stage,'simulate')
      assert.ok(!out.build?.signingLink)
    })
  }
})

test('unapproved signingLink is never returned to browser',async()=>{
  for(const signingLink of [
    null,'https://wallet.multiversx.com.evil.test/hook/transaction',
    'http://wallet.multiversx.com/hook/transaction',
    'javascript:alert(1)',
    'https://other-site.test/hook/transaction',
  ]){
    await withMockMcp(responses({build:{
      transaction:{mock:'unsigned'},minOut:{human:'99.5',raw:'99500000'},signingLink,
    }}), async ()=>{
      const out=await runAssistedSwap(INTENT)
      assert.equal(out.ok,false)
      assert.equal(out.stage,'blocked')
      assert.ok(!out.build?.signingLink)
    })
  }
})

test('MCP tool-level errors block before signing',async()=>{
  await withMockMcp(responses({quote:{error:'untrusted'}}),async()=>{
    const out=await runAssistedSwap(INTENT)
    assert.equal(out.ok,false)
  })
})

test('unusable expiry refuses stale wallet handoff',async()=>{
  await withMockMcp(responses({build:{
    transaction:{mock:'unsigned'}, minOut:{human:'99.5',raw:'99500000'},
    signingLink:LINK, expiresAt:'2020-01-01T00:00:00Z',
  }}),async()=>{
    const out=await runAssistedSwap(INTENT)
    assert.equal(out.stage,'build')
    assert.equal(out.ok,false)
  })
})
