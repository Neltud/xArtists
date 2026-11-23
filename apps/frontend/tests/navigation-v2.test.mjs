import test from 'node:test'
import assert from 'node:assert/strict'
import {architecture as a,catalogue,navigation as n} from './architecture-catalogue.mjs'

test('every module has one editorial owner and every old route resolves to it',()=>{
 assert.equal(catalogue.length,44)
 assert.deepEqual(Object.keys(a.MODULE_PLACEMENT).sort(),catalogue.map(m=>m.id).sort())
 for(const m of catalogue)for(const path of [m.path,...m.aliases]){
  assert.equal(n.currentPrimarySection(path,catalogue),a.areaFor(m.id),path)
  assert.equal(n.currentPrimarySection(path+'/?lang=fr#details',catalogue),a.areaFor(m.id),path)
 }
})
test('four task areas and the personal utility share desktop and mobile hierarchy',()=>{
 assert.deepEqual(a.PRIMARY_AREAS.map(x=>x.id),['art','studio','intelligence','ecosystem'])
 assert.deepEqual(a.MOBILE_AREAS.map(x=>x.id),['art','studio','intelligence','ecosystem','wallet'])
 for(const area of a.MOBILE_AREAS)assert.equal(n.currentPrimarySection(area.to,catalogue),area.id)
})
test('cross-cutting access, logs and token functions are assigned by meaning, not old folder',()=>{
 assert.equal(a.areaFor('packs'),'intelligence')
 assert.equal(a.areaFor('payments'),'intelligence')
 assert.equal(a.areaFor('history'),'operations')
 assert.equal(a.areaFor('status'),'help')
 assert.equal(a.areaFor('dao'),a.areaFor('tro'))
 assert.equal(a.areaFor('portfolio'),a.areaFor('wallet'))
})
test('advanced, roadmap, operator and merged entries stay out of default navigation',()=>{
 for(const id of ['auction','trading','command','history','portfolio','simulation','entities'])assert.equal(a.isNavigationVisible(id),false,id)
 for(const id of ['auction','trading','command','history'])assert.equal(a.isNavigationVisible(id,true),true,id)
 for(const id of ['portfolio','simulation','entities','sale'])assert.equal(a.isNavigationVisible(id,true),false,id)
 assert.equal(a.isNavigationVisible('unknown',true),false)
 assert.deepEqual(a.contextualModules(catalogue,'studio').map(x=>x.id),['studio','gallery-builder','nft-factory','world-rights'])
 assert.deepEqual(a.contextualModules(catalogue,'lia').map(x=>x.id),['lia','agents','packs','lab'])
})
test('alias and nested-route selection never mistakes a substring for a section',()=>{
 for(const path of ['/packs/pulse','/intelligence/agents/yield'])assert.equal(n.currentPrimarySection(path,catalogue),'intelligence')
 assert.equal(n.currentPrimarySection('/explore/artwork/ART-abcdef-01',catalogue),'art')
 for(const path of ['/','/wallet-malicious','/finance/governance-votes'])assert.equal(n.currentPrimarySection(path,catalogue),null)
 assert.equal(n.matchesDockRoute('/studio-malicious',['/studio']),false)
 assert.equal(n.matchesDockRoute('/studio',['/']),false)
 assert.equal(n.matchesDockRoute('/marketplace?tab=opensea',['/marketplace']),true)
})
test('merged experiences retain one destination and search priority follows the task hierarchy',()=>{
 assert.equal(a.MODULE_PLACEMENT.portfolio.mergedInto,'wallet')
 assert.equal(a.MODULE_PLACEMENT.simulation.mergedInto,'lab')
 assert.equal(a.MODULE_PLACEMENT.entities.mergedInto,'lab')
 const defaultSearch=catalogue.filter(m=>a.isNavigationVisible(m.id)).sort((x,y)=>a.navigationRank(x.id)-a.navigationRank(y.id))
 assert.equal(defaultSearch[0].id,'wallet')
 assert.ok(defaultSearch.findIndex(x=>x.id==='market')<defaultSearch.findIndex(x=>x.id==='tro'))
})
