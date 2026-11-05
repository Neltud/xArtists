import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { verifyPagesArtifact } from '../scripts/verify-pages-artifact.mjs'

const SHA = 'a'.repeat(40)
const VERSION = '0.129.1'
const ROUTES = ['/', '/auction', '/marketplace', '/tro/sale', '/finance/tro/sale', '/offres', '/offers']

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'xartists-pages-integrity-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const write = (name, content) => {
    const target = join(root, name)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, typeof content === 'string' ? content : JSON.stringify(content))
  }
  write('build-info.json', {
    renderer: 'sites-v3', source_sha: SHA, release_version: VERSION,
    version_source: '.release-please-manifest.json', base_url: '/xArtists/', public_route_count: ROUTES.length,
  })
  write('dapp-release.json', { base_path: '/xArtists/', routes: ROUTES })
  const manifest = {
    'index.html': { file: 'assets/main.js', isEntry: true, imports: ['_react.js'], dynamicImports: ['src/Tro.tsx'] },
    '_react.js': { file: 'assets/react.js' },
    'src/Tro.tsx': { file: 'assets/tro.js', isDynamicEntry: true, css: ['assets/tro.css'], assets: ['assets/token.svg'] },
  }
  write('.vite/manifest.json', manifest)
  for (const name of ['main.js', 'react.js', 'tro.js', 'tro.css', 'token.svg']) write('assets/' + name, 'fixture')
  for (const route of ROUTES) write(route === '/' ? 'index.html' : route.slice(1) + '/index.html',
    '<!doctype html><script type="module" src="/xArtists/assets/main.js"></script>')
  return {
    root, write, manifest,
    verify: (overrides = {}) => verifyPagesArtifact({ directory: root, expectedSha: SHA, releaseVersion: VERSION, ...overrides }),
  }
}

test('valid artifact checks core route aliases and lazy JS, CSS and image dependencies', t => {
  const f = fixture(t)
  assert.deepEqual(f.verify(), { source_sha: SHA, release_version: VERSION,
    routes_checked: 7, assets_checked: 5, lazy_modules_checked: 1 })
})

test('a missing lazy stylesheet is rejected even when root HTML still works', t => {
  const f = fixture(t)
  rmSync(join(f.root, 'assets/tro.css'))
  assert.throws(() => f.verify(), /tro\.css/)
})

test('a missing lazy JavaScript or image file is rejected', t => {
  for (const name of ['tro.js', 'token.svg']) {
    const f = fixture(t)
    rmSync(join(f.root, 'assets', name))
    assert.throws(() => f.verify(), new RegExp(name.replace('.', '\\.')))
  }
})

test('a stale route bundle and a missing auction entry fail before upload', t => {
  const f = fixture(t)
  f.write('auction/index.html', '<script src="/xArtists/assets/old-main.js"></script>')
  assert.throws(() => f.verify(), /different Vite entry: \/auction/)
  rmSync(join(f.root, 'auction/index.html'))
  assert.throws(() => f.verify(), /auction/)
})

test('a missing manifest record or traversal cannot bypass file checks', t => {
  const f = fixture(t)
  f.manifest['index.html'].dynamicImports.push('missing.tsx')
  f.write('.vite/manifest.json', f.manifest)
  assert.throws(() => f.verify(), /Missing Vite dependency/)
  f.manifest['index.html'].dynamicImports.pop()
  f.manifest['src/Tro.tsx'].css = ['assets/../../outside.css']
  f.write('.vite/manifest.json', f.manifest)
  assert.throws(() => f.verify(), /Invalid artifact path/)
})

test('stale source SHA or release version fails independently of valid assets', t => {
  const f = fixture(t)
  assert.throws(() => f.verify({ expectedSha: 'b'.repeat(40) }), /source SHA differs/)
  assert.throws(() => f.verify({ releaseVersion: '0.130.0' }), /release differs/)
})

test('CLI returns a failing process status for a broken upload directory', t => {
  const f = fixture(t)
  f.write('release-manifest.json', { '.': VERSION })
  const script = fileURLToPath(new URL('../scripts/verify-pages-artifact.mjs', import.meta.url))
  const args = [script, '--directory', f.root, '--expected-sha', SHA,
    '--release-manifest', join(f.root, 'release-manifest.json')]
  assert.equal(JSON.parse(execFileSync(process.execPath, args, { encoding: 'utf8' })).source_sha, SHA)
  rmSync(join(f.root, 'assets/tro.css'))
  assert.throws(() => execFileSync(process.execPath, args, { stdio: 'pipe' }),
    error => error.status === 1 && /tro\.css/.test(error.stderr.toString()))
})
