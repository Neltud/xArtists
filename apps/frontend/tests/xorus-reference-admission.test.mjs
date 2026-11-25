import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {assessReferenceQuote as hubAssess, referenceQuoteManifest as hubManifest} from '../../../deploy/neon/xorus-hub/reference-quotes.mjs'
import {assessReferenceQuote as uiAssess, referenceQuoteManifest as uiManifest} from '../src/lib/xorusReferenceAdmission.mjs'

const desk=readFileSync(new URL('../src/components/intelligence/XorusDecisionDesk.tsx',import.meta.url),'utf8')
const now=Date.parse('2026-11-25T05:40:00.000Z')

function comparable(manifest){
  const copy=structuredClone(manifest)
  delete copy.checked_at
  delete copy.published_runtime
  return copy
}

test('the public admission schema matches the hub and collects no prices',()=>{
  const hub=hubManifest(now)
  const ui=uiManifest(now)
  assert.equal(ui.published_runtime,'not_on_current_neon_hub')
  assert.equal(hub.published_runtime,undefined)
  assert.deepEqual(comparable(ui),comparable(hub))
  assert.deepEqual(ui.quotes,[])
  assert.equal(ui.executable,false)
  assert.equal(ui.feed,null)
  assert.equal(ui.trading_enabled,false)
  assert.ok(ui.universe.every(row=>row.swap_support_proven===false))
})

test('an executable or stale quote is rejected by both copies and is never a fill',()=>{
  const fresh={
    symbol:'EGLD',network:'multiversx',observed_at:new Date(now-1000).toISOString(),
    source_url:'https://api.multiversx.com/economics',price_micro_usd:1_000_000,
  }
  assert.equal(hubAssess({...fresh,executable:true},now).ok,false)
  assert.equal(uiAssess({...fresh,executable:true},now).ok,false)
  assert.equal(uiAssess({...fresh,observed_at:new Date(now-20_000).toISOString()},now).error,'quote_stale_or_future')
  const admitted=uiAssess(fresh,now)
  assert.equal(admitted.ok,true)
  assert.equal(admitted.executable,false)
  assert.equal(admitted.quote.usable_as_fill,false)
  assert.equal(admitted.quote.swap_support_proven,false)
  assert.deepEqual(hubAssess(fresh,now).quote,admitted.quote)
})

test('the decision desk shows the schema locally and does not call the missing hub route',()=>{
  assert.match(desk,/data-testid="xorus-reference-admission"/)
  assert.match(desk,/referenceQuoteManifest\(checkedAt\)/)
  assert.doesNotMatch(desk,/\/v1\/xorus\/reference-quotes/)
  assert.doesNotMatch(desk,/neon\.tech/)
})
