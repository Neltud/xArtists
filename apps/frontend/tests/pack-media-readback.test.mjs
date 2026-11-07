import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {test} from 'node:test'
import {readFileSync} from 'node:fs'
import {validatePackReadbackRequest,verifyPackMediaReadback} from '../scripts/verify-pack-media-readback.mjs'

const content = Buffer.from('xArtists approved pack media bytes -- test only')
const sha256 = createHash('sha256').update(content).digest('hex')
const sample = () => ({
 kind:'xartists_pack_media_readback',
 nftIdentifier:'XAIPLS-2cf72b-01',
 ipfsUri:'ipfs://bafy'+'a'.repeat(50)+'/pulse.png',
 sha256, contentType:'image/png', maxBytes:1024,
 gateways:['https://ipfs.io','https://dweb.link'],
})
const reply=(data=content,mime='image/png')=>new Response(data,{status:200,
  headers:{'content-type':mime,'content-length':String(data.length)}})

test('no CID, bad token or unsafe gateways fail before any network request',async()=>{
 for(const mutation of [
  r=>{r.ipfsUri='ipfs://pending'},
  r=>{r.nftIdentifier='XAIPLS-2cf72b-05'},
  r=>{r.gateways=['http://127.0.0.1','https://dweb.link']},
  r=>{r.gateways=['https://ipfs.io','https://ipfs.io']},
  r=>{r.gateways=['https://evil.example','https://dweb.link']},
  r=>{r.contentType='application/x-sh'},
  r=>{r.maxBytes=999999999},
  r=>{r.sha256=''},
 ]) {
  const r=sample();mutation(r)
  let requests=0
  const result=await verifyPackMediaReadback(r,()=>{requests++;throw Error('unexpected')})
  assert.equal(requests,0)
  assert.equal(result.status,'NO_GO')
  assert.equal(result.repairAllowed,false)
 }
})

test('two equal readbacks never imply two pins or an on-chain repair',async()=>{
 const requests=[]
 const report=await verifyPackMediaReadback(sample(),(url,options)=>{
   requests.push({url,options})
   return Promise.resolve(reply())
 })
 assert.equal(report.ok,true)
 assert.equal(report.status,'READBACK_ONLY_PINNING_UNPROVEN')
 assert.equal(report.readbackConfirmed,true)
 assert.equal(report.independentPinsVerified,false)
 assert.equal(report.archivalBackupVerified,false)
 assert.equal(report.ownerRolesVerified,false)
 assert.equal(report.repairAllowed,false)
 assert.equal(report.listingAllowed,false)
 assert.equal(requests.length,2)
 assert.ok(requests.every(x=>x.options.method==='GET' && x.options.redirect==='error'))
 assert.equal(report.gatewayChecks[0].sha256,sha256)
 assert.equal(report.gatewayChecks[1].bytes,content.length)
})

test('wrong bytes or wrong MIME cannot produce proof',async()=>{
 const r=sample()
 const bad=await verifyPackMediaReadback(r,url=>Promise.resolve(
   url.startsWith('https://ipfs.io') ? reply() : reply(Buffer.from('tampered'))
 ))
 assert.equal(bad.status,'NO_GO')
 assert.equal(bad.readbackConfirmed,false)
 const mime=await verifyPackMediaReadback(r,()=>Promise.resolve(reply(content,'text/html')))
 assert.equal(mime.status,'NO_GO')
 assert.equal(mime.gatewayChecks[0].reason,'mime_mismatch')
})

test('missing or oversized media are rejected without claiming pinning',async()=>{
 const r=sample()
 const report=await verifyPackMediaReadback(r,()=>Promise.resolve(reply(Buffer.alloc(1025))))
 assert.equal(report.status,'NO_GO')
 assert.equal(report.gatewayChecks[0].reason,'too_large')
 const unavailable=await verifyPackMediaReadback(r,()=>Promise.reject(Error('network unavailable')))
 assert.equal(unavailable.status,'NO_GO')
 assert.equal(unavailable.repairAllowed,false)
})

test('the verifier never sends writes, signatures or live transactions',()=>{
 const source=readFileSync(new URL('../scripts/verify-pack-media-readback.mjs',import.meta.url),'utf8')
 assert.doesNotMatch(source,/method:\s*'POST'/)
 assert.doesNotMatch(source,/method:\s*'PUT'/)
 assert.doesNotMatch(source,/sendTransaction\s*\(/)
 assert.doesNotMatch(source,/pin\/add/)
 assert.deepEqual(validatePackReadbackRequest(sample()),[])
})
