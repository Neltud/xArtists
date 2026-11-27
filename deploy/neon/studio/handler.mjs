/** Isolated Studio Fetch API. No mint, money, account or trading routes. */
import crypto from 'node:crypto'
import {Readable} from 'node:stream'
import {erdToPubkey,verifyErdSignature} from '../../../services/access-api/src/siwx.mjs'
import {studioMediaConfig,mediaJwt,mediaActor,readCreatorMedia,uploadStudioMedia,pinStudioMetadata} from '../../../services/access-api/src/creatorMedia.mjs'
import {checkStudioIpfsReadiness} from '../../../services/access-api/src/studioPreflight.mjs'
const ORIGINS=new Set(['https://xartists.art','https://www.xartists.art'])
export const PILOT_MAX_BYTES=2*1024*1024
const TARGET='shy-tooth-63227941', BRANCH='br-sparkling-breeze-bh8gp2jl'
const fail=(code,statusCode=400)=>Object.assign(new Error(code),{statusCode})
const config=env=>studioMediaConfig(env)
export function targetReady(env){
 return env.NEON_BRANCH_ID===BRANCH&&env.XARTISTS_STUDIO_PROJECT_CONFIRMED===TARGET
  &&env.STUDIO_FREE_PILOT==='1'&&env.STUDIO_IPFS_PROVIDER==='pinata'
  &&env.STUDIO_GLB_UPLOAD_ENABLED!=='1'&&env.PGSSL!=='0'
  &&typeof env.ACCESS_JWT_SECRET==='string'&&env.ACCESS_JWT_SECRET.length>=32
}
function respond(request,body,status=200){
 const headers=new Headers({'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','content-security-policy':"default-src 'none'; frame-ancestors 'none'",vary:'Origin'})
 const origin=request.headers.get('origin')
 if(ORIGINS.has(origin)){
  headers.set('access-control-allow-origin',origin)
  headers.set('access-control-allow-methods','GET, HEAD, POST, OPTIONS')
  headers.set('access-control-allow-headers','authorization,content-type,x-studio-rights')
 }
 return new Response(status===204||request.method==='HEAD'?null:JSON.stringify(body),{status,headers})
}
async function smallJson(request){
 if(request.headers.get('content-type')?.split(';')[0]!=='application/json'||!request.body)throw fail('invalid_request')
 const chunks=[];let total=0
 for await(const chunk of request.body){total+=chunk.byteLength;if(total>8192)throw fail('request_too_large',413);chunks.push(Buffer.from(chunk))}
 let body
 try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{throw fail('invalid_request')}
 if(!body||Array.isArray(body)||typeof body!=='object')throw fail('invalid_request')
 return body
}
export function createStudioHandler({env=process.env,store=null,preflight=checkStudioIpfsReadiness,
 now=Date.now,verify=verifyErdSignature,validateAddress=erdToPubkey,
 readMedia=readCreatorMedia,upload=uploadStudioMedia,pin=pinStudioMetadata}={}){
 let cached=null,inFlight=null
 const readiness=async()=>{
  if(!store||!targetReady(env)||env.XARTISTS_STUDIO_UPLOAD_APPROVED!=='1'||!config(env).enabled)return false
  if(cached&&now()<cached.until)return cached.ready
  if(!inFlight)inFlight=Promise.resolve().then(async()=>{
   try{const p=await preflight({env});return p.ok===true&&await store.ready()===true}catch{return false}
  }).then(ready=>{cached={ready,until:now()+30000};return ready}).finally(()=>{inFlight=null})
  return inFlight
 }
 return {async fetch(request){
  const out=(body,status)=>respond(request,body,status)
  if(request.headers.has('origin')&&!ORIGINS.has(request.headers.get('origin')))return out({ok:false,error:'origin_not_allowed'},403)
  const path=new URL(request.url).pathname
  if(request.method==='OPTIONS')return out(null,204)
  if((request.method==='GET'||request.method==='HEAD')&&path==='/health')return out({ok:true,service:'xartists-studio-neon',studio_upload_enabled:await readiness(),mint_requires_artist_signature:true,commerce_enabled:false},200)
  if((request.method==='GET'||request.method==='HEAD')&&path==='/v1/studio/media/config'){
   const enabled=await readiness()
   return out({ok:true,enabled,provider:enabled?'pinata_ipfs':'disabled',modelEnabled:false,maxImageMiB:2,maxVideoMiB:0,maxAudioMiB:0,maxModelMiB:0,pilot_images_only:true,mint_requires_artist_signature:true},200)
  }
  if(!['/v1/studio/media/challenge','/v1/studio/media/session','/v1/studio/media/upload','/v1/studio/media/metadata'].includes(path))return out({ok:false,error:'route_not_available'},404)
  if(request.method!=='POST')return out({ok:false,error:'method_not_allowed'},405)
  if(!await readiness())return out({ok:false,error:'studio_upload_not_configured'},503)
  const secret=env.ACCESS_JWT_SECRET
  try{
   if(path.endsWith('/challenge')){
    const body=await smallJson(request),address=typeof body.address==='string'?body.address.trim():''
    try{validateAddress(address)}catch{throw fail('invalid_creator_challenge')}
    const nonce=crypto.randomBytes(16).toString('hex'),issued=new Date(now()).toISOString()
    const message='xArtists Creator Studio media upload login\naddress:'+address+'\nnonce:'+nonce+'\nissued:'+issued+'\ndomain:xartists.art'
    await store.issue({nonce,address,message,expiresAt:new Date(now()+300000)})
    return out({ok:true,message,nonce,issued,expiresIn:300},200)
   }
   if(path.endsWith('/session')){
    const {address,message,nonce,signature}=await smallJson(request)
    if(typeof nonce!=='string'||!/^([0-9a-f]{32})$/.test(nonce)||typeof message!=='string'||message.length>512||!message.startsWith('xArtists Creator Studio media upload login\n')||!verify(address,message,signature))throw fail('studio_media_siwx_invalid',401)
    if(!await store.consume({nonce,address,message}))throw fail('studio_media_siwx_invalid',401)
    return out({ok:true,...mediaJwt(address,secret)},200)
   }
   const headers=Object.fromEntries(request.headers),actor=mediaActor(headers,secret)
   if(!actor)throw fail('studio_media_wallet_required',401)
   if(path.endsWith('/upload')){
    if(headers['x-studio-rights']!=='accepted')throw fail('media_rights_confirmation_required',403)
    if(!['image/jpeg','image/png','image/webp'].includes(headers['content-type'])||!request.body)throw fail('unsupported_media_type',415)
    const length=Number(headers['content-length'])
    if(!Number.isInteger(length)||length<1||length>PILOT_MAX_BYTES)throw fail('media_size_invalid',413)
    // Bound the stream independently of the untrusted length, before buffering.
    const input=Readable.from((async function*(){let n=0;for await(const chunk of request.body){n+=chunk.byteLength;if(n>length||n>PILOT_MAX_BYTES)throw fail('media_size_invalid',413);yield Buffer.from(chunk)}})())
    input.headers=headers
    const media=await readMedia(input)
    return out({ok:true,...await upload(media,actor)},201)
   }
   return out({ok:true,...await pin(actor,await smallJson(request))},200)
  }catch(error){
   const code=typeof error?.message==='string'&&/^[a-z0-9_]{1,80}$/.test(error.message)&&[400,401,403,409,413,415,429,502,503].includes(error.statusCode)?error.message:'studio_request_unavailable'
   return out({ok:false,error:code},code==='studio_request_unavailable'?503:error.statusCode)
  }
 }}
}
