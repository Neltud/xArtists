import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8')
const files = [
  '../../e2e/smoke.spec.ts',
  '../../playwright.config.ts',
  '../../.github/workflows/e2e.yml',
  '../../.github/workflows/pages-live-watchdog.yml',
]
test('published-site probes use canonical xartists.art HTTPS, never old /xArtists URL', () => {
  for (const path of files) {
    const c = read(path)
    assert.match(c, /https:\/\/xartists\.art/)
    assert.doesNotMatch(c, /neltud\.github\.io\/xArtists/)
    assert.doesNotMatch(c, /http:\/\/xartists\.art/)
  }
})
test('watchdog and Playwright still fail closed on HTTPS/TLS, SHA drift and direct route assets', () => {
  const watchdog = read('../../.github/workflows/pages-live-watchdog.yml')
  const smoke = read('../../e2e/smoke.spec.ts')
  const workflow = read('../../.github/workflows/e2e.yml')
  assert.match(watchdog, /last successful Vite/i)
  assert.match(watchdog, /'\u002fassets\u002f'/)
  assert.match(watchdog, /::error::P0 pages publisher collision/)
  assert.match(watchdog, /https:\/\/xartists\.art\/build-info\.json/)
  assert.match(watchdog, /https:\/\/xartists\.art\/\$\{path\}/)
  assert.match(workflow, /E2E_BASE_URL: https:\/\/xartists\.art/)
  assert.match(smoke, /response!\.status\(\).*toBe\(200\)/)
  assert.match(smoke, /locator\('#root'\)/)
  assert.doesNotMatch(smoke + watchdog + workflow, /ignoreHTTPSErrors|curl\s+(-k|--insecure)|verify\s*=\s*false/)
})
