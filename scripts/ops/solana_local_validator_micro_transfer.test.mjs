/** No live network: proves local Solana transfer refuses the default. */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
const script = fileURLToPath(new URL('./solana_local_validator_micro_transfer.mjs', import.meta.url))

test('never calls local validator without explicit one-time opt-in', () => {
  for (const flag of ['', '0', 'true']) {
    const child = spawnSync(process.execPath, [script], {
      env: { ...process.env, XARTISTS_ALLOW_LOCAL_VALIDATOR_SEND: flag },
      encoding: 'utf8', timeout: 10_000,
    })
    assert.equal(child.status, 1)
    assert.match(child.stderr, /explicit isolated LOCAL validator opt-in required/)
    assert.doesNotMatch(child.stdout, /MICRO_CONFIRMED/)
  }
})
