import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {isOwnedNftListCandidate,verifyUserNftListPreflight,MARKETPLACE_MAINNET,MARKETPLACE_CODEHASH} from '../src/lib/marketplaceUserListing.mjs'
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8')
const addr='erd1'+'a'.repeat(58)
const nft={identifier:'ART-abcdef-01',collection:'ART-abcdef',nonce:1,name:'Original',type:'NonFungibleESDT',balance:'1',
  uris:['ipfs://Qm'+'a'.repeat(44)]}
const account={address:MARKETPLACE_MAINNET,codeHash:MARKETPLACE_CODEHASH,isPayable:true,code:'verified-code'}
function requestFor(row=nft,options={}){
  return async (url,opts)=>({ok:true,async json(){
    if(url.includes('/accounts/'+encodeURIComponent(addr)+'/nfts/'))return row
    if(url.endsWith('/accounts/'+MARKETPLACE_MAINNET))return {...account,...options.account}
    if(url.endsWith('/query')){
      const body=JSON.parse(opts.body)
      return {returnCode:'ok',returnData:[body.funcName==='isPaused'?(options.paused||'AA=='):(options.fee||'ASw=')]}
    }
    throw Error('Unexpected query '+url)
  }})
}
test('only owned, media-backed, non-pack NFTs are candidates',()=>{
  assert.equal(isOwnedNftListCandidate(nft),true)
  assert.equal(isOwnedNftListCandidate({...nft,balance:'0'}),false)
  assert.equal(isOwnedNftListCandidate({...nft,uris:[]}),false)
  assert.equal(isOwnedNftListCandidate({...nft,identifier:'XAIPLS-2cf72b-01',collection:'XAIPLS-2cf72b'}),false)
  assert.equal(isOwnedNftListCandidate({...nft,nonce:2}),false)
  assert.equal(isOwnedNftListCandidate({...nft,type:'FungibleESDT'}),false)
})
test('trusted independent wallet and marketplace read opens only a preflight, not a transfer',async()=>{
  const value=await verifyUserNftListPreflight({address:addr,identifier:nft.identifier,collection:nft.collection,nonce:1,request:requestFor()})
  assert.equal(value.feeBps,300)
  assert.equal(value.escrowReceiver,MARKETPLACE_MAINNET)
  assert.equal(value.owner,addr)
  assert.equal('txHash' in value,false)
})
test('reject transfer when ownership, fee, paused status, payable, codehash or API fails',async()=>{
  const opts={address:addr,identifier:nft.identifier,collection:nft.collection,nonce:1}
  for(const request of [
    requestFor({...nft,balance:'0'}),requestFor({...nft,uris:[]}),
    requestFor(nft,{account:{codeHash:'drift'}}),requestFor(nft,{account:{isPayable:false}}),
    requestFor(nft,{fee:'A+w='}),requestFor(nft,{paused:'AQ=='}),
    async()=>({ok:false})
  ]) await assert.rejects(verifyUserNftListPreflight({...opts,request}))
})
test('public Marketplace surfaces a user seller route but preserves a strict signing gate',()=>{
  const market=read('../src/pages/MarketplacePage.tsx')
  const panel=read('../src/components/MyOwnedNftsPanel.tsx')
  const sheet=read('../src/components/ListNftSheet.tsx')
  const hook=read('../src/hooks/useMarketplaceTx.ts')
  assert.match(market,/<MyOwnedNftsPanel \/>/)
  assert.match(market,/id="xa-market-sell"/)
  assert.match(panel,/disabled=\{!live \|\| !canAttemptSign \|\| !eligible/)
  assert.match(sheet,/await verifyUserNftListPreflight/)
  assert.match(sheet,/Transaction soumise — vérifier la confirmation/)
  assert.match(hook,/if \(!isMarketplaceLive\(\)\)/)
  assert.doesNotMatch(market+sheet,/AGENT_PACK_PUBLIC_COMMERCE_RELEASED\s*=\s*true|buyPack\(/)
})
