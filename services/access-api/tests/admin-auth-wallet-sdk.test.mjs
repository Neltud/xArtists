import test from 'node:test'
import assert from 'node:assert/strict'
import {generateKeyPairSync,sign as nodeSign} from 'node:crypto'
import {Message,MessageComputer,UserSecretKey} from '@multiversx/sdk-core'
import {buildMessage} from '../src/adminAuthChallengeStore.mjs'
import {verifySdkAdminWalletProof} from '../src/adminAuthWalletVerifier.mjs'

const START=1_700_000_000_000
function fixture() {
  const {privateKey}=generateKeyPairSync('ed25519')
  const seed=Buffer.from(privateKey.export({format:'jwk'}).d,'base64url')
  const secret=new UserSecretKey(seed)
  const address=secret.generatePublicKey().toAddress()
  const admin=address.toBech32()
  const row={
    nonce:'nonce-admin-sdk-test-123456',
    admin_bech32:admin,
    action:'setPaused', domain:'xArtists.admin.v1',chain_id:'1',
    contract_bech32:null,escrow_id:null,favor_seller:null,target_bech32:null,
    issued_at_ms:START,expires_at_ms:START+300_000,consumed_at_ms:null
  }
  return {privateKey,secret,address,admin,row}
}
async function sign(f) {
  const msg=new Message({address:f.address,data:new TextEncoder().encode(buildMessage(f.row))})
  const computer=new MessageComputer()
  msg.signature=await f.secret.sign(computer.computeBytesForSigning(msg))
  return Buffer.from(msg.signature).toString('hex')
}
function opts(f,signatureHex) {
  return {challengeRow:f.row,signatureHex,adminBech32:f.admin,allowlistedAdmins:[f.admin],nowMs:START+1}
}

test('valid SDK protocol signature proves exact row but never grants admin privilege',async()=>{
  const f=fixture()
  const res=await verifySdkAdminWalletProof(opts(f,await sign(f)))
  assert.equal(res.ok,true)
  assert.equal(res.admin,f.admin)
  assert.equal(res.action,'setPaused')
  assert.equal(res.nonce,f.row.nonce)
  assert.equal(res.mode,'wallet_proof_offline_only')
  assert.equal(res.authorizesActions,false)
})

test('raw Ed25519 signature on UTF8 is rejected by xPortal MessageComputer',async()=>{
  const f=fixture()
  const raw=nodeSign(null,Buffer.from(buildMessage(f.row),'utf8'),f.privateKey).toString('hex')
  const res=await verifySdkAdminWalletProof(opts(f,raw))
  assert.equal(res.ok,false)
  assert.equal(res.error,'wallet_signature_invalid')
})

test('binding to the exact database message detects tampered action and nonce',async()=>{
  const f=fixture()
  const sig=await sign(f)
  for(const changes of [{action:'refund'},{nonce:'different-nonce-123456'},{domain:'other-domain'},{chain_id:'D'}]){
    const row={...f.row,...changes}
    const res=await verifySdkAdminWalletProof({...opts(f,sig),challengeRow:row})
    assert.equal(res.ok,false)
  }
})

test('expired, already consumed, unauthorised wallet and missing allowlist fail closed',async()=>{
  const f=fixture()
  const signatureHex=await sign(f)
  const base=opts(f,signatureHex)
  assert.equal((await verifySdkAdminWalletProof({...base,nowMs:START+300_000})).ok,false)
  assert.equal((await verifySdkAdminWalletProof({...base,challengeRow:{...f.row,consumed_at_ms:START+2}})).ok,false)
  assert.equal((await verifySdkAdminWalletProof({...base,allowlistedAdmins:[]})).ok,false)
  assert.equal((await verifySdkAdminWalletProof({...base,adminBech32:'erd1wrong'})).ok,false)
  assert.equal((await verifySdkAdminWalletProof({...base,signatureHex:'x'.repeat(128)})).ok,false)
})

test('different signer cannot satisfy challenge of listed admin',async()=>{
  const owner=fixture(),outsider=fixture()
  const signatureHex=await sign(outsider)
  const res=await verifySdkAdminWalletProof(opts(owner,signatureHex))
  assert.equal(res.ok,false)
  assert.equal(res.error,'wallet_signature_invalid')
})

test('no recipient, session or network privilege is created in proof utility',async()=>{
  const f=fixture()
  const res=await verifySdkAdminWalletProof(opts(f,await sign(f)))
  assert.equal(res.ok,true)
  assert.equal('sessionId' in res,false)
  assert.equal('jwt' in res,false)
  assert.equal('txHash' in res,false)
})
