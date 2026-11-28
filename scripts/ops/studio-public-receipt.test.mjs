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
