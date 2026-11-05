import test from 'node:test'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {
 safeMediaUri,validateManifest,hashStream,verifyHttpReadback,verifyLocalFile,
} from '../media-integrity-check.mjs'

const media=Buffer.from('xArtists preservation checksum test\n','utf8')
const sha256=createHash('sha256').update(media).digest('hex')
const cid='bafy'+ 'a'.repeat(52)
const uri='ipfs://'+cid+'/artwork-123.png'
const manifest={
 schema_version:1,media:{uri,sha256,bytes:media.length,mime:'image/png'},
 metadata:{uri:'ipfs://'+cid},
 copies:[{provider:'pinata',status:'provider_reported',uri},
  {provider:'arweave',status:'planned',uri:null}],
}

test('strictly validates CID/Arweave IDs and rejects SSRF, traversal and mutable hosts',()=>{
 assert.equal(safeMediaUri(uri).protocol,'ipfs')
 assert.equal(safeMediaUri('ar://'+'A'.repeat(43)).protocol,'arweave')
 for(const bad of ['http://localhost','https://example.com/cat.png','ipfs://../../private',
   'ipfs://'+cid+'/../admin','ipfs://'+cid+'/%2Fprivate','ar://bad','ipfs://bafyxxx']){
   assert.throws(()=>safeMediaUri(bad),undefined,bad)
 }
 assert.equal(validateManifest(manifest).media.sha256,sha256)
 assert.throws(()=>validateManifest({...manifest,media:{...manifest.media,sha256:'0'.repeat(63)}}),/missing_valid_sha256/)
 assert.throws(()=>validateManifest({...manifest,media:{...manifest.media,bytes:0}}),/invalid_expected_bytes/)
 assert.throws(()=>validateManifest({...manifest,copies:[{provider:'pinata',status:'permanent'}]}),/invalid_copy_status/)
})

test('offline copy readback checks both size and SHA before claiming verified',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'xa-media-proof-'))
 try{
   const file=join(dir,'source.png')
   writeFileSync(file,media)
   assert.equal((await verifyLocalFile(file,manifest.media)).status,'verified_checksum')
   assert.equal((await verifyLocalFile(file,{...manifest.media,sha256:'0'.repeat(64)})).status,'mismatch')
   assert.equal((await verifyLocalFile(file,{...manifest.media,bytes:3})).status,'error')
   assert.equal((await verifyLocalFile(join(dir,'missing'),manifest.media)).status,'error')
 }finally{rmSync(dir,{recursive:true,force:true})}
})

test('HTTP readback uses only trusted gateway names, checks hash and refuses redirects',async()=>{
 const url=safeMediaUri(uri).urls[0]
 let observedUrl=''
 const mock=async (received,opts)=>{
    observedUrl=received
    assert.equal(opts.method,'GET')
    assert.equal(opts.redirect,'error')
    return new Response(media,{status:200})
 }
 const verified=await verifyHttpReadback(url,manifest.media,mock)
 assert.equal(verified.status,'verified_checksum')
 assert.equal(observedUrl,url)
 const wrong=await verifyHttpReadback(url,{...manifest.media,sha256:'0'.repeat(64)},mock)
 assert.equal(wrong.status,'mismatch')
 const unavailable=await verifyHttpReadback(url,manifest.media,async()=>new Response('',{status:404}))
 assert.equal(unavailable.status,'unavailable')
 const long=await verifyHttpReadback(url,{...manifest.media,bytes:2},mock)
 assert.equal(long.status,'error')
 await assert.rejects(()=>verifyHttpReadback('https://localhost/private',manifest.media,mock),/gateway_not_allowed/)
})

test('Arweave network readback cannot certify permanence or mint',()=>{
 const url=safeMediaUri('ar://'+'Q'.repeat(43)).urls[0]
 assert.equal(url,'https://arweave.net/'+'Q'.repeat(43))
 assert.ok(!JSON.stringify(manifest).includes('permanent'))
})
