import test from 'node:test'
import assert from 'node:assert/strict'
import {createWalletlessSchemaProbe} from '../src/walletlessSchemaProbe.mjs'
import {startServer} from './server-fixture.mjs'

const all={accounts:true,identities:true,wallets:true,subscriptions:true}
const pool=()=>({query:async query=>{
  assert.match(query,/to_regclass\('public\.xa_user_accounts'\)/)
  assert.match(query,/xa_account_identities/)
  assert.match(query,/xa_account_wallets/)
  assert.match(query,/xa_fiat_subscriptions/)
  assert.doesNotMatch(query,/INSERT|UPDATE|DELETE|ALTER|DROP|CREATE/i)
  return {rows:[all]}
}})

test('absent feature flag never probes any database',async()=>{
  let called=0
  const p=createWalletlessSchemaProbe({enabled:false,pool:{query:async()=>{called++}}})
  assert.equal(await p.check(),false)
  assert.equal(called,0)
})
test('all four account tables required, not just a DB connection',async()=>{
  assert.equal(await createWalletlessSchemaProbe({enabled:true,pool:pool()}).check(),true)
  for(const key of Object.keys(all)){
    const p=createWalletlessSchemaProbe({enabled:true,pool:{
      query:async()=>({rows:[{...all,[key]:false}]})}})
    assert.equal(await p.check(),false,key)
  }
  assert.equal(await createWalletlessSchemaProbe({
    enabled:true,pool:{query:async()=>{throw Error('postgres secret connection string')}},
  }).check(),false)
  assert.equal(await createWalletlessSchemaProbe({
    enabled:true,pool:{query:async()=>({rows:[]})},
  }).check(),false)
})
test('cache is bounded; concurrent callers share one schema query',async()=>{
  let now=1000,count=0,release
  const inFlight=new Promise(resolve=>{release=resolve})
  const p=createWalletlessSchemaProbe({enabled:true,clock:()=>now,ttlMs:15000,pool:{
    query:async()=>{count++;await inFlight;return {rows:[all]}}
  }})
  const a=p.check(),b=p.check()
  assert.equal(count,1)
  release()
  assert.deepEqual(await Promise.all([a,b]),[true,true])
  assert.equal(await p.check(),true)
  assert.equal(count,1)
  now+=15001
  assert.equal(await p.check(),true)
  assert.equal(count,2)
})
test('production defaults: public catalogue never claims a verified email store',async()=>{
  const server=await startServer({
    WALLETLESS_ACCOUNT_SESSION_ENABLED:'0',WALLETLESS_DATABASE_TARGET_CONFIRMED:'0',
    DATABASE_URL:'',NEON_AUTH_BASE_URL:'',
  })
  try{
    const r=await fetch(server.base+'/v1/commercial/catalog')
    assert.equal(r.status,200)
    const data=await r.json()
    assert.equal(data.walletless_account_session_enabled,false)
    assert.equal(data.xorus_private_analysis_enabled,false)
  }finally{await server.close()}
})
