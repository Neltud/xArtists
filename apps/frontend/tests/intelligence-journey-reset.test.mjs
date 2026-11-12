import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8')
const nav=read('../src/components/intelligence/IntelligencePath.tsx')
const agents=read('../src/pages/Agents.tsx')
const lab=read('../src/pages/LabPage.tsx')
const simulation=read('../src/pages/SimulationLab.tsx')
const xorus=read('../src/pages/XorusPage.tsx')
const css=read('../src/pages/lab-page.css')
const routes=read('../src/experience/modules.ts')

test('a single understandable journey connects xOrus, Agents and Lab',()=>{
  for(const path of ['/intelligence/xorus','/intelligence/agents','/intelligence/lab'])
    assert.ok(nav.includes("path: '"+path+"'"),path)
  assert.match(nav,/aria-current=\{selected\?'page':undefined\}/)
  for(const page of [agents,lab,xorus])assert.match(page,/<IntelligencePath\s*\/>/)
  assert.match(css,/\.xa-intelligence-path/)
  assert.match(css,/@media\(max-width:760px\)/)
  assert.match(routes,/import '\.\.\/pages\/lab-page\.css'/)
})

test('Agents leads with real understandable paper roles; historical NFT packs are optional',()=>{
  assert.match(agents,/Les agents xOrus, simplement/)
  assert.match(agents,/Observer les signaux/)
  assert.match(agents,/Explorer les données/)
  assert.match(agents,/Identifier les risques/)
  assert.match(agents,/Catalogue Genesis NFT \(distinct des agents\)/)
  assert.match(agents,/<details ref=\{genesisRef\}/)
  assert.match(agents,/\{showPacks && <div/)
  assert.match(agents,/vente fermée/)
  assert.doesNotMatch(agents,/PackCheckout|buyPack\(|sendTransaction\(/)
})

test('Lab offers one selected workflow with separate sculpture preview and safe deep links',()=>{
  assert.match(lab,/params\.get\('view'\) === '3d'/)
  assert.match(lab,/aria-pressed=\{view === 'network'\}/)
  assert.match(lab,/view === '3d' \? <SculptureTurntable\/>/)
  assert.match(lab,/to="\/studio\?mode=sculpture"/)
  assert.match(lab,/La rotation locale n’est pas un maillage 3D certifié/)
  assert.doesNotMatch(lab,/sendTransaction|buyPack\(|mintNFT\(/)
})

test('educational simulation never invents a live stream or executes actions',()=>{
  assert.match(simulation,/100 % fictif/)
  assert.match(simulation,/Simulation locale uniquement/)
  assert.match(simulation,/type="range"/)
  assert.match(simulation,/type="radio"/)
  assert.match(simulation,/const fees=amount\*0\.0025\+0\.08/)
  assert.doesNotMatch(simulation,/setInterval|Math\.random|fetch\(|WebSocket|requestOpenConnect|buyPack\(|signWithXPortal|Stream paper|Board réel/)
})

test('xOrus prioritizes comprehension and mounts advanced telemetry on demand',()=>{
  assert.match(xorus,/l’intelligence expliquée simplement/)
  assert.match(xorus,/to="\/intelligence\/agents"/)
  assert.match(xorus,/to="\/intelligence\/lab"/)
  assert.match(xorus,/advancedOpen &&/)
  assert.match(xorus,/if \(!advancedOpen\) return/)
  assert.ok(xorus.indexOf('<LiaHubControlRoomLazy />')>xorus.indexOf('{advancedOpen &&'))
  assert.ok(xorus.indexOf('xorus-paybox-wallet')>xorus.indexOf('{advancedOpen &&'))
  assert.match(xorus,/PAPER \/ SHADOW/)
  assert.doesNotMatch(xorus,/LIVE user-sign xPortal/)
})
