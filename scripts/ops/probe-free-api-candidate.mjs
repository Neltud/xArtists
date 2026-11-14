/**
 * Read-only preflight for an independently hosted xArtists Access API.
 * Does not update DNS, deploy, migrate, authorize payments, send mail,
 * mint, login or sign transactions. Never fetches arbitrary network URLs:
 * only an exact operator-controlled xartists.art API hostname.
 */
const SHA=/^[0-9a-f]{40}$/
const ALLOWED_HOSTS=new Set(['api-staging.xartists.art','api.xartists.art'])
const TIMEOUT_MS=8000

export function validateCandidateUrl(value){
  let url
  try{url=new URL(value)}catch{throw Error('candidate_invalid_url')}
  if(url.protocol!=='https:'||!ALLOWED_HOSTS.has(url.hostname)||
    url.port||url.username||url.password||url.search||url.hash||
    url.pathname!=='/'||url.href!==`https://${url.hostname}/`)
    throw Error('candidate_unapproved_https_host')
  return url.origin
}

export function evaluateCandidate({health,build,studio,orders,expectedSha}){
  if(!SHA.test(expectedSha||''))throw Error('candidate_expected_sha_required')
  if(!health||!build||health.ok!==true||build.ok!==true||
    health.service!=='access-api'||build.service!=='access-api'||
    health.source_sha!==expectedSha||build.source_sha!==expectedSha||
    build.execution_authorized!==false)
    throw Error('candidate_identity_unverified')
  // Every optional/noncommercial capability must remain independently OFF.
  const forbidden=[
    'mint_live_enabled','mint_dispatch_enabled','mint_oidc_pull_enabled',
    'stripe_live_checkout_enabled','paybox_checkout_enabled',
    'auction_enabled','auction_demo_writes_enabled',
    'walletless_account_session_enabled','xorus_private_analysis_enabled',
  ]
  if(forbidden.some(key=>health[key]!==false)||
    health.lia_live_trading!=='0'||
    health.mint_dry_run!==true||
    health.require_siwx!==true||
    health.studio_media_upload!=='off'||
    health.tro_solana_bridge!=='off'||
    health.opensea_order_execution_enabled!==false||
    health.auction_settle!==false)
    throw Error('candidate_financial_or_upload_gate_unsafe')
  const store=status=>{
    if(!status||typeof status!=='object'||!([200,503].includes(status.httpStatus))||
      typeof status.body?.ok!=='boolean')return 'unknown'
    if(status.httpStatus===200&&status.body.ok===true)return 'probe_passed'
    if(status.httpStatus===503&&status.body.ok===false)return 'not_ready'
    return 'unknown'
  }
  return Object.freeze({
    candidate_identity_verified:true,
    source_sha:expectedSha,
    commercial_operations:'off',
    studio_schema:store(studio),
    orders_schema:store(orders),
    production_commerce_go:false,
    cutover_status:'manual_review_required',
  })
}

async function readJson(url,fetchFn=fetch){
  const resp=await fetchFn(url,{
    method:'GET',redirect:'error',cache:'no-store',
    headers:{Accept:'application/json'},
    signal:AbortSignal.timeout(TIMEOUT_MS),
  })
  if(resp.status!==200&&resp.status!==503)
    throw Error('candidate_unexpected_http_status')
  const ct=String(resp.headers.get('content-type')||'')
  if(!ct.toLowerCase().includes('application/json'))
    throw Error('candidate_unexpected_content_type')
  const body=await resp.json()
  if(!body||typeof body!=='object'||Array.isArray(body))
    throw Error('candidate_unexpected_json')
  return {httpStatus:resp.status,body}
}

export async function probeCandidate({origin,expectedSha,fetchFn=fetch}){
  const base=validateCandidateUrl(origin)
  if(!SHA.test(expectedSha||''))throw Error('candidate_expected_sha_required')
  const [health,build,studio,orders]=await Promise.all([
    readJson(base+'/health',fetchFn),
    readJson(base+'/v1/ops/build-info',fetchFn),
    readJson(base+'/v1/ops/studio-store/status',fetchFn),
    readJson(base+'/v1/ops/orders-store/status',fetchFn),
  ])
  if(health.httpStatus!==200||build.httpStatus!==200)
    throw Error('candidate_health_or_identity_unavailable')
  return evaluateCandidate({
    health:health.body,build:build.body,studio,orders,expectedSha,
  })
}

if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
  const args=process.argv.slice(2)
  const urlIndex=args.indexOf('--url'),shaIndex=args.indexOf('--sha')
  const origin=urlIndex>=0?args[urlIndex+1]:null
  const expectedSha=shaIndex>=0?args[shaIndex+1]:null
  try{
    const result=await probeCandidate({origin,expectedSha})
    // Deliberately output only a safe, derived status — never raw API JSON,
    // account data, headers, connection strings or credentials.
    console.log(JSON.stringify(result,null,2))
  }catch(error){
    const message=error instanceof Error?error.message:'candidate_probe_failed'
    const allowed=/^candidate_[a-z_]+$/.test(message)?message:'candidate_probe_failed'
    console.error(allowed)
    process.exitCode=1
  }
}
