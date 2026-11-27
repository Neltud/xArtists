import {architecture as a,catalogue,navigation as n} from './architecture-catalogue.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8')
const pages = read('../src/experience/Pages.tsx')
const guide = read('../src/pages/DemoTourPage.tsx')
const market = read('../src/pages/MarketplacePage.tsx')
const shell = read('../src/experience/Shell.tsx')
const locale = read('../src/experience/locale.ts')
const css = read('../src/experience/beginner-navigation.css')

test('Home exposes exhibition creation inside the creator workflow',()=>{
  assert.equal(a.areaFor('gallery-builder'),'studio')
  assert.ok(a.contextualModules(catalogue,'studio').some(x=>x.id==='gallery-builder'))
  const home=pages.slice(pages.indexOf('export function Home()'),pages.indexOf('export function GroupPage'))
  assert.match(home,/contextualModules\(modules,'studio'\)/)
  assert.match(home,/StageBadge stage=\{publicStage\(m.id\)\}/)
  assert.match(home,/welcomeExhibitDesc/)
})

test('guide exposes private gallery and owner listing paths without implying commerce', () => {
  assert.match(guide, /to: '\/create\/gallery'/)
  assert.match(guide, /className="xa-guide-owner"/)
  assert.match(guide, /to="\/marketplace#xa-market-sell"/)
  assert.match(guide, /c\('guideOwnNftDesc'\)/)
  assert.match(guide, /to: '\/dao'/)
  assert.doesNotMatch(guide, /sendTransaction|requestOpenConnect|buyNft|createCheckout/)
})

test('gallery aliases select Studio consistently across navigation',()=>{
  assert.match(guide, /to: '\/create\/gallery'/)
  assert.doesNotMatch(market, /<Link to="\/create\/gallery"/, 'avoid redundant creation CTA in artwork browsing')
  for(const path of ['/create/gallery','/gallery/create','/exposition'])assert.equal(n.currentPrimarySection(path,catalogue),'studio')
  assert.match(shell,/currentPrimarySection\(location.pathname,modules\)/)
  assert.match(css,/\.xa-guide-owner a:focus-visible/)
  assert.match(css,/\.xa-guide-owner \{ align-items: stretch; flex-direction: column; \}/)
})

test('new beginner copy is complete in all eight supported languages', () => {
  for (const key of [
    'welcomeExhibit', 'welcomeExhibitDesc',
    'guideOwnNftTitle', 'guideOwnNftDesc', 'guideOwnNftAction',
  ]) {
    const row = locale.split('\n').find(line => line.trim().startsWith(key + ': '))
    assert.ok(row, 'missing i18n key: ' + key)
    const values = JSON.parse(row.trim().slice((key + ': ').length).replace(/,\s*$/, ''))
    assert.equal(values.length, 8, 'not eight languages: ' + key)
    assert.ok(values.every(value => typeof value === 'string' && value.trim().length > 0), key)
  }
  assert.doesNotMatch(pages + guide + shell + market,
    /VITE_XORUS_LIVE_TRADING\s*=\s*1|mint_live_enabled\s*=\s*true|paybox_checkout_enabled\s*=\s*true/)
})
