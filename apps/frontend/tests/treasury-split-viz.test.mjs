import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const src = fs.readFileSync(new URL('../src/components/treasury/TreasurySplitViz.tsx', import.meta.url), 'utf8')
const burn = fs.readFileSync(new URL('../src/components/treasury/TroBurnFeed.tsx', import.meta.url), 'utf8')

test('fee rule is the deploy-script 40/30/20/10 and is not a balance', () => {
  assert.match(src, /label: 'Mission', pct: 40/)
  assert.match(src, /label: 'Reserve', pct: 30/)
  assert.match(src, /label: 'Reward', pct: 20/)
  assert.match(src, /label: 'Ops', pct: 10/)
  assert.match(src, /Treasury rule, not a balance/)
  assert.match(src, /contract is not deployed/)
  assert.match(src, /not the burned TRO/)
  assert.match(src, /pool, stake, rewards and burn/)
  assert.match(src, /onMouseEnter/)
  assert.match(src, /motion-reduce:transition-none/)
  assert.doesNotMatch(src, /receiveAndSplit|setSplitBps|--send/)
})

test('burn feed stays a destroyed-token total, not a treasury slice', () => {
  assert.match(burn, /not a slice of the treasury rule/)
  assert.match(burn, /tokens\/TRO-94c925/)
})
