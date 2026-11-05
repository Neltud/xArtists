#!/usr/bin/env node
/**
 * xArtists public-media preservation preflight — offline by default.
 * A matching hash is proof of retrieved bytes, NOT a guarantee of permanence
 * or proof of two independent pinning providers.
 * No payment, token, private key, secrets, DB mutation or wallet access.
 */
import { createHash } from 'node:crypto'
import { createReadStream, readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const CID = /^(?:Qm[1-9A-HJ-NP-Za-km-z]{44}|baf[a-z2-7]{20,})$/
const TXID = /^[a-zA-Z0-9_-]{43}$/
const SHA = /^[a-f0-9]{64}$/
const MIME = new Set(['image/jpeg','image/png','image/webp','video/mp4'])
const MAX_BYTES = 1024 * 1024 * 1024

export function safeMediaUri(uri) {
  if (typeof uri !== 'string' || uri.length > 500) throw Error('invalid_storage_uri')
  if (uri.startsWith('ar://')) {
    const txid = uri.slice(5)
    if (!TXID.test(txid)) throw Error('invalid_arweave_txid')
    return {protocol:'arweave',locator:txid,urls:['https://arweave.net/'+txid]}
  }
  if (!uri.startsWith('ipfs://')) throw Error('only_content_addressed_media_supported')
  const parts = uri.slice(7).split('/')
  if (parts.length > 2 || !CID.test(parts[0]) ||
      (parts[1] && !/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,125}$/.test(parts[1])) ||
      parts[1] === '.' || parts[1] === '..')
    throw Error('unsafe_ipfs_path')
  const locator = parts.join('/')
  return {
    protocol:'ipfs', locator,
    urls:['https://ipfs.io/ipfs/'+locator,'https://dweb.link/ipfs/'+locator]
  }
}

export function validateManifest(raw) {
  if (!raw || raw.schema_version !== 1 || !raw.media || typeof raw.media !== 'object')
    throw Error('invalid_manifest_schema')
  const media = raw.media
  const location = safeMediaUri(media.uri)
  if (typeof media.sha256 !== 'string' || !SHA.test(media.sha256))
    throw Error('missing_valid_sha256')
  if (!Number.isSafeInteger(media.bytes) || media.bytes <= 0 || media.bytes > MAX_BYTES)
    throw Error('invalid_expected_bytes')
  if (!MIME.has(media.mime)) throw Error('unsupported_media_type')
  if (raw.metadata?.uri) safeMediaUri(raw.metadata.uri)
  if (raw.copies !== undefined) {
    if (!Array.isArray(raw.copies) || raw.copies.length > 20) throw Error('invalid_copies')
    for (const copy of raw.copies) {
      if (!copy || !['pinata','independent_ipfs','arweave','offline_backup','google_drive'].includes(copy.provider) ||
          !['planned','provider_reported','independently_verified'].includes(copy.status))
        throw Error('invalid_copy_status')
      if (copy.uri !== null && copy.uri !== undefined) safeMediaUri(copy.uri)
    }
  }
  return {media,location}
}

export async function hashStream(iterable, declaredMax) {
  const h = createHash('sha256')
  let bytes = 0
  for await (const chunk of iterable) {
    bytes += chunk.byteLength
    if (bytes > declaredMax) throw Error('stream_exceeds_expected_bytes')
    h.update(chunk)
  }
  return {bytes,sha256:h.digest('hex')}
}

export async function verifyLocalFile(file, expected) {
  try {
    const result = await hashStream(createReadStream(file), expected.bytes)
    return {status:result.bytes === expected.bytes && result.sha256 === expected.sha256
      ? 'verified_checksum' : 'mismatch',...result}
  } catch (e) {
    return {status:'error',reason:String(e?.message||e)}
  }
}

/** The URL is always generated from a validated CID or Arweave transaction ID. */
export async function verifyHttpReadback(url,expected,fetcher=fetch) {
  if (!/^https:\/\/(?:ipfs\.io\/ipfs\/|dweb\.link\/ipfs\/|arweave\.net\/)/.test(url))
    throw Error('gateway_not_allowed')
  try {
    const response=await fetcher(url,{method:'GET',redirect:'error',signal:AbortSignal.timeout(30000)})
    if(!response.ok || !response.body) return {status:'unavailable',http_status:response.status}
    const result=await hashStream(response.body,expected.bytes)
    return {status:result.bytes===expected.bytes && result.sha256===expected.sha256
      ? 'verified_checksum' : 'mismatch',http_status:response.status,...result}
  } catch (e) {return {status:'error',reason:String(e?.message||e)}}
}

async function main(args) {
  const at=args.indexOf('--manifest')
  if(at<0 || !args[at+1]) throw Error('usage: node scripts/ops/media-integrity-check.mjs --manifest archive.json [--file artwork.mp4] [--network]')
  const raw=JSON.parse(readFileSync(args[at+1],'utf8'))
  const {media,location}=validateManifest(raw)
  const localAt=args.indexOf('--file')
  const local=localAt>=0 ? await verifyLocalFile(args[localAt+1],media) : null
  const online=args.includes('--network')
  const gateways=[]
  if(online)for(const url of location.urls)gateways.push({gateway:new URL(url).host,
    ...await verifyHttpReadback(url,media)})
  const checked=Boolean(local || online)
  const verified=local?.status==='verified_checksum' || gateways.some(g=>g.status==='verified_checksum')
  const report={
    schema_version:1,
    media_uri:media.uri,
    local:local?.status||'not_checked',
    gateway_results:gateways,
    proof:verified?'retrieved_bytes_hash_verified':checked?'not_verified':'not_checked',
    permanence:'NOT_GUARANTEED',
    independent_provider_replicas:'NOT_PROVEN_BY_GATEWAY_CHECKS',
    minted:'NOT_ASSESSED'
  }
  process.stdout.write(JSON.stringify(report,null,2)+'\n')
  if(!verified)process.exitCode=1
}
if(process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch(e=>{process.stderr.write('archive_preflight_failed: '+String(e.message||e)+'\n');process.exitCode=2})
}
