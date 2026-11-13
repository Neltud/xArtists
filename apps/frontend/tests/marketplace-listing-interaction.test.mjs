import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {buildSync} from 'esbuild'
import {Window} from 'happy-dom'
import {isOwnedNftListCandidate,nftIdentifier,MARKETPLACE_MAINNET} from '../src/lib/marketplaceUserListing.mjs'

const window=new Window({url:'https://xartists.art/marketplace/'})
for(const key of ['window','document','navigator','HTMLElement','Node']){
  Object.defineProperty(globalThis,key,{value:key==='window'?window:window[key],configurable:true})
}
globalThis.IS_REACT_ACT_ENVIRONMENT=true
const React=await import('react')
const {createRoot}=await import('react-dom/client')
const require=createRequire(import.meta.url)
const A='erd1'+'a'.repeat(58),B='erd1'+'b'.repeat(58)
const nft=nonce=>({identifier:nftIdentifier('ART-abcdef',nonce),collection:'ART-abcdef',nonce,
  name:'Sculpture '+String(nonce).padStart(3,'0'),balance:'1',type:'NonFungibleESDT',
  uris:['ipfs://Qm'+'a'.repeat(44)]})
const target=nonce=>({...nft(nonce),name:nft(nonce).name})
const proof=opts=>({...opts,owner:opts.address,feeBps:300,royaltyBps:500,
  royaltyReceiver:MARKETPLACE_MAINNET,escrowReceiver:MARKETPLACE_MAINNET,checkedAt:Date.now()})
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject}}

function compile(entry,mocks){
  const code=buildSync({entryPoints:[new URL('../src/'+entry,import.meta.url).pathname],
    bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',logLevel:'silent',
    external:['react','react/jsx-runtime',...Object.keys(mocks)],
  }).outputFiles[0].text
  const module={exports:{}}
  new Function('require','module','exports',code)(id=>mocks[id]||require(id),module,module.exports)
  return module.exports
}

async function ui({panel=false,live=true,canAttemptSign=true,initialTarget=target(75)}={}){
  const state={wallet:{connected:true,address:A,canAttemptSign},live,
    location:{search:''},nfts:Array.from({length:100},(_,i)=>nft(i+1)),
    preflight:async opts=>proof(opts)}
  const checks=[],listed=[]
  const mocks={
    '../context/WalletContext':{useWallet:()=>state.wallet},
    '../i18n/phraseRuntime':{renderChild:v=>v,localizeChild:v=>v,usePhraseLocale:()=>{}},
    'react-router-dom':{useLocation:()=>state.location},
    '../hooks/useUserAccount':{useUserAccount:()=>({nfts:state.nfts,loading:false,error:null})},
    '../hooks/useMarketplaceReadiness':{useMarketplaceReadiness:()=>state.live},
    '../hooks/useMarketplaceTx':{useMarketplaceTx:()=>({pending:false,error:null,lastTx:null,
      marketplaceListLive:state.live,listNft:async p=>{listed.push(p);return {sessionId:'a'.repeat(64)}}})},
    '../lib/marketplaceUserListing.mjs':{isOwnedNftListCandidate,
      verifyUserNftListPreflight:opts=>{checks.push(opts);return state.preflight(opts)}},
    '../lib/walletEvents':{requestOpenConnect:()=>{}},
    '../lib/ownershipMap':{OWNED_GLOW:''},
    './ui/ImageWithFallback':{ImageWithFallback:({src,alt})=>React.createElement('img',{src,alt})},
  }
  const Component=compile(panel?'components/MyOwnedNftsPanel.tsx':'components/ListNftSheet.tsx',mocks).default
  let setTarget,mounted=true
  function App(){
    const [selected,setSelected]=React.useState(initialTarget);setTarget=setSelected
    return panel?React.createElement(Component):React.createElement(Component,{target:selected,onClose:()=>setSelected(null)})
  }
  const host=document.createElement('div');document.body.append(host)
  const root=createRoot(host)
  const render=async patch=>{
    if(patch?.wallet)state.wallet={...state.wallet,...patch.wallet}
    if(patch?.live!==undefined)state.live=patch.live
    if(patch?.search!==undefined)state.location={search:patch.search}
    await React.act(async()=>root.render(React.createElement(App)))
  }
  await render()
  const input=async(element,value)=>React.act(async()=>{
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(element,value)
    element.dispatchEvent(new window.Event('input',{bubbles:true}))
  })
  return {host,state,checks,listed,render,
    dialog:()=>host.querySelector('[role=dialog]'),
    button:text=>[...host.querySelectorAll('button')].find(b=>b.textContent.trim()===text),
    click:button=>React.act(async()=>button.click()),
    input,
    price:value=>input(host.querySelector('input[inputmode=decimal]'),value),
    select:value=>React.act(async()=>setTarget(value)),
    unmount:async()=>{if(mounted){mounted=false;await React.act(async()=>root.unmount())}},
    close:async()=>{if(mounted){mounted=false;await React.act(async()=>root.unmount())}host.remove()},
  }
}

test('search actually selects NFT #75 among 100 loaded while preparation remains unsigned',async()=>{
  const h=await ui({panel:true,live:false,canAttemptSign:false})
  try{
    assert.equal(h.host.querySelectorAll('img').length,48)
    assert.doesNotMatch(h.host.textContent,/Sculpture 075/)
    await h.input(h.host.querySelector('input[type=search]'),'Sculpture 075')
    assert.match(h.host.textContent,/Sculpture 075/)
    assert.equal(h.host.querySelectorAll('img').length,1)
    const prepare=h.button('Préparer la mise en vente')
    assert.equal(prepare.disabled,false)
    await h.click(prepare)
    assert.match(h.dialog().textContent,/ART-abcdef-4b/)
    assert.equal(h.host.querySelector('input[inputmode=decimal]').value,'')
    assert.equal(h.button('Vérifier frais et royalties').disabled,true)
    assert.equal(h.checks.length,0)
    assert.equal(h.listed.length,0)
  }finally{await h.close()}
})

test('deep link reaches NFT #75 before the visible slice and never opens a signer',async()=>{
  const h=await ui({panel:true,live:false,canAttemptSign:false})
  try{
    await h.render({search:'?list='+nft(75).identifier})
    assert.match(h.dialog().textContent,/Sculpture 075/)
    assert.equal(h.button('Vérifier frais et royalties').disabled,true)
    assert.equal(h.listed.length,0)
    await h.click(h.button('Annuler'))
    await h.render({})
    assert.equal(h.dialog(),null,'a dismissed deep link must not reopen itself')
  }finally{await h.close()}
})

test('changing the NFT resets the actual controlled price, reviewed quote and messages',async()=>{
  const h=await ui()
  try{
    await h.price('1.25')
    await h.click(h.button('Vérifier frais et royalties'))
    assert.ok(h.host.querySelector('[aria-label="Frais et royalties vérifiés"]'))
    assert.equal(h.checks.length,1)
    await h.select(target(76))
    assert.equal(h.host.querySelector('input[inputmode=decimal]').value,'')
    assert.equal(h.host.querySelector('[aria-label="Frais et royalties vérifiés"]'),null)
    assert.doesNotMatch(h.dialog().textContent,/Contrôles validés/)
    assert.equal(h.listed.length,0)
  }finally{await h.close()}
})

for(const transition of ['close','target','price','readonly','wallet','unmount']){
  test('late signing preflight after '+transition+' never invokes listNft',async()=>{
    const h=await ui()
    const late=deferred()
    try{
      await h.price('1.25')
      await h.click(h.button('Vérifier frais et royalties'))
      h.state.preflight=()=>late.promise
      await h.click(h.button('Signer listNft'))
      const check=h.checks.at(-1)
      if(transition==='close')await h.click(h.button('Annuler'))
      if(transition==='target')await h.select(target(76))
      if(transition==='price')await h.price('2.5')
      if(transition==='readonly')await h.render({wallet:{canAttemptSign:false}})
      if(transition==='wallet')await h.render({wallet:{address:B}})
      if(transition==='unmount')await h.unmount()
      assert.equal(check.signal.aborted,true)
      await React.act(async()=>late.resolve(proof(check)))
      assert.equal(h.listed.length,0)
    }finally{await h.close()}
  })
}

test('only explicit second confirmation after unchanged fresh fees invokes the listing hook',async()=>{
  const h=await ui()
  try{
    await h.price('1.25')
    await h.click(h.button('Vérifier frais et royalties'))
    assert.equal(h.listed.length,0)
    await h.click(h.button('Signer listNft'))
    assert.equal(h.checks.length,2)
    assert.equal(h.listed.length,1)
    assert.equal(h.listed[0].nonce,75)
    assert.equal(h.listed[0].priceEgld,'1.25')
    assert.match(h.dialog().textContent,/Transaction soumise/)
  }finally{await h.close()}
})

test('failed ownership or changed royalty proof cannot reach the listing hook',async()=>{
  for(const failure of ['ownership','fees']){
    const h=await ui()
    try{
      await h.price('1.25')
      await h.click(h.button('Vérifier frais et royalties'))
      h.state.preflight=async opts=>{
        if(failure==='ownership')throw Error('NFT non détenu')
        return {...proof(opts),royaltyBps:600}
      }
      await h.click(h.button('Signer listNft'))
      assert.equal(h.listed.length,0)
      assert.equal(h.host.querySelector('[aria-label="Frais et royalties vérifiés"]'),null)
    }finally{await h.close()}
  }
})

async function hookHarness(){
  const wallet={address:A,canAttemptSign:true},state={live:true,preflight:async opts=>proof(opts)}
  const sent=[],checks=[]
  const useHook=compile('hooks/useMarketplaceTx.ts',{
    '../context/WalletContext':{useWallet:()=>wallet},
    './useSendTransaction':{useSendTransaction:()=>({send:async tx=>{sent.push(tx);return {sessionId:'a'.repeat(64)}}})},
    '../lib/marketplaceUserListing.mjs':{nftIdentifier,verifyUserNftListPreflight:opts=>{checks.push(opts);return state.preflight(opts)}},
    '../lib/scStatus':{isMarketplaceLive:()=>false,isMarketplaceListingLive:()=>state.live,
      marketplaceUserListingReceiverOrThrow:()=>MARKETPLACE_MAINNET,MARKETPLACE_ADDRESS:MARKETPLACE_MAINNET},
  }).useMarketplaceTx
  let current,mounted=true
  function Probe(){current=useHook();return null}
  const host=document.createElement('div');document.body.append(host)
  const root=createRoot(host)
  const render=async patch=>{Object.assign(wallet,patch);await React.act(async()=>root.render(React.createElement(Probe)))}
  await render({})
  const start=async opts=>{
    let result
    await React.act(async()=>{result=current.listNft({tokenId:'ART-abcdef',nonce:75,priceEgld:'1.25',...opts});result.catch(()=>{})})
    return {result}
  }
  return {state,sent,checks,render,start,get current(){return current},
    unmount:async()=>{if(mounted){mounted=false;await React.act(async()=>root.unmount())}},
    close:async()=>{if(mounted){mounted=false;await React.act(async()=>root.unmount())}host.remove()},
  }
}

for(const transition of ['readonly','wallet_return','abort','unmount']){
  test('actual transaction hook blocks late send after '+transition,async()=>{
    const h=await hookHarness(),late=deferred(),ctl=new AbortController()
    h.state.preflight=()=>late.promise
    try{
      const {result}=await h.start({signal:ctl.signal})
      if(transition==='readonly')await h.render({canAttemptSign:false})
      if(transition==='wallet_return'){await h.render({address:B});await h.render({address:A})}
      if(transition==='abort')ctl.abort()
      if(transition==='unmount')await h.unmount()
      await React.act(async()=>late.resolve(proof(h.checks[0])))
      await assert.rejects(result)
      assert.equal(h.sent.length,0)
    }finally{await h.close()}
  })
}

test('actual transaction hook coalesces no clicks: a concurrent listing is rejected before send',async()=>{
  const h=await hookHarness(),late=deferred()
  h.state.preflight=()=>late.promise
  try{
    const first=await h.start()
    const second=await h.start()
    await assert.rejects(second.result,/déjà en cours/)
    assert.equal(h.checks.length,1)
    await React.act(async()=>late.resolve(proof(h.checks[0])))
    await first.result
    assert.equal(h.sent.length,1)
    assert.equal(h.sent[0][0].receiver,A)
    assert.equal(h.sent[0][0].value,'0')
    assert.equal(h.sent[0][0].chainID,'1')
  }finally{await h.close()}
})
