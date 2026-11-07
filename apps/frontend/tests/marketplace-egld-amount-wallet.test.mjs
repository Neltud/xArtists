import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'
import {egldTextToWei} from '../src/lib/egldExactAmount.mjs'

test('EGLD amounts are exact to 18 decimals; no Number rounding',()=>{
  assert.equal(egldTextToWei('0.25'),'250000000000000000')
  assert.equal(egldTextToWei('0.1'),'100000000000000000')
  assert.equal(egldTextToWei('0.000000000000000001'),'1')
  assert.equal(egldTextToWei('12.123456789012345678'),'12123456789012345678')
  assert.equal(egldTextToWei('1'),'1000000000000000000')
})

test('invalid, ambiguous, negative, excessive-precision or zero EGLD amounts fail closed',()=>{
  for(const value of ['0','0.000000000000000000','', '1e-5','-1','NaN','Infinity','1.','00.1',
   '1,5',' 1.5','1.0000000000000000001',1.5,null,undefined, '1_000']) {
    assert.throws(()=>egldTextToWei(value))
  }
})

test('marketplace send requires both fresh payable contract AND user signing capability',()=>{
  const sc=readFileSync(new URL('../src/config/scStatus.ts',import.meta.url),'utf8')
  const hook=readFileSync(new URL('../src/hooks/useMarketplaceTx.ts',import.meta.url),'utf8')
  const wallet=readFileSync(new URL('../src/context/WalletContext.tsx',import.meta.url),'utf8')
  assert.match(sc,/isLiaOpsWallet\(addr\?: string \| null\)/)
  assert.match(sc,/addr\.toLowerCase\(\) === LIA_OPS\.toLowerCase\(\)/)
  assert.match(hook,/const \{ address, canAttemptSign \} = useWallet\(\)/)
  assert.match(hook,/if \(!address \|\| !canAttemptSign\)/)
  assert.match(wallet,/const applyLiveSession = \(address: string\) => \{\s*\/\/[^]*?LIA_WALLET\.toLowerCase\(\)/)
  assert.doesNotMatch(hook,/BigInt\(Math\.round/)
})

test('UI preserves original price text and never calls parseFloat to send EGLD',()=>{
  const modal=readFileSync(new URL('../src/components/NFTDetailModal.tsx',import.meta.url),'utf8')
  const sheet=readFileSync(new URL('../src/components/ListNftSheet.tsx',import.meta.url),'utf8')
  assert.match(modal,/priceEgld: buyPrice/)
  assert.match(modal,/priceEgld: listPrice/)
  assert.match(modal,/amountEgld: bidPrice/)
  assert.match(sheet,/priceEgld: price/)
  assert.doesNotMatch(sheet,/parseFloat\(price\)/)
  assert.doesNotMatch(modal,/priceEgld: parseFloat/)
  assert.doesNotMatch(modal,/amountEgld: parseFloat/)
})

test('SDK session identifiers are not mislabeled as confirmed transaction hashes',()=>{
 const hook=readFileSync(new URL('../src/hooks/useMarketplaceTx.ts',import.meta.url),'utf8')
 assert.match(hook,/\^\[0-9a-f\]\{64\}\$/i)
 assert.match(hook,/achat non encore confirmé/)
})
