import test from 'node:test'
import assert from 'node:assert/strict'
import { createAdminAuthChallengePgStore } from '../src/adminAuthChallengeStore.mjs'

const ADMIN = 'erd1kex0pvp9dng8j76sgsejkyx86nhxuqk24my6wnha8dga9mymvhxqvl8v0g'

/** Minimal mock pool that records SQL and simulates one-shot consume. */
function createMockPool() {
  /** @type {Map<string, object>} */
  const rows = new Map()
  return {
    rows,
    async query(sql, params = []) {
      const text = String(sql).replace(/\s+/g, ' ').trim()
      if (text.startsWith('INSERT INTO admin_auth_challenges_v1')) {
        const [
          nonce,
          admin,
          action,
          domain,
          chainId,
          contract,
          escrowId,
          favorSeller,
          target,
          issuedAt,
          expiresAt,
        ] = params
        if (rows.has(nonce)) {
          const err = new Error('duplicate')
          err.code = '23505'
          throw err
        }
        const row = {
          nonce,
          admin_bech32: admin,
          action,
          domain,
          chain_id: chainId,
          contract_bech32: contract,
          escrow_id: escrowId,
          favor_seller: favorSeller,
          target_bech32: target,
          issued_at_ms: issuedAt,
          expires_at_ms: expiresAt,
          consumed_at_ms: null,
        }
        rows.set(nonce, row)
        return { rowCount: 1, rows: [row] }
      }
      if (text.startsWith('UPDATE admin_auth_challenges_v1')) {
        const [nonce, admin, action, at] = params
        const row = rows.get(nonce)
        if (
          row &&
          row.admin_bech32 === admin &&
          row.action === action &&
          row.consumed_at_ms == null &&
          row.expires_at_ms > at
        ) {
          row.consumed_at_ms = at
          return { rowCount: 1, rows: [{ ...row }] }
        }
        return { rowCount: 0, rows: [] }
      }
      if (text.startsWith('SELECT admin_bech32, action, expires_at_ms, consumed_at_ms')) {
        const row = rows.get(params[0])
        return row ? { rowCount: 1, rows: [row] } : { rowCount: 0, rows: [] }
      }
      throw new Error('unexpected_sql: ' + text.slice(0, 80))
    },
  }
}

test('mock PG store issue and single-use consume', async () => {
  let clock = 1_700_000_000_000
  const pool = createMockPool()
  const store = createAdminAuthChallengePgStore(pool, {
    nowMs: () => clock,
    randomNonce: () => 'mocknonce01',
  })
  const issued = await store.issue({ adminBech32: ADMIN, action: 'setPaused', ttlMs: 60_000 })
  assert.equal(issued.ok, true)
  assert.match(issued.message, /nonce=mocknonce01/)

  const first = await store.consume({
    nonce: issued.nonce,
    adminBech32: ADMIN,
    action: 'setPaused',
    atMs: clock + 1_000,
  })
  assert.equal(first.ok, true)

  const second = await store.consume({
    nonce: issued.nonce,
    adminBech32: ADMIN,
    action: 'setPaused',
    atMs: clock + 2_000,
  })
  assert.equal(second.error, 'replay')
})

test('mock PG store reports expired', async () => {
  let clock = 1_700_000_000_000
  const store = createAdminAuthChallengePgStore(createMockPool(), {
    nowMs: () => clock,
    randomNonce: () => 'mocknonce02',
  })
  const issued = await store.issue({ adminBech32: ADMIN, action: 'setPaused', ttlMs: 60_000 })
  const expired = await store.consume({
    nonce: issued.nonce,
    adminBech32: ADMIN,
    action: 'setPaused',
    atMs: clock + 60_001,
  })
  assert.equal(expired.error, 'expired')
})
