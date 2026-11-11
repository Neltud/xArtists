import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8')
const gates=read('../src/config/scStatus.ts')
const lib=read('../src/lib/scStatus.ts')
const readiness=read('../src/hooks/useMarketplaceReadiness.ts')
const hook=read('../src/hooks/useMarketplaceTx.ts')
const sheet=read('../src/components/ListNftSheet.tsx')
const panel=read('../src/components/MyOwnedNftsPanel.tsx')

test('seller NFT escrow uses fresh runtime codehash; buy/bid remain build gated',()=>{
 assert.match(gates,/export function canListOwnedNft\(\)/)
 assert.match(gates,/runtimeCodehashOk\('marketplace'\)/)
 assert.match(gates,/export function canListBuyNft\(\)/)
 assert.match(gates,/isLiveGate\(MARKETPLACE_LIVE, runtimeCodehashOk\('marketplace'\)\)/)
 assert.match(lib,/export function isMarketplaceListingLive\(\)/)
})
test('only signed listNft uses owner-specific readiness and independent royalty checks',()=>{
 assert.match(hook,/kind === 'list'/)
 assert.match(hook,/if \(!isMarketplaceListingLive\(\)\)/)
 assert.match(hook,/if \(!isMarketplaceLive\(\)\)/)
 assert.match(hook,/marketplaceUserListingReceiverOrThrow\(\)/)
 assert.match(hook,/verifyUserNftListPreflight/)
 assert.match(hook,/bech32ToHex\(proof\.royaltyReceiver\)/)
 assert.match(sheet,/useMarketplaceReadiness\('seller'\)/)
 assert.match(panel,/useMarketplaceReadiness\('seller'\)/)
 assert.match(readiness,/canListOwnedNft/)
})
test('seller preflight and runtime observation never send transactions themselves',()=>{
 assert.doesNotMatch(readiness+gates,/sendTransaction\(|mintNft\(|window\.ethereum/)
 assert.match(hook,/chainID: '1'/)
})
