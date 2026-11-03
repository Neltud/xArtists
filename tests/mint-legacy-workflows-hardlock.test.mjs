import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

for (const name of [
  'mint-test-buypack.yml',
  'mint-3-packs-to-admin.yml',
  'update-pack-prices.yml',
]) {
  test(name + ' cannot access deployer secrets or execute price/mint actions', () => {
    const workflow = readFileSync(
      new URL('../.github/workflows/' + name, import.meta.url), 'utf8',
    )
    assert.match(workflow, /workflow_dispatch:/)
    assert.match(workflow, /jobs:\s*\n\s+blocked:/)
    assert.match(workflow, /^\s+exit 1$/m)
    assert.doesNotMatch(workflow, /SC_DEPLOYER_PEM|secrets\.|environment:\s*production/i)
    assert.doesNotMatch(workflow, /setPackPrice|buyPack|mxpy|--send|--wait-result/)
    assert.doesNotMatch(workflow, /\buses:\s*actions\//i)
  })
}
