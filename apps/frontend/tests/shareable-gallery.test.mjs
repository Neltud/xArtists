import test from 'node:test'
import assert from 'node:assert/strict'
import {buildShareableGallery,shareableGalleryFileName} from '../src/lib/shareableGallery.mjs'
import {newGalleryDraft,inspectLocalGalleryImage} from '../src/lib/creatorGalleryDraft.mjs'

const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6HZgAAAAASUVORK5CYII=','base64')
async function fixture(){
  const file=new File([png],'image.png',{type:'image/png'})
  const {sourceSha256}=await inspectLocalGalleryImage(file)
  return {file,draft:{...newGalleryDraft(),name:'Exposition été',description:'Présentation\nSur deux lignes',
    works:[{id:'one',title:'Une œuvre',artist:'Artiste',description:'Un cartel',kind:'painting',
      image:'',sourceSha256,localFileName:file.name,priceEgld:200}]}}
}

test('a real local image produces a complete offline exhibition without transactional or remote media',async()=>{
  const {file,draft}=await fixture()
  const html=await buildShareableGallery(draft,{one:file},{includeImages:true})
  assert.ok(html.startsWith('<!doctype html>'))
  assert.match(html,/<html lang="fr">/)
  assert.match(html,/<h1>Exposition été<\/h1>/)
  assert.match(html,new RegExp('src="data:image/png;base64,'+png.toString('base64').replace(/[+]/g,'\\+')+'"'))
  assert.match(html,/default-src 'none'/)
  assert.doesNotMatch(html,/<script|<iframe|<form|src="https?:|<link|EGLD|sourceSha256|localFileName/)
  assert.doesNotMatch(html,/200|private_key|walletconnect/)
})

test('untrusted exhibition names, artists, captions and descriptions remain inert text',async()=>{
  const {file,draft}=await fixture()
  draft.name='</title><script>alert(1)</script>'
  draft.description='<img src=x onerror="attack()">'
  draft.works[0].title='"><svg onload="attack()">'
  draft.works[0].artist='<iframe src="https://evil.invalid">'
  draft.works[0].description='</figcaption><script>attack()</script>'
  const html=await buildShareableGallery(draft,{one:file},{includeImages:true})
  assert.doesNotMatch(html,/<script|<svg|<iframe|<img src=x|<\/figcaption><script/)
  assert.match(html,/&lt;script&gt;/)
  assert.match(html,/alt="&quot;&gt;&lt;svg onload=&quot;attack\(\)&quot;&gt;"/)
})

test('missing or changed local images fail rather than silently exporting an incomplete gallery',async()=>{
  const {file,draft}=await fixture()
  await assert.rejects(()=>buildShareableGallery(draft,{}, {includeImages:true}),/gallery_local_images_required/)
  const changed=new File([png,Uint8Array.of(1)],'image.png',{type:'image/png'})
  await assert.rejects(()=>buildShareableGallery(draft,{one:changed},{includeImages:true}),/gallery_image_changed/)
  draft.works[0].sourceSha256=null
  draft.works[0].image='https://private.invalid/original.png'
  await assert.rejects(()=>buildShareableGallery(draft,{one:file},{includeImages:true}),/gallery_local_images_required/)
})

test('image inclusion is an explicit decision and an empty or invalid exhibition is rejected',async()=>{
  const {file,draft}=await fixture()
  await assert.rejects(()=>buildShareableGallery(draft,{one:file}),/gallery_export_consent_required/)
  await assert.rejects(()=>buildShareableGallery(newGalleryDraft(),{}, {includeImages:true}),/gallery_has_no_artworks/)
  await assert.rejects(()=>buildShareableGallery({works:[]},{},{includeImages:true}),/gallery_has_no_artworks/)
})

test('the total image budget is checked before file contents are loaded',async()=>{
  const {draft}=await fixture()
  draft.works.push({...draft.works[0],id:'two'})
  const file={size:11*1024*1024,name:'large.png',type:'image/png',arrayBuffer:()=>assert.fail('must not allocate files above the total budget')}
  await assert.rejects(()=>buildShareableGallery(draft,{one:file,two:file},{includeImages:true}),/gallery_export_too_large/)
})

test('a renamed SVG or a forged MIME type cannot become active content',async()=>{
  const {draft}=await fixture()
  const svg=new File(['<svg onload="attack()">not a PNG</svg>'],'forged.png',{type:'image/png'})
  await assert.rejects(()=>buildShareableGallery(draft,{one:svg},{includeImages:true}),/invalid_local_image_signature/)
  const forbidden=new File([png],'original.svg',{type:'image/svg+xml'})
  await assert.rejects(()=>buildShareableGallery(draft,{one:forbidden},{includeImages:true}),/unsupported_local_image_type/)
})

test('download filenames remain portable and cannot escape their intended filename',()=>{
  assert.equal(shareableGalleryFileName('Été / Lumière'),'xartists-ete-lumiere.html')
  assert.equal(shareableGalleryFileName('../../'),'xartists-exposition.html')
  assert.ok(shareableGalleryFileName('a'.repeat(200)).length<90)
})
