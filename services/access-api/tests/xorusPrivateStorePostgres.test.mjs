/**
 * Disposable PostgreSQL only. Does not open auth/payment/mint or access Neon/Render.
 * Integration proof of private reports, UUID-backed grants, atomic quota and revocation.
 */
import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {authorizeXorusReportRead} from '../src/xorusEntitlements.mjs'
import {createXorusPrivateRepository} from '../src/xorusPrivateStore.mjs'

const url=process.env.TEST_XORUS_DATABASE_URL||''
const permitted=(()=>{
  try {
    const u=new URL(url)
    return process.env.ALLOW_EPHEMERAL_XORUS_PG_TEST==='1' &&
      u.protocol==='postgres:' && ['127.0.0.1','localhost'].includes(u.hostname) &&
      u.pathname==='/xartists_xorus_probe' && !u.search && !u.hash
  }catch{return false}
})()
const a='550e8400-e29b-41d4-a716-446655440000'
const b='550e8400-e29b-41d4-a716-446655440001'
const reportId='a'.repeat(64)
const grantId='xag_abcdefghijklmnop'
const scope='analysis:markets'
const actor={kind:'email',subject:a,verified:true,proof:'verified_email_session'}
const expectCode=(p,code)=>assert.rejects(p,e=>e?.code===code,'Expected PG code '+code)

test('private xOrus grants stay scoped to a verified UUID; quotas are atomic and reversible', {
  skip:!permitted && 'Requires localhost-only xartists_xorus_probe and explicit opt-in',
}, async()=>{
  const pg=(await import('pg')).default
  const pool=new pg.Pool({connectionString:url,ssl:false,max:8})
  try{
    const accounts=readFileSync(new URL('../migrations/20261109_xa_accounts_v1.sql',import.meta.url),'utf8')
    const xorus=readFileSync(new URL('../migrations/20261113_xorus_private_access.sql',import.meta.url),'utf8')
    await pool.query(accounts)
    await pool.query(xorus)
    await pool.query(xorus) // all DDL is safe to reapply to a disposable DB
    await pool.query('INSERT INTO xa_user_accounts(id) VALUES($1),($2)',[a,b])
    const now=Date.now()
    const when=n=>new Date(n)
    const issued=when(now-60000),expires=when(now+3600000)
    await pool.query(
      "INSERT INTO xa_xorus_private_reports(report_id,offer,scope,status,commercial_usage_approved,source_ts,generated_at,expires_at) VALUES($1,'pulse',$2,'ready',true,$3,$4,$5)",
      [reportId,scope,when(now-60000),when(now-4000),expires],
    )
    await pool.query(
      "INSERT INTO xa_xorus_grants(grant_id,subject_kind,subject,account_id,offer,scope,status,issued_at,expires_at,ledger_checked_at,evidence_kind,evidence_verified,evidence_checked_at,issuer_reference,billing_status,settlement,quota_limit,quota_reset_at) VALUES($1,'email',$2,$3,'pulse',$4,'active',$5,$6,$7,'verified_psp_subscription',true,$8,$9,'active','verified',2,$10)",
      [grantId,a,a,scope,issued,expires,when(now),when(now),'evt_abcdefghijklmnop',expires],
    )
    const repo=createXorusPrivateRepository(pool)
    assert.equal((await repo.lookupGrant({subject:b,subjectKind:'email',offer:'pulse',scope})),null)
    assert.equal((await repo.lookupGrant({subject:a,subjectKind:'email',offer:'sentinel',scope:'analysis:risk'})),null)
    assert.equal((await repo.lookupReport({reportId,offer:'yield',scope:'analysis:defi'})),null)
    assert.equal((await repo.lookupReport({reportId,offer:'pulse',scope})).reportId,reportId)

    const read=(overrides={})=>authorizeXorusReportRead({
      enabled:true,commercialUsageRightsVerified:true,actor,offer:'pulse',
      reportId,lookupGrant:repo.lookupGrant,lookupReport:repo.lookupReport,
      reserveQuota:repo.reserveQuota,now,...overrides,
    })
    // Real DB concurrency: no more than two reservations can commit for quota=2.
    const many=await Promise.all(Array.from({length:6},()=>read()))
    assert.equal(many.filter(x=>x.allowed===true).length,2)
    assert.equal(many.filter(x=>x.allowed===false).length,4)
    const count=await pool.query('SELECT quota_used FROM xa_xorus_grants WHERE grant_id=$1',[grantId])
    assert.equal(count.rows[0].quota_used,2)
    const receipts=await pool.query('SELECT count(*)::int AS n FROM xa_xorus_read_reservations WHERE grant_id=$1',[grantId])
    assert.equal(receipts.rows[0].n,2)
    assert.equal((await read({actor:{...actor,subject:b}})).allowed,false)

    await expectCode(pool.query(
      "INSERT INTO xa_xorus_grants(grant_id,subject_kind,subject,account_id,offer,scope,status,issued_at,expires_at,ledger_checked_at,evidence_kind,evidence_verified,evidence_checked_at,quota_limit,quota_reset_at) VALUES('xag_zabcdefghijklmnop','email',$1,$2,'pulse',$3,'pending',$4,$5,$6,'verified_psp_subscription',false,$7,1,$8)",
      [b,a,scope,issued,expires,when(now),when(now),expires],
    ),'23514')
    await expectCode(pool.query(
      "INSERT INTO xa_xorus_grants(grant_id,subject_kind,subject,account_id,offer,scope,status,issued_at,expires_at,ledger_checked_at,evidence_kind,evidence_verified,evidence_checked_at,quota_limit,quota_reset_at) VALUES('xag_zzabcdefghijklmnop','email',$1,$2,'pulse',$3,'pending',$4,$5,$6,'verified_psp_subscription',false,$7,1,$8)",
      ['550e8400-e29b-41d4-a716-446655440099','550e8400-e29b-41d4-a716-446655440099',scope,issued,expires,when(now),when(now),expires],
    ),'23503')

    // Reclaim quota in the disposable test to prove that revocation wins.
    await pool.query("UPDATE xa_xorus_grants SET quota_used=0, status='revoked',revoked_at=NOW() WHERE grant_id=$1",[grantId])
    assert.equal((await read()).allowed,false)
    await pool.query("UPDATE xa_xorus_grants SET status='active',revoked_at=NULL WHERE grant_id=$1",[grantId])
    await pool.query("UPDATE xa_xorus_private_reports SET status='revoked' WHERE report_id=$1",[reportId])
    assert.equal((await read()).allowed,false)
    const after=await pool.query('SELECT quota_used FROM xa_xorus_grants WHERE grant_id=$1',[grantId])
    assert.equal(after.rows[0].quota_used,0,'No quota consumed for revoked report')
  }finally{await pool.end()}
})
