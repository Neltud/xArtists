import test from 'node:test'
import assert from 'node:assert/strict'
import {generateKeyPairSync} from 'node:crypto'
import {Address} from '@multiversx/sdk-core'
import {multiversxAddressFromPublicKey,publicKeyFromMultiversxAddress} from '../src/lib/adminAuthAddressBindingTest.mjs'

// Independent SDK cross-check. No wallet, secret persistence or broadcast.
test('ephemeral public keys produce exactly the same erd1 address as SDK Address',()=>{
  for(let i=0;i<8;i++){
    const {publicKey}=generateKeyPairSync('ed25519')
    const raw=publicKey.export({format:'der',type:'spki'}).subarray(-32)
    const sdkAddress=new Address(raw).toBech32()
    const local=multiversxAddressFromPublicKey(raw)
    assert.equal(local,sdkAddress)
    assert.deepEqual(publicKeyFromMultiversxAddress(sdkAddress),raw)
  }
})
