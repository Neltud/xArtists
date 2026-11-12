import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { loadSource } from './load-source.mjs'
const {disposeModelResources}=loadSource('src/lib/disposeModelResources.ts')

test('GLB cleanup releases shared geometry, materials, textures and bitmaps once',()=>{
  const calls={geometry:0,material:0,texture:0,bitmap:0}
  const image={close(){calls.bitmap++}}
  const texture={isTexture:true,image,dispose(){calls.texture++}}
  const material={map:texture,emissiveMap:texture,dispose(){calls.material++}}
  const geometry={dispose(){calls.geometry++}}
  const nodes=[{geometry,material},{geometry,material:[material]},{}]
  disposeModelResources({traverse(fn){nodes.forEach(fn)}})
  assert.deepEqual(calls,{geometry:1,material:1,texture:1,bitmap:1})
})

test('GLB resource cleanup also handles image elements and empty scenes',()=>{
  assert.doesNotThrow(()=>disposeModelResources({traverse(fn){fn({material:{map:{isTexture:true,image:{},dispose(){}},dispose(){}}})}}))
  assert.doesNotThrow(()=>disposeModelResources({traverse(){}}))
})

test('preview registers model disposal before early return and complexity rejection',()=>{
  const src=readFileSync(new URL('../src/components/StudioGlbPreview.tsx',import.meta.url),'utf8')
  assert.ok(src.indexOf('if (file.size > MAX_GLB)')<src.indexOf('await file.arrayBuffer()'))
  const parsed=src.slice(src.indexOf('const gltf = await loader.parseAsync'))
  assert.ok(parsed.indexOf('dispose = () => disposeModelResources')<parsed.indexOf('if (destroyed)'))
  assert.ok(parsed.indexOf('dispose = () => disposeModelResources')<parsed.indexOf('if (triangles >'))
  assert.match(src,/build\(\)\.catch\(reason => \{\s*dispose\?\.\(\)/)
})
