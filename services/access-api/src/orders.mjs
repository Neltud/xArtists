/**
 * Persistent Paybox orders — atomic file store, fail-closed.
 * One delivery per successful payment. Mint remains simulated.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import crypto from 'node:crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function storePath() {
  const env = process.env.PAYBOX_ORDERS_PATH
  if (env) return path.resolve(env)
  return path.resolve(__dirname, '../../../data/paybox_orders.json')
}

function emptyDb() {
  return { schema: 'xartists_paybox_orders/v1', orders: {} }
}

function withLock(fn) {
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

export function loadOrders() {
  const p = storePath()
  try {
    if (!fs.existsSync(p)) return emptyDb()
    const raw = JSON.parse(fs.readFileSync(p, 'utf8'))
    if (!raw || typeof raw !== 'object' || !raw.orders) return emptyDb()
    return raw
  } catch {
    return emptyDb()
  }
}

function saveOrders(db) {
  const p = storePath()
  fs.mkdirSync(path.dirname(p), { recursive: true })
  const tmp = `${p}.${process.pid}.${Date.now()}.${crypto.randomBytes(4).toString('hex')}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2) + '\n', 'utf8')
  fs.renameSync(tmp, p)
}

export function resolveArtistBeneficiary(address) {
  const raw = String(process.env.PAYBOX_ARTIST_ALLOWLIST || '').trim()
  const allowed = new Set(
    raw.split(',').map(s => s.trim().toLowerCase()).filter(s => /^erd1[a-z0-9]{58}$/.test(s))
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

export function createOrder(input) {
  return withLock(() => {
    const db = loadOrders()
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
      delivery_note: null,
      delivered_at: null,
    }
    db.orders[input.order_id] = order
    saveOrders(db)
    return order
  })
}

export function getOrder(orderId) {
  return loadOrders().orders[orderId] || null
}

export function getOrderForBuyer(orderId, requester) {
  const order = getOrder(orderId)
  if (!order) return null
  if (!requester || order.buyer_address.toLowerCase() !== String(requester).toLowerCase()) {
    const err = new Error('order_access_denied')
    err.statusCode = 403
    throw err
  }
  return order
}

export function applyIpn(ipn) {
  return withLock(() => {
    const db = loadOrders()
    const order = db.orders[ipn.order_id]
    if (!order) return { ok: false, reason: 'unknown_order' }
    if (order.amount_cents !== ipn.amount_cents) {
      return { ok: false, reason: 'amount_mismatch', expected: order.amount_cents, got: ipn.amount_cents }
    }
    const now = new Date().toISOString()
    order.ipn_count += 1
    order.last_ipn_at = now
    order.updated_at = now
    if (ipn.error_code === '00000') {
      if (order.status === 'paid' && order.delivery === 'simulated') {
        saveOrders(db)
        return { ok: true, duplicate: true, order_id: order.order_id, status: order.status, delivery: order.delivery }
      }
      order.status = 'paid'
      order.authorization = ipn.authorization || null
      order.provider_tx_id = ipn.provider_tx_id || null
      if (order.delivery !== 'simulated') {
        order.delivery = 'simulated'
        order.delivery_note = 'payment_verified_mint_simulated'
        order.delivered_at = now
      }
      saveOrders(db)
      return { ok: true, duplicate: false, order_id: order.order_id, status: order.status, delivery: order.delivery }
    }
    if (order.status === 'paid') {
      order.status = 'late_paid'
      order.delivery_note = `late_ipn_error_${ipn.error_code}`
      saveOrders(db)
      return { ok: true, late: true, order_id: order.order_id, status: order.status }
    }
    order.status = ipn.error_code === '00001' ? 'cancelled' : 'refused'
    order.authorization = ipn.authorization || null
    saveOrders(db)
    return { ok: true, order_id: order.order_id, status: order.status }
  })
}

export function markRedirected(orderId) {
  return withLock(() => {
    const db = loadOrders()
    const order = db.orders[orderId]
    if (!order) return null
    if (order.status === 'created') {
      order.status = 'redirected'
      order.updated_at = new Date().toISOString()
      saveOrders(db)
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
