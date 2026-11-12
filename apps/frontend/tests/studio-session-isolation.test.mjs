import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { buildSync } from 'esbuild'
import { Window } from 'happy-dom'

const window = new Window({url:'https://xartists.art/studio/'})
for (const key of ['window','document','navigator','HTMLElement','Node']) {
  Object.defineProperty(globalThis,key,{value:key==='window'?window:window[key],configurable:true})
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true
const React = await import('react')
const { createRoot } = await import('react-dom/client')
const require = createRequire(import.meta.url)
const A='erd1'+'a'.repeat(58), B='erd1'+'b'.repeat(58)
const hash='1'.repeat(64)
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r});return {promise,resolve}}
const opts={tokenIdentifier:'ART-abcdef',name:'Sculpture',royaltiesPct:5,attributes:'tags:art',uris:['ipfs://example']}

function loadHook(wallet, api, send) {
  const code=buildSync({
    entryPoints:[new URL('../src/hooks/useStudioMintTx.ts',import.meta.url).pathname],
    bundle:true,write:false,platform:'node',format:'cjs',logLevel:'silent',
    external:['react','../context/WalletContext','./useSendTransaction','../lib/studioOnChainMint'],
  }).outputFiles[0].text
  const module={exports:{}}
  const imports={
    '../context/WalletContext':{useWallet:()=>wallet.current},
    './useSendTransaction':{useSendTransaction:()=>({send})},
    '../lib/studioOnChainMint':api,
  }
  new Function('require','module','exports',code)(id=>imports[id]||require(id),module,module.exports)
  return module.exports.useStudioMintTx
}

async function harness(overrides={}) {
  const wallet={current:{connected:true,address:A,method:'xportal',canAttemptSign:true}}
  const sent=[],saved=[]
  const api={
    loadStudioCollection:address=>address?{name:address,ticker:'ART',walletAddress:address,at:1}:null,
    saveStudioCollection:record=>saved.push(record),
    isValidTicker:()=>true,isValidCollectionId:()=>true,
    buildIssueNftCollectionTx:()=>({receiver:'system',value:'50000000000000000'}),
    buildSetNftCreateRoleTx:()=>({receiver:'system',value:'0'}),
    buildEsdtNftCreateTx:()=>({receiver:'__SENDER__',value:'0'}),
    fetchArtistCollectionProof:async()=>({owner:A,hasCreateRole:true}),
    verifyArtistTransaction:async()=> 'confirmed',
    ...overrides,
  }
  const send=async transactions=>{sent.push(transactions);return {sessionId:hash,error:null}}
  const useHook=loadHook(wallet,api,send)
  let latest
  function Probe(){latest=useHook();return null}
  const host=document.createElement('div');document.body.append(host)
  const root=createRoot(host)
  const render=async patch=>{
    wallet.current={...wallet.current,...patch}
    await React.act(async()=>root.render(React.createElement(Probe)))
  }
  await render({})
  return {api,sent,saved,render,get current(){return latest},
    close:async()=>{await React.act(async()=>root.unmount());host.remove()}}
}

for (const action of ['createNft','setCreateRole']) {
  test(action+': switching wallet during role lookup never requests a signature',async()=>{
    const proof=deferred()
    const h=await harness({fetchArtistCollectionProof:()=>proof.promise})
    let result
    try {
      await React.act(async()=>{result=action==='createNft'?h.current.createNft(opts):h.current.setCreateRole('ART-abcdef')})
      await h.render({address:B})
      await React.act(async()=>proof.resolve({owner:A,hasCreateRole:action==='createNft'}))
      assert.equal((await result).ok,false)
      assert.equal(h.sent.length,0,'a proof for A must never open the signer for B')
      assert.equal(h.saved.length,0)
      assert.equal(h.current.collection?.walletAddress,B)
      assert.equal(h.current.lastTx,null)
    } finally {await h.close()}
  })
}

test('leaving and returning to the same wallet cannot revive a pending mint',async()=>{
  const proof=deferred()
  const h=await harness({fetchArtistCollectionProof:()=>proof.promise})
  let result
  try {
    await React.act(async()=>{result=h.current.createNft(opts)})
    await h.render({address:B})
    await h.render({address:A})
    await React.act(async()=>proof.resolve({owner:A,hasCreateRole:true}))
    assert.equal((await result).ok,false)
    assert.equal(h.sent.length,0)
  } finally {await h.close()}
})

test('an unmounted Studio never starts a signature after a late lookup',async()=>{
  const proof=deferred()
  const h=await harness({fetchArtistCollectionProof:()=>proof.promise})
  let result
  await React.act(async()=>{result=h.current.createNft(opts)})
  await h.close()
  await React.act(async()=>proof.resolve({owner:A,hasCreateRole:true}))
  assert.equal((await result).ok,false)
  assert.equal(h.sent.length,0)
})

test('late transaction verification cannot overwrite the new account or its pending operation',async()=>{
  const verificationA=deferred(), verificationB=deferred()
  const h=await harness({verifyArtistTransaction:(_hash,address)=>address===A?verificationA.promise:verificationB.promise})
  let oldResult,newResult
  try {
    await React.act(async()=>{oldResult=h.current.issueCollection('Sculpture A','ART')})
    await h.render({address:B})
    assert.equal(h.current.pending,false)
    assert.equal(h.current.lastTx,null)
    await React.act(async()=>{newResult=h.current.issueCollection('Sculpture B','ART')})
    assert.equal(h.current.pending,true)
    await React.act(async()=>verificationA.resolve('confirmed'))
    assert.equal((await oldResult).ok,false)
    assert.equal(h.saved.length,0)
    assert.equal(h.current.pending,true,'old completion cannot clear B pending state')
    assert.equal(h.current.collection?.walletAddress,B)
    await React.act(async()=>verificationB.resolve('confirmed'))
    assert.equal((await newResult).ok,true)
    assert.equal(h.saved.length,1)
    assert.equal(h.saved[0].walletAddress,B)
  } finally {await h.close()}
})

test('a same-frame double click cannot send two collection issuance transactions',async()=>{
  const verification=deferred()
  const h=await harness({verifyArtistTransaction:()=>verification.promise})
  let first,second
  try {
    await React.act(async()=>{
      first=h.current.issueCollection('Sculpture','ART')
      second=h.current.issueCollection('Sculpture','ART')
    })
    assert.equal(h.sent.length,1)
    assert.equal((await second).ok,false)
    await React.act(async()=>verification.resolve('confirmed'))
    assert.equal((await first).ok,true)
  } finally {await h.close()}
})

test('disconnect and read-only mode hide signing capability and previous transaction state',async()=>{
  const h=await harness()
  try {
    await React.act(async()=>{await h.current.issueCollection('Sculpture','ART')})
    assert.equal(h.current.lastTx,hash)
    await h.render({connected:false,address:undefined,canAttemptSign:false})
    assert.equal(h.current.collection,null)
    assert.equal(h.current.lastTx,null)
    assert.equal(h.current.canSign,false)
    let result
    await React.act(async()=>{result=await h.current.createNft(opts)})
    assert.equal(result.ok,false)
    assert.equal(h.sent.length,1)
  } finally {await h.close()}
})

test('a late signer response keeps its transaction reference but never verifies it for another session',async()=>{
  const signature=deferred()
  let wallet={current:{connected:true,address:A,method:'xportal',canAttemptSign:true}}
  const api={loadStudioCollection:()=>null,saveStudioCollection:()=>assert.fail('stale draft saved'),
    isValidTicker:()=>true,buildIssueNftCollectionTx:()=>({}),
    verifyArtistTransaction:()=>assert.fail('stale transaction read')}
  const useHook=loadHook(wallet,api,()=>signature.promise)
  let latest,result
  function Probe(){latest=useHook();return null}
  const root=createRoot(document.createElement('div'))
  try {
    await React.act(async()=>root.render(React.createElement(Probe)))
    await React.act(async()=>{result=latest.issueCollection('Sculpture','ART')})
    wallet.current={...wallet.current,address:B}
    await React.act(async()=>root.render(React.createElement(Probe)))
    await React.act(async()=>signature.resolve({sessionId:hash,error:null}))
    const outcome=await result
    assert.equal(outcome.ok,false)
    assert.equal(outcome.sessionId,hash,'a possible broadcast must remain reconcilable')
    assert.match(outcome.error,/déjà été signée/)
    assert.equal(latest.lastTx,null)
  } finally {await React.act(async()=>root.unmount())}
})

test('same-account rerenders preserve a valid attempt; role proof and wallet rejection still block minting',async()=>{
  const proof=deferred()
  const h=await harness({fetchArtistCollectionProof:()=>proof.promise})
  let result
  try {
    await React.act(async()=>{result=h.current.createNft(opts)})
    await h.render({})
    await React.act(async()=>proof.resolve({owner:A,hasCreateRole:false}))
    assert.equal((await result).ok,false)
    assert.equal(h.sent.length,0)
    assert.match(h.current.error,/ESDTRoleNFTCreate/)
    assert.equal(h.current.pending,false)
    await React.act(async()=>{await h.current.issueCollection('Sculpture','ART')})
    assert.equal(h.sent.length,1,'the failed lookup must release the operation lock')
  } finally {await h.close()}
})
