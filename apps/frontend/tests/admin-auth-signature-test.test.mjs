import test from 'node:test'
import assert from 'node:assert/strict'
import {generateKeyPairSync,sign} from 'node:crypto'
import {buildAdminAuthMessage,parseAndValidateAdminAuthMessage} from '../src/lib/adminAuthMessage.mjs'
import {verifyAdminAuthTestSignature} from '../src/lib/adminAuthSignatureTest.mjs'
const ADMIN='erd1kex0pvp9dng8j76sgsejkyx86nhxuqk24my6wnha8dga9mymvhxqvl8v0g'
const OTHER='erd1mmh2j5y8esv2tmmyeau3hr4xa2u2te3zc3j9wumn3v5vm8uvsczqnucj5l'
const now=1700000000000
const payload={action:'resolveDispute',adminBech32:ADMIN,contractBech32:OTHER,escrowId:7,favorSeller:true,nonce:'nonce-ephemeral-001',issuedAtMs:now,expiresAtMs:now+300000}
const message=buildAdminAuthMessage(payload)
const keys=generateKeyPairSync('ed25519')
const der=keys.publicKey.export({format:'der',type:'spki'})
const sig=sign(null,Buffer.from(message),keys.privateKey)
const check=(m=message,s=sig,k=der)=>verifyAdminAuthTestSignature({message:m,signature:s,publicKeyDer:k,expectedAdminBech32:ADMIN,nowMs:now+1000})

test('ephemeral Ed25519 signature verifies only exact canonical bytes',()=>{
  assert.equal(check().ok,true)
  assert.equal(check(message.replace('favorSeller=1','favorSeller=0')).error,'invalid_signature')
  assert.equal(check(message,Buffer.alloc(64)).error,'invalid_signature')
})
test('wrong key is rejected',()=>{
  const other=generateKeyPairSync('ed25519')
  assert.equal(check(message,sig,other.publicKey.export({format:'der',type:'spki'})).error,'invalid_signature')
})
test('tampered admin and expired payloads are rejected',()=>{
  assert.equal(check(message.replace(ADMIN,OTHER)).error,'admin_mismatch')
  assert.equal(verifyAdminAuthTestSignature({message,signature:sig,publicKeyDer:der,expectedAdminBech32:ADMIN,nowMs:now+400000}).error,'expired')
})
test('malformed or duplicated fields fail closed',()=>{
  const duplicate=message.replace('nonce=nonce-ephemeral-001','nonce=nonce-ephemeral-001\nnonce=nonce-ephemeral-001')
  assert.equal(parseAndValidateAdminAuthMessage(duplicate,{nowMs:now+1000}).ok,false)
  assert.equal(parseAndValidateAdminAuthMessage(message.replace('escrowId=7','escrowId=7.5'),{nowMs:now+1000}).error,'bad_escrow_id')
  assert.equal(parseAndValidateAdminAuthMessage(message.replace('issuedAt=1700000000000','issuedAt=1e12'),{nowMs:now+1000}).error,'bad_time')
})
