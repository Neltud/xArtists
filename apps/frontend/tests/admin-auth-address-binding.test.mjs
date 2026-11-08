import test from 'node:test'
import assert from 'node:assert/strict'
import {generateKeyPairSync,sign} from 'node:crypto'
import {buildAdminAuthMessage} from '../src/lib/adminAuthMessage.mjs'
import {multiversxAddressFromPublicKey,publicKeyFromMultiversxAddress,verifyBoundAdminSignatureOffline} from '../src/lib/adminAuthAddressBindingTest.mjs'

const now=1700000000000
const keys=generateKeyPairSync('ed25519')
const raw=keys.publicKey.export({format:'der',type:'spki'}).subarray(-32)
const address=multiversxAddressFromPublicKey(raw)
const message=buildAdminAuthMessage({action:'setPaused',adminBech32:address,nonce:'nonce-ephemeral-123',issuedAtMs:now,expiresAtMs:now+300000})
const signature=sign(null,Buffer.from(message),keys.privateKey)
const check=(args={})=>verifyBoundAdminSignatureOffline({message,signature,publicKeyRaw:raw,expectedAdminBech32:address,nowMs:now+1000,...args})

test('roundtrip checksummed MultiversX bech32 key',()=>{
  assert.equal(address.length,62)
  assert.equal(address.slice(0,4),'erd1')
  assert.deepEqual(publicKeyFromMultiversxAddress(address),raw)
})
test('checksum tampering fails closed',()=>{
  const tail=address.at(-1)==='q'?'p':'q'
  assert.equal(publicKeyFromMultiversxAddress(address.slice(0,-1)+tail),null)
  assert.equal(publicKeyFromMultiversxAddress(address.toUpperCase()),null)
})
test('offline signature binds the Ed25519 key to the exact admin address',()=>{
  assert.equal(check().ok,true)
  assert.equal(check({publicKeyRaw:Buffer.alloc(32)}).error,'address_key_mismatch')
  assert.equal(check({message:message.replace('action=setPaused','action=setAttestor')}).error,'invalid_signature')
})
test('wrong expected admin is denied',()=>{
  const other=generateKeyPairSync('ed25519').publicKey.export({format:'der',type:'spki'}).subarray(-32)
  assert.equal(check({expectedAdminBech32:multiversxAddressFromPublicKey(other)}).error,'admin_mismatch')
})
