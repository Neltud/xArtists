import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'

const path = fileURLToPath(new URL('../src/server.mjs',import.meta.url))
const server = readFileSync(path,'utf8')

test('access-api restoration must preserve full server and existing routes',()=>{
  assert.ok(server.length>40_000, 'server.mjs appears truncated')
  for(const anchor of [
    "async function handleRequest(req, res)",
    "server.listen(PORT",
    "/v1/xorus/analysis",
    "/v1/xorus/assisted-swap",
    "/v1/commercial/catalog",
    "/v1/account/session",
    "/v1/checkout/paybox",
  ]) {
    assert.ok(server.includes(anchor), 'missing: '+anchor)
  }
  assert.ok(!server.includes('process.exit(1)'), 'fail-fast placeholder must be gone')
  assert.ok(server.includes("process.env.XORUS_ASSISTED_SWAP_ENABLED === '1'"),
    'assisted swap must remain opt-in')
})
