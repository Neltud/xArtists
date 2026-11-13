import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {isOwnedNftListCandidate,verifyUserNftListPreflight,hasNftMediaUri,nftIdentifier,MARKETPLACE_MAINNET,MARKETPLACE_CODEHASH} from '../src/lib/marketplaceUserListing.mjs'
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8')
const addr='erd1'+'a'.repeat(58)
const nft={identifier:'ART-abcdef-01',collection:'ART-abcdef',nonce:1,name:'Original',type:'NonFungibleESDT',balance:'1',
  uris:['ipfs://Qm'+'a'.repeat(44)]}
const account={address:MARKETPLACE_MAINNET,codeHash:MARKETPLACE_CODEHASH,isPayable:true,code:'verified-code'}
const creator='erd1'+'b'.repeat(58)
const meta={identifier:nft.identifier,collection:nft.collection,nonce:nft.nonce,royalties:5,creator}
function requestFor(row=nft,options={}){
  return async (url,opts)=>({ok:true,async json(){
    if(url.includes('/accounts/'+encodeURIComponent(addr)+'/nfts/'))return row
    if(url.endsWith('/nfts/'+encodeURIComponent(nft.identifier)))return {...meta,...options.nft}
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
  assert.equal(value.royaltyBps,500)
  assert.equal(value.royaltyReceiver,creator)
  assert.equal('txHash' in value,false)
})
test('reject transfer when ownership, fee, paused status, payable, codehash or API fails',async()=>{
  const opts={address:addr,identifier:nft.identifier,collection:nft.collection,nonce:1}
  for(const request of [
    requestFor({...nft,balance:'0'}),requestFor({...nft,uris:[]}),
    requestFor(nft,{account:{codeHash:'drift'}}),requestFor(nft,{account:{isPayable:false}}),
    requestFor(nft,{fee:'A+w='}),requestFor(nft,{paused:'AQ=='}),
    requestFor(nft,{nft:{creator:undefined}}),
    requestFor(nft,{nft:{royalties:8}}),
    requestFor(nft,{nft:{royalties:undefined}}),
    requestFor(nft,{nft:{collection:'OTHER-abcdef'}}),
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
  assert.match(panel,/disabled=\{!eligible \|\| account.loading \|\| !!account.error\}/)
  assert.match(panel,/live&&canAttemptSign \? 'Mettre en vente' : 'Préparer la mise en vente'/)
  assert.match(sheet,/disabled=\{pending \|\| checking \|\| !live \|\| !connected \|\| !canAttemptSign\}/)
  assert.match(sheet,/await verifyUserNftListPreflight/)
  assert.match(sheet,/Transaction soumise — vérifier la confirmation/)
  assert.match(hook,/if \(!isMarketplaceLive\(\)\)/)
  assert.match(hook,/await verifyUserNftListPreflight/)
  assert.match(hook,/const recvHex = bech32ToHex\(proof\.royaltyReceiver\)/)
  assert.doesNotMatch(hook,/royaltyReceiver \|\| address|p\.royaltyBps \?\? 500/)
  assert.match(sheet,/currentQuote\s*\? 'Signer listNft'/)
  assert.doesNotMatch(market+sheet,/AGENT_PACK_PUBLIC_COMMERCE_RELEASED\s*=\s*true|buyPack\(/)
})


test('API base64 URI is eligible without trusting media thumbnails',()=>{
  const uri='https://ipfs.io/ipfs/Qm'+'a'.repeat(44)+'/image.png'
  assert.equal(isOwnedNftListCandidate({...nft,uris:[btoa(uri)]}),true)
  for(const value of ['javascript:alert(1)','data:image/png;base64,AA==','https://',
    'https://user:password@example.com/a','https://example.com/\nimage','invalid base64']) {
    assert.equal(hasNftMediaUri([value]),false,value)
    assert.equal(hasNftMediaUri([btoa(value)]),false,value)
  }
  assert.equal(hasNftMediaUri([btoa(btoa(uri))]),false)
  assert.equal(hasNftMediaUri([btoa('https://example.com/'+'a'.repeat(2048))]),false)
  assert.equal(hasNftMediaUri(null),false)
})

test('nonce byte padding matches actual API identifiers at boundaries',async()=>{
  for(const [nonce,suffix] of [[1,'01'],[255,'ff'],[256,'0100'],[307,'0133'],[4096,'1000'],[65536,'010000']]) {
    const identifier='ART-abcdef-'+suffix
    assert.equal(nftIdentifier(nft.collection,nonce),identifier)
    const row={...nft,identifier,nonce,uris:[btoa(nft.uris[0])]}
    const base=requestFor(row,{nft:{identifier,nonce}})
    const request=(url,options)=>url.endsWith('/nfts/'+identifier) && !url.includes('/accounts/')
      ? Promise.resolve({ok:true,json:async()=>({...meta,identifier,nonce})}) : base(url,options)
    const proof=await verifyUserNftListPreflight({address:addr,identifier,collection:nft.collection,nonce,request})
    assert.equal(proof.identifier,identifier)
  }
})

test('REST percentages convert exactly to contract basis points',async()=>{
  const opts={address:addr,identifier:nft.identifier,collection:nft.collection,nonce:1}
  for(const [royalties,bps] of [[0,0],[5,500],[5.25,525],['0.29',29],[7,700]]) {
    const proof=await verifyUserNftListPreflight({...opts,request:requestFor(nft,{nft:{royalties}})})
    assert.equal(proof.royaltyBps,bps)
  }
  for(const royalties of [7.01,10,100,500,undefined,null,true,'',-1,'5.001','0x05','5e0']) {
    await assert.rejects(verifyUserNftListPreflight({...opts,request:requestFor(nft,{nft:{royalties}})}))
  }
})

test('owned-NFT search covers the entire loaded page, not only the first 48 visible cards',()=>{
  const panel=read('../src/components/MyOwnedNftsPanel.tsx')
  const sheet=read('../src/components/ListNftSheet.tsx')
  assert.match(panel,/const matching = useMemo\(\(\)=>\{/)
  assert.match(panel,/return account.nfts/)
  assert.match(panel,/const items=matching.slice\(0,48\)/)
  assert.match(panel,/const nft=account.nfts.find\(/,
    'deep-linked NFTs must be found in the entire loaded page, not only the visible slice')
  assert.match(panel,/type="search" value=\{search\}/)
  assert.match(panel,/Inventaire partiel/)
  assert.match(sheet,/const \[price, setPrice\] = useState\(''\)/)
  assert.match(sheet,/\},\[target\?\.identifier\]\)/,
    'switching NFTs clears the prior price and fee quote')
  assert.match(sheet,/aria-modal="true"/)
  assert.match(sheet,/if \(!live\) \{/,
    'the seller confirmation must stay fail-closed when the contract is unavailable')
})

test('cancelled listing preflight never starts any chain read',async()=>{
  const ctl=new AbortController();ctl.abort()
  let reads=0
  await assert.rejects(verifyUserNftListPreflight({address:addr,identifier:nft.identifier,
    collection:nft.collection,nonce:1,signal:ctl.signal,
    request:async()=>{reads++;throw Error('must not read')},
  }),/annulée/)
  assert.equal(reads,0)
})

test('cancelling during chain reads aborts every request and rejects a late proof',async()=>{
  const ctl=new AbortController(),signals=[]
  let release
  const held=new Promise(resolve=>{release=resolve})
  const request=async(url,options)=>{
    signals.push(options.signal)
    await held
    return requestFor()(url,options)
  }
  const pending=verifyUserNftListPreflight({address:addr,identifier:nft.identifier,
    collection:nft.collection,nonce:1,signal:ctl.signal,request})
  pending.catch(()=>{})
  ctl.abort()
  assert.equal(signals.length,5)
  assert.equal(signals.every(signal=>signal.aborted),true)
  release()
  await assert.rejects(pending,/annulée/)
})
