import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createAdminSessionBinder,
  assertChallengeIssuanceAllowed,
} from '../src/adminAuthSessionBinding.mjs'

const ADMIN='erd1kex0pvp9dng8j76sgsejkyx86nhxuqk24my6wnha8dga9mymvhxqvl8v0g'
const OTHER='erd1mmh2j5y8esv2tmmyeau3hr4xa2u2te3zc3j9wumn3v5vm8uvsczqnucj5l'
const SERVER='trusted_backend_session_123456789'
const proof={serverSessionId:SERVER,adminBech32:ADMIN,method:'siwx'}

// Mock only: in production the resolver must inspect a separately verified
// server-issued SIWX session. It cannot trust wallet identities from the input.
function verified(opts={}) {
  return createAdminSessionBinder({
    adminAllowlist:[ADMIN],nowMs:()=>1_700_000_000_000,
    verifyWalletSession:async({serverSessionId,adminBech32,method})=>{
      if(opts.deny) return {ok:false}
      if(serverSessionId!==SERVER||adminBech32!==ADMIN||method!=='siwx')return {ok:false}
      return {ok:true,sessionId:SERVER,admin:ADMIN,method:'siwx'}
    },...opts,
  })
}

test('paper session binder refuses bare address + wallet method by default',async()=>{
  const binder=createAdminSessionBinder({adminAllowlist:[ADMIN]})
  const result=await binder.bindSession({adminBech32:ADMIN,method:'siwx'})
  assert.equal(result.ok,false)
  assert.equal(result.error,'wallet_session_verifier_required')
  assert.equal(binder.size(),0)
})

test('rejects pasted identity, untrusted authentication methods, and missing SIWX server session',async()=>{
  const binder=verified()
  assert.equal((await binder.bindSession({adminBech32:ADMIN,method:'paste_readonly'})).error,
    'paste_identity_forbidden')
  assert.equal((await binder.bindSession({adminBech32:ADMIN,method:'magic_link'})).error,
    'unsupported_auth_method')
  assert.equal((await binder.bindSession({adminBech32:ADMIN,method:'siwx'})).error,
    'server_session_required')
  assert.equal(binder.size(),0)
})

test('only server-verified wallet session can be bound for the exact allowlisted owner',async()=>{
  const binder=verified()
  assert.equal((await binder.bindSession({...proof,adminBech32:OTHER})).error,'admin_not_allowlisted')
  assert.equal((await binder.bindSession({...proof,serverSessionId:'not_a_real_server_session_xxxxx'})).error,
    'wallet_session_not_verified')
  const bound=await binder.bindSession(proof)
  assert.equal(bound.ok,true)
  assert.equal(bound.mode,'paper_session_bound')
  assert.equal(assertChallengeIssuanceAllowed({
    binder,sessionId:bound.sessionId,adminBech32:ADMIN,atMs:1_700_000_000_100
  }).ok,true)
  assert.equal(assertChallengeIssuanceAllowed({
    binder,sessionId:bound.sessionId,adminBech32:OTHER,atMs:1_700_000_000_100
  }).error,'session_admin_mismatch')
})

test('fail closed when trusted session resolver explicitly rejects or throws',async()=>{
  const denied=verified({deny:true})
  assert.equal((await denied.bindSession(proof)).error,'wallet_session_not_verified')
  const crashed=createAdminSessionBinder({adminAllowlist:[ADMIN],
    verifyWalletSession:async()=>{throw Error('identity_provider_unavailable')}})
  assert.equal((await crashed.bindSession(proof)).error,'wallet_session_not_verified')
  assert.equal(crashed.size(),0)
})

test('expired sessions cannot issue new admin challenges',async()=>{
  let t=1_700_000_000_000
  const binder=createAdminSessionBinder({
    adminAllowlist:[ADMIN],nowMs:()=>t,
    verifyWalletSession:async()=>({ok:true,sessionId:SERVER,admin:ADMIN,method:'siwx'}),
  })
  const bound=await binder.bindSession({...proof,ttlMs:120_000})
  assert.equal(bound.ok,true)
  t+=120_001
  assert.equal(assertChallengeIssuanceAllowed({
    binder,sessionId:bound.sessionId,adminBech32:ADMIN,atMs:t
  }).error,'session_expired')
})

test('missing operator allowlist denies even a trusted resolver',async()=>{
  const binder=createAdminSessionBinder({verifyWalletSession:async()=>({
    ok:true,sessionId:SERVER,admin:ADMIN,method:'siwx',
  })})
  assert.equal((await binder.bindSession(proof)).error,'admin_not_allowlisted')
})

test('default locally bound IDs are cryptographically random 256-bit tokens',async()=>{
  const binder=verified()
  const a=await binder.bindSession(proof),b=await binder.bindSession(proof)
  assert.equal(a.ok,true)
  assert.equal(b.ok,true)
  assert.match(a.sessionId,/^[A-Za-z0-9_-]{43}$/)
  assert.match(b.sessionId,/^[A-Za-z0-9_-]{43}$/)
  assert.notEqual(a.sessionId,b.sessionId)
})
