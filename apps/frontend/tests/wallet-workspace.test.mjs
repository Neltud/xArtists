import test from 'node:test'
import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {buildSync} from 'esbuild'
import {Window} from 'happy-dom'
const window=new Window({url:'https://xartists.art/workspace/wallet'})
for(const key of ['window','document','navigator','HTMLElement','Node'])Object.defineProperty(globalThis,key,{value:key==='window'?window:window[key],configurable:true})
globalThis.IS_REACT_ACT_ENVIRONMENT=true
const React=await import('react'),{createRoot}=await import('react-dom/client')
const require=createRequire(import.meta.url),router=require('react-router-dom')
const A='erd1'+'a'.repeat(58)
function compile(entry,mocks){
 const code=buildSync({entryPoints:[new URL('../src/'+entry,import.meta.url).pathname],bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',logLevel:'silent',external:['react','react/jsx-runtime','react-router-dom',...Object.keys(mocks)]}).outputFiles[0].text
 const module={exports:{}}
 new Function('require','module','exports',code)(id=>mocks[id]||require(id),module,module.exports)
 return module.exports.default
}
async function ui({connected=true,error=false,path='/workspace/wallet'}={}){
 const originalFetch=globalThis.fetch,requests=[],toasts=[],connects=[],disconnects=[]
 const push=(...args)=>toasts.push(args)
 globalThis.fetch=async url=>{
  requests.push(String(url))
  return {ok:!error,status:error?503:200,json:async()=>String(url).includes('/nfts?')?[{identifier:'ART-abcdef-01',name:'Test artwork',collection:'ART-abcdef',nonce:1,type:'NonFungibleESDT',balance:'1'}]:String(url).includes('/tokens?')?[{identifier:'TEST-abcdef',ticker:'TEST',balance:'2000000',decimals:6}]:{balance:'3000000000000000000',nonce:1}}
 }
 const Wallet=compile('pages/WalletPage.tsx',{
  '../context/WalletContext':{useWallet:()=>({connected,address:connected?A:null,method:'paste_readonly',canAttemptSign:false,sessionLive:false,disconnect:()=>disconnects.push(true)})},
  '../experience/state':{useCopy:()=>key=>key},
  '../i18n/phraseRuntime':{renderChild:value=>value},
  '../lib/walletEvents':{requestOpenConnect:()=>connects.push(true)},
  '../lib/xportalWc':{clearXPortalSession:()=>{}},
  '../components/ui/Toast':{useToast:()=>({push})},
  '../components/MoonPayBuyButton':()=>null,
 })
 const host=document.createElement('div');document.body.append(host)
 const root=createRoot(host)
 await React.act(async()=>root.render(React.createElement(router.MemoryRouter,{initialEntries:[path]},React.createElement(Wallet))))
 const button=text=>[...host.querySelectorAll('button')].find(x=>x.textContent.trim()===text)
 return {host,requests,toasts,connects,disconnects,button,
  click:element=>React.act(async()=>element.click()),
  close:async()=>{await React.act(async()=>root.unmount());host.remove();globalThis.fetch=originalFetch},
 }
}
test('overview and assets share one account request set while real data survive view changes',async()=>{
 const h=await ui()
 try{
  assert.equal(h.requests.length,3)
  assert.equal(h.host.querySelectorAll('h1').length,1)
  assert.equal(h.host.querySelector('.xa-wallet-summary strong').textContent,'3.0000')
  await h.click(h.button('walletAssets'))
  assert.equal(h.requests.length,3,'changing view must not fetch the account again')
  assert.match(h.host.textContent,/Test artwork/)
  assert.match(h.host.textContent,/TEST/)
  await h.click(h.button('walletOverview'))
  assert.equal(h.requests.length,3)
  assert.equal(h.connects.length,0)
 }finally{await h.close()}
})
test('failed account reads remain unavailable in both views rather than verified zero balances',async()=>{
 const h=await ui({error:true})
 try{
  assert.equal(h.host.querySelector('.xa-wallet-summary strong').textContent,'—')
  assert.match(h.host.textContent,/walletUnavailable/)
  await h.click(h.button('walletAssets'))
  assert.match(h.host.textContent,/walletUnavailable/)
  assert.doesNotMatch(h.host.textContent,/Aucun token ESDT|Aucun NFT trouvé/)
 }finally{await h.close()}
})
test('anonymous wallet browsing does not request account data or start wallet authentication',async()=>{
 const h=await ui({connected:false})
 try{
  assert.equal(h.requests.length,0)
  assert.equal(h.connects.length,0)
  await h.click(h.button('connect'))
  assert.equal(h.connects.length,1)
  assert.equal(h.requests.length,0)
 }finally{await h.close()}
})
test('MoonPay return notice is processed without automatic buying or wallet connection',async()=>{
 const h=await ui({path:'/workspace/wallet?moonpay=done&lang=fr'})
 try{
  assert.equal(h.toasts.length,1)
  assert.match(h.toasts[0][0],/Retour MoonPay/)
  assert.equal(h.connects.length,0)
  assert.equal(h.requests.length,3)
 }finally{await h.close()}
})
