/**
 * Persistent Paybox orders — file store (local) or Postgres/Neon (Render Free).
 *
 * LIMITS:
 * - File: local wx lock; single host; ephemeral on Render disk.
 * - Postgres: DATABASE_URL required; advisory xact lock; survives Render sleep.
 * - Mint remains simulated — never grants production rights.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import crypto from 'node:crypto'

export const ORDER_STATUS = Object.freeze({
  CREATED: 'created',
  PAYMENT_PENDING: 'redirected',
  REDIRECTED: 'redirected',
  PAID: 'paid',
  MINT_QUEUED: 'mint_queued',
  MINT_CONFIRMED: 'mint_confirmed',
  ACTIVE: 'active',
  REFUSED: 'refused',
  CANCELLED: 'cancelled',
  LATE_PAID: 'late_paid',
  EXPIRED: 'expired',
  REFUNDED: 'refunded',
  FAILED: 'failed',
})

const TRANSITIONS = Object.freeze({
  created: new Set(['redirected', 'expired', 'cancelled']),
  redirected: new Set(['paid', 'refused', 'cancelled', 'expired']),
  paid: new Set(['mint_queued', 'late_paid', 'refunded']),
  mint_queued: new Set(['mint_confirmed', 'failed']),
  mint_confirmed: new Set(['active', 'failed']),
  active: new Set(['refunded']),
  refused: new Set([]),
  cancelled: new Set([]),
  late_paid: new Set(['refunded']),
  expired: new Set([]),
  refunded: new Set([]),
  failed: new Set(['mint_queued']),
})

export function canTransition(from, to) {
  const allowed = TRANSITIONS[from]
  return Boolean(allowed && allowed.has(to))
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PG_LOCK_KEY = 87231401
const SCHEMA = 'xartists_paybox_orders/v1'

export function usePostgres() {
  return Boolean(String(process.env.DATABASE_URL || '').trim())
}

export function ordersBackend() {
  return usePostgres() ? 'postgres' : 'file'
}

function storePath() {
  const env = process.env.PAYBOX_ORDERS_PATH
  if (env) return path.resolve(env)
  return path.resolve(__dirname, '../../../data/paybox_orders.json')
}

function emptyDb() {
  return { schema: SCHEMA, orders: {} }
}

function withFileLock(fn) {
  const lock = storePath() + '.lock'
  const start = Date.now()
  for (;;) {
    try {
      const fd = fs.openSync(lock, 'wx')
      try {
        return fn()
      } finally {
        fs.closeSync(fd)
        try { fs.unlinkSync(lock) } catch { /* */ }
      }
    } catch (e) {
      if (e.code !== 'EEXIST') throw e
      if (Date.now() - start > 5000) throw Object.assign(new Error('orders_lock_timeout'), { statusCode: 503 })
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20)
    }
  }
}

function loadOrdersFile() {
  const p = storePath()
  if (!fs.existsSync(p)) return emptyDb()
  try {
    const raw = JSON.parse(fs.readFileSync(p, 'utf8'))
    if (!raw || raw.schema !== SCHEMA ||
        !raw.orders || typeof raw.orders !== 'object' || Array.isArray(raw.orders)) {
      throw new Error('invalid_orders_schema')
    }
    return raw
  } catch {
    throw Object.assign(new Error('orders_store_unavailable'), { statusCode: 503 })
  }
}

function saveOrdersFile(db) {
  const p = storePath()
  fs.mkdirSync(path.dirname(p), { recursive: true })
  const tmp = `${p}.${process.pid}.${Date.now()}.${crypto.randomBytes(4).toString('hex')}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2) + '\n', 'utf8')
  fs.renameSync(tmp, p)
}

let pool = null
let schemaReady = false

async function getPool() {
  if (!pool) {
    const { default: pg } = await import('pg')
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === '0' ? false : { rejectUnauthorized: false },
      max: 3,
    })
  }
  return pool
}

async function ensureSchema(client) {
  if (schemaReady) return
  await client.query(`
    CREATE TABLE IF NOT EXISTS paybox_orders (
      order_id       TEXT PRIMARY KEY,
      pack_id        TEXT NOT NULL,
      amount_cents   INT  NOT NULL,
      buyer_address  TEXT NOT NULL,
      status         TEXT NOT NULL,
      provider_tx_id TEXT,
      payload        JSONB NOT NULL,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS paybox_orders_provider_tx_uidx
      ON paybox_orders (provider_tx_id) WHERE provider_tx_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS paybox_orders_buyer_idx ON paybox_orders (buyer_address);
  `)
  schemaReady = true
}

async function loadOrdersPg(client) {
  await ensureSchema(client)
  const r = await client.query('SELECT payload FROM paybox_orders')
  const orders = {}
  for (const row of r.rows) {
    const o = row.payload
    if (o && o.order_id) orders[o.order_id] = o
  }
  return { schema: SCHEMA, orders }
}

async function saveOrdersPg(client, db) {
  await ensureSchema(client)
  const ids = Object.keys(db.orders)
  if (!ids.length) {
    await client.query('DELETE FROM paybox_orders')
    return
  }
  await client.query('DELETE FROM paybox_orders WHERE order_id <> ALL($1::text[])', [ids])
  for (const order of Object.values(db.orders)) {
    await client.query(
      `INSERT INTO paybox_orders
        (order_id, pack_id, amount_cents, buyer_address, status, provider_tx_id, payload, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9)
       ON CONFLICT (order_id) DO UPDATE SET
         pack_id = EXCLUDED.pack_id,
         amount_cents = EXCLUDED.amount_cents,
         buyer_address = EXCLUDED.buyer_address,
         status = EXCLUDED.status,
         provider_tx_id = EXCLUDED.provider_tx_id,
         payload = EXCLUDED.payload,
         updated_at = EXCLUDED.updated_at`,
      [
        order.order_id,
        order.pack_id,
        order.amount_cents,
        order.buyer_address,
        order.status,
        order.provider_tx_id || null,
        JSON.stringify(order),
        order.created_at || new Date().toISOString(),
        order.updated_at || new Date().toISOString(),
      ],
    )
  }
}

async function withStore(fn) {
  if (!usePostgres()) {
    return withFileLock(() => {
      const load = () => loadOrdersFile()
      const save = (db) => saveOrdersFile(db)
      return fn({ load, save })
    })
  }
  const p = await getPool()
  const client = await p.connect()
  try {
    await client.query('BEGIN')
    await client.query('SELECT pg_advisory_xact_lock($1)', [PG_LOCK_KEY])
    const load = () => loadOrdersPg(client)
    const save = (db) => saveOrdersPg(client, db)
    const result = await fn({ load, save })
    await client.query('COMMIT')
    return result
  } catch (e) {
    try { await client.query('ROLLBACK') } catch { /* */ }
    throw e
  } finally {
    client.release()
  }
}

export async function loadOrders() {
  if (!usePostgres()) return loadOrdersFile()
  return withStore(async ({ load }) => load())
}

export function resolveArtistBeneficiary(address) {
  const raw = String(process.env.PAYBOX_ARTIST_ALLOWLIST || '').trim()
  const allowed = new Set(
    raw.split(',').map(s => s.trim().toLowerCase()).filter(s => /^erd1[a-z0-9]{58}$/.test(s)),
  )
  if (!address || !String(address).trim()) return null
  const a = String(address).trim().toLowerCase()
  if (!allowed.size) {
    const err = new Error('artist_beneficiary_not_configured')
    err.statusCode = 403
    throw err
  }
  if (!allowed.has(a)) {
    const err = new Error('artist_beneficiary_not_allowed')
    err.statusCode = 403
    throw err
  }
  return a
}

export async function createOrder(input) {
  return withStore(async ({ load, save }) => {
    const db = await load()
    if (db.orders[input.order_id]) {
      const err = new Error('order_id_collision')
      err.statusCode = 409
      throw err
    }
    const now = new Date().toISOString()
    const order = {
      order_id: input.order_id,
      pack_id: input.pack_id,
      amount_cents: input.amount_cents,
      currency: 'EUR',
      buyer_address: input.buyer_address,
      artist_beneficiary: input.artist_beneficiary || null,
      status: 'created',
      created_at: now,
      updated_at: now,
      ipn_count: 0,
      last_ipn_at: null,
      authorization: null,
      provider_tx_id: null,
      delivery: 'none',
      mint_status: null,
      delivery_note: null,
      delivered_at: null,
    }
    db.orders[input.order_id] = order
    await save(db)
    return order
  })
}

export async function getOrder(orderId) {
  const db = await loadOrders()
  return db.orders[orderId] || null
}

export async function getOrderForBuyer(orderId, requester) {
  const order = await getOrder(orderId)
  if (!order) return null
  if (!requester || order.buyer_address.toLowerCase() !== String(requester).toLowerCase()) {
    const err = new Error('order_access_denied')
    err.statusCode = 403
    throw err
  }
  return order
}

export async function applyIpn(ipn) {
  return withStore(async ({ load, save }) => {
    const db = await load()
    const order = db.orders[ipn.order_id]
    if (!order) return { ok: false, reason: 'unknown_order' }
    if (order.amount_cents !== ipn.amount_cents) {
      return { ok: false, reason: 'amount_mismatch', expected: order.amount_cents, got: ipn.amount_cents }
    }
    if (ipn.provider_tx_id) {
      for (const [oid, o] of Object.entries(db.orders)) {
        if (oid !== ipn.order_id && o.provider_tx_id && String(o.provider_tx_id) === String(ipn.provider_tx_id)) {
          return { ok: false, reason: 'provider_tx_reused', order_id: oid }
        }
      }
    }
    const now = new Date().toISOString()
    order.ipn_count += 1
    order.last_ipn_at = now
    order.updated_at = now
    if (ipn.error_code === '00000') {
      if (order.status === 'paid' && order.delivery === 'simulated') {
        if (ipn.provider_tx_id && order.provider_tx_id &&
            String(ipn.provider_tx_id) !== String(order.provider_tx_id)) {
          return { ok: false, reason: 'provider_tx_mismatch' }
        }
        await save(db)
        return { ok: true, duplicate: true, order_id: order.order_id, status: order.status, delivery: order.delivery }
      }
      if (!['created', 'redirected'].includes(order.status)) {
        return { ok: false, reason: 'illegal_transition', from: order.status, to: 'paid' }
      }
      order.status = 'paid'
      order.authorization = ipn.authorization || null
      order.provider_tx_id = ipn.provider_tx_id || null
      if (order.delivery !== 'simulated') {
        order.delivery = 'simulated'
        order.mint_status = 'mint_confirmed'
        order.delivery_note = 'payment_verified_mint_simulated_no_production_rights'
        order.delivered_at = now
      }
      await save(db)
      return { ok: true, duplicate: false, order_id: order.order_id, status: order.status, delivery: order.delivery }
    }
    if (order.status === 'paid') {
      await save(db)
      return { ok: true, duplicate: true, late: true, order_id: order.order_id, status: order.status }
    }
    const failureStatus = ipn.error_code === '00001' ? 'cancelled' : 'refused'
    if (order.status === failureStatus) {
      await save(db)
      return { ok: true, duplicate: true, order_id: order.order_id, status: order.status }
    }
    if (!['created', 'redirected'].includes(order.status)) {
      return { ok: false, reason: 'illegal_transition', from: order.status, to: failureStatus }
    }
    order.status = failureStatus
    order.authorization = ipn.authorization || null
    await save(db)
    return { ok: true, order_id: order.order_id, status: order.status }
  })
}

export async function markRedirected(orderId) {
  return withStore(async ({ load, save }) => {
    const db = await load()
    const order = db.orders[orderId]
    if (!order) return null
    if (order.status === 'created') {
      order.status = 'redirected'
      order.updated_at = new Date().toISOString()
      await save(db)
    }
    return order
  })
}

export function newOrderId(packId, buyer) {
  const pack = String(packId || 'x').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8)
  const b = String(buyer || '').replace(/^erd1/i, '').replace(/^guest:/i, '').replace(/[^a-z0-9]/gi, '').slice(-6)
  const rand = crypto.randomBytes(3).toString('hex')
  const ts = Date.now().toString(36).slice(-6)
  return `xa_${pack}_${b}_${ts}${rand}`.slice(0, 30)
}
