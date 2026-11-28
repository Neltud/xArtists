import test from 'node:test'
import assert from 'node:assert/strict'
import {buildSync} from 'esbuild'
import {readFileSync} from 'node:fs'
const built=buildSync({entryPoints:[new URL('../src/lib/studioApi.ts',import.meta.url).pathname],bundle:true,format:'cjs',platform:'node',write:false})
const mod={exports:{}}
new Function('module','exports',built.outputFiles[0].text)(mod,mod.exports)
const {selectStudioApiBase,pilotConfigReady,pilotAcceptsFile,STUDIO_CANDIDATE_ORIGIN:origin}=mod.exports
test('dedicated route never accepts alternative origins or falls back after invalid configuration',()=>{
  assert.equal(selectStudioApiBase(undefined,'https://legacy.example'),'https://legacy.example')
  assert.equal(selectStudioApiBase('', ''),'')
  assert.equal(selectStudioApiBase(origin,'https://legacy.example'),origin)
  for(const invalid of ['https://evil.example',origin+'/extra',origin+'@evil.example',origin.replace('https:','http:'),null]){
    assert.equal(selectStudioApiBase(invalid,'https://legacy.example'),'')
  }
})
test('only an explicitly ready image-only pilot can enable upload',()=>{
  const ready={ok:true,enabled:true,provider:'pinata_ipfs',pilot_images_only:true,maxImageMiB:2,maxVideoMiB:0,maxAudioMiB:0,maxModelMiB:0,modelEnabled:false,mint_requires_artist_signature:true}
  assert.equal(pilotConfigReady(ready),true)
  for(const patch of [{enabled:false},{ok:false},{maxImageMiB:16},{maxVideoMiB:48},{modelEnabled:true},{mint_requires_artist_signature:false},{pilot_images_only:false},{provider:'unknown'}])assert.equal(pilotConfigReady({...ready,...patch}),false)
  assert.equal(pilotConfigReady(null),false)
  assert.equal(pilotConfigReady({enabled:true}),false)
})
test('pilot permits only bounded image uploads and rejects other formats before signing',()=>{
  for(const type of ['image/png','image/jpeg','image/webp'])assert.equal(pilotAcceptsFile({type,size:2097152}),true)
  for(const file of [{type:'image/png',size:2097153},{type:'video/mp4',size:1},{type:'audio/mpeg',size:1},{type:'model/gltf-binary',size:1},{type:'image/png',size:0}])assert.equal(pilotAcceptsFile(file),false)
  const src=readFileSync(new URL('../src/components/CreatorMediaUpload.tsx',import.meta.url),'utf8')
  assert.ok(src.indexOf('if(pilot&&file&&!pilotAcceptsFile(file))')<src.indexOf('const ch=await postJson'))
  assert.match(src,/X-Studio-Rights/)
  assert.match(src,/redirect:'error'/)
})

test('Pages uses only the verified dedicated Studio origin without secret or Render fallback',()=>{
  const workflow=readFileSync(new URL('../../../.github/workflows/static.yml',import.meta.url),'utf8')
  const line=workflow.split('\n').find(l=>l.trim().startsWith('VITE_STUDIO_API_BASE:'))
  assert.equal(line?.trim(),'VITE_STUDIO_API_BASE: '+origin)
})

test('JPEG optimization is optional, local, bounded and never auto-publishes',()=>{
 const entry=new URL('../src/lib/studioJpeg.ts',import.meta.url).pathname
 const result=buildSync({entryPoints:[entry],bundle:true,format:'cjs',platform:'node',write:false})
 const api={exports:{}}
 new Function('module','exports',result.outputFiles[0].text)(api,api.exports)
 const {studioJpegOptimizationEligible:eligible,studioJpegDimensions:dimensions}=api.exports
 assert.equal(eligible({type:'image/jpeg',size:2097153}),true)
 for(const f of [{type:'image/png',size:2097153},{type:'image/jpeg',size:2097152},{type:'image/jpeg',size:16777217}])assert.equal(eligible(f),false)
 assert.deepEqual(dimensions(4000,3000,2048),{width:2048,height:1536})
 assert.deepEqual(dimensions(640,480,2048),{width:640,height:480})
 assert.throws(()=>dimensions(10000,10000,2048))
 const src=readFileSync(new URL('../src/lib/studioJpeg.ts',import.meta.url),'utf8')
 assert.doesNotMatch(src,/\bfetch\s*\(/)
 const media=readFileSync(new URL('../src/components/CreatorMediaUpload.tsx',import.meta.url),'utf8')
 assert.match(media,/onClick=\{\(\)=>void preparePhoto\(\)\}/)
 assert.match(media,/Votre original reste inchangé/)
 assert.match(media,/setRights\(false\);setFile\(chosen\)/)
})
