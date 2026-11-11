import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8')
const lab=read('../src/pages/LabPage.tsx')
const turntable=read('../src/components/ArtworkTurntableLab.tsx')
const preview=read('../src/components/StudioGlbPreview.tsx')
const studio=read('../src/pages/StudioPage.tsx')
const twin=read('../src/pages/DigitalTwinPage.tsx')

test('sculpture journey links preview, independent reconstruction and signed mint',()=>{
 assert.match(lab,/to="\/studio\?mode=sculpture"/)
 assert.match(studio,/id="xa-studio-mint"/)
 assert.match(studio,/<CreatorMediaUpload title=\{nftName\}/)
 assert.match(studio,/onClick=\{\(\) => void runMint\(\)\}/)
 assert.match(twin,/to="\/studio\?mode=sculpture"/)
})
test('local turntable accepts GLB without auto publishing or synthetic certification',()=>{
 assert.match(turntable,/import StudioGlbPreview from '\.\/StudioGlbPreview'/)
 assert.match(turntable,/accept="\.glb,model\/gltf-binary"/)
 assert.match(turntable,/file\.size>32\*1024\*1024/)
 assert.match(turntable,/<StudioGlbPreview file=\{glbFile\}/)
 assert.doesNotMatch(turntable,/sendTransaction|fetch\(|new WebSocket|wallet\.sign/)
 assert.match(preview,/checkLocalGlb\(bytes\)/)
 assert.match(preview,/r\.asset|model\?\.asset\?\.version/)
 assert.match(preview,/GLB : référence externe interdite/)
})
