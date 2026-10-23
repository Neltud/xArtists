import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const guard = path.join(path.dirname(fileURLToPath(import.meta.url)), 'claim_fees_guard.mjs')

function run(env) {
  return spawnSync(process.execPath, [guard], { env: { ...process.env, ...env }, encoding: 'utf8' })
}

const blocked = run({ TREASURY_DEST: '', LIA_LIVE_TRADING: '0', GUARDIAN_ARMED: '0' })
assert.equal(blocked.status, 1)
assert.match(blocked.stdout, /treasury_dest_null/)

const liveBlocked = run({
  TREASURY_DEST: 'erd1' + 'q'.repeat(58),
  LIA_LIVE_TRADING: '1',
  GUARDIAN_ARMED: '1',
  CLAIM_FEES_CODEHASH_OK: '1',
  CLAIM_FEES_OPS_PROOF: 'x'.repeat(20),
})
assert.equal(liveBlocked.status, 1)

const ok = run({
  TREASURY_DEST: 'erd1' + 'q'.repeat(58),
  LIA_LIVE_TRADING: '0',
  GUARDIAN_ARMED: '1',
  CLAIM_FEES_CODEHASH_OK: '1',
  CLAIM_FEES_OPS_PROOF: 'x'.repeat(20),
})
assert.equal(ok.status, 0)
console.log('claim_fees_guard tests OK')
