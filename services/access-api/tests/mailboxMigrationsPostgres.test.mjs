/**
 * Account-bound mailbox schema proof on explicitly disposable local PG only.
 * NEVER runs on Render/Neon/OVH. Does not send, receive or provision emails.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createMailboxRepository} from '../src/mailboxRepository.mjs'
const url=process.env.TEST_XA_MAILBOX_DATABASE_URL||''
const permitted=(()=>{
  try{
    const u=new URL(url)
    return process.env.ALLOW_EPHEMERAL_XA_MAILBOX_PG_TEST==='1'&&
      u.protocol==='postgres:'&&['127.0.0.1','localhost'].includes(u.hostname)&&
      u.pathname==='/xartists_mailbox_probe'&&!u.search&&!u.hash
  }catch{return false}
})()
const A='11111111-1111-4111-8111-111111111111'
const B='22222222-2222-4222-8222-222222222222'
const C='33333333-3333-4333-8333-333333333333'
const expectSql=async(promise,code)=>assert.rejects(promise,e=>e?.code===code,'expected '+code)
test('mailbox allocation has atomic single-owner, restricted names and tenant-safe reads', {
  skip:!permitted&&'explicit localhost-only xartists_mailbox_probe required',
},async()=>{
  const pg=(await import('pg')).default
  const pool=new pg.Pool({connectionString:url,ssl:false,max:4})
  try{
    const users=readFileSync(new URL('../migrations/20261109_xa_accounts_v1.sql',import.meta.url),'utf8')
    const mail=readFileSync(new URL('../migrations/20261113_xa_mailboxes_v1.sql',import.meta.url),'utf8')
    await pool.query(users)
    await pool.query(mail)
    await pool.query(mail) // rerunnable on a fresh, disposable CI DB
    await pool.query('INSERT INTO xa_user_accounts(id) VALUES($1),($2)',[A,B])
    const repo=createMailboxRepository(pool)
    assert.equal(await repo.readOwn({userId:A}),null)
    assert.equal(await repo.readOwn({userId:B}),null)
    await assert.rejects(repo.readOwn({userId:'wrong'}),/invalid_account_id/)
    const result=await Promise.all([
      repo.reserve({userId:A,address:'alice@xartists.art'}),
      repo.reserve({userId:A,address:'alice@xartists.art'}),
    ])
    assert.deepEqual(result.map(v=>v.state).sort(),['exists','reserved'])
    const row=await pool.query('SELECT id,user_id,address,status FROM xa_mailboxes WHERE user_id=$1',[A])
    assert.equal(row.rows.length,1)
    assert.equal(row.rows[0].address,'alice@xartists.art')
    assert.equal(row.rows[0].status,'reserved')
    assert.equal(await repo.readOwn({userId:B}),null)
    assert.deepEqual(await repo.readOwn({userId:A}),{
      address:'alice@xartists.art',status:'reserved',
      receiptVerified:false,outboundVerified:false,inboxAccessVerified:false,
    })
    const wrong=await repo.reserve({userId:B,address:'alice@xartists.art'})
    assert.equal(wrong.state,'taken')
    assert.equal((await repo.reserve({userId:C,address:'nobody@xartists.art'})).state,'unavailable')
    for(const email of ['hello@xartists.art','admin@xartists.art','a..b@xartists.art','ab@xartists.art','BOB@xartists.art']){
      await expectSql(pool.query(
        "INSERT INTO xa_mailboxes(id,user_id,address,status) VALUES(gen_random_uuid(),$1,$2,'reserved')",
        [B,email],
      ),'23514')
    }
    const bob=await repo.reserve({userId:B,address:'bob.art@xartists.art'})
    assert.equal(bob.state,'reserved')
    assert.equal((await repo.readOwn({userId:B})).address,'bob.art@xartists.art')
    await expectSql(pool.query(
      "INSERT INTO xa_mailboxes(id,user_id,address,status) VALUES(gen_random_uuid(),$1,$2,'reserved')",
      [B,'another@xartists.art'],
    ),'23505')
    await expectSql(pool.query(
      "UPDATE xa_mailboxes SET status='provisioned' WHERE user_id=$1",[A]),'23514')
    await repo.markProvisioned({reservationId:result.find(v=>v.state==='reserved').id,providerId:'provider-a'})
    assert.deepEqual(await repo.readOwn({userId:A}),{
      address:'alice@xartists.art',status:'provisioned',
      receiptVerified:false,outboundVerified:false,inboxAccessVerified:false,
    })
    await assert.rejects(repo.markProvisioned({reservationId:row.rows[0].id,providerId:'again'}),/mailbox_state_conflict/)
    await expectSql(pool.query(
      "UPDATE xa_mailboxes SET provider_id='provider-a',status='provisioned' WHERE user_id=$1",[B]),'23505')
    await repo.markNeedsReconciliation({reservationId:bob.id})
    assert.equal((await repo.readOwn({userId:B})).status,'needs_reconciliation')
    assert.equal((await repo.readOwn({userId:A})).status,'provisioned')
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM xa_mailboxes')).rows[0].n,2)
  }finally{await pool.end()}
})
