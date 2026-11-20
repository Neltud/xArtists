/** No token, no user data, no writes: prove the isolated account API stays OFF. */
import {pathToFileURL} from 'node:url'

const BASE='https://br-steep-sun-bab7l93p-xartistsaccounts.compute.c-8.eu-central-1.aws.neon.tech'
const ORIGIN='https://xartists.art'
const OFF=['production_access_api','replaces_full_access_api',
  'walletless_account_session_enabled','account_profile_enabled','mint_live_enabled',
  'paybox_checkout_enabled','stripe_live_checkout_enabled','assisted_swap_enabled',
  'trading_enabled','execution_authorized']

export async function probeNeonAccountsOff({expectedSha,fetchImpl=fetch}={}){
  if(!/^[a-f0-9]{40}$/.test(expectedSha||''))throw Error('expected_source_sha_required')
  const checks=[
    ['/health','GET',ORIGIN,200],
    ['/v1/ops/build-info','GET',ORIGIN,200],
    ['/v1/account/me','GET',ORIGIN,503,'account_profile_not_enabled'],
    ['/v1/account/session','POST',ORIGIN,503,'account_session_not_enabled'],
    ['/v1/account/me','POST',ORIGIN,405,'method_not_allowed'],
    ['/v1/account/session','OPTIONS',ORIGIN,204],
    ['/health','GET','https://evil.example',403,'origin_not_allowed'],
  ]
  const results=await Promise.all(checks.map(async([path,method,origin,status,error])=>{
    const response=await fetchImpl(BASE+path,{method,redirect:'error',cache:'no-store',
      headers:{Origin:origin,Accept:'application/json',
        ...(method==='OPTIONS'?{'Access-Control-Request-Method':'POST'}:{})},
      signal:AbortSignal.timeout(10000),
    })
    if(response.status!==status)throw Error('unexpected_status_'+method+'_'+path)
    const headers=response.headers
    if(headers.get('access-control-allow-origin')!==(origin===ORIGIN?ORIGIN:null)||
      headers.get('access-control-allow-credentials')!==null||
      !headers.get('cache-control')?.includes('no-store'))throw Error('response_policy_unverified')
    if(status!==204){
      if(!headers.get('content-type')?.includes('application/json'))throw Error('non_json_response')
      const body=await response.json()
      if(error&&body?.error!==error)throw Error('route_denial_unverified')
      if(status===200&&(body?.ok!==true||body.service!=='xartists-neon-account-api'||
        body.environment!=='sandbox'||body.source_sha!==expectedSha||
        body.studio_media_upload!=='off'||OFF.some(key=>body[key]!==false)))
        throw Error('account_safety_or_source_unverified')
    }
    return {path,method,status:response.status}
  }))
  return {ok:true,source_sha:expectedSha,environment:'sandbox',
    account_routes:'off',production_access_api:false,checks:results}
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{
    console.log(JSON.stringify(await probeNeonAccountsOff({
      expectedSha:process.env.XARTISTS_EXPECTED_SOURCE_SHA,
    }),null,2))
  }catch(error){
    console.error('neon_accounts_off_probe_failed:',error instanceof Error?error.message:'unknown')
    process.exitCode=1
  }
}
