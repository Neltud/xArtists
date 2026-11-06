import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'

const s=readFileSync(new URL('../src/components/market/ExistingNftReadiness.tsx',import.meta.url),'utf8')
const market=readFileSync(new URL('../src/pages/MarketplacePage.tsx',import.meta.url),'utf8')

test('existing NFT per-collection discovery is wallet-scoped and read only',()=>{
  assert.match(s,/useWallet\(\)/)
  assert.match(s,/api\.multiversx\.com\/accounts\//)
  assert.match(s,/\.filter\(\(n\): n is OwnedNft/)
  assert.match(s,/new Map<string,OwnedNft\[\]>\(\)/)
  assert.match(market,/<ExistingNftReadiness\s*\/>/)
  for(const forbidden of ['sendTransaction(', 'ESDTNFTTransfer(', 'ESDTNFTCreate(', 'ESDTNFTAddURI(', 'buyRandom(', 'send([']) {
    assert.ok(!s.includes(forbidden),'unexpected fund or NFT moving call: '+forbidden)
  }
})

test('export is an off-chain EGLD draft never a transaction',()=>{
  assert.match(s,/status: 'NOT_LISTED'/)
  assert.match(s,/walletSignatureRequired: true/)
  assert.match(s,/transactionHash: null/)
  assert.match(s,/settlementVerified: false/)
  assert.match(s,/mediaReadbackVerified: false/)
  assert.match(s,/10n \*\* 18n/)
})

test('missing on-chain URI never implies content is pinned',()=>{
  assert.match(s,/mediaUriPresent/)
  assert.match(s,/récupération IPFS non vérifiée/)
  assert.match(s,/Image\/URI manquante/)
  assert.match(s,/Les droits de vente et la propriété doivent être revérifiés/)
})
