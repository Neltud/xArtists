import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const read = p => readFileSync(new URL(p, import.meta.url),'utf8')
const routes = read('../src/experience/modules.ts')
const lab = read('../src/pages/LabPage.tsx')
const twin = read('../src/pages/DigitalTwinPage.tsx')
const rights = read('../src/pages/WorldRightsPage.tsx')
const policy = read('../src/components/RwaAssetsStrip.tsx')
const home = read('../src/experience/Pages.tsx')

test('xOrus has a canonical route but retains both historical LIA routes', () => {
  assert.match(routes, /module\('lia','\/intelligence\/xorus',\['\/lia','\/intelligence\/lia','\/xorus'\]/)
  assert.match(routes, /'xOrus · Intelligence'/)
  assert.match(home, /to="\/xorus" className="xa-first-context-link"/)
})
test('xRights is public name and technical package URLs remain compatible', () => {
  assert.match(routes, /'xRights · Licences & Royalties'/)
  assert.match(routes, /'\/plugins\/xa-world-rights','\/xrights','\/create\/xrights'/)
  assert.match(rights, /xRights/)
  assert.match(rights, /plugins\/xa-world-rights\/app\.html/)
})
test('3D lab is gesture/local preview with metric pipeline separate from photo rotation', () => {
  assert.match(lab, /lazy\(\(\) => import\('\.\.\/components\/ArtworkTurntableLab'\)\)/)
  assert.match(lab, /params\.get\('view'\) === '3d'/)
  assert.match(lab, /view === '3d' \? <SculptureTurntable\/>/)
  assert.match(twin, /to="\/lab\?view=3d"/)
  assert.match(twin, /Un vrai GLB UV nécessite/)
  assert.doesNotMatch(lab, /sendTransaction|mintNFT|signWithXPortal/)
})
test('1 TRO is advertised only as a verified contingent reward, not a transfer', () => {
  assert.match(policy, /1 TRO prévu après mint physique vérifié \(non versé\)/)
  assert.match(read('../src/config/rwaAssets.ts'), /contrôle anti-doublon et réserve réelle/)
  assert.doesNotMatch(policy, /sendTransaction|broadcast/)
})
