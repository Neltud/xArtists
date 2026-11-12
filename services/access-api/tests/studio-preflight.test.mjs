import assert from 'node:assert/strict'
import {test} from 'node:test'
import {checkStudioIpfsReadiness,validateStudioSchema} from '../src/studioPreflight.mjs'

const names=[
  'id','wallet','mime','bytes','sha256','uri','status','created_at',
  'metadata_uri','metadata_sha256',
]
const columns=names.map(column_name=>({column_name,udt_name:
  column_name==='bytes'?'int4':column_name==='created_at'?'timestamptz':'text'}))
const definition="CHECK (((status = ANY (ARRAY['reserved'::text, 'pinned'::text, 'failed'::text, 'metadata_pinning'::text]))))"
const mimeDefinition="CHECK (mime IN ('image/jpeg','image/png','image/webp','video/mp4'))"
const indexes=[{indexname:'xartists_studio_media_wallet_created_idx',valid:true,
  definition:'CREATE INDEX xartists_studio_media_wallet_created_idx ON public.xartists_studio_media USING btree (wallet, created_at DESC)'}]
const schema={columns,statusDefinition:definition,statusValidated:true,
  mimeDefinition,mimeValidated:true,indexes}
const secret='not-for-output-'.repeat(6)
const env={
  DATABASE_URL:'postgres://this-host-and-user-must-not-leak',
  PINATA_JWT:secret,
  ACCESS_JWT_SECRET:'signing-secret-for-test-only'.repeat(2),
  CREATOR_MEDIA_UPLOAD_ENABLED:'0',
}
function mockClient({table=true,cols=columns,status=definition,idx=indexes,mime=mimeDefinition}={}){
  const calls=[]
  const client={
    query:async sql=>{
      calls.push(sql)
      if(sql.includes('to_regclass'))return {rows:[{table_ready:table}]}
      if(sql.includes('information_schema.columns'))
        return {rows:cols}
      if(sql.includes('pg_get_constraintdef'))
        return {rows:[{conname:'xartists_studio_media_status_check',convalidated:true,definition:status},
          {conname:'xartists_studio_media_mime_check',convalidated:true,definition:mime}]}
      if(sql.includes('pg_index'))return {rows:idx}
      throw Error('unexpected read-only query')
    },
    end:async()=>{},
  }
  return {client,calls}
}
test('schema requires 004+005, metadata claim state and quota index',()=>{
  const valid=validateStudioSchema(schema)
  assert.equal(valid.ready,true)
  assert.equal(validateStudioSchema({...schema,columns:columns.slice(0,-1)}).ready,false)
  assert.equal(validateStudioSchema({...schema,statusDefinition:"CHECK (status IN ('reserved','pinned'))"}).ready,false)
  assert.equal(validateStudioSchema({...schema,indexes:[]}).ready,false)
})
test('a GLB upload gate requires migration 006 while image uploads still accept 004+005',()=>{
  assert.equal(validateStudioSchema(schema).modelReady,false)
  assert.equal(validateStudioSchema({...schema,requireModel:true}).ready,false)
  assert.equal(validateStudioSchema({...schema,requireModel:true,
    mimeDefinition:mimeDefinition.replace("'video/mp4'","'video/mp4','model/gltf-binary'")}).ready,true)
})
test('wrong column types, unvalidated constraints and a renamed wrong index fail readiness',()=>{
  assert.equal(validateStudioSchema({...schema,columns:columns.map(c=>
    c.column_name==='bytes'?{...c,udt_name:'text'}:c)}).ready,false)
  assert.equal(validateStudioSchema({...schema,statusValidated:false}).ready,false)
  assert.equal(validateStudioSchema({...schema,mimeValidated:false}).ready,false)
  assert.equal(validateStudioSchema({...schema,indexes:[{...indexes[0],valid:false}]}).ready,false)
  assert.equal(validateStudioSchema({...schema,indexes:[{...indexes[0],
    definition:'CREATE INDEX xartists_studio_media_wallet_created_idx ON public.xartists_studio_media USING btree (id)'}]}).ready,false)
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
