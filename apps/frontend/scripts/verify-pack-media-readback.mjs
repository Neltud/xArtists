#!/usr/bin/env node
/**
 * Read-only IPFS byte verification for a SINGLE authorized pack media asset.
 * Two gateway reads are NOT two independent pins: this never clears commercial gates.
 * No uploads, secrets, private IPs, signing or blockchain transactions.
 */
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ALLOWED_GATEWAYS = new Set(['ipfs.io','dweb.link','gateway.pinata.cloud'])
const ALLOWED_TYPES = new Set(['image/png','image/jpeg','image/webp','video/mp4','application/json'])
const CID_URI = /^ipfs:\/\/(bafy[a-z2-7]{20,}|Qm[1-9A-HJ-NP-Za-km-z]{44})(?:\/[A-Za-z0-9._~-]{1,120})?$/i
const SHA = /^[0-9a-f]{64}$/
const MAX_BYTES = 16 * 1024 * 1024
const NFT_ID = /^(?:XAIPLS-2cf72b-(?:01|02|03|04)|XAIYLD-987e24-01|XAISNT-3d8a6b-01)$/

function readGatewayHost(value) {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.pathname !== '/' || url.search ||
        url.hash || url.username || url.password || url.port ||
        !ALLOWED_GATEWAYS.has(url.hostname)) return null
    return url.hostname
  } catch { return null }
}

export function validatePackReadbackRequest(request) {
  const issues = []
  if (!request || typeof request !== 'object' || Array.isArray(request))
    return ['invalid_request']
  const assert = (v, why) => { if (!v) issues.push(why) }
  assert(request.kind === 'xartists_pack_media_readback', 'wrong_kind')
  assert(typeof request.nftIdentifier === 'string' && NFT_ID.test(request.nftIdentifier), 'nft_not_recognized')
  assert(typeof request.ipfsUri === 'string' && CID_URI.test(request.ipfsUri), 'missing_or_invalid_real_cid')
  assert(typeof request.sha256 === 'string' && SHA.test(request.sha256), 'missing_sha256')
  assert(ALLOWED_TYPES.has(request.contentType), 'content_type_not_allowed')
  assert(Number.isSafeInteger(request.maxBytes) && request.maxBytes > 0 && request.maxBytes <= MAX_BYTES, 'size_cap_invalid')
  const hosts = Array.isArray(request.gateways) ? request.gateways.map(readGatewayHost) : []
  assert(hosts.length === 2 && hosts.every(Boolean) && hosts[0] !== hosts[1], 'two_distinct_approved_https_gateways_required')
  return issues
}

async function fetchMedia(url, request, fetchImpl) {
  try {
    const response = await fetchImpl(url,{method:'GET',cache:'no-store',
      redirect:'error',signal:AbortSignal.timeout(20000)})
    if (!response.ok || !response.body) return {ok:false, reason:'http_or_body_unavailable'}
    const type = String(response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
    if (type !== request.contentType) return {ok:false, reason:'mime_mismatch'}
    const sizeHeader = response.headers.get('content-length')
    if (sizeHeader && Number(sizeHeader) > request.maxBytes) return {ok:false, reason:'too_large'}
    const hash = createHash('sha256')
    let bytes = 0
    for await (const chunk of response.body) {
      bytes += chunk.length
      if (bytes > request.maxBytes) {
        await response.body.cancel().catch(()=>{})
        return {ok:false, reason:'too_large'}
      }
      hash.update(chunk)
    }
    if (!bytes) return {ok:false, reason:'empty_file'}
    const digest = hash.digest('hex')
    if (digest !== request.sha256) return {ok:false, reason:'sha256_mismatch'}
    return {ok:true, bytes, sha256:digest, contentType:type}
  } catch {
    return {ok:false, reason:'unavailable_or_timeout'}
  }
}

export async function verifyPackMediaReadback(request, fetchImpl=fetch) {
  const problems = validatePackReadbackRequest(request)
  if (problems.length) return {status:'NO_GO',ok:false,issues:problems,
    readbackConfirmed:false,independentPinsVerified:false,repairAllowed:false}
  const path = request.ipfsUri.slice('ipfs://'.length)
  const results = []
  for (const gateway of request.gateways) {
    const url = gateway + (gateway.endsWith('/')?'':'/') + 'ipfs/' + path
    const result = await fetchMedia(url,request,fetchImpl)
    results.push({gateway, ...result})
  }
  const good = results.every(x=>x.ok) &&
    results[0].bytes === results[1].bytes &&
    results[0].sha256 === results[1].sha256
  return {
    status:good ? 'READBACK_ONLY_PINNING_UNPROVEN' : 'NO_GO',
    ok:good,
    nftIdentifier:request.nftIdentifier,
    ipfsUri:request.ipfsUri,
    sha256:good?request.sha256:null,
    gatewayChecks:results,
    readbackConfirmed:good,
    independentPinsVerified:false,
    archivalBackupVerified:false,
    ownerRolesVerified:false,
    repairAllowed:false,
    listingAllowed:false,
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url)===process.argv[1]) {
  const filename = process.argv[2]
  if (!filename || process.argv.length!==3) {
    console.error('Usage: node scripts/verify-pack-media-readback.mjs <request.json>')
    process.exitCode=2
  } else {
    try {
      const request = JSON.parse(readFileSync(filename,'utf8'))
      const report = await verifyPackMediaReadback(request)
      process.stdout.write(JSON.stringify(report,null,2)+'\n')
      if (!report.ok) process.exitCode=1
    } catch {
      console.error('Readback failed; no private details or API responses printed.')
      process.exitCode=1
    }
  }
}
