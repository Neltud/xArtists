import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const workflow = readFileSync(
  new URL('../.github/workflows/mint-on-payment.yml', import.meta.url),
  'utf8',
)
const getJob = (id) => {
  const m = workflow.match(new RegExp('(?:^|\\n)  ' + id +
    ':\\n([\\s\\S]*?)(?=\\n  [a-z][a-z0-9_-]*:\\n|$)'))
  assert.ok(m, 'required workflow job ' + id + ' missing')
  return m[1]
}
test('legacy live mint job is hard-locked, independent of Render flags or GitHub inputs', () => {
  const live = getJob('mint')
  const gate = 'if: ' + '$' + '{{ false }}'
  assert.ok(live.split('\n').some(line => line.trim() === gate),
    'live mint must have unconditional false job-level gate')
  assert.match(live, /environment: production/)
  assert.match(live, /SC_DEPLOYER_PEM/)
  assert.match(live, /setPackPrice/)
  assert.match(live, /buyPack/)
})
test('manual live_mint=true produces an explicit failing job without secret access', () => {
  const blocked = getJob('live_disabled')
  const condition = 'if: ' + '$' + "{{ github.event.inputs.live_mint == 'true' }}"
  assert.ok(blocked.split('\n').some(line => line.trim() === condition))
  assert.match(blocked, /^\s+exit 1$/m)
  assert.doesNotMatch(blocked, /SC_DEPLOYER_PEM|environment: production/)
})
test('dry-run still validates inputs and has no production secret or environment', () => {
  const dry = getJob('dry_run')
  assert.ok(dry.includes("github.event.inputs.live_mint != 'true'"))
  assert.match(dry, /test "\$LIVE" = "false"/)
  assert.match(dry, /No production environment, no PEM, no signing, no mint, no transfers\./)
  assert.doesNotMatch(dry, /SC_DEPLOYER_PEM|environment: production/)
})
