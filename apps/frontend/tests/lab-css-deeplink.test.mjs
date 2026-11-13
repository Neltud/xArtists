import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const modules=readFileSync(new URL('../src/experience/modules.ts',import.meta.url),'utf8')
const page=readFileSync(new URL('../src/pages/LabPage.tsx',import.meta.url),'utf8')
const css=readFileSync(new URL('../src/pages/lab-page.css',import.meta.url),'utf8')

test('Lab stylesheet is bundled before lazy JS resolution for /lab direct links',()=>{
  assert.match(modules,/^import '\.\.\/pages\/lab-page\.css'$/m)
  assert.match(modules,/module\('lab','\/intelligence\/lab',\['\/lab','\/labo'\]/)
  assert.doesNotMatch(page,/import ['"]\.\/lab-page\.css['"]/)
  assert.match(page,/const Network = lazy\(\(\) => import\('\.\/EntityMap'\)\)/)
  assert.match(css,/\.xa-lab/)
  assert.match(css,/\.xa-lab-switch/)
})
test('Lab exposes paper-only sculpture turntable and simulations and offers a user-controlled view switch',()=>{
  assert.match(page,/La rotation locale n’est pas un maillage 3D certifié/)
  assert.match(page,/view === 'analysis' \? <Analysis\/> : view === '3d' \? <SculptureTurntable\/> : view === 'network' \? <Network\/> : <Simulation\/>/)
  assert.match(page,/const Analysis = lazy\(\(\) => import\('\.\.\/components\/intelligence\/XorusDecisionDesk'\)\)/)
  assert.match(page,/params\.get\('view'\) === 'simulation' \? 'simulation' : 'analysis'/)
  assert.match(page,/aria-pressed=\{view === 'network'\}/)
  assert.match(page,/setParams\(updated\)/)
  assert.doesNotMatch(page,/sendTransaction|signWithXPortal|buyPack|dispatchMintSculpture/)
})
