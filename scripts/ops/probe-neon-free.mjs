/** No secrets, no redirects, no writes. Probe only Neon's pinned public staging function. */
const EXPECTED_ORIGIN='https://br-steep-sun-bab7l93p-xartistsfree.compute.c-8.eu-central-1.aws.neon.tech'
const EXPECTED_SHA='07d7574da70d3ddd49b6c64d128e154aed1539cf'
const ORIGIN='https://xartists.art'

async function get(path,fetchFn=fetch){
  const response=await fetchFn(EXPECTED_ORIGIN+path,{
    method:'GET',redirect:'error',cache:'no-store',
    headers:{Origin:ORIGIN,Accept:'application/json'},
    signal:AbortSignal.timeout(12000),
  })
  if(response.status!==200 && response.status!==503)throw Error('unexpected_http_status')
  if(!String(response.headers.get('content-type')||'').includes('application/json'))throw Error('unexpected_content_type')
  if(response.headers.get('access-control-allow-origin')!==ORIGIN)throw Error('cors_unverified')
  const body=await response.json()
  if(!body||Array.isArray(body)||typeof body!=='object')throw Error('invalid_response')
  return {status:response.status,body}
}

export async function probeNeonFree(fetchFn=fetch){
  const [health,build,studio,orders,media]=await Promise.all([
    get('/health',fetchFn),get('/v1/ops/build-info',fetchFn),
    get('/v1/ops/studio-store/status',fetchFn),
    get('/v1/ops/orders-store/status',fetchFn),
    get('/v1/studio/media/config',fetchFn),
  ])
  const h=health.body,b=build.body
  if(health.status!==200||build.status!==200||
    h.service!=='xartists-neon-readonly-staging'||b.service!==h.service||
    h.source_sha!==EXPECTED_SHA||b.source_sha!==EXPECTED_SHA||
    h.backend_compatible_with_access_api!==false||b.backend_compatible_with_access_api!==false||
    h.execution_authorized!==false||b.execution_authorized!==false||
    h.accounts_enabled!==false||h.mail_connected!==false||h.database_connected!==false||
    h.studio_media_upload!=='off'||h.mint_live_enabled!==false||
    h.paybox_checkout_enabled!==false||h.stripe_live_checkout_enabled!==false||
    h.auction_enabled!==false||h.lia_live_trading!=='0'||h.mint_dry_run!==true)
    throw Error('identity_or_safety_not_verified')
  for(const blocked of [studio,orders,media]){
    if(blocked.status!==503||blocked.body.ok!==false||
      blocked.body.enabled!==false||blocked.body.reason!=='full_backend_not_deployed')
      throw Error('disabled_routes_not_verified')
  }
  return Object.freeze({ok:true,host:EXPECTED_ORIGIN,source_sha:EXPECTED_SHA,
    service:'xartists-neon-readonly-staging',accounts:'off',upload:'off',commerce:'off',
    production_access_api:false,ovh_mail_untouched:true})
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
  try{console.log(JSON.stringify(await probeNeonFree(),null,2))}
  catch(e){console.error('neon_free_probe_failed:',e instanceof Error?e.message:'unknown');process.exitCode=1}
}
