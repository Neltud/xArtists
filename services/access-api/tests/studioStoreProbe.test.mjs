import assert from 'node:assert/strict'
import {test} from 'node:test'
import {createStudioStoreProbe} from '../src/studioStoreProbe.mjs'
import {startServer} from './server-fixture.mjs'

test('Studio public probe coalesces concurrent calls and caches successes and failures',async()=>{
  let calls=0,clock=100,finish
  const pending=new Promise(resolve=>{finish=resolve})
  const probe=createStudioStoreProbe({env:{DATABASE_URL:'secret'},now:()=>clock,
    inspect:async()=>{calls++;return pending}})
  const requests=Array.from({length:20},()=>probe())
  assert.equal(calls,1)
  finish({ready:true,tableReady:true,modelReady:false,private:'never-return-this'})
  const results=await Promise.all(requests)
  assert.deepEqual(results[0],{ok:true,backend:'postgres',table_ready:true,
    schema_ready:true,model_schema_ready:false})
  assert.equal(JSON.stringify(results).includes('never-return-this'),false)
  await probe();assert.equal(calls,1)
  clock+=30001;await probe();assert.equal(calls,2)
  let failures=0
  const failed=createStudioStoreProbe({inspect:async()=>{failures++;throw Error('pg password=secret')}})
  assert.equal((await failed()).ok,false)
  assert.equal((await failed()).ok,false)
  assert.equal(failures,1)
})
test('Studio HTTP status is no-store, sanitized and does not enable uploads',async()=>{
  const server=await startServer({DATABASE_URL:'',CREATOR_MEDIA_UPLOAD_ENABLED:'0'})
  try{
    const response=await fetch(server.base+'/v1/ops/studio-store/status')
    assert.equal(response.status,503)
    assert.equal(response.headers.get('cache-control'),'no-store')
    assert.deepEqual(await response.json(),{ok:false,backend:'unconfigured',
      table_ready:false,schema_ready:false,model_schema_ready:false})
    const post=await fetch(server.base+'/v1/ops/studio-store/status',{method:'POST'})
    assert.equal(post.status,405)
    const config=await(await fetch(server.base+'/v1/studio/media/config')).json()
    assert.equal(config.enabled,false)
  }finally{await server.close()}
})
test('Studio unreachable database returns safe booleans with no connection details',async()=>{
  const server=await startServer({DATABASE_URL:'postgres://hidden_user:hidden_password@127.0.0.1:1/hidden_db',PGSSL:'0'})
  try{
    const response=await fetch(server.base+'/v1/ops/studio-store/status')
    assert.equal(response.status,503)
    const body=await response.text()
    assert.doesNotMatch(body,/hidden_|127\.0\.0\.1|password|ECONN/)
    assert.equal(JSON.parse(body).backend,'postgres')
  }finally{await server.close()}
})
