import test from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import { loadSource } from './load-source.mjs'

const window = new Window({ url: 'https://xartists.art/' })
for (const key of ['window','document','navigator','HTMLElement','Node']) {
  Object.defineProperty(globalThis,key,{value:key==='window'?window:window[key],configurable:true})
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true
const React = await import('react')
const {createRoot} = await import('react-dom/client')
const A='erd1'+'a'.repeat(58), B='erd1'+'b'.repeat(58)
const userHook=loadSource('src/hooks/useUserAccount.ts').useUserAccount
const tokensHook=loadSource('src/hooks/useWalletTokens.ts').useWalletTokens

function payload(url, amount) {
  if (url.includes('userPosition')) return {markets:[],healthFactor:2,totalSupplyUSD:amount}
  if (url.endsWith('/economics')) return {price:20}
  if (url.includes('/nfts?')) return [{identifier:'ART-abcdef-01',collection:'ART-abcdef',nonce:1,balance:'1',name:String(amount)}]
  if (url.includes('/tokens?')) return [{identifier:'TEST-abcdef',ticker:'TEST',balance:String(amount),decimals:0,price:1}]
  return {balance:String(BigInt(amount)*10n**18n),nonce:amount,shard:1}
}

for (const [name,hook] of [['account',userHook],['portfolio',tokensHook]]) {
  test(name+': account changes, stale responses and disconnect never expose another wallet',async()=>{
    const originalFetch=globalThis.fetch
    const requests=[]
    globalThis.fetch=(url,options)=>new Promise(resolve=>requests.push({url,options,resolve,done:false}))
    let latest
    const seen=[]
    function Probe({address}) { latest=hook(address);seen.push({address,data:latest});return null }
    const host=document.createElement('div');document.body.append(host)
    const root=createRoot(host)
    const render=address=>React.act(async()=>root.render(React.createElement(Probe,{address})))
    const settle=async(rows,amount,status=200)=>React.act(async()=>{
      for(const r of rows) if(!r.done) {r.done=true;r.resolve({ok:status===200,status,json:async()=>payload(r.url,amount)})}
    })
    try {
      await render(A)
      const old=requests.slice()
      await render(B)
      assert.equal(old.every(r=>r.options.signal.aborted),true)
      assert.equal(latest.tokens.length,0)
      await settle(requests.filter(r=>!old.includes(r)),2)
      assert.equal(latest.tokens[0].balance,2)
      await settle(old,9)
      assert.equal(latest.tokens[0].balance,2)
      assert.equal(latest.balanceEgld ?? latest.egldBalance,2)
      await render(A)
      assert.equal(seen.filter(r=>r.address===A).at(-1).data.tokens.length,0)
      assert.equal(latest.balanceEgld ?? latest.egldBalance,0)
      const pending=requests.filter(r=>!r.done)
      await render(null)
      await settle(pending,7)
      assert.equal(latest.tokens.length,0)
      assert.equal(latest.balanceEgld ?? latest.egldBalance,0)
    } finally {await React.act(async()=>root.unmount());host.remove();globalThis.fetch=originalFetch}
  })
  test(name+': failed NFT/token read is an error, not a successfully empty portfolio',async()=>{
    const originalFetch=globalThis.fetch
    globalThis.fetch=async(url)=>({ok:!url.includes('/tokens?'),status:url.includes('/tokens?')?503:200,json:async()=>payload(url,3)})
    let latest
    function Probe(){latest=hook(A);return null}
    const root=createRoot(document.createElement('div'))
    try {
      await React.act(async()=>root.render(React.createElement(Probe)))
      assert.match(latest.error,/503/)
      assert.equal(latest.loading,false)
      assert.equal(latest.tokens.length,0)
      assert.equal(latest.balanceEgld ?? latest.egldBalance,0)
    } finally {await React.act(async()=>root.unmount());globalThis.fetch=originalFetch}
  })
}
