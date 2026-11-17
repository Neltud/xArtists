/**
 * Offline smoke for neon-edge handler (no network, no deploy).
 *   node services/neon-edge/smoke-local.mjs
 */
import handler from './handler.mjs'

async function call(method, path, body) {
  const req = new Request('http://edge.test' + path, {
    method,
    headers: { 'content-type': 'application/json', origin: 'https://xartists.art' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const res = await handler(req)
  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    json = text
  }
  return { status: res.status, json }
}

const cases = []

{
  const r = await call('GET', '/health')
  cases.push(['GET /health', r.status === 200 && r.json.ok === true, r])
}
{
  const r = await call('GET', '/v1/ops/build-info')
  cases.push(['GET build-info', r.status === 200 && r.json.replaces_full_access_api === false, r])
}
{
  const r = await call('GET', '/v1/xorus/assisted-swap')
  cases.push(['GET assisted', r.status === 200 && r.json.enabled === false, r])
}
{
  const r = await call('POST', '/v1/xorus/assisted-swap', { tokenIn: 'EGLD' })
  cases.push(['POST assisted disabled', r.status === 503 && r.json.stage === 'disabled', r])
}
{
  const r = await call('GET', '/v1/mint')
  cases.push(['unknown route 404', r.status === 404, r])
}

let failed = 0
for (const [name, ok, r] of cases) {
  const mark = ok ? 'PASS' : 'FAIL'
  if (!ok) failed += 1
  console.log(mark, name, '→', r.status, typeof r.json === 'object' ? r.json.message || r.json.ok : r.json)
}

if (failed) {
  console.error(`\n${failed} case(s) failed`)
  process.exit(1)
}
console.log('\nAll neon-edge offline smokes passed.')
