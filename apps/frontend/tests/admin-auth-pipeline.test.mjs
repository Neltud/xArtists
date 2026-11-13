import test from 'node:test'
import assert from 'node:assert/strict'
import { runAdminAuthPipelineOffline } from '../src/lib/adminAuthPipelineTest.mjs'

test('happy path: issue → MessageComputer sign → verify → consume', async () => {
  const result = await runAdminAuthPipelineOffline({ action: 'setPaused' })
  assert.equal(result.ok, true)
  assert.equal(result.stage, 'complete')
  assert.equal(result.mode, 'paper_pipeline_complete')
})

test('message tampered after sign fails UserVerifier', async () => {
  const result = await runAdminAuthPipelineOffline({
    action: 'setPaused',
    tamperAfterSign: true,
  })
  assert.equal(result.ok, false)
  assert.equal(result.stage, 'verify')
  assert.equal(result.error, 'invalid_signature')
})

test('double consume is blocked', async () => {
  const result = await runAdminAuthPipelineOffline({
    action: 'setPaused',
    doubleConsume: true,
  })
  assert.equal(result.ok, true)
  assert.equal(result.stage, 'replay_blocked')
  assert.ok(['unknown_nonce', 'replay'].includes(result.replayError))
})

test('resolveDispute pipeline requires dispute fields at issue', async () => {
  const bad = await runAdminAuthPipelineOffline({ action: 'resolveDispute' })
  assert.equal(bad.ok, false)
  assert.equal(bad.stage, 'issue')

  const good = await runAdminAuthPipelineOffline({
    action: 'resolveDispute',
    extra: { escrowId: 9, favorSeller: true },
  })
  assert.equal(good.ok, true)
  assert.equal(good.stage, 'complete')
})
