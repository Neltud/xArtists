/**
 * Media preservation audit (read-only). No upload, pin, mint or payment.
 * A CID proves content addressing, NOT storage permanence or provider diversity.
 * Do not call this from an unauthenticated public endpoint: full media downloads
 * consume bandwidth. Only known gateways may be contacted (no arbitrary URLs).
 */
import crypto from 'node:crypto'

const CID=/^(?:Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z2-7]{20,})$/
const SHA=/^[a-f0-9]{64}$/i
const AR_TX=/^[A-Za-z0-9_-]{43}$/
const FILE=/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/
const MAX_BYTES=48*1024*1024
const MAX_PROBE_MS=20_000

export const TRUSTED_MEDIA_GATEWAYS=Object.freeze([
  {id:'ipfs-io',base:'https://ipfs.io/ipfs/'},
  {id:'dweb-link',base:'https://dweb.link/ipfs/'},
])

export function parseMediaReference(uri){
  if(typeof uri!=='string'||!uri.startsWith('ipfs://'))throw new TypeError('media_ipfs_uri_required')
  const rest=uri.slice('ipfs://'.length)
  const pieces=rest.split('/')
  if(pieces.length<1||pieces.length>2||!CID.test(pieces[0]))throw new TypeError('media_ipfs_cid_invalid')
  if(pieces.length===2&&!FILE.test(pieces[1]))throw new TypeError('media_ipfs_path_invalid')
  return {cid:pieces[0],path:pieces[1]||'',uri}
}

export function validateMediaAuditInput(record){
  if(!record||typeof record!=='object')throw new TypeError('media_audit_record_required')
  const media=parseMediaReference(record.uri)
  const sha256=String(record.sha256||'').toLowerCase()
  if(!SHA.test(sha256))throw new TypeError('media_audit_sha256_invalid')
  const archiveTxId=record.archiveTxId==null?'':String(record.archiveTxId)
  if(archiveTxId&&!AR_TX.test(archiveTxId))throw new TypeError('media_archive_tx_invalid')
  return {...media,sha256,archiveTxId}
}

async function fetchDigest(url,sha256,{fetcher,maxBytes,timeoutMs}){
  let response
  try {
    response=await fetcher(url,{method:'GET',redirect:'error',cache:'no-store',
      signal:AbortSignal.timeout(timeoutMs),
      headers:{Accept:'application/octet-stream'}})
  } catch {
    return {result:'unavailable'}
  }
  if(!response||!response.ok||!response.body)return {result:'unavailable'}
  const length=Number(response.headers?.get?.('content-length')||0)
  if(length>maxBytes)return {result:'oversize'}
  let total=0
  const hasher=crypto.createHash('sha256')
  try {
    for await (const part of response.body){
      const bytes=Buffer.from(part)
      total+=bytes.length
      if(total>maxBytes){
        await response.body.cancel?.().catch?.(()=>{})
        return {result:'oversize'}
      }
      hasher.update(bytes)
    }
  }catch{return {result:'unavailable'}}
  const hash=hasher.digest('hex')
  return {result:hash===sha256?'match':'hash_mismatch',bytes:total}
}

/**
 * Publication evidence is a *snapshot* only. Two gateways may serve the same
 * underlying node, so two matches never prove two independent pins.
 * Independent archival evidence requires fetching Arweave transaction content.
 */
export async function inspectMediaDurability(input,opts={}){
  const media=validateMediaAuditInput(input)
  const fetcher=opts.fetcher||fetch
  const maxBytes=Number.isInteger(opts.maxBytes)&&opts.maxBytes>0
    ? Math.min(MAX_BYTES,opts.maxBytes):MAX_BYTES
  const timeoutMs=Number.isInteger(opts.timeoutMs)&&opts.timeoutMs>0
    ? Math.min(MAX_PROBE_MS,opts.timeoutMs):MAX_PROBE_MS
  const path=media.path?'/'+encodeURIComponent(media.path):''
  const probes=[]
  for(const gateway of TRUSTED_MEDIA_GATEWAYS){
    const result=await fetchDigest(gateway.base+media.cid+path,media.sha256,
      {fetcher,maxBytes,timeoutMs})
    probes.push({provider:gateway.id,...result})
  }
  let archive={provider:'arweave',result:'not_configured'}
  if(media.archiveTxId){
    archive={provider:'arweave',...await fetchDigest(
      'https://arweave.net/'+media.archiveTxId,media.sha256,
      {fetcher,maxBytes,timeoutMs})}
  }
  const gatewayMatches=probes.filter(p=>p.result==='match').length
  const independentArchiveVerified=archive.result==='match'
  return {
    schema_version:1,
    uri:media.uri,
    sha256:media.sha256,
    archiveTxId:media.archiveTxId||null,
    gatewayResults:probes,
    archiveResult:archive,
    gatewayMatches,
    retrievableNow:gatewayMatches>0,
    independentArchiveVerified,
    preservationStage:independentArchiveVerified&&gatewayMatches>0
      ?'ipfs_and_archive_verified_at_probe'
      :gatewayMatches>0?'ipfs_retrievable_only':'unverified',
    permanentGuarantee:false,
    note:'Read-only retrieval snapshot; gateway redundancy does not prove independent pinning, future availability or legal ownership.',
  }
}
