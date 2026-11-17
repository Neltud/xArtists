/**
 * xArtists Free API proof — Neon Function, public staging only.
 * Standalone Fetch API; intentionally DOES NOT import Access API / Postgres.
 * No account, PII, signature, DB query, upload, mint, payment, mail or trading.
 * Its service identifier must never impersonate the full Access API.
 */
const SOURCE_SHA=/^[0-9a-f]{40}$/
const TRUSTED_ORIGINS=new Set(['https://xartists.art','https://www.xartists.art'])
const JSON_HEADERS=Object.freeze({
  'content-type':'application/json; charset=utf-8',
  'cache-control':'no-store, max-age=0',
  'x-content-type-options':'nosniff',
  'x-frame-options':'DENY',
  'referrer-policy':'no-referrer',
  'cross-origin-resource-policy':'cross-origin',
  'content-security-policy':"default-src 'none'; frame-ancestors 'none'",
})

function safeOrigin(request) {
  const origin=request.headers.get('origin')
  return origin && TRUSTED_ORIGINS.has(origin)?origin:null
}

function response(body,status,request,allow='GET, HEAD, OPTIONS') {
  const headers=new Headers(JSON_HEADERS)
  const origin=safeOrigin(request)
  if(origin){
    headers.set('access-control-allow-origin',origin)
    headers.set('access-control-allow-methods',allow)
    headers.set('access-control-allow-headers','content-type')
    headers.set('access-control-max-age','600')
  }
  headers.set('vary','Origin')
  if(allow==='GET, HEAD, OPTIONS')headers.set('allow',allow)
  const serialized=request.method==='HEAD'||status===204?null:JSON.stringify(body)
  if(status===204)headers.delete('content-type')
  return new Response(serialized,{status,headers})
}

export function createReadOnlyHandler({env=process.env}={}) {
  const sha=typeof env.XARTISTS_SOURCE_SHA==='string'&&SOURCE_SHA.test(env.XARTISTS_SOURCE_SHA)
    ?env.XARTISTS_SOURCE_SHA:null
  const safeStatus=Object.freeze({
    ok:true,
    service:'xartists-neon-readonly-staging',
    schema_version:1,
    mode:'staging-readonly',
    execution_authorized:false,
    source_sha:sha,
    backend_compatible_with_access_api:false,
    database_connected:false,
    mail_connected:false,
    accounts_enabled:false,
    studio_media_upload:'off',
    mint_live_enabled:false,
    mint_dry_run:true,
    paybox_checkout_enabled:false,
    stripe_live_checkout_enabled:false,
    auction_enabled:false,
    lia_live_trading:'0',
  })
  return {
    async fetch(request) {
      if(!(request instanceof Request))return new Response(null,{status:400})
      let url
      try{url=new URL(request.url)}catch{return response({ok:false,error:'invalid_request'},400,request)}
      // Reject invalid Origin even for public read-only APIs to avoid cross-site
      // browser use; clients without Origin (curl/monitoring) are still accepted.
      if(request.headers.has('origin')&&!safeOrigin(request)){
        return response({ok:false,error:'origin_not_allowed'},403,request)
      }
      if(request.method==='OPTIONS'){
        return response(null,204,request)
      }
      if(!['GET','HEAD'].includes(request.method)){
        return response({ok:false,error:'method_not_allowed'},405,request)
      }
      const path=url.pathname.replace(/\/+$/,'')||'/'
      if(path==='/health')return response(safeStatus,200,request)
      if(path==='/v1/ops/build-info'){
        return response({
          schema_version:1,
          service:'xartists-neon-readonly-staging',
          source_sha:sha,
          stamp_source:sha?'explicit-function-deploy':'unavailable',
          execution_authorized:false,
          backend_compatible_with_access_api:false,
        },200,request)
      }
      if(['/v1/ops/studio-store/status','/v1/ops/orders-store/status','/v1/studio/media/config'].includes(path)){
        return response({ok:false,enabled:false,reason:'full_backend_not_deployed'},503,request)
      }
      return response({ok:false,error:'route_not_available'},404,request)
    },
  }
}

export default createReadOnlyHandler()
