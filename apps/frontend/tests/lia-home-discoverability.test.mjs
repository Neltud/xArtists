import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = name => readFileSync(new URL('../src/experience/' + name, import.meta.url), 'utf8')

test('homepage links to LIA without expanding primary art-first CTA count', () => {
  const page = read('Pages.tsx')
  const hero = page.slice(page.indexOf('export function Home()'), page.indexOf('export function GroupPage'))
  assert.match(hero, /to="\/lia" className="xa-access-home-link">LIA · Control Room/)
  assert.match(hero, /to="\/marketplace" className="xa-button quiet"/)
  assert.match(hero, /to="\/auction" className="xa-button quiet"/)
  assert.doesNotMatch(hero, /to="\/app" className="xa-access-home-link"/)
})

test('mobile menu shows LIA without replacing five-item fixed dock', () => {
  const shell = read('Shell.tsx')
  assert.match(shell, /to="\/lia" onClick=\{closeMobile\}/)
  const dock = shell.slice(shell.indexOf('const MOBILE_DESTINATIONS ='), shell.indexOf('function MobileDock()'))
  for (const to of ["/museum","/marketplace","/auction","/studio"]) {
    assert.ok(dock.includes("to:'" + to + "'"), 'missing dock path ' + to)
  }
})
