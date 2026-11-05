/** Safe regression tests for operator-only mint store diagnostic. No real DSN/SQL writes. */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { inspectMintStore } from '../scripts/check-mint-store.mjs'

const validColumns = [
  ['order_id', 'text'],
  ['status', 'text'],
  ['payload', 'jsonb'],
  ['created_at', 'timestamp with time zone'],
  ['updated_at', 'timestamp with time zone'],
].map(([column_name, data_type]) => ({ column_name, data_type, is_nullable: 'NO' }))

function fixture({
  exists = true,
  columns = validColumns,
  primaryKey = true,
  permissions = true,
  failAt = null,
  errorCode = '28P01',
  failConnect = false,
} = {}) {
  const statements = []
  let ends = 0
  let connects = 0
  const failure = () => Object.assign(
    new Error('postgres://private-user:private-password@private-host.internal/database'),
    { code: errorCode },
  )
  const client = {
    async connect() {
      connects++
      if (failConnect) throw failure()
    },
    async query(sql) {
      statements.push(sql)
      const normalized = sql.replace(/\s+/g, ' ').trim()
      if (failAt && normalized.startsWith(failAt)) throw failure()
      if (normalized === 'BEGIN READ ONLY') return { rows: [] }
      if (normalized.startsWith('SET LOCAL statement_timeout')) return { rows: [] }
      if (normalized.startsWith("SELECT to_regclass(")) return { rows: [{ ready: exists }] }
      if (normalized.startsWith('SELECT column_name')) return { rows: columns }
      if (normalized.startsWith('SELECT EXISTS')) return { rows: [{ primary_key_ok: primaryKey }] }
      if (normalized.startsWith('SELECT has_schema_privilege')) return { rows: [{ ready: permissions }] }
      if (normalized === 'ROLLBACK') return { rows: [] }
      throw new Error('Unexpected SQL in mint-store diagnostic: ' + normalized)
    },
    async end() { ends++ },
  }
  return { client, statements, get connects() { return connects }, get ends() { return ends } }
}

function onlyReadOnlyStatements(statements) {
  for (const sql of statements) {
    const normalized = sql.replace(/\s+/g, ' ').trim()
    assert.ok(
      normalized === 'BEGIN READ ONLY' ||
      normalized === 'ROLLBACK' ||
      normalized.startsWith('SET LOCAL statement_timeout') ||
      normalized.startsWith('SELECT '),
      'Non-read-only SQL detected',
    )
  }
}

test('missing mint_jobs table returns a bounded diagnostic and closes the transaction', async () => {
  const f = fixture({ exists: false })
  const result = await inspectMintStore(f.client)
  assert.deepEqual(result, { ok: false, stage: 'table', reason: 'table_missing' })
  assert.equal(f.connects, 1)
  assert.equal(f.ends, 1)
  assert.equal(f.statements.at(-1), 'ROLLBACK')
  onlyReadOnlyStatements(f.statements)
})

test('wrong mint_jobs schema is rejected without querying any user records', async () => {
  const f = fixture({ columns: validColumns.filter(c => c.column_name !== 'payload') })
  assert.deepEqual(await inspectMintStore(f.client), { ok: false, stage: 'schema', reason: 'schema_mismatch' })
  assert.equal(f.statements.at(-1), 'ROLLBACK')
  onlyReadOnlyStatements(f.statements)
  assert.ok(f.statements.every(s => !/SELECT\s+\*/i.test(s)))
})

test('missing order_id primary key fails closed', async () => {
  const f = fixture({ primaryKey: false })
  assert.deepEqual(await inspectMintStore(f.client), { ok: false, stage: 'schema', reason: 'schema_mismatch' })
  assert.equal(f.ends, 1)
  onlyReadOnlyStatements(f.statements)
})

test('declared SQL rights are required but not exercised', async () => {
  const f = fixture({ permissions: false })
  assert.deepEqual(await inspectMintStore(f.client), { ok: false, stage: 'permissions', reason: 'permissions_missing' })
  assert.equal(f.statements.at(-1), 'ROLLBACK')
  onlyReadOnlyStatements(f.statements)
})

test('valid structure and declared rights never claim mint delivery', async () => {
  const f = fixture()
  assert.deepEqual(await inspectMintStore(f.client), {
    ok: true,
    stage: 'complete',
    reason: 'structure_and_declared_permissions_ready',
    delivery_verified: false,
  })
  assert.equal(f.statements.at(-1), 'ROLLBACK')
  assert.equal(f.ends, 1)
  onlyReadOnlyStatements(f.statements)
})

test('connection error redacts DSN, username and password; no open transaction', async () => {
  const f = fixture({ failConnect: true })
  const result = await inspectMintStore(f.client)
  assert.deepEqual(result, { ok: false, stage: 'connect', reason: 'probe_failed', code: '28P01' })
  assert.equal(f.ends, 1)
  assert.equal(f.statements.length, 0)
  assert.doesNotMatch(JSON.stringify(result), /private|password|postgres:\/\//i)
})

test('SQL failure rolls back and exposes only a validated error code', async () => {
  const f = fixture({ failAt: 'SELECT column_name', errorCode: 'SENSITIVE PASSWORD postgres://x' })
  const result = await inspectMintStore(f.client)
  assert.deepEqual(result, { ok: false, stage: 'schema', reason: 'probe_failed', code: 'UNCLASSIFIED' })
  assert.equal(f.ends, 1)
  assert.equal(f.statements.at(-1), 'ROLLBACK')
  onlyReadOnlyStatements(f.statements)
  assert.doesNotMatch(JSON.stringify(result), /SENSITIVE|PASSWORD|postgres:\/\//)
})
