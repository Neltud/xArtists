import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {isTradingDisabled,isTradingEnabled} from '../../../packages/core/tradingStatus.mjs'

test('xOrus statuses accept explicit OFF and preserve a safe read of older deployments',()=>{
  for(const key of ['xorus_live_trading','XORUS_LIVE_TRADING','lia_live_trading','LIA_LIVE_TRADING']){
    for(const value of [false,0,'0','false']){
      assert.equal(isTradingDisabled({[key]:value}),true)
      assert.equal(isTradingEnabled({[key]:value}),false)
    }
  }
  for(const doc of [{},null,{xorus_live_trading:undefined},{xorus_live_trading:'off'}])
    assert.equal(isTradingDisabled(doc),false,'missing or unknown is not a proven OFF state')
})

test('a mixed new/old payload cannot hide an execution flag behind a false canonical flag',()=>{
  for(const value of [true,1,'1','true']){
    const mixed={xorus_live_trading:false,lia_live_trading:value}
    assert.equal(isTradingDisabled(mixed),false)
    assert.equal(isTradingEnabled(mixed),true)
    assert.equal(isTradingDisabled({xorus_live_trading:value,lia_live_trading:'0'}),false)
  }
})

test('public build stamps and deployment configuration publish only the xOrus flag',()=>{
  for(const file of ['scripts/write-build-info.mjs','scripts/publicAvailability.mjs']){
    const source=readFileSync(new URL('../'+file,import.meta.url),'utf8')
    assert.match(source,/xorus_live_trading/)
    assert.doesNotMatch(source,/lia_live_trading/)
  }
  const config=readFileSync(new URL('../src/config/xorusConfig.ts',import.meta.url),'utf8')
  assert.match(config,/export const XORUS_LIVE_TRADING = false/)
  assert.doesNotMatch(config,/export const LIA_LIVE_TRADING/)
})
