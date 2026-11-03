import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeArtPHash64V1, rankArtPHashCandidatesV1, ART_PHASH_V1 } from '../src/artIdentityVision.mjs'
import { compareVisualHash64V1 } from '../src/artIdentity.mjs'

function frame(width,height,fn,alpha=255) {
  const rgba=new Uint8Array(width*height*4)
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const i=4*(y*width+x),v=fn(x,y,width,height)
    rgba.set([v,v,v,alpha],i)
  }
  return {width,height,rgba}
}
function verticalBlocks(x,y,w,h) {
  return (x/w<0.5?30:220)+(y/h<0.5?0:15)
}
function horizontalBlocks(x,y,w,h) {
  return y/h<0.5?30:220
}

test('DCT perceptual golden is deterministic and repeatable across sizes',()=>{
  const first=computeArtPHash64V1(frame(32,32,verticalBlocks))
  const twice=computeArtPHash64V1(frame(64,64,verticalBlocks))
  assert.equal(first.schema,ART_PHASH_V1)
  assert.equal(first.phash64,'1931668bee31199b')
  assert.equal(first.phash64,twice.phash64)
  assert.equal(first.quality,'candidate_only')
  assert.equal(first.unique_fingerprint,false)
  assert.equal(first.certified_authentic,false)
})

test('substantially different visual arrangements generate different candidates',()=>{
  const x=computeArtPHash64V1(frame(32,32,verticalBlocks))
  const y=computeArtPHash64V1(frame(32,32,horizontalBlocks))
  assert.match(y.phash64,/^[a-f0-9]{16}$/)
  assert.notEqual(x.phash64,y.phash64)
  assert.equal(compareVisualHash64V1(x.phash64,x.phash64).candidate_similarity,true)
  const matched=rankArtPHashCandidatesV1(x.phash64,[
    {reference:'museum:unrelated',phash64:y.phash64},
    {reference:'museum:same',phash64:x.phash64},
  ])
  assert.deepEqual(matched.candidates.map(x=>x.reference),['museum:same'])
  assert.equal(matched.matches_are_proof,false)
  assert.equal(matched.disposition,'human_review_required')
})

test('uniform, fully transparent and near-flat inputs are low information',()=>{
  const uniform=computeArtPHash64V1(frame(32,32,()=>128))
  assert.equal(uniform.phash64,null)
  assert.equal(uniform.quality,'low_information')
  const transparent=computeArtPHash64V1(frame(32,32,verticalBlocks,0))
  assert.equal(transparent.phash64,null)
  assert.equal(transparent.certified_authentic,false)
  const almostFlat=computeArtPHash64V1(frame(32,32,(x)=>x%2?128:129))
  assert.equal(almostFlat.phash64,null)
})

test('native browser Uint8ClampedArray image data is accepted', () => {
  const frameData = frame(32, 32, verticalBlocks)
  const browserData = {
    ...frameData,
    rgba:new Uint8ClampedArray(frameData.rgba),
  }
  assert.equal(computeArtPHash64V1(browserData).phash64,
    computeArtPHash64V1(frameData).phash64)
})

test('strict bounds protect the vision pipeline from huge malformed frames',()=>{
  const valid=frame(32,32,verticalBlocks)
  for(const input of [
    null,{}, {width:0,height:32,rgba:valid.rgba},
    {width:32.5,height:32,rgba:valid.rgba},
    {width:5000,height:1,rgba:new Uint8Array(5000*4)},
    {width:32,height:32,rgba:new Uint8Array(24)},
    {width:32,height:32,rgba:Array(32*32*4).fill(42)},
    {width:2048,height:2048,rgba:new Uint8Array(1)},
  ]) {
    assert.throws(()=>computeArtPHash64V1(input),/decoded_rgba/)
  }
})

test('visual matcher is deterministic, bounded, and never certifies fraud',()=>{
  const a='0000000000000000',b='0000000000000001'
  const r=rankArtPHashCandidatesV1(a,[
    {reference:'museum:z',phash64:b},
    {reference:'museum:a',phash64:b},
    {reference:'museum:exact',phash64:a},
    {reference:'museum:far',phash64:'ffffffffffffffff'},
  ])
  assert.deepEqual(r.candidates.map(x=>x.reference),['museum:exact','museum:a','museum:z'])
  assert.deepEqual(r.candidates.map(x=>x.distance),[0,1,1])
  assert.equal(r.matches_are_proof,false)
  assert.deepEqual(rankArtPHashCandidatesV1(a,[],{}).candidates,[])
  assert.deepEqual(rankArtPHashCandidatesV1(a,[{reference:'only',phash64:b}],{limit:1,threshold:0}).candidates,[])
  for(const [query,items,opts] of [
    ['foo',[],{}],[a,Array(2001).fill({reference:'ref',phash64:a}),{}],
    [a,[{reference:'../bad',phash64:a}],{}],
    [a,[{reference:'museum:ok',phash64:'XYZ'}],{}],
    [a,[],{threshold:32}],[a,[],{limit:100}],
  ]) {
    assert.throws(()=>rankArtPHashCandidatesV1(query,items,opts),/invalid_visual/)
  }
})
