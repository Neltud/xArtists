/** Read-only byte-for-byte IPFS readback for public, licensed artist media.
 *
 * Two different HTTP gateway operators are probed, not two pin providers.
 * This does not prove replication, long-term hosting or on-chain minting.
 * Do not call with private photos or unapproved/publication-unsafe CIDs.
 */
import crypto from 'node:crypto'

const CID=/^(?:Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z2-7]{20,})$/
const SHA=/^[a-f0-9]{64}$/
const FILE=/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}$/
const MAX_BYTES=48*1024*1024
const MAX_ASSETS=12
const MAX_TOTAL_BYTES=192*1024*1024
export const IPFS_READBACK_GATEWAYS=Object.freeze([
  Object.freeze({id:'pinata_public_gateway',base:'https://gateway.pinata.cloud/ipfs/'}),
  Object.freeze({id:'ipfs_foundation_gateway',base:'https://ipfs.io/ipfs/'}),
])
export function parseIpfsAssetUri(uri){
  if(typeof uri!=='string'||!uri.startsWith('ipfs://')||uri.length>240)
    throw Error('invalid_ipfs_asset_uri')
  const parts=uri.slice(7).split('/')
  if(parts.length<1||parts.length>2||!CID.test(parts[0])||
      (parts.length===2&&(!FILE.test(parts[1])||parts[1]==='..')))
    throw Error('invalid_ipfs_asset_uri')
  return parts.join('/')
}
export function parseReadbackManifest(manifest){
  if(!manifest||typeof manifest!=='object'||Array.isArray(manifest)||
      !Array.isArray(manifest.assets)||manifest.assets.length<1||
      manifest.assets.length>MAX_ASSETS)
    throw Error('invalid_readback_manifest')
  let total=0
  const assets=manifest.assets.map((asset)=>{
    if(!asset||typeof asset!=='object'||Array.isArray(asset)||
      !SHA.test(asset.sha256)||!Number.isSafeInteger(asset.bytes)||
      asset.bytes<1||asset.bytes>MAX_BYTES)
      throw Error('invalid_asset_integrity_fields')
    const path=parseIpfsAssetUri(asset.mediaUri)
    total+=asset.bytes
    if(total>MAX_TOTAL_BYTES)throw Error('readback_budget_exceeded')
    return {path,sha256:asset.sha256,bytes:asset.bytes}
  })
  return assets
}
async function inspectGateway(asset,gateway,request){
  const url=gateway.base+asset.path
  let response
  try{
    response=await request(url,{
      method:'GET',
      redirect:'error',
      cache:'no-store',
      headers:{Accept:'application/octet-stream'},
      signal:AbortSignal.timeout(30000),
    })
  }catch{return {gateway:gateway.id,verified:false,reason:'gateway_unreachable_or_redirect'}}
  if(!response.ok)return {gateway:gateway.id,verified:false,reason:'gateway_http_non_2xx'}
  // A gateway may return a branded HTML error page with HTTP 200.
  // Reject it before considering any bytes as a verified media asset.
  const contentType=response.headers?.get?.('content-type')?.split(';')[0]?.trim()?.toLowerCase()
  if(contentType==='text/html'||contentType==='application/xhtml+xml')
    return {gateway:gateway.id,verified:false,reason:'gateway_html_not_media'}
  if(!response.body||typeof response.body[Symbol.asyncIterator]!=='function')
    return {gateway:gateway.id,verified:false,reason:'gateway_stream_unavailable'}
  const lengthHeader=response.headers?.get?.('content-length')
  if(lengthHeader&&/^\d+$/.test(lengthHeader)&&Number(lengthHeader)>asset.bytes)
    return {gateway:gateway.id,verified:false,reason:'response_too_large'}
  const hash=crypto.createHash('sha256')
  let total=0
  try{
    for await(const chunk of response.body){
      if(!(chunk instanceof Uint8Array))
        return {gateway:gateway.id,verified:false,reason:'invalid_gateway_stream'}
      total+=chunk.byteLength
      if(total>asset.bytes||total>MAX_BYTES)
        return {gateway:gateway.id,verified:false,reason:'response_too_large'}
      hash.update(chunk)
    }
  }catch{return {gateway:gateway.id,verified:false,reason:'gateway_read_interrupted'}}
  if(total!==asset.bytes)
    return {gateway:gateway.id,verified:false,reason:'response_length_mismatch'}
  if(hash.digest('hex')!==asset.sha256)
    return {gateway:gateway.id,verified:false,reason:'sha256_mismatch'}
  return {gateway:gateway.id,verified:true,reason:'bytes_sha256_verified'}
}
export async function verifyIpfsReadbackManifest(manifest,{request=fetch}={}){
  const assets=parseReadbackManifest(manifest)
  const checks=[]
  for(let i=0;i<assets.length;i++){
    // Sequential to avoid flooding public best-effort gateways.
    const gateways=[]
    for(const gateway of IPFS_READBACK_GATEWAYS)
      gateways.push(await inspectGateway(assets[i],gateway,request))
    checks.push({asset:i+1,bytes:assets[i].bytes,
      verified:gateways.every(x=>x.verified),gateways})
  }
  return {
    ok:checks.every(x=>x.verified),
    verification:'two_gateway_http_readbacks_exact_bytes_and_sha256',
    independentPinProvidersVerified:false,
    independentBackupsVerified:false,
    nftMintVerified:false,
    checks,
    note:'gateway_readback_is_not_independent_pin_or_permanent_storage_proof',
  }
}
