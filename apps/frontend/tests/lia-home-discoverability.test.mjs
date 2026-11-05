import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = name => readFileSync(new URL('../src/experience/' + name, import.meta.url), 'utf8')

test('homepage retains a direct LIA route as a disclosed advanced link without adding primary CTAs', () => {
  const page = read('Pages.tsx')
  const hero = page.slice(page.indexOf('export function Home()'), page.indexOf('export function GroupPage'))
  assert.match(hero, /to="\/lia" className="xa-first-context-link"/)
  assert.match(hero, /id:'market',to:'\/marketplace'/)
  assert.match(hero, /<Link to="\/auction" className="xa-text-link">/)
  assert.doesNotMatch(hero, /to="\/app" className="xa-first-context-link"/)
  assert.equal((hero.match(/className="xa-button primary"/g) || []).length, 1)
})

test('mobile menu shows LIA without replacing five-item fixed dock', () => {
  const shell = read('Shell.tsx')
  assert.match(shell, /to="\/lia" onClick=\{closeMobile\}/)
  assert.match(shell, /to="\/museum" onClick=\{closeMobile\}/)
  const dock = shell.slice(shell.indexOf('const MOBILE_DESTINATIONS ='), shell.indexOf('function MobileDock()'))
  for (const to of ["/marketplace","/auction","/studio","/finance/governance"]) {
    assert.ok(dock.includes("to:'" + to + "'"), 'missing dock path ' + to)
  }
})
