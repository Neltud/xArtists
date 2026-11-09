/**
 * xArtists walletless/account migrations — disposable LOCAL PostgreSQL ONLY.
 * No Neon/Render writes, real OIDC, wallets, payments or mint.
 */
import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const url=process.env.TEST_XA_ACCOUNT_DATABASE_URL||''
const permitted=(()=>{
  try {
    const u=new URL(url)
    return process.env.ALLOW_EPHEMERAL_XA_ACCOUNT_PG_TEST==='1' &&
      u.protocol==='postgres:' && ['127.0.0.1','localhost'].includes(u.hostname) &&
      u.pathname==='/xartists_account_probe' && !u.search && !u.hash
  } catch {return false}
})()
const U={
  a:'11111111-1111-4111-8111-111111111111',
  b:'22222222-2222-4222-8222-222222222222',
  wallet:'33333333-3333-4333-8333-333333333333',
  identity:'44444444-4444-4444-8444-444444444444',
  subscription:'55555555-5555-4555-8555-555555555555',
  challenge:'66666666-6666-4666-8666-666666666666',
}
const WALLET='erd1'+'q'.repeat(58)
const expectCode=async(promise,code)=>
  assert.rejects(promise,e=>e?.code===code,'expected PostgreSQL code '+code)

test('walletless subscriptions, wallet ownership and event replay stay isolated on disposable PostgreSQL', {
  skip:!permitted&&'Requires explicit opt-in + disposable localhost xartists_account_probe',
},async()=>{
  const pg=(await import('pg')).default
  const pool=new pg.Pool({connectionString:url,ssl:false,max:3})
  try {
    const sqlOne=readFileSync(new URL('../migrations/20261109_xa_accounts_v1.sql',import.meta.url),'utf8')
    const sqlTwo=readFileSync(new URL('../migrations/20261109_xa_wallet_link_challenges.sql',import.meta.url),'utf8')
    await pool.query(sqlOne)
    await pool.query(sqlTwo)
    // Non-destructive re-application is possible on a disposable database.
    await pool.query(sqlOne)
    await pool.query(sqlTwo)

    await pool.query('INSERT INTO xa_user_accounts(id) VALUES($1),($2)',[U.a,U.b])
    await pool.query(
      'INSERT INTO xa_account_identities(id,user_id,provider,provider_subject,verified_at) VALUES($1,$2,$3,$4,NOW())',
      [U.identity,U.a,'google','opaque-verified-subject-fixture'],
    )
    await expectCode(pool.query(
      'INSERT INTO xa_account_identities(id,user_id,provider,provider_subject,verified_at) VALUES(gen_random_uuid(),$1,$2,$3,NOW())',
      [U.b,'google','opaque-verified-subject-fixture'],
    ),'23505')

    const before=await pool.query('SELECT count(*)::int AS n FROM xa_account_wallets WHERE user_id=$1',[U.a])
    assert.equal(before.rows[0].n,0)
    await pool.query(
      "INSERT INTO xa_fiat_subscriptions(id,user_id,provider,provider_subscription_id,status,period_end,provider_verified_at) VALUES($1,$2,$3,$4,$5,NOW()+INTERVAL '1 month',NOW())",
      [U.subscription,U.a,'stripe','sub_fixture_only','active'],
    )
    const sub=await pool.query('SELECT user_id,status,refunded FROM xa_fiat_subscriptions WHERE id=$1',[U.subscription])
    assert.equal(sub.rows[0].user_id,U.a)
    assert.equal(sub.rows[0].status,'active')
    assert.equal(sub.rows[0].refunded,false)
    await expectCode(pool.query(
      'INSERT INTO xa_fiat_subscriptions(id,user_id,provider,provider_subscription_id,status,period_end,provider_verified_at) VALUES(gen_random_uuid(),$1,$2,$3,$4,NOW(),NOW())',
      [U.b,'stripe','sub_fixture_only','active'],
    ),'23505')
    await expectCode(pool.query(
      'INSERT INTO xa_fiat_subscriptions(id,user_id,provider,provider_subscription_id,status,period_end,provider_verified_at) VALUES(gen_random_uuid(),$1,$2,$3,$4,NOW(),NOW())',
      [U.b,'stripe','sub_wrong_status','mint_confirmed'],
    ),'23514')
    const forbidden=await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='xa_fiat_subscriptions' AND column_name IN ('nft_identifier','chain_tx_hash','mint_status','nft_owner')",
    )
    assert.equal(forbidden.rows.length,0,'Subscription schema is not an NFT ledger')

    await pool.query(
      'INSERT INTO xa_account_wallets(id,user_id,network,address,verified_at) VALUES($1,$2,$3,$4,NOW())',
      [U.wallet,U.a,'multiversx',WALLET],
    )
    await expectCode(pool.query(
      'INSERT INTO xa_account_wallets(id,user_id,network,address,verified_at) VALUES(gen_random_uuid(),$1,$2,$3,NOW())',
      [U.b,'multiversx',WALLET],
    ),'23505')

    await pool.query(
      "INSERT INTO xa_wallet_link_challenges(id,user_id,nonce_hash,domain,address,issued_at,expires_at) VALUES($1,$2,$3,$4,$5,NOW(),NOW()+INTERVAL '5 minutes')",
      [U.challenge,U.a,'a'.repeat(64),'xartists.art',WALLET],
    )
    await expectCode(pool.query(
      "INSERT INTO xa_wallet_link_challenges(id,user_id,nonce_hash,domain,address,issued_at,expires_at) VALUES(gen_random_uuid(),$1,$2,$3,$4,NOW(),NOW()+INTERVAL '5 minutes')",
      [U.b,'a'.repeat(64),'xartists.art',WALLET],
    ),'23505')
    await expectCode(pool.query(
      "INSERT INTO xa_wallet_link_challenges(id,user_id,nonce_hash,domain,address,issued_at,expires_at) VALUES(gen_random_uuid(),$1,$2,$3,$4,NOW(),NOW()-INTERVAL '1 minute')",
      [U.a,'b'.repeat(64),'xartists.art',WALLET],
    ),'23514')

    await pool.query(
      'INSERT INTO xa_subscription_events(provider,provider_event_id,provider_subscription_id) VALUES($1,$2,$3)',
      ['stripe','evt_fixture_one','sub_fixture_only'],
    )
    const client=await pool.connect()
    try{
      await client.query('BEGIN')
      await expectCode(client.query(
        'INSERT INTO xa_subscription_events(provider,provider_event_id,provider_subscription_id) VALUES($1,$2,$3)',
        ['stripe','evt_fixture_one','sub_fixture_only'],
      ),'23505')
      await client.query('ROLLBACK')
    }finally{client.release()}
    const still=await pool.query('SELECT status FROM xa_fiat_subscriptions WHERE id=$1',[U.subscription])
    assert.equal(still.rows[0].status,'active')
    const counts=await pool.query(
      'SELECT (SELECT count(*)::int FROM xa_user_accounts) AS users, (SELECT count(*)::int FROM xa_fiat_subscriptions) AS subscriptions, (SELECT count(*)::int FROM xa_subscription_events) AS events',
    )
    assert.deepEqual(counts.rows[0],{users:2,subscriptions:1,events:1})
  } finally {await pool.end()}
})
