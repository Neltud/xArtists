import {test} from 'node:test'
import assert from 'node:assert/strict'
import {ART_TEMPLATES, prepareArtCollection, validateArtLayers} from '../src/lib/artCollectionPaper.mjs'

const base = {
  title:'Chromatic Originals', description:'Collection originale de formes peintes et dégradés.',
  quantity: 6, seed:'original-collection-seed-2026', mode:'template', template:'chromatic',
  creatorType:'human_artist', rightsConfirmed:true,
}

test('template generates deterministic independently numbered NFT metadata without claiming actual images',async()=>{
  const a=await prepareArtCollection(base),b=await prepareArtCollection(base)
  assert.deepEqual(a,b)
  assert.equal(a.editions.length,6)
  assert.equal(a.planDigest.length,64)
  assert.ok(a.editions.every(e=>e.image===null && e.xartists.media_state==='not_generated_or_uploaded'))
  assert.equal(new Set(a.editions.map(x=>x.name)).size,6)
  assert.equal(a.moneyCharged,false)
  assert.equal(a.creditsDebited,false)
  assert.equal(a.aiImagesGenerated,0)
  assert.equal(a.mintEnabled,false)
  assert.equal(a.distributorDeployEnabled,false)
  assert.equal(a.paperCreditsTotal,18)
  assert.ok(a.blockers.includes('provider_quote_and_real_credit_ledger_not_ready'))
  assert.notDeepEqual(a.editions,(await prepareArtCollection({...base,seed:base.seed+'change'})).editions)
})

test('weighted custom layers, unique traits, per-token metadata edit overrides',async()=>{
  const layers=[
    {name:'Background',variants:[{value:'Blue',weight:10},{value:'Yellow',weight:1}]},
    {name:'Material',variants:[{value:'Canvas',weight:1}]},
  ]
  const a=await prepareArtCollection({
    ...base,mode:'layers',layers,quantity:2,template:undefined,
    overrides:{'2':{name:'The second piece',description:'Individual description',
      extraAttributes:[{trait_type:'Mood',value:'Dream'}]}},
  })
  assert.equal(a.editions[1].name,'The second piece')
  assert.equal(a.editions[1].description,'Individual description')
  assert.equal(a.editions[1].attributes.at(-1).value,'Dream')
  assert.ok(['Blue','Yellow'].includes(a.editions[0].attributes[0].value))
  assert.equal(a.editions[0].attributes[1].value,'Canvas')
  assert.equal(a.editions[0].attributes.at(-1).value,'1')
  assert.equal(a.paperCreditsTotal,6)
})

test('AI agent plans require explicit identity but never authorize spending or wallet signing',async()=>{
  await assert.rejects(prepareArtCollection({...base,creatorType:'ai_agent'}),/invalid_agent_reference/)
  const a=await prepareArtCollection({...base,creatorType:'ai_agent',agentId:'agent:gallery-bot',rightsConfirmed:false})
  assert.equal(a.creatorType,'ai_agent')
  assert.equal(a.moneyCharged,false)
  assert.equal(a.artworkRightsVerified,false)
  assert.ok(a.blockers.includes('signed_agent_mandate_and_wallet_authorization_required'))
  assert.ok(a.blockers.includes('creator_rights_confirmation_missing'))
})

test('strict quantity, template, metadata override and cost control validation',async()=>{
  for (const input of [
    {...base,quantity:0},
    {...base,quantity:101},
    {...base,quantity:2.5},
    {...base,mode:'invalid'},
    {...base,template:'evil'},
    {...base,seed:'tiny'},
    {...base,overrides:{'7':{name:'invalid'}}},
    {...base,overrides:{'1':{image:'ipfs://fake'}}},
    {...base,overrides:{'1':{extraAttributes:[{trait_type:'Background',value:'Faux'}]}}},
    {...base,overrides:{'1':{name:'<script>'}}},
  ]) await assert.rejects(prepareArtCollection(input))
})

test('layer weights, duplicate keys and data types rejected',()=>{
  assert.ok(ART_TEMPLATES.chromatic.layers.length>=2)
  for(const bad of [
    [],[{name:'Duplicate',variants:[{value:'Same',weight:0}]}],
    [{name:'Duplicate',variants:[{value:'Same',weight:1},{value:'Same',weight:2}]}],
    [{name:'Layer',variants:[{value:'A',weight:1}]},{name:'layer',variants:[{value:'B',weight:1}]}],
    [{name:'Script',variants:[{value:'<img>',weight:1}]}],
  ]) assert.throws(()=>validateArtLayers(bad))
})
