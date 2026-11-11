import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {
 VERIFIED_MARKET_SALE,decodeMarketplaceListing,readVerifiedSale,addressHex,
} from '../src/lib/verifiedMarketplaceBuy.mjs'

const u32=x=>{const b=Buffer.alloc(4);b.writeUInt32BE(x);return b}
const u16=x=>{const b=Buffer.alloc(2);b.writeUInt16BE(x);return b}
const u64=x=>{const b=Buffer.alloc(8);b.writeBigUInt64BE(BigInt(x));return b}
const fixture=({active=true,token='ASFT-a6273a',price=250000000000000000n,royalty=500}={})=>{
 const ph=price.toString(16)
 const p=Buffer.from(ph.padStart(Math.ceil(ph.length/2)*2,'0'),'hex')
 const t=Buffer.from(token)
 return Buffer.concat([Buffer.alloc(32,1),u32(t.length),t,u64(1),u32(p.length),p,u16(royalty),Buffer.alloc(32,2),Buffer.from([active?1:0])]).toString('base64')
}
const success=data=>({ok:true,async json(){return data}})
function mock({active=true,paused=false,fee=300,price=250000000000000000n,escrow=true,
  codeHash=VERIFIED_MARKET_SALE.codeHash,payable=true,royalty=500,gatewayOk=true}={}){
 const calls=[]
 const request=async(url,opts)=>{
  calls.push({url,opts})
  if(url.endsWith('/nfts?size=100'))return success(escrow?[{
    identifier:VERIFIED_MARKET_SALE.identifier,collection:VERIFIED_MARKET_SALE.token,nonce:1,balance:'1',
  }]:[])
  if(url.endsWith('/accounts/'+VERIFIED_MARKET_SALE.marketplace))
    return success({address:VERIFIED_MARKET_SALE.marketplace,codeHash,isPayable:payable,code:'0061736d'})
  const {funcName}=JSON.parse(opts.body)
  const d=funcName==='isPaused'?[paused?'AQ==':'']:
    funcName==='getFeeBps'?[u16(fee).toString('base64')]:[fixture({active,price,royalty})]
  if(url==='https://api.multiversx.com/query')return success({returnCode:'ok',returnMessage:'',returnData:d})
  if(!gatewayOk)throw Error('cross_origin_gateway_unavailable')
  return success({code:'successful',data:{data:{ReturnCode:'ok',ReturnMessage:'',ReturnData:d}}})
 }
 return {request,calls}
}
test('listing #2 0.25 EGLD only after real escrow and VM views',async()=>{
 const m=mock()
 const q=await readVerifiedSale({request:m.request})
 assert.equal(q.priceAtomic,'250000000000000000')
 assert.equal(q.priceEgld,'0.25')
 assert.equal(q.listingId,2)
 assert.equal(q.identifier,'ASFT-a6273a-01')
 assert.equal(q.feeBps,300)
 assert.equal(q.royaltyBps,500)
 assert.equal(m.calls.length,5)
 for(const x of m.calls) {
   assert.ok(x.url.startsWith('https://api.multiversx.com/accounts/')||
     x.url==='https://gateway.multiversx.com/vm-values/query')
   if(x.url.includes('/vm-values/query')) {
     assert.equal(x.opts.method,'POST')
     const body=JSON.parse(x.opts.body)
     assert.equal(body.scAddress,VERIFIED_MARKET_SALE.marketplace)
     assert.ok(['isPaused','getFeeBps','getListing'].includes(body.funcName))
     assert.equal(body.value,undefined)
   }
 }
})
test('rejects missing NFT, cancelled/paused/repriced listing, mismatched SC',async()=>{
 for(const opts of [{active:false},{paused:true},{price:500000000000000000n},
  {escrow:false},{codeHash:'changed'},{payable:false},{royalty:900},{fee:600}]) {
   await assert.rejects(readVerifiedSale({request:mock(opts).request}),/marketplace_live_listing_unavailable/)
 }
})
test('safe API /query fallback when gateway is inaccessible in the browser',async()=>{
 const m=mock({gatewayOk:false})
 const q=await readVerifiedSale({request:m.request})
 assert.equal(q.priceAtomic,'250000000000000000')
 assert.ok(m.calls.some(x=>x.url==='https://api.multiversx.com/query'))
})
test('truncated/invalid VM payloads cannot be interpreted as a valid listing',()=>{
 const listing=decodeMarketplaceListing(fixture(),2)
 assert.equal(listing?.active,true)
 assert.equal(decodeMarketplaceListing(fixture({active:false}),2)?.active,false)
 assert.equal(decodeMarketplaceListing('not base64',2),null)
 assert.equal(decodeMarketplaceListing(Buffer.from('short').toString('base64'),2),null)
 assert.equal(addressHex('not-a-wallet'),null)
})
test('single-listing wallet UI rechecks quote and uses existing user signer only',()=>{
 const ui=readFileSync(new URL('../src/components/market/MarketplaceVerifiedBuy.tsx',import.meta.url),'utf8')
 const grid=readFileSync(new URL('../src/components/market/MarketplaceDiscoveryGrid.tsx',import.meta.url),'utf8')
 const gate=readFileSync(new URL('../src/config/scStatus.ts',import.meta.url),'utf8')
 assert.match(grid,/card\.key==='escrow:ASFT-a6273a-01'&&<MarketplaceVerifiedBuy\/>/)
 assert.match(grid,/new URLSearchParams\(window\.location\.search\)\.get\('buy'\)!=='2'/)
 assert.match(ui,/const fresh=await readVerifiedSale\(\)/)
 assert.match(ui,/receiver:VERIFIED_MARKET_SALE\.marketplace/)
 assert.match(ui,/value:fresh\.priceAtomic/)
 assert.match(ui,/data:'buyNft@02'/)
 assert.match(ui,/chainID:'1'/)
 assert.match(ui,/connected&&canAttemptSign&&!isLiaAddress&&!seller/)
 assert.match(ui,/requestOpenConnect/)
 assert.match(ui,/result\.error/)
 assert.doesNotMatch(ui,/markListingSold|setMarketplaceLive|mintNFT|transferValueOnly/)
 assert.match(gate,/AGENT_PACK_PUBLIC_COMMERCE_RELEASED = false/)
})
