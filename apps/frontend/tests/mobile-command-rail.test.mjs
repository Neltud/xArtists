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
