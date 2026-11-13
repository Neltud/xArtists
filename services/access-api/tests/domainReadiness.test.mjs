import {test} from 'node:test'
import assert from 'node:assert/strict'
import {
  evaluatePublicDomainRecords,auditXartistsDomain,
} from '../src/domainReadiness.mjs'

const status=(v,records=[])=>({Status:v,Answer:records})
const record=(type,data)=>({name:'xartists.art.',type,TTL:3600,data})
const rdap=(s=['active'])=>({
  ldhName:'xartists.art',status:s,
  events:[{eventAction:'expiration',eventDate:'2027-10-15T23:59:59Z'}],
  entities:[{vcardArray:['secret registry private contact']}],
})
const scenario=(statuses=['active'])=>({
  rdap:rdap(statuses),
  ns:status(0,[record(2,'dns107.ovh.net.')]),
  mx:status(0,[record(15,'10 mail.example.com.')]),
  txtRecords:status(0,[record(16,'"v=spf1 include:example.com -all"')]),
  dmarcRecords:status(0,[record(16,'"v=DMARC1; p=reject"')]),
  now:Date.parse('2026-11-09T21:00:00Z'),
})

test('registered domain with clientHold NEVER becomes public mail GO',()=>{
  const got=evaluatePublicDomainRecords(scenario(['client hold','client transfer prohibited']))
  assert.equal(got.audit_available,true)
  assert.equal(got.registrar_hold_clear,false)
  assert.equal(got.dns_configuration_appears_complete,false)
  assert.equal(got.reason,'registrar_domain_hold')
  assert.equal(got.email_send_receive_verified,false)
  assert.equal(got.domain_release_ready,false)
  assert.equal(JSON.stringify(got).includes('secret registry'),false)
})

test('even healthy DNS, all mail records and no hold cannot certify delivery',()=>{
  const got=evaluatePublicDomainRecords(scenario())
  assert.equal(got.registrar_hold_clear,true)
  assert.equal(got.has_mx,true)
  assert.equal(got.has_spf,true)
  assert.equal(got.has_dmarc,true)
  assert.equal(got.dns_configuration_appears_complete,true)
  assert.equal(got.domain_release_ready,false)
  assert.equal(got.reason,'external_mailbox_proof_required')
})

test('mail exchange NXDOMAIN or missing SPF/DMARC fails closed',()=>{
  const bad=[
    [{ns:status(3)},'dns_delegation_not_resolving'],
    [{mx:status(3)},'mx_missing_or_unresolvable'],
    [{txtRecords:status(0)},'spf_missing'],
    [{dmarcRecords:status(0)},'dmarc_missing'],
    [{mx:status(0,[record(15,'not-an-exchange')])},'mx_missing_or_unresolvable'],
  ]
  for(const [changes,reason] of bad){
    const got=evaluatePublicDomainRecords({...scenario(),...changes})
    assert.equal(got.dns_configuration_appears_complete,false,reason)
    assert.equal(got.reason,reason)
  }
})

test('registrar suspended, expired or mismatched RDAP blocks even when DNS seems available',()=>{
  for(const statuses of [['server hold'],['redemptionPeriod'],['pending delete']]){
    const result=evaluatePublicDomainRecords(scenario(statuses))
    assert.equal(result.registrar_hold_clear,false)
    assert.equal(result.domain_release_ready,false)
  }
  const expired=scenario()
  expired.now=Date.parse('2028-01-01T00:00:00Z')
  assert.equal(evaluatePublicDomainRecords(expired).reason,
    'registration_expiry_not_verified')
  assert.equal(evaluatePublicDomainRecords({...scenario(),rdap:{ldhName:'evil.example',status:['active']}}).audit_available,false)
})

test('five fixed public sources only; never registrar writes or disclose confidential metadata',async()=>{
  const requests=[]
  const responses=new Map([
    ['https://rdap.centralnic.com/art/domain/xartists.art',rdap(['client hold'])],
    ['https://dns.google/resolve?name=xartists.art&type=NS',scenario().ns],
    ['https://dns.google/resolve?name=xartists.art&type=MX',status(3)],
    ['https://dns.google/resolve?name=xartists.art&type=TXT',status(3)],
    ['https://dns.google/resolve?name=_dmarc.xartists.art&type=TXT',status(3)],
  ])
  const request=async(url,options)=>{
    requests.push({url,options})
    assert.equal(options.method,'GET')
    assert.equal(options.redirect,'error')
    assert.equal(options.cache,'no-store')
    assert.ok(responses.has(url),'unexpected DNS destination')
    return new Response(JSON.stringify(responses.get(url)),{
      status:200,headers:{'content-type':'application/json'},
    })
  }
  const result=await auditXartistsDomain({request,now:scenario().now})
  assert.equal(requests.length,5)
  assert.equal(result.reason,'registrar_domain_hold')
  assert.equal(result.domain_release_ready,false)
  assert.equal(JSON.stringify(result).includes('secret registry'),false)
})

test('HTTP error or oversized response returns only neutral false evidence',async()=>{
  for(const request of [
    async()=>new Response('server down',{status:503}),
    async()=>new Response(JSON.stringify(rdap()),{
      status:200,headers:{'content-length':'999999'},
    }),
  ]){
    const proof=await auditXartistsDomain({request})
    assert.equal(proof.audit_available,false)
    assert.equal(proof.domain_release_ready,false)
    assert.equal(proof.email_send_receive_verified,false)
  }
})

// 13 Nov 2026 public records: transfer/delete restrictions and auto-renew
// are NOT a hold; an MX/SPF/DMARC record never certifies a real mailbox.
test('current public RDAP restrictions and configured DNS still require a mailbox receipt',()=>{
  const got=evaluatePublicDomainRecords(scenario([
    'client transfer prohibited','client delete prohibited','auto renew period',
  ]))
  assert.equal(got.registrar_hold_clear,true)
  assert.equal(got.dns_configuration_appears_complete,true)
  assert.equal(got.email_send_receive_verified,false)
  assert.equal(got.domain_release_ready,false)
  assert.equal(got.reason,'external_mailbox_proof_required')
})
