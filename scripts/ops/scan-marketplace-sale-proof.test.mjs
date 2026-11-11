import test from 'node:test'
import assert from 'node:assert/strict'
import {scanPilotBuyerReceipt} from './scan-marketplace-sale-proof.mjs'
import {VERIFIED_MARKET_SALE} from '../../apps/frontend/src/lib/verifiedMarketplaceBuy.mjs'
const market=VERIFIED_MARKET_SALE.marketplace
const buyer='erd1'+'a'.repeat(58)
const hash='a'.repeat(64)
const nft={identifier:VERIFIED_MARKET_SALE.identifier,collection:VERIFIED_MARKET_SALE.token,
 nonce:1,balance:'1'}
const tx={txHash:hash,sender:buyer,receiver:market,status:'success',value:VERIFIED_MARKET_SALE.maxPriceAtomic,
 data:'buyNft@02',chainID:'1'}
function request({inventory=nft,rows=[tx],detailed=tx}={}){
  return async url=>({ok:true,async json(){
    if(url.includes('/transactions?'))return rows
    if(url.includes('/transactions/'+hash))return detailed
    if(url.includes('/nfts/'+VERIFIED_MARKET_SALE.identifier))return inventory
    throw Error('unknown mock '+url)
  }})
}
test('verifies only exact buy tx and recipient NFT inventory',async()=>{
  const result=await scanPilotBuyerReceipt({request:request()})
  assert.equal(result.status,'verified')
  assert.equal(result.txHash,hash)
  assert.equal(result.listingId,2)
})
test('never claims sale on missing NFT or wrong amount/receiver',async()=>{
  assert.equal((await scanPilotBuyerReceipt({request:request({inventory:{...nft,balance:'0'}})})).status,'not_verified')
  assert.equal((await scanPilotBuyerReceipt({request:request({rows:[{...tx,value:'1'}]})})).status,'not_verified')
  assert.equal((await scanPilotBuyerReceipt({request:request({rows:[{...tx,receiver:buyer}]})})).status,'not_verified')
})
test('no buyer proof when data API unavailable and bounded listing scan',async()=>{
  const request=async()=>({ok:false})
  assert.equal((await scanPilotBuyerReceipt({request})).status,'api_unavailable')
  await assert.rejects(scanPilotBuyerReceipt({request,limit:10000}),/invalid_scan_limit/)
})
