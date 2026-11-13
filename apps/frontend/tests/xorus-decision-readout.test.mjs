import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {interpretXorusSnapshot,parseMultiversxEconomics} from '../src/lib/xorusDecisionReadout.mjs'

const read=p=>readFileSync(new URL(p,import.meta.url),'utf8')
const board=JSON.parse(read('../public/data/xorus_board.json'))
const desk=read('../src/components/intelligence/XorusDecisionDesk.tsx')
const catalog=read('../src/components/intelligence/XorusSignalCatalog.tsx')
const page=read('../src/pages/XorusPage.tsx')

test('historical nine-fed snapshot is stale and NEVER becomes a live decision',()=>{
  const v=interpretXorusSnapshot(board,Date.parse('2026-11-13T03:40:00Z'))
  assert.equal(v.state,'stale')
  assert.equal(v.reason,'stale_snapshot')
  assert.equal(v.stance,'ABSTAIN')
  assert.equal(v.signalsDefined,120)
  assert.equal(v.signalsReported,9)
  assert.equal(v.familiesReported,4)
  assert.equal(v.independentlyVerifiedSignals,0)
  assert.equal(v.live,false)
  assert.equal(v.executable,false)
  assert.ok(v.ageMinutes>15)
})

test('valid snapshot even with more scored rows or a positive legacy stance remains abstain',()=>{
  const forged={...board,ts:'2026-11-13T03:39:00Z',crosscut:{
    ...board.crosscut,signals_fed:115,families_fed:12,stance:'PAPER_BIAS_LONG',reason:'crosscut'
  }}
  const v=interpretXorusSnapshot(forged,Date.parse('2026-11-13T03:40:00Z'))
  assert.equal(v.state,'paper')
  assert.equal(v.stance,'ABSTAIN')
  assert.equal(v.reason,'crosscut')
  assert.equal(v.independentlyVerifiedSignals,0)
  assert.equal(v.executable,false)
})

test('fail closed when manipulated safety flags, untrusted timestamps or invalid counts',()=>{
  const now=Date.parse('2026-11-13T03:40:00Z')
  const samples=[
    null,{}, {...board,live_locked:false},
    {...board,live_trading:true},
    {...board,crosscut:{...board.crosscut,executable:true}},
    {...board,crosscut:{...board.crosscut,signals_fed:Infinity}},
    {...board,crosscut:{...board.crosscut,signals_fed:true}},
    {...board,crosscut:{...board.crosscut,signals_defined:999}},
    {...board,ts:'2026-11-31T00:00:00Z'},
    {...board,ts:'2027-01-01T00:00:00Z'},
    {...board,snapshot_kind:'real_time'}
  ]
  for(const data of samples){
    const v=interpretXorusSnapshot(data,now)
    assert.equal(v.state,'unavailable')
    assert.equal(v.stance,'ABSTAIN')
    assert.equal(v.signalsReported,null)
    assert.equal(v.executable,false)
    assert.equal(v.live,false)
  }
})

test('public MultiversX economics are contextual and never decision eligible',()=>{
  const good=parseMultiversxEconomics({price:12.5,marketCap:1000000,volume24h:50000})
  assert.equal(good.priceUsd,12.5)
  assert.equal(good.sourceTimestampVerified,false)
  assert.equal(good.decisionEligible,false)
  assert.equal(good.provenance,'multiversx_public_api')
  for(const invalid of [null,{},[],{price:0},{price:-2},{price:NaN},{price:Infinity},{price:true},{price:'12'}]){
    assert.equal(parseMultiversxEconomics(invalid),null)
  }
})

test('readout uses real published file and no legacy fabricated market fallback',()=>{
  assert.match(page,/<XorusDecisionDesk\s*\/>/)
  assert.match(desk,/data\/xorus_board\.json/)
  assert.match(desk,/https:\/\/api\.multiversx\.com\/economics/)
  assert.match(desk,/Prix indisponible : aucune valeur de remplacement inventée/)
  assert.match(desk,/Sentinel conserve son veto/)
  assert.match(desk,/XorusSignalCatalog/)
  assert.doesNotMatch(desk,/market_snapshot\.json|CoinGecko|buyPack\(|sendTransaction\(/)
  assert.match(catalog,/defined_not_verified/)
  assert.match(catalog,/signals\.length!==120/)
})
