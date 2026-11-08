import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const ui=readFileSync(new URL('../src/components/CreatorMediaUpload.tsx', import.meta.url),'utf8')
const studio=readFileSync(new URL('../src/pages/StudioPage.tsx', import.meta.url),'utf8')

test('GLB models have a separate server-mediated upload gate and local-only selection',()=>{
  assert.match(ui,/model\/gltf-binary/)
  assert.match(ui,/32\*1024\*1024/)
  assert.match(ui,/modelEnabled/)
  assert.match(ui,/setModelEnabled\(j\?\.modelEnabled===true\)/)
  assert.match(ui,/file\.type==='model\/gltf-binary'&&!modelEnabled/)
  assert.match(ui,/GLB ne constitue pas un scan certifié/)
  assert.doesNotMatch(ui,/PINATA_JWT|process\.env|localStorage\.setItem/)
})

test('Studio preserves artist-signed mint and separate metadata path',()=>{
  assert.match(studio,/onReady=\{pin =>/)
  assert.match(studio,/useStudioMintTx\(\)/)
  assert.match(ui,/signAccessMessage/)
  assert.match(ui,/rightsAccepted:true/)
  assert.match(ui,/studio_glb_upload_disabled/)
})
