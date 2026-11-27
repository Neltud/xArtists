import assert from 'node:assert/strict'
import {test} from 'node:test'
import {createRequire} from 'node:module'
import {generateKeyPairSync,sign} from 'node:crypto'
import {createStudioHandler} from './handler.mjs'
import {createChallengeStore} from './store.mjs'
import {inspectStudioDatabase} from '../../../services/access-api/src/studioPreflight.mjs'
const require=createRequire(new URL('../../../services/access-api/package.json',import.meta.url))
const {Address,Message,MessageComputer}=require('@multiversx/sdk-core')
const keys=generateKeyPairSync('ed25519'),computer=new MessageComputer()
const address=new Address(keys.publicKey.export({type:'spki',format:'der'}).subarray(-32)).toBech32()
const signature=message=>sign(null,computer.computeBytesForSigning(new Message({data:Buffer.from(message)})),keys.privateKey).toString('hex')
const env={NEON_BRANCH_ID:'br-sparkling-breeze-bh8gp2jl',XARTISTS_STUDIO_PROJECT_CONFIRMED:'shy-tooth-63227941',STUDIO_FREE_PILOT:'1',STUDIO_IPFS_PROVIDER:'pinata',CREATOR_MEDIA_UPLOAD_ENABLED:'1',XARTISTS_STUDIO_UPLOAD_APPROVED:'1',DATABASE_URL:'fixture',PINATA_JWT:'test-only-not-real-'.repeat(4),ACCESS_JWT_SECRET:'test-only-not-real-'.repeat(4)}
const call=(h,path,method='GET',body,headers={})=>h.fetch(new Request('https://studio.example'+path,{method,headers:{origin:'https://xartists.art',...(body?{'content-type':'application/json'}:{}),...headers},body:body===undefined?undefined:JSON.stringify(body)}))
const prefix='/v1/studio/media/'
test('default and wrong target fail closed, no account, checkout or trading route',async()=>{
 for(const bad of [{},{...env,NEON_BRANCH_ID:'other'},{...env,XARTISTS_STUDIO_UPLOAD_APPROVED:'0'}]){
  const h=createStudioHandler({env:bad,store:{ready:async()=>true},preflight:async()=>({ok:true})})
  assert.equal((await (await call(h,prefix+'config')).json()).enabled,false)
  assert.equal((await call(h,prefix+'challenge','POST',{address})).status,503)
  assert.equal((await call(h,'/v1/checkout','POST',{})).status,404)
  assert.equal((await call(h,'/health','GET',undefined,{origin:'https://evil.example'})).status,403)
 }
})
test('real MultiversX signature is bound to one challenge; upload checks rights and size before any read or pin',async()=>{
 const rows=new Map();let calls=0
 const store={ready:async()=>true,issue:async v=>{rows.set(v.nonce,v)},consume:async v=>{
  const row=rows.get(v.nonce)
  if(!row||row.address!==v.address||row.message!==v.message)return false
  rows.delete(v.nonce);return true
 }}
 const h=createStudioHandler({env,store,preflight:async()=>({ok:true}),readMedia:async()=>{calls++;return {}},upload:async()=>{calls++;return {}}})
 const ch=await (await call(h,prefix+'challenge','POST',{address})).json()
 const proof={address,nonce:ch.nonce,message:ch.message,signature:signature(ch.message)}
 assert.equal((await call(h,prefix+'session','POST',{...proof,signature:'0'.repeat(128)})).status,401)
 const session=await (await call(h,prefix+'session','POST',proof)).json()
 assert.ok(session.token)
 assert.equal((await call(h,prefix+'session','POST',proof)).status,401)
 const raw=(headers)=>h.fetch(new Request('https://studio.example'+prefix+'upload',{method:'POST',headers:{authorization:'Bearer '+session.token,'content-type':'image/png','content-length':'3',...headers},body:Buffer.from('abc')}))
 assert.equal((await raw({})).status,403)
 assert.equal((await raw({'x-studio-rights':'accepted','content-length':'2097153'})).status,413)
 assert.equal((await raw({'x-studio-rights':'accepted','content-type':'video/mp4'})).status,415)
 assert.equal(calls,0)
})
test('Postgres schema and one-use challenge are real and race-safe',{skip:!process.env.TEST_STUDIO_DATABASE_URL},async()=>{
 const pg=require('pg'),pool=new pg.Pool({connectionString:process.env.TEST_STUDIO_DATABASE_URL})
 try{
  const verified=await inspectStudioDatabase({env:{DATABASE_URL:process.env.TEST_STUDIO_DATABASE_URL,PGSSL:'0',CREATOR_MEDIA_UPLOAD_ENABLED:'1'}})
  assert.equal(verified.ready,true,JSON.stringify(verified))
  const store=createChallengeStore(pool)
  const nonce='a'.repeat(32),message='fixture'
  await store.issue({nonce,address,message,expiresAt:new Date(Date.now()+300000)})
  assert.equal(await store.consume({nonce,address,message:'wrong'}),false)
  const both=await Promise.all([store.consume({nonce,address,message}),store.consume({nonce,address,message})])
  assert.equal(both.filter(Boolean).length,1)
 }finally{await pool.end()}
})
