/** Cross-origin access is limited to official xArtists public frontends. */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { startServer } from './server-fixture.mjs'

const PAGES = 'https://neltud.github.io'
const RENDER = 'https://xartists-services-and-products.onrender.com'
const CANONICAL = 'https://xartists.art'

test('both public frontend origins can read JSON, including a direct Render deep-link', async () => {
  const server = await startServer({ CORS_ORIGIN: PAGES })
  try {
    for (const origin of [CANONICAL, PAGES, RENDER]) {
      const response = await fetch(server.base + '/v1/tro/bridge/status', {
        headers: { Origin: origin },
      })
      assert.equal(response.status, 200)
      assert.equal(response.headers.get('access-control-allow-origin'), origin)
      assert.match(response.headers.get('vary') || '', /origin/i)
      assert.equal(response.headers.get('access-control-allow-credentials'), null)
      const body = await response.json()
      assert.equal(body.bridge.status, 'disabled')
      assert.equal(body.sale.directSaleLive, false)
    }
  } finally { await server.close() }
})

test('untrusted origins receive no CORS grant and no credentials header', async () => {
  const server = await startServer({ CORS_ORIGIN: PAGES })
  try {
    for (const origin of ['https://attacker.example', 'null', 'https://neltud.github.io.evil.example',
      'https://xartists.art.evil.example','http://xartists.art','https://xartists.art:444','https://user@xartists.art']) {
      const response = await fetch(server.base + '/health', { headers: { Origin: origin } })
      assert.equal(response.status, 200)
      assert.equal(response.headers.get('access-control-allow-origin'), null)
      assert.match(response.headers.get('vary') || '', /origin/i)
      assert.equal(response.headers.get('access-control-allow-credentials'), null)
    }
  } finally { await server.close() }
})

test('OPTIONS preflight grants only exact official origin, with no live business action', async () => {
  const server = await startServer({ CORS_ORIGIN: PAGES })
  try {
    for (const origin of [CANONICAL, PAGES, RENDER]) {
      const response = await fetch(server.base + '/v1/tro/bridge/status', {
        method: 'OPTIONS',
        headers: { Origin: origin, 'Access-Control-Request-Method': 'GET' },
      })
      assert.equal(response.status, 204)
      assert.equal(response.headers.get('access-control-allow-origin'), origin)
      assert.match(response.headers.get('access-control-allow-methods') || '', /GET/)
    }
    const blocked = await fetch(server.base + '/v1/tro/bridge/status', {
      method: 'OPTIONS',
      headers: { Origin: 'https://evil.example', 'Access-Control-Request-Method': 'GET' },
    })
    assert.equal(blocked.status, 204)
    assert.equal(blocked.headers.get('access-control-allow-origin'), null)
  } finally { await server.close() }
})

test('canonical domain reaches guarded services without enabling MoonPay or accepting lookalikes',async()=>{
  const server=await startServer({CORS_ORIGIN:PAGES,NODE_ENV:'production'})
  try{
    const allowed=await fetch(server.base+'/moonpay/sign',{method:'POST',
      headers:{Origin:CANONICAL,'Content-Type':'application/json'},body:JSON.stringify({url:'https://buy.moonpay.com/'})})
    assert.equal(allowed.status,503)
    assert.equal(allowed.headers.get('access-control-allow-origin'),CANONICAL)
    assert.equal((await allowed.json()).error,'moonpay_not_configured')
    for(const origin of ['https://xartists.art.evil.example','http://localhost.evil.example','http://localhost:3000']){
      const denied=await fetch(server.base+'/moonpay/sign',{method:'POST',
        headers:{Origin:origin,'Content-Type':'application/json'},body:'{}'})
      assert.equal(denied.status,403)
      assert.equal(denied.headers.get('access-control-allow-origin'),null)
    }
  }finally{await server.close()}
})
