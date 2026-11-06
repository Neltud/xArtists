import assert from 'node:assert/strict'
import {test} from 'node:test'
import {checkStudioIpfsReadiness,validateStudioSchema} from '../src/studioPreflight.mjs'

const columns=[
  'id','wallet','mime','bytes','sha256','uri','status','created_at',
  'metadata_uri','metadata_sha256',
]
const definition="CHECK (((status = ANY (ARRAY['reserved'::text, 'pinned'::text, 'failed'::text, 'metadata_pinning'::text]))))"
const indexes=['xartists_studio_media_wallet_created_idx']
const secret='not-for-output-'.repeat(6)
const env={
  DATABASE_URL:'postgres://this-host-and-user-must-not-leak',
  PINATA_JWT:secret,
  ACCESS_JWT_SECRET:'signing-secret-for-test-only'.repeat(2),
  CREATOR_MEDIA_UPLOAD_ENABLED:'0',
}
function mockClient({table=true,cols=columns,status=definition,idx=indexes}={}){
  const calls=[]
  const client={
    query:async sql=>{
      calls.push(sql)
      if(sql.includes('to_regclass'))return {rows:[{table_ready:table}]}
      if(sql.includes('information_schema.columns'))
        return {rows:cols.map(column_name=>({column_name}))}
      if(sql.includes('pg_get_constraintdef'))
        return {rows:[{definition:status}]}
      if(sql.includes('pg_indexes'))
        return {rows:idx.map(indexname=>({indexname}))}
      throw Error('unexpected read-only query')
    },
    end:async()=>{},
  }
  return {client,calls}
}
test('schema requires 004+005, metadata claim state and quota index',()=>{
  const valid=validateStudioSchema({columns,statusDefinition:definition,indexes})
  assert.equal(valid.ready,true)
  assert.equal(validateStudioSchema({columns:columns.slice(0,-1),statusDefinition:definition,indexes}).ready,false)
  assert.equal(validateStudioSchema({columns,statusDefinition:"CHECK (status IN ('reserved','pinned'))",indexes}).ready,false)
  assert.equal(validateStudioSchema({columns,statusDefinition:definition,indexes:[]}).ready,false)
})
test('read-only preflight verifies pinned schema and JWT without leaking secrets',async()=>{
  const {client,calls}=mockClient()
  let url=''
  const result=await checkStudioIpfsReadiness({
    env,connect:async()=>client,request:async (target,opts)=>{
      url=target
      assert.equal(opts.method,'GET')
      assert.equal(opts.headers.Authorization,'Bearer '+secret)
      return {ok:true,status:200}
    },
  })
  assert.equal(result.ok,true)
  assert.equal(result.checks.publicUploadEnabled,false)
  assert.equal(result.checks.database.reason,'verified')
  assert.equal(result.checks.pinata.reason,'authentication_verified')
  assert.equal(url,'https://api.pinata.cloud/data/testAuthentication')
  for(const query of calls){
    assert.match(query,/^(SELECT)/)
    assert.doesNotMatch(query,/\b(INSERT|UPDATE|DELETE|ALTER|DROP|CREATE)\b/i)
  }
  const serialized=JSON.stringify(result)
  assert.equal(serialized.includes(secret),false)
  assert.equal(serialized.includes('this-host'),false)
  assert.equal(serialized.includes(env.ACCESS_JWT_SECRET),false)
})
test('no table blocks readiness before any accidental publishing',async()=>{
  const {client,calls}=mockClient({table:false})
  const result=await checkStudioIpfsReadiness({
    env,connect:async()=>client,request:async()=>({ok:true,status:200}),
  })
  assert.equal(result.ok,false)
  assert.equal(result.checks.database.reason,'migration_004_missing')
  assert.equal(calls.length,1)
})
test('invalid Pinata credential fails closed without disclosing provider error',async()=>{
  const {client}=mockClient()
  const result=await checkStudioIpfsReadiness({
    env,connect:async()=>client,request:async()=>({ok:false,status:401}),
  })
  assert.equal(result.ok,false)
  assert.equal(result.checks.pinata.reason,'pinata_auth_rejected')
})
test('missing credentials fail without sending any provider request',async()=>{
  let calls=0
  const result=await checkStudioIpfsReadiness({
    env:{},connect:async()=>{calls++;throw Error('secret pg url')},
    request:async()=>{calls++;throw Error('should not call pinata')},
  })
  assert.equal(result.ok,false)
  assert.equal(result.checks.walletSession.reason,'jwt_secret_missing')
  assert.equal(result.checks.pinata.reason,'pinata_jwt_missing')
  assert.equal(result.checks.database.reason,'database_url_missing')
  assert.equal(calls,0)
})
