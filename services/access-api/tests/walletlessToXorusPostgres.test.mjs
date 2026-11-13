/**
 * Full synthetic chain on disposable PostgreSQL 16:
 * signed Neon-like Ed25519 JWT → verified account UUID → private report →
 * test-only entitlement/quota → refund revocation.
 * No provider, auth account, payment or wallet is contacted.
 */
import {test} from 'node:test'
import assert from 'node:assert/strict'
import {generateKeyPairSync,sign} from 'node:crypto'
import {readFileSync} from 'node:fs'
import {createNeonAuthIdentityVerifier,findOrCreateAccountFromNeonToken} from '../src/neonAuthIdentity.mjs'
import {createWalletlessSessionService} from '../src/walletlessSession.mjs'
import {createXorusPrivateRepository} from '../src/xorusPrivateStore.mjs'
import {authorizeXorusReportRead} from '../src/xorusEntitlements.mjs'

const url=process.env.TEST_XORUS_DATABASE_URL||''
const permitted=(()=>{
  try {
    const u=new URL(url)
    return process.env.ALLOW_EPHEMERAL_XORUS_PG_TEST==='1' &&
      u.protocol==='postgres:'&&['localhost','127.0.0.1'].includes(u.hostname) &&
      u.pathname==='/xartists_xorus_probe'&&!u.search&&!u.hash
  } catch{return false}
})()
const baseUrl='https://ep-synthetic.neonauth.c-8.eu-central-1.aws.neon.tech/xartists_access/auth'
const origin=new URL(baseUrl).origin
const {privateKey,publicKey}=generateKeyPairSync('ed25519')
const jwk={...publicKey.export({format:'jwk'}),alg:'EdDSA',use:'sig',kid:'synthetic-ci'}
const enc=x=>Buffer.from(JSON.stringify(x)).toString('base64url')
const makeToken=(now,patch={})=>{
  const claims={
    iss:origin,aud:origin,sub:'fb2c64c1-92f0-4f37-8f42-8c9ce23a78cd',
    id:'fb2c64c1-92f0-4f37-8f42-8c9ce23a78cd',
    email:'synthetic-artist@example.test',emailVerified:true,banned:false,
    iat:Math.floor(now/1000)-3,exp:Math.floor(now/1000)+600,...patch,
  }
  const h=enc({alg:'EdDSA',typ:'JWT',kid:jwk.kid}),p=enc(claims)
  return h+'.'+p+'.'+sign(null,Buffer.from(h+'.'+p),privateKey).toString('base64url')
}

test('verified email account → test entitlement → private report → refund revocation, all offline', {
  skip:!permitted && 'Requires an explicit disposable local PostgreSQL database',
},async()=>{
  const pg=(await import('pg')).default
  const pool=new pg.Pool({connectionString:url,ssl:false,max:5})
  try{
    const accounts=readFileSync(new URL('../migrations/20261109_xa_accounts_v1.sql',import.meta.url),'utf8')
    const xorus=readFileSync(new URL('../migrations/20261113_xorus_private_access.sql',import.meta.url),'utf8')
    await pool.query(accounts);await pool.query(xorus)
    const now=Date.now()
    const verify=createNeonAuthIdentityVerifier({
      baseUrl,clock:()=>now,fetchImpl:async fetched=>{
        assert.equal(fetched,baseUrl+'/.well-known/jwks.json')
        return {ok:true,text:async()=>JSON.stringify({keys:[jwk]})}
      },
    })
    const bridge=createWalletlessSessionService({
      enabled:true,originAllowed:value=>value==='https://xartists.art',
      resolveVerifiedAccount:token=>findOrCreateAccountFromNeonToken(pool,token,verify),
    })
    const request=(token)=>bridge.exchange({authorization:'Bearer '+token,
      origin:'https://xartists.art',contentLength:'0'})
    const signed=makeToken(now)
    const logged=await request(signed)
    assert.equal(logged.status,200)
    const accountId=logged.body.account.id
    assert.match(accountId,/^[a-f0-9-]{36}$/)
    assert.equal(logged.body.checkoutAuthorized,false)
    assert.equal(logged.body.nftEntitlement,false)
    assert.equal((await request(signed)).body.account.id,accountId)
    assert.equal((await request(makeToken(now,{emailVerified:false}))).status,401)
    assert.equal((await request(makeToken(now,{banned:true}))).status,401)
    const identities=await pool.query('SELECT count(*)::int n FROM xa_account_identities WHERE user_id=$1',[accountId])
    assert.equal(identities.rows[0].n,1)

    // Synthetic signed-webhook candidate fixtures only: not an actual Stripe event.
    const reportId='b'.repeat(64), grantId='xag_syntheticprivate1234', scope='analysis:markets'
    const when=n=>new Date(n),expires=when(now+600000)
    await pool.query(
      "INSERT INTO xa_xorus_private_reports(report_id,offer,scope,status,commercial_usage_approved,source_ts,generated_at,expires_at) VALUES($1,'pulse',$2,'ready',true,$3,$4,$5)",
      [reportId,scope,when(now-30000),when(now-15000),expires])
    await pool.query(
      "INSERT INTO xa_xorus_grants(grant_id,subject_kind,subject,account_id,offer,scope,status,issued_at,expires_at,ledger_checked_at,evidence_kind,evidence_verified,evidence_checked_at,issuer_reference,billing_status,settlement,quota_limit,quota_reset_at) VALUES($1,'email',$2,$2,'pulse',$3,'active',$4,$5,$6,'verified_psp_subscription',true,$6,$7,'active','verified',1,$5)",
      [grantId,accountId,scope,when(now-60000),expires,when(now),'evt_syntheticprivate1234'])
    const repo=createXorusPrivateRepository(pool)
    const actor={kind:'email',subject:accountId,verified:true,proof:'verified_email_session'}
    const authorize=()=>authorizeXorusReportRead({
      enabled:true,commercialUsageRightsVerified:true,actor,offer:'pulse',
      reportId,lookupGrant:repo.lookupGrant,lookupReport:repo.lookupReport,
      reserveQuota:repo.reserveQuota,now,
    })
    assert.equal((await authorize()).allowed,true)
    assert.equal((await authorize()).allowed,false,'Second request has no remaining quota')
    await pool.query("UPDATE xa_xorus_grants SET quota_used=0,status='refunded',refunded_at=NOW() WHERE grant_id=$1",[grantId])
    assert.equal((await authorize()).allowed,false,'Refund always revokes access')
    const reservations=await pool.query('SELECT count(*)::int n FROM xa_xorus_read_reservations WHERE grant_id=$1',[grantId])
    assert.equal(reservations.rows[0].n,1)
  }finally{await pool.end()}
})
