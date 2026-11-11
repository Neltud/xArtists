import test from 'node:test'
import assert from 'node:assert/strict'
import {isMarketplaceArtwork as allowed} from '../src/lib/marketplaceArtwork.mjs'
test('xMEX positions with different nonces are excluded',()=>{
  for(const nonce of ['01','02','abcd']) assert.equal(allowed({identifier:'XMEX-fda355-'+nonce}),false)
})
test('collection and index aliases cannot reintroduce xMEX',()=>{
  for(const key of ['collection','token','tokenIdentifier']) assert.equal(allowed({[key]:'XMEX-fda355'}),false)
  assert.equal(allowed({identifier:'ART-abcdef-01',collection:'XMEX-fda355'}),false)
})
test('matching is case insensitive and ignores surrounding whitespace',()=>{
  assert.equal(allowed({identifier:' xmex-FDA355-01 '}),false)
})
test('genuine artwork is retained regardless of display name',()=>{
  assert.equal(allowed({identifier:'NFTUDURI-2990b6-01',name:'Conquest'}),true)
  assert.equal(allowed({identifier:'ART-abcdef-01',name:'xMEX'}),true)
})
test('invalid records are excluded',()=>{
  for(const value of [null,undefined,[],true,'XMEX-fda355']) assert.equal(allowed(value),false)
})
