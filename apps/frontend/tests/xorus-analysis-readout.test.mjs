import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {interpretXorusAnalysisReport} from '../src/lib/xorusAnalysisReadout.mjs'

const fixture=JSON.parse(readFileSync(new URL('../public/data/xorus_analysis_preview.json',import.meta.url),'utf8'))
const now=Date.parse(fixture.generated_at)
const copy=()=>structuredClone(fixture)

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
  const scenario=copy();scenario.scenarios[0].outcome='buy_now'
  const coverage=copy();coverage.coverage.signals_analyzed=1
  for(const raw of [duplicate,forged,extra,unknown,scenario,coverage]){
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
