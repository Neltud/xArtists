import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createHash, generateKeyPairSync, sign } from 'node:crypto'
import { createPayboxSolanaProofGate, solanaAddressBytes, verifySolanaMessageSignature } from '../src/payboxWalletControl.mjs'

const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const toBase58 = buffer => {
  let value = BigInt('0x' + buffer.toString('hex'))
  let encoded = ''
  while (value > 0n) {
    encoded = alphabet[Number(value % 58n)] + encoded
    value /= 58n
  }
  for (const byte of buffer) { if (byte !== 0) break; encoded = '1' + encoded }
  return encoded || '1'
}
const keys = generateKeyPairSync('ed25519')
const otherKeys = generateKeyPairSync('ed25519')
const wallet = toBase58(keys.publicKey.export({ format: 'der', type: 'spki' }).subarray(-32))
const anotherWallet = toBase58(otherKeys.publicKey.export({ format: 'der', type: 'spki' }).subarray(-32))
const actor = { id: 'wallet-session-1' }
const intruder = { id: 'wallet-session-2' }
const cred = { credential_id: 'sol-default', kind: 'wallet', metadata: { address: wallet, chains: ['solana'] } }
const produce = () => {
  let time = 1_000_000
  let calls = 0
  const gate = createPayboxSolanaProofGate({
    expectedAddress: wallet,
    getCredential: async ({ credentialId }) => {
      calls++
      return credentialId === 'sol-default' ? cred : null
    },
    guardian: () => ({ paused: false, mode: 'proof-only' }),
    clock: () => time,
  })
  return { gate, get calls() { return calls }, setClock: n => { time = n } }
}
const signChallenge = challenge => sign(null, Buffer.from(challenge.intent.message, 'utf8'), keys.privateKey).toString('hex')

test('exact base58 Ed25519 public key can be decoded, malformed/short address rejected', () => {
  assert.equal(solanaAddressBytes(wallet).length, 32)
  assert.deepEqual(solanaAddressBytes(wallet), keys.publicKey.export({ format:'der', type:'spki' }).subarray(-32))
  for (const bad of ['', '0OIl', '11', 'x'.repeat(100)]) assert.throws(() => solanaAddressBytes(bad), /invalid_solana_address/)
  assert.equal(solanaAddressBytes('11111111111111111111111111111111').length, 32)
})

test('challenge binds actor, credential, network, nonce, expiry and exact wallet; no spend permission', async () => {
  const { gate } = produce()
  const q = await gate.prepare({ credentialId: 'sol-default' }, actor)
  assert.equal(q.intent.op, 'solanaMessage')
  assert.equal(q.intent.address, wallet)
  assert.equal(q.status, 'issued')
  assert.equal(q.financialAuthorityGranted, false)
  assert.equal(q.requiresUserSignature, true)
  assert.ok(q.intent.message.includes('NO transfer, swap, or payment.'))
  assert.ok(q.intent.message.includes('Chain: solana:mainnet'))
  assert.ok(q.intent.message.includes('Credential-SHA256: '+createHash('sha256').update('sol-default').digest('hex')))
  assert.equal(gate.status({ challengeId:q.challengeId },actor).spendAuthorized,false)
  const next = await gate.prepare({ credentialId:'sol-default' }, actor)
  assert.notEqual(next.challengeId,q.challengeId)
  assert.notEqual(next.digest,q.digest)
})

test('valid Solana message signature is cryptographically verified once, without fake onchain receipt', async () => {
  const { gate } = produce()
  const q = await gate.prepare({ credentialId:'sol-default' },actor)
  const signatureHex=signChallenge(q)
  assert.equal(verifySolanaMessageSignature({ address:wallet,message:q.intent.message,signatureHex }),true)
  const result=await gate.confirm({ challengeId:q.challengeId,signatureHex },actor)
  assert.equal(result.status,'verified')
  assert.equal(result.signatureValid,true)
  assert.equal(result.walletAddress,wallet)
  assert.equal(result.payboxLiveIntegrationVerified,false)
  assert.equal(result.spendAuthorized,false)
  assert.equal(result.chainTransactionHash,null)
  await assert.rejects(()=>gate.confirm({ challengeId:q.challengeId, signatureHex },actor), /proof_challenge_not_confirmable/)
})

test('cannot substitute other actor, wallet, message, or a forged signature', async()=>{
  const {gate}=produce()
  const q=await gate.prepare({credentialId:'sol-default'},actor)
  const good=signChallenge(q)
  assert.equal(verifySolanaMessageSignature({address:wallet,message:q.intent.message+'changed',signatureHex:good}),false)
  assert.equal(verifySolanaMessageSignature({address:anotherWallet,message:q.intent.message,signatureHex:good}),false)
  await assert.rejects(()=>gate.confirm({challengeId:q.challengeId, signatureHex:good}, intruder), /proof_challenge_not_found/)
  const forged=sign(null,Buffer.from(q.intent.message),otherKeys.privateKey).toString('hex')
  await assert.rejects(()=>gate.confirm({challengeId:q.challengeId,signatureHex:forged},actor),/proof_signature_invalid/)
  assert.equal(gate.status({challengeId:q.challengeId},actor).status,'rejected')
  await assert.rejects(()=>gate.confirm({challengeId:q.challengeId,signatureHex:good},actor),/proof_challenge_not_confirmable/)
})

test('expired challenge cannot be signed even with an otherwise correct signature', async()=>{
  const {gate,setClock}=produce()
  const q=await gate.prepare({credentialId:'sol-default'},actor)
  setClock(q.expiresAt)
  await assert.rejects(()=>gate.confirm({challengeId:q.challengeId,signatureHex:signChallenge(q)},actor),/proof_challenge_expired/)
  assert.equal(gate.status({challengeId:q.challengeId},actor).status,'expired')
})

test('user cancellation is idempotent, and prevents later signing', async()=>{
  const {gate}=produce()
  const q=await gate.prepare({credentialId:'sol-default'},actor)
  assert.equal(gate.cancel({challengeId:q.challengeId},actor).status,'cancelled')
  assert.equal(gate.cancel({challengeId:q.challengeId},actor).status,'cancelled')
  await assert.rejects(()=>gate.confirm({challengeId:q.challengeId,signatureHex:signChallenge(q)},actor),/proof_challenge_not_confirmable/)
})

test('ungranted credential and mismatched chain/address fail closed', async()=>{
  const other=createPayboxSolanaProofGate({
    expectedAddress:wallet, guardian:()=>({paused:false,mode:'proof-only'}),
    getCredential:async()=>({...cred,metadata:{address:anotherWallet,chains:['solana']}}),
  })
  await assert.rejects(()=>other.prepare({credentialId:'sol-default'},actor),/paybox_grant_or_wallet_mismatch/)
  const evm=createPayboxSolanaProofGate({
    expectedAddress:wallet, guardian:()=>({paused:false,mode:'proof-only'}),
    getCredential:async()=>({...cred, metadata:{address:wallet,chains:['evm']}}),
  })
  await assert.rejects(()=>evm.prepare({credentialId:'sol-default'},actor),/paybox_grant_or_wallet_mismatch/)
  const {gate}=produce()
  await assert.rejects(()=>gate.prepare({credentialId:'wrong-credential'},actor),/paybox_grant_or_wallet_mismatch/)
})

test('unavailable credential/guardian or false permission blocks creation', async()=>{
  const paused=createPayboxSolanaProofGate({
    expectedAddress:wallet, guardian:()=>({paused:true,mode:'proof-only'}),
    getCredential:async()=>cred,
  })
  await assert.rejects(()=>paused.prepare({credentialId:'sol-default'},actor),/proof_guardian_blocked/)
  const wrongMode=createPayboxSolanaProofGate({
    expectedAddress:wallet, guardian:()=>({paused:false,mode:'live'}),
    getCredential:async()=>cred,
  })
  await assert.rejects(()=>wrongMode.prepare({credentialId:'sol-default'},actor),/proof_guardian_blocked/)
  const unavailable=createPayboxSolanaProofGate({
    expectedAddress:wallet, guardian:()=>({paused:false,mode:'proof-only'}),
    getCredential:async()=>{throw Error('provider offline')},
  })
  await assert.rejects(()=>unavailable.prepare({credentialId:'sol-default'},actor),/paybox_credential_unavailable/)
})

test('provider hanging times out safely and cannot establish an asserted PayBox grant', async()=>{
  const gate=createPayboxSolanaProofGate({
    expectedAddress:wallet, guardian:()=>({paused:false,mode:'proof-only'}),
    getCredential:()=>new Promise(()=>{}),providerTimeoutMs:10,
  })
  await assert.rejects(()=>gate.prepare({credentialId:'sol-default'},actor),/paybox_credential_unavailable/)
})

test('concurrent signature confirmation only verifies a single attempt', async()=>{
  let release
  let calls=0
  const gate=createPayboxSolanaProofGate({
    expectedAddress:wallet, guardian:()=>({paused:false,mode:'proof-only'}),
    getCredential:async()=>{
      calls++
      if(calls===2) return new Promise(resolve=>{release=()=>resolve(cred)})
      return cred
    },
    clock:()=>1_000_000,
  })
  const q=await gate.prepare({credentialId:'sol-default'},actor)
  const signatureHex=signChallenge(q)
  const first=gate.confirm({challengeId:q.challengeId,signatureHex},actor)
  await assert.rejects(()=>gate.confirm({challengeId:q.challengeId,signatureHex},actor),/proof_challenge_not_confirmable/)
  release()
  const result=await first
  assert.equal(result.status,'verified')
  assert.equal(calls,2)
})

test('bounded record capacity requires deliberate retention policy before hosting',async()=>{
  const gate=createPayboxSolanaProofGate({
    expectedAddress:wallet, guardian:()=>({paused:false,mode:'proof-only'}),
    getCredential:async()=>cred,maxRecords:1,
  })
  await gate.prepare({credentialId:'sol-default'},actor)
  await assert.rejects(()=>gate.prepare({credentialId:'sol-default'},actor),/proof_gate_capacity_exhausted/)
})

test('malformed signature, invalid actor or configuration rejected',async()=>{
  const {gate}=produce()
  await assert.rejects(()=>gate.prepare({credentialId:'sol-default'},{}),/authenticated_actor_required/)
  await assert.rejects(()=>gate.prepare({credentialId:'sol-default'}),/authenticated_actor_required/)
  const q=await gate.prepare({credentialId:'sol-default'},actor)
  await assert.rejects(()=>gate.confirm({challengeId:q.challengeId,signatureHex:'not-hex'},actor),/proof_signature_format_invalid/)
  assert.equal(gate.status({challengeId:q.challengeId},actor).status,'issued')
  assert.throws(()=>createPayboxSolanaProofGate({expectedAddress:'bad',getCredential:async()=>cred,guardian:()=>({mode:'proof-only'})}),/invalid_solana_address/)
  assert.throws(()=>createPayboxSolanaProofGate({expectedAddress:wallet,getCredential:async()=>cred,guardian:()=>({paused:false,mode:'proof-only'}),ttlMs:300000}),/invalid_proof_gate_configuration/)
})
