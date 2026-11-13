import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {publicFreeSourcePolicy,crosscheckOpenSourceCandidates} from '../src/xorusFreeSourcePolicy.mjs'

const now=Date.parse('2026-11-13T16:30:00Z')
const base=(source_id,metric='art.collection_volume')=>({
 source_id,metric,unit:'index',value:100,
 observed_at:'2026-11-13T16:29:00Z',
})
const met=(value=100)=>({...base('met-cc0'),value,license_ref:'CC0-Met-OpenAccess',
 rights_scope:'CC0',is_public_domain:true,third_party_content:false,object_id:'A100'})
const smith=(value=101)=>({...base('smithsonian-cc0'),value,
 license_ref:'CC0-Smithsonian-OpenAccess',rights_scope:'CC0',
 is_public_domain:true,third_party_content:false,object_id:'SI-1'})
const eu=(value=100)=>({...base('eurostat','macro.inflation_rate'),unit:'percent',
 value,license_ref:'EC-2011-833-EU-Eurostat-Reuse',rights_scope:'eurostat_owned',
 third_party_content:false,dataset_id:'prc_hicp_midx',attribution_present:true})
const check=(rows,options={})=>crosscheckOpenSourceCandidates(rows,{now,...options})

test('public policy has no commercial activation, keys or licensed raw resale',()=>{
 const policy=publicFreeSourcePolicy()
 assert.equal(policy.free_only,true)
 assert.equal(policy.commercial_enabled,false)
 assert.equal(policy.autonomously_trading,false)
 assert.equal(policy.independently_verified_signals,0)
 assert.equal(policy.commercial_feed_resale_allowed,false)
 assert.deepEqual(policy.sources.map(x=>x.id).sort(),['eurostat','met-cc0','smithsonian-cc0'])
 for(const p of policy.sources){
   assert.equal(p.scoped_free_commercial_derivatives,true)
   assert.equal(p.requires_item_review,true)
   assert.match(p.rights_url,/^https:\/\//)
   assert.ok(p.license_ref)
 }
 for(const denied of ['coingecko-demo','artprice','binance-vision','binance-spot','multiversx-public-api'])
   assert.ok(policy.blocked_source_ids.includes(denied))
 assert.doesNotMatch(JSON.stringify(policy),/raw_payload|api_key|seed_phrase|wallet_private/)
})
test('two distinct CC0 art providers only yield untrusted corroboration candidate',()=>{
 const r=check([met(),smith()])
 assert.equal(r.ok,true)
 assert.equal(r.reason,'independent_candidate_not_attested')
 assert.equal(r.candidate_only,true)
 assert.equal(r.independently_verified_signals,0)
 assert.equal(r.commercial_enabled,false)
 assert.equal(r.executable,false)
 assert.equal(r.trade_authorized,false)
 assert.equal(r.independent_origins,2)
 assert.deepEqual(r.findings,[{metric:'art.collection_volume',unit:'index',sources:2,status:'corroboration_candidate'}])
 assert.doesNotMatch(JSON.stringify(r),/"value"|100|101|"object_id"/)
})
test('two mirrors from same upstream cannot meet independence',()=>{
 const r=check([met(),{...met(),source_id:'met-cc0',value:100.3}])
 assert.equal(r.ok,false)
 assert.equal(r.independently_verified_signals,0)
})
test('wrong licence, non-CC0, missing attribution, third party and stale are rejected',()=>{
 const invalid=[
 {...met(),rights_scope:'copyright'}, {...met(),is_public_domain:false},
 {...met(),third_party_content:true},{...smith(),license_ref:'CC-BY-CLAIMED'},
 {...eu(),attribution_present:false},{...eu(),rights_scope:'public-domain'},
 {...eu(),third_party_content:true},
 {...met(),observed_at:'2026-01-01T00:00:00Z'},
 {...met(),value:NaN},{...met(),value:Infinity},{...met(),value:'100'},
 {...met(),object_id:'../../secret'},{...eu(),dataset_id:'../../secret'},
 {...met(),source_id:'coingecko-demo'},
 ]
 for(const candidate of invalid){
  const r=check([candidate,smith()])
  assert.equal(r.ok,false,'Unexpected accepted '+JSON.stringify(candidate))
  assert.equal(r.independently_verified_signals,0)
 }
})
test('disagreement, mixed units, no fresh independent provider and injected context abstain',()=>{
 assert.equal(check([met(),smith(140)]).ok,false)
 assert.equal(check([{...met(),unit:'EUR'},smith()]).ok,false)
 assert.equal(check([eu()]).ok,false)
 assert.equal(check([met(),smith()],{maxDifferenceRatio:0}).reason,'invalid_crosscheck_policy')
 assert.equal(check([met(),smith()],{maxDifferenceRatio:1}).reason,'invalid_crosscheck_policy')
 assert.equal(check([met(),smith()],{ttlMs:-1}).reason,'invalid_crosscheck_policy')
 assert.equal(check([met(),smith()],{now:Infinity}).reason,'invalid_crosscheck_policy')
 assert.equal(check([met(),smith()],{now:1e120}).reason,'invalid_crosscheck_policy')
 assert.equal(check(Array.from({length:33},()=>met())).reason,'invalid_input')
})
test('server exposes read-only route only, preserves absence of trade endpoints',()=>{
 const source=readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8')
 assert.match(source,/pth === '\/v1\/xorus\/free-sources'/)
 assert.match(source,/publicFreeSourcePolicy\(\)/)
 assert.match(source,/req\.method!=='GET'/)
 assert.doesNotMatch(source,/\/v1\/xorus\/(free-sources\/execute|free-sources\/trade)/)
})
