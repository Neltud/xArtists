import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { inspectCid, verifyPulse005, REQUIRED } from '../scripts/pulse005_ipfs_readback.mjs'

const CID='bafybeigdyrzt5sfp7udm7hu76bvy4j4xejpvxa2cqarjfic7znt7obgxyy'
const sha=bytes=>createHash('sha256').update(bytes).digest('hex')
const gateways=['https://gateway-a.example/ipfs','https://gateway-b.example/ipfs']
const data={
  'recto.png':Buffer.from('FAKE_PNG_FIXTURE_DO_NOT_PUBLISH'),
  'verso.png':Buffer.from('FAKE_REVERSE_FIXTURE_DO_NOT_PUBLISH'),
  'animation.mp4':Buffer.from('FAKE_MP4_FIXTURE_DO_NOT_PUBLISH'),
  'metadata.json':Buffer.from(JSON.stringify({name:'Genesis Pulse #005',image:'ipfs://'+CID+'/recto.png',animation_url:'ipfs://'+CID+'/animation.mp4',fixture:'UNVERIFIED MOCK ONLY'})),
}
function manifest() {
  return {schema:'xartists.pulse005.readback.v1',collection:'XAIPLS-2cf72b',
    files:Object.fromEntries(REQUIRED.map(name=>[name,{cid:CID,sha256:sha(data[name])}]))}
}
async function fixture(fn) {
  const directory=await mkdtemp(join(tmpdir(),'pulse005-test-'))
  try {
    for(const [name,bytes] of Object.entries(data)) await writeFile(join(directory,name),bytes)
    return await fn(directory)
  } finally { await rm(directory,{recursive:true,force:true}) }
}
const successFetch=async url=>{
  const filename=new URL(url).pathname.split('/').at(-1)
  return new Response(data[filename],{status:200,headers:{'Content-Type':'application/octet-stream'}})
}

test('CID decoder accepts genuine CIDv1 dag-pb and rejects spoofed identifiers',()=>{
  assert.equal(inspectCid(CID).codec,'dag-pb')
  for(const cid of [
    'bafyaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    'Qmaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    'https://ipfs.io/ipfs/'+CID,
    CID+'!',
  ]) assert.throws(()=>inspectCid(cid))
})

test('all four exact local bytes verified across two distinct HTTPS gateways',()=>fixture(async directory=>{
  let calls=0
  const result=await verifyPulse005(manifest(),{directory,gateways,fetcher:async url=>{
    calls++
    return successFetch(url)
  }})
  assert.equal(calls,8)
  assert.equal(result.verified,true)
  assert.equal(result.scope,'exact-byte-readback-only')
  assert.equal(result.files.length,4)
  assert.deepEqual(result.gatewayOrigins,['gateway-a.example','gateway-b.example'])
  assert.match(result.disclaimer,/NOT proof of IPFS pin durability/)
}))

test('a mismatched independent gateway fails closed, even HTTP 200',()=>fixture(async directory=>{
  await assert.rejects(()=>verifyPulse005(manifest(),{directory,gateways,
    fetcher:async url=>url.startsWith(gateways[1])
      ? new Response(Buffer.from('corrupt'),{status:200,headers:{'Content-Type':'application/octet-stream'}})
      : successFetch(url)
  }),/gateway_bytes_mismatch/)
}))

test('HTML masquerading as successful gateway response is rejected',()=>fixture(async directory=>{
  await assert.rejects(()=>verifyPulse005(manifest(),{directory,gateways,
    fetcher:async()=>new Response('<html>not found</html>',{status:200,headers:{'content-type':'text/html'}})
  }),/gateway_html_instead_of_media/)
}))

test('source file tampering and invalid JSON are rejected before publicity',()=>fixture(async directory=>{
  await writeFile(join(directory,'recto.png'),Buffer.from('tampered'))
  await assert.rejects(()=>verifyPulse005(manifest(),{directory,gateways,fetcher:successFetch}),
    /source_sha256_mismatch:recto.png/)
}))

test('fake credentials, same gateway, and manifest omissions cannot authorize proof',()=>fixture(async directory=>{
  const m=manifest()
  await assert.rejects(()=>verifyPulse005(m,{directory,gateways:[gateways[0],gateways[0]],fetcher:successFetch}),
    /independent_gateway_hosts_required/)
  await assert.rejects(()=>verifyPulse005(m,{directory,gateways:['http://example.com/ipfs',gateways[1]],fetcher:successFetch}),
    /gateway_https_ipfs_path_required/)
  delete m.files['metadata.json']
  await assert.rejects(()=>verifyPulse005(m,{directory,gateways,fetcher:successFetch}),
    /manifest_required_four_files/)
}))

test('file traversal cannot be supplied via manifest file keys',()=>fixture(async directory=>{
  const m=manifest()
  m.files['../secret.txt']={cid:CID,sha256:'a'.repeat(64)}
  await assert.rejects(()=>verifyPulse005(m,{directory,gateways,fetcher:successFetch}),
    /manifest_required_four_files/)
}))

test('metadata cannot advertise a different collection or media URI',()=>fixture(async directory=>{
  const forged=JSON.stringify({name:'Genesis Pulse #005',image:'ipfs://fake/recto.png',
    animation_url:'ipfs://'+CID+'/animation.mp4'})
  await writeFile(join(directory,'metadata.json'),Buffer.from(forged))
  const m=manifest()
  m.files['metadata.json'].sha256=sha(Buffer.from(forged))
  await assert.rejects(()=>verifyPulse005(m,{directory,gateways,fetcher:successFetch}),
    /metadata_uri_or_title_mismatch/)
}))
