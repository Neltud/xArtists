import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {interpretXorusAnalysisReport} from '../src/lib/xorusAnalysisReadout.mjs'

const fixture=JSON.parse(readFileSync(new URL('../public/data/xorus_analysis_preview.json',import.meta.url),'utf8'))
const now=Date.parse(fixture.generated_at)
const copy=()=>structuredClone(fixture)
const collected=JSON.parse(readFileSync(new URL('../../../tests/fixtures/xorus_analysis_collected.json',import.meta.url),'utf8'))
const sourceNow=Date.parse(collected.generated_at)

test('real Python preview is analysis without raw data or invented confidence',()=>{
  const out=interpretXorusAnalysisReport(fixture,now)
  assert.ok(out)
  assert.equal(out.signalsAnalyzed,0)
  assert.equal(out.stance,'ABSTAIN')
  assert.equal(out.agents.length,8)
  assert.equal(out.independentlyVerifiedSignals,0)
  assert.equal(out.rawDataIncluded,false)
  assert.equal(out.sourceTimeVerified,false)
  assert.equal(out.commercialEnabled,false)
})

test('unknown provider fields and instructions cannot enter the customer readout',()=>{
  const raw=copy(),secret='private-provider-response-secret'
  raw.market={value:secret}
  raw.observations=[{value:secret}]
  raw.prompt=secret
  raw.agents[0].provider_payload=secret
  raw.agents[0].families[0].explanation=secret
  const out=interpretXorusAnalysisReport(raw,now)
  assert.ok(out)
  assert.ok(!JSON.stringify(out).includes(secret))
  assert.equal(Object.hasOwn(out,'market'),false)
})

test('commercial, live, verification and confidence claims cannot promote a preview',()=>{
  const variants=[
    null,{}, {...copy(),mode:'live'}, {...copy(),product:'raw_data_pack'},
    {...copy(),raw_data_included:true}, {...copy(),commercial_enabled:true},
    {...copy(),access_granted:true},{...copy(),confidence:.9},
    {...copy(),source_ts:fixture.generated_at},
    {...copy(),safety:{...fixture.safety,executable:true}},
    {...copy(),decision:{stance:'BUY',reason:'thin_tape'}},
    {...copy(),coverage:{...fixture.coverage,independently_verified_signals:120}},
  ]
  for(const raw of variants)assert.equal(interpretXorusAnalysisReport(raw,now),null)
})

test('invalid timestamps and numeric coercions fail closed',()=>{
  for(const timestamp of [null,'','2026-11-31T00:00:00Z','2029-01-01T00:00:00Z']){
    assert.equal(interpretXorusAnalysisReport({...copy(),generated_at:timestamp},now),null)
  }
  for(const value of [true,'0',null,-1,Infinity]){
    const raw=copy()
    raw.coverage.signals_analyzed=value
    assert.equal(interpretXorusAnalysisReport(raw,now),null)
  }
  assert.equal(interpretXorusAnalysisReport(fixture,NaN),null)
})

test('missing, duplicated or inconsistent agent findings are rejected',()=>{
  const duplicate=copy();duplicate.agents[1]=duplicate.agents[0]
  const forged=copy();forged.agents[1].families[0].reading='positive'
  const extra=copy();extra.agents.push(extra.agents[0])
  const unknown=copy();unknown.agents[0].agent='__proto__'
  const nonString=copy();nonString.agents[0].agent={toString:null}
  const scenario=copy();scenario.scenarios[0].outcome='buy_now'
  const coverage=copy();coverage.coverage.signals_analyzed=1
  for(const raw of [duplicate,forged,extra,unknown,nonString,scenario,coverage]){
    assert.equal(interpretXorusAnalysisReport(raw,now),null)
  }
})

test('paper findings can change but never become a verified recommendation',()=>{
  const raw=copy()
  raw.coverage.signals_analyzed=1
  raw.coverage.families_analyzed=1
  raw.agents[1].status='paper_unverified'
  raw.agents[1].families[0]={family:'price',signals_analyzed:1,reading:'negative'}
  const out=interpretXorusAnalysisReport(raw,now)
  assert.ok(out)
  assert.equal(out.signalsAnalyzed,1)
  assert.equal(out.agents[1].families[0].reading,'negative')
  assert.equal(out.stance,'ABSTAIN')
  assert.equal(out.executable,false)
})

test('aging a report never changes its observation time or verification',()=>{
  const out=interpretXorusAnalysisReport(fixture,now+16*60*1000)
  assert.ok(out.stale)
  assert.equal(out.generatedAt,fixture.generated_at)
  assert.equal(out.sourceTimeVerified,false)
})

test('collected Python analysis has observed timestamps, six indicators and zero independent attestations',()=>{
  const out=interpretXorusAnalysisReport(collected,sourceNow)
  assert.ok(out)
  assert.equal(out.signalsAnalyzed,6)
  assert.equal(out.collection.state,'observed')
  assert.equal(out.collection.instrument,'EGLD/USDT')
  assert.equal(out.sourceTs,'2026-11-13T08:59:59Z')
  assert.equal(out.sourceTimeVerified,false)
  assert.equal(out.stance,'ABSTAIN')
  const aged=interpretXorusAnalysisReport(collected,sourceNow+40*60000)
  assert.equal(aged.stale,true)
  assert.equal(aged.sourceTs,out.sourceTs)
})

test('source metadata cannot invent timestamps, markets, independent inputs or commercial rights',()=>{
  for(const patch of [{source_ts:null},{source_ts:'2026-11-13T11:00:00Z'},
    {source_ts:'2026-11-12T08:59:59Z'},{input_provenance:'provider_verified'},
    {collection:{...collected.collection,state:'verified'}},
    {collection:{...collected.collection,instrument:'BTCUSDT'}},
    {collection:{...collected.collection,provider:'private-provider-secret'}},
    {collection:{...collected.collection,candles_used:'49'}},
    {collection:{...collected.collection,source_max_age_seconds:86400}},
    {collection:{...collected.collection,received_at:fixture.generated_at}},
    {collection:{...collected.collection,state:'unavailable'}},
  ])assert.equal(interpretXorusAnalysisReport({...collected,...patch},sourceNow),null)
})

test('provider errors require zero findings and never expose arbitrary source text',()=>{
  const raw={...copy(),schema:'xorus_analysis/v2',generated_at:collected.generated_at,
    input_provenance:'no_usable_provider_input',collection:{...collected.collection,
      state:'rate_limited',candles_used:0,payload_sha256:null,error:'private-provider-error'}}
  const out=interpretXorusAnalysisReport(raw,sourceNow)
  assert.ok(out)
  assert.equal(out.signalsAnalyzed,0)
  assert.equal(out.sourceTs,null)
  assert.equal(out.collection.state,'rate_limited')
  assert.equal(JSON.stringify(out).includes('private-provider-error'),false)
  raw.coverage={...raw.coverage,signals_analyzed:1}
  assert.equal(interpretXorusAnalysisReport(raw,sourceNow),null)
})
