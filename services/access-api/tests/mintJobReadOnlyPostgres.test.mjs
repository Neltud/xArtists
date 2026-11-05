/**
 * A job lookup is strictly read-only even when connected as an unprivileged
 * PostgreSQL role. CI alone provisions localhost xartists_mint_probe.
 * No PSP, GitHub dispatch, NFT, network requests or Render/Neon credentials.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import pg from 'pg'
import { getMintJob } from '../src/mintDispatch.mjs'

const raw = String(process.env.TEST_DATABASE_URL || '')
const allowed = (() => {
  try {
    const url = new URL(raw)
    return process.env.ALLOW_EPHEMERAL_MINT_PG_TEST === '1' &&
      url.protocol === 'postgres:' &&
      ['127.0.0.1', 'localhost'].includes(url.hostname) &&
      url.pathname === '/xartists_mint_probe'
  } catch { return false }
})()

test('read-only PostgreSQL role reads a single durable job without DDL, UPDATE or DELETE', {
  skip: !allowed && 'Only isolated localhost xartists_mint_probe with explicit opt-in',
}, async () => {
  const admin = new pg.Client({ connectionString: raw, ssl: false })
  await admin.connect()
  const id = 'qa_ro_' + randomBytes(8).toString('hex')
  const wrongId = 'qa_bad_payload_' + randomBytes(8).toString('hex')
  const reader = new URL(raw)
  reader.username = 'xartists_job_reader_ci'
  reader.password = 'local-ci-test-role-only'
  try {
    // DDL for the disposable CI fixture only, never an operator/prod command.
    await admin.query(`CREATE TABLE IF NOT EXISTS public.mint_jobs (
      order_id TEXT PRIMARY KEY, status TEXT NOT NULL, payload JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`)
    await admin.query(`DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='xartists_job_reader_ci') THEN
          CREATE ROLE xartists_job_reader_ci LOGIN PASSWORD 'local-ci-test-role-only';
        END IF;
      END $$`)
    await admin.query('GRANT USAGE ON SCHEMA public TO xartists_job_reader_ci')
    await admin.query('GRANT SELECT ON public.mint_jobs TO xartists_job_reader_ci')
    const privilege = await admin.query(`SELECT
      has_table_privilege('xartists_job_reader_ci','public.mint_jobs','SELECT') AS can_read,
      has_table_privilege('xartists_job_reader_ci','public.mint_jobs','INSERT') AS can_insert,
      has_table_privilege('xartists_job_reader_ci','public.mint_jobs','UPDATE') AS can_update,
      has_table_privilege('xartists_job_reader_ci','public.mint_jobs','DELETE') AS can_delete`)
    assert.deepEqual(privilege.rows[0], {
      can_read: true, can_insert: false, can_update: false, can_delete: false,
    })

    const synthetic = {
      order_id: id, status: 'submitted', mode: 'dry_run', attempts: 1,
      chain_tx_hash: null, nft_identifier: null, delivery_verified: false,
    }
    await admin.query(
      'INSERT INTO public.mint_jobs(order_id,status,payload) VALUES ($1,$2,$3::jsonb)',
      [id, synthetic.status, JSON.stringify(synthetic)],
    )
    // The primary key is deliberately different from payload.order_id: fail closed.
    await admin.query(
      'INSERT INTO public.mint_jobs(order_id,status,payload) VALUES ($1,$2,$3::jsonb)',
      [wrongId, 'pending', JSON.stringify({ ...synthetic, order_id: id })],
    )
    const env = { DATABASE_URL: reader.toString(), PGSSL: '0' }
    assert.deepEqual(await getMintJob(id, env), synthetic)
    assert.deepEqual(await getMintJob(id, env), synthetic)
    assert.equal(await getMintJob('qa_missing_' + id, env), null)
    assert.equal(await getMintJob(wrongId, env), null)

    const rows = await admin.query(
      "SELECT count(*)::int AS n, bool_and(status='submitted') AS submitted FROM public.mint_jobs WHERE order_id=$1",
      [id],
    )
    assert.equal(rows.rows[0].n, 1)
    assert.equal(rows.rows[0].submitted, true)
    assert.equal((await admin.query(
      'SELECT count(*)::int AS n FROM public.mint_jobs WHERE order_id=$1',
      [wrongId],
    )).rows[0].n, 1, 'read did not delete a malformed, unrelated row')
  } finally {
    await admin.end()
  }
})
