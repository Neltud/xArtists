import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {decodeListing,queryView,inspectMarketplace} from './inspect-marketplace-mainnet.mjs'

const address='erd1qqqqqqqqqqqqqpgqx0araa285cdepdsfe8s23mer30r3dh9lvhxqq8txmm'
const hash='8TTszCmNyPZXjrzQ/fSKXX8+QzW7wFtCfdmiKsZBgFc='
const registry={chain_id:'1',addresses:{nft_marketplace:address},codeHash:{nft_marketplace:hash}}
const u32=n=>{const b=Buffer.alloc(4);b.writeUInt32BE(n);return b}
const u64=n=>{const b=Buffer.alloc(8);b.writeBigUInt64BE(BigInt(n));return b}
const u16=n=>{const b=Buffer.alloc(2);b.writeUInt16BE(n);return b}
function listing({active=true,price=250000000000000000n}={}){
  const token=Buffer.from('ASFT-a6273a')
  const priceHex=price.toString(16)
  const p=Buffer.from(priceHex.padStart(priceHex.length+(priceHex.length%2),'0'),'hex')
  return Buffer.concat([Buffer.alloc(32,1),u32(token.length),token,u64(1),
    u32(p.length),p,u16(200),Buffer.alloc(32,2),Buffer.from([active?1:0])]).toString('base64')
}
function mock({paused=false,hashOverride=hash,listingError=false}={}){
  const calls=[]
  const fn=async(url,opts)=>{
    calls.push({url,opts})
    if(url.includes('/accounts/'))return {ok:true,json:async()=>({address,codeHash:hashOverride,code:'0061736d',isPayable:true})}
    const {funcName,args}=JSON.parse(opts.body)
    if(funcName==='isPaused')return {ok:true,json:async()=>({code:'successful',data:{data:{ReturnCode:0,ReturnData:[Buffer.from([paused?1:0]).toString('base64')]}}})}
    if(funcName==='getFeeBps')return {ok:true,json:async()=>({code:'successful',data:{data:{ReturnCode:0,ReturnData:[u16(300).toString('base64')]}}})}
    if(funcName==='getListing'&&!listingError&&args[0]==='01')return {ok:true,json:async()=>({code:'successful',data:{data:{ReturnCode:0,ReturnData:[listing({active:false})]}}})}
    if(funcName==='getListing'&&!listingError&&args[0]==='02')return {ok:true,json:async()=>({code:'successful',data:{data:{ReturnCode:0,ReturnData:[listing()]}}})}
    return {ok:true,json:async()=>({code:'successful',data:{data:{ReturnCode:4,ReturnData:[]}}})}
  }
  return {fetchImpl:fn,calls}
}

test('only exact active on-chain listing is shown; historical #1 stays inactive',async()=>{
 const m=mock()
 const x=await inspectMarketplace({registry,fetchImpl:m.fetchImpl})
 assert.equal(x.activeListings.length,1)
 assert.equal(x.activeListings[0].id,2)
 assert.equal(x.activeListings[0].priceAtomic,'250000000000000000')
 assert.equal(x.codehashMatchesRegistry,true)
 assert.equal(x.publicPurchaseReleased,false)
 assert.equal(x.ownerSignedProofComplete,false)
 assert.equal(x.feeBps,300)
 assert.ok(m.calls.every(q=>!q.opts||q.opts.method==='POST'))
 assert.ok(m.calls.filter(q=>q.opts).every(q=>q.url.endsWith('/vm-values/query')))
 assert.ok(m.calls.filter(q=>q.opts).every(q=>JSON.parse(q.opts.body).value===undefined))
})

test('paused market does not silently imply public purchases',async()=>{
 const m=mock({paused:true})
 const x=await inspectMarketplace({registry,fetchImpl:m.fetchImpl})
 assert.equal(x.paused,true)
 assert.equal(x.publicPurchaseReleased,false)
})

test('codehash mismatch fails closed before any view query',async()=>{
 const m=mock({hashOverride:'different'})
 await assert.rejects(inspectMarketplace({registry,fetchImpl:m.fetchImpl}),/codehash_or_payable_mismatch/)
 assert.equal(m.calls.length,1)
})

test('unavailable view never invents an active listing',async()=>{
 const m=mock({listingError:true})
 const x=await inspectMarketplace({registry,fetchImpl:m.fetchImpl})
 assert.deepEqual(x.activeListings,[])
 assert.equal(x.listings.length,0)
})

test('reject malformed payloads, trailing bytes and invalid prices',()=>{
 assert.equal(decodeListing('not base64',1),null)
 assert.equal(decodeListing(listing().slice(0,-3),1),null)
 assert.equal(decodeListing(Buffer.concat([Buffer.from(listing(),'base64'),Buffer.from([4])]).toString('base64'),1),null)
 assert.equal(decodeListing(listing({price:0n}),1),null)
})

test('untrusted chain or known-empty legacy placeholder cannot pass',async()=>{
 await assert.rejects(inspectMarketplace({registry:{...registry,chain_id:'D'},fetchImpl:mock().fetchImpl}),/wrong_chain/)
 await assert.rejects(inspectMarketplace({registry:{...registry,addresses:{nft_marketplace:'erd1qqqqqqqqqqqqqpgqjzn7zjyevwez8n0zfevpvnrwyp2ln879yj7sj8354t'}},fetchImpl:mock().fetchImpl}),/untrusted_registry/)
})

test('queries are read only and VM errors fail closed',async()=>{
 await assert.rejects(queryView(async()=>({ok:true,json:async()=>({data:{data:{ReturnCode:4,ReturnData:['AQ==']}},code:'successful'})}),address,'getListing',['02']),/vm_query_failed/)
 const source=readFileSync(new URL('./inspect-marketplace-mainnet.mjs',import.meta.url),'utf8')
 assert.doesNotMatch(source,/transaction\/send|sendTransaction|signTransaction|broadcast|privateKey|PEM=/)
})
