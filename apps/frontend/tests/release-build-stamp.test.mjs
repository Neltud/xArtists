import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const original = fileURLToPath(new URL('../scripts/write-build-info.mjs', import.meta.url))

function runFixture(version) {
  const root = mkdtempSync(join(tmpdir(), 'xartists-pages-stamp-'))
  try {
    const dir = join(root, 'apps', 'frontend')
    mkdirSync(join(dir, 'scripts'), { recursive: true })
    mkdirSync(join(dir, 'dist'), { recursive: true })
    copyFileSync(original, join(dir, 'scripts', 'write-build-info.mjs'))
    writeFileSync(join(root, '.release-please-manifest.json'), JSON.stringify({ '.': version }))
    writeFileSync(join(dir, 'dist', 'dapp-release.json'), JSON.stringify({
      lia_live_trading: false, routes: ['/', '/marketplace'],
    }))
    let result = null
    let rejected = false
    try {
      execFileSync(process.execPath, ['scripts/write-build-info.mjs'], {
        cwd: dir, env: { ...process.env, GITHUB_SHA: 'a'.repeat(40) },
        stdio: 'pipe',
      })
      result = JSON.parse(readFileSync(join(dir, 'dist', 'build-info.json'), 'utf8'))
    } catch {
      rejected = true
    }
    return { result, rejected }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

test('release stamp comes from root Release Please manifest and Git SHA', () => {
  const { result, rejected } = runFixture('0.130.0')
  assert.equal(rejected, false)
  assert.equal(result.release_version, '0.130.0')
  assert.equal(result.version_source, '.release-please-manifest.json')
  assert.equal(result.source_sha, 'a'.repeat(40))
  assert.equal(result.public_route_count, 2)
  assert.equal(result.lia_live_trading, false)
})

test('invalid and missing release versions fail closed without output', () => {
  for (const v of ['130', 'v0.130.0', '0.130.0-live', null]) {
    const { result, rejected } = runFixture(v)
    assert.equal(rejected, true)
    assert.equal(result, null)
  }
})

test('Pages workflow checks stamped version against authoritative release manifest', () => {
  const workflow = readFileSync(new URL('../../../.github/workflows/static.yml', import.meta.url), 'utf8')
  assert.match(workflow, /test -s _site\/build-info\.json/)
  assert.match(workflow, /info\.release_version !== manifest\["\."\]/)
  assert.match(workflow, /Pages release version \/ source stamp mismatch/)
  assert.match(workflow, /Verify deployed Pages serves EXACT source SHA/)
  assert.match(workflow, /\.source_sha == \$sha/)
  assert.match(workflow, /Pages did not serve this exact commit SHA/)
  assert.match(workflow, /VITE_LIA_LIVE_TRADING:/)
  assert.match(workflow, /VITE_PAYBOX_ENABLED:/)
})

test('Scheduled Pages watchdog is read-only and detects competing docs publisher', () => {
  const watchdog = readFileSync(new URL('../../../.github/workflows/pages-live-watchdog.yml', import.meta.url), 'utf8')
  assert.match(watchdog, /schedule:/)
  assert.match(watchdog, /workflow_dispatch:/)
  assert.match(watchdog, /status=success/)
  assert.match(watchdog, /\.source_sha \/\/ "missing"/)
  assert.match(watchdog, /last successful Vite build/)
  assert.match(watchdog, /Source = GitHub Actions, not main\/docs/)
  assert.match(watchdog, /auction marketplace tro\/sale offres/)
  assert.doesNotMatch(watchdog, /actions\/deploy-pages|PAYBOX_CHECKOUT_ENABLED=1|MINT_LIVE_ENABLED=1|LIA_LIVE_TRADING=1/)
})
