/**
 * Sprint 2 P0 — mintDispatch unit tests (no network, no PEM).
 */
import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import {
  assertPaymentAllowsMint,
  mintDispatchConfig,
  resolveLiveInputs,
  maybeDispatchMintAfterPaid,
  dispatchMintOnPayment,
  getMintJob,
  MINT_JOB_STATUS,
} from '../src/mintDispatch.mjs'

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'xa-mint-'))
const jobsPath = path.join(tmpRoot, 'mint_jobs.json')

function envBase(extra = {}) {
  return {
    MINT_DISPATCH_ENABLED: '1',
    MINT_GITHUB_PAT: 'test-token',
    MINT_DRY_RUN: '1',
    MINT_LIVE_ENABLED: '0',
    MINT_JOBS_PATH: jobsPath,
    ...extra,
  }
}

beforeEach(() => {
  try {
    fs.unlinkSync(jobsPath)
  } catch {
    /* */
  }
  try {
    fs.unlinkSync(jobsPath + '.lock')
  } catch {
    /* */
  }
})

afterEach(() => {
  try {
    fs.unlinkSync(jobsPath)
  } catch {
    /* */
  }
})

describe('assertPaymentAllowsMint', () => {
  it('rejects unpaid / unverified', () => {
    const r = assertPaymentAllowsMint({ status: 'redirected', pack_id: 'sentinel' })
    assert.equal(r.ok, false)
    assert.equal(r.reason, 'payment_not_server_verified')
  })

  it('rejects status paid without provider proof', () => {
    const r = assertPaymentAllowsMint({
      status: 'paid',
      pack_id: 'sentinel',
      buyer_address: 'erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gqag2',
      amount_cents: 5000,
      order_id: 'xa_test_1',
    })
    assert.equal(r.ok, false)
  })

  it('accepts server_confirmed with provider_tx', () => {
    const r = assertPaymentAllowsMint({
      server_confirmed: true,
      status: 'paid',
      provider_tx_id: 'tx-1',
      authorization: 'AUTH',
      pack_id: 'sentinel',
      buyer_address: 'erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gqag2',
      amount_cents: 5000,
      currency: 'EUR',
      order_id: 'xa_test_1',
    })
    assert.equal(r.ok, true)
    assert.equal(r.pack, 'sentinel')
  })

  it('rejects refunded', () => {
    const r = assertPaymentAllowsMint({
      server_confirmed: true,
      status: 'refunded',
      provider_tx_id: 'tx-1',
      pack_id: 'sentinel',
      buyer_address: 'erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gqag2',
      amount_cents: 5000,
      order_id: 'xa_test_1',
    })
    assert.equal(r.ok, false)
    assert.equal(r.reason, 'order_invalidating_status')
  })

  it('rejects invalid buyer', () => {
    const r = assertPaymentAllowsMint({
      server_confirmed: true,
      provider_tx_id: 'tx-1',
      pack_id: 'pulse',
      buyer_address: 'not-erd',
      amount_cents: 11000,
      order_id: 'xa_test_1',
    })
    assert.equal(r.ok, false)
    assert.equal(r.reason, 'invalid_buyer')
  })

  it('rejects invalid pack', () => {
    const r = assertPaymentAllowsMint({
      server_confirmed: true,
      provider_tx_id: 'tx-1',
      pack_id: 'gold',
      buyer_address: 'erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gqag2',
      amount_cents: 100,
      order_id: 'xa_test_1',
    })
    assert.equal(r.ok, false)
    assert.equal(r.reason, 'invalid_pack')
  })
})

describe('resolveLiveInputs', () => {
  it('dry_run by default', () => {
    const cfg = mintDispatchConfig(envBase())
    const live = resolveLiveInputs(cfg)
    assert.equal(live.live_mint, 'false')
    assert.equal(live.mode, 'dry_run')
  })

  it('live only with MINT_LIVE_ENABLED=1 and dry run off', () => {
    const cfg = mintDispatchConfig(
      envBase({ MINT_DRY_RUN: '0', MINT_LIVE_ENABLED: '1', MINT_MAINNET_CONFIRM: 'LIVE_MINT_MAINNET' }),
    )
    const live = resolveLiveInputs(cfg)
    assert.equal(live.live_mint, 'true')
    assert.equal(live.confirm, 'LIVE_MINT_MAINNET')
  })

  it('token alone cannot force live', () => {
    const cfg = mintDispatchConfig(envBase({ MINT_DRY_RUN: '0', MINT_LIVE_ENABLED: '0' }))
    assert.equal(resolveLiveInputs(cfg).live_mint, 'false')
  })
})

describe('idempotency', () => {
  const order = {
    server_confirmed: true,
    status: 'paid',
    provider_tx_id: 'tx-abc',
    authorization: 'A',
    pack_id: 'sentinel',
    buyer_address: 'erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gqag2',
    amount_cents: 5000,
    currency: 'EUR',
    order_id: 'xa_idem_1',
  }

  it('first dispatch submits; second skips in-flight', async () => {
    const calls = []
    const fetchImpl = async () => {
      calls.push(1)
      return { status: 204, json: async () => ({}) }
    }
    const r1 = await maybeDispatchMintAfterPaid(order, envBase(), fetchImpl)
    assert.equal(r1.ok, true)
    assert.equal(r1.mode, 'dry_run')
    assert.equal(calls.length, 1)
    const r2 = await maybeDispatchMintAfterPaid(order, envBase(), fetchImpl)
    assert.equal(r2.skipped, true)
    assert.equal(r2.reason, 'already_in_flight')
    assert.equal(calls.length, 1)
    const job = await getMintJob('xa_idem_1', envBase())
    assert.equal(job.status, MINT_JOB_STATUS.SUBMITTED)
  })

  it('concurrent double IPN — only one github call', async () => {
    let inFlight = 0
    let max = 0
    const fetchImpl = async () => {
      inFlight++
      max = Math.max(max, inFlight)
      await new Promise((r) => setTimeout(r, 30))
      inFlight--
      return { status: 204, json: async () => ({}) }
    }
    const o = { ...order, order_id: 'xa_conc_1', provider_tx_id: 'tx-c' }
    const [a, b] = await Promise.all([
      maybeDispatchMintAfterPaid(o, envBase(), fetchImpl),
      maybeDispatchMintAfterPaid(o, envBase(), fetchImpl),
    ])
    const oks = [a, b].filter((x) => x.ok)
    const skips = [a, b].filter((x) => x.skipped)
    assert.equal(oks.length, 1)
    assert.equal(skips.length, 1)
    assert.equal(max, 1)
  })

  it('github unreachable → reconciliation_required', async () => {
    const fetchImpl = async () => {
      throw new Error('network down')
    }
    const o = { ...order, order_id: 'xa_net_1', provider_tx_id: 'tx-n' }
    const r = await maybeDispatchMintAfterPaid(o, envBase(), fetchImpl)
    assert.equal(r.ok, false)
    assert.equal(r.reconciliation_required, true)
    const job = await getMintJob('xa_net_1', envBase())
    assert.equal(job.status, MINT_JOB_STATUS.RECONCILIATION_REQUIRED)
  })

  it('github non-204 → failed, no blind retry', async () => {
    const fetchImpl = async () => ({ status: 500, json: async () => ({ message: 'boom' }) })
    const o = { ...order, order_id: 'xa_fail_1', provider_tx_id: 'tx-f' }
    const r = await maybeDispatchMintAfterPaid(o, envBase(), fetchImpl)
    assert.equal(r.ok, false)
    const r2 = await maybeDispatchMintAfterPaid(o, envBase(), fetchImpl)
    assert.equal(r2.reason, 'failed_needs_manual_retry')
  })
})

describe('dispatchMintOnPayment guards', () => {
  it('disabled without token', async () => {
    const r = await dispatchMintOnPayment(
      {
        packId: 'sentinel',
        buyer: 'erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gqag2',
        orderId: 'xa_x',
      },
      { MINT_DISPATCH_ENABLED: '1', MINT_JOBS_PATH: jobsPath },
    )
    assert.equal(r.skipped, true)
  })
})
