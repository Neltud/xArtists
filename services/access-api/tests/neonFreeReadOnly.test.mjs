import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createReadOnlyHandler} from '../../../deploy/neon/readonly-api/index.mjs'

const good='f'.repeat(40)
const handler=createReadOnlyHandler({env:{XARTISTS_SOURCE_SHA:good, DATABASE_URL:'SECRET_SHOULD_NOT_LEAK'}})
const call=(url,options)=>handler.fetch(new Request(`https://test-neon.invalid${url}`,options))

test('read-only staging is explicitly not the real Access API',async()=>{
  const res=await call('/health')
  assert.equal(res.status,200)
  const b=await res.json()
  assert.equal(b.service,'xartists-neon-readonly-staging')
  assert.equal(b.backend_compatible_with_access_api,false)
  assert.equal(b.database_connected,false)
  assert.equal(b.mail_connected,false)
  assert.equal(b.accounts_enabled,false)
  assert.equal(b.mint_live_enabled,false)
  assert.equal(b.paybox_checkout_enabled,false)
  assert.equal(b.stripe_live_checkout_enabled,false)
  assert.equal(b.studio_media_upload,'off')
  assert.equal(b.execution_authorized,false)
  assert.equal(b.source_sha,good)
  assert.doesNotMatch(JSON.stringify(b),/SECRET_SHOULD_NOT_LEAK/)
  assert.equal(res.headers.get('cache-control'),'no-store, max-age=0')
})

test('source identity refuses invalid SHA and remains noncommercial',async()=>{
  const h=createReadOnlyHandler({env:{XARTISTS_SOURCE_SHA:'not-valid'}})
  const res=await h.fetch(new Request('https://test-neon.invalid/v1/ops/build-info'))
  assert.equal(res.status,200)
  assert.equal((await res.json()).source_sha,null)
  assert.equal((await h.fetch(new Request('https://test-neon.invalid/health'))).status,200)
})

test('store probes and media upload remain unavailable, never report readiness',async()=>{
  for(const route of ['/v1/ops/studio-store/status','/v1/ops/orders-store/status','/v1/studio/media/config']){
    const res=await call(route)
    assert.equal(res.status,503,route)
    assert.equal((await res.json()).ok,false)
  }
  const upload=await call('/v1/studio/media/upload',{method:'POST',body:'test'})
  assert.equal(upload.status,405)
  assert.equal((await upload.json()).error,'method_not_allowed')
})

test('CORS strictly allowlists real site and never wildcard or reflect arbitrary origins',async()=>{
  const ok=await call('/health',{headers:{Origin:'https://xartists.art'}})
  assert.equal(ok.status,200)
  assert.equal(ok.headers.get('access-control-allow-origin'),'https://xartists.art')
  const bad=await call('/health',{headers:{Origin:'https://evil.example'}})
  assert.equal(bad.status,403)
  assert.equal(bad.headers.get('access-control-allow-origin'),null)
  assert.equal((await call('/health',{headers:{Origin:'null'}})).status,403)
  const preflight=await call('/health',{method:'OPTIONS',headers:{Origin:'https://www.xartists.art'}})
  assert.equal(preflight.status,204)
  assert.equal(preflight.headers.get('access-control-allow-origin'),'https://www.xartists.art')
})

test('refuses all mutation verbs, unknown endpoints and accidental redirect path',async()=>{
  for(const method of ['POST','PATCH','PUT','DELETE']){
    assert.equal((await call('/v1/ops/build-info',{method})).status,405)
  }
  assert.equal((await call('/v1/mint-live')).status,404)
  const head=await call('/health',{method:'HEAD'})
  assert.equal(head.status,200)
  assert.equal(await head.text(),'')
  assert.equal((await call('/health/')).status,200)
  assert.equal((await call('/he%61lth')).status,404)
})

test('artifact has no database, email or monetary network side effects',()=>{
  const src=readFileSync(new URL('../../../deploy/neon/readonly-api/index.mjs',import.meta.url),'utf8')
  for(const forbidden of ['pg.connect','nodemailer','fetch("http','fetch(`http','wallet.sign','process.env.ACCESS_JWT_SECRET','DATABASE_URL=']){
    assert.equal(src.includes(forbidden),false,forbidden)
  }
})
