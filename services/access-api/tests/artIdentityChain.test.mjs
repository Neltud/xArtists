import { test } from 'node:test'
import assert from 'node:assert/strict'
import { probeMvxNftMetadataReadOnly } from '../src/artIdentityChain.mjs'

const CREATOR = 'erd1sg4u62lzvgkeu4grnlwn7h2s92rqf8a64z48pl9c7us37ajv9u8qj9w8xg'
const OTHER_CREATOR = 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u'
const identifier = 'ARTID-abcdef-07'
const input = { network:'multiversx-testnet',nft_identifier:identifier }
const valid = () => ({
  identifier, collection:'ARTID-abcdef', nonce:7,
  creator:CREATOR, attributes:'metadata:bafy-test-mock/metadata.json',
  uris:['ipfs://bafy-test-mock/artwork.jpg'],
  hash:'base64-indexer-hash-opaque',
})
const stub = (data = valid(), status = 200) => {
  const calls = []
  const request = async (url,opts) => {
    calls.push({url,opts})
    return {ok:status===200,status,
      headers:{get:()=>null},
      json:async()=>data}
  }
  return {request,calls}
}

test('GET read-only from strict testnet URL and never certify a work', async () => {
  const s=stub()
  const r=await probeMvxNftMetadataReadOnly({...input,expected_creator:CREATOR},s.request)
  assert.equal(s.calls.length,1)
  assert.equal(s.calls[0].url,'https://testnet-api.multiversx.com/nfts/ARTID-abcdef-07')
  assert.equal(s.calls[0].opts.method,'GET')
  assert.equal(s.calls[0].opts.redirect,'error')
  assert.equal(r.checked,true)
  assert.equal(r.verified,false)
  assert.equal(r.certified_authentic,false)
  assert.equal(r.certified_owner,false)
  assert.equal(r.reported_creator_matches_expected,true)
  assert.equal(r.uris_count,1)
  assert.match(r.provider_metadata_fingerprint,/^[a-f0-9]{64}$/)
})

test('mainnet and devnet are independent allowlisted hosts', async () => {
  for (const [network,host] of [
    ['multiversx-mainnet','https://api.multiversx.com'],
    ['multiversx-devnet','https://devnet-api.multiversx.com'],
  ]) {
    const s=stub()
    const result=await probeMvxNftMetadataReadOnly({...input,network},s.request)
    assert.equal(result.checked,true)
    assert.equal(s.calls[0].url,host+'/nfts/'+identifier)
  }
})

test('malformed identifier and network never cause network I/O', async () => {
  const s=stub()
  for (const p of [
    {network:'evm-mainnet'},
    {network:'https://evil.example'},
    {nft_identifier:'../admin'},
    {nft_identifier:'ARTID-abcdef-00'},
    {nft_identifier:'artid-abcdef-01'},
    {nft_identifier:'ARTID-abcdef'},
    {expected_creator:'erd1bogus'},
  ]) {
    const r=await probeMvxNftMetadataReadOnly({...input,...p},s.request)
    assert.equal(r.checked,false)
    assert.equal(r.verified,false)
  }
  assert.equal(s.calls.length,0)
})

test('indexer mismatch and invalid fields fail closed', async () => {
  for (const edit of [
    x=>{x.identifier='FOO-abcdef-07'},
    x=>{x.collection='ARTID-bbffcc'},
    x=>{x.nonce=6},
    x=>{x.uris=['ipfs://okay',17]},
    x=>{x.uris=Array(33).fill('url')},
    x=>{x.attributes={raw:true}},
    x=>{x.creator='erd1'+'q'.repeat(58)},
  ]) {
    const data=valid()
    edit(data)
    const r=await probeMvxNftMetadataReadOnly(input,stub(data).request)
    assert.equal(r.checked,false)
    assert.equal(r.certified_authentic,false)
  }
})

test('reassessment detects changed metadata fingerprint; creator mismatch is only a clue', async () => {
  const before=await probeMvxNftMetadataReadOnly(
    {...input,expected_creator:OTHER_CREATOR},stub().request)
  const data=valid()
  data.uris=['ipfs://bafy-other-content/artwork.jpg']
  const after=await probeMvxNftMetadataReadOnly(
    {...input,expected_creator:OTHER_CREATOR},stub(data).request)
  assert.equal(before.checked,true)
  assert.equal(after.checked,true)
  assert.notEqual(before.provider_metadata_fingerprint,after.provider_metadata_fingerprint)
  assert.equal(before.reported_creator_matches_expected,false)
  assert.equal(before.verified,false)
})

test('transport failures, non-200 and oversized content never verify', async () => {
  let x=await probeMvxNftMetadataReadOnly(input,async()=>{throw Error('network unavailable')})
  assert.equal(x.checked,false)
  assert.equal(x.verified,false)
  x=await probeMvxNftMetadataReadOnly(input,stub(valid(),503).request)
  assert.equal(x.checked,false)
  x=await probeMvxNftMetadataReadOnly(input,async()=>({
    ok:true,status:200,headers:{get:()=>String(300*1024)},
    json:async()=>{throw Error('should_not_parse')}
  }))
  assert.equal(x.checked,false)
})
