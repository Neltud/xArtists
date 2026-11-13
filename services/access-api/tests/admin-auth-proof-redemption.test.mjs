import test from 'node:test'
import assert from 'node:assert/strict'
import {generateKeyPairSync} from 'node:crypto'
import {Message,MessageComputer,UserSecretKey} from '@multiversx/sdk-core'
import {buildMessage} from '../src/adminAuthChallengeStore.mjs'
import {createAdminProofRedemption} from '../src/adminAuthProofRedemption.mjs'

const NOW=1_700_000_000_000
function signer() {
  const {privateKey}=generateKeyPairSync('ed25519')
  const sk=new UserSecretKey(Buffer.from(privateKey.export({format:'jwk'}).d,'base64url'))
  const address=sk.generatePublicKey().toAddress()
  return {sk,address,bech32:address.toBech32()}
}
function challenge(s) {
  return {
    nonce:'nonce-production-proof-test-001',
    admin_bech32:s.bech32,action:'setPaused',chain_id:'1',domain:'xArtists.admin.v1',
    contract_bech32:null,escrow_id:null,favor_seller:null,target_bech32:null,
    issued_at_ms:NOW,expires_at_ms:NOW+300_000,consumed_at_ms:null,
  }
}
async function signature(s,row) {
  const message=new Message({address:s.address,data:new TextEncoder().encode(buildMessage(row))})
  const computer=new MessageComputer()
  return Buffer.from(await s.sk.sign(computer.computeBytesForSigning(message))).toString('hex')
}

/** Simulates one PG connection per request, one SQL lock, committed writes only.
 * Tests concurrency semantics but does NOT replace a real PostgreSQL test.
 */
function fakePool(original,{failUpdate=false,failCommit=false}={}) {
  const state={row:{...original},queries:[],released:0,commits:0,rollbacks:0}
  let prior=Promise.resolve()
  return {
    state,
    async connect(){
      let txRow=null,unlock
      return {
        async query(sql,args=[]){
          state.queries.push(sql)
          if(sql==='BEGIN'){
            const before=prior
            prior=new Promise(resolve=>{unlock=resolve})
            await before
            txRow={...state.row}
            return {rowCount:0,rows:[]}
          }
          if(sql==='ROLLBACK'){txRow=null;state.rollbacks++;unlock?.();return {rowCount:0,rows:[]}}
          if(sql==='COMMIT'){
            if(failCommit)throw Error('test_commit_failure')
            state.row={...txRow}
            txRow=null;state.commits++;unlock?.()
            return {rowCount:0,rows:[]}
          }
          if(sql.includes('SELECT * FROM admin_auth_challenges_v1')){
            return args[0]===txRow.nonce&&args[1]===txRow.admin_bech32&&args[2]===txRow.action
              ? {rowCount:1,rows:[{...txRow}]} : {rowCount:0,rows:[]}
          }
          if(sql.includes('UPDATE admin_auth_challenges_v1')){
            if(failUpdate)throw Error('test_write_failure')
            if(txRow.consumed_at_ms!=null||txRow.expires_at_ms<=args[3]||
              txRow.nonce!==args[0]||txRow.admin_bech32!==args[1]||txRow.action!==args[2])
              return {rowCount:0,rows:[]}
            txRow.consumed_at_ms=args[3]
            return {rowCount:1,rows:[{
              nonce:txRow.nonce,admin_bech32:txRow.admin_bech32,
              action:txRow.action,consumed_at_ms:txRow.consumed_at_ms,
            }]}
          }
          throw Error('Unexpected fake database statement')
        },
        release(){state.released++}
      }
    }
  }
}
const input=(s,sig)=>({nonce:'nonce-production-proof-test-001',
  adminBech32:s.bech32,action:'setPaused',signatureHex:sig})
const tool=(pool,s,clock=()=>NOW+100)=>createAdminProofRedemption(pool,{
  nowMs:clock,allowlistedAdmins:[s.bech32],
})

test('successful wallet proof consumes exactly once but authorizes no action',async()=>{
  const s=signer(),row=challenge(s),pool=fakePool(row)
  const signed=await signature(s,row)
  const result=await tool(pool,s).redeem(input(s,signed))
  assert.equal(result.ok,true)
  assert.equal(result.authorizesActions,false)
  assert.equal(result.mode,'postgres_wallet_proof_only')
  assert.equal(pool.state.commits,1)
  assert.equal(pool.state.row.consumed_at_ms,NOW+100)
  const replay=await tool(pool,s).redeem(input(s,signed))
  assert.equal(replay.ok,false)
  assert.equal(replay.error,'challenge_already_consumed')
  assert.equal(pool.state.commits,1)
  assert.equal(pool.state.released,2)
})

test('concurrent valid submissions redeem only one challenge',async()=>{
  const s=signer(),row=challenge(s),pool=fakePool(row)
  const signed=await signature(s,row)
  const service=tool(pool,s)
  const results=await Promise.all(Array.from({length:12},()=>service.redeem(input(s,signed))))
  assert.equal(results.filter(r=>r.ok).length,1)
  assert.equal(results.filter(r=>!r.ok).length,11)
  assert.equal(pool.state.commits,1)
  assert.equal(pool.state.released,12)
})

test('wrong signatures and tampering NEVER consume a valid challenge',async()=>{
  const s=signer(),other=signer(),row=challenge(s),pool=fakePool(row)
  const valid=await signature(s,row),incorrect=await signature(other,challenge(other))
  const svc=tool(pool,s)
  for(const req of [
    input(s,incorrect),
    {...input(s,valid),action:'refund'},
    {...input(s,valid),nonce:'nonce-different-proof-test-002'},
    {...input(s,valid),signatureHex:'z'.repeat(128)},
  ]){
    assert.equal((await svc.redeem(req)).ok,false)
    assert.equal(pool.state.row.consumed_at_ms,null)
  }
  assert.equal((await svc.redeem(input(s,valid))).ok,true)
})

test('expired, consumed, not-allowlisted and unsupported wallet data reject without SQL updates',async()=>{
  const s=signer(),row=challenge(s),pool=fakePool(row)
  const signed=await signature(s,row)
  const future=tool(pool,s,()=>NOW+300_000)
  assert.equal((await future.redeem(input(s,signed))).ok,false)
  assert.equal(pool.state.row.consumed_at_ms,null)
  const empty=createAdminProofRedemption(pool,{nowMs:()=>NOW+1,allowlistedAdmins:[]})
  assert.equal((await empty.redeem(input(s,signed))).error,'admin_not_allowlisted')
  assert.equal(pool.state.commits,0)
  const consumed=fakePool({...row,consumed_at_ms:NOW+5})
  assert.equal((await tool(consumed,s).redeem(input(s,signed))).ok,false)
  assert.equal(consumed.state.commits,0)
})

test('SQL write or commit errors roll back; no unverified success receipt',async()=>{
  const s=signer(),row=challenge(s),signed=await signature(s,row)
  for(const option of [{failUpdate:true},{failCommit:true}]){
    const pool=fakePool(row,option)
    const result=await tool(pool,s).redeem(input(s,signed))
    assert.equal(result.ok,false)
    assert.equal(result.error,'db_or_protocol_error')
    assert.equal(pool.state.commits,0)
    assert.equal(pool.state.rollbacks,1)
    assert.equal(pool.state.row.consumed_at_ms,null)
    assert.equal(pool.state.released,1)
  }
})

test('unconfigured trusted PostgreSQL is rejected, no unauthenticated fallback',()=>{
  assert.throws(()=>createAdminProofRedemption({query(){}}),/trusted_postgres_pool_required/)
  assert.throws(()=>createAdminProofRedemption(null),/trusted_postgres_pool_required/)
})
