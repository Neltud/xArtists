import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {
  parseXPortalAccountNonce,validateXPortalSignBatch,
  validateXPortalSignedBatch,safeXPortalSignError,
} from '../src/lib/xportalSignGuards.mjs'

const sender='erd1'+'q'.repeat(58)
const receiver='erd1'+'a'.repeat(58)
const tx={receiver,value:'1000000000000000000',gasLimit:12000000,chainID:'1'}

test('chain nonce accepts actual 0 but never guesses 0 from API failure or bad data',()=>{
  assert.equal(parseXPortalAccountNonce({nonce:0}),0)
  assert.equal(parseXPortalAccountNonce({nonce:'0'}),0)
  assert.equal(parseXPortalAccountNonce({nonce:'21'}),21)
  for(const invalid of [
    null,{},[],{nonce:null},{nonce:undefined},{nonce:-1},{nonce:'-1'},
    {nonce:'01'},{nonce:'1e3'},{nonce:1.2},{nonce:'not-a-nonce'},
    {nonce:Infinity},{nonce:NaN},{nonce:'9007199254740992'},
    {nonce:false},{nonce:{}},
  ]){
    assert.throws(()=>parseXPortalAccountNonce(invalid),/xportal_nonce_unavailable/,
      JSON.stringify(invalid))
  }
})

test('rejects invalid receiver, spoofed sender, wrong chain and mismatched signed nonce',()=>{
  assert.equal(validateXPortalSignBatch([tx],sender,10).length,1)
  assert.equal(validateXPortalSignBatch([tx,{...tx,nonce:11}],sender,10).length,2)
  for(const invalid of [
    {...tx,receiver:'erd1-malformed'},
    {...tx,sender:receiver},
    {...tx,chainID:'D'},
    {...tx,chainID:'devnet'},
    {...tx,nonce:9},
    {...tx,value:'1.25'},
    {...tx,value:'1e18'},
    {...tx,gasLimit:0},
    {...tx,gasLimit:NaN},
    {...tx,gasLimit:true},
    {...tx,gasLimit:'2e7'},
    {...tx,data:23},
  ]){
    assert.throws(()=>validateXPortalSignBatch([invalid],sender,10),
      /xportal_invalid_sign_batch/)
  }
  for(const input of [[],[tx,...Array(20).fill(tx)],null]){
    assert.throws(()=>validateXPortalSignBatch(input,sender,10),/xportal_invalid_sign_batch/)
  }
  assert.throws(()=>validateXPortalSignBatch([tx],sender,Number.MAX_SAFE_INTEGER+1),
    /xportal_invalid_sign_batch/)
  assert.throws(()=>validateXPortalSignBatch([tx,tx],sender,Number.MAX_SAFE_INTEGER),
    /xportal_invalid_sign_batch/)
})

test('signature batch cardinality is exact or nothing is broadcast',()=>{
  const signed=[{signature:'a'},{signature:'b'}]
  assert.equal(validateXPortalSignedBatch(signed,2),signed)
  for(const invalid of [[],[signed[0]],[signed[0],null],[signed[0],undefined],
    [signed[0],signed[1],signed[1]]]){
    assert.throws(()=>validateXPortalSignedBatch(invalid,2),
      /xportal_partial_signature_batch/)
  }
  assert.throws(()=>validateXPortalSignedBatch([{signature:'a'}],0),
    /xportal_partial_signature_batch/)
  assert.throws(()=>validateXPortalSignedBatch(signed,21),
    /xportal_partial_signature_batch/)
})

test('signature failures cannot echo raw SDK secrets or pairing strings to the user',()=>{
  const sensitive='wc:foobar@2?relay-protocol=irn&symKey=private-projectid'
  const scenarios=[
    new Error('relay failed '+sensitive),
    new Error('xportal_nonce_unavailable '+sensitive),
    new Error('xportal_invalid_sign_batch '+sensitive),
    new Error('xportal_partial_signature_batch '+sensitive),
    new Error('denied by user '+sensitive),
  ]
  for(const e of scenarios){
    const safe=safeXPortalSignError(e)
    assert.ok(safe.length>10)
    assert.ok(!safe.includes('wc:'))
    assert.ok(!safe.includes('symKey'))
    assert.ok(!safe.includes('private-projectid'))
  }
})

test('actual signing code applies nonce and count guard and fallback never truncates multi-TX',()=>{
  const wc=readFileSync(new URL('../src/lib/xportalWc.ts',import.meta.url),'utf8')
  const transport=readFileSync(new URL('../src/providers/bootstrapSendTx.ts',import.meta.url),'utf8')
  assert.match(wc,/parseXPortalAccountNonce\(await r\.json\(\)\)/)
  assert.match(wc,/validateXPortalSignBatch\(plains,address,nonce\)/)
  assert.match(wc,/validateXPortalSignedBatch\(signed,signables\.length\)/)
  assert.match(wc,/signables\.length===1/)
  assert.doesNotMatch(wc,/if \(!r\.ok\) return 0/)
  assert.doesNotMatch(wc,/return \{ ok: false, error: \`Signature xPortal : \$\{msg\.slice/)
  assert.match(transport,/if \(list\.length !== 1\)/)
  assert.match(transport,/Aucune transaction envoyée/)
})
