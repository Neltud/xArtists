/**
 * TEST-ONLY Stripe Billing -> xArtists account ledger reconciliation.
 *
 * Never creates Checkout sessions, grants private xOrus access, sends emails,
 * mints, trades or touches live Stripe. This is NOT an HTTP route. No operator
 * or browser may supply a customer/account/price binding in the event body.
 * A signed Stripe test event is necessary, NOT sufficient, for entitlement.
 */
import {createHash} from 'node:crypto'
import {inspectStripeBillingSandboxEvent} from './stripeBillingCandidate.mjs'
import {verifyStripeEvent} from './stripeCheckout.mjs'

const SUB=/^sub_[A-Za-z0-9]{6,128}$/
const PI=/^pi_[A-Za-z0-9]{6,128}$/
const INVOICE=/^in_[A-Za-z0-9]{6,128}$/
const INCIDENT_TYPES=new Set(['charge.refunded','charge.dispute.created'])
const TYPES=new Set([
  'invoice.paid','invoice.payment_failed',
  'customer.subscription.updated','customer.subscription.deleted',
])
const fail=reason=>Object.freeze({
  ok:false,reason,mode:'test',grant_access:false,checkout_enabled:false,
  delivery_verified:false,execution_authorized:false,
})
const done=(outcome,duplicate=false)=>Object.freeze({
  ok:true,mode:'test',outcome,duplicate,receipt_recorded:true,
  grant_access:false,checkout_enabled:false,delivery_verified:false,
  execution_authorized:false,
})

const subscriptionId=event=>{
  const object=event?.data?.object
  if(!object||typeof object!=='object'||Array.isArray(object))return null
  if(event.type.startsWith('customer.subscription.'))
    return object.object==='subscription'?object.id:null
  if(object.object!=='invoice')return null
  const direct=object.subscription
  const nested=object.parent?.subscription_details?.subscription
  if(direct!=null&&nested!=null&&direct!==nested)return null
  return direct??nested??null
}
function invoicePeriodEnd(invoice,now){
  const lines=invoice.lines
  if(!Array.isArray(lines?.data)||lines.data.length!==1||lines.has_more===true)return null
  const period=lines.data[0]?.period
  const start=period?.start,end=period?.end
  const nowSeconds=Math.floor(now/1000)
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||
     start<=0||end<=start||end<=nowSeconds||
     end>nowSeconds+366*86400)return null
  return new Date(end*1000)
}

/**
 * All writes are one PG transaction on an explicitly bound, pre-provisioned
 * disposable test DB. Existing xa_fiat_subscriptions rows are created only
 * by an approved account+Checkout onboarding component, not this function.
 * No grant, report or NFT rows are ever written.
 */
export function createStripeBillingSandboxReconciler({
  pool,clock=Date.now,enabled=false,
}={}){
  if(typeof pool?.connect!=='function'||typeof clock!=='function')
    throw new TypeError('postgres_pool_required')
  return Object.freeze({
    async reconcile({raw,signature,webhookSecret}={}){
      if(!enabled)return fail('sandbox_disabled')
      const now=clock()
      if(!Number.isSafeInteger(now)||now<=0)return fail('clock_unavailable')
      let event
      try{event=verifyStripeEvent(raw,signature,webhookSecret,now)}
      catch{return fail('signature_not_verified')}
      const incident=INCIDENT_TYPES.has(event.type)
      if(!TYPES.has(event.type)&&!incident)return fail('event_not_supported')
      let sub=incident?null:subscriptionId(event)
      const incidentObject=incident?event.data?.object:null
      const paymentIntent=incidentObject?.payment_intent
      if(incident&&(!PI.test(paymentIntent??'')||
         typeof paymentIntent!=='string'||
         incidentObject.livemode!==false))return fail('incident_payment_not_linked')
      const created=event.created
      if((!incident&&(typeof sub!=='string'||!SUB.test(sub)))||
         !Number.isSafeInteger(created)||created<=0||
         created>Math.floor(now/1000)+300||
         created<Math.floor(now/1000)-90*86400)return fail('event_not_bound')
      const rawDigest=createHash('sha256').update(raw).digest('hex')

      let client,transaction=false
      try{
        client=await pool.connect()
        await client.query('BEGIN');transaction=true
        // Hard safety boundary: this candidate is only for an explicitly
        // disposable database. No production or remote branch may be written,
        // even if a caller accidentally passes enabled:true and valid secrets.
        const identity=await client.query('SELECT current_database() AS database_name')
        if(identity.rows.length!==1||identity.rows[0].database_name!=='xartists_billing_probe'){
          await client.query('ROLLBACK');transaction=false
          return fail('disposable_database_required')
        }
        // Refunds/disputes have no subscription id. Lookup may use only a
        // previously paid invoice's immutable PI mapping, never Stripe metadata
        // or a user-supplied account id.
        if(incident){
          const link=await client.query(
            'SELECT subscription_id FROM xa_stripe_billing_payments WHERE payment_intent_id=$1 FOR UPDATE',
            [paymentIntent])
          if(link.rows.length!==1){
            await client.query('ROLLBACK');transaction=false
            return fail('incident_payment_not_linked')
          }
          sub=link.rows[0].subscription_id
        }
        // Row locks serialize concurrent webhook deliveries for this subscription.
        const rows=await client.query(`SELECT b.*,s.status AS subscription_status,
          s.refunded,s.canceled_at,s.user_id AS subscription_user_id,a.disabled_at
          FROM xa_stripe_billing_bindings b
          JOIN xa_fiat_subscriptions s
            ON s.provider=b.provider AND s.provider_subscription_id=b.subscription_id
          JOIN xa_user_accounts a ON a.id=s.user_id
          WHERE b.subscription_id=$1 AND b.provider='stripe'
          FOR UPDATE OF b,s`,[sub])
        const binding=rows.rows[0]
        if(!binding||binding.stripe_mode!=='test'||binding.disabled_at!==null||
           binding.subscription_user_id!==binding.account_id){
          await client.query('ROLLBACK');transaction=false
          return fail('trusted_test_binding_missing')
        }
        const sourceBinding={
          customer_id:binding.customer_id,subscription_id:binding.subscription_id,
          price_id:binding.price_id,plan:binding.plan,
          amount_cents:binding.amount_cents,currency:binding.currency,
          interval:binding.interval_unit,
        }
        let candidate=null
        if(incident){
          // Exact test-mode amount/customer/PI required. A partial refund or
          // dispute is held permanently (fail-closed); it does not prove that
          // all funds were returned, only that premium access is unsafe.
          const validAmount=Number.isSafeInteger(incidentObject.amount)&&
            incidentObject.amount>0&&incidentObject.amount===binding.amount_cents
          const validCharge=event.type==='charge.refunded'&&
            incidentObject.object==='charge'&&
            incidentObject.customer===binding.customer_id&&
            incidentObject.currency==='eur'&&validAmount&&
            Number.isSafeInteger(incidentObject.amount_refunded)&&
            incidentObject.amount_refunded>0&&
            incidentObject.amount_refunded<=incidentObject.amount
          const validDispute=event.type==='charge.dispute.created'&&
            incidentObject.object==='dispute'&&
            incidentObject.currency==='eur'&&
            Number.isSafeInteger(incidentObject.amount)&&
            incidentObject.amount>0&&
            incidentObject.amount<=binding.amount_cents
          if(!validCharge&&!validDispute){
            await client.query('ROLLBACK');transaction=false
            return fail('incident_binding_mismatch')
          }
        }else{
          candidate=inspectStripeBillingSandboxEvent({
            raw,signature,webhookSecret,binding:sourceBinding,now,
          })
          if(candidate.candidate_verified!==true||
             candidate.stripe_subscription_id!==sub){
            await client.query('ROLLBACK');transaction=false
            return fail('signed_invoice_not_reconciled')
          }
        }

        const previous=await client.query(
          'SELECT subscription_id,body_sha256,outcome FROM xa_stripe_billing_receipts WHERE event_id=$1 FOR UPDATE',
          [event.id])
        const previousIncident=await client.query(
          'SELECT subscription_id,body_sha256,outcome FROM xa_stripe_billing_incident_receipts WHERE event_id=$1 FOR UPDATE',
          [event.id])
        if(previous.rows.length||previousIncident.rows.length){
          await client.query('ROLLBACK');transaction=false
          const matched=incident?previousIncident.rows[0]:previous.rows[0]
          if(!matched||previous.rows.length&&previousIncident.rows.length)
            return fail('conflicting_replayed_event')
          return matched.subscription_id===sub&&matched.body_sha256===rawDigest
            ?done(matched.outcome,true):fail('conflicting_replayed_event')
        }
        // An event id claimed by any earlier Stripe integration is never reused.
        const legacy=await client.query(
          "SELECT provider_subscription_id FROM xa_subscription_events WHERE provider='stripe' AND provider_event_id=$1",
          [event.id])
        if(legacy.rows.length){
          await client.query('ROLLBACK');transaction=false
          return fail('unreconciled_legacy_event')
        }

        const terminal=binding.terminal===true||binding.refunded===true
        const late=created<Number(binding.last_event_created)
        const canceled=event.type==='customer.subscription.deleted'||
          (event.type==='customer.subscription.updated'&&
           ['canceled','incomplete_expired'].includes(event.data.object.status))
        let outcome='status_review',nextStatus=null,periodEnd=null
        let markRefund=false
        if(incident&&terminal){
          outcome='terminal_ignored'
        }else if(incident){
          markRefund=event.type==='charge.refunded'
          outcome=markRefund?'refund_revoked':'dispute_held'
          nextStatus=markRefund?'canceled':'unpaid'
        }else if(canceled){ // A signed cancellation wins even if delivered late.
          outcome='canceled';nextStatus='canceled'
        }else if(terminal){
          outcome='terminal_ignored'
        }else if(late){
          outcome='late_ignored'
        }else if(candidate.kind==='paid_invoice_reconcile'){
          periodEnd=invoicePeriodEnd(event.data.object,now)
          if(!periodEnd){
            await client.query('ROLLBACK');transaction=false
            return fail('invoice_service_period_unverified')
          }
          const inv=event.data.object
          if(typeof inv.id!=='string'||!INVOICE.test(inv.id)||
             typeof inv.payment_intent!=='string'||!PI.test(inv.payment_intent)){
            await client.query('ROLLBACK');transaction=false
            return fail('paid_invoice_payment_intent_unbound')
          }
          // Uniqueness binds a single real test payment to exactly one invoice
          // and one trusted subscription; no refund can switch account.
          await client.query(`INSERT INTO xa_stripe_billing_payments
            (payment_intent_id,invoice_id,subscription_id,customer_id,amount_cents)
            VALUES ($1,$2,$3,$4,$5)`,
            [inv.payment_intent,inv.id,sub,binding.customer_id,binding.amount_cents])
          outcome='paid_test_ledger';nextStatus='active'
        }else if(candidate.kind==='failed_invoice_reconcile'){
          outcome='payment_failed';nextStatus='past_due'
        }else if(candidate.kind==='subscription_status_reconcile'){
          const state=event.data.object.status
          // An 'active' subscription update is NOT proof of a paid invoice.
          nextStatus=state==='past_due'?'past_due':
            ['unpaid','paused'].includes(state)?'unpaid':
            state==='incomplete'?'incomplete':null
        }
        if(incident){
          await client.query(`INSERT INTO xa_stripe_billing_incident_receipts
            (event_id,subscription_id,payment_intent_id,body_sha256,event_type,event_created,outcome)
            VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [event.id,sub,paymentIntent,rawDigest,event.type,created,outcome])
        }else{
          await client.query(`INSERT INTO xa_stripe_billing_receipts
            (event_id,subscription_id,body_sha256,event_type,event_created,outcome)
            VALUES ($1,$2,$3,$4,$5,$6)`,
            [event.id,sub,rawDigest,event.type,created,outcome])
        }
        await client.query(`INSERT INTO xa_subscription_events
          (provider,provider_event_id,provider_subscription_id)
          VALUES('stripe',$1,$2)`,[event.id,sub])
        if(nextStatus!==null){
          await client.query(`UPDATE xa_fiat_subscriptions SET
            status=$2,period_end=COALESCE($3,period_end),
            provider_verified_at=$4,
            canceled_at=CASE WHEN $2='canceled' THEN $4 ELSE canceled_at END,
            refunded=CASE WHEN $6 THEN TRUE ELSE refunded END,
            updated_at=$4
            WHERE provider='stripe' AND provider_subscription_id=$1 AND user_id=$5`,
            [sub,nextStatus,periodEnd,new Date(now),binding.account_id,markRefund])
        }
        await client.query(`UPDATE xa_stripe_billing_bindings SET
          last_event_created=GREATEST(last_event_created,$2),
          terminal=terminal OR $3
          WHERE subscription_id=$1`,[sub,created,canceled||incident])
        await client.query('COMMIT');transaction=false
        return done(outcome)
      }catch{
        if(transaction)try{await client.query('ROLLBACK')}catch{}
        return fail('billing_ledger_unavailable')
      }finally{if(client)client.release()}
    },
  })
}
