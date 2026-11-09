/**
 * Operator-only, read-only IPFS evidence audit (#402).
 *
 * Three separate facts are tested: Pinata reports a pinned root CID;
 * a separately managed Kubo node reports a recursive local pin; and two
 * public gateways return the original byte length and SHA-256.
 *
 * None of these alone proves long-term retention, independent physical
 * infrastructure, original-art rights, or any on-chain NFT mint.
 * No upload, pin/add, pin/rm, DDL, payment or signer lives in this module.
 */
import {createHash} from 'node:crypto'
import {isIP} from 'node:net'
import {parseReadbackManifest,verifyIpfsReadbackManifest} from './ipfsReadback.mjs'

const JSON_LIMIT=64*1024
const PINATA_LIST='https://api.pinata.cloud/data/pinList'
const error=()=>new Error('ipfs_pin_audit_configuration_invalid')
const loopback=new Set(['127.0.0.1','localhost','[::1]'])

export function ipfsPinAuditConfig(env=process.env){
  if(env.IPFS_PIN_AUDIT_ENABLED!=='1')throw error()
  const pinataJwt=String(env.PINATA_JWT||'').trim()
  if(pinataJwt.length<40)throw error()
  const supplied=String(env.IPFS_SECONDARY_RPC_URL||'').trim()
  let endpoint
  try{endpoint=new URL(supplied)}catch{throw error()}
  if(endpoint.username||endpoint.password||endpoint.search||endpoint.hash||
      endpoint.pathname!=='/'||!endpoint.hostname)throw error()
  const local=loopback.has(endpoint.hostname)
  const bearer=String(env.IPFS_SECONDARY_RPC_BEARER||'').trim()
  if(local){
    // Kubo RPC should remain loopback-only, accessed through an SSH tunnel.
    if(endpoint.protocol!=='http:'||env.IPFS_SECONDARY_LOCAL_TUNNEL_APPROVED!=='1')
      throw error()
  }else{
    // Never fetch arbitrary hosts or IP literals from manifests.
    // Remote proxy must enforce auth and be explicitly operator allowlisted.
    const allowlist=String(env.IPFS_SECONDARY_ALLOWED_HOSTS||'')
      .split(',').map(h=>h.trim().toLowerCase()).filter(Boolean)
    if(endpoint.protocol!=='https:'||isIP(endpoint.hostname)!==0||
        !/^[a-z0-9.-]+$/.test(endpoint.hostname)||
        !allowlist.includes(endpoint.hostname)||bearer.length<24)
      throw error()
  }
  return {pinataJwt,secondaryOrigin:endpoint.origin,secondaryBearer:bearer}
}

async function smallJson(response){
  if(!response?.ok)throw Error('provider_unavailable')
  const kind=response.headers?.get?.('content-type')?.split(';')[0]?.trim()?.toLowerCase()
  if(kind==='text/html'||kind==='application/xhtml+xml')throw Error('provider_not_json')
  const length=response.headers?.get?.('content-length')
  if(length&&/^\d+$/.test(length)&&Number(length)>JSON_LIMIT)
    throw Error('provider_reply_too_large')
  if(!response.body||typeof response.body[Symbol.asyncIterator]!=='function')
    throw Error('provider_stream_missing')
  let size=0
  const parts=[]
  for await(const chunk of response.body){
    if(!(chunk instanceof Uint8Array))throw Error('provider_stream_invalid')
    size+=chunk.byteLength
    if(size>JSON_LIMIT)throw Error('provider_reply_too_large')
    parts.push(chunk)
  }
  return JSON.parse(Buffer.concat(parts).toString('utf8'))
}

async function pinataRoot(cid,config,request){
  const endpoint=new URL(PINATA_LIST)
  endpoint.searchParams.set('cid',cid)
  endpoint.searchParams.set('status','pinned')
  endpoint.searchParams.set('pageLimit','10')
  try{
    const response=await request(endpoint.toString(),{
      method:'GET',redirect:'error',cache:'no-store',
      headers:{Accept:'application/json',Authorization:'Bearer '+config.pinataJwt},
      signal:AbortSignal.timeout(15000),
    })
    const data=await smallJson(response)
    return Array.isArray(data?.rows)&&data.rows.some(r=>
      r?.ipfs_pin_hash===cid&&r?.status==='pinned')
  }catch{return false}
}

async function kuboRoot(cid,config,request){
  const endpoint=new URL('/api/v0/pin/ls',config.secondaryOrigin)
  endpoint.searchParams.set('arg',cid)
  endpoint.searchParams.set('type','recursive')
  const headers={Accept:'application/json'}
  if(config.secondaryBearer)headers.Authorization='Bearer '+config.secondaryBearer
  try{
    const response=await request(endpoint.toString(),{
      method:'POST',redirect:'error',cache:'no-store',headers,
      signal:AbortSignal.timeout(15000),
    })
    const data=await smallJson(response)
    const entry=data?.Keys?.[cid]??data?.PinLsList?.Keys?.[cid]
    const single=data?.PinLsObject
    return entry?.Type==='recursive'||
      (single?.Cid===cid&&single?.Type==='recursive')
  }catch{return false}
}

/** Public media manifest is sourced from original source bytes, never a browser
 * claim of ownership. Each distinct root is queried only once. */
export async function auditStudioIpfsPinProviders(manifest,{env=process.env,request=fetch}={}){
  const assets=parseReadbackManifest(manifest)
  const config=ipfsPinAuditConfig(env) // fail BEFORE any HTTP request
  const roots=[...new Set(assets.map(asset=>asset.path.split('/')[0]))]
  const pinReports=[]
  for(const cid of roots){
    // Sequential to avoid overloading private Kubo RPC and paid Pinata API.
    const pinata=await pinataRoot(cid,config,request)
    const secondary=await kuboRoot(cid,config,request)
    pinReports.push({
      rootCidSha256:createHash('sha256').update(cid).digest('hex'),
      pinataReportedPinned:pinata,
      secondaryKuboReportedRecursivePin:secondary,
      twoPinSystemsReportedPinned:pinata&&secondary,
    })
  }
  // This is independent byte readback, not evidence of two independent pins.
  const readback=await verifyIpfsReadbackManifest(manifest,{request})
  const twoPinSystemsReported=pinReports.every(x=>x.twoPinSystemsReportedPinned)
  return {
    ok:twoPinSystemsReported&&readback.ok,
    manifestSha256:createHash('sha256').update(JSON.stringify(manifest.assets)).digest('hex'),
    distinctRootCount:roots.length,
    twoPinSystemsReported,
    gatewayByteReadbackVerified:readback.ok,
    pinReports,
    gatewayChecks:readback.checks,
    independentPinProvidersVerified:false,
    independentBackupsVerified:false,
    restoreTestVerified:false,
    nftMintVerified:false,
    note:'pin_status_plus_gateway_readback_not_independent_infrastructure_or_restore_proof',
  }
}
