import test from 'node:test'
import assert from 'node:assert/strict'
import {runStudioReceipt,ORIGIN} from './studio-public-receipt.mjs'
const source='a'.repeat(40)
const api='/v1/studio/media/'
function fixture({enabled=false,wrongSha=false}={}){
 const calls=[]
 const request=async(url,o)=>{
  calls.push({url,method:o.method,headers:o.headers})
  assert.ok(url.startsWith(ORIGIN+'/'))
  assert.equal(o.redirect,'error')
  const path=url.slice(ORIGIN.length)
  const out=(body,status=200)=>Response.json(body,{status,headers:o.headers.Origin==='https://xartists.art'?{'Access-Control-Allow-Origin':o.headers.Origin}:{}})
  if(o.headers.Origin==='https://invalid.example')return out({ok:false},403)
  if(path==='/health')return out({ok:true,service:'xartists-studio-neon',source_sha:wrongSha?'b'.repeat(40):source,commerce_enabled:false,mint_requires_artist_signature:true,studio_upload_enabled:enabled})
  if(path===api+'config')return out({ok:true,enabled,provider:enabled?'pinata_ipfs':'disabled',pilot_images_only:true,maxImageMiB:2,maxVideoMiB:0,maxAudioMiB:0,maxModelMiB:0,modelEnabled:false,mint_requires_artist_signature:true})
  if(path==='/v1/checkout')return out({ok:false},404)
  throw Error('unexpected_call')
 }
 return {request,calls}
}
test('read-only receipt checks public identity and never sends writes',async()=>{
 const h=fixture()
 assert.deepEqual(await runStudioReceipt({request:h.request,expectedSource:source}),{source_sha:source,mode:'read_only',upload_enabled:false,commerce_enabled:false})
 assert.equal(h.calls.length,4)
 assert.ok(h.calls.every(x=>x.method==='GET'&&!x.headers.Authorization))
})
test('write cannot run before verified enabled state',async()=>{
 const h=fixture()
 await assert.rejects(runStudioReceipt({request:h.request,expectedSource:source,write:true}),/pilot_not_enabled/)
 assert.ok(h.calls.every(x=>x.method==='GET'))
})
test('wrong source aborts before any other call',async()=>{
 const h=fixture({wrongSha:true})
 await assert.rejects(runStudioReceipt({request:h.request,expectedSource:source,write:true}),/health_mismatch/)
 assert.equal(h.calls.length,1)
})

test('complete canary against actual Fetch handler verifies signature, one upload and public readbacks',async()=>{
 const {createStudioHandler}=await import('../../deploy/neon/studio/handler.mjs')
 const {createStudioMetadata}=await import('../../services/access-api/src/creatorMedia.mjs')
 const {createHash}=await import('node:crypto')
 const rows=new Map(),cid='bafy'+'a'.repeat(52)
 const id='00000000-0000-4000-8000-000000000001'
 let uploaded=null,metadata=null,posts=0,metadataPosts=0
 const env={NEON_BRANCH_ID:'br-sparkling-breeze-bh8gp2jl',XARTISTS_STUDIO_PROJECT_CONFIRMED:'shy-tooth-63227941',STUDIO_FREE_PILOT:'1',STUDIO_IPFS_PROVIDER:'pinata',CREATOR_MEDIA_UPLOAD_ENABLED:'1',XARTISTS_STUDIO_UPLOAD_APPROVED:'1',DATABASE_URL:'fixture',PINATA_JWT:'test-only-not-real-'.repeat(4),ACCESS_JWT_SECRET:'test-only-not-real-'.repeat(4)}
 const h=createStudioHandler({env,sourceSha:source,preflight:async()=>({ok:true}),store:{
  ready:async()=>true,issue:async v=>{rows.set(v.nonce,v)},consume:async v=>{const row=rows.get(v.nonce);if(!row||row.address!==v.address||row.message!==v.message)return false;rows.delete(v.nonce);return true}
 },readMedia:async stream=>{const chunks=[];for await(const chunk of stream)chunks.push(chunk);return Buffer.concat(chunks)},upload:async(buffer,wallet)=>{
  posts++;const sha256=createHash('sha256').update(buffer).digest('hex')
  uploaded={buffer,wallet,sha256,uri:'ipfs://'+cid+'/artwork-'+sha256.slice(0,24)+'.png'}
  return {uploadId:id,uri:uploaded.uri,mime:'image/png',bytes:buffer.length,sha256}
 },pin:async(wallet,body)=>{
  metadataPosts++;assert.equal(body.uploadId,id)
  metadata=createStudioMetadata({...uploaded,status:'pinned',mime:'image/png'},body,wallet)
  return {mediaUri:uploaded.uri,metadataUri:'ipfs://'+cid}
 }})
 const request=async(url,o)=>{
  if(url.startsWith(ORIGIN+'/'))return h.fetch(new Request(url,o))
  assert.equal(o.headers?.Authorization,undefined)
  assert.equal(o.redirect,'error')
  if(url==='https://ipfs.io/ipfs/'+cid)return Response.json(metadata)
  if(url==='https://ipfs.io/ipfs/'+uploaded.uri.slice(7))return new Response(uploaded.buffer)
  throw Error('unexpected_gateway')
 }
 const receipt=await runStudioReceipt({request,expectedSource:source,write:true})
 assert.equal(receipt.media_verified,true)
 assert.equal(receipt.metadata_verified,true)
 assert.equal(receipt.nft_minted,false)
 assert.equal(posts,1)
 assert.equal(metadataPosts,1)
 assert.equal(rows.size,0)
})
