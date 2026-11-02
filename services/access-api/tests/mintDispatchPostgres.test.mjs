/**
 * Cross-process PostgreSQL idempotency proof using an EPHEMERAL LOCAL database.
 * This test NEVER sends an HTTP request: the GitHub dispatch adapter is stubbed.
 * Run with TEST_DATABASE_URL=postgres://...@127.0.0.1/... and
 * ALLOW_EPHEMERAL_MINT_PG_TEST=1. A remote host is rejected unconditionally.
 */
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const url = process.env.TEST_DATABASE_URL || ''
const isLocal = (() => {
  try {
    const u = new URL(url)
    return ['127.0.0.1', 'localhost'].includes(u.hostname) &&
      u.pathname === '/xartists_mint_probe' && u.protocol === 'postgres:'
  } catch {
    return false
  }
})()
const approved = process.env.ALLOW_EPHEMERAL_MINT_PG_TEST === '1' && isLocal

const buyer = 'erd1' + 'q'.repeat(58)
function fixture(orderId) {
  return {
    order_id: orderId,
    server_confirmed: true,
    status: 'paid',
    provider_tx_id: 'fixture_' + orderId,
    pack_id: 'sentinel',
    buyer_address: buyer,
    currency: 'EUR',
    amount_cents: 5000,
  }
}

if (process.env.XA_PG_MINT_WORKER === '1') {
  assert.ok(approved, 'worker refuses non-local / non-ephemeral DB')
  const { maybeDispatchMintAfterPaid } = await import('../src/mintDispatch.mjs')
  const result = await maybeDispatchMintAfterPaid(
    fixture(process.env.PROBE_ORDER_ID),
    {
      DATABASE_URL: url,
      PGSSL: '0',
      MINT_DISPATCH_ENABLED: '1',
      MINT_GITHUB_PAT: 'fixture-token-never-sent',
      MINT_DRY_RUN: '1',
      MINT_LIVE_ENABLED: '0',
    },
    async () => {
      console.log('MOCK_DISPATCH')
      return { status: 204, json: async () => ({}) }
    },
  )
  assert.ok(result.ok || result.skipped, 'dispatch unexpectedly failed')
  console.log('WORKER_RESULT=' + JSON.stringify({
    ok: !!result.ok, skipped: !!result.skipped, reason: result.reason,
  }))
} else {
  const { test } = await import('node:test')
  const { default: pg } = await import('pg')

  test('PostgreSQL advisory lock permits exactly one dispatch across processes', {
    skip: !approved && 'Requires isolated localhost xartists_mint_probe + explicit opt-in',
  }, async () => {
    const orderId = 'pgprobe_' + Date.now()
    const runWorker = () => new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [fileURLToPath(import.meta.url)], {
        env: {
          ...process.env,
          DATABASE_URL: url,
          TEST_DATABASE_URL: url,
          PGSSL: '0',
          XA_PG_MINT_WORKER: '1',
          PROBE_ORDER_ID: orderId,
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      })
      let stdout = ''
      let stderr = ''
      child.stdout.setEncoding('utf8').on('data', chunk => { stdout += chunk })
      child.stderr.setEncoding('utf8').on('data', chunk => { stderr += chunk })
      child.on('error', reject)
      child.on('close', code => {
        if (code !== 0) return reject(new Error('worker failed: ' + stderr.slice(-1000)))
        resolve(stdout)
      })
    })
    const outputs = await Promise.all([runWorker(), runWorker()])
    const replay = await runWorker()
    const all = [...outputs, replay]
    const calls = all.reduce((n, text) => n + (text.match(/MOCK_DISPATCH/g) || []).length, 0)
    assert.equal(calls, 1, 'one and only one mocked dispatch across worker processes')
    assert.equal(all.filter(text => text.includes('"ok":true')).length, 1)
    assert.equal(all.filter(text => text.includes('"skipped":true')).length, 2)

    const pool = new pg.Pool({ connectionString: url, ssl: false })
    try {
      const rows = await pool.query('SELECT payload FROM mint_jobs WHERE order_id = $1', [orderId])
      assert.equal(rows.rowCount, 1)
      assert.equal(rows.rows[0].payload.attempts, 1)
      assert.equal(rows.rows[0].payload.status, 'submitted')
      assert.equal(rows.rows[0].payload.mode, 'dry_run')
      assert.equal(rows.rows[0].payload.chain_tx_hash, null)
      assert.equal(rows.rows[0].payload.nft_identifier, null)
    } finally {
      await pool.end()
    }
    console.log('POSTGRES_IDEMPOTENCY_OK one mock dispatch; two skips; one durable submitted row')
  })
}
