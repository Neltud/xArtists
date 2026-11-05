import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createRenderBuildInfo, writeRenderBuildInfo } from '../ops/write-render-build-info.mjs'

const COMMIT = '8656139477fce4b951b49d3d29f04421666ebab6'
const release = () => ({
  schema_version: 1,
  base_path: '/xArtists/',
  lia_live_trading: false,
  routes: ['/', '/marketplace', '/auction', '/offres', '/packs/pulse'],
})

test('stamps the exact Render commit and the built manifest, never claims built_at', () => {
  const stamp = createRenderBuildInfo({ commit: COMMIT, release: release(), stampedAt: '2026-11-05T07:40:00.000Z' })
  assert.equal(stamp.source_sha, COMMIT)
  assert.equal(stamp.public_route_count, 5)
  assert.equal(stamp.lia_live_trading, false)
  assert.equal(stamp.stamp_source, 'render-runtime')
  assert.equal(stamp.stamped_at, '2026-11-05T07:40:00.000Z')
  assert.equal(Object.hasOwn(stamp, 'built_at'), false)
  assert.equal(Object.hasOwn(stamp, 'payment_verified'), false)
})

test('denies absent, abbreviated and malformed commit IDs', () => {
  for (const commit of [undefined, '', 'abc123', '0'.repeat(39), 'z'.repeat(40), COMMIT.toUpperCase()]) {
    assert.throws(() => createRenderBuildInfo({ commit, release: release() }), /invalid_render_commit/)
  }
})

test('denies wrong base, missing routes, malformed routes and nonboolean live flag', () => {
  const variants = [
    { ...release(), base_path: '/' },
    { ...release(), routes: [] },
    { ...release(), routes: ['/../../secret'] },
    { ...release(), lia_live_trading: 'false' },
    { ...release(), schema_version: 0 },
  ]
  for (const manifest of variants) {
    assert.throws(() => createRenderBuildInfo({ commit: COMMIT, release: manifest }), /invalid_frontend_release_manifest/)
  }
})

test('rejects malformed timestamp without fabricating a build date', () => {
  assert.throws(() => createRenderBuildInfo({ commit: COMMIT, release: release(), stampedAt: 'not-time' }), /invalid_stamp_time/)
})

test('writes atomically into the served directory and re-reads parseable JSON', () => {
  const root = mkdtempSync(join(tmpdir(), 'xartists-render-stamp-'))
  try {
    writeFileSync(join(root, 'dapp-release.json'), JSON.stringify(release()))
    const result = writeRenderBuildInfo({ root, commit: COMMIT, stampedAt: '2026-11-05T07:40:00.000Z' })
    assert.deepEqual(JSON.parse(readFileSync(join(root, 'build-info.json'), 'utf8')), result)
    assert.equal(existsSync(join(root, '.build-info.' + process.pid + '.tmp')), false)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('never creates a public stamp when release file is absent or invalid', () => {
  const root = mkdtempSync(join(tmpdir(), 'xartists-render-stamp-'))
  try {
    assert.throws(() => writeRenderBuildInfo({ root, commit: COMMIT }))
    assert.equal(existsSync(join(root, 'build-info.json')), false)
    writeFileSync(join(root, 'dapp-release.json'), JSON.stringify({ ...release(), routes: [] }))
    assert.throws(() => writeRenderBuildInfo({ root, commit: COMMIT }))
    assert.equal(existsSync(join(root, 'build-info.json')), false)
  } finally { rmSync(root, { recursive: true, force: true }) }
})
