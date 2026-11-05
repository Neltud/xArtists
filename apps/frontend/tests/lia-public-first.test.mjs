import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = (path) => readFileSync(new URL('../src/' + path, import.meta.url), 'utf8')

test('LIA defaults to accessible 2D even on desktop; 3D is explicitly opt-in', () => {
  const lazy = source('components/lia/LiaHubControlRoomLazy.tsx')
  assert.match(lazy, /useState\(false\)/)
  assert.match(lazy, /Enter immersive view \(3D\)/)
  assert.match(lazy, /lazy\(\(\) => import\('\.\/LiaHubControlRoom'\)\)/)
  assert.doesNotMatch(lazy, /matchMedia\(/)
})

test('public status differentiates source age, checking time and simulated performance', () => {
  const overview = source('components/lia/LiaMobileOverview.tsx')
  assert.match(overview, /fetchLiaStatus/)
  assert.match(overview, /fetchLiaHubStatus/)
  assert.match(overview, /Aggregator:/)
  assert.match(overview, /Hub\/Vellum mirror:/)
  assert.match(overview, /Checking a snapshot does not refresh its source/)
  assert.match(overview, /Simulation only/)
  assert.match(overview, /not realized/)
  assert.match(overview, /Last published balance/)
  assert.match(overview, /assessTelemetrySource/)
  assert.match(overview, /status\?\.mindset\?\.vellum_ts/)
  assert.match(overview, /reportedStrategy \|\| 'Unavailable — model delayed or unsourced'/)
  assert.doesNotMatch(overview, /status\?\.mindset\?\.strategy \|\| hub\?\.strategy/)
  assert.doesNotMatch(overview, /\{hub\.note\}/)
})

test('LIA top-level page remains browse-only and exposes market, auction and packs', () => {
  const page = source('pages/LiaPage.tsx')
  assert.match(page, /PAPER \/ SHADOW/)
  assert.match(page, /advancedOpen &&/)
  assert.match(page, /aria-expanded=\{advancedOpen\}/)
  assert.match(page, /to="\/explore\/market"/)
  assert.match(page, /to="\/explore\/auction"/)
  assert.match(page, /to="\/intelligence\/agents"/)
  assert.match(page, /Simulated P&L is not realized profit/)
  assert.doesNotMatch(page, /\{hub\?\.note\}/)
  assert.doesNotMatch(page, /LIVE user-sign xPortal/)
  assert.match(page, /Vellum strategy withheld/)
  assert.match(page, /producerFreshness\.is_stale/)
})
