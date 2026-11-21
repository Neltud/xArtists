#!/usr/bin/env node
/**
 * Pulse #005: READ-ONLY independent-gateway IPFS readback.
 * This tool never pins, mints, signs, broadcasts or sends private keys.
 * Requires explicit file manifest and two operator-chosen HTTPS gateways.
 */
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export const REQUIRED = Object.freeze(['recto.png', 'verso.png', 'animation.mp4', 'metadata.json'])
const LIMITS = { 'recto.png': 16 * 2**20, 'verso.png': 16 * 2**20,
  'animation.mp4': 64 * 2**20, 'metadata.json': 1 * 2**20 }
const BASE32 = 'abcdefghijklmnopqrstuvwxyz234567'
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const validHash = text => typeof text === 'string' && /^[a-f0-9]{64}$/.test(text)

function decodeBase32(s) {
  if (typeof s !== 'string' || !/^b[a-z2-7]{32,180}$/.test(s)) throw Error('cid_format_invalid')
  const result = []
  let buffer = 0, bits = 0
  for (const ch of s.slice(1)) {
    const v = BASE32.indexOf(ch)
    if (v < 0) throw Error('cid_format_invalid')
    buffer = (buffer << 5) | v
    bits += 5
    if (bits >= 8) {
      bits -= 8
      result.push((buffer >>> bits) & 255)
      buffer &= (1 << bits) - 1
    }
  }
  if (bits && buffer !== 0) throw Error('cid_padding_not_canonical')
  return Buffer.from(result)
}
function readVarint(buf, pos) {
  let n = 0, factor = 1
  for (let i = 0; i < 10 && pos + i < buf.length; i++) {
    const b = buf[pos + i]
    n += (b & 0x7f) * factor
    if (!Number.isSafeInteger(n)) throw Error('cid_varint_overflow')
    if (!(b & 0x80)) return {value:n,end:pos+i+1}
    factor *= 128
  }
  throw Error('cid_varint_unterminated')
}
/** Require real CIDv1, DAG-PB directory and SHA2-256 multihash. */
export function inspectCid(cid) {
  const bytes = decodeBase32(cid)
  const v = readVarint(bytes, 0)
  const codec = readVarint(bytes, v.end)
  const multihash = readVarint(bytes, codec.end)
  const length = readVarint(bytes, multihash.end)
  if (v.value !== 1 || codec.value !== 0x70 || multihash.value !== 0x12 ||
      length.value !== 32 || bytes.length !== length.end + 32) {
    throw Error('cidv1_dagpb_sha256_required')
  }
  return {version:1,codec:'dag-pb',digest:'sha2-256'}
}
function gatewayPrefix(url) {
  if (typeof url !== 'string') throw Error('gateway_https_required')
  const u = new URL(url)
  if (u.protocol !== 'https:' || u.username || u.password || u.search || u.hash ||
      !u.hostname || u.port || !/^\/(?:ipfs)(?:\/)?$/.test(u.pathname)) {
    throw Error('gateway_https_ipfs_path_required')
  }
  return {url:u.origin+'/ipfs',hostname:u.hostname.toLowerCase()}
}
function assertManifest(manifest, gateways) {
  if (!manifest || manifest.schema !== 'xartists.pulse005.readback.v1' ||
      manifest.collection !== 'XAIPLS-2cf72b' || !manifest.files ||
      typeof manifest.files !== 'object') throw Error('manifest_schema_invalid')
  if (JSON.stringify(Object.keys(manifest.files).sort()) !== JSON.stringify([...REQUIRED].sort())) {
    throw Error('manifest_required_four_files')
  }
  for (const name of REQUIRED) {
    const e = manifest.files[name]
    if (!e || !validHash(e.sha256)) throw Error('source_sha256_required:'+name)
    inspectCid(e.cid)
  }
  if (!Array.isArray(gateways) || gateways.length !== 2) throw Error('two_gateways_required')
  const a = gatewayPrefix(gateways[0]), b = gatewayPrefix(gateways[1])
  if (a.hostname === b.hostname) throw Error('independent_gateway_hosts_required')
  // Distinct hostnames are necessary but NOT sufficient proof of independent operators.
  return [a.url,b.url]
}

async function downloadExact(fetcher, url, expectedBytes) {
  const response = await fetcher(url, {
    method:'GET',redirect:'error',cache:'no-store',credentials:'omit',
    signal:AbortSignal.timeout(20000),
    headers:{'Accept':'application/octet-stream,image/png,video/mp4,application/json'}
  })
  if (!response || response.status !== 200 || !response.body) throw Error('gateway_http_status')
  if (/text\/html/i.test(response.headers?.get('content-type') || '')) throw Error('gateway_html_instead_of_media')
  const reader = response.body.getReader()
  const parts = []
  let total = 0
  try {
    while (true) {
      const {done,value} = await reader.read()
      if (done) break
      total += value.length
      if (total > expectedBytes.length) throw Error('gateway_bytes_overflow')
      parts.push(Buffer.from(value))
    }
  } finally { reader.releaseLock() }
  const bytes = Buffer.concat(parts)
  if (!bytes.equals(expectedBytes)) throw Error('gateway_bytes_mismatch')
  return sha(bytes)
}

export async function verifyPulse005(manifest, {
  directory,gateways,fetcher=fetch,onMedia,
}={}) {
  const prefix = assertManifest(manifest,gateways)
  if (typeof directory !== 'string' || !directory) throw Error('source_directory_required')
  const result = []
  for (const name of REQUIRED) {
    const entry = manifest.files[name]
    const bytes = await readFile(resolve(directory,name))
    if (!bytes.length || bytes.length > LIMITS[name]) throw Error('source_size_invalid:'+name)
    const sourceHash = sha(bytes)
    if (sourceHash !== entry.sha256) throw Error('source_sha256_mismatch:'+name)
    if (name === 'metadata.json') {
      let json
      try { json = JSON.parse(bytes.toString('utf8')) } catch { throw Error('metadata_json_invalid') }
      // Full legal/copyright fields, ERC-721/MultiversX conventions, and recipient
      // are independently reviewed by a human. No automatic certification here.
      if (!json || typeof json !== 'object' || Array.isArray(json)) throw Error('metadata_json_invalid')
      const front='ipfs://'+manifest.files['recto.png'].cid+'/recto.png'
      const video='ipfs://'+manifest.files['animation.mp4'].cid+'/animation.mp4'
      if (json.name !== 'Genesis Pulse #005' || json.image !== front ||
          json.animation_url !== video) {
        throw Error('metadata_uri_or_title_mismatch')
      }
    }
    const hashes = []
    for (const base of prefix) {
      const url = base+'/'+entry.cid+'/'+encodeURIComponent(name)
      hashes.push(await downloadExact(fetcher,url,bytes))
    }
    const receipt = {filename:name,cid:entry.cid,sha256:sourceHash,
      sizeBytes:bytes.length,gatewayHashes:hashes}
    result.push(receipt)
    onMedia?.(receipt)
  }
  return {verified:true,scope:'exact-byte-readback-only',collection:manifest.collection,
    verifiedAt:new Date().toISOString(),gatewayOrigins:prefix.map(x=>new URL(x).hostname),
    files:result,disclaimer:'NOT proof of IPFS pin durability, rights, mainnet role or mint authorization'}
}

async function runCli() {
  const args=process.argv.slice(2)
  const get=(flag)=>{const i=args.indexOf(flag);return i>=0?args[i+1]:undefined}
  const m=get('--manifest'),directory=get('--directory')
  const gates=args.flatMap((v,i)=>v==='--gateway'?[args[i+1]]:[])
  if (!m || !directory || gates.length!==2) {
    throw Error('Usage: node pulse005_ipfs_readback.mjs --manifest manifest.json --directory /path/to/files --gateway https://gateway-a.example/ipfs --gateway https://gateway-b.example/ipfs')
  }
  const manifest=JSON.parse(await readFile(m,'utf8'))
  const receipt=await verifyPulse005(manifest,{directory,gateways:gates})
  process.stdout.write(JSON.stringify(receipt,null,2)+'\n')
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  runCli().catch(e=>{console.error('PULSE005 IPFS READBACK FAIL:',e.message);process.exitCode=1})
}
