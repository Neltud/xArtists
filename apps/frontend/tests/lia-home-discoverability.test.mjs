import {test} from 'node:test'
import assert from 'node:assert/strict'
import {architecture as a,catalogue,navigation as n} from './architecture-catalogue.mjs'
test('agents are a task area and owned access joins the same contextual navigation',()=>{
 assert.equal(a.PRIMARY_AREAS.find(x=>x.id==='intelligence').to,'/intelligence/xorus')
 assert.deepEqual(a.contextualModules(catalogue,'agents').map(x=>x.id),['lia','agents','packs','lab'])
})
test('all historical LIA, agent and access links select the same task area',()=>{
 for(const path of ['/xorus','/lia','/intelligence/lia','/agents','/packs','/my-packs','/salles','/workspace/agents'])assert.equal(n.currentPrimarySection(path,catalogue),'intelligence',path)
})
