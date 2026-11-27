import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createNeonAccountApi,NEON_ACCOUNT_TARGET} from '../src/neonAccountApi.mjs'
import {neonAccountFixture,accountRequest} from './fixtures/neon-account-fixture.mjs'

const id='550e8400-e29b-41d4-a716-446655440000'
const ready={rows:[{accounts:true,identities:true,wallets:true,subscriptions:true}]}

test('default OFF refuses account routes without loading pg, verifying JWTs or opening SQL',async()=>{
  let touched=0
  const app=createNeonAccountApi({env:{LIA_LIVE_TRADING:'1',XORUS_ASSISTED_SWAP_ENABLED:'1'},
    verifierFactory:()=>{touched++;throw Error('unexpected')},
    poolFactory:()=>{touched++;throw Error('unexpected')},
  })
  for(const [path,method,error] of [
    ['/v1/account/me','GET','account_profile_not_enabled'],
    ['/v1/account/session','POST','account_session_not_enabled'],
  ]){
    const response=await accountRequest(app,path,{method})
    assert.equal(response.status,503)
    assert.equal((await response.json()).error,error)
  }
  const h=await (await accountRequest(app,'/health')).json()
  assert.equal(h.environment,'sandbox')
  for(const key of ['production_access_api','replaces_full_access_api',
    'walletless_account_session_enabled','account_profile_enabled','mint_live_enabled',
    'paybox_checkout_enabled','stripe_live_checkout_enabled','assisted_swap_enabled',
    'trading_enabled','execution_authorized'])assert.equal(h[key],false,key)
  assert.equal(touched,0)
})

test('both gates, exact branch, auth instance and dedicated pooled DB role are required',async()=>{
  const f=neonAccountFixture()
  const dsn=new URL(f.env.XARTISTS_ACCOUNT_DATABASE_URL)
  const changeDsn=change=>{const u=new URL(dsn);change(u);return u.href}
  const cases=[
    {WALLETLESS_ACCOUNT_SESSION_ENABLED:'0'},
    {WALLETLESS_DATABASE_TARGET_CONFIRMED:'0'},
    {NEON_BRANCH_ID:'another-branch'},
    {NEON_AUTH_BASE_URL:'https://another.neon.tech/another/auth'},
    {XARTISTS_ACCOUNT_DATABASE_URL:''},
    {XARTISTS_ACCOUNT_DATABASE_URL:changeDsn(u=>{u.hostname='another.neon.tech'})},
    {XARTISTS_ACCOUNT_DATABASE_URL:changeDsn(u=>{u.pathname='/neondb'})},
    {XARTISTS_ACCOUNT_DATABASE_URL:changeDsn(u=>{u.username='neondb_owner'})},
    {XARTISTS_ACCOUNT_DATABASE_URL:changeDsn(u=>{u.search='?sslmode=disable'})},
    {XARTISTS_ACCOUNT_DATABASE_URL:changeDsn(u=>{u.search+='&options=unsafe'})},
  ]
  for(const change of cases){
    let touched=0
    const app=createNeonAccountApi({env:{...f.env,...change},
      verifierFactory:()=>{touched++;throw Error('unexpected')},
      poolFactory:()=>{touched++;throw Error('unexpected')},
    })
    assert.equal((await accountRequest(app,'/v1/account/session',{
      method:'POST',token:f.token(),
    })).status,503,JSON.stringify(Object.keys(change)))
    assert.equal(touched,0)
  }
})

test('anonymous, tampered, expired, wrong issuer/audience and unverified email never open SQL',async()=>{
  const f=neonAccountFixture()
  let opened=0
  const app=createNeonAccountApi({...f,poolFactory:async()=>{opened++;throw Error('unexpected')}})
  for(const token of [undefined,'garbage',f.token().replace(/.$/,'!'),
    f.token('artist-a',{exp:f.now-1}),f.token('artist-a',{emailVerified:false}),
    f.token('artist-a',{iss:'https://attacker.example'}),
    f.token('artist-a',{aud:'https://attacker.example'}),f.token('artist-a',{banned:true}),
    neonAccountFixture().token(),
  ]){
    for(const [path,method] of [['/v1/account/me','GET'],['/v1/account/session','POST']])
      assert.equal((await accountRequest(app,path,{method,token})).status,401)
  }
  assert.equal(opened,0)
})

test('GET/HEAD only read the verified subject, share a pool and never create an account',async()=>{
  const f=neonAccountFixture()
  const queries=[]
  let opened=0
  const pool={query:async(sql,params=[])=>{
    queries.push({sql,params})
    if(sql.includes('to_regclass'))return ready
    if(sql.includes('xa_account_identities')){
      assert.equal(params[0],'email_oidc')
      return {rows:params[1].endsWith('#artist-a')?[{id}]:[]}
    }
    if(sql.includes('SELECT id,created_at'))return {rows:[{id,created_at:new Date()}]}
    if(sql.includes('xa_account_wallets'))return {rows:[]}
    throw Error('unexpected_query')
  }}
  const app=createNeonAccountApi({...f,poolFactory:async connection=>{
    opened++
    assert.equal(new URL(connection).search,'','TLS URL options cannot override pool validation')
    return pool
  }})
  const responses=await Promise.all(Array.from({length:5},()=>
    accountRequest(app,'/v1/account/me',{token:f.token()})))
  for(const response of responses){
    assert.equal(response.status,200)
    const body=await response.json()
    assert.deepEqual(body.account,{id,type:'walletless',linkedWalletCount:0})
    for(const key of ['mintAuthorized','checkoutAuthorized','nftEntitlement'])
      assert.equal(body[key],false)
    assert.doesNotMatch(JSON.stringify(body),/private@example|artist-a|provider_subject/)
    assert.equal(response.headers.get('cache-control'),'private, no-store')
    assert.equal(response.headers.get('access-control-allow-origin'),'https://xartists.art')
    assert.equal(response.headers.get('access-control-allow-credentials'),null)
  }
  const head=await accountRequest(app,'/v1/account/me',{method:'HEAD',token:f.token()})
  assert.equal(head.status,200)
  assert.equal(await head.text(),'')
  assert.equal((await accountRequest(app,'/v1/account/me',{token:f.token('artist-b')})).status,404)
  assert.equal(opened,1)
  assert.equal(queries.filter(q=>q.sql.includes('to_regclass')).length,1)
  assert.ok(queries.every(q=>q.sql.startsWith('SELECT ')))
})

test('missing schema, pool failures and repository errors fail closed without credential details',async()=>{
  const f=neonAccountFixture()
  const secret='postgres://private:secret@internal-host.example'
  for(const poolFactory of [
    async()=>{throw Error(secret)},
    async()=>({query:async()=>{throw Error(secret)}}),
    async()=>({query:async()=>({rows:[{...ready.rows[0],accounts:false}]})}),
    async()=>({query:async sql=>{
      if(sql.includes('to_regclass'))return ready
      throw Error(secret)
    }}),
  ]){
    const app=createNeonAccountApi({...f,poolFactory})
    for(const [path,method] of [['/v1/account/me','GET'],['/v1/account/session','POST']]){
      const response=await accountRequest(app,path,{method,token:f.token()})
      assert.equal(response.status,503)
      assert.doesNotMatch(await response.text(),/secret|internal-host|postgres:/)
    }
  }
})

test('query/body spoofing, cookies, unsafe methods and foreign origins cannot select an account',async()=>{
  const f=neonAccountFixture()
  let opened=0
  const app=createNeonAccountApi({...f,poolFactory:async()=>{opened++;throw Error('unexpected')}})
  for(const [path,options,status] of [
    ['/v1/account/me?user_id='+id,{token:f.token()},400],
    ['/v1/account/session',{method:'POST',token:f.token(),body:JSON.stringify({userId:id})},400],
    ['/v1/account/session',{method:'POST',token:f.token(),headers:{'transfer-encoding':'chunked'}},400],
    ['/v1/account/me',{headers:{cookie:'session=fake'}},401],
    ['/v1/account/me',{method:'POST',token:f.token()},405],
    ['/v1/account/session',{token:f.token()},405],
    ['/v1/account/me',{token:f.token(),headers:{origin:'https://xartists.art.evil.test'}},403],
    ['/v1/account/me',{token:f.token(),headers:{origin:'null'}},403],
    ['/v1/account/wallet',{method:'POST',token:f.token()},404],
    ['/v1/studio/media/upload',{method:'POST',token:f.token()},404],
    ['/v1/xorus/assisted-swap',{method:'POST'},404],
  ])assert.equal((await accountRequest(app,path,options)).status,status,path)
  assert.equal(opened,0)
})

test('preflight is route-specific and rejects unknown origins, headers or methods',async()=>{
  const app=createNeonAccountApi({env:{}})
  const ok=await accountRequest(app,'/v1/account/session',{method:'OPTIONS',headers:{
    'access-control-request-method':'POST','access-control-request-headers':'Authorization, Content-Type',
  }})
  assert.equal(ok.status,204)
  assert.equal(ok.headers.get('access-control-allow-methods'),'POST, OPTIONS')
  assert.equal(await ok.text(),'')
  assert.equal((await accountRequest(app,'/v1/account/me',{method:'OPTIONS',headers:{
    'access-control-request-method':'DELETE',
  }})).status,405)
  assert.equal((await accountRequest(app,'/v1/account/session',{method:'OPTIONS',headers:{
    'access-control-request-headers':'X-User-Id',
  }})).status,403)
  const foreign=await accountRequest(app,'/health',{headers:{origin:'https://evil.example'}})
  assert.equal(foreign.status,403)
  assert.equal(foreign.headers.get('access-control-allow-origin'),null)
  assert.equal(NEON_ACCOUNT_TARGET.project,'orange-dust-23862418')
})
