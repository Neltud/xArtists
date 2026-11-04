/** Isolated sandbox ledger. Explicit migration required; never touches paybox_orders/mint_jobs. */
export function createStripePgStore(pool) {
  return {
    async reserve(order) {
      await pool.query(`INSERT INTO stripe_sandbox_orders
        (order_id,buyer,pack_id,amount_cents,created_ms) VALUES ($1,$2,$3,$4,$5)
        ON CONFLICT (order_id) DO NOTHING`,
      [order.order_id, order.buyer, order.pack_id, order.amount_cents, order.created_ms])
      const result = await pool.query('SELECT * FROM stripe_sandbox_orders WHERE order_id=$1', [order.order_id])
      return { ...result.rows[0], created_ms: Number(result.rows[0].created_ms) }
    },
    async attach(orderId, sessionId, sessionUrl) {
      const r = await pool.query(`UPDATE stripe_sandbox_orders SET session_id=$2,session_url=$3
        WHERE order_id=$1 AND (session_id IS NULL OR session_id=$2) RETURNING order_id`, [orderId, sessionId, sessionUrl])
      if (!r.rowCount) throw new Error('stripe_session_conflict')
    },
    async recordPaid(event, session, validate) {
      const client = await pool.connect()
      try {
        await client.query('BEGIN')
        const r = await client.query('SELECT * FROM stripe_sandbox_orders WHERE order_id=$1 FOR UPDATE', [session.client_reference_id])
        const order = r.rows[0]
        if (!order || !order.session_id) throw new Error('stripe_order_not_bound')
        validate(session, order)
        if (order.payment_intent && order.payment_intent !== session.payment_intent) throw new Error('stripe_payment_conflict')
        const inserted = await client.query(`INSERT INTO stripe_sandbox_events(event_id,order_id)
          VALUES ($1,$2) ON CONFLICT (event_id) DO NOTHING RETURNING event_id`, [event.id, order.order_id])
        if (!inserted.rowCount) {
          const previous = await client.query('SELECT order_id FROM stripe_sandbox_events WHERE event_id=$1', [event.id])
          if (previous.rows[0]?.order_id !== order.order_id) throw new Error('stripe_event_conflict')
        }
        await client.query(`UPDATE stripe_sandbox_orders SET payment_verified=(refunded_cents=0),payment_intent=$2
          WHERE order_id=$1`, [order.order_id, session.payment_intent])
        await client.query('COMMIT')
        return { ok: true, duplicate: order.payment_verified || !inserted.rowCount,
          payment_verified: order.refunded_cents === 0, mode: 'test', delivery_verified: false, nft_minted: false }
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally { client.release() }
    },
    async recordRefund(event, charge) {
      const client = await pool.connect()
      try {
        await client.query('BEGIN')
        const r = await client.query('SELECT * FROM stripe_sandbox_orders WHERE payment_intent=$1 FOR UPDATE', [charge.payment_intent])
        const order = r.rows[0]
        // Refund before payment evidence: retry rather than losing the refund.
        if (!order || order.amount_cents !== charge.amount) throw new Error('stripe_refund_reconciliation_required')
        const e = await client.query(`INSERT INTO stripe_sandbox_events(event_id,order_id)
          VALUES ($1,$2) ON CONFLICT (event_id) DO NOTHING RETURNING event_id`, [event.id, order.order_id])
        if (!e.rowCount) {
          const previous = await client.query('SELECT order_id FROM stripe_sandbox_events WHERE event_id=$1', [event.id])
          if (previous.rows[0]?.order_id !== order.order_id) throw new Error('stripe_event_conflict')
        }
        await client.query(`UPDATE stripe_sandbox_orders
          SET refunded_cents=GREATEST(refunded_cents,$2),payment_verified=false WHERE order_id=$1`,
        [order.order_id, charge.amount_refunded])
        await client.query('COMMIT')
        return { ok: true, mode: 'test', refund_recorded: true, payment_verified: false,
          delivery_verified: false, nft_minted: false }
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally { client.release() }
    },
  }
}
