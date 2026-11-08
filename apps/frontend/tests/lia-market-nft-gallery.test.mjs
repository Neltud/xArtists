import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const gallery=readFileSync(new URL('../src/components/market/LiaAndEscrowNfts.tsx',import.meta.url),'utf8')
const market=readFileSync(new URL('../src/pages/MarketplacePage.tsx',import.meta.url),'utf8')
test('marketplace displays real LIA and escrow NFT inventories without claiming a sale',()=>{
 assert.match(gallery,/LIA_OPS,MAINNET_ADDRESSES/)
 assert.match(gallery,/Promise\.all\(\[read\(LIA_OPS\),read\(MAINNET_ADDRESSES\.nft_marketplace\)\]\)/)
 assert.match(gallery,/n'est pas nécessairement en vente/)
 assert.match(gallery,/sans vérification de getListing/)
 assert.match(market,/<LiaAndEscrowNfts \/>/)
})
test('NFT links are explorer-only and inventory queries are read-only',()=>{
 assert.match(gallery,/\/accounts\/.*\/nfts\?size=100/)
 assert.match(gallery,/explorer\.multiversx\.com\/nfts\//)
 assert.doesNotMatch(gallery,/method:\s*['"]POST['"]/)
 assert.doesNotMatch(gallery,/sendTransaction|signTransaction|mintNft/)
})
