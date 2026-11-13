/** DB-backed mailbox reservation; SQL migration is not auto-run. */
import {randomUUID} from 'node:crypto'
export function createMailboxRepository(pool) {
  if(typeof pool?.connect!=='function') throw new TypeError('pool_required')
  return Object.freeze({
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
