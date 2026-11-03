/**
 * Review-only S1/S2 candidate uniqueness proof on disposable LOCAL PostgreSQL.
 * No real PSP IPN, live mint, wallet key, mainnet RPC or production DB.
 * Requires explicit opt-in AND exactly /xartists_s1s2_probe on localhost.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const dbUrl = process.env.TEST_S1S2_DATABASE_URL || ''
const approved = (() => {
  try {
    const u = new URL(dbUrl)
    return process.env.ALLOW_EPHEMERAL_S1S2_PG_TEST === '1' &&
      u.protocol === 'postgres:' &&
      ['localhost', '127.0.0.1'].includes(u.hostname) &&
      u.pathname === '/xartists_s1s2_probe'
  } catch { return false }
})()

test('PostgreSQL candidate ledger: unique PSP/tx/NFT, correlated S1/S2, immutable and never delivered', {
  skip: !approved && 'Requires explicit opt-in + disposable localhost xartists_s1s2_probe',
}, async () => {
  process.env.DATABASE_URL = dbUrl
  process.env.PGSSL = '0'
  const pg = (await import('pg')).default
  const { createOrder, applyIpn, getOrder } = await import('../src/orders.mjs')
  const { withMintJobLock } = await import('../src/mintDispatch.mjs')
  const pool = new pg.Pool({ connectionString: dbUrl, ssl: false, max: 5 })
  const env = { DATABASE_URL: dbUrl, PGSSL: '0' }
  const buyer = 'erd1' + 'q'.repeat(58)
  const collection = 'TSFT-c867a3'
  const hash = chr => chr.repeat(64)
  const serial = Date.now().toString(36)

  async function fixture(index, { paid = true, mode = 'live',
    tx = hash(String(index)), token = String(index).padStart(2, '0') } = {}) {
    const orderId = 's1s2_' + serial + '_' + index
    const provider = 'fixture_psp_' + orderId
    await createOrder({
      order_id: orderId, pack_id: 'sentinel',
      amount_cents: 5000, buyer_address: buyer,
    })
    if (paid) {
      const paidResult = await applyIpn({
        order_id: orderId, amount_cents: 5000,
        provider_tx_id: provider,
        authorization: 'fixture_only',
        error_code: '00000',
      })
      assert.equal(paidResult.ok, true)
      assert.equal((await getOrder(orderId)).payment_verified, true)
    }
    const nft = collection + '-' + token
    await withMintJobLock(orderId, async db => {
      db.jobs[orderId] = {
        order_id: orderId,
        status: 'submitted',
        pack_id: 'sentinel', buyer_address: buyer,
        amount_cents: 5000,
        provider_tx_id: provider,
        chain_tx_hash: tx, nft_identifier: nft,
        mode, micro_price: false,
        github_dispatch_accepted: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }, env)
    return { orderId, provider, tx, nft, buyer,
      pack: 'sentinel', amount: 5000 }
  }

  async function insert(row) {
    return pool.query(
      `INSERT INTO s1s2_candidate_reservations
        (order_id, provider_tx_id, chain_tx_hash, nft_identifier,
         buyer_address, pack_id, amount_cents)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [row.orderId, row.provider, row.tx, row.nft, row.buyer,
        row.pack, row.amount],
    )
  }
  async function rejectCode(promise, code) {
    await assert.rejects(promise, error => error.code === code,
      'expected PostgreSQL SQLSTATE ' + code)
  }

  try {
    // Create all parents before activating FK-backed migration.
    const first = await fixture(1, { tx: hash('a'), token: '01' })
    const reusedTx = await fixture(2, { tx: hash('a'), token: '02' })
    const reusedNft = await fixture(3, { tx: hash('b'), token: '01' })
    const concurrent = await fixture(4, { tx: hash('c'), token: '04' })
    const unpaid = await fixture(5, { paid: false, tx: hash('d'), token: '05' })
    const dry = await fixture(6, { mode: 'dry_run', tx: hash('e'), token: '06' })
    const rollback = await fixture(7, { tx: hash('f'), token: '07' })

    // No migration is run during production startup. CI applies only to its
    // disposable localhost PostgreSQL service after synthetic parent tables.
    await pool.query(readFileSync(
      new URL('../sql/s1s2_candidate_reservations.sql', import.meta.url),
      'utf8',
    ))

    const created = await insert(first)
    assert.equal(created.rowCount, 1)
    const firstRecord = await pool.query(
      'SELECT state, source FROM s1s2_candidate_reservations WHERE order_id=$1',
      [first.orderId],
    )
    assert.deepEqual(firstRecord.rows, [{
      state: 'review_pending', source: 'operator_s1s2_candidate',
    }])

    await rejectCode(insert(first), '23505') // Replay cannot update evidence.
    await rejectCode(insert(reusedTx), '23505') // Same chain tx, other order.
    await rejectCode(insert(reusedNft), '23505') // Same NFT, another tx/order.
    await rejectCode(insert(unpaid), '23514') // No verified paid IPN.
    await rejectCode(insert(dry), '23514') // GitHub dry-run is not S2.
    await rejectCode(insert({ ...concurrent, orderId: 'unknown_parent' }), '23514')
    await rejectCode(insert({ ...concurrent, provider: first.provider }), '23514')

    const promises = await Promise.allSettled([insert(concurrent), insert(concurrent)])
    assert.equal(promises.filter(x => x.status === 'fulfilled').length, 1)
    assert.equal(promises.filter(x => x.status === 'rejected' && x.reason.code === '23505').length, 1)
    const reserved = await pool.query(
      'SELECT count(*)::int AS n FROM s1s2_candidate_reservations WHERE order_id=$1',
      [concurrent.orderId],
    )
    assert.equal(reserved.rows[0].n, 1)

    // Audit trail cannot be mutated, deleted or promoted to delivered.
    await rejectCode(pool.query(
      'UPDATE s1s2_candidate_reservations SET nft_identifier=$1 WHERE order_id=$2',
      [collection + '-09', first.orderId],
    ), '23514')
    await rejectCode(pool.query(
      'DELETE FROM s1s2_candidate_reservations WHERE order_id=$1',
      [first.orderId],
    ), '23514')
    await rejectCode(pool.query(
      "UPDATE s1s2_candidate_reservations SET state='delivered' WHERE order_id=$1",
      [first.orderId],
    ), '23514')

    const cols = await pool.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema='public' AND table_name='s1s2_candidate_reservations'`,
    )
    assert.equal(cols.rows.some(x => x.column_name === 'delivery_verified'), false)
    assert.equal(cols.rows.some(x => x.column_name === 'delivered_at'), false)

    // A failed transaction must not persist a reservation.
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(
        `INSERT INTO s1s2_candidate_reservations
         (order_id,provider_tx_id,chain_tx_hash,nft_identifier,
          buyer_address,pack_id,amount_cents)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [rollback.orderId, rollback.provider, rollback.tx,
          rollback.nft, rollback.buyer, rollback.pack, rollback.amount],
      )
      await client.query('ROLLBACK')
    } finally {
      client.release()
    }
    const reverted = await pool.query(
      'SELECT 1 FROM s1s2_candidate_reservations WHERE order_id=$1',
      [rollback.orderId],
    )
    assert.equal(reverted.rowCount, 0)

    // Neither signed IPN receipt nor candidate proof ever grants ownership.
    const order = await getOrder(first.orderId)
    assert.equal(order.delivery_verified, false)
    assert.equal(order.delivery, 'pending')
    assert.equal(order.delivered_at, null)
    console.log('S1S2_POSTGRES_CANDIDATE_OK: one immutable candidate, one concurrent reservation, duplicates blocked, no delivery')
  } finally {
    await pool.end()
  }
})
