import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const roadmap=readFileSync(new URL('../src/experience/publicReadiness.ts',import.meta.url),'utf8')
const scope=readFileSync(new URL('../../../docs/ops/MULTIVERSX_FIRST_LIVE_SCOPE_2026-11-08.md',import.meta.url),'utf8')
test('public release roadmap prioritizes EGLD marketplace, not cross-chain issue',()=>{
  assert.match(roadmap,/id: 'market'.*issue: 428/)
  assert.doesNotMatch(roadmap,/id: 'bridge', labelKey:/)
  assert.match(scope,/Solana, Polygon, OpenSea cross-chain marketplace/)
})
test('scope keeps financial activation fail-closed',()=>{
  assert.match(scope,/NO-GO for live checkout\/mint\/escrow release/)
  assert.match(scope,/Explicit operator approval/)
})
