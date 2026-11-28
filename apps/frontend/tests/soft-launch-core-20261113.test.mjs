import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {loadSource} from './load-source.mjs'
import {architecture as a,catalogue} from './architecture-catalogue.mjs'
const read=p=>readFileSync(new URL('../src/'+p,import.meta.url),'utf8')
test('navigation visibility is derived from one hierarchy with all 44 modules preserved',()=>{
 assert.equal(catalogue.length,44)
 const visible=catalogue.filter(x=>a.isNavigationVisible(x.id))
 assert.ok(visible.some(x=>x.id==='wallet'))
 assert.ok(visible.some(x=>x.id==='packs'))
 assert.ok(visible.some(x=>x.id==='dao'))
 assert.ok(!visible.some(x=>x.id==='history'))
})
test('route registration and capability policy are independent of presentation',()=>{
 const app=read('App.tsx'),soft=read('experience/softLaunch.ts')
 assert.match(app,/modules.flatMap/)
 assert.match(soft,/isNavigationVisible\(m.id,lab\)/)
 assert.doesNotMatch(app,/isSoftLaunchVisible/)
})
test('all public hierarchy labels have eight locale variants',()=>{
 const locale=read('experience/locale.ts')
 const keys=new Set([...a.AREAS.flatMap(x=>[x.label,x.description]),...Object.values(a.MODULE_PLACEMENT).map(x=>x.label).filter(Boolean)])
 for(const key of keys){
  const line=locale.split('\n').find(l=>l.trim().startsWith(key+':'))
  assert.ok(line,key)
  const row=loadSource('src/experience/locale.ts').copy[key]
  assert.equal(row.length,8,key)
  assert.ok(row.every(x=>typeof x==='string'&&x.trim().length>0),key)
 }
})
test('editorial preview and roadmap never become financial permission',()=>{
 const readiness=read('experience/publicReadiness.ts')
 for(const id of ['studio','gallery-builder','agents','lia','account'])assert.match(readiness,new RegExp("(?:'"+id+"'|"+id+"): 'preview'"))
 for(const id of ['trading','staking','liquidity','hatom','burnify','sale'])assert.match(readiness,new RegExp("(?:'"+id+"'|"+id+"): 'roadmap'"))
 assert.doesNotMatch(read('experience/softLaunch.ts')+read('experience/Pages.tsx')+read('experience/Shell.tsx'),/paybox_checkout_enabled\s*=\s*true|mint_live_enabled\s*=\s*true|XORUS_LIVE_TRADING\s*=\s*1/)
})
