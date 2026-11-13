/** Disposable localhost-only PostgreSQL and synthetic signed Stripe events.
 * NO Stripe API, account signup, real customer or live finance interaction.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createHmac} from 'node:crypto'
import {createStripeBillingSandboxReconciler} from '../src/stripeBillingReconcile.mjs'

const db=process.env.TEST_XA_BILLING_DATABASE_URL||''
const permitted=(()=>{
  try{
    const u=new URL(db)
    return process.env.ALLOW_EPHEMERAL_XA_BILLING_PG_TEST==='1'&&
      u.protocol==='postgres:'&&['localhost','127.0.0.1'].includes(u.hostname)&&
      u.pathname==='/xartists_billing_probe'&&!u.search&&!u.hash
  }catch{return false}
})()
const clock=Date.parse('2026-11-13T14:45:00Z')
const secret='whsec_billingfixture000001'
const A='f1111111-1111-4111-8111-111111111111'
const B='f2222222-2222-4222-8222-222222222222'
const customer='cus_testcustomer01',sub='sub_testmonthly01',price='price_testmonthly01'
const monthStart=Math.floor(clock/1000)-3600
const monthEnd=monthStart+30*86400
const invoice={object:'invoice',livemode:false,id:'in_testmonthly01',
  customer,subscription:sub,currency:'eur',status:'paid',paid:true,
  amount_paid:379,billing_reason:'subscription_cycle',
  lines:{has_more:false,data:[{price:{id:price},period:{start:monthStart,end:monthEnd}}]},
}
const subObject={object:'subscription',id:sub,customer,livemode:false,status:'active'}
const signed=(id,type,obj,created=Math.floor(clock/1000))=>{
  const raw=Buffer.from(JSON.stringify({id,object:'event',livemode:false,created,
    type,data:{object:obj}}))
  const stamp=Math.floor(clock/1000)
  return {raw,signature:'t='+stamp+',v1='+
    createHmac('sha256',secret).update(String(stamp)+'.').update(raw).digest('hex'),
    webhookSecret:secret}
}
const pay=(id='evt_paidfirst001',created)=>signed(id,'invoice.paid',invoice,created)
const read=async(pool)=>({
  subscription:(await pool.query(
    'SELECT status,refunded,canceled_at,period_end FROM xa_fiat_subscriptions WHERE provider_subscription_id=$1',[sub]
  )).rows[0],
  events:Number((await pool.query('SELECT count(*)::int n FROM xa_subscription_events')).rows[0].n),
  receipts:Number((await pool.query('SELECT count(*)::int n FROM xa_stripe_billing_receipts')).rows[0].n),
})
const safety=x=>{
  assert.equal(x.mode,'test')
  assert.equal(x.grant_access,false)
  assert.equal(x.checkout_enabled,false)
  assert.equal(x.delivery_verified,false)
  assert.equal(x.execution_authorized,false)
}

test('Signed sandbox recurring invoices reconcile atomically; late events and cancel cannot reopen', {
  skip:!permitted&&'Requires disposable localhost PostgreSQL xartists_billing_probe with opt-in',
},async()=>{
  const pg=(await import('pg')).default
  const pool=new pg.Pool({connectionString:db,ssl:false,max:7})
  const exec=sql=>pool.query(readFileSync(new URL(sql,import.meta.url),'utf8'))
  try{
    await exec('../migrations/20261109_xa_accounts_v1.sql')
    await exec('../migrations/20261113_xa_stripe_billing_reconcile_sandbox.sql')
    await exec('../migrations/20261113_xa_stripe_billing_reconcile_sandbox.sql')
    await pool.query('INSERT INTO xa_user_accounts(id) VALUES($1),($2)',[A,B])
    await pool.query(`INSERT INTO xa_fiat_subscriptions
      (id,user_id,provider,provider_subscription_id,status,period_end,provider_verified_at)
      VALUES(gen_random_uuid(),$1,'stripe',$2,'incomplete',NOW()+INTERVAL '1 month',NOW())`,[A,sub])
    await pool.query(`INSERT INTO xa_stripe_billing_bindings
      (subscription_id,account_id,customer_id,price_id,plan,amount_cents)
      VALUES($1,$2,$3,$4,'fiat_379',379)`,[sub,A,customer,price])
    const disabled=createStripeBillingSandboxReconciler({pool,clock:()=>clock})
    safety(await disabled.reconcile(pay()))
    assert.equal((await read(pool)).events,0,'feature disabled must never write')

    const billing=createStripeBillingSandboxReconciler({pool,clock:()=>clock,enabled:true})
    const corrupted=pay()
    corrupted.signature=corrupted.signature.replace(/.$/,'0')
    const invalid=await billing.reconcile(corrupted);safety(invalid)
    assert.equal(invalid.ok,false)
    assert.equal((await read(pool)).events,0)

    const unauthenticated=await billing.reconcile(pay('evt_notbound001'))
    safety(unauthenticated)
    assert.equal(unauthenticated.ok,true,'same trusted binding but signed event is permitted')
    assert.equal(unauthenticated.outcome,'paid_test_ledger')
    assert.equal((await read(pool)).subscription.status,'active')
    assert.equal((await read(pool)).receipts,1)
    assert.equal((await read(pool)).events,1)

    const duplicate=await billing.reconcile(pay('evt_notbound001'))
    assert.equal(duplicate.ok,true);assert.equal(duplicate.duplicate,true)
    safety(duplicate)
    assert.equal((await read(pool)).receipts,1)

    const mismatched=await billing.reconcile(signed(
      'evt_wrongprice001','invoice.paid',
      {...invoice,lines:{has_more:false,data:[{price:{id:'price_wrong001'},
        period:{start:monthStart,end:monthEnd}}]}},
    ))
    safety(mismatched);assert.equal(mismatched.ok,false)
    assert.equal((await read(pool)).receipts,1)

    const failed=await billing.reconcile(signed(
      'evt_failedinvoice001','invoice.payment_failed',
      {...invoice,paid:false,status:'open',amount_paid:0},
      Math.floor(clock/1000)+1,
    ))
    safety(failed);assert.equal(failed.outcome,'payment_failed')
    assert.equal((await read(pool)).subscription.status,'past_due')

    const late=await billing.reconcile(pay('evt_paidlate001',Math.floor(clock/1000)-1))
    safety(late);assert.equal(late.outcome,'late_ignored')
    assert.equal((await read(pool)).subscription.status,'past_due')

    const staleCancel=await billing.reconcile(signed(
      'evt_canceled0001','customer.subscription.deleted',
      {...subObject,status:'canceled'},Math.floor(clock/1000)-10,
    ))
    safety(staleCancel);assert.equal(staleCancel.outcome,'canceled')
    const canceled=(await read(pool)).subscription
    assert.equal(canceled.status,'canceled')
    assert.ok(canceled.canceled_at instanceof Date)

    const terminal=await billing.reconcile(pay('evt_paidaftercancel01',
      Math.floor(clock/1000)+2))
    safety(terminal);assert.equal(terminal.outcome,'terminal_ignored')
    assert.equal((await read(pool)).subscription.status,'canceled')
    const expected=(await read(pool))
    assert.equal(expected.events,5)
    assert.equal(expected.receipts,5)
  }finally{await pool.end()}
})

test('Real PostgreSQL FK and price checks prevent arbitrary subscription or unsafe pricing', {
  skip:!permitted&&'Requires disposable localhost PostgreSQL xartists_billing_probe with opt-in',
},async()=>{
  const pg=(await import('pg')).default
  const pool=new pg.Pool({connectionString:db,ssl:false,max:3})
  try{
    const invalid=()=>pool.query(`INSERT INTO xa_stripe_billing_bindings
      (subscription_id,account_id,customer_id,price_id,plan,amount_cents)
      VALUES($1,$2,$3,$4,'fiat_979',379)`,[
        'sub_invalidprice01',B,'cus_testcustomer99','price_wrongtest99',
      ])
    await assert.rejects(invalid(),err=>err.code==='23514')
    const missing=()=>pool.query(`INSERT INTO xa_stripe_billing_bindings
      (subscription_id,account_id,customer_id,price_id,plan,amount_cents)
      VALUES($1,$2,$3,$4,'fiat_379',379)`,[
        'sub_unknown5555',A,'cus_testcustomer01','price_testmonthly01',
      ])
    await assert.rejects(missing(),err=>err.code==='23503')
  }finally{await pool.end()}
})
