import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Address } from '@multiversx/sdk-core'
import { loadSource } from './load-source.mjs'

const creator = loadSource('src/lib/studioOnChainMint.ts')
const artist='erd1mmh2j5y8esv2tmmyeau3hr4xa2u2te3zc3j9wumn3v5vm8uvsczqnucj5l'

test('setSpecialRole encodes 32 public key bytes, not UTF8 erd1 address', () => {
  const tx=creator.buildSetNftCreateRoleTx({tokenIdentifier:'ATELIER-abcdef',ownerAddress:artist})
  const parts=tx.data.split('@')
  const expected=Buffer.from(Address.newFromBech32(artist).getPublicKey()).toString('hex')
  assert.equal(parts[0],'setSpecialRole')
  assert.equal(parts[2],expected)
  assert.equal(parts[2].length,64)
  assert.notEqual(parts[2].slice(0,8),'65726431')
  assert.equal(tx.chainID,'1')
})

test('NFT collection issue uses exact mainnet system receiver and 0.05 EGLD',()=>{
  const tx=creator.buildIssueNftCollectionTx({name:'Mon Atelier',ticker:'ARTLAB'})
  assert.equal(tx.receiver,creator.ESDT_SYSTEM_SC)
  assert.equal(tx.value,'50000000000000000')
  assert.equal(tx.data.split('@')[0],'issueNonFungible')
  assert.throws(()=>creator.buildIssueNftCollectionTx({name:'A',ticker:'ART'}))
  assert.throws(()=>creator.buildIssueNftCollectionTx({name:'Atelier',ticker:'BAD-TICKER'}))
})

test('First NFT requires a permanent public media URI and exact nonce quantity 1',()=>{
  const args={tokenIdentifier:'ATELIER-abcdef',name:'Première Œuvre',royaltiesPct:5,
    attributes:'tags:xartists',uris:['https://ipfs.io/ipfs/QmYwAPJzv5CZsnAzt8auVZRnG3iGgJ9Y2WwyHdBoY57iwW']}
  const tx=creator.buildEsdtNftCreateTx(args)
  const parts=tx.data.split('@')
  assert.equal(tx.receiver,'__SENDER__')
  assert.equal(parts[0],'ESDTNFTCreate')
  assert.equal(parts[2],'01')
  assert.equal(parts[4],'01f4')
  assert.throws(()=>creator.buildEsdtNftCreateTx({...args,uris:[]}))
  assert.throws(()=>creator.buildEsdtNftCreateTx({...args,uris:['javascript:alert(1)']}))
  assert.throws(()=>creator.buildEsdtNftCreateTx({...args,quantity:10}))
  assert.throws(()=>creator.buildEsdtNftCreateTx({...args,royaltiesPct:90}))
})

test('Creator proof requires matching NFT collection; role belongs to the exact wallet',async()=>{
  const before=globalThis.fetch
  globalThis.fetch=async()=>({ok:true,json:async()=>({
    collection:'ATELIER-abcdef',type:'NonFungibleESDT',owner:artist,
    roles:[{address:artist,roles:['ESDTRoleNFTCreate']}],
  })})
  try{
    const proof=await creator.fetchArtistCollectionProof('ATELIER-abcdef',artist)
    assert.equal(proof.owner,artist)
    assert.equal(proof.hasCreateRole,true)
    const other='erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq'
    // Unverified address must fail closed.
    await assert.rejects(creator.fetchArtistCollectionProof('ATELIER-abcdef','not-erd1'))
    assert.match(other,/^erd1/)
  }finally{globalThis.fetch=before}
})

test('Unsigned wallet-hook submissions are pending, not a successful mint',async()=>{
  assert.equal(await creator.verifyArtistTransaction('wallet-hook',artist),'pending')
  assert.equal(await creator.verifyArtistTransaction('submitted',artist),'pending')
  assert.equal(await creator.verifyArtistTransaction(null,artist),'pending')
})

test('Draft cannot be silently reused by a different wallet',()=>{
  const old=globalThis.localStorage
  const db=new Map()
  globalThis.localStorage={setItem:(key,value)=>db.set(key,value),
    getItem:key=>db.get(key)??null}
  try{
    creator.saveStudioCollection({name:'Test Art',ticker:'ART',walletAddress:artist,at:1})
    assert.equal(creator.loadStudioCollection(artist).ticker,'ART')
    assert.equal(creator.loadStudioCollection('erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq'),null)
  }finally{globalThis.localStorage=old}
})
