/**
 * xArtists account pilot on Neon Free, isolated from production Access API.
 * Neon Auth provides a real verified identity. No payments, media writes,
 * wallet claims, fake account entitlements or email delivery here.
 */
import {createHash} from 'node:crypto'
import {createNeonAuthIdentityVerifier} from './neon-verifier.mjs'

const ORIGINS=new Set(['https://xartists.art','https://www.xartists.art'])
const SHA=/^[0-9a-f]{40}$/
const JSON_HEADERS={
  'content-type':'application/json; charset=utf-8',
  'cache-control':'private, no-store',
  'x-content-type-options':'nosniff',
  'referrer-policy':'no-referrer',
  'content-security-policy':"default-src 'none'; frame-ancestors 'none'",
}

function respond(request,status,payload,allow='GET, HEAD, OPTIONS'){
  const h=new Headers(JSON_HEADERS)
  const origin=request.headers.get('origin')
  if(origin&&ORIGINS.has(origin)){
    h.set('access-control-allow-origin',origin)
    h.set('access-control-allow-methods',allow)
    h.set('access-control-allow-headers','authorization, content-type')
    h.set('access-control-max-age','300')
  }
  h.set('vary','Origin')
  h.set('allow',allow)
  if(status===204)h.delete('content-type')
  return new Response(request.method==='HEAD'||status===204?null:JSON.stringify(payload),{status,headers:h})
}

export function createAccountPilot({env=process.env,verifier=undefined}={}){
  const sha=SHA.test(env.XARTISTS_SOURCE_SHA||'')?env.XARTISTS_SOURCE_SHA:null
  let verify=verifier
  if(verify===undefined){
    try{verify=createNeonAuthIdentityVerifier({baseUrl:env.NEON_AUTH_BASE_URL})}
    catch{verify=null}
  }
  return Object.freeze({
    async fetch(request){
      if(!(request instanceof Request))return new Response(null,{status:400})
      let path
      try{path=new URL(request.url).pathname}catch{return respond(request,400,{ok:false,error:'invalid_request'})}
      const origin=request.headers.get('origin')
      if(origin&&!ORIGINS.has(origin))return respond(request,403,{ok:false,error:'origin_not_allowed'})
      if(request.method==='OPTIONS')return respond(request,204,null)
      if(request.method!=='GET'&&request.method!=='HEAD')
        return respond(request,405,{ok:false,error:'method_not_allowed'})
      if(path==='/health')return respond(request,200,{
        ok:true,service:'xartists-neon-authenticated-pilot',source_sha:sha,
        environment:'sandbox',identity_provider:'neon-managed-auth',
        identity_verifier_configured:typeof verify==='function',
        database_mapping_enabled:false,studio_media_upload:'off',
        mint_live_enabled:false,stripe_live_checkout_enabled:false,paybox_checkout_enabled:false,
        trading_enabled:false,execution_authorized:false,
        production_access_api:false,
      })
      if(path==='/v1/studio/drafts/config')return respond(request,200,{
        ok:true,service:'xartists-neon-authenticated-pilot',
        storage_bucket:'xartists-studio-drafts',bucket_access:'private',
        upload_enabled:false,upload_authorized:false,
        reason:'signed_upload_pipeline_not_certified',mint_authorized:false,
      })
      if(path==='/v1/account/me'){
        if(typeof verify!=='function')return respond(request,503,{ok:false,error:'auth_verifier_unavailable'})
        const h=request.headers.get('authorization')||''
        if(h.length>8300||!h.startsWith('Bearer ')||h.slice(7).length<64)
          return respond(request,401,{ok:false,error:'verified_neon_identity_required'})
        let identity
        try{identity=await verify(h.slice(7))}
        catch{return respond(request,401,{ok:false,error:'verified_neon_identity_required'})}
        if(identity?.provider!=='email_oidc'||typeof identity.subject!=='string'||
          !identity.subject||typeof identity.verifiedAt!=='string')
          return respond(request,401,{ok:false,error:'verified_neon_identity_required'})
        const id='na_'+createHash('sha256').update(identity.subject,'utf8').digest('hex').slice(0,32)
        return respond(request,200,{
          ok:true,service:'xartists-neon-authenticated-pilot',
          account:{id,type:'email_verified',email_verified:true,walletLink:'not_checked',
            persisted_in_xartists_account_db:false},
          loginProvider:'neon-managed-auth',subscriptionAccess:'not_checked',
          xorusPrivateAccess:'not_checked',checkoutAuthorized:false,
          mintAuthorized:false,nftEntitlement:false,
        })
      }
      return respond(request,404,{ok:false,error:'route_not_available'})
    },
  })
}
export default createAccountPilot()
