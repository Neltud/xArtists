import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { validatePackRoleManifest } from '../scripts/verify-pack-role-manifest.mjs'

const path = new URL('../../../docs/ops/PACK_ROLE_GRANT_UNSIGNED_2026-11-06.json', import.meta.url)
const document = JSON.parse(readFileSync(path,'utf8'))
const copy = () => structuredClone(document)

test('three independent role grants use precisely two roles for the owner and remain unsigned', () => {
  const result = validatePackRoleManifest(copy())
  assert.equal(result.ok,true,result.problems.join(', '))
  assert.equal(result.status,'NO_GO_REVIEW_ONLY')
  assert.equal(result.signed,false)
  assert.equal(result.broadcast,false)
  assert.equal(result.liveRolesVerified,false)
  assert.equal(result.ipfsVerified,false)
  assert.equal(result.transactionsExpected,3)
})

test('changing the role recipient public key or receiver fails closed', () => {
  for (const mutation of [
    data => {data.roleRecipientHex = '0'.repeat(64)},
    data => {data.receiver = data.sender},
    data => {data.sender = data.receiver},
    data => {data.chainId = 'D'},
    data => {data.value = '1'},
  ]) {
    const data = copy()
    mutation(data)
    assert.equal(validatePackRoleManifest(data).ok,false)
  }
})

test('rejects wrong roles and manipulated payload on any collection', () => {
  for (const mutation of [
    data => {data.roles[0].name = 'ESDTRoleNFTAddURI'},
    data => {data.roles[1].hex = '0'.repeat(32)},
    data => {data.transactions[0].data += '@455344545472616e73666572526f6c65'},
    data => {data.transactions[1].collection = data.transactions[0].collection},
    data => {data.transactions[2].order = 2},
    data => {data.transactions.splice(2,1)},
  ]) {
    const data = copy()
    mutation(data)
    assert.equal(validatePackRoleManifest(data).ok,false)
  }
})

test('rejects signed/broadcast payloads or injected nonce/signature',()=>{
  for (const mutation of [
    data => {data.transactions[0].signed = true},
    data => {data.transactions[1].broadcast = true},
    data => {data.transactions[2].txHash = 'f'.repeat(64)},
    data => {data.transactions[1].nonce = 14},
    data => {data.transactions[0].gasPrice = 1000000000},
    data => {data.transactions[0].signature = 'fake'},
  ]) {
    const data = copy()
    mutation(data)
    assert.equal(validatePackRoleManifest(data).ok,false)
  }
})

test('the validator itself contains no calls to sign, broadcast or fetch',()=>{
  const src = readFileSync(new URL('../scripts/verify-pack-role-manifest.mjs', import.meta.url),'utf8')
  assert.doesNotMatch(src, /fetch\s*\(/)
  assert.doesNotMatch(src, /sendTransaction\s*\(/)
  assert.doesNotMatch(src, /broadcastTransaction\s*\(/)
  assert.doesNotMatch(src, /signTransaction\s*\(/)
})
