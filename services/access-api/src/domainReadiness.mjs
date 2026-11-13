/**
 * P0 #341 — PUBLIC DNS/RDAP probe. No registrar login, no DNS changes.
 * DNS records are not proof that hello@ receives or sends messages.
 * Never output registrant, registrar contacts, raw responses or IP addresses.
 */
const DOMAIN='xartists.art'
const RDAP='https://rdap.centralnic.com/art/domain/'+DOMAIN
const DNS='https://dns.google/resolve?name='
const LIMIT=128*1024
const statusKey=v=>String(v).toLowerCase().replace(/[^a-z]/g,'')
const HOLD=new Set(['clienthold','serverhold','inactive','pendingdelete','redemptionperiod'])
const redactedUnavailable=()=>({
  audit_available:false,
  registrar_hold_clear:false,
  dns_zone_resolves:false,
  has_mx:false,has_spf:false,has_dmarc:false,
  domain_release_ready:false,email_send_receive_verified:false,
  reason:'public_domain_evidence_unavailable',
})

async function limitedJson(response){
  if(!response?.ok)throw Error('http_not_ok')
  const length=response.headers?.get?.('content-length')
  if(length&&Number(length)>LIMIT)throw Error('reply_too_large')
  if(!response.body||typeof response.body[Symbol.asyncIterator]!=='function')
    throw Error('response_stream_missing')
  const chunks=[]
  let seen=0
  for await(const chunk of response.body){
    seen+=chunk.length
    if(seen>LIMIT)throw Error('reply_too_large')
    chunks.push(chunk)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}
async function readJson(url,request){
  const response=await request(url,{
    method:'GET',redirect:'error',cache:'no-store',
    headers:{Accept:'application/json'},
    signal:AbortSignal.timeout(10000),
  })
  return limitedJson(response)
}
const dnsQuery=(name,type)=>
  DNS+encodeURIComponent(name)+'&type='+encodeURIComponent(type)
const answers=(data,type)=>
  data?.Status===0 && Array.isArray(data.Answer)
    ? data.Answer.filter(x=>x?.type===type && typeof x.data==='string').map(x=>x.data)
    : []
const spf=v=>/^"?v=spf1(?:\s|$)/i.test(v)
const dmarc=v=>/^"?v=DMARC1(?:\s*;|$)/i.test(v)
const txt=v=>String(v||'').replace(/"\s*"/g,'')

/** Pure public-data classification. Credential-free, not mail validation. */
export function evaluatePublicDomainRecords({rdap,ns,mx,txtRecords,dmarcRecords,now=Date.now()}={}){
  if(rdap?.ldhName?.toLowerCase()!==DOMAIN ||
      !Array.isArray(rdap?.status)||!Number.isFinite(now))
    return redactedUnavailable()
  const registrarHold = rdap.status.some(s=>HOLD.has(statusKey(s)))
  const expires=rdap.events?.find(x=>x?.eventAction==='expiration')?.eventDate
  const date=expires?Date.parse(expires):NaN
  const notExpired=Number.isFinite(date)&&date>now
  const zone=ns?.Status===0 && answers(ns,2).length>=1
  const mail=mx?.Status===0 && answers(mx,15).some(v=>/^\d{1,5}\s+[a-z0-9.-]+\.$/i.test(v))
  const validSpf=txtRecords?.Status===0 && answers(txtRecords,16).some(v=>spf(txt(v)))
  const validDmarc=dmarcRecords?.Status===0 && answers(dmarcRecords,16).some(v=>dmarc(txt(v)))
  const eligible=!registrarHold&&notExpired&&zone&&mail&&validSpf&&validDmarc
  return {
    audit_available:true,
    registrar_hold_clear:!registrarHold,
    registration_unexpired:notExpired,
    dns_zone_resolves:zone,
    has_mx:mail,has_spf:validSpf,has_dmarc:validDmarc,
    dns_configuration_appears_complete:eligible,
    // A real external inbox/send proof is required before GO.
    domain_release_ready:false,
    email_send_receive_verified:false,
    reason:registrarHold?'registrar_domain_hold':
      !notExpired?'registration_expiry_not_verified':
      !zone?'dns_delegation_not_resolving':
      !mail?'mx_missing_or_unresolvable':
      !validSpf?'spf_missing':
      !validDmarc?'dmarc_missing':'external_mailbox_proof_required',
  }
}

/** Reads five PUBLIC pinned endpoints concurrently; fail-closed on any outage. */
export async function auditXartistsDomain({request=fetch,now=Date.now()}={}){
  try{
    const [rdap,ns,mx,txtRecords,dmarcRecords]=await Promise.all([
      readJson(RDAP,request),
      readJson(dnsQuery(DOMAIN,'NS'),request),
      readJson(dnsQuery(DOMAIN,'MX'),request),
      readJson(dnsQuery(DOMAIN,'TXT'),request),
      readJson(dnsQuery('_dmarc.'+DOMAIN,'TXT'),request),
    ])
    return evaluatePublicDomainRecords({rdap,ns,mx,txtRecords,dmarcRecords,now})
  }catch{return redactedUnavailable()}
}
