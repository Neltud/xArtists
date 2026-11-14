import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {
  GALLERY_KEY,MAX_ART,newGalleryDraft,validateGalleryDraft,
  addArtworkToDraft,galleryFrames,saveGalleryDraft,loadGalleryDraft,inspectLocalGalleryImage,
} from '../src/lib/creatorGalleryDraft.mjs'

const base=newGalleryDraft()
const art={title:'Sculpture en bronze',kind:'sculpture',artist:'Atelier',
  description:'Œuvre physique',image:'https://assets.example.org/art.jpg',priceEgld:'1.25'}
test('creator can compose and store a real local 3D exhibition with zero sales',()=>{
 let gallery={...base,role:'gallery',name:'Salon',description:'Exposition test'}
 gallery=addArtworkToDraft(gallery,art)
 assert.ok(gallery)
 assert.equal(gallery.works.length,1)
 assert.equal(gallery.works[0].priceEgld,1.25)
 const frames=galleryFrames(gallery)
 assert.equal(frames.length,1)
 assert.equal(frames[0].kind,'sculpture')
 assert.equal(frames[0].onSale,false)
 assert.match(frames[0].provenance,/non vérifiés/)
 assert.equal(gallery.publish_status,'local_only')
 assert.equal(gallery.sale_enabled,false)
 let value=null
 const storage={getItem:key=>key===GALLERY_KEY?value:null,
  setItem:(key,v)=>{assert.equal(key,GALLERY_KEY);value=v}}
 assert.equal(saveGalleryDraft(gallery,storage),true)
 assert.deepEqual(loadGalleryDraft(storage),gallery)
})
test('hostile input never grants listing, paid rights, or changes creator identity',()=>{
 const spoof={...base,role:'seller',name:'Role test',sale_enabled:true,
   publish_status:'published',verified_owner:true,
   works:[{...art,onSale:true,priceEgld:0.4,listing_verified:true,
     royalty_override:true,proof:'fake'}]}
 const safe=validateGalleryDraft(spoof)
 assert.equal(safe.sale_enabled,false)
 assert.equal(safe.publish_status,'local_only')
 assert.equal(safe.works[0].listing_verified,false)
 assert.equal(galleryFrames(safe)[0].onSale,false)
 assert.equal('verified_owner'in safe,false)
 assert.equal('royalty_override'in safe.works[0],false)
})
test('HTML/javascript and malicious image URL are not persisted as active resources',()=>{
 for(const href of ['javascript:alert(1)','data:image/svg+xml,<svg>',
   'http://nonsecure.test/x.png','https://evil:password@example.com/x.png',
   '//example.com/x','file:///etc/passwd']){
   const one=addArtworkToDraft(base,{...art,image:href})
   assert.equal(one.works[0].image,'',href)
 }
 const allowed=addArtworkToDraft(base,art)
 assert.equal(allowed.works[0].image,'https://assets.example.org/art.jpg')
})
test('bounded roles, capped 16 works and strictly validated draft schema',()=>{
 assert.equal(MAX_ART,16)
 assert.equal(validateGalleryDraft({...base,role:'unauthorized'}),null)
 assert.equal(validateGalleryDraft({...base,schema:'foreign'}),null)
 assert.equal(validateGalleryDraft({...base,works:[{}]}),null)
 let next=base
 for(let i=0;i<16;i++)next=addArtworkToDraft(next,{...art,title:'Work '+i})
 assert.equal(next.works.length,16)
 assert.equal(addArtworkToDraft(next,art),null)
 const repeated={...next,works:[next.works[0],next.works[0]]}
 assert.equal(validateGalleryDraft(repeated),null)
 assert.equal(loadGalleryDraft({getItem:()=>'{broken json'}).works.length,0)
 assert.equal(loadGalleryDraft({getItem:()=>'{'.repeat(45000)}).works.length,0)
})
test('local JPEG/PNG/WebP bytes are checked before a private preview and never stored',async()=>{
 const png=Uint8Array.from([137,80,78,71,13,10,26,10,1,2,3,4,5,6,7,8])
 const file={type:'image/png',name:'atelier.png',size:png.length,arrayBuffer:async()=>png.buffer}
 const info=await inspectLocalGalleryImage(file)
 assert.equal(info.sourceSha256,createHash('sha256').update(png).digest('hex'))
 assert.equal(info.localFileName,'atelier.png')
 assert.equal(info.mime,'image/png')
 const gallery=addArtworkToDraft(base,{...art,image:'',
   sourceSha256:info.sourceSha256,localFileName:info.localFileName})
 assert.equal(gallery.works[0].image,'')
 assert.equal(gallery.works[0].sourceSha256,info.sourceSha256)
 assert.equal(gallery.works[0].localFileName,'atelier.png')
 assert.equal(gallery.works[0].listing_verified,false)
 assert.equal(galleryFrames(gallery)[0].onSale,false)
 let stored
 assert.equal(saveGalleryDraft(gallery,{setItem:(_key,value)=>{stored=value}}),true)
 assert.ok(!stored.includes('blob:'))
 assert.ok(!stored.includes('data:image'))
 assert.ok(!stored.includes('137,80,78,71'))
 assert.deepEqual(loadGalleryDraft({getItem:()=>stored}),gallery)
})
test('local image filter rejects forged MIME, altered bytes, SVG, oversized and bad buffers',async()=>{
 const png=Uint8Array.from([137,80,78,71,13,10,26,10,1,2,3,4,5,6,7,8])
 const file=(bytes,type='image/png',name='art.png')=>({
   type,name,size:bytes.length,arrayBuffer:async()=>bytes.buffer,
 })
 await assert.rejects(inspectLocalGalleryImage(file(png,'image/svg+xml','art.svg')),/unsupported_local_image_type/)
 await assert.rejects(inspectLocalGalleryImage(file(Uint8Array.from([1,2,3,4,5,6,7,8,9,10,11,12]))),/invalid_local_image_signature/)
 await assert.rejects(inspectLocalGalleryImage({
   type:'image/png',name:'huge.png',size:17*1024*1024,
   arrayBuffer:()=>{throw Error('file must not be read')},
 }),/invalid_local_image_size/)
 await assert.rejects(inspectLocalGalleryImage({
   ...file(png),size:100,
 }),/local_image_bytes_mismatch/)
 await assert.rejects(inspectLocalGalleryImage(file(png,'application/octet-stream','art.png')),/unsupported_local_image_type/)
 const jpeg=Uint8Array.from([255,216,255,225,1,2,3,4,5,6,7,8])
 assert.equal((await inspectLocalGalleryImage(file(jpeg,'image/jpeg','art.jpg'))).mime,'image/jpeg')
 const webp=Uint8Array.from([82,73,70,70,1,2,3,4,87,69,66,80])
 assert.equal((await inspectLocalGalleryImage(file(webp,'image/webp','art.webp'))).mime,'image/webp')
 const jpegChanged=Uint8Array.from([...jpeg.slice(0,-1),9])
 assert.notEqual((await inspectLocalGalleryImage(file(jpeg,'image/jpeg','art.jpg'))).sourceSha256,
   (await inspectLocalGalleryImage(file(jpegChanged,'image/jpeg','art.jpg'))).sourceSha256)
})
test('gallery digest is not authentication and forged persisted proof cannot activate commerce',()=>{
 const poisoned={...base,sale_enabled:true,publish_status:'published',works:[{
   ...art,id:'art-1',sourceSha256:'f'.repeat(64),localFileName:'../fake.png',
   verified_owner:true,onSale:true,
 }]}
 const safe=validateGalleryDraft(poisoned)
 assert.equal(safe.works[0].sourceSha256,'f'.repeat(64))
 assert.equal(safe.works[0].localFileName,'.._fake.png')
 assert.equal(safe.works[0].listing_verified,false)
 assert.equal(safe.sale_enabled,false)
 assert.equal(galleryFrames(safe)[0].onSale,false)
 const invalid=validateGalleryDraft({...poisoned,works:[{
   ...poisoned.works[0],sourceSha256:'not-a-hash',
 }]})
 assert.equal(invalid.works[0].sourceSha256,null)
})
test('page is a Three.js museum gallery creator, no mint, checkout or live-selling action',()=>{
 const page=readFileSync(new URL('../src/pages/CreatorGalleryPage.tsx',import.meta.url),'utf8')
 const routes=readFileSync(new URL('../src/experience/modules.ts',import.meta.url),'utf8')
 const museum=readFileSync(new URL('../src/pages/MuseumPage.tsx',import.meta.url),'utf8')
 assert.match(page,/<MuseumHall/)
 assert.match(page,/inspectLocalGalleryImage/)
 assert.match(page,/restorePreview/)
 assert.match(page,/forgetPreview/)
 assert.match(page,/type="file"/)
 assert.match(page,/Aucun upload|aucun upload/)
 assert.match(page,/sourceSha256/)
 assert.match(page,/allowBuy=\{false\}/)
 assert.match(page,/createObjectURL/)
 assert.match(page,/publish_status|Publication, achat et vente/)
 assert.match(routes,/module\('gallery-builder','\/create\/gallery'/)
 assert.match(museum,/to="\/create\/gallery"/)
 assert.doesNotMatch(page,/sendTransactions|createCheckout|buyPack|rentPayLive|mintJob|signAndSend|broadcastTransaction/)
})
