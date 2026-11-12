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
const React=await import('react')
const {createRoot}=await import('react-dom/client')
const require=createRequire(import.meta.url)
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r});return {promise,resolve}}
const response=data=>({ok:true,json:async()=>data})

async function harness({hold='challenge'}={}) {
  const wallet={current:{connected:true,address:'erd1'+'a'.repeat(58),method:'xportal'}}
  const waiting=deferred(), calls=[], signed=[], ready=[]
  const originalFetch=globalThis.fetch
  const createObjectURL=URL.createObjectURL,revokeObjectURL=URL.revokeObjectURL
  URL.createObjectURL=()=> 'blob:local-preview'
  URL.revokeObjectURL=()=>{}
  globalThis.fetch=async url=>{
    calls.push(url)
    if(url.endsWith('/config'))return response({enabled:true,modelEnabled:false})
    if(url.endsWith('/challenge'))return hold==='challenge'?waiting.promise:response({message:'challenge',nonce:'nonce'})
    if(url.endsWith('/session'))return response({token:'test-token'})
    if(url.endsWith('/upload'))return hold==='upload'?waiting.promise:response({uploadId:'upload',uri:'ipfs://media'})
    if(url.endsWith('/metadata'))return response({mediaUri:'ipfs://media',metadataUri:'ipfs://metadata',attributes:'metadata:test'})
    assert.fail('unexpected URL '+url)
  }
  const result=buildSync({
    entryPoints:[new URL('../src/components/CreatorMediaUpload.tsx',import.meta.url).pathname],
    bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',logLevel:'silent',
    external:['react','react/jsx-runtime','../context/WalletContext','../lib/signAccessMessage','../lib/stripe','./StudioGlbPreview'],
  })
  const imports={
    '../context/WalletContext':{useWallet:()=>wallet.current},
    '../lib/stripe':{getAccessApiBase:()=> 'https://studio.example'},
    '../lib/signAccessMessage':{signAccessMessage:async message=>{
      signed.push(message)
      return hold==='signature'?waiting.promise:{ok:true,signature:'test-signature'}
    }},
    './StudioGlbPreview':{default:()=>null},
  }
  const module={exports:{}}
  new Function('require','module','exports',result.outputFiles[0].text)(id=>imports[id]||require(id),module,module.exports)
  const Component=module.exports.default
  const host=document.createElement('div');document.body.append(host)
  const root=createRoot(host)
  let mounted=true
  const render=async patch=>{
    wallet.current={...wallet.current,...patch}
    await React.act(async()=>root.render(React.createElement(Component,{title:'Sculpture',onReady:value=>ready.push(value)})))
  }
  const unmount=async()=>{if(mounted){await React.act(async()=>root.unmount());mounted=false}}
  await render({})
  const fileInput=host.querySelector('input[type=file]')
  const transfer=new window.DataTransfer()
  transfer.items.add(new window.File(['test-image'],'sculpture.png',{type:'image/png'}))
  fileInput.files=transfer.files
  await React.act(async()=>fileInput.dispatchEvent(new window.Event('change',{bubbles:true})))
  await React.act(async()=>host.querySelector('input[type=checkbox]').click())
  const button=[...host.querySelectorAll('button')].find(b=>b.textContent.includes('Publier sur IPFS'))
  assert.equal(button.disabled,false)
  return {calls,signed,ready,render,unmount,
    start:async()=>React.act(async()=>button.click()),
    release:async data=>React.act(async()=>waiting.resolve(data)),
    close:async()=>{
      await unmount();host.remove();globalThis.fetch=originalFetch
      URL.createObjectURL=createObjectURL;URL.revokeObjectURL=revokeObjectURL
    }}
}

test('leaving Studio before the challenge returns never opens the wallet signer',async()=>{
  const h=await harness()
  try {
    await h.start()
    await h.unmount()
    await h.release(response({message:'challenge',nonce:'nonce'}))
    assert.equal(h.signed.length,0)
    assert.equal(h.calls.some(p=>p.endsWith('/upload')),false)
  } finally {await h.close()}
})

test('read-only mode on the same address invalidates the old upload attempt',async()=>{
  const h=await harness()
  try {
    await h.start()
    await h.render({method:'paste_readonly'})
    await h.release(response({message:'challenge',nonce:'nonce'}))
    assert.equal(h.signed.length,0)
    assert.equal(h.calls.some(p=>p.endsWith('/session')),false)
  } finally {await h.close()}
})

test('leaving Studio during signature prevents session creation and file publication',async()=>{
  const h=await harness({hold:'signature'})
  try {
    await h.start()
    assert.equal(h.signed.length,1)
    await h.unmount()
    await h.release({ok:true,signature:'test-signature'})
    assert.equal(h.calls.some(p=>p.endsWith('/session')),false)
  } finally {await h.close()}
})

test('a file response after unmount cannot initiate a second publication of metadata',async()=>{
  const h=await harness({hold:'upload'})
  try {
    await h.start()
    assert.equal(h.calls.filter(p=>p.endsWith('/upload')).length,1)
    await h.unmount()
    await h.release(response({uploadId:'upload',uri:'ipfs://media'}))
    assert.equal(h.calls.some(p=>p.endsWith('/metadata')),false)
    assert.equal(h.ready.filter(Boolean).length,0)
  } finally {await h.close()}
})
