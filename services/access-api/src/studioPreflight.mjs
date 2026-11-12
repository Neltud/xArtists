/** Studio/Pinata read-only preflight. No upload, mutation, or secret disclosure.
 * Usage via scripts/check-studio-ipfs.mjs on the confirmed API runtime, on any host.
 */
const REQUIRED_COLUMNS=Object.freeze([
  'id','wallet','mime','bytes','sha256','uri','status','created_at',
  'metadata_uri','metadata_sha256',
])
const COLUMN_TYPES=Object.freeze({
  id:'text',wallet:'text',mime:'text',bytes:'int4',sha256:'text',uri:'text',
  status:'text',created_at:'timestamptz',metadata_uri:'text',metadata_sha256:'text',
})
export function validateStudioSchema({columns=[],statusDefinition='',statusValidated=false,
  mimeDefinition='',mimeValidated=false,indexes=[],requireModel=false}={}){
  const names=new Set(columns.map(c=>c.column_name))
  const missingColumns=REQUIRED_COLUMNS.filter(name=>!names.has(name))
  const invalidColumns=REQUIRED_COLUMNS.filter(name=>names.has(name)&&
    !columns.some(c=>c.column_name===name&&c.udt_name===COLUMN_TYPES[name]))
  const values=definition=>new Set([...definition.matchAll(/'([^']+)'/g)].map(m=>m[1]))
  const statuses=values(statusDefinition),mimes=values(mimeDefinition)
  const statusReady=statusValidated===true&&
    ['reserved','pinned','failed','metadata_pinning'].every(s=>statuses.has(s))
  const mimeReady=mimeValidated===true&&
    ['image/jpeg','image/png','image/webp','video/mp4'].every(m=>mimes.has(m))
  const modelReady=mimeReady&&mimes.has('model/gltf-binary')
  const quotaIndexReady=indexes.some(i=>i.indexname==='xartists_studio_media_wallet_created_idx'
    &&i.valid===true&&/USING btree \(wallet, created_at DESC\)$/.test(i.definition||''))
  return {
    ready:missingColumns.length===0&&invalidColumns.length===0&&statusReady&&mimeReady
      &&quotaIndexReady&&(!requireModel||modelReady),
    missingColumns,invalidColumns,statusReady,mimeReady,modelReady,quotaIndexReady,
  }
}
async function pgConnect(env){
  const {default:pg}=await import('pg')
  const client=new pg.Client({
    connectionString:env.DATABASE_URL,
    ssl:env.PGSSL==='0'?false:{rejectUnauthorized:true},
    connectionTimeoutMillis:3500,statement_timeout:3000,
    options:'-c default_transaction_read_only=on',
  })
  try{await client.connect()}catch(e){await client.end().catch(()=>{});throw e}
  return client
}
export async function inspectStudioDatabase({env=process.env,connect=pgConnect}={}){
  if(!String(env.DATABASE_URL||'').trim())
    return {ready:false,reason:'database_url_missing'}
  let client
  try{
    client=await connect(env)
    const table=await client.query(
      "SELECT to_regclass('public.xartists_studio_media') IS NOT NULL AS table_ready")
    if(table.rows[0]?.table_ready!==true)
      return {ready:false,reason:'migration_004_missing'}
    const [cols,constraints,index]=await Promise.all([
      client.query("SELECT column_name,udt_name FROM information_schema.columns WHERE table_schema='public' AND table_name='xartists_studio_media'"),
      client.query("SELECT conname,convalidated,pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid='public.xartists_studio_media'::regclass AND contype='c'"),
      client.query("SELECT i.relname AS indexname,ix.indisvalid AS valid,pg_get_indexdef(ix.indexrelid) AS definition FROM pg_index ix JOIN pg_class i ON i.oid=ix.indexrelid WHERE ix.indrelid='public.xartists_studio_media'::regclass"),
    ])
    const status=constraints.rows.find(c=>c.conname==='xartists_studio_media_status_check')
    const mime=constraints.rows.find(c=>c.conname==='xartists_studio_media_mime_check')
    const schema=validateStudioSchema({
      columns:cols.rows,statusDefinition:String(status?.definition||''),
      statusValidated:status?.convalidated,mimeDefinition:String(mime?.definition||''),
      mimeValidated:mime?.convalidated,indexes:index.rows,
      requireModel:env.STUDIO_GLB_UPLOAD_ENABLED==='1',
    })
    return {...schema,tableReady:true,reason:schema.ready?'verified':
      env.STUDIO_GLB_UPLOAD_ENABLED==='1'&&!schema.modelReady?'migration_006_missing':
      'studio_schema_incomplete'}
  }catch{
    // Never echo PostgreSQL exceptions: may contain hostnames, credentials or queries.
    return {ready:false,reason:'database_probe_failed'}
  }finally{
    if(client)await client.end().catch(()=>{})
  }
}
async function inspectPinata(env,request){
  const jwt=String(env.PINATA_JWT||'')
  if(jwt.length<40)return {ready:false,reason:'pinata_jwt_missing'}
  try{
    const response=await request('https://api.pinata.cloud/data/testAuthentication',{
      method:'GET',headers:{Authorization:'Bearer '+jwt},
      signal:AbortSignal.timeout(10000),
    })
    if(response.ok)return {ready:true,reason:'authentication_verified'}
    if(response.status===401||response.status===403)
      return {ready:false,reason:'pinata_auth_rejected'}
    return {ready:false,reason:'pinata_api_rejected'}
  }catch{
    return {ready:false,reason:'pinata_unreachable'}
  }
}
export async function checkStudioIpfsReadiness(
  {env=process.env,connect=pgConnect,request=fetch}={},
){
  const jwtSecret=String(env.ACCESS_JWT_SECRET||env.JWT_SECRET||'')
  const signingReady=jwtSecret.length>=16
  const [database,pinata]=await Promise.all([
    inspectStudioDatabase({env,connect}),inspectPinata(env,request),
  ])
  return {
    ok:signingReady&&database.ready&&pinata.ready,
    checks:{
      walletSession:{ready:signingReady,reason:signingReady?'configured':'jwt_secret_missing'},
      database,
      pinata,
      // Informational only. Never switch this flag within a preflight.
      publicUploadEnabled:env.CREATOR_MEDIA_UPLOAD_ENABLED==='1',
    },
    note:'read_only_preflight_not_a_pin_or_mint_proof',
  }
}
