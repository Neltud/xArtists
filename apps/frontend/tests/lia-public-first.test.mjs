import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = (path) => readFileSync(new URL('../src/' + path, import.meta.url), 'utf8')

test('LIA exposes read-only snapshots; unsourced immersive 3D is suspended', () => {
  const lazy = source('components/lia/LiaHubControlRoomLazy.tsx')
  const legacy = source('components/lia/LiaHubControlRoom.tsx')
  const renderers = source('components/lia/holoRenderers.ts')
  assert.match(lazy, /Vue holographique suspendue/)
  assert.match(lazy, /LiaMobileOverview/)
  assert.doesNotMatch(lazy, /Enter immersive view|lazy\(/)
  assert.doesNotMatch(legacy, /WebGLRenderer|requestAnimationFrame|setInterval/)
  assert.doesNotMatch(renderers, /Math\.sin|requestAnimationFrame|APR est\.|SHA-256 · OK/)
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
