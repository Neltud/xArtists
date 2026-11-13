import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const source=p=>readFileSync(new URL(p,import.meta.url),'utf8')
const analytics=source('../src/pages/MarketAnalyticsPage.tsx')
const oldMatrix=source('../src/components/lia/MatrixBoard.tsx')
const desk=source('../src/components/intelligence/XorusDecisionDesk.tsx')

test('public analytics serves actual source-backed xOrus decision, not simulated LIA table',()=>{
  assert.match(analytics,/import XorusDecisionDesk/)
  assert.match(analytics,/<XorusDecisionDesk\s*\/>/)
  assert.match(analytics,/import MarketPage from/)
  assert.match(analytics,/Les anciens tableaux de scores construits à partir de prix fictifs ont été retirés/)
  assert.doesNotMatch(analytics,/import MatrixBoard|<MatrixBoard/)
  assert.match(desk,/data\/xorus_board\.json/)
  assert.match(desk,/ABSTAIN|S’ABSTENIR/)
  assert.match(desk,/parseMultiversxEconomics/)
})

test('retired LIA matrix uses arbitrary prices and must never mount in public analytics',()=>{
  assert.match(oldMatrix,/px\.priceUsd \* \(a\.id === 'TRO' \? 0\.001 : 20\)/)
  assert.match(oldMatrix,/sentiment: 0\.1/)
  assert.match(oldMatrix,/confidence: 0\.55/)
  assert.doesNotMatch(analytics,/matrixFromPulse|runDecisionCycle/)
})
