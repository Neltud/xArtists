import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source=(p)=>readFileSync(new URL(p,import.meta.url),'utf8')
const pages=source('../src/experience/Pages.tsx')
const hero=source('../src/experience/HomeHeroSculpture.tsx')
const css=source('../src/experience/experience.css')
const locale=source('../src/experience/locale.ts')

test('Home does not mount WebGL by default: delegated to a user-and-device-gated wrapper',()=>{
  assert.match(pages, /<HomeHeroSculpture variant=\{variant\}\/>/)
  assert.doesNotMatch(pages, /<Sculpture variant=\{variant\}/)
  assert.match(hero, /const Sculpture = lazy\(\(\) => import\('\.\/Sculpture'\)\)/)
  assert.match(hero, /desktopAllowed \|\| userEnabled/)
  assert.match(hero, /onClick=\{\(\) => setUserEnabled\(true\)\}/)
})

test('mobile, reduced motion, save-data and low-memory default to static',()=>{
  assert.match(hero,/min-width: 901px/)
  assert.match(hero,/prefers-reduced-motion: no-preference/)
  assert.match(hero,/connection\?\.saveData/)
  assert.match(hero,/deviceMemory <= 4/)
  assert.match(hero,/useState\(false\)/)
  assert.match(hero,/role="img"/)
})

test('static art has proper mobile touch target and translated accessible CTA',()=>{
  assert.match(css,/\.xa-hero-2d-button\{min-height:44px/)
  assert.match(css,/\.xa-hero-2d-visual\{/)
  assert.match(hero,/c\('hero3dAction'\)/)
  assert.match(hero,/c\('hero3dLead'\)/)
  for(const key of ['hero3dAction','hero3dLead']){
    const row=locale.match(new RegExp('^\\s*'+key+': \\[(.*)\\],?$', 'm'))
    assert.ok(row,`Missing ${key} translations`)
    assert.equal([...row[1].matchAll(/'[^']*'/g)].length,8,`Each ${key} must cover eight locales`)
  }
})
