import assert from 'node:assert/strict'
import {test} from 'node:test'
import crypto from 'node:crypto'
import {
  parseMediaReference,validateMediaAuditInput,inspectMediaDurability,
  TRUSTED_MEDIA_GATEWAYS,
} from '../src/mediaDurability.mjs'

const cid='bafy'+'a'.repeat(45)
const uri='ipfs://'+cid+'/artwork-01.mp4'
const bytes=Buffer.from('xArtists preserved original 2026')
const sha256=crypto.createHash('sha256').update(bytes).digest('hex')
const record={uri,sha256}
const archiveTxId='z'.repeat(43)
function fakeFetch(responseForUrl){
  const called=[]
  return {called,fetcher:async (url,options)=>{
    called.push({url,options})
    return responseForUrl(url)
  }}
}

test('only validated IPFS CIDs and a single relative media filename are accepted',()=>{
  assert.deepEqual(parseMediaReference(uri).cid,cid)
  assert.equal(parseMediaReference('ipfs://'+cid).path,'')
  for(const url of ['https://evil.local/nft','ipfs://evil','ipfs://'+cid+'/../../pass','ipfs://'+cid+'/','ipfs://'+cid+'/x?u=evil'])
    assert.throws(()=>parseMediaReference(url),/media_ipfs_/)
  assert.throws(()=>validateMediaAuditInput({...record,sha256:'invalid'}),/media_audit_sha256_invalid/)
  assert.throws(()=>validateMediaAuditInput({...record,archiveTxId:'invalid'}),/media_archive_tx_invalid/)
})

test('multi-gateway retrieval is measured, but never called a permanent or independent pin',async()=>{
  const mock=fakeFetch(()=>new Response(bytes,{status:200}))
  const report=await inspectMediaDurability(record,{fetcher:mock.fetcher})
  assert.equal(report.gatewayMatches,2)
  assert.equal(report.retrievableNow,true)
  assert.equal(report.independentArchiveVerified,false)
  assert.equal(report.preservationStage,'ipfs_retrievable_only')
  assert.equal(report.permanentGuarantee,false)
  assert.equal(mock.called.length,2)
  for(const call of mock.called){
    assert.ok(TRUSTED_MEDIA_GATEWAYS.some(g=>call.url.startsWith(g.base)))
    assert.equal(call.options.method,'GET')
    assert.equal(call.options.redirect,'error')
    assert.doesNotMatch(call.url,/\?|token|jwt|secret/i)
  }
})

test('archive verification requires fetching byte-identical data, not a supplied transaction ID alone',async()=>{
  const mock=fakeFetch(()=>new Response(bytes,{status:200}))
  const report=await inspectMediaDurability({...record,archiveTxId},{fetcher:mock.fetcher})
  assert.equal(mock.called.length,3)
  assert.equal(mock.called[2].url,'https://arweave.net/'+archiveTxId)
  assert.equal(report.archiveResult.result,'match')
  assert.equal(report.independentArchiveVerified,true)
  assert.equal(report.preservationStage,'ipfs_and_archive_verified_at_probe')
  assert.equal(report.permanentGuarantee,false)
})

test('mismatched bytes and unreachable gateways fail closed',async()=>{
  const mock=fakeFetch(url=>url.includes('ipfs.io')
    ?new Response(Buffer.from('wrong'),{status:200})
    :new Response('not found',{status:404}))
  const report=await inspectMediaDurability({...record,archiveTxId},{fetcher:mock.fetcher})
  assert.equal(report.gatewayMatches,0)
  assert.equal(report.retrievableNow,false)
  assert.equal(report.archiveResult.result,'unavailable')
  assert.equal(report.preservationStage,'unverified')
  assert.equal(report.gatewayResults[0].result,'hash_mismatch')
  assert.equal(report.gatewayResults[1].result,'unavailable')
})

test('size caps stop oversized responses rather than downloading huge videos',async()=>{
  let reads=0
  const mock=fakeFetch(()=>new Response(new ReadableStream({
    start(controller){reads++;controller.enqueue(Buffer.from('01234567890123456789'));controller.close()}
  }),{status:200,headers:{'content-length':'100000000'}}))
  const report=await inspectMediaDurability(record,{fetcher:mock.fetcher,maxBytes:8})
  assert.deepEqual(report.gatewayResults.map(x=>x.result),['oversize','oversize'])
  assert.equal(report.retrievableNow,false)
  assert.ok(reads<=2)
})
