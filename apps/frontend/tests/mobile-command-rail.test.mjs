import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const rail = readFileSync(new URL('../src/command-center/LivePriceRail.tsx', import.meta.url), 'utf8')
const tape = readFileSync(new URL('../src/components/LiveAssetTape.tsx', import.meta.url), 'utf8')

test('Command Center price panel stays in normal document flow on narrow screens', () => {
  assert.match(rail, /data-overlay-rail w-full min-w-0/)
  assert.match(rail, /grid-cols-2/)
  assert.match(rail, /sm:grid-cols-4/)
  assert.doesNotMatch(rail, /data-overlay-rail absolute/)
})

test('Market tape reports unavailable sources rather than a false LIVE price', () => {
  assert.match(tape, /hasMarketPrices = rows.some/)
  assert.match(tape, /SOURCES INDISPONIBLES/)
  assert.match(tape, /hasMarketPrices && ts/)
})

test('market quotes are first in xOrus and Agents; sources are individually dated',()=>{
 const xorus=readFileSync(new URL('../src/pages/XorusPage.tsx',import.meta.url),'utf8')
 const agents=readFileSync(new URL('../src/pages/Agents.tsx',import.meta.url),'utf8')
 assert.ok(xorus.indexOf('<LiveAssetTape/>')<xorus.indexOf('<XorusDecisionDesk />'))
 assert.ok(agents.indexOf('<LiveAssetTape/>')<agents.indexOf('<XorusAgentEvidence />'))
 assert.match(tape,/include_last_updated_at=true/)
 assert.match(tape,/api\.gold-api\.com\/price\//)
 assert.match(tape,/row\.at\?new Date\(row\.at\)/)
 assert.match(tape,/PAXG est un jeton/)
 assert.doesNotMatch(tape,/AbortSignal\.timeout/)
})
