import test from 'node:test'
import assert from 'node:assert/strict'
import {VERIFIED_MARKET_SALE as market,readVerifiedListing,readLiveMarketplaceListings,listingIdHex,listingIdsFromEvents} from '../src/lib/verifiedMarketplaceBuy.mjs'
import {verifyLiveListingReceipt,verifySellerListingReceipt} from '../src/lib/marketplacePurchaseReceipt.mjs'
const token='ART-abcdef',identifier=token+'-01',price='250000000000000001'
const uint=(n,size)=>{const b=Buffer.alloc(size);let v=BigInt(n);for(let i=size-1;i>=0;i--){b[i]=Number(v&255n);v>>=8n}return b}
function fixture(active=true,sellerBytes=Buffer.alloc(32,1)){const t=Buffer.from(token),p=uint(price,8);return Buffer.concat([sellerBytes,uint(t.length,4),t,uint(1,8),uint(p.length,4),p,uint(200,2),Buffer.alloc(32),uint(active?1:0,1)]).toString('base64')}
const response=value=>({ok:true,json:async()=>value})
const seller='erd1'+'q'.repeat(58)
const listingTx=(id,changes={})=>({status:'success',function:'listNft',sender:seller,
 logs:{events:[{address:market.marketplace,identifier:'listNft',topics:['bGlzdA==',uint(id,8).toString('base64'),Buffer.alloc(32).toString('base64')]}]},...changes})
function rpc({escrow=true,active=true,id=1,history=[listingTx(id)],sellerBytes=Buffer.alloc(32,1)}={}){
 const calls=[]
 const request=async(url,opts)=>{
  if(url.endsWith('/nfts?size=100'))return response(escrow?[{identifier,collection:token,balance:'1',nonce:1}]:[])
  if(url.endsWith('/accounts/'+market.marketplace))return response({address:market.marketplace,codeHash:market.codeHash,isPayable:true,code:'abcd'})
  if(url.includes('/transactions?function=listNft'))return response(history)
  const q=JSON.parse(opts.body);calls.push(q)
  const data=q.funcName==='isPaused'?['']:q.funcName==='getFeeBps'?['ZA==']:q.args[0]===listingIdHex(id)?[fixture(active,sellerBytes)]:[]
  return response({code:'successful',data:{data:{ReturnCode:0,ReturnData:data}}})
 }
 return {request,calls}
}
test('real escrow and active listing are required; price retains all decimals',async()=>{
 const q=await readVerifiedListing(1,rpc())
 assert.equal(q.identifier,identifier);assert.equal(q.priceAtomic,price);assert.equal(q.priceEgld,'0.250000000000000001')
 assert.equal(listingIdHex(256),'0100')
 await assert.rejects(readVerifiedListing(1,rpc({escrow:false})))
 await assert.rejects(readVerifiedListing(1,rpc({active:false})))
})
test('empty escrow does not generate fictional listings',async()=>{
 const mock=rpc({escrow:false})
 assert.deepEqual(await readLiveMarketplaceListings(mock),{listings:[],limited:false,nextFrom:null})
 assert.equal(mock.calls.some(c=>c.funcName==='getListing'),false)
 const available=await readLiveMarketplaceListings(rpc())
 assert.equal(available.listings.length,1);assert.equal(available.listings[0].listingId,1)
})
test('successful payment alone is insufficient without matching NFT transfer and holding',async()=>{
 const address='erd1'+'q'.repeat(58),hash='a'.repeat(64),quote=await readVerifiedListing(1,rpc())
 const tx={txHash:hash,status:'success',sender:address,receiver:market.marketplace,value:price,data:'buyNft@01'}
 const transfer={type:'nft',action:'transfer',sender:market.marketplace,receiver:address,identifier,value:'1'}
 const verify=(op,balance='1')=>verifyLiveListingReceipt({hash,address,quote,request:async url=>response(url.includes('/transactions/')?{...tx,operations:op} :{identifier,balance})})
 assert.equal((await verify([transfer])).status,'verified')
 assert.equal((await verify([{...transfer,receiver:market.marketplace}])).status,'delivery_unverified')
 assert.equal((await verify([transfer],'0')).status,'delivery_unverified')
})

test('permissionless listing discovery uses authenticated contract event identity and arbitrary IDs',async()=>{
 const foreign=listingTx(80)
 foreign.logs.events[0].address='wrong-contract'
 assert.deepEqual(listingIdsFromEvents([listingTx(250),listingTx(250),foreign,listingTx(3,{status:'fail'})]),[250])
 const result=await readLiveMarketplaceListings(rpc({id:250,history:[listingTx(250)]}))
 assert.equal(result.listings[0].listingId,250)
 assert.equal(result.nextFrom,null)
 const page=await readLiveMarketplaceListings({...rpc({id:250,history:Array.from({length:20},()=>listingTx(250))}),from:20})
 assert.equal(page.nextFrom,40)
 assert.equal(page.limited,true)
 assert.equal(page.listings.length,1)
 await assert.rejects(readLiveMarketplaceListings({...rpc(),from:-20}))
})

test('seller receipt requires the exact successful deposit event and matching active quote',async()=>{
 const hash='b'.repeat(64),id=250
 const tx={...listingTx(id),txHash:hash,receiver:seller,value:'0',action:{arguments:{receiver:market.marketplace,functionName:'listNft',transfers:[{identifier,value:'1'}]}}}
 const verify=(changes={},opts={})=>{
   const base=rpc({id,sellerBytes:Buffer.alloc(32),...opts}).request
   return verifySellerListingReceipt({hash,address:seller,identifier,priceAtomic:price,request:async(url,options)=>url.includes('/transactions/'+hash)?response({...tx,...changes}):base(url,options)})
 }
 assert.deepEqual(await verify(),{status:'verified',hash,listingId:id})
 assert.equal((await verify({status:'pending'})).status,'pending')
 assert.equal((await verify({sender:'wrong'})).status,'mismatch')
 assert.equal((await verify({logs:{events:[]}})).status,'delivery_unverified')
 assert.equal((await verify({},{active:false})).status,'delivery_unverified')
 assert.equal((await verify({},{escrow:false})).status,'delivery_unverified')
})
