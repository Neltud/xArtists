/**
 * Curated, DERIVED xOrus customer analysis — strict private delivery contract.
 * Never export provider OHLCV, prompts, internal board or third-party payloads.
 * Only an operator-licensed writer may persist a report; this is a reader.
 */
import {createHash} from 'node:crypto'
import {authorizeXorusReportRead,XORUS_OFFER_SCOPES} from './xorusEntitlements.mjs'

const EXACT=(obj,keys)=>obj&&typeof obj==='object'&&!Array.isArray(obj)&&
  Object.keys(obj).length===keys.length&&keys.every(key=>Object.hasOwn(obj,key))
const KEYS=['schema','offer','scope','title','summary','stance','source_ts','generated_at',
  'findings','risks','scenarios','limitations','raw_data_included','executable']
const FINDING=['family','reading','interpretation']
const SCENARIO=['condition','interpretation']
const FAMILIES=new Set(['price','volume','volatility','liquidity','onchain','dex','funding','social','art','risk','macro'])
const READINGS=new Set(['positive','negative','mixed','balanced','insufficient_evidence'])
const STANCES=new Set(['ABSTAIN','WATCH','CAUTION'])
const REPORT=/^[a-f0-9]{64}$/
const token=/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/
const text=(v,max)=>typeof v==='string'&&v.length>0&&v.length<=max&&
  !/https?:\/\/|www\.|<script|[\u0000-\u001f]/i.test(v)
const date=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(v)&&
  Number.isFinite(Date.parse(v))&&new Date(Date.parse(v)).toISOString()===
    (v.includes('.')?v:v.replace('Z','.000Z'))
const validArray=(arr,max,fn)=>Array.isArray(arr)&&arr.length<=max&&arr.every(fn)
const canonical=v=>Array.isArray(v)?v.map(canonical):
  v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v
const digest=payload=>createHash('sha256').update(JSON.stringify(canonical(payload))).digest('hex')
const fail=(status,error)=>Object.freeze({status,body:{ok:false,error}})

export function validateXorusPrivateReport(payload,metadata,now=Date.now()){
  if(!EXACT(payload,KEYS)||payload.schema!=='xorus_private_analysis/v1'||
      !Object.hasOwn(XORUS_OFFER_SCOPES,payload.offer)||
      payload.scope!==XORUS_OFFER_SCOPES[payload.offer]||
      !text(payload.title,100)||!text(payload.summary,1000)||
      !STANCES.has(payload.stance)||!date(payload.source_ts)||!date(payload.generated_at)||
      payload.raw_data_included!==false||payload.executable!==false||
      !validArray(payload.findings,11,row=>EXACT(row,FINDING)&&FAMILIES.has(row.family)&&
        READINGS.has(row.reading)&&text(row.interpretation,600))||
      !validArray(payload.risks,8,v=>text(v,300))||
      !validArray(payload.scenarios,6,v=>EXACT(v,SCENARIO)&&text(v.condition,200)&&
        text(v.interpretation,400))||
      !validArray(payload.limitations,8,v=>text(v,300)))return null
  const generated=Date.parse(payload.generated_at),source=Date.parse(payload.source_ts)
  if(!Number.isSafeInteger(now)||source>generated||generated>now+1000)return null
  if(!metadata||metadata.offer!==payload.offer||metadata.scope!==payload.scope||
     metadata.kind!=='derived_xartists_analysis'||metadata.visibility!=='private'||
     metadata.status!=='ready'||metadata.rawDataIncluded!==false||
     metadata.commercialUsageApproved!==true||
     metadata.sourceTs!==source||metadata.generatedAt!==generated||
     !Number.isSafeInteger(metadata.expiresAt)||metadata.expiresAt<=now||
     typeof metadata.reportId!=='string'||!REPORT.test(metadata.reportId)||
     digest(payload)!==metadata.reportId)return null
  // JSON round-trip prevents the original DB object being mutated after verification.
  return structuredClone(payload)
}

/**
 * Gated, read-only private delivery. verifyAccount maps a VERIFIED Neon bearer to
 * an existing enabled xArtists account UUID; it NEVER creates a user on read.
 * repo must be server-side PostgreSQL; no browser-provided grant, provider URL or
 * content is accepted. Quota is reserved only after report integrity validation.
 */
export function createXorusPrivateDelivery({
  enabled=false,commercialUsageRightsVerified=false,originAllowed=()=>false,
  verifyAccount,repo,clock=Date.now,
}={}){
  return Object.freeze({
    async read({offer,reportId,authorization,origin}={}){
      if(!enabled||!commercialUsageRightsVerified)
        return fail(503,'private_analysis_unavailable')
      if(origin&&(typeof origin!=='string'||!originAllowed(origin)))
        return fail(403,'origin_not_allowed')
      if(!Object.hasOwn(XORUS_OFFER_SCOPES,offer)||typeof reportId!=='string'||!REPORT.test(reportId))
        return fail(404,'report_not_found')
      if(typeof authorization!=='string'||authorization.length>8300||
         !authorization.startsWith('Bearer ')||!token.test(authorization.slice(7))||
         authorization.length<71||typeof verifyAccount!=='function')
        return fail(401,'authenticated_email_session_required')
      if(!repo||typeof repo.lookupGrant!=='function'||
         typeof repo.lookupReport!=='function'||typeof repo.lookupContent!=='function'||
         typeof repo.reserveQuota!=='function'||typeof clock!=='function')
        return fail(503,'private_analysis_unavailable')
      let actor
      try{
        actor=await verifyAccount(authorization.slice(7))
      }catch(error){
        return fail(error?.message==='account_disabled'?403:401,
          error?.message==='account_disabled'?'account_disabled':'authenticated_email_session_required')
      }
      if(!actor||actor.kind!=='email'||actor.verified!==true||
        actor.proof!=='verified_email_session')
        return fail(401,'authenticated_email_session_required')
      const scope=XORUS_OFFER_SCOPES[offer],now=clock()
      if(!Number.isSafeInteger(now)||now<=0)return fail(503,'private_analysis_unavailable')
      let meta,content
      try{
        meta=await repo.lookupReport({reportId,offer,scope})
        if(!meta)return fail(404,'report_not_found')
        content=await repo.lookupContent({reportId,offer,scope})
      }catch{return fail(503,'private_report_store_unavailable')}
      const report=validateXorusPrivateReport(content,meta,now)
      if(!report)return fail(404,'report_not_found')
      const access=await authorizeXorusReportRead({
        enabled:true,commercialUsageRightsVerified:true,actor,offer,reportId,
        lookupGrant:repo.lookupGrant,lookupReport:repo.lookupReport,
        reserveQuota:repo.reserveQuota,now,
      })
      if(!access.allowed)return fail(access.status,access.reason)
      return Object.freeze({
        status:200,
        body:{ok:true,reportId,offer,report,remainingQuota:access.remainingQuota,
          expiresAt:new Date(access.expiresAt).toISOString()},
      })
    },
  })
}
