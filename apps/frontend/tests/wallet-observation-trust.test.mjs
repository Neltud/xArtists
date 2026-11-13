import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {readonlyWalletObservation,restoreWalletObservation,walletSignEligibility} from '../src/lib/walletObservation.mjs'
const ops='erd1'+'p'.repeat(58)
const alice='erd1'+'a'.repeat(58)
const bob='erd1'+'b'.repeat(58)
test('URL callback addresses are only observations, not signers',()=>{
  const parsed=readonlyWalletObservation(alice,ops)
  assert.deepEqual(parsed,{connected:true,address:alice,method:'paste_readonly',sessionLive:false})
  assert.equal(walletSignEligibility(parsed),false)
  for(const value of [ops,'not-a-wallet','erd1'+'x'.repeat(57),'',null])
    assert.equal(readonlyWalletObservation(value,ops),null)
})
test('storage cannot resurrect an extension/Web Wallet/WalletConnect signing session',()=>{
  for(const method of ['defi_wallet','web_wallet','wallet_connect','paste_readonly']){
    const restored=restoreWalletObservation(JSON.stringify({method,address:alice,connected:true,sessionLive:true}),ops)
    assert.equal(restored?.method,'paste_readonly')
    assert.equal(restored?.sessionLive,false)
    assert.equal(walletSignEligibility(restored),false)
  }
})
test('untrusted xPortal storage never masquerades as a pairing',()=>{
  assert.equal(restoreWalletObservation(JSON.stringify({method:'xportal',address:alice}),ops),null)
  assert.equal(restoreWalletObservation(JSON.stringify({method:'pem',address:alice}),ops),null)
  assert.equal(restoreWalletObservation('bad-json',ops),null)
})
test('only a fresh matching xPortal provider or current extension session is eligible',()=>{
  assert.equal(walletSignEligibility({connected:true,address:alice,method:'xportal',sessionLive:true}),false)
  assert.equal(walletSignEligibility({connected:true,address:alice,method:'xportal',sessionLive:true,pairedAddress:bob}),false)
  assert.equal(walletSignEligibility({connected:true,address:alice,method:'xportal',sessionLive:true,pairedAddress:alice}),true)
  assert.equal(walletSignEligibility({connected:true,address:alice,method:'defi_wallet',sessionLive:true}),true)
  assert.equal(walletSignEligibility({connected:true,address:alice,method:'web_wallet',sessionLive:true}),false)
  assert.equal(walletSignEligibility({connected:true,address:alice,method:'paste_readonly',sessionLive:true}),false)
  assert.equal(walletSignEligibility({connected:true,address:alice,method:'wallet_connect',sessionLive:true}),false)
})
test('WalletContext integrates trust boundary on boot, callback and signing',()=>{
  const src=readFileSync(new URL('../src/context/WalletContext.tsx',import.meta.url),'utf8')
  assert.match(src,/restoreWalletObservation\(raw, LIA_WALLET\)/)
  assert.match(src,/readonlyWalletObservation\(fromUrl.address, LIA_WALLET\)/)
  assert.match(src,/walletSignEligibility\(/)
  assert.doesNotMatch(src,/sessionLive: parsed\.method !== 'paste_readonly'/)
  assert.doesNotMatch(src,/method: 'web_wallet' \}/)
})
