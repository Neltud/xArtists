/** External, no-secret/no-login read-only proof of the deployed Neon Auth pilot. */
const BASE='https://br-steep-sun-bab7l93p-xartistsauthpilot.compute.c-8.eu-central-1.aws.neon.tech'
const SHA='e2a39d406b67e16dea220e0b2d08548bbd26a36f'
const ORIGIN='https://xartists.art'
async function get(path,origin=ORIGIN,fetchFn=fetch){
  const r=await fetchFn(BASE+path,{method:'GET',redirect:'error',cache:'no-store',
    headers:{Origin:origin,Accept:'application/json'},signal:AbortSignal.timeout(10000)})
  const ct=r.headers.get('content-type')||''
  if(!ct.includes('application/json'))throw Error('non_json_response')
  if(origin===ORIGIN&&r.headers.get('access-control-allow-origin')!==ORIGIN)
    throw Error('cors_not_verified')
  if(origin!==ORIGIN&&r.headers.get('access-control-allow-origin')!==null)
    throw Error('untrusted_origin_reflected')
  const body=await r.json()
  if(!body||typeof body!=='object'||Array.isArray(body))throw Error('malformed_response')
  return {status:r.status,body}
}
export async function probeNeonAuthPilot(fetchFn=fetch){
  const [health,me,drafts,badOrigin]=await Promise.all([
    get('/health',ORIGIN,fetchFn),
    get('/v1/account/me',ORIGIN,fetchFn),
    get('/v1/studio/drafts/config',ORIGIN,fetchFn),
    get('/v1/account/me','https://evil.example',fetchFn),
  ])
  const h=health.body
  if(health.status!==200||h.ok!==true||
    h.service!=='xartists-neon-authenticated-pilot'||
    h.source_sha!==SHA||h.environment!=='sandbox'||
    h.identity_verifier_configured!==true||
    h.database_mapping_enabled!==false||
    h.studio_media_upload!=='off'||h.mint_live_enabled!==false||
    h.stripe_live_checkout_enabled!==false||
    h.paybox_checkout_enabled!==false||h.trading_enabled!==false||
    h.execution_authorized!==false||h.production_access_api!==false)
    throw Error('pilot_identity_or_safety_unverified')
  if(me.status!==401||me.body.error!=='verified_neon_identity_required')
    throw Error('account_unauthenticated_access_unverified')
  if(drafts.status!==200||drafts.body.storage_bucket!=='xartists-studio-drafts'||
    drafts.body.bucket_access!=='private'||drafts.body.upload_enabled!==false||
    drafts.body.upload_authorized!==false||drafts.body.mint_authorized!==false)
    throw Error('private_storage_gate_unverified')
  if(badOrigin.status!==403||badOrigin.body.error!=='origin_not_allowed')
    throw Error('foreign_origin_not_rejected')
  return Object.freeze({ok:true,service:h.service,source_sha:SHA,
    anonymous_account_access:'denied',storage:'private_upload_off',
    mint:'off',payments:'off',production_access_api:false})
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
  try{console.log(JSON.stringify(await probeNeonAuthPilot(),null,2))}
  catch(e){console.error('neon_auth_pilot_probe_failed:',e instanceof Error?e.message:'unknown');process.exitCode=1}
}
