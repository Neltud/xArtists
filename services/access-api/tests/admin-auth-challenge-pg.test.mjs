import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { createAdminAuthChallengePgStore } from '../src/adminAuthChallengeStore.mjs'

const connectionString =
  process.env.ADMIN_AUTH_TEST_DATABASE_URL || process.env.STRIPE_TEST_DATABASE_URL

const ADMIN = 'erd1kex0pvp9dng8j76sgsejkyx86nhxuqk24my6wnha8dga9mymvhxqvl8v0g'
const ADMIN2 = 'erd1mmh2j5y8esv2tmmyeau3hr4xa2u2te3zc3j9wumn3v5vm8uvsczqnucj5l'

test(
  'admin auth challenges Postgres migration + atomic consume',
  { skip: !connectionString },
  async (t) => {
    const { default: pg } = await import('pg')
    const adminPool = new pg.Pool({ connectionString, ssl: false })
    const schema = 'admin_auth_test_' + crypto.randomBytes(8).toString('hex')
    await adminPool.query(`CREATE SCHEMA ${schema}`)
    const pool = new pg.Pool({
      connectionString,
      ssl: false,
      max: 8,
      options: `-c search_path=${schema}`,
    })

    try {
      const sql = await readFile(
        new URL('../migrations/006_admin_auth_challenges_v1.sql', import.meta.url),
        'utf8',
      )
      await pool.query(sql)

      let clock = 1_700_000_000_000
      let nonceSeq = 0
      const store = createAdminAuthChallengePgStore(pool, {
        nowMs: () => clock,
        randomNonce: () => `noncepg${String(++nonceSeq).padStart(8, '0')}`,
      })

      await t.test('issue + consume happy path', async () => {
        const issued = await store.issue({
          adminBech32: ADMIN,
          action: 'setPaused',
          ttlMs: 120_000,
        })
        assert.equal(issued.ok, true)
        assert.match(issued.message, /action=setPaused/)
        const consumed = await store.consume({
          nonce: issued.nonce,
          adminBech32: ADMIN,
          action: 'setPaused',
          atMs: clock + 1_000,
        })
        assert.equal(consumed.ok, true)
        assert.equal(consumed.mode, 'postgres_consumed')
      })

      await t.test('replay is rejected', async () => {
        const issued = await store.issue({
          adminBech32: ADMIN,
          action: 'setAttestor',
          ttlMs: 120_000,
        })
        assert.equal(
          (await store.consume({
            nonce: issued.nonce,
            adminBech32: ADMIN,
            action: 'setAttestor',
            atMs: clock + 1_000,
          })).ok,
          true,
        )
        const again = await store.consume({
          nonce: issued.nonce,
          adminBech32: ADMIN,
          action: 'setAttestor',
          atMs: clock + 2_000,
        })
        assert.equal(again.error, 'replay')
      })

      await t.test('admin mismatch and expiry', async () => {
        const issued = await store.issue({
          adminBech32: ADMIN,
          action: 'setPaused',
          ttlMs: 60_000,
        })
        assert.equal(
          (
            await store.consume({
              nonce: issued.nonce,
              adminBech32: ADMIN2,
              action: 'setPaused',
              atMs: clock + 1_000,
            })
          ).error,
          'admin_mismatch',
        )
        const expired = await store.consume({
          nonce: issued.nonce,
          adminBech32: ADMIN,
          action: 'setPaused',
          atMs: clock + 60_001,
        })
        assert.equal(expired.error, 'expired')
      })

      await t.test('concurrent consume settles once', async () => {
        const issued = await store.issue({
          adminBech32: ADMIN,
          action: 'setPaused',
          ttlMs: 120_000,
        })
        const results = await Promise.all(
          Array.from({ length: 8 }, () =>
            store.consume({
              nonce: issued.nonce,
              adminBech32: ADMIN,
              action: 'setPaused',
              atMs: clock + 5_000,
            }),
          ),
        )
        assert.equal(results.filter((r) => r.ok).length, 1)
        assert.equal(results.filter((r) => !r.ok).length, 7)
      })

      await t.test('resolveDispute requires fields at DB constraint', async () => {
        const bad = await store.issue({
          adminBech32: ADMIN,
          action: 'resolveDispute',
          ttlMs: 60_000,
        })
        assert.equal(bad.ok, false)
        const good = await store.issue({
          adminBech32: ADMIN,
          action: 'resolveDispute',
          escrowId: 7,
          favorSeller: false,
          ttlMs: 60_000,
        })
        assert.equal(good.ok, true)
      })
    } finally {
      await pool.end()
      await adminPool.query(`DROP SCHEMA ${schema} CASCADE`)
      await adminPool.end()
    }
  },
)

test('PG store refuses construction without pool', () => {
  assert.throws(() => createAdminAuthChallengePgStore(null), /admin_auth_pg_pool_required/)
})
