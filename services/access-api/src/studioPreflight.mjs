/** Studio/Pinata read-only preflight. No upload, mutation, or secret disclosure.
 * Usage via scripts/check-studio-ipfs.mjs on the confirmed Render-linked service.
 */
const REQUIRED_COLUMNS=Object.freeze([
  'id','wallet','mime','bytes','sha256','uri','status','created_at',
  'metadata_uri','metadata_sha256',
])
export function validateStudioSchema({columns=[],statusDefinition='',indexes=[]}={}){
  const names=new Set(columns)
  const missingColumns=REQUIRED_COLUMNS.filter(name=>!names.has(name))
  const statusReady=/metadata_pinning/.test(statusDefinition)
    && /reserved/.test(statusDefinition) && /pinned/.test(statusDefinition)
  const quotaIndexReady=indexes.includes('xartists_studio_media_wallet_created_idx')
  return {
    ready:missingColumns.length===0&&statusReady&&quotaIndexReady,
    missingColumns,statusReady,quotaIndexReady,
  }
}
async function pgConnect(env){
  const {default:pg}=await import('pg')
  const client=new pg.Client({
    connectionString:env.DATABASE_URL,
    ssl:env.PGSSL==='0'?false:{rejectUnauthorized:true},
    connectionTimeoutMillis:7000,statement_timeout:8000,
  })
  await client.connect()
  return client
}
async function inspectDatabase(env,connect){
  if(!String(env.DATABASE_URL||'').trim())
    return {ready:false,reason:'database_url_missing'}
  let client
  try{
    client=await connect(env)
    const table=await client.query(
      "SELECT to_regclass('public.xartists_studio_media') IS NOT NULL AS table_ready")
    if(table.rows[0]?.table_ready!==true)
      return {ready:false,reason:'migration_004_missing'}
    const [cols,status,index]=await Promise.all([
      client.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='xartists_studio_media'"),
      client.query("SELECT pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid='public.xartists_studio_media'::regclass AND conname='xartists_studio_media_status_check'"),
      client.query("SELECT indexname FROM pg_indexes WHERE schemaname='public' AND tablename='xartists_studio_media'"),
    ])
    const schema=validateStudioSchema({
      columns:cols.rows.map(r=>r.column_name),
      statusDefinition:String(status.rows[0]?.definition||''),
      indexes:index.rows.map(r=>r.indexname),
    })
    return {...schema,reason:schema.ready?'verified':'migration_005_or_index_incomplete'}
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
    inspectDatabase(env,connect),inspectPinata(env,request),
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
