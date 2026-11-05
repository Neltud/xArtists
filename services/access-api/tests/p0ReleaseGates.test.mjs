import test from 'node:test'
import assert from 'node:assert/strict'
import {evaluateP0Gate,evaluateP0Sprint,P0_RELEASE_GATES} from '../src/p0ReleaseGates.mjs'

test('empty evidence is always NO-GO for all four P0 scopes',()=>{
 const r=evaluateP0Sprint()
 assert.equal(r.commercial_go,false)
 assert.equal(r.all_evidence_ready,false)
 assert.equal(r.results.length,4)
 for(const x of r.results) assert.equal(x.missing.length,P0_RELEASE_GATES[x.scope].length)
})
test('truthy, forged and incomplete evidence never passes',()=>{
 for(const proof of [true,{verified:'true'},{verified:true},{verified:true,evidence_sha256:'x'},{
 verified:true,evidence_sha256:'a'.repeat(64),reviewer:'',reviewed_at:'2026-11-05T00:00:00.000Z'}]){
  assert.equal(evaluateP0Gate('delivery',{production_db_bound:proof}).ready,false)
 }
})
test('fully documented evidence does not authorize commercial activation',()=>{
 const proof={verified:true,evidence_sha256:'a'.repeat(64),reviewer:'independent operator',
 reviewed_at:'2026-11-05T00:00:00.000Z'}
 const all=Object.fromEntries(P0_RELEASE_GATES.delivery.map(g=>[g,proof]))
 const r=evaluateP0Gate('delivery',all)
 assert.equal(r.ready,true)
 assert.equal(r.commercial_go,false)
})
test('unknown scopes fail closed',()=>assert.throws(()=>evaluateP0Gate('other'),/unknown_p0_scope/))
