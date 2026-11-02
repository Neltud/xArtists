/**
 * Post-IPN mint dispatch → GitHub Actions mint-on-payment.yml
 *
 * Sprint 2 P0 + review fixes:
 * - dry_run DEFAULT
 * - payment: server_confirmed|payment_verified ONLY (no status=paid legacy)
 * - idempotency: file lock OR Postgres advisory lock (DATABASE_URL)
 * - GitHub 204 ≠ mint confirmed
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import crypto from 'node:crypto'

const PACK_IDS = new Set(['pulse', 'yield', 'sentinel'])
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PG_LOCK_KEY = 87231402
const JOBS_SCHEMA = 'xartists_mint_jobs/v1'

export const MINT_JOB_STATUS = Object.freeze({
  PENDING: 'pending',
  DISPATCHING: 'dispatching',
  SUBMITTED: 'submitted',
  CONFIRMED: 'confirmed',
  FAILED: 'failed',
  RECONCILIATION_REQUIRED: 'reconciliation_required',
})

const BLOCK_REDISPATCH = new Set([
  MINT_JOB_STATUS.DISPATCHING,
  MINT_JOB_STATUS.SUBMITTED,
  MINT_JOB_STATUS.CONFIRMED,
  MINT_JOB_STATUS.RECONCILIATION_REQUIRED,
])

export function mintDispatchConfig(env = process.env) {
  const token = String(env.MINT_GITHUB_PAT || env.GITHUB_TOKEN || '').trim()
  const enabled = String(env.MINT_DISPATCH_ENABLED || '').trim() === '1'
  const dryRun =
    String(env.MINT_DRY_RUN ?? '1').trim() !== '0' &&
    String(env.MINT_DRY_RUN ?? '1').toLowerCase() !== 'false'
  const liveEnabled = String(env.MINT_LIVE_ENABLED || '').trim() === '1'
  const mainnetConfirm = String(env.MINT_MAINNET_CONFIRM ?? '').trim()
  const micro = String(env.MINT_MICRO_PRICE ?? 'false').trim().toLowerCase() === 'true'
  return {
    enabled: enabled && Boolean(token),
    token,
    owner: String(env.MINT_GITHUB_OWNER || 'Neltud').trim(),
    repo: String(env.MINT_GITHUB_REPO || 'xArtists').trim(),
    workflow: String(env.MINT_WORKFLOW_FILE || 'mint-on-payment.yml').trim(),
    ref: String(env.MINT_REF || 'main').trim(),
    dryRun,
    liveEnabled,
    mainnetConfirm,
    micro,
  }
}

export function usePostgresJobs(env = process.env) {
  return Boolean(String(env.DATABASE_URL || '').trim())
}

function jobsPath(env = process.env) {
  if (env.MINT_JOBS_PATH) return path.resolve(env.MINT_JOBS_PATH)
  return path.resolve(__dirname, '../../../data/mint_jobs.json')
}

function emptyJobs() {
  return { schema: JOBS_SCHEMA, jobs: {} }
}

function loadJobsFile(env) {
  const p = jobsPath(env)
  if (!fs.existsSync(p)) return emptyJobs()
  try {
    const raw = JSON.parse(fs.readFileSync(p, 'utf8'))
    if (!raw || raw.schema !== JOBS_SCHEMA || typeof raw.jobs !== 'object') {
      throw new Error('invalid_mint_jobs_schema')
    }
    return raw
  } catch {
    throw Object.assign(new Error('mint_jobs_store_unavailable'), { statusCode: 503 })
  }
}

function saveJobsFile(db, env) {
  const p = jobsPath(env)
  fs.mkdirSync(path.dirname(p), { recursive: true })
  const tmp = `${p}.${process.pid}.${Date.now()}.${crypto.randomBytes(4).toString('hex')}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2) + '\n', 'utf8')
  fs.renameSync(tmp, p)
}

let pool = null
let schemaReady = false

async function getPool(env) {
  if (!pool) {
    const { default: pg } = await import('pg')
    pool = new pg.Pool({
      connectionString: env.DATABASE_URL,
      ssl: env.PGSSL === '0' ? false : { rejectUnauthorized: true },
      max: 3,
    })
  }
  return pool
}

async function ensureMintJobsSchema(client) {
  if (schemaReady) return
  await client.query(`
    CREATE TABLE IF NOT EXISTS mint_jobs (
      order_id   TEXT PRIMARY KEY,
      status     TEXT NOT NULL,
      payload    JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)
  schemaReady = true
}

async function loadJobsPg(client) {
  await ensureMintJobsSchema(client)
  const r = await client.query('SELECT payload FROM mint_jobs')
  const jobs = {}
  for (const row of r.rows) {
    const j = row.payload
    if (j && j.order_id) jobs[j.order_id] = j
  }
  return { schema: JOBS_SCHEMA, jobs }
}

async function saveJobsPg(client, db) {
  await ensureMintJobsSchema(client)
  const ids = Object.keys(db.jobs)
  if (!ids.length) {
    await client.query('DELETE FROM mint_jobs')
    return
  }
  await client.query('DELETE FROM mint_jobs WHERE order_id <> ALL($1::text[])', [ids])
  for (const job of Object.values(db.jobs)) {
    await client.query(
      `INSERT INTO mint_jobs (order_id, status, payload, created_at, updated_at)
       VALUES ($1,$2,$3::jsonb,$4,$5)
       ON CONFLICT (order_id) DO UPDATE SET
         status = EXCLUDED.status,
         payload = EXCLUDED.payload,
         updated_at = EXCLUDED.updated_at`,
      [
        job.order_id,
        job.status,
        JSON.stringify(job),
        job.created_at || new Date().toISOString(),
        job.updated_at || new Date().toISOString(),
      ],
    )
  }
}

/** Cross-instance safe when DATABASE_URL set; else process-local file lock. */
export async function withMintJobLock(orderId, fn, env = process.env) {
  if (usePostgresJobs(env)) {
    const p = await getPool(env)
    const client = await p.connect()
    try {
      await client.query('BEGIN')
      await client.query('SELECT pg_advisory_xact_lock($1)', [PG_LOCK_KEY])
      const db = await loadJobsPg(client)
      const result = await fn(db, orderId)
      await saveJobsPg(client, db)
      await client.query('COMMIT')
      return result
    } catch (e) {
      try {
        await client.query('ROLLBACK')
      } catch {
        /* */
      }
      throw e
    } finally {
      client.release()
    }
  }

  const lock = jobsPath(env) + '.lock'
  const start = Date.now()
  let fd
  for (;;) {
    try {
      fd = fs.openSync(lock, 'wx')
      break
    } catch (e) {
      if (e.code !== 'EEXIST') throw e
      if (Date.now() - start > 5000) {
        throw Object.assign(new Error('mint_jobs_lock_timeout'), { statusCode: 503 })
      }
      await new Promise((r) => setTimeout(r, 15))
    }
  }
  try {
    const db = loadJobsFile(env)
    const result = await fn(db, orderId)
    saveJobsFile(db, env)
    return result
  } finally {
    try {
      fs.closeSync(fd)
    } catch {
      /* */
    }
    try {
      fs.unlinkSync(lock)
    } catch {
      /* */
    }
  }
}

/**
 * Strict payment gate.
 * ONLY server_confirmed === true OR payment_verified === true.
 * status=paid alone is NEVER sufficient (even with provider fields).
 * Those fields must be set by authenticated IPN path which also sets the flag.
 */
export function assertPaymentAllowsMint(order) {
  if (!order || typeof order !== 'object') {
    return { ok: false, reason: 'missing_order' }
  }
  if (order.server_confirmed !== true && order.payment_verified !== true) {
    return { ok: false, reason: 'payment_not_server_verified' }
  }
  if (order.status === 'refunded' || order.status === 'cancelled' || order.status === 'refused') {
    return { ok: false, reason: 'order_invalidating_status', status: order.status }
  }
  if (!order.provider_tx_id) {
    return { ok: false, reason: 'missing_provider_tx_id' }
  }
  if (!Number.isInteger(order.amount_cents) || order.amount_cents <= 0) {
    return { ok: false, reason: 'invalid_amount' }
  }
  if (order.currency && String(order.currency).toUpperCase() !== 'EUR') {
    return { ok: false, reason: 'currency_mismatch' }
  }
  const pack = String(order.pack_id || order.packId || '').toLowerCase()
  if (!PACK_IDS.has(pack)) {
    return { ok: false, reason: 'invalid_pack' }
  }
  const buyer = String(order.buyer_address || order.buyer || '').trim()
  if (!/^erd1[a-z0-9]{58}$/.test(buyer)) {
    return { ok: false, reason: 'invalid_buyer' }
  }
  const orderId = String(order.order_id || order.id || '').trim()
  if (!orderId) {
    return { ok: false, reason: 'missing_order_id' }
  }
  return { ok: true, pack, buyer, orderId, amount_cents: order.amount_cents }
}

export function resolveLiveInputs(cfg) {
  if (cfg.dryRun || !cfg.liveEnabled) {
    return { live_mint: 'false', confirm: '', mode: 'dry_run' }
  }
  if (cfg.mainnetConfirm !== 'LIVE_MINT_MAINNET') {
    return { live_mint: 'false', confirm: '', mode: 'live_blocked_bad_confirm_env' }
  }
  // Never enter the non-atomic on-chain setPackPrice micro-price window.
  if (cfg.micro) {
    return { live_mint: 'false', confirm: '', mode: 'live_blocked_non_atomic_micro_price' }
  }
  return { live_mint: 'true', confirm: 'LIVE_MINT_MAINNET', mode: 'live' }
}

export async function dispatchMintOnPayment(input, env = process.env, fetchImpl = fetch) {
  const cfg = mintDispatchConfig(env)
  if (!cfg.enabled) {
    return { ok: false, skipped: true, reason: 'mint_dispatch_disabled_or_no_token' }
  }
  const pack = String(input.packId || '').toLowerCase()
  const buyer = String(input.buyer || '').trim()
  const orderId = String(input.orderId || '').trim()
  if (!PACK_IDS.has(pack)) return { ok: false, reason: 'invalid_pack' }
  if (!/^erd1[a-z0-9]{58}$/.test(buyer)) return { ok: false, reason: 'invalid_buyer' }
  if (!orderId) return { ok: false, reason: 'missing_order_id' }

  const live = resolveLiveInputs(cfg)
  const edition = String(input.edition ?? '1')

  const reservation = await withMintJobLock(
    orderId,
    async (db) => {
      const existing = db.jobs[orderId]
      if (existing) {
        if (BLOCK_REDISPATCH.has(existing.status)) {
          return {
            proceed: false,
            job: existing,
            reason:
              existing.status === MINT_JOB_STATUS.CONFIRMED
                ? 'already_confirmed'
                : 'already_in_flight',
          }
        }
        if (existing.status === MINT_JOB_STATUS.FAILED && input.allowRetry !== true) {
          return { proceed: false, job: existing, reason: 'failed_needs_manual_retry' }
        }
      }
      const job = {
        order_id: orderId,
        pack_id: pack,
        buyer_address: buyer,
        edition,
        status: MINT_JOB_STATUS.DISPATCHING,
        mode: live.mode,
        micro_price: cfg.micro,
        provider_tx_id: input.providerTxId || null,
        amount_cents: input.amountCents || null,
        github_dispatch_accepted: false,
        chain_tx_hash: null,
        nft_identifier: null,
        error: null,
        created_at: existing?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        attempts: (existing?.attempts || 0) + 1,
        store: usePostgresJobs(env) ? 'postgres' : 'file',
      }
      db.jobs[orderId] = job
      return { proceed: true, job }
    },
    env,
  )

  if (!reservation.proceed) {
    return { ok: false, skipped: true, reason: reservation.reason, job: reservation.job }
  }

  const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/actions/workflows/${cfg.workflow}/dispatches`
  const body = {
    ref: cfg.ref,
    inputs: {
      pack,
      edition,
      buyer,
      order_id: orderId,
      live_mint: live.live_mint,
      confirm: live.confirm || 'DRY_RUN',
      micro_price: cfg.micro ? 'true' : 'false',
    },
  }

  let res
  try {
    res = await fetchImpl(url, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${cfg.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
        'User-Agent': 'xartists-access-api-mint-dispatch',
      },
      body: JSON.stringify(body),
    })
  } catch (e) {
    await withMintJobLock(
      orderId,
      async (db) => {
        const j = db.jobs[orderId]
        if (j) {
          j.status = MINT_JOB_STATUS.RECONCILIATION_REQUIRED
          j.error = `fetch_error:${e.message || 'network'}`
          j.updated_at = new Date().toISOString()
        }
      },
      env,
    )
    return { ok: false, reason: 'github_unreachable', reconciliation_required: true }
  }

  if (res.status === 204) {
    await withMintJobLock(
      orderId,
      async (db) => {
        const j = db.jobs[orderId]
        if (j) {
          j.status = MINT_JOB_STATUS.SUBMITTED
          j.github_dispatch_accepted = true
          j.updated_at = new Date().toISOString()
        }
      },
      env,
    )
    return {
      ok: true,
      status: 204,
      orderId,
      pack,
      buyer,
      mode: live.mode,
      micro: cfg.micro,
      note: 'github_accepted_dispatch_not_mint_confirmed',
    }
  }

  let errBody = null
  try {
    errBody = await res.json()
  } catch {
    errBody = null
  }
  await withMintJobLock(
    orderId,
    async (db) => {
      const j = db.jobs[orderId]
      if (j) {
        j.status = MINT_JOB_STATUS.FAILED
        j.error = `github_${res.status}`
        j.updated_at = new Date().toISOString()
      }
    },
    env,
  )
  return { ok: false, status: res.status, body: errBody, reason: 'github_dispatch_failed' }
}

export async function maybeDispatchMintAfterPaid(order, env = process.env, fetchImpl = fetch) {
  const gate = assertPaymentAllowsMint(order)
  if (!gate.ok) {
    return { ok: false, skipped: true, reason: gate.reason }
  }
  return dispatchMintOnPayment(
    {
      packId: gate.pack,
      buyer: gate.buyer,
      orderId: gate.orderId,
      edition: order.edition || 1,
      providerTxId: order.provider_tx_id,
      amountCents: gate.amount_cents,
    },
    env,
    fetchImpl,
  )
}

export async function markMintJobConfirmed(orderId, { chainTxHash, nftIdentifier } = {}, env = process.env) {
  return withMintJobLock(
    orderId,
    async (db) => {
      const j = db.jobs[orderId]
      if (!j) return null
      j.status = MINT_JOB_STATUS.CONFIRMED
      j.chain_tx_hash = chainTxHash || j.chain_tx_hash
      j.nft_identifier = nftIdentifier || j.nft_identifier
      j.updated_at = new Date().toISOString()
      return j
    },
    env,
  )
}

export async function getMintJob(orderId, env = process.env) {
  if (usePostgresJobs(env)) {
    return withMintJobLock(orderId, async (db) => db.jobs[orderId] || null, env)
  }
  const db = loadJobsFile(env)
  return db.jobs[orderId] || null
}
