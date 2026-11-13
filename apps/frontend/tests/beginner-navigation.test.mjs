import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8')
const shell = read('../src/experience/Shell.tsx')
const pages = read('../src/experience/Pages.tsx')
const guide = read('../src/pages/DemoTourPage.tsx')
const css = read('../src/experience/beginner-navigation.css')
const moduleDefinitions = read('../src/experience/modules.ts')

test('desktop navigation promotes xOrus while keeping DAO in advanced navigation', () => {
  assert.match(shell, /\['guide','\/guide',c\('help'\)\]/)
  assert.match(shell, /\['lia','\/intelligence\/xorus',c\('lia'\)\]/)
  assert.match(shell, /className="xa-icon-button xa-theme-toggle"/)
  assert.match(shell, /<MobileDock\/>/)
})

test('mobile visitor menu has simple journeys before collapsed specialist links', () => {
  const starter = shell.indexOf('xa-mobile-start')
  const advanced = shell.indexOf('<details className="xa-mobile-advanced">')
  assert.ok(starter > 0 && advanced > starter, 'beginner menu must precede specialist tools')
  // Core visitor journeys stay in the primary mobile block.
  for (const url of ['/', '/museum', '/studio', '/marketplace', '/guide']) {
    assert.ok(shell.includes('to="' + url + '" onClick={closeMobile}'), 'mobile quick action missing: ' + url)
  }
  // xOrus, agents, My Packs, email account and exhibitions are visitor actions.
  for (const url of ['/xorus', '/agents', '/my-packs', '/account', '/create/gallery']) {
    assert.ok(
      shell.slice(starter, advanced).includes('to="' + url + '"'),
      'promoted primary route missing from mobile start: ' + url
    )
  }
  // Remaining specialist routes stay reachable (advanced or elsewhere in the menu).
  for (const url of ['/auction', '/rwa', '/dao']) {
    assert.ok(shell.includes('to="' + url + '"'), 'specialist route remains reachable: ' + url)
  }
  assert.match(shell, /xa-mobile-advanced"><summary>\{c\('welcomeAdvanced'\)\}/)
})

test('guide uses theme tokens, keyboard focus and understandable ordered journeys', () => {
  assert.match(guide, /xa-guide-steps/)
  assert.match(guide, /<ol className="xa-guide-steps">/)
  assert.match(guide, /<details className="xa-guide-advanced">/)
  assert.match(guide, /guideSaleNotice/)
  assert.doesNotMatch(guide, /text-white|text-zinc-300|bg-zinc-900/)
  assert.match(css, /var\(--xa-text\)/)
  assert.match(css, /:focus-visible/)
  assert.match(css, /prefers-reduced-motion/)
  assert.match(css, /max-width: 560px/)
})

test('home and directory prioritize visitor routes with explicit advanced opt-in', () => {
  assert.match(pages, /to="\/guide">\{c\('help'\)\}/)
  assert.match(pages, /xa-directory-starters/)
  assert.match(pages, /xa-directory-starter-grid/)
  assert.match(pages, /className="xa-module-grid">\{list\.map/)
  assert.match(pages, /to="\/directory\?lab=1"/)
  assert.match(moduleDefinitions, /module\('dao','\/finance\/governance'/)
  assert.match(moduleDefinitions, /module\('studio','\/create\/studio'/)
  assert.match(moduleDefinitions, /module\('guide','\/guide'/)
})

test('navigation keeps readiness and financial truth labels, without adding bypass flags', () => {
  assert.match(pages, /StageBadge stage=\{publicStage\(a\.module\)\}/)
  assert.match(pages, /xa-directory-stage-controls/)
  assert.match(pages, /readinessBrowseHint/)
  assert.doesNotMatch(shell + guide + css, /VITE_LIA_LIVE_TRADING\s*=\s*1|mint_live_enabled\s*=\s*true|paybox_checkout_enabled\s*=\s*true/)
})
