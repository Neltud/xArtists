import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'

const runtime = readFileSync(new URL('../src/lib/runtimeCodehash.ts', import.meta.url),'utf8')
const status = readFileSync(new URL('../src/config/scStatus.ts', import.meta.url),'utf8')
const auction = readFileSync(new URL('../src/pages/AuctionPage.tsx', import.meta.url),'utf8')

test('marketplace fails closed unless fresh contract hash AND isPayable true',()=>{
  assert.match(runtime,/j\.key === 'marketplace'/)
  assert.match(runtime,/cache\.marketplace = okHash && acc\.isPayable === true/)
  assert.match(runtime,/if \(!acc\) \{\s*cache\[j\.key\] = false/s)
  assert.match(runtime,/MAX_AGE_MS = 5 \* 60 \* 1000/)
  assert.match(status,/isLiveGate\(MARKETPLACE_LIVE, runtimeCodehashOk\('marketplace'\)\)/)
})

test('marketplace unlock cannot be based only on a compile-time flag',()=>{
  const match=status.match(/export function canListBuyNft\(\): boolean \{([\s\S]*?)\n\}/)
  assert.ok(match,'expected a safety gate for listing/buying')
  assert.match(match[1],/runtimeCodehashOk\('marketplace'\)/)
  assert.match(match[1],/isLiveGate\(/)
})

test('public auction page does not have a bid transaction button',()=>{
  assert.match(auction,/aucune enchère ni adjudication réelle n’est acceptée actuellement/)
  assert.doesNotMatch(auction,/placeBid\s*\(/)
  assert.doesNotMatch(auction,/sendTransaction\s*\(/)
})
