/** Neon sandbox adapter for the existing account-only services. No commerce. */
import {
  findExistingAccountForVerifiedIdentity,
  findOrCreateAccountForVerifiedIdentity,
  readAccountProjection,
} from './accountRepository.mjs'
import {createNeonAuthIdentityVerifier} from './neonAuthIdentity.mjs'
import {createWalletlessAccountProfileService} from './walletlessProfile.mjs'
import {createWalletlessSchemaProbe} from './walletlessSchemaProbe.mjs'
import {createWalletlessSessionService} from './walletlessSession.mjs'

// Reviewed sandbox only. Changing targets requires a separate rollout review.
export const NEON_ACCOUNT_TARGET=Object.freeze({
  project:'orange-dust-23862418',
  branch:'br-steep-sun-bab7l93p',
  database:'xartists_access',
  role:'xartists_accounts_app',
  pooledHost:'ep-hidden-river-ba480qcb-pooler.c-8.eu-central-1.aws.neon.tech',
  authBase:'https://ep-hidden-river-ba480qcb.neonauth.c-8.eu-central-1.aws.neon.tech/xartists_access/auth',
})
const ORIGINS=new Set(['https://xartists.art','https://www.xartists.art'])
const JWT=/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/
const SERVICE='xartists-neon-account-api'
const SHA=/^[a-f0-9]{40}$/
const METHODS=new Map([
  ['/health',['GET','HEAD','OPTIONS']],
  ['/v1/ops/build-info',['GET','HEAD','OPTIONS']],
  ['/v1/account/session',['POST','OPTIONS']],
  ['/v1/account/me',['GET','HEAD','OPTIONS']],
])

function connectionForTarget(env){
  try{
    const t=NEON_ACCOUNT_TARGET
    if(env.NEON_BRANCH_ID!==t.branch||env.NEON_AUTH_BASE_URL!==t.authBase)return null
    // Never silently use the Neon-injected owner credential. Provision this
    // application role explicitly, restricted to the account tables, first.
    const url=new URL(env.XARTISTS_ACCOUNT_DATABASE_URL)
    if(!['postgres:','postgresql:'].includes(url.protocol)||
      url.hostname!==t.pooledHost||url.pathname!=='/'+t.database||
      decodeURIComponent(url.username)!==t.role||!url.password||
      (url.port&&url.port!=='5432')||url.hash||
      [...url.searchParams.keys()].some(k=>k!=='sslmode')||
      !['require','verify-full'].includes(url.searchParams.get('sslmode')))
      return null
    // pg connection-string SSL options override its explicit ssl object.
    // Strip them and require CA verification in the pool factory below.
    url.search=''
    return url.href
  }catch{return null}
}

async function openPool(connectionString){
  const {default:pg}=await import('pg')
  const pool=new pg.Pool({connectionString,ssl:{rejectUnauthorized:true},max:3,
    connectionTimeoutMillis:3000,idleTimeoutMillis:10000,
    statement_timeout:5000,query_timeout:6000})
  // Idle disconnections must not crash an isolate or print DSNs/user data.
  pool.on('error',()=>console.error('neon_account_pool_idle_error'))
  return pool
}

function respond(request,status,body,methods){
  const headers=new Headers({
    'content-type':'application/json; charset=utf-8',
    'cache-control':'private, no-store',
    'x-content-type-options':'nosniff',
    'referrer-policy':'no-referrer',
    'content-security-policy':"default-src 'none'; frame-ancestors 'none'",
    vary:'Origin',
  })
  const origin=request.headers.get('origin')
  if(origin&&ORIGINS.has(origin)){
    headers.set('access-control-allow-origin',origin)
    headers.set('access-control-allow-methods',methods.join(', '))
    headers.set('access-control-allow-headers','authorization, content-type')
    headers.set('access-control-max-age','300')
  }
  if(status===405)headers.set('allow',methods.join(', '))
  if(status===204)headers.delete('content-type')
  return new Response(request.method==='HEAD'||status===204?null:JSON.stringify(body),{status,headers})
}

export function createNeonAccountApi({
  env=process.env,poolFactory=openPool,verifierFactory=createNeonAuthIdentityVerifier,
}={}){
  const wantsAccounts=env.WALLETLESS_ACCOUNT_SESSION_ENABLED==='1'&&
    env.WALLETLESS_DATABASE_TARGET_CONFIRMED==='1'
  const connectionString=wantsAccounts?connectionForTarget(env):null
  let verify=null
  if(connectionString){
    try{verify=verifierFactory({baseUrl:env.NEON_AUTH_BASE_URL})}catch{}
  }
  const enabled=Boolean(connectionString&&typeof verify==='function')
  const sha=SHA.test(env.XARTISTS_SOURCE_SHA||'')?env.XARTISTS_SOURCE_SHA:null
  let runtime=null
  // One shared pool per isolate, created only AFTER verified authentication.
  async function accountRuntime(){
    if(!runtime){
      runtime=Promise.resolve().then(()=>poolFactory(connectionString)).then(pool=>({
        pool,schema:createWalletlessSchemaProbe({enabled:true,pool}),
      })).catch(error=>{runtime=null;throw error})
    }
    return runtime
  }
  const safety=Object.freeze({
    service:SERVICE,environment:'sandbox',source_sha:sha,
    production_access_api:false,replaces_full_access_api:false,
    walletless_account_session_enabled:enabled,account_profile_enabled:enabled,
    studio_media_upload:'off',mint_live_enabled:false,
    paybox_checkout_enabled:false,stripe_live_checkout_enabled:false,
    assisted_swap_enabled:false,trading_enabled:false,execution_authorized:false,
  })
  return Object.freeze({
    async fetch(request){
      if(!(request instanceof Request))return new Response(null,{status:400})
      const url=new URL(request.url)
      const methods=METHODS.get(url.pathname)||['OPTIONS']
      const send=(status,body)=>respond(request,status,body,methods)
      const deny=(status,error)=>send(status,{ok:false,error})
      const origin=request.headers.get('origin')
      if(origin&&!ORIGINS.has(origin))return deny(403,'origin_not_allowed')
      if(!METHODS.has(url.pathname))return deny(404,'route_not_available')
      if(!methods.includes(request.method))return deny(405,'method_not_allowed')
      if(url.search||url.hash)return deny(400,'query_not_supported')
      if(request.method==='OPTIONS'){
        const desired=request.headers.get('access-control-request-method')
        if(desired&&!methods.includes(desired))return deny(405,'method_not_allowed')
        const requested=(request.headers.get('access-control-request-headers')||'')
          .split(',').map(h=>h.trim().toLowerCase()).filter(Boolean)
        if(requested.some(h=>!['authorization','content-type'].includes(h)))
          return deny(403,'header_not_allowed')
        return send(204,null)
      }
      if(url.pathname==='/health'||url.pathname==='/v1/ops/build-info')
        return send(200,{ok:true,...safety})
      const session=url.pathname==='/v1/account/session'
      if(!enabled)return deny(503,session?'account_session_not_enabled':'account_profile_not_enabled')
      // Neither route accepts client identity, wallet, account ID or cookies.
      if(request.body!==null||request.headers.has('transfer-encoding')||
        (request.headers.has('content-length')&&request.headers.get('content-length')!=='0'))
        return deny(400,'body_not_supported')
      const authorization=request.headers.get('authorization')||''
      const token=authorization.startsWith('Bearer ')?authorization.slice(7):''
      if(token.length<64||token.length>8192||!JWT.test(token))
        return deny(401,'neon_token_required')
      let identity
      try{identity=await verify(token)}catch{return deny(401,'identity_not_verified')}
      if(identity?.provider!=='email_oidc'||typeof identity.subject!=='string'||
        !identity.subject||identity.subject.length>512||
        typeof identity.verifiedAt!=='string'||!Number.isFinite(Date.parse(identity.verifiedAt)))
        return deny(401,'identity_not_verified')
      let store
      try{
        store=await accountRuntime()
        if(!await store.schema.check())throw Error('account_schema_unavailable')
      }catch{return deny(503,'account_store_unavailable')}
      if(session){
        const service=createWalletlessSessionService({enabled:true,
          originAllowed:o=>ORIGINS.has(o),
          resolveVerifiedAccount:()=>findOrCreateAccountForVerifiedIdentity(store.pool,identity),
        })
        const result=await service.exchange({authorization,origin,contentLength:'0'})
        return send(result.status,{...result.body,mintAuthorized:false})
      }
      const service=createWalletlessAccountProfileService({enabled:true,
        originAllowed:o=>ORIGINS.has(o),
        lookupVerifiedProfile:async()=>{
          const id=await findExistingAccountForVerifiedIdentity(store.pool,identity)
          return id?readAccountProjection(store.pool,id):null
        },
      })
      const result=await service.read({authorization,origin})
      return send(result.status,result.body)
    },
  })
}
