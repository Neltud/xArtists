import assert from 'node:assert/strict'
import {test} from 'node:test'
import {createHash} from 'node:crypto'
import {ipfsPinAuditConfig,auditStudioIpfsPinProviders} from '../src/ipfsPinAudit.mjs'

const CID='bafy'+'a'.repeat(52)
const BYTES=Buffer.from('xArtists independent storage evidence fixture; not a real IPFS pin')
const SHA=createHash('sha256').update(BYTES).digest('hex')
const MANIFEST={assets:[{mediaUri:'ipfs://'+CID+'/recto.png',sha256:SHA,bytes:BYTES.length}]}
const LOCAL_ENV={
  IPFS_PIN_AUDIT_ENABLED:'1',
  PINATA_JWT:'test-pinata-jwt-'.repeat(5),
  IPFS_SECONDARY_RPC_URL:'http://127.0.0.1:5001',
  IPFS_SECONDARY_LOCAL_TUNNEL_APPROVED:'1',
}
const json=(value,options={})=>new Response(JSON.stringify(value),{
  status:200,headers:{'content-type':'application/json',...options},
})
function mockHttp({pinataStatus='pinned',pinataCid=CID,kuboType='recursive',
  kuboCid=CID,gatewayBytes=BYTES,providerFailure=false}={}){
  const calls=[]
  const request=async(url,opts)=>{
    calls.push({url,opts})
    if(url.startsWith('https://api.pinata.cloud/data/pinList')){
      assert.equal(opts.method,'GET')
      assert.equal(opts.redirect,'error')
      assert.ok(opts.headers.Authorization.startsWith('Bearer test-pinata-jwt-'))
      const u=new URL(url)
      assert.equal(u.searchParams.get('cid'),CID)
      assert.equal(u.searchParams.get('status'),'pinned')
      if(providerFailure)return new Response('<html>auth rejected</html>',{
        status:200,headers:{'content-type':'text/html'},
      })
      return json({rows:[{ipfs_pin_hash:pinataCid,status:pinataStatus}]})
    }
    if(url.startsWith('http://127.0.0.1:5001/api/v0/pin/ls')){
      assert.equal(opts.method,'POST')
      assert.equal(opts.redirect,'error')
      assert.ok(!opts.headers.Authorization,'local SSH tunnel should not need public bearer')
      const u=new URL(url)
      assert.equal(u.searchParams.get('arg'),CID)
      assert.equal(u.searchParams.get('type'),'recursive')
      return json({Keys:{[kuboCid]:{Type:kuboType}}})
    }
    assert.ok(url.startsWith('https://gateway.pinata.cloud/ipfs/')||
      url.startsWith('https://ipfs.io/ipfs/'),'unexpected host')
    assert.equal(opts.method,'GET')
    assert.equal(opts.redirect,'error')
    return new Response(gatewayBytes,{status:200})
  }
  return {request,calls}
}

test('operator-only flag, local tunnel and remote allowlist fail closed before network',async()=>{
  for(const change of [
    {IPFS_PIN_AUDIT_ENABLED:'0'},
    {PINATA_JWT:''},
    {IPFS_SECONDARY_LOCAL_TUNNEL_APPROVED:'0'},
    {IPFS_SECONDARY_RPC_URL:'http://10.0.0.5:5001'},
    {IPFS_SECONDARY_RPC_URL:'http://169.254.169.254'},
    {IPFS_SECONDARY_RPC_URL:'http://example.org'},
    {IPFS_SECONDARY_RPC_URL:'https://user:password@kubo.example.org'},
    {IPFS_SECONDARY_RPC_URL:'https://kubo.example.org/evil'},
    {IPFS_SECONDARY_RPC_URL:'https://kubo.example.org/?redirect=evil'},
  ]){
    assert.throws(()=>ipfsPinAuditConfig({...LOCAL_ENV,...change}),/ipfs_pin_audit_configuration_invalid/)
  }
  let called=false
  await assert.rejects(auditStudioIpfsPinProviders(MANIFEST,{
    env:{...LOCAL_ENV,IPFS_PIN_AUDIT_ENABLED:'0'},
    request:async()=>{called=true;throw Error('unexpected')},
  }),/ipfs_pin_audit_configuration_invalid/)
  assert.equal(called,false)
})

test('remote Kubo requires HTTPS, allowlisted hostname and operator bearer',()=>{
  const remote={...LOCAL_ENV,
    IPFS_SECONDARY_RPC_URL:'https://kubo.example.org',
    IPFS_SECONDARY_ALLOWED_HOSTS:'kubo.example.org',
    IPFS_SECONDARY_RPC_BEARER:'test-kubo-token-'.repeat(3),
  }
  assert.equal(ipfsPinAuditConfig(remote).secondaryOrigin,'https://kubo.example.org')
  for(const change of [
    {IPFS_SECONDARY_ALLOWED_HOSTS:'attacker.example.org'},
    {IPFS_SECONDARY_RPC_BEARER:''},
    {IPFS_SECONDARY_RPC_URL:'http://kubo.example.org'},
    {IPFS_SECONDARY_RPC_URL:'https://evil.kubo.example.org'},
    {IPFS_SECONDARY_RPC_URL:'https://192.0.2.1',IPFS_SECONDARY_ALLOWED_HOSTS:'192.0.2.1'},
  ])assert.throws(()=>ipfsPinAuditConfig({...remote,...change}))
})

test('Pinata + separate recursive Kubo pin + two exact gateway readbacks pass only limited audit',async()=>{
  const {request,calls}=mockHttp()
  const proof=await auditStudioIpfsPinProviders(MANIFEST,{env:LOCAL_ENV,request})
  assert.equal(proof.ok,true)
  assert.equal(proof.twoPinSystemsReported,true)
  assert.equal(proof.gatewayByteReadbackVerified,true)
  assert.equal(proof.independentPinProvidersVerified,false)
  assert.equal(proof.independentBackupsVerified,false)
  assert.equal(proof.restoreTestVerified,false)
  assert.equal(proof.nftMintVerified,false)
  assert.equal(proof.pinReports.length,1)
  assert.equal(proof.pinReports[0].rootCidSha256,createHash('sha256').update(CID).digest('hex'))
  assert.equal(calls.length,4)
  assert.equal(JSON.stringify(proof).includes(CID),false)
  assert.equal(JSON.stringify(proof).includes(LOCAL_ENV.PINATA_JWT),false)
})

test('same root shared by two files queries Pinata and Kubo only once',async()=>{
  const {request,calls}=mockHttp()
  const proof=await auditStudioIpfsPinProviders({assets:[
    MANIFEST.assets[0],
    {...MANIFEST.assets[0],mediaUri:'ipfs://'+CID+'/verso.png'},
  ]},{env:LOCAL_ENV,request})
  assert.equal(proof.ok,true)
  assert.equal(proof.distinctRootCount,1)
  assert.equal(calls.length,6) // 2 pin status requests + 4 gateway readbacks
})

test('missing Pinata status, alternate CID or indirect Kubo pin never attests both systems',async()=>{
  for(const changes of [
    {pinataStatus:'queued'},
    {pinataCid:'bafy'+'b'.repeat(52)},
    {kuboType:'indirect'},
    {kuboCid:'bafy'+'b'.repeat(52)},
    {providerFailure:true},
  ]){
    const {request}=mockHttp(changes)
    const proof=await auditStudioIpfsPinProviders(MANIFEST,{env:LOCAL_ENV,request})
    assert.equal(proof.ok,false)
    assert.equal(proof.twoPinSystemsReported,false)
    assert.equal(proof.gatewayByteReadbackVerified,true)
  }
})

test('two provider pin reports cannot override a gateway byte mismatch',async()=>{
  const {request}=mockHttp({gatewayBytes:Buffer.alloc(BYTES.length,2)})
  const proof=await auditStudioIpfsPinProviders(MANIFEST,{env:LOCAL_ENV,request})
  assert.equal(proof.twoPinSystemsReported,true)
  assert.equal(proof.gatewayByteReadbackVerified,false)
  assert.equal(proof.ok,false)
})

test('oversized provider JSON response is rejected without reading unbounded data',async()=>{
  const {request:good}=mockHttp()
  const request=async(url,opts)=>{
    if(url.startsWith('https://api.pinata.cloud/'))
      return new Response(JSON.stringify({rows:[]}),{
        status:200,headers:{'content-length':'999999','content-type':'application/json'},
      })
    return good(url,opts)
  }
  const result=await auditStudioIpfsPinProviders(MANIFEST,{env:LOCAL_ENV,request})
  assert.equal(result.ok,false)
  assert.equal(result.pinReports[0].pinataReportedPinned,false)
})

test('malformed manifest is denied before querying private providers',async()=>{
  let count=0
  await assert.rejects(auditStudioIpfsPinProviders({assets:[{mediaUri:'http://127.0.0.1/admin',sha256:SHA,bytes:BYTES.length}]},{
    env:LOCAL_ENV,request:async()=>{count++;throw Error('should not run')},
  }),/invalid_ipfs_asset_uri/)
  assert.equal(count,0)
})
