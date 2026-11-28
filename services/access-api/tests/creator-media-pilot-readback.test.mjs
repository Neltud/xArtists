import assert from 'node:assert/strict'
import {test} from 'node:test'
import crypto from 'node:crypto'
import pg from 'pg'
import sdk from '@multiversx/sdk-core'
import {uploadStudioMedia,pinStudioMetadata,verifyStudioMediaReadback,verifyStudioMetadataReadback,validateCreatorMedia,createStudioMetadata} from '../src/creatorMedia.mjs'
const cid='bafy'+'a'.repeat(52)
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL5sAAAAASUVORK5CYII=','base64')
const check=validateCreatorMedia(png,'image/png')
const filename='artwork-'+check.sha256.slice(0,24)+'.png'
const media={buffer:png,mime:'image/png'}
const jsonReceipt=()=>Response.json({IpfsHash:cid})
const wallet=()=>new sdk.Address(crypto.generateKeyPairSync('ed25519').publicKey.export({type:'spki',format:'der'}).subarray(-32)).toBech32()
test('pilot verifies bytes, refuses a redirect, and never forwards provider credentials',async()=>{
 await verifyStudioMediaReadback(cid,filename,check,async(url,options)=>{
  assert.equal(url,'https://ipfs.io/ipfs/'+cid+'/'+filename)
  assert.equal(options.method,'GET')
  assert.equal(options.redirect,'error')
  assert.equal(options.headers.Authorization,undefined)
  return new Response(png)
 })
 for(const wrong of [Buffer.alloc(png.length),png.subarray(0,-1),Buffer.concat([png,Buffer.from([1])])]){
  await assert.rejects(verifyStudioMediaReadback(cid,filename,check,async()=>new Response(wrong)),/media_readback_unverified/)
 }
 await assert.rejects(verifyStudioMediaReadback(cid,'../other',check,async()=>{throw Error('must not fetch')}),/media_readback_unverified/)
 await assert.rejects(verifyStudioMediaReadback(cid,filename,check,async()=>new Response(null,{status:302,headers:{location:'https://other.example'}})),/media_readback_unverified/)
})
test('metadata must match expected fields and bounded size',async()=>{
 const content={name:'Artwork',image:'ipfs://'+cid,attributes:[{trait_type:'a',value:'b'}]}
 await verifyStudioMetadataReadback(cid,content,async()=>Response.json({attributes:content.attributes,image:content.image,name:content.name}))
 await assert.rejects(verifyStudioMetadataReadback(cid,content,async()=>Response.json({...content,name:'Wrong'})),/media_readback_unverified/)
 await assert.rejects(verifyStudioMetadataReadback(cid,content,async()=>new Response('x'.repeat(16385))),/media_readback_unverified/)
})
test('real PostgreSQL: failed readback holds reservation and prevents concurrent replay; verified media and metadata commit',{skip:!process.env.TEST_STUDIO_DATABASE_URL},async()=>{
 const pool=new pg.Pool({connectionString:process.env.TEST_STUDIO_DATABASE_URL})
 const vars={STUDIO_FREE_PILOT:'1',STUDIO_IPFS_PROVIDER:'pinata',CREATOR_MEDIA_UPLOAD_ENABLED:'1',PINATA_JWT:'test-only-not-real-'.repeat(4),DATABASE_URL:process.env.TEST_STUDIO_DATABASE_URL,ACCESS_JWT_SECRET:'test-only-not-real-'.repeat(4)}
 const previous=Object.fromEntries(Object.keys(vars).map(k=>[k,process.env[k]]))
 Object.assign(process.env,vars)
 const dbTx=async cb=>{const c=await pool.connect();try{await c.query('BEGIN');const value=await cb(c);await c.query('COMMIT');return value}catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}}
 const first=wallet(),second=wallet()
 try{
  let posts=0
  const wrongReadback=async(_url,opts)=>{
   if(opts.method==='POST'){posts++;return jsonReceipt()}
   return new Response(Buffer.alloc(png.length))
  }
  const both=await Promise.allSettled([uploadStudioMedia(media,first,wrongReadback,dbTx),uploadStudioMedia(media,first,wrongReadback,dbTx)])
  assert.equal(posts,1)
  assert.ok(both.every(x=>x.status==='rejected'&&x.reason.message==='media_pin_result_unknown_reconcile'))
  const rows=(await pool.query('SELECT * FROM public.xartists_studio_media WHERE wallet=$1',[first])).rows
  assert.equal(rows.length,1)
  assert.equal(rows[0].status,'reserved')
  assert.equal(rows[0].sha256,check.sha256)
  assert.equal(rows[0].uri,'ipfs://'+cid+'/'+filename)
  const uploaded=await uploadStudioMedia(media,second,async(_url,opts)=>opts.method==='POST'?jsonReceipt():new Response(png),dbTx)
  const row=(await pool.query('SELECT * FROM public.xartists_studio_media WHERE id=$1',[uploaded.uploadId])).rows[0]
  assert.equal(row.status,'pinned')
  const body={uploadId:uploaded.uploadId,title:'Test artwork',rightsAccepted:true}
  const expected=createStudioMetadata(row,body,second)
  const result=await pinStudioMetadata(second,body,async(_url,opts)=>opts.method==='POST'?jsonReceipt():Response.json(expected),dbTx)
  assert.equal(result.metadataUri,'ipfs://'+cid)
  const final=(await pool.query('SELECT status,metadata_uri FROM public.xartists_studio_media WHERE id=$1',[uploaded.uploadId])).rows[0]
  assert.equal(final.status,'pinned')
  assert.equal(final.metadata_uri,result.metadataUri)
 }finally{
  for(const [key,value] of Object.entries(previous)){if(value===undefined)delete process.env[key];else process.env[key]=value}
  await pool.end()
 }
})
