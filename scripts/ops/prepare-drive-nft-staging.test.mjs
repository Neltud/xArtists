import test from 'node:test'
import assert from 'node:assert/strict'
import {stageDriveArtworkMetadata as stage} from './prepare-drive-nft-staging.mjs'
const png=(name='xArtists0291.png',size='220881')=>({name,mimeType:'image/png',size,
  id:'sensitive-drive-id',webViewLink:'https://drive.google.com/file/d/sensitive-id',
  owners:['private@example.test'],description:'private details',sha256Checksum:'not-proven',
  rightsVerified:true,mintAllowed:true,metadataCid:'fake',image:'ipfs://fake'})
test('Drive metadata can only create a private paper draft without inherited privileges',()=>{
 const r=stage([png()])
 assert.equal(r.importedCount,1)
 assert.equal(r.rejectedCount,0)
 assert.equal(r.status,'DRAFT_UNMINTED')
 assert.equal(r.release.mintEnabled,false)
 const a=r.candidates[0]
 assert.deepEqual({name:a.filename,mime:a.mediaType,size:a.bytes},
   {name:'xArtists0291.png',mime:'image/png',size:220881})
 for(const k of ['contentSha256','mediaCid','metadataCid','image','animation_url'])
   assert.equal(a[k],null)
 assert.equal(a.minted,false)
 assert.equal(a.mintAllowed,false)
 assert.equal(a.rightsVerified,false)
 assert.equal(a.rightsDeclared,false)
 const safe=JSON.stringify(r)
 for(const sensitive of ['sensitive-drive-id','private@example.test','private details',
   'not-proven','ipfs://fake','https://drive.google.com'])assert.equal(safe.includes(sensitive),false)
})
test('independent filenames do not become duplicate token IDs',()=>{
 const r=stage([png('xArtists0291.png'),png('xArtists0291.png'),png('xArtists0286.png')])
 assert.deepEqual(r.candidates.map(x=>x.stagingId),['draft-001','draft-002','draft-003'])
 assert.deepEqual(r.candidates.map(x=>x.possibleDuplicate),[false,true,false])
})
test('reject URL, path traversal, folders, unsupported formats and huge files',()=>{
 const r=stage({files:[
  png('../secret.png'),png('https://example.com/asset.png'),
  png('xArtists0111.png','16777217'),png('xArtists0001.jpg'),
  {name:'movie.mp4',mimeType:'video/mp4',size:'2000'},
  {title:'xArtists0291.png',mime_type:'image/png',size:'220881'},
  null
 ]})
 assert.equal(r.importedCount,1)
 assert.equal(r.rejectedCount,6)
 assert.equal(r.candidates[0].filename,'xArtists0291.png')
 assert.equal(r.rejected.some(x=>x.reason==='too_large'),true)
})
test('fail-closed inputs, no implicit collection, no signer or money transfers',()=>{
 for(const bad of [null,undefined,{},'none',{files:{}},
   {files:Array(201).fill(png())}])assert.throws(()=>stage(bad),/invalid_input/)
 assert.equal(stage([]).importedCount,0)
 const output=stage([png()])
 assert.equal(Object.hasOwn(output,'wallet'),false)
 assert.equal(Object.hasOwn(output,'collection'),false)
 assert.equal(Object.hasOwn(output,'nfts'),false)
})
