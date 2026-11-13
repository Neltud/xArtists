/** DB-backed mailbox reservation; SQL migration is not auto-run. */
import {randomUUID} from 'node:crypto'
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export function createMailboxRepository(pool) {
  if(typeof pool?.connect!=='function') throw new TypeError('pool_required')
  return Object.freeze({
    async readOwn({userId}) {
      if(typeof userId!=='string'||!UUID.test(userId))throw new TypeError('invalid_account_id')
      const result=await pool.query(
        `SELECT m.address,m.status FROM xa_mailboxes m
         JOIN xa_user_accounts a ON a.id=m.user_id
         WHERE m.user_id=$1 AND a.disabled_at IS NULL LIMIT 1`,[userId],
      )
      const row=result.rows[0]
      if(!row)return null
      // A database record is not proof the mailbox accepts or sends SMTP.
      return Object.freeze({address:row.address,status:row.status,
        receiptVerified:false,outboundVerified:false,inboxAccessVerified:false})
    },
    async reserve({userId,address}) {
      const c=await pool.connect()
      try {
        await c.query('BEGIN')
        await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[userId])
        const owner=await c.query('SELECT id FROM xa_user_accounts WHERE id=$1 AND disabled_at IS NULL FOR UPDATE',[userId])
        if(owner.rows.length!==1) {await c.query('ROLLBACK');return {state:'unavailable'}}
        const prior=await c.query('SELECT id FROM xa_mailboxes WHERE user_id=$1',[userId])
        if(prior.rows.length) {await c.query('ROLLBACK');return {state:'exists'}}
        const id=randomUUID()
        const inserted=await c.query(
          `INSERT INTO xa_mailboxes(id,user_id,address,status)
           VALUES($1,$2,$3,'reserved') ON CONFLICT (address) DO NOTHING RETURNING id`,
          [id,userId,address],
        )
        if(!inserted.rows.length){await c.query('ROLLBACK');return {state:'taken'}}
        await c.query('COMMIT')
        return {state:'reserved',id}
      } catch (e) {
        try {await c.query('ROLLBACK')} catch {}
        throw e
      } finally {c.release()}
    },
    async markProvisioned({reservationId,providerId}) {
      const r=await pool.query(
        `UPDATE xa_mailboxes SET status='provisioned',provider_id=$2,updated_at=now()
         WHERE id=$1 AND status='reserved' RETURNING id`,[reservationId,providerId],
      )
      if(r.rows.length!==1) throw new Error('mailbox_state_conflict')
    },
    async markNeedsReconciliation({reservationId}) {
      // If markProvisioned succeeded but a caller subsequently errored, do not demote.
      await pool.query(
        `UPDATE xa_mailboxes SET status='needs_reconciliation',updated_at=now()
         WHERE id=$1 AND status='reserved'`,[reservationId],
      )
    },
  })
}
