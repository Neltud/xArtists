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

test('public first visit prioritizes museum, private exhibition, studio and market', () => {
  const home = pages.slice(pages.indexOf('export function Home()'), pages.indexOf('export function GroupPage'))
  for (const [id, to] of [
    ['visit', '/museum'],
    ['exhibit', '/create/gallery'],
    ['create', '/studio'],
    ['market', '/marketplace'],
  ]) {
    assert.ok(home.includes("id:'" + id + "',to:'" + to + "'"), id + ' entry is missing')
  }
  assert.doesNotMatch(home, /id:'dao',to:'\/dao'/)
  assert.match(home, /module:'gallery-builder'/)
  assert.match(home, /StageBadge stage=\{publicStage\(a\.module\)\}/)
  assert.match(pages, /to:"\/create\/gallery",icon:"museum",title:c\("welcomeExhibit"\)/)
})

test('guide exposes private gallery and owner listing paths without implying commerce', () => {
  assert.match(guide, /to: '\/create\/gallery'/)
  assert.match(guide, /className="xa-guide-owner"/)
  assert.match(guide, /to="\/marketplace#xa-market-sell"/)
  assert.match(guide, /c\('guideOwnNftDesc'\)/)
  assert.match(guide, /to: '\/dao'/)
  assert.doesNotMatch(guide, /sendTransaction|requestOpenConnect|buyNft|createCheckout/)
})

test('market, directory and mobile dock preserve a discoverable gallery entry', () => {
  assert.match(market, /<Link to="\/create\/gallery"/)
  const dock = shell.slice(shell.indexOf('const MOBILE_DESTINATIONS'), shell.indexOf('function MobileDock()'))
  for (const route of ['/create/gallery', '/gallery/create', '/exposition']) {
    assert.ok(dock.includes("'" + route + "'"), 'missing dock active route ' + route)
  }
  assert.match(css, /grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/)
  assert.match(css, /\.xa-guide-owner a:focus-visible/)
  assert.match(css, /\.xa-guide-owner \{ align-items: stretch; flex-direction: column; \}/)
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
    /VITE_LIA_LIVE_TRADING\s*=\s*1|mint_live_enabled\s*=\s*true|paybox_checkout_enabled\s*=\s*true/)
})
