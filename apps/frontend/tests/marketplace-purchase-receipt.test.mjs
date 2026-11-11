import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {verifyMarketplacePurchaseReceipt as verify} from '../src/lib/marketplacePurchaseReceipt.mjs'
import {VERIFIED_MARKET_SALE} from '../src/lib/verifiedMarketplaceBuy.mjs'

const hash='a'.repeat(64)
const buyer='erd1kex0pvp9dng8j76sgsejkyx86nhxuqk24my6wnha8dga9mymvhxqvl8v0g'
const tx={status:'success',sender:buyer,receiver:VERIFIED_MARKET_SALE.marketplace,
  value:VERIFIED_MARKET_SALE.maxPriceAtomic,data:'YnV5TmZ0QDAy',chainID:'1'}
const nft={identifier:VERIFIED_MARKET_SALE.identifier,collection:VERIFIED_MARKET_SALE.token,nonce:1,balance:'1'}
const success=x=>({ok:true,async json(){return x}})
function mock({record=tx,holding=nft,txOk=true,nftOk=true}={}) {
  const urls=[]
  const request=async(url,options)=>{
    urls.push({url,options})
    if(url.includes('/transactions/'))return txOk?success(record):{ok:false}
    if(url.includes('/nfts/'))return nftOk?success(holding):{ok:false}
    throw Error('Unknown endpoint')
  }
  return {request,urls}
}
test('proof requires buyer-specific successful tx + actual buyer NFT holdings',async()=>{
  const m=mock(), result=await verify({hash,address:buyer,request:m.request})
  assert.deepEqual(result,{status:'verified',hash})
  assert.equal(m.urls.length,2)
  assert.equal(m.urls[0].url,'https://api.multiversx.com/transactions/'+hash+'?withResults=true')
  assert.equal(m.urls[1].url,'https://api.multiversx.com/accounts/'+buyer+'/nfts/ASFT-a6273a-01')
  assert.ok(m.urls.every(x=>x.options.method==='GET'))
  assert.ok(m.urls.every(x=>x.options.cache==='no-store'))
})
test('malformed address/hash cannot trigger even a read-only network call',async()=>{
  for(const input of [{hash:'0x'+hash,address:buyer},{hash:'bad',address:buyer},
     {hash,address:'erd1bad'},{hash:42,address:buyer}]) {
    const m=mock();assert.equal((await verify({...input,request:m.request})).status,'invalid')
    assert.equal(m.urls.length,0)
  }
})
test('no claimed delivery for pending, rejected or missing transactions',async()=>{
  for(const status of ['pending','unknown','invalid','failed',undefined]) {
    const m=mock({record:{...tx,status}})
    const result=await verify({hash,address:buyer,request:m.request})
    assert.equal(result.status,status==='invalid'||status==='failed'?'failed':'pending')
    assert.equal(m.urls.length,1)
  }
  const m=mock({txOk:false})
  assert.equal((await verify({hash,address:buyer,request:m.request})).status,'unavailable')
})
test('wrong sender, receiver, price, calldata or chain can never claim ownership proof',async()=>{
  for(const record of [
    {...tx,sender:'erd1'+('q'.repeat(58))}, {...tx,receiver:'erd1'+('q'.repeat(58))},
    {...tx,value:'1'}, {...tx,data:'ESDTNFTTransfer'},
    {...tx,data:'YnV5TmZ0QDAx'}, {...tx,chainID:'D'},
  ]) {
    const m=mock({record})
    assert.equal((await verify({hash,address:buyer,request:m.request})).status,'mismatch')
    assert.equal(m.urls.length,1)
  }
})
test('success without exact NFT delivery is still not success',async()=>{
  for(const holding of [null,{...nft,balance:'0'},{...nft,identifier:'OTHER-a6273a-01'},
    {...nft,nonce:2},{...nft,collection:'OTHER-a6273a'},{}]) {
    const m=mock({holding})
    assert.equal((await verify({hash,address:buyer,request:m.request})).status,'delivery_unverified')
  }
  const m=mock({nftOk:false})
  assert.equal((await verify({hash,address:buyer,request:m.request})).status,'delivery_unverified')
})
test('frontend never marks wallet-hook / SDK submitted prompt as chain transaction',()=>{
  const src=readFileSync(new URL('../src/components/market/MarketplaceVerifiedBuy.tsx',import.meta.url),'utf8')
  const grid=readFileSync(new URL('../src/components/market/MarketplaceDiscoveryGrid.tsx',import.meta.url),'utf8')
  const locale=readFileSync(new URL('../src/experience/locale.ts',import.meta.url),'utf8')
  assert.match(src,/result\.sessionId&&\/\^\[a-f0-9\]\{64\}\$\/i\.test\(result\.sessionId\)/)
  assert.match(src,/setTxHash\(result\.sessionId\)/)
  assert.match(src,/aucun hash blockchain confirmé/)
  assert.match(src,/verifyMarketplacePurchaseReceipt\(\{hash:txHash\.trim\(\),address\}\)/)
  assert.match(src,/onClick=\{disconnect\}/)
  assert.match(src,/receiptSequence\.current\+=1/)
  assert.match(src,/\},\[address\]\)/)
  assert.match(src,/getXPortalSession\(\)\?\.address\?\.toLowerCase\(\)/)
  assert.match(grid,/onQuoteStatus=\{setVerifiedSaleStatus\}/)
  assert.match(grid,/verifiedSaleStatus==='verified'/)
  assert.match(locale,/marketGridVerifiedSale:/)
  assert.match(locale,/marketStatusOff: \["Ventes générales désactivées/)
  assert.doesNotMatch(src,/autoBroadcast|markListingSold|purchaseConfirmed\s*=\s*true/)
})


test('NFT detail quote uses live 3 percent fee, includes royalties and rejects >10 percent total',()=>{
  const status=readFileSync(new URL('../src/config/scStatus.ts',import.meta.url),'utf8')
  const detail=readFileSync(new URL('../src/components/NFTDetailModal.tsx',import.meta.url),'utf8')
  assert.match(status,/NFT_MARKET_FEE_BPS = 300/)
  assert.match(detail,/function feeSplit\(price: number, feeBps: number, royaltyBps: number\)/)
  assert.match(detail,/const royalty = \(price \* royaltyBps\) \/ 10_000/)
  assert.match(detail,/toSeller: price - fee - royalty/)
  assert.match(detail,/royaltyPlusFee > 1_000/)
  assert.match(detail,/disabled=\{txDisabled \|\| royaltyPlusFee > 1_000\}/)
  assert.doesNotMatch(detail,/royaltyPlusFee > 10_000/)
})
