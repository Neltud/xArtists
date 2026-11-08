import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const ui=readFileSync(new URL('../src/components/CreatorMediaUpload.tsx', import.meta.url),'utf8')
const studio=readFileSync(new URL('../src/pages/StudioPage.tsx', import.meta.url),'utf8')
const modelPreview=readFileSync(new URL('../src/components/StudioGlbPreview.tsx',import.meta.url),'utf8')

test('GLB models have a separate server-mediated upload gate and local-only selection',()=>{
  assert.match(ui,/model\/gltf-binary/)
  assert.match(ui,/32\*1024\*1024/)
  assert.match(ui,/modelEnabled/)
  assert.match(ui,/setModelEnabled\(j\?\.modelEnabled===true\)/)
  assert.match(ui,/file\.type==='model\/gltf-binary'&&!modelEnabled/)
  assert.match(ui,/<StudioGlbPreview file=\{file\}\/>/)
  assert.match(modelPreview,/checkLocalGlb\(bytes\)/)
  assert.match(modelPreview,/GLTFLoader/)
  assert.match(modelPreview,/OrbitControls/)
  assert.match(modelPreview,/aucune publication/i)
  assert.doesNotMatch(ui,/PINATA_JWT|process\.env|localStorage\.setItem/)
})

test('Studio preserves artist-signed mint and separate metadata path',()=>{
  assert.match(studio,/onReady=\{pin =>/)
  assert.match(studio,/useStudioMintTx\(\)/)
  assert.match(ui,/signAccessMessage/)
  assert.match(ui,/rightsAccepted:true/)
  assert.match(ui,/studio_glb_upload_disabled/)
})

test('GLB publication submits same-session poster before immutable metadata',()=>{
  assert.match(ui,/const \[posterFile,setPosterFile\]=useState<File\|null>\(null\)/)
  assert.match(ui,/previewUploadId/)
  assert.match(ui,/posterResponse=await fetch\(base\+'\/v1\/studio\/media\/upload'/)
  assert.match(ui,/body:chosenPoster/)
  assert.match(ui,/uploadId:data\.uploadId,previewUploadId,title:/)
  assert.match(ui,/!modelEnabled\|\|!posterFile/)
  assert.match(ui,/Image de couverture obligatoire/)
})
