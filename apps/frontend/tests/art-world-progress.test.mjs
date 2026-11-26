import test from 'node:test'
import assert from 'node:assert/strict'
import { WORLD_IDS, normalizeProgress, enterSpace, inspectArt, readProgress, saveProgress } from '../src/lib/artWorldProgress.mjs'
test('seven spaces and art discoveries survive reload without duplicates',()=>{
 const map=new Map(),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)}
 let p=normalizeProgress(null)
 for(const id of WORLD_IDS)p=enterSpace(p,id)
 p=inspectArt(inspectArt(p,'art-1'),'art-1')
 assert.equal(saveProgress(storage,p),true)
 assert.deepEqual(readProgress(storage),{space:'outdoor',visited:[...WORLD_IDS],inspected:['art-1']})
})
test('untrusted saves do not create ownership or progress for invalid spaces',()=>{
 assert.deepEqual(normalizeProgress({space:'bad',visited:['hall','hall','bad'],inspected:['a',null],wallet:'secret'}),{space:'museum',visited:['hall'],inspected:['a']})
 assert.deepEqual(readProgress({getItem:()=>'{broken'}),normalizeProgress(null))
 assert.equal(saveProgress({setItem:()=>{throw Error('quota')}},null),false)
})
