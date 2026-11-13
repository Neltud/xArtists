/**
 * PostgreSQL-only private xOrus repository; not a route or a grant issuer.
 * Reads are scoped to authenticated subjects supplied by a separately verified
 * identity adapter. No provider data/report content/PSP secret is stored here.
 * Production migrations are NOT run by this module.
 */
import { randomUUID } from 'node:crypto'

const REPORT = /^[a-f0-9]{64}$/
const GRANT = /^xag_[A-Za-z0-9_-]{12,80}$/
const SUBJECT = /^(?:[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}|erd1[a-z0-9]{58})$/i
const SCOPES = Object.freeze({ pulse:'analysis:markets', yield:'analysis:defi', sentinel:'analysis:risk' })
const at = value => value instanceof Date && Number.isFinite(value.getTime()) ? value.getTime() : null
const strictScope = (offer,scope) => Object.hasOwn(SCOPES,offer) && SCOPES[offer]===scope

function rowToGrant(row) {
  if (!row) return null
  const evidence={
    kind:row.evidence_kind, verified:row.evidence_verified===true,
    checkedAt:at(row.evidence_checked_at),
  }
  if(evidence.kind==='verified_psp_subscription'){
    evidence.billingStatus=row.billing_status
    evidence.settlement=row.settlement
    evidence.eventId=row.issuer_reference
  } else if(evidence.kind==='verified_mvx_nft_ownership'){
    evidence.chainId=row.chain_id
    evidence.owner=row.nft_owner
    evidence.tokenIdentifier=row.token_identifier
    evidence.contract=row.nft_contract
  }
  return {
    grantId:row.grant_id, subject:row.subject, subjectKind:row.subject_kind,
    offer:row.offer, scope:row.scope, status:row.status,
    issuedAt:at(row.issued_at), expiresAt:at(row.expires_at),
    ledgerCheckedAt:at(row.ledger_checked_at), revokedAt:at(row.revoked_at),
    refundedAt:at(row.refunded_at), quotaRemaining:row.quota_limit-row.quota_used,
    quotaResetAt:at(row.quota_reset_at), evidence,
  }
}

const rowToReport = row => row ? {
  reportId:row.report_id,offer:row.offer,scope:row.scope,kind:row.kind,
  visibility:row.visibility,status:row.status,rawDataIncluded:row.raw_data_included,
  commercialUsageApproved:row.commercial_usage_approved===true,
  sourceTs:at(row.source_ts),generatedAt:at(row.generated_at),expiresAt:at(row.expires_at),
} : null

export function createXorusPrivateRepository(pool, {newRequestId=randomUUID}={}){
  if(!pool || typeof pool.query!=='function' || typeof pool.connect!=='function' ||
     typeof newRequestId!=='function') throw new TypeError('postgres_pool_required')

  return Object.freeze({
    async lookupGrant({subject,subjectKind,offer,scope}={}){
      if(typeof subject!=='string'||!SUBJECT.test(subject)||
         !['email','wallet'].includes(subjectKind)||!strictScope(offer,scope)) return null
      const out=await pool.query(
        "SELECT * FROM xa_xorus_grants WHERE subject=$1 AND subject_kind=$2 AND offer=$3 AND scope=$4 AND status='active' AND revoked_at IS NULL AND refunded_at IS NULL AND expires_at>now() ORDER BY expires_at DESC LIMIT 1",
        [subject,subjectKind,offer,scope])
      return rowToGrant(out.rows[0])
    },
    async lookupReport({reportId,offer,scope}={}){
      if(typeof reportId!=='string'||!REPORT.test(reportId)||!strictScope(offer,scope)) return null
      const out=await pool.query(
        "SELECT * FROM xa_xorus_private_reports WHERE report_id=$1 AND offer=$2 AND scope=$3",
        [reportId,offer,scope])
      return rowToReport(out.rows[0])
    },
    async lookupContent({reportId,offer,scope}={}){
      if(typeof reportId!=='string'||!REPORT.test(reportId)||!strictScope(offer,scope)) return null
      const out=await pool.query(
        "SELECT c.payload FROM xa_xorus_private_contents c JOIN xa_xorus_private_reports r ON r.report_id=c.report_id WHERE c.report_id=$1 AND r.offer=$2 AND r.scope=$3",
        [reportId,offer,scope])
      return out.rows.length===1 ? out.rows[0].payload : null
    },
    async reserveQuota({grantId,subject,scope,reportId,now,expectedLedgerCheckedAt}={}){
      if(typeof grantId!=='string'||!GRANT.test(grantId)||
         typeof subject!=='string'||!SUBJECT.test(subject)||
         typeof scope!=='string'||typeof reportId!=='string'||!REPORT.test(reportId)||
         !Number.isSafeInteger(now)||now<=0||
         !Number.isSafeInteger(expectedLedgerCheckedAt)||expectedLedgerCheckedAt<=0)
        return {reserved:false}

      const requestId=newRequestId() // never accept a browser-supplied request id
      if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(requestId))
        throw Error('invalid_server_request_id')
      const client=await pool.connect()
      let inTransaction=false
      try {
        await client.query('BEGIN'); inTransaction=true
        // FOR SHARE prevents the report being revoked while this read is reserved.
        const approved=await client.query(
          "SELECT offer FROM xa_xorus_private_reports WHERE report_id=$1 AND scope=$2 AND status='ready' AND visibility='private' AND kind='derived_xartists_analysis' AND commercial_usage_approved=true AND raw_data_included=false AND source_ts<=generated_at AND generated_at<=$3 AND expires_at>$3 FOR SHARE",
          [reportId,scope,new Date(now)])
        if(approved.rows.length!==1){await client.query('ROLLBACK');inTransaction=false;return {reserved:false}}
        const updated=await client.query(
          "UPDATE xa_xorus_grants SET quota_used=quota_used+1 WHERE grant_id=$1 AND subject=$2 AND scope=$3 AND offer=$4 AND status='active' AND revoked_at IS NULL AND refunded_at IS NULL AND evidence_verified=true AND ledger_checked_at=$5 AND ledger_checked_at>=($6::timestamptz - interval '60 seconds') AND ledger_checked_at<=($6::timestamptz + interval '1 second') AND evidence_checked_at>=($6::timestamptz - interval '60 seconds') AND evidence_checked_at<=($6::timestamptz + interval '1 second') AND ((subject_kind='email' AND account_id::text=subject AND evidence_kind='verified_psp_subscription' AND billing_status='active' AND settlement='verified' AND issuer_reference ~ '^[A-Za-z0-9:_-]{8,160}$') OR (subject_kind='wallet' AND evidence_kind='verified_mvx_nft_ownership' AND chain_id='1' AND nft_owner=subject AND nft_contract ~ '^erd1[a-z0-9]{58}$' AND token_identifier ~ '^[A-Za-z0-9:_-]{8,128}$')) AND issued_at<=$6 AND expires_at>$6 AND quota_reset_at>$6 AND quota_used<quota_limit RETURNING grant_id, (quota_limit-quota_used) AS remaining",
          [grantId,subject,scope,approved.rows[0].offer,new Date(expectedLedgerCheckedAt),new Date(now)])
        if(updated.rows.length!==1){await client.query('ROLLBACK');inTransaction=false;return {reserved:false}}
        await client.query(
          "INSERT INTO xa_xorus_read_reservations(request_id,grant_id,report_id,subject,reserved_at) VALUES($1,$2,$3,$4,$5)",
          [requestId,grantId,reportId,subject,new Date(now)])
        await client.query('COMMIT');inTransaction=false
        return {reserved:true,grantId,remaining:updated.rows[0].remaining}
      }catch(error){
        if(inTransaction) await client.query('ROLLBACK')
        // Never expose SQL messages to a client; caller maps errors to generic 503.
        throw Error('private_quota_store_unavailable')
      }finally{client.release()}
    },
  })
}
