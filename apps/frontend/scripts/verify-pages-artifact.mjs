import assert from 'node:assert/strict'
import { readFileSync, realpathSync, statSync } from 'node:fs'
import { resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'

const BASE = '/xArtists/'
const REQUIRED_ROUTES = ['/', '/marketplace', '/auction', '/tro/sale', '/finance/tro/sale', '/offres', '/offers']

/** Verify the final upload directory, including Vite's lazy JS/CSS dependency graph. */
export function verifyPagesArtifact({ directory, expectedSha, releaseVersion }) {
  assert.match(expectedSha, /^[a-f0-9]{40}$/, 'Expected source SHA must be a full commit')
  assert.match(releaseVersion, /^\d+\.\d+\.\d+$/, 'Expected release must come from the root manifest')
  const root = realpathSync(directory)
  const file = name => {
    assert(typeof name === 'string' && name.length > 0 && !name.includes('\\') &&
      !name.startsWith('/') && !/[?#\0]/.test(name) &&
      !name.split('/').some(part => !part || part === '.' || part === '..'), `Invalid artifact path: ${name}`)
    const target = resolve(root, name)
    assert(realpathSync(target).startsWith(root + sep), `File escapes artifact directory: ${name}`)
    const info = statSync(target)
    assert(info.isFile() && info.size > 0, `Missing or empty artifact file: ${name}`)
    return target
  }
  const json = name => JSON.parse(readFileSync(file(name), 'utf8'))
  const info = json('build-info.json')
  assert.equal(info.renderer, 'sites-v3', 'Wrong renderer')
  assert.equal(info.source_sha, expectedSha, 'Artifact source SHA differs from checked-out commit')
  assert.equal(info.release_version, releaseVersion, 'Artifact release differs from root manifest')
  assert.equal(info.version_source, '.release-please-manifest.json', 'Wrong release version source')
  assert.equal(info.base_url, BASE, 'Wrong build base URL')

  const release = json('dapp-release.json')
  assert.equal(release.base_path, BASE, 'Wrong route base path')
  assert(Array.isArray(release.routes) && release.routes.length > 0, 'Missing public routes')
  assert.equal(new Set(release.routes).size, release.routes.length, 'Duplicate public routes')
  assert.equal(info.public_route_count, release.routes.length, 'Stamp and public route count differ')
  for (const route of REQUIRED_ROUTES) assert(release.routes.includes(route), `Missing core public route: ${route}`)

  const manifest = json('.vite/manifest.json')
  assert(manifest && typeof manifest === 'object' && !Array.isArray(manifest), 'Invalid Vite manifest')
  const entry = manifest['index.html']
  assert(entry?.isEntry === true && typeof entry.file === 'string', 'Missing Vite HTML entry')
  const assets = new Set()
  const asset = name => {
    assert(typeof name === 'string' && name.startsWith('assets/'), `Wrong Vite asset base: ${name}`)
    file(name)
    assets.add(name)
  }
  let lazyModules = 0
  for (const [key, chunk] of Object.entries(manifest)) {
    assert(chunk && typeof chunk === 'object' && !Array.isArray(chunk), `Invalid Vite record: ${key}`)
    asset(chunk.file)
    for (const field of ['css', 'assets', 'imports', 'dynamicImports']) {
      assert(chunk[field] === undefined || Array.isArray(chunk[field]), `Invalid ${field} in ${key}`)
    }
    for (const name of [...(chunk.css || []), ...(chunk.assets || [])]) asset(name)
    for (const dependency of [...(chunk.imports || []), ...(chunk.dynamicImports || [])]) {
      assert(Object.hasOwn(manifest, dependency), `Missing Vite dependency ${dependency} from ${key}`)
    }
    if (chunk.isDynamicEntry) lazyModules++
  }

  for (const route of release.routes) {
    assert(typeof route === 'string' && /^\/(?:[a-z0-9_-]+\/?)*$/i.test(route), `Invalid public route: ${route}`)
    const name = route === '/' ? 'index.html' : route.replace(/^\/|\/$/g, '') + '/index.html'
    const html = readFileSync(file(name), 'utf8')
    assert(html.includes(BASE + entry.file), `Route references a different Vite entry: ${route}`)
    for (const match of html.matchAll(/\b(?:src|href)\s*=\s*(["'])([^"']+)\1/g)) {
      if (match[2].startsWith(BASE + 'assets/')) asset(match[2].slice(BASE.length))
    }
  }
  return {
    source_sha: info.source_sha, release_version: info.release_version,
    routes_checked: release.routes.length, assets_checked: assets.size, lazy_modules_checked: lazyModules,
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const options = {}
    for (let i = 2; i < process.argv.length; i += 2) {
      const key = process.argv[i]
      assert(['--directory', '--expected-sha', '--release-manifest'].includes(key) && process.argv[i + 1], `Invalid argument: ${key}`)
      options[key] = process.argv[i + 1]
    }
    const version = JSON.parse(readFileSync(options['--release-manifest'], 'utf8'))['.']
    assert(typeof version === 'string' && /^\d+\.\d+\.\d+$/.test(version), 'Invalid root release version')
    console.log(JSON.stringify(verifyPagesArtifact({
      directory: options['--directory'], expectedSha: options['--expected-sha'], releaseVersion: version,
    }), null, 2))
  } catch (error) {
    console.error('Pages artifact verification failed: ' + error.message)
    process.exitCode = 1
  }
}
