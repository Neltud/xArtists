import assert from 'node:assert/strict'
import {test} from 'node:test'
import crypto from 'node:crypto'
import {IPFS_READBACK_GATEWAYS,parseIpfsAssetUri,parseReadbackManifest,
  verifyIpfsReadbackManifest} from '../src/ipfsReadback.mjs'

const cid='bafy'+'a'.repeat(52)
const uri='ipfs://'+cid+'/artwork-1.png'
const source=Buffer.from('xArtists proof fixture only: NO ACTUAL IPFS PIN')
const sha256=crypto.createHash('sha256').update(source).digest('hex')
const manifest={assets:[{mediaUri:uri,sha256,bytes:source.length}]}
const okResponse=(bytes)=>new Response(bytes,{status:200})

test('only safe CID-backed paths can produce gateway URLs',()=>{
  assert.equal(parseIpfsAssetUri(uri),cid+'/artwork-1.png')
  assert.equal(parseIpfsAssetUri('ipfs://'+cid),cid)
  for(const candidate of [
    'http://example.com/', 'ipfs://pending',
    'ipfs://'+cid+'/../../secret',
    'ipfs://'+cid+'/evil%2fredirect',
    'ipfs://'+cid+'//secret',
    'ipfs://'+cid+'/..',
    'ipfs://'+cid+'/../secret',
    'ipfs://'+cid+'/ab?secret=1',
    'ipfs://'+cid+'/ab#fragment',
  ])assert.throws(()=>parseIpfsAssetUri(candidate),/invalid_ipfs_asset_uri/)
})
test('manifest requires bounded source length and exact 64 hex SHA, fails before network',()=>{
  assert.equal(parseReadbackManifest(manifest)[0].bytes,source.length)
  for(const invalid of [
    {},{assets:[]},{assets:[{...manifest.assets[0],sha256:'bad'}]},
    {assets:[{...manifest.assets[0],bytes:0}]},
    {assets:[{...manifest.assets[0],bytes:48*1024*1024+1}]},
    {assets:[{...manifest.assets[0],bytes:1.5}]},
    {assets:Array(13).fill(manifest.assets[0])},
    {assets:[{...manifest.assets[0],mediaUri:'file:///etc/passwd'}]},
  ])assert.throws(()=>parseReadbackManifest(invalid))
})
test('two separate gateway operators must both return exact bytes and SHA-256',async()=>{
  const destinations=[]
  const result=await verifyIpfsReadbackManifest(manifest,{
    request:async(url,opts)=>{
      destinations.push(url)
      assert.equal(opts.method,'GET')
      assert.equal(opts.redirect,'error')
      assert.equal(opts.cache,'no-store')
      assert.equal(opts.headers.Accept,'application/octet-stream')
      return okResponse(source)
    },
  })
  assert.equal(result.ok,true)
  assert.equal(destinations.length,2)
  assert.equal(new URL(destinations[0]).hostname,'gateway.pinata.cloud')
  assert.equal(new URL(destinations[1]).hostname,'ipfs.io')
  assert.equal(result.checks[0].gateways.length,2)
  assert.equal(result.checks[0].gateways.every(x=>x.verified),true)
  assert.equal(result.independentPinProvidersVerified,false)
  assert.equal(result.independentBackupsVerified,false)
  assert.equal(result.nftMintVerified,false)
  assert.equal(JSON.stringify(result).includes(cid),false)
})
test('one gateway hash mismatch is a hard failure, never a replica success',async()=>{
  const r=await verifyIpfsReadbackManifest(manifest,{
    request:async url=>okResponse(url.includes('ipfs.io')?
      Buffer.from('x'.repeat(source.length)):source),
  })
  assert.equal(r.ok,false)
  assert.equal(r.checks[0].gateways[0].verified,true)
  assert.equal(r.checks[0].gateways[1].reason,'sha256_mismatch')
})
test('HTTP errors and network timeouts cannot count as verified availability',async()=>{
  const a=await verifyIpfsReadbackManifest(manifest,{
    request:async url=>url.includes('ipfs.io')?new Response('down',{status:503}):okResponse(source),
  })
  assert.equal(a.ok,false)
  assert.equal(a.checks[0].gateways[1].reason,'gateway_http_non_2xx')
  const b=await verifyIpfsReadbackManifest(manifest,{
    request:async url=>{
      if(url.includes('ipfs.io'))throw Error('could include credentials in upstream stack trace')
      return okResponse(source)
    },
  })
  assert.equal(b.ok,false)
  assert.equal(b.checks[0].gateways[1].reason,'gateway_unreachable_or_redirect')
  assert.equal(JSON.stringify(b).includes('credentials'),false)
})
test('short bytes and overlong bytes are both rejected without trusting HTTP 200',async()=>{
  const short=await verifyIpfsReadbackManifest(manifest,{
    request:async()=>okResponse(source.subarray(0,5)),
  })
  assert.equal(short.ok,false)
  assert.equal(short.checks[0].gateways[0].reason,'response_length_mismatch')
  const long=await verifyIpfsReadbackManifest(manifest,{
    request:async()=>okResponse(Buffer.concat([source,Buffer.from([33])])),
  })
  assert.equal(long.ok,false)
  assert.equal(long.checks[0].gateways[0].reason,'response_too_large')
})
test('untrusted response length is bounded and empty response stream is rejected',async()=>{
  const tooLarge=await verifyIpfsReadbackManifest(manifest,{
    request:async()=>({ok:true,headers:{get:()=>String(source.length+1000)},
      body:{async *[Symbol.asyncIterator](){throw Error('must not read oversized response')}}}),
  })
  assert.equal(tooLarge.ok,false)
  assert.equal(tooLarge.checks[0].gateways[0].reason,'response_too_large')
  const empty=await verifyIpfsReadbackManifest(manifest,{
    request:async()=>({ok:true,body:null}),
  })
  assert.equal(empty.ok,false)
  assert.equal(empty.checks[0].gateways[0].reason,'gateway_stream_unavailable')
})
test('gateway identities are fixed; no artist-provided hostname or SSRF URL',()=>{
  assert.equal(IPFS_READBACK_GATEWAYS.length,2)
  for(const gateway of IPFS_READBACK_GATEWAYS){
    const parsed=new URL(gateway.base)
    assert.equal(parsed.protocol,'https:')
    assert.equal(parsed.username,'')
    assert.equal(parsed.password,'')
  }
})
