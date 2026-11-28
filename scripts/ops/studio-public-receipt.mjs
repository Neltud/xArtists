/** Explicit one-shot public Studio receipt. No funded wallet, mint, checkout or automatic retry. */
import assert from 'node:assert/strict'
import {createHash,generateKeyPairSync,sign} from 'node:crypto'
import {createRequire} from 'node:module'
import {isDeepStrictEqual} from 'node:util'
import {pathToFileURL} from 'node:url'
const require=createRequire(new URL('../../services/access-api/package.json',import.meta.url))
const {Address,Message,MessageComputer}=require('@multiversx/sdk-core')
export const ORIGIN='https://br-sparkling-breeze-bh8gp2jl-studio.compute.c-10.eu-central-1.aws.neon.tech'
const PREFIX='/v1/studio/media/'
const WEB='https://xartists.art'
const FIXTURE=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL5sAAAAASUVORK5CYII=','base64')
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex')
const TITLE='xArtists Studio technical test'
const DESCRIPTION='Synthetic 1 pixel test image. No artwork sale, NFT or financial transaction.'
const requireOk=(condition,code)=>{if(!condition)throw Error(code)}
function gatewayUrl(uri,kind){
 const cid='(?:Qm[1-9A-HJ-NP-Za-km-z]{44}|b[a-z2-7]{20,100})'
 const path=kind==='image'?'/artwork-[a-f0-9]{24}\\.png':''
 requireOk(typeof uri==='string'&&new RegExp('^ipfs://'+cid+path+'$').test(uri),'invalid_ipfs_receipt')
 return 'https://ipfs.io/ipfs/'+uri.slice(7)
}
async function bounded(response,max){
 requireOk(!!response.body,'empty_response')
 const chunks=[];let total=0
 for await(const part of response.body){
  total+=part.byteLength
  requireOk(total<=max,'response_too_large')
  chunks.push(Buffer.from(part))
 }
 return Buffer.concat(chunks)
}
export async function runStudioReceipt({request=fetch,write=false,expectedSource}={}){
 requireOk(/^[a-f0-9]{40}$/.test(expectedSource||''),'expected_source_required')
 let stage='health'
 const call=async(path,{method='GET',body,token,headers={},status=200,origin=WEB}={})=>{
  const json=body!==undefined&&!Buffer.isBuffer(body)
  const res=await request(ORIGIN+path,{method,redirect:'error',signal:AbortSignal.timeout(90000),headers:{Origin:origin,...(json?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{}),...headers},body:json?JSON.stringify(body):body})
  requireOk(res.status===status,stage+'_http_'+res.status)
  requireOk(res.headers.get('access-control-allow-origin')===(origin===WEB?WEB:null),stage+'_cors')
  return JSON.parse((await bounded(res,65536)).toString('utf8'))
 }
 try{
  const health=await call('/health')
  requireOk(health.ok===true&&health.service==='xartists-studio-neon'&&health.source_sha===expectedSource&&health.commerce_enabled===false&&health.mint_requires_artist_signature===true,'health_mismatch')
  stage='config'
  const config=await call(PREFIX+'config')
  requireOk(config.ok===true&&config.pilot_images_only===true&&config.maxImageMiB===2&&config.maxVideoMiB===0&&config.maxAudioMiB===0&&config.maxModelMiB===0&&config.modelEnabled===false&&config.mint_requires_artist_signature===true&&typeof config.enabled==='boolean'&&config.enabled===health.studio_upload_enabled,'config_mismatch')
  stage='foreign_origin'
  await call('/health',{origin:'https://invalid.example',status:403})
  stage='checkout_absent'
  await call('/v1/checkout',{status:404})
  if(!write)return {source_sha:expectedSource,mode:'read_only',upload_enabled:config.enabled,commerce_enabled:false}
  requireOk(config.enabled&&config.provider==='pinata_ipfs','pilot_not_enabled')
  stage='unsigned_upload'
  await call(PREFIX+'upload',{method:'POST',body:FIXTURE,headers:{'Content-Type':'image/png','X-Studio-Rights':'accepted'},status:401})
  // Ephemeral Ed25519 test identity, never persisted, funded or used to sign a transaction.
  const keys=generateKeyPairSync('ed25519'),computer=new MessageComputer()
  const address=new Address(keys.publicKey.export({type:'spki',format:'der'}).subarray(-32)).toBech32()
  stage='challenge'
  const ch=await call(PREFIX+'challenge',{method:'POST',body:{address}})
  requireOk(ch.ok===true&&/^[a-f0-9]{32}$/.test(ch.nonce)&&typeof ch.message==='string'&&ch.message.includes('address:'+address+'\n')&&ch.message.includes('nonce:'+ch.nonce+'\n')&&ch.message.endsWith('domain:xartists.art'),'challenge_mismatch')
  const proof={address,nonce:ch.nonce,message:ch.message,signature:sign(null,computer.computeBytesForSigning(new Message({data:Buffer.from(ch.message)})),keys.privateKey).toString('hex')}
  stage='session'
  const session=await call(PREFIX+'session',{method:'POST',body:proof})
  requireOk(session.ok===true&&typeof session.token==='string'&&session.token.length>40,'session_missing')
  stage='replay_rejected'
  await call(PREFIX+'session',{method:'POST',body:proof,status:401})
  stage='rights_rejected'
  await call(PREFIX+'upload',{method:'POST',body:FIXTURE,token:session.token,headers:{'Content-Type':'image/png'},status:403})
  stage='upload'
  const media=await call(PREFIX+'upload',{method:'POST',body:FIXTURE,token:session.token,headers:{'Content-Type':'image/png','Content-Length':String(FIXTURE.length),'X-Studio-Rights':'accepted'},status:201})
  requireOk(media.ok===true&&/^[a-f0-9-]{36}$/.test(media.uploadId)&&media.mime==='image/png'&&media.bytes===FIXTURE.length&&media.sha256===sha256(FIXTURE),'media_receipt_mismatch')
  stage='image_readback'
  const image=await request(gatewayUrl(media.uri,'image'),{redirect:'error',signal:AbortSignal.timeout(45000)})
  requireOk(image.ok,'image_gateway_unavailable')
  const bytes=await bounded(image,FIXTURE.length)
  requireOk(bytes.equals(FIXTURE),'image_bytes_mismatch')
  stage='metadata'
  const metadata=await call(PREFIX+'metadata',{method:'POST',token:session.token,body:{uploadId:media.uploadId,title:TITLE,description:DESCRIPTION,rightsAccepted:true}})
  requireOk(metadata.ok===true&&metadata.mediaUri===media.uri,'metadata_receipt_mismatch')
  stage='metadata_readback'
  const res=await request(gatewayUrl(metadata.metadataUri,'metadata'),{redirect:'error',signal:AbortSignal.timeout(45000)})
  requireOk(res.ok,'metadata_gateway_unavailable')
  const content=JSON.parse((await bounded(res,16384)).toString('utf8'))
  const expected={name:TITLE,description:DESCRIPTION,image:media.uri,properties:{category:'image',mime:'image/png'},attributes:[{trait_type:'Creator wallet',value:address},{trait_type:'SHA-256',value:sha256(FIXTURE)},{trait_type:'Creation tool',value:'xArtists Studio'}]}
  requireOk(isDeepStrictEqual(content,expected),'metadata_content_mismatch')
  return {source_sha:expectedSource,mode:'one_test_image',wallet:address,upload_id:media.uploadId,media_uri:media.uri,metadata_uri:metadata.metadataUri,sha256:sha256(FIXTURE),bytes:FIXTURE.length,media_verified:true,metadata_verified:true,commerce_enabled:false,nft_minted:false}
 }catch(error){
  // Never emit network bodies, headers, keys, or the session JWT. Never retry.
  const code=typeof error?.message==='string'&&/^[a-z0-9_]{1,80}$/.test(error.message)?error.message:'request_failed'
  throw Error('STUDIO_RECEIPT_FAILED '+stage+' '+code+'; reconcile before retry')
 }
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
 const write=process.env.STUDIO_CANARY_MODE==='PUBLISH_ONE_SYNTHETIC_IMAGE'
 if(!write&&process.env.STUDIO_CANARY_MODE!=='READ_ONLY'){console.error('Explicit receipt mode required');process.exit(2)}
 runStudioReceipt({write,expectedSource:process.env.STUDIO_EXPECTED_SOURCE}).then(receipt=>console.log('STUDIO_RECEIPT '+JSON.stringify(receipt))).catch(e=>{console.error(/^STUDIO_RECEIPT_FAILED /.test(e.message)?e.message:'STUDIO_RECEIPT_FAILED invalid_configuration');process.exitCode=1})
}
