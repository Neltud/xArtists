import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createRuntimeBuildInfo} from '../src/runtimeBuildInfo.mjs'
import {startServer,post} from './server-fixture.mjs'

const SHA='a'.repeat(40),OTHER='b'.repeat(40),START='2026-11-13T09:30:00.000Z'
const make=env=>createRuntimeBuildInfo({env,startedAt:START})

test('runtime identity reports an exact source SHA without claiming a build or financial release',()=>{
  const value=make({RENDER_GIT_COMMIT:SHA,ACCESS_JWT_SECRET:'private-secret',DATABASE_URL:'private-db'})
  assert.deepEqual(value,{schema_version:1,service:'access-api',source_sha:SHA,
    stamp_source:'render-runtime',started_at:START,execution_authorized:false})
  assert.equal(Object.isFrozen(value),true)
  assert.equal(Object.hasOwn(value,'built_at'),false)
  assert.ok(!JSON.stringify(value).includes('private-'))
  assert.equal(make({XARTISTS_SOURCE_SHA:SHA}).stamp_source,'operator-environment')
})

test('unknown, abbreviated and conflicting runtime identities remain unavailable',()=>{
  for(const env of [{},{RENDER_GIT_COMMIT:'abc123'},{RENDER_GIT_COMMIT:'A'.repeat(40)},
    {RENDER_GIT_COMMIT:SHA,XARTISTS_SOURCE_SHA:OTHER},
    {RENDER_GIT_COMMIT:'invalid',XARTISTS_SOURCE_SHA:SHA},
    {XARTISTS_SOURCE_SHA:'z'.repeat(40)},{XARTISTS_SOURCE_SHA:SHA+'\n'},
  ]){
    assert.equal(make(env).source_sha,null)
    assert.equal(make(env).stamp_source,'unavailable')
  }
  assert.equal(make({RENDER_GIT_COMMIT:SHA,XARTISTS_SOURCE_SHA:SHA}).source_sha,SHA)
  assert.throws(()=>createRuntimeBuildInfo({env:{},startedAt:'not-time'}))
})

for(const known of [false,true]){
  test('HTTP runtime identity '+(known?'matches the process source':'fails closed without a source'),async()=>{
    const server=await startServer({RENDER_GIT_COMMIT:known?SHA:'',XARTISTS_SOURCE_SHA:'',
      XORUS_ANALYSIS_ENABLED:'0'})
    try{
      const response=await fetch(server.base+'/v1/ops/build-info')
      assert.equal(response.status,known?200:503)
      assert.equal(response.headers.get('cache-control'),'no-store')
      const body=await response.json()
      assert.equal(body.source_sha,known?SHA:null)
      assert.equal(body.ok,known)
      assert.equal(body.execution_authorized,false)
      const health=await (await fetch(server.base+'/health')).json()
      assert.equal(health.source_sha,body.source_sha)
      assert.equal(health.paybox_checkout_enabled,false)
      assert.equal(health.mint_live_enabled,false)
      const injected=await fetch(server.base+'/v1/ops/build-info?source_sha='+OTHER)
      assert.equal(injected.status,400)
      const changed=await post(server.base+'/v1/ops/build-info',{source_sha:OTHER})
      assert.equal(changed.status,405)
      assert.equal((await (await fetch(server.base+'/v1/ops/build-info')).json()).source_sha,known?SHA:null)
    }finally{await server.close()}
  })
}
