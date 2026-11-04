/**
 * Run inside the access-api service: node services/access-api/scripts/check-mint-store.mjs
 * Read-only. Uses the service's DATABASE_URL; never prints credentials or raw errors.
 * Does not create tables, inspect orders, dispatch jobs or enable financial gates.
 */
export async function inspectMintStore(client) {
  let stage = 'connect'
  let began = false
  try {
    await client.connect()
    stage = 'transaction'
    await client.query('BEGIN READ ONLY')
    began = true
    await client.query("SET LOCAL statement_timeout = '3000ms'")
    stage = 'table'
    const presence = await client.query("SELECT to_regclass('public.mint_jobs') IS NOT NULL AS ready")
    if (presence.rows[0]?.ready !== true) return { ok: false, stage, reason: 'table_missing' }
    stage = 'schema'
    const columns = await client.query(
      "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'mint_jobs'"
    )
    const expected = { order_id: 'text', status: 'text', payload: 'jsonb', created_at: 'timestamp with time zone', updated_at: 'timestamp with time zone' }
    const structure = Object.entries(expected).every(([name, type]) =>
      columns.rows.some(row => row.column_name === name && row.data_type === type && row.is_nullable === 'NO'))
    const constraints = await client.query(
      "SELECT EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conrelid = 'public.mint_jobs'::regclass AND c.contype = 'p' AND c.conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'public.mint_jobs'::regclass AND attname = 'order_id')]::smallint[]) AS primary_key_ok"
    )
    if (!structure || constraints.rows[0]?.primary_key_ok !== true)
      return { ok: false, stage, reason: 'schema_mismatch' }
    stage = 'permissions'
    const permissions = await client.query(
      "SELECT has_schema_privilege(current_user, 'public', 'USAGE') AND has_table_privilege(current_user, 'public.mint_jobs', 'SELECT') AND has_table_privilege(current_user, 'public.mint_jobs', 'INSERT') AND has_table_privilege(current_user, 'public.mint_jobs', 'UPDATE') AND has_table_privilege(current_user, 'public.mint_jobs', 'DELETE') AS ready"
    )
    if (permissions.rows[0]?.ready !== true) return { ok: false, stage, reason: 'permissions_missing' }
    return { ok: true, stage: 'complete', reason: 'structure_and_declared_permissions_ready', delivery_verified: false }
  } catch (error) {
    const code = String(error?.code || '')
    return { ok: false, stage, reason: 'probe_failed', code: /^[A-Z0-9_]{2,40}$/.test(code) ? code : 'UNCLASSIFIED' }
  } finally {
    if (began) { try { await client.query('ROLLBACK') } catch {} }
    try { await client.end() } catch {}
  }
}

async function main() {
  if (!String(process.env.DATABASE_URL || '').trim()) {
    console.log(JSON.stringify({ ok: false, stage: 'configuration', reason: 'database_url_missing' }))
    process.exitCode = 1
    return
  }
  try {
    const { default: pg } = await import('pg')
    const client = new pg.Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === '0' ? false : { rejectUnauthorized: true },
      connectionTimeoutMillis: 4000,
      query_timeout: 4000,
      application_name: 'xartists-mint-store-readonly-check',
    })
    const result = await inspectMintStore(client)
    console.log(JSON.stringify(result))
    process.exitCode = result.ok ? 0 : 1
  } catch {
    console.log(JSON.stringify({ ok: false, stage: 'initialization', reason: 'probe_initialization_failed' }))
    process.exitCode = 1
  }
}

import { pathToFileURL } from 'node:url'
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main()
