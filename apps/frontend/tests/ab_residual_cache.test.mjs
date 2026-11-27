/** Test the actual compiled readiness module, not a second implementation. */
import assert from 'node:assert/strict'
import {test} from 'node:test'
import {buildSync} from 'esbuild'
const job={key:'marketplace',addr:'erd1'+'q'.repeat(58),expected:'expected-hash'}
const jobs=[{...job}]
const code=buildSync({entryPoints:[new URL('../src/lib/runtimeCodehash.ts',import.meta.url).pathname],bundle:true,write:false,platform:'node',format:'cjs',external:['../config/contracts'],logLevel:'silent'}).outputFiles[0].text
function fresh(){
 const module={exports:{}}
 new Function('require','module','exports',code)(id=>{assert.equal(id,'../config/contracts');return {UNLOCK_JOBS:jobs}},module,module.exports)
 return module.exports
}
const ok=(changes={})=>({ok:true,json:async()=>({address:job.addr,code:'abcd',codeHash:job.expected,isPayable:true,...changes})})
test('real readiness rejects stale/future observations, configuration changes, and mutable snapshots',async()=>{
 const api=fresh(),oldFetch=globalThis.fetch,oldNow=Date.now
 let now=1_000_000
 Date.now=()=>now
 globalThis.fetch=async()=>ok()
 try{
  assert.equal(api.runtimeCodehashOk('marketplace'),false)
  const snapshot=await api.refreshRuntimeCodehashes()
  assert.equal(api.runtimeCodehashOk('marketplace'),true)
  snapshot.marketplace=false
  api.runtimeUnlockSnapshot().marketplace=false
  assert.equal(api.runtimeCodehashOk('marketplace'),true)
  jobs[0].expected='different'
  assert.equal(api.runtimeCodehashOk('marketplace'),false)
  jobs[0].expected=job.expected
  now=999999
  assert.equal(api.runtimeCodehashOk('marketplace'),false)
  now=1_300_001
  assert.equal(api.runtimeCodehashOk('marketplace'),false)
 }finally{jobs[0]={...job};globalThis.fetch=oldFetch;Date.now=oldNow}
})
test('refresh immediately closes prior authorization and older successes cannot overwrite newer failures',async()=>{
 const api=fresh(),oldFetch=globalThis.fetch
 let resolve
 try{
  globalThis.fetch=async()=>ok()
  await api.refreshRuntimeCodehashes()
  assert.equal(api.runtimeCodehashOk('marketplace'),true)
  globalThis.fetch=()=>new Promise(r=>{resolve=r})
  const slow=api.refreshRuntimeCodehashes()
  assert.equal(api.runtimeCodehashOk('marketplace'),false)
  globalThis.fetch=async()=>({ok:false})
  await api.refreshRuntimeCodehashes()
  resolve(ok())
  await slow
  assert.equal(api.runtimeCodehashOk('marketplace'),false)
  assert.equal(api.runtimeRefreshGeneration(),3)
 }finally{globalThis.fetch=oldFetch}
})
test('account identity, deployed code, hash and payable metadata are required',async()=>{
 const api=fresh(),oldFetch=globalThis.fetch
 try{
  for(const changes of [{address:'wrong'},{code:''},{codeHash:'wrong'},{codeHash:42},{isPayable:false},{isPayable:undefined}]){
   globalThis.fetch=async()=>ok(changes)
   await api.refreshRuntimeCodehashes()
   assert.equal(api.runtimeCodehashOk('marketplace'),false)
  }
  globalThis.fetch=async()=>ok()
  await api.refreshRuntimeCodehashes()
  assert.equal(api.runtimeCodehashOk('marketplace'),true)
 }finally{globalThis.fetch=oldFetch}
})
