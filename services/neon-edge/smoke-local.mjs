/**
 * Offline smoke for neon-edge (no network, no deploy).
 *   node services/neon-edge/smoke-local.mjs
 */
import { fetch as edgeFetch } from './handler.mjs'

async function call(method, path, body) {
  const req = new Request('http://edge.test' + path, {
    method,
    headers: { 'content-type': 'application/json', origin: 'https://xartists.art' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const res = await edgeFetch(req)
  const text = method === 'HEAD' ? '' : await res.text()
  let json
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = text
  }
  return { status: res.status, json }
}

const cases = []

{
  const r = await call('GET', '/health')
  cases.push([
    'GET /health',
    r.status === 200 &&
      r.json.ok === true &&
      r.json.assisted_swap_enabled === false &&
      r.json.assisted_swap_capable === false,
    r,
  ])
}
{
  const r = await call('HEAD', '/health')
  cases.push(['HEAD /health', r.status === 200, r])
}
{
  const r = await call('POST', '/health')
  cases.push(['POST /health → 405', r.status === 405, r])
}
{
  const r = await call('GET', '/v1/ops/build-info')
  cases.push([
    'GET build-info',
    r.status === 200 && r.json.replaces_full_access_api === false && r.json.flags.XORUS_ASSISTED_SWAP_CAPABLE === false,
    r,
  ])
}
{
  const r = await call('POST', '/v1/ops/build-info')
  cases.push(['POST build-info → 405', r.status === 405, r])
}
{
  const r = await call('GET', '/v1/xorus/assisted-swap')
  cases.push(['GET assisted enabled=false', r.status === 200 && r.json.enabled === false, r])
}
{
  const r = await call('POST', '/v1/xorus/assisted-swap', { tokenIn: 'EGLD' })
  cases.push(['POST assisted disabled → 503', r.status === 503 && r.json.stage === 'disabled', r])
}
{
  const r = await call('GET', '/v1/mint')
  cases.push(['unknown → 404', r.status === 404, r])
}

let failed = 0
for (const [name, ok, r] of cases) {
  const mark = ok ? 'PASS' : 'FAIL'
  if (!ok) failed += 1
  console.log(mark, name, '→', r.status)
}

if (failed) {
  console.error(`\n${failed} case(s) failed`)
  process.exit(1)
}
console.log('\nAll neon-edge offline smokes passed.')
