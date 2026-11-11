import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {isStaleEntityReview as stale} from '../src/lib/entityReviewStaleness.mjs'
const now=Date.parse('2026-11-11T17:00:00Z')
test('old August network review can never be treated as current GO verdict',()=>{
 assert.equal(stale('2026-08-27',now),true)
 assert.equal(stale('2026-11-10',now),false)
 assert.equal(stale('2026-10-20',now),true)
 assert.equal(stale(undefined,now),true)
})
test('impossible dates, unknown clocks and future reports fail closed',()=>{
 for(const date of ['2026-02-30','2026-11-31','2027-01-01','11/11/2026','',null,42])
   assert.equal(stale(date,now),true)
 assert.equal(stale('2026-11-10',NaN),true)
 assert.equal(stale('2026-11-10',now,0),true)
})
test('network view does not render a stale green GO card or obsolete codeHash null claim',()=>{
 const ui=readFileSync(new URL('../src/pages/EntityMap.tsx',import.meta.url),'utf8')
 assert.match(ui,/const reviewStale = isStaleEntityReview\(review\?\.date\)/)
 assert.match(ui,/!reviewStale && verdict\.includes\('GO'\)/)
 assert.match(ui,/ARCHIVE · REVALIDATION REQUISE/)
 assert.match(ui,/Ancienne roadmap P0–P2 \(archive\)/)
 assert.match(ui,/to="\/marketplace"/)
 assert.doesNotMatch(ui,/Marketplace & agents on-chain : codeHash null/)
 assert.doesNotMatch(ui,/\$\{xaRender\('\{'\)/)
});
