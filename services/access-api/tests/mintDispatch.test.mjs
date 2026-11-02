/** Sprint 2 P0 + review — mintDispatch tests */
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
  for (const p of [jobsPath, jobsPath + '.lock']) {
    try {
      fs.unlinkSync(p)
    } catch {
      /* */
    }
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
  it('rejects unpaid', () => {
    const r = assertPaymentAllowsMint({ status: 'redirected', pack_id: 'sentinel' })
    assert.equal(r.ok, false)
    assert.equal(r.reason, 'payment_not_server_verified')
  })

  it('rejects status=paid even with provider fields (no server flag)', () => {
    const r = assertPaymentAllowsMint({
      status: 'paid',
      provider_tx_id: 'tx-1',
      authorization: 'AUTH',
      pack_id: 'sentinel',
      buyer_address: 'erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gqag2',
      amount_cents: 5000,
      order_id: 'xa_test_1',
    })
    assert.equal(r.ok, false)
    assert.equal(r.reason, 'payment_not_server_verified')
  })

  it('accepts server_confirmed with provider_tx', () => {
    const r = assertPaymentAllowsMint({
      server_confirmed: true,
      status: 'paid',
      provider_tx_id: 'tx-1',
      pack_id: 'sentinel',
      buyer_address: 'erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gqag2',
      amount_cents: 5000,
      currency: 'EUR',
      order_id: 'xa_test_1',
    })
    assert.equal(r.ok, true)
  })

  it('accepts payment_verified flag', () => {
    const r = assertPaymentAllowsMint({
      payment_verified: true,
      provider_tx_id: 'tx-2',
      pack_id: 'pulse',
      buyer_address: 'erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gqag2',
      amount_cents: 11000,
      order_id: 'xa_test_2',
    })
    assert.equal(r.ok, true)
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
  })
})

describe('resolveLiveInputs', () => {
  it('dry_run by default', () => {
    assert.equal(resolveLiveInputs(mintDispatchConfig(envBase())).live_mint, 'false')
  })
  it('live only with gates', () => {
    const cfg = mintDispatchConfig(
      envBase({ MINT_DRY_RUN: '0', MINT_LIVE_ENABLED: '1', MINT_MAINNET_CONFIRM: 'LIVE_MINT_MAINNET' }),
    )
    assert.equal(resolveLiveInputs(cfg).live_mint, 'true')
  })
  it('token alone cannot force live', () => {
    assert.equal(
      resolveLiveInputs(mintDispatchConfig(envBase({ MINT_DRY_RUN: '0', MINT_LIVE_ENABLED: '0' })))
        .live_mint,
      'false',
    )
  })
})

describe('idempotency', () => {
  const order = {
    server_confirmed: true,
    status: 'paid',
    provider_tx_id: 'tx-abc',
    pack_id: 'sentinel',
    buyer_address: 'erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gqag2',
    amount_cents: 5000,
    currency: 'EUR',
    order_id: 'xa_idem_1',
  }

  it('first ok; second skips', async () => {
    const calls = []
    const fetchImpl = async () => {
      calls.push(1)
      return { status: 204, json: async () => ({}) }
    }
    assert.equal((await maybeDispatchMintAfterPaid(order, envBase(), fetchImpl)).ok, true)
    assert.equal((await maybeDispatchMintAfterPaid(order, envBase(), fetchImpl)).skipped, true)
    assert.equal(calls.length, 1)
  })

  it('concurrent — one github call', async () => {
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
    assert.equal([a, b].filter((x) => x.ok).length, 1)
    assert.equal(max, 1)
  })

  it('github down → reconciliation', async () => {
    const o = { ...order, order_id: 'xa_net_1', provider_tx_id: 'tx-n' }
    const r = await maybeDispatchMintAfterPaid(o, envBase(), async () => {
      throw new Error('network')
    })
    assert.equal(r.reconciliation_required, true)
    assert.equal((await getMintJob('xa_net_1', envBase())).status, MINT_JOB_STATUS.RECONCILIATION_REQUIRED)
  })

  it('failed no blind retry', async () => {
    const o = { ...order, order_id: 'xa_fail_1', provider_tx_id: 'tx-f' }
    const fetchImpl = async () => ({ status: 500, json: async () => ({}) })
    await maybeDispatchMintAfterPaid(o, envBase(), fetchImpl)
    assert.equal((await maybeDispatchMintAfterPaid(o, envBase(), fetchImpl)).reason, 'failed_needs_manual_retry')
  })
})

describe('guards', () => {
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
