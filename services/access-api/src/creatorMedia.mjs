/**
 * xArtists Studio: real image/video -> IPFS pin, then user-signed MultiversX NFT.
 * No wallet keys, NFT signing, or transfers are ever handled by this service.
 * Disabled without explicit config. Requires persistent PG quota + secret Pinata JWT.
 */
import crypto from 'node:crypto'
import { signJwt, verifyJwt } from './verifyAccess.mjs'
import { erdToPubkey } from './siwx.mjs'

const FORMATS = Object.freeze({
  'image/jpeg': { ext:'jpg', limit: 16 * 1024 * 1024 },
  'image/png': { ext:'png', limit: 16 * 1024 * 1024 },
  'image/webp': { ext:'webp', limit: 16 * 1024 * 1024 },
  'video/mp4': { ext:'mp4', limit: 48 * 1024 * 1024 },
})
const MAX_UPLOADS_DAY=8
const SHA64=/^[a-f0-9]{64}$/i
const CID=/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z2-7]{20,})$/
const fail=(reason,statusCode=400)=>Object.assign(new Error(reason),{statusCode})
const digest=raw=>crypto.createHash('sha256').update(raw).digest('hex')
let pool
export function studioMediaConfig(env=process.env){
  const enabled=env.CREATOR_MEDIA_UPLOAD_ENABLED==='1'
    && String(env.PINATA_JWT||'').length>=40
    && Boolean(String(env.DATABASE_URL||'').trim())
    && String(env.ACCESS_JWT_SECRET||env.JWT_SECRET||'').length>=16
  return {enabled,provider:enabled?'pinata_ipfs':'disabled',maxImageMiB:16,maxVideoMiB:48,
    maxUploadsPerWalletDaily:MAX_UPLOADS_DAY,signer:'artist_wallet'}
}
export function mediaJwt(address,secret){
  erdToPubkey(address)
  if(String(secret||'').length<16)throw fail('media_auth_unconfigured',503)
  const iat=Math.floor(Date.now()/1000)
  return {token:signJwt({sub:address,purpose:'studio_media',iss:'xartists-access-api',
    iat,exp:iat+900},secret),expiresIn:900}
}
export function mediaActor(headers,secret){
  const token=String(headers.authorization||'').startsWith('Bearer ')
    ? String(headers.authorization).slice(7).trim():''
  const claims=verifyJwt(token,secret)
  if(claims?.purpose!=='studio_media')return null
  try{erdToPubkey(claims.sub);return claims.sub}catch{return null}
}
export function validateCreatorMedia(buffer,type){
  const mime=String(type||'').split(';')[0].toLowerCase().trim()
  const cfg=FORMATS[mime]
  if(!cfg)throw fail('unsupported_media_type')
  if(!Buffer.isBuffer(buffer)||buffer.length===0||buffer.length>cfg.limit)
    throw fail('media_size_invalid',413)
  let magic=false
  if(mime==='image/jpeg')magic=buffer.length>=3 && buffer[0]===0xff && buffer[1]===0xd8 && buffer[2]===0xff
  if(mime==='image/png')magic=buffer.length>=8 && buffer.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'))
  if(mime==='image/webp')magic=buffer.length>=12 && buffer.toString('ascii',0,4)==='RIFF' && buffer.toString('ascii',8,12)==='WEBP'
  if(mime==='video/mp4')magic=buffer.length>=16 && buffer.toString('ascii',4,8)==='ftyp'
  if(!magic)throw fail('media_content_signature_invalid')
  return {mime,ext:cfg.ext,bytes:buffer.length,sha256:digest(buffer)}
}
export async function readCreatorMedia(req){
  const mime=String(req.headers['content-type']||'').split(';')[0].toLowerCase().trim()
  const spec=FORMATS[mime]
  if(!spec)throw fail('unsupported_media_type')
  const declared=Number(req.headers['content-length'])
  if(!Number.isFinite(declared)||declared<=0||declared>spec.limit)throw fail('media_size_invalid',413)
  const chunks=[];let sum=0
  for await(const chunk of req){
    sum+=chunk.length
    if(sum>spec.limit)throw fail('media_size_invalid',413)
    chunks.push(chunk)
  }
  if(sum!==declared)throw fail('media_length_mismatch',400)
  const buffer=Buffer.concat(chunks)
  return {buffer,...validateCreatorMedia(buffer,mime)}
}
async function db(){
  if(!process.env.DATABASE_URL)throw fail('studio_db_required',503)
  if(!pool){
    const {default:pg}=await import('pg')
    pool=new pg.Pool({connectionString:process.env.DATABASE_URL,
      ssl:process.env.PGSSL==='0'?false:{rejectUnauthorized:true},max:3})
  }
  return pool
}
async function tx(f){
  const p=await db(),client=await p.connect()
  try{
    await client.query('BEGIN')
    await client.query("CREATE TABLE IF NOT EXISTS xartists_studio_media (id TEXT PRIMARY KEY, wallet TEXT NOT NULL, mime TEXT NOT NULL, bytes INTEGER NOT NULL, sha256 TEXT, uri TEXT, status TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), metadata_uri TEXT)")
    const result=await f(client)
    await client.query('COMMIT')
    return result
  }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e}finally{client.release()}
}
async function reserve(wallet,media){
  return tx(async c=>{
    await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[wallet])
    const count=await c.query("SELECT count(*)::int AS n FROM xartists_studio_media WHERE wallet=$1 AND created_at > NOW() - INTERVAL '24 hours'",[wallet])
    if(Number(count.rows[0].n)>=MAX_UPLOADS_DAY)throw fail('daily_upload_quota_exhausted',429)
    const id=crypto.randomUUID()
    await c.query("INSERT INTO xartists_studio_media(id,wallet,mime,bytes,status) VALUES($1,$2,$3,$4,'reserved')",[id,wallet,media.mime,media.bytes])
    return id
  })
}
export function safePinataCid(value){
  if(typeof value!=='string'||!CID.test(value))throw fail('pinata_cid_invalid',502)
  return value
}
export async function uploadStudioMedia(media,wallet,request=fetch){
  erdToPubkey(wallet)
  const check=validateCreatorMedia(media.buffer,media.mime)
  if(!studioMediaConfig().enabled)throw fail('studio_media_upload_disabled',503)
  const uploadId=await reserve(wallet,check)
  const filename='artwork-'+check.sha256.slice(0,24)+'.'+check.ext
  const fd=new FormData()
  fd.append('file',new Blob([media.buffer],{type:check.mime}),filename)
  fd.append('pinataOptions',JSON.stringify({cidVersion:1,wrapWithDirectory:true}))
  fd.append('pinataMetadata',JSON.stringify({name:filename}))
  let res
  try{
    res=await request('https://api.pinata.cloud/pinning/pinFileToIPFS',{
      method:'POST',headers:{Authorization:'Bearer '+process.env.PINATA_JWT},
      body:fd,signal:AbortSignal.timeout(120000)})
  }catch{throw fail('pinata_service_unavailable',503)}
  if(!res.ok)throw fail('pinata_upload_failed',502)
  const result=await res.json().catch(()=>({}))
  const cid=safePinataCid(result.IpfsHash)
  // wrapWithDirectory preserves an extension for the MultiversX media indexer.
  const uri='ipfs://'+cid+'/'+filename
  await tx(c=>c.query("UPDATE xartists_studio_media SET status='pinned',sha256=$2,uri=$3 WHERE id=$1 AND wallet=$4",
    [uploadId,check.sha256,uri,wallet]))
  return {uploadId,uri,cid,mime:check.mime,bytes:check.bytes,sha256:check.sha256}
}
export function createStudioMetadata(row,body,wallet){
  if(row.wallet!==wallet||row.status!=='pinned'||!row.uri||!SHA64.test(row.sha256))
    throw fail('media_record_not_owned_or_pinned',403)
  const title=String(body?.title||'').trim().slice(0,50)
  const description=String(body?.description||'').trim().slice(0,800)
  if(title.length<2||title.length>50)throw fail('metadata_title_invalid')
  if(body.rightsAccepted!==true)throw fail('media_rights_confirmation_required',403)
  const meta={
    name:title,
    description:description||'Original artwork published by the artist using xArtists Creator Studio.',
    ...(row.mime==='video/mp4'
      ? {animation_url:row.uri,properties:{category:'video',mime:row.mime}}
      : {image:row.uri,properties:{category:'image',mime:row.mime}}),
    attributes:[{trait_type:'Creator wallet',value:wallet},
      {trait_type:'SHA-256',value:row.sha256},
      {trait_type:'Creation tool',value:'xArtists Studio'}],
  }
  return meta
}
export async function pinStudioMetadata(wallet,body,request=fetch){
  erdToPubkey(wallet)
  if(!studioMediaConfig().enabled)throw fail('studio_media_upload_disabled',503)
  const id=String(body?.uploadId||'')
  if(!/^[a-f0-9-]{36}$/.test(id))throw fail('invalid_media_record')
  const row=await tx(async c=>{
    const r=await c.query('SELECT * FROM xartists_studio_media WHERE id=$1 AND wallet=$2',[id,wallet])
    return r.rows[0]||null
  })
  if(!row)throw fail('media_record_not_found',404)
  const content=createStudioMetadata(row,body,wallet)
  if(row.metadata_uri){
    return {mediaUri:row.uri,metadataUri:row.metadata_uri,
      attributes:'metadata:'+row.metadata_uri.replace('ipfs://','')+';tags:xartists,studio'}
  }
  let res
  try{
    res=await request('https://api.pinata.cloud/pinning/pinJSONToIPFS',{
      method:'POST',headers:{Authorization:'Bearer '+process.env.PINATA_JWT,
        'Content-Type':'application/json'},
      body:JSON.stringify({pinataContent:content,
        pinataMetadata:{name:'xartists-metadata-'+id+'.json'},
        pinataOptions:{cidVersion:1}}),
      signal:AbortSignal.timeout(30000)})
  }catch{throw fail('pinata_service_unavailable',503)}
  if(!res.ok)throw fail('pinata_metadata_failed',502)
  const response=await res.json().catch(()=>({}))
  const cid=safePinataCid(response.IpfsHash)
  const metadataUri='ipfs://'+cid
  await tx(c=>c.query("UPDATE xartists_studio_media SET metadata_uri=$2 WHERE id=$1 AND wallet=$3 AND status='pinned'",
    [id,metadataUri,wallet]))
  return {mediaUri:row.uri,metadataUri,
    attributes:'metadata:'+cid+';tags:xartists,studio'}
}
