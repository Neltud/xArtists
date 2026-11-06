import assert from 'node:assert/strict'
import {test} from 'node:test'
import fs from 'node:fs'
import vm from 'node:vm'
const context={URL,BigInt};vm.createContext(context);vm.runInContext(fs.readFileSync(new URL('../public/plugins/xa-world-rights/core.js',import.meta.url),'utf8'),context)
const core=context.XAWorldRights
const input={creator:'Alice',title:'Original',platform:'instagram',format:'photo',source:'https://instagram.com/p/example',price:'250.10',royalty:'8.00',use:'Editorial',territory:'France',term:'90 jours',rightsDeclared:true,musicCleared:true,listingConsent:true}
test('money is exact and no local declaration authorizes commerce',()=>{
 const d=core.draft(input);assert.equal(d.offer.amountBaseUnits,'25010');assert.equal(d.offer.royaltyBps,800)
 for(const k of ['monetizationAuthorized','listingAuthorized','liveReady'])assert.equal(d[k],false)
 assert.equal(d.evidenceVerification,'unverified')
 for(const value of ['-1','1e3','NaN','1.001','Infinity'])assert.throws(()=>core.draft({...input,price:value}))
 assert.throws(()=>core.draft({...input,royalty:'100.01'}))
})
test('all catalogue networks and formats are preparation only',()=>{
 for(const platform of core.platforms)for(const format of core.formats)assert.equal(core.draft({...input,platform,format}).liveReady,false)
})
test('imports cannot preserve declarations, fake receipts or self-asserted live flags',()=>{
 const fake={...core.draft(input),liveReady:true,paymentReceipt:'verified',listingAuthorized:true}
 const d=core.importDraft(JSON.stringify(fake))
 assert.equal(d.liveReady,false);assert.equal(d.paymentReceipt,'unverified');assert.equal(d.declarations.listingConsent,false)
 assert(d.blockers.length>0)
})
test('unsafe sources, invalid imports and exclusivity without registry review fail closed',()=>{
 for(const source of ['javascript:alert(1)','http://example.com','https://user:secret@example.com'])assert.throws(()=>core.draft({...input,source}))
 assert.throws(()=>core.importDraft('x'.repeat(262145)))
 assert(core.draft({...input,exclusive:true}).blockers.some(s=>s.includes('Exclusivité')))
})
