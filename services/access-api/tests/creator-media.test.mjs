import assert from 'node:assert/strict'
import {test} from 'node:test'
import crypto from 'node:crypto'
import sdk from '@multiversx/sdk-core'
import {Readable} from 'node:stream'
import {createChallenge} from '../src/siwx.mjs'
import {signJwt} from '../src/verifyAccess.mjs'
import {startServer,post} from './server-fixture.mjs'
import {studioMediaConfig,mediaJwt,mediaActor,validateCreatorMedia,readCreatorMedia,
  createStudioMetadata,studioMetadataFingerprint,safePinataCid,validateStudioGlb} from '../src/creatorMedia.mjs'

const {Address}=sdk
const owner=new Address(crypto.generateKeyPairSync('ed25519').publicKey.export({
  type:'spki',format:'der'}).subarray(-32)).toBech32()
const attacker=new Address(crypto.generateKeyPairSync('ed25519').publicKey.export({
  type:'spki',format:'der'}).subarray(-32)).toBech32()
const png=Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),Buffer.from('test PNG bytes')])
const jpg=Buffer.from('ffd8ff1122334455','hex')
const webp=Buffer.from('RIFF1234WEBPabcdefghijklmnop')
const mp4=Buffer.concat([Buffer.from([0,0,0,24]),Buffer.from('ftypisom'),Buffer.alloc(24)])
const hash='a'.repeat(64)
const row={
  wallet:owner,mime:'image/jpeg',sha256:hash,status:'pinned',
  uri:'ipfs://bafybeigdyrztq7pt6vjg3x3f6jkq7irymr4i6kbr6nleqx4nxfef6c2kmi/artwork-a.jpg',
}

test('upload is always disabled by default and requires Postgres, Pinata and explicit gate',()=>{
  assert.equal(studioMediaConfig({}).enabled,false)
  const env={CREATOR_MEDIA_UPLOAD_ENABLED:'1',PINATA_JWT:'X'.repeat(90),
    DATABASE_URL:'postgres://dev-fixture',ACCESS_JWT_SECRET:'Z'.repeat(40)}
  assert.equal(studioMediaConfig(env).enabled,true)
  assert.equal(studioMediaConfig({...env,DATABASE_URL:''}).enabled,false)
  assert.equal(studioMediaConfig({...env,PINATA_JWT:''}).enabled,false)
  assert.equal(studioMediaConfig({...env,CREATOR_MEDIA_UPLOAD_ENABLED:'0'}).enabled,false)
})
test('wallet-authenticated media JWT purpose cannot be borrowed from TCA or physical works',()=>{
  const secret='T'.repeat(45),issued=mediaJwt(owner,secret)
  assert.equal(mediaActor({authorization:'Bearer '+issued.token},secret),owner)
  assert.equal(mediaActor({authorization:'Bearer '+issued.token+'wrong'},secret),null)
  const tca=signJwt({sub:owner,iat:Math.floor(Date.now()/1000),
    exp:Math.floor(Date.now()/1000)+900,purpose:'physical_art'},secret)
  assert.equal(mediaActor({authorization:'Bearer '+tca},secret),null)
  assert.equal(mediaActor({},secret),null)
})
test('SIWX labels separate IPFS upload from TCA and physical receipt proof',()=>{
  const studio=createChallenge(owner,Date.now(),'studio_media')
  assert.equal(studio.message.startsWith('xArtists Creator Studio media upload login\n'),true)
  assert.equal(createChallenge(owner).message.startsWith('xArtists TCA login\n'),true)
})
test('binary media magic header is checked separately from claimed MIME',()=>{
  assert.equal(validateCreatorMedia(jpg,'image/jpeg').ext,'jpg')
  assert.equal(validateCreatorMedia(png,'image/png').ext,'png')
  assert.equal(validateCreatorMedia(webp,'image/webp').ext,'webp')
  assert.equal(validateCreatorMedia(mp4,'video/mp4').ext,'mp4')
  assert.equal(validateCreatorMedia(jpg,'image/jpeg').sha256,
    crypto.createHash('sha256').update(jpg).digest('hex'))
  assert.throws(()=>validateCreatorMedia(png,'image/jpeg'),/media_content_signature_invalid/)
  assert.throws(()=>validateCreatorMedia(Buffer.from('bad'), 'application/octet-stream'),/unsupported_media_type/)
  assert.throws(()=>validateCreatorMedia(Buffer.alloc(0),'image/jpeg'),/media_size_invalid/)
  assert.throws(()=>validateCreatorMedia(Buffer.alloc(16*1024*1024+1),'image/jpeg'),/media_size_invalid/)
})
test('raw media request requires valid bounded Content-Length and MIME signature',async()=>{
  const req=Readable.from([jpg])
  req.headers={'content-length':String(jpg.length),'content-type':'image/jpeg'}
  const valid=await readCreatorMedia(req)
  assert.equal(valid.bytes,jpg.length)
  const big=Readable.from([jpg]);big.headers={'content-length':String(48*1024*1024+1),'content-type':'video/mp4'}
  await assert.rejects(()=>readCreatorMedia(big),/media_size_invalid/)
  const mismatched=Readable.from([jpg]);mismatched.headers={'content-length':'100','content-type':'image/jpeg'}
  await assert.rejects(()=>readCreatorMedia(mismatched),/media_length_mismatch/)
})
test('image metadata is pinned only for owning wallet with rights explicitly attested',()=>{
  const meta=createStudioMetadata(row,{title:'My painting',description:'Oil',rightsAccepted:true},owner)
  assert.equal(meta.image,row.uri)
  assert.equal(meta.animation_url,undefined)
  assert.equal(meta.name,'My painting')
  assert.equal(meta.attributes[1].value,hash)
  assert.throws(()=>createStudioMetadata(row,{title:'My painting',rightsAccepted:true},attacker),
    /media_record_not_owned_or_pinned/)
  assert.throws(()=>createStudioMetadata(row,{title:'My painting',rightsAccepted:false},owner),
    /media_rights_confirmation_required/)
})
test('published metadata fingerprint binds exact title, description, media and artist',()=>{
  const request={title:'My painting',description:'Oil',rightsAccepted:true}
  const fingerprint=studioMetadataFingerprint(row,request,owner)
  assert.match(fingerprint,/^[a-f0-9]{64}$/)
  assert.equal(fingerprint,studioMetadataFingerprint(row,{...request},owner))
  assert.notEqual(fingerprint,studioMetadataFingerprint(row,{...request,title:'Altered'},owner))
  assert.notEqual(fingerprint,studioMetadataFingerprint(row,{...request,description:'New text'},owner))
  assert.notEqual(fingerprint,studioMetadataFingerprint({...row,sha256:'b'.repeat(64)},request,owner))
  assert.throws(()=>studioMetadataFingerprint(row,request,attacker),/media_record_not_owned_or_pinned/)
  assert.throws(()=>studioMetadataFingerprint({...row,status:'metadata_pinning'},request,owner),
    /media_record_not_owned_or_pinned/)
})
test('MP4 metadata uses animation_url, not a misleading image field',()=>{
  const meta=createStudioMetadata({...row,mime:'video/mp4',
    uri:row.uri.replace('artwork-a.jpg','artwork-a.mp4')},
  {title:'Video NFT',rightsAccepted:true},owner)
  assert.ok(meta.animation_url.endsWith('.mp4'))
  assert.equal(meta.image,undefined)
})
test('unsafe CIDs and arbitrary schemes cannot be returned as verified IPFS files',()=>{
  assert.equal(safePinataCid('bafy'+'a'.repeat(40)),'bafy'+'a'.repeat(40))
  assert.throws(()=>safePinataCid('https://evil.com'),/pinata_cid_invalid/)
  assert.throws(()=>safePinataCid('..'),/pinata_cid_invalid/)
})
test('all creator upload endpoints fail closed before Pinata and database are configured',async()=>{
  const srv=await startServer({CREATOR_MEDIA_UPLOAD_ENABLED:'0',PINATA_JWT:'',DATABASE_URL:''})
  try{
    const cfg=await(await fetch(srv.base+'/v1/studio/media/config')).json()
    assert.equal(cfg.enabled,false)
    assert.equal(cfg.mint_requires_artist_signature,true)
    assert.equal((await post(srv.base+'/v1/studio/media/challenge',{address:owner})).status,503)
    assert.equal((await post(srv.base+'/v1/studio/media/session',{address:owner})).status,503)
    assert.equal((await post(srv.base+'/v1/studio/media/metadata',{title:'test'})).status,503)
    assert.equal((await post(srv.base+'/v1/studio/media/upload',{data:'fake'})).status,503)
  }finally{await srv.close()}
})

function fixtureGlb(jsonOverrides={}){
  const json={asset:{version:'2.0'},scenes:[{nodes:[0]}],nodes:[{mesh:0}],
    meshes:[{primitives:[{attributes:{POSITION:0}}]}],buffers:[{byteLength:12}],
    ...jsonOverrides}
  const bytes=Buffer.from(JSON.stringify(json))
  const pad=(4-bytes.length%4)%4
  const jsonBytes=Buffer.concat([bytes,Buffer.alloc(pad,0x20)])
  const bin=Buffer.alloc(12,0)
  const glb=Buffer.alloc(12+8+jsonBytes.length+8+bin.length)
  glb.write('glTF',0,'ascii')
  glb.writeUInt32LE(2,4)
  glb.writeUInt32LE(glb.length,8)
  glb.writeUInt32LE(jsonBytes.length,12)
  glb.writeUInt32LE(0x4e4f534a,16)
  jsonBytes.copy(glb,20)
  const offset=20+jsonBytes.length
  glb.writeUInt32LE(bin.length,offset)
  glb.writeUInt32LE(0x004e4942,offset+4)
  bin.copy(glb,offset+8)
  return glb
}

test('GLB self-contained glTF 2.0 validates magic, version, exact length and JSON',()=>{
  const source=fixtureGlb()
  assert.equal(validateStudioGlb(source).meshCount,1)
  assert.equal(validateCreatorMedia(source,'model/gltf-binary').ext,'glb')
  assert.equal(validateCreatorMedia(source,'model/gltf-binary').bytes,source.length)
  assert.throws(()=>validateCreatorMedia(source,'image/png'),/media_content_signature_invalid/)
  assert.throws(()=>validateStudioGlb(Buffer.from('not a GLB')),/glb_header_invalid/)
  const badVersion=Buffer.from(source);badVersion.writeUInt32LE(1,4)
  assert.throws(()=>validateStudioGlb(badVersion),/glb_header_invalid/)
  const badLength=Buffer.from(source);badLength.writeUInt32LE(source.length+4,8)
  assert.throws(()=>validateStudioGlb(badLength),/glb_header_invalid/)
  const truncated=source.subarray(0,source.length-4)
  assert.throws(()=>validateStudioGlb(truncated),/glb_header_invalid/)
  assert.throws(()=>validateStudioGlb(fixtureGlb({asset:{version:'1.0'}})),/glb_structure_invalid/)
  assert.throws(()=>validateStudioGlb(fixtureGlb({meshes:[]})),/glb_structure_invalid/)
})

test('GLB refuses external references even with otherwise valid chunk magic',()=>{
  assert.throws(()=>validateStudioGlb(fixtureGlb({buffers:[{byteLength:12,uri:'https://evil.example/mesh.bin'}]})),
    /glb_external_resource_forbidden/)
  assert.throws(()=>validateStudioGlb(fixtureGlb({images:[{uri:'ipfs://bafy/texture.jpg'}]})),
    /glb_external_resource_forbidden/)
  assert.throws(()=>validateStudioGlb(fixtureGlb({images:[{uri:'data:image/png;base64,AAA='}]})),
    /glb_external_resource_forbidden/)
})

test('GLB upload requires separate, default-off operator switch even if image upload enabled',async()=>{
  const env={CREATOR_MEDIA_UPLOAD_ENABLED:'1',PINATA_JWT:'X'.repeat(90),
    DATABASE_URL:'postgres://dev-fixture',ACCESS_JWT_SECRET:'Z'.repeat(40)}
  assert.equal(studioMediaConfig(env).modelEnabled,false)
  assert.equal(studioMediaConfig({...env,STUDIO_GLB_UPLOAD_ENABLED:'1'}).modelEnabled,true)
  assert.equal(studioMediaConfig({...env,STUDIO_GLB_UPLOAD_ENABLED:'0'}).modelEnabled,false)
  assert.equal(studioMediaConfig({...env,STUDIO_GLB_UPLOAD_ENABLED:'1',DATABASE_URL:''}).modelEnabled,false)
  const req=Readable.from([fixtureGlb()])
  req.headers={'content-length':String(fixtureGlb().length),'content-type':'model/gltf-binary'}
  await assert.rejects(()=>readCreatorMedia(req),/studio_glb_upload_disabled/)
})

test('GLB metadata is labeled model/animation, not photo or video',()=>{
  const model={...row,mime:'model/gltf-binary',uri:row.uri.replace('.jpg','.glb')}
  const meta=createStudioMetadata(model,{title:'Sculpture model',rightsAccepted:true},owner)
  assert.equal(meta.animation_url,model.uri)
  assert.equal(meta.image,undefined)
  assert.equal(meta.properties.category,'model')
  assert.equal(meta.properties.mime,'model/gltf-binary')
})
