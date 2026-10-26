import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import vm from 'node:vm'
import { loadSource, frontend } from './load-source.mjs'
import { fallbackHtml, publicRoutes, publicAvailabilityPlugin } from '../scripts/publicAvailability.mjs'

test('Pages and legacy hash links restore the destination, query and fragment without leaving the app', () => {
  const { restoredPublicUrl, normalizePublicPath } = loadSource('src/lib/publicRoutes.ts')
  assert.equal(normalizePublicPath('/app/'), '/app')
  assert.equal(normalizePublicPath('/workspace/wallet/'), '/workspace/wallet')
  assert.equal(normalizePublicPath('/'), '/')
  const origin = 'https://example.com', base = '/xArtists/'
  const original = '/xArtists/explore/artwork/XAR-abc-01?lang=fr&label=%C3%A9#details'
  assert.equal(restoredPublicUrl(`${origin}${base}?_xa_route=${encodeURIComponent(original)}`, base), original)
  assert.equal(restoredPublicUrl(`${origin}${base}?lang=en#/wallet?tab=nft#items`, base), '/xArtists/wallet?tab=nft&lang=en#items')
  assert.equal(restoredPublicUrl(`${origin}${base}#/explore/museum`, base), '/xArtists/explore/museum')
  assert.equal(restoredPublicUrl(`${origin}${base}workspace/wallet`, base), null)
  for (const target of ['https://evil.example/xArtists/', '//evil.example/xArtists/', '/xArtists-evil/app', '/xArtists/../other/', '/xArtists/assets/private.js', 'javascript:alert(1)']) {
    assert.equal(restoredPublicUrl(`${origin}${base}?_xa_route=${encodeURIComponent(target)}`, base), null, target)
  }
})

test('the emitted 404 redirect round-trips an artwork URL including wallet callback parameters', () => {
  const location = { pathname: '/xArtists/explore/artwork/XAR-01', search: '?lang=fr&address=erd1fixture', hash: '#details', replace(value) { this.replacement = value } }
  vm.runInNewContext(fallbackHtml('/xArtists/').match(/<script>([\s\S]+)<\/script>/)[1], { location })
  const redirected = new URL(location.replacement, 'https://example.com')
  assert.equal(redirected.pathname, '/xArtists/')
  assert.equal(redirected.searchParams.get('_xa_route'), location.pathname + location.search + location.hash)
})

test('every canonical route and alias is emitted as real HTML, including mobile entry points', async () => {
  const routes = publicRoutes(await fs.readFile(path.join(frontend, 'src/experience/modules.ts'), 'utf8'))
  for (const required of ['/app', '/install', '/mobile', '/workspace/wallet', '/wallet', '/explore/museum', '/museum']) assert(routes.includes(required), required)
  assert.equal(new Set(routes).size, routes.length)
  const runtime = path.join(frontend, '.sites-runtime')
  await fs.mkdir(runtime, { recursive: true })
  const root = await fs.mkdtemp(path.join(runtime, 'availability-'))
  try {
    await fs.mkdir(path.join(root, 'src/experience'), { recursive: true })
    await fs.writeFile(path.join(root, 'src/experience/modules.ts'), "module('wallet','/workspace/wallet',['/wallet'])")
    await fs.mkdir(path.join(root, 'dist'))
    const html = '<html>sites-v3-release</html>'
    await fs.writeFile(path.join(root, 'dist/index.html'), html)
    const plugin = publicAvailabilityPlugin()
    plugin.configResolved({ root, build: { outDir: 'dist' }, base: '/xArtists/', env: { VITE_LIA_LIVE_TRADING: '0' } })
    await plugin.closeBundle()
    assert.equal(await fs.readFile(path.join(root, 'dist/workspace/wallet/index.html'), 'utf8'), html)
    assert.equal(await fs.readFile(path.join(root, 'dist/wallet/index.html'), 'utf8'), html)
    assert((await fs.readFile(path.join(root, 'dist/404.html'), 'utf8')).includes('_xa_route'))
    assert.equal(JSON.parse(await fs.readFile(path.join(root, 'dist/dapp-release.json'), 'utf8')).lia_live_trading, false)
  } finally { await fs.rm(root, { recursive: true, force: true }) }
})

test('PWA manifest declares real PNG dimensions and keeps shortcuts inside its scope', async () => {
  const manifest = JSON.parse(await fs.readFile(path.join(frontend, 'public/manifest.webmanifest'), 'utf8'))
  assert.equal(manifest.id, '/xArtists/')
  assert.equal(manifest.start_url, manifest.scope)
  for (const icon of manifest.icons) {
    const bytes = await fs.readFile(path.join(frontend, 'public', icon.src.replace('/xArtists/', '')))
    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
    assert.equal(`${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`, icon.sizes)
  }
  for (const shortcut of manifest.shortcuts) assert(shortcut.url.startsWith(manifest.scope))
  const apple = await fs.readFile(path.join(frontend, 'public/icons/apple-touch-icon.png'))
  assert.equal(apple.readUInt32BE(16), 180)
  const metadataIcon = await fs.readFile(path.join(frontend, 'public/xartists-logo.png'))
  assert.equal(metadataIcon.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
})

test('an install prompt survives navigation, is used once, and is not reported installed before appinstalled', async () => {
  const previousWindow = globalThis.window
  const window = new EventTarget()
  window.matchMedia = () => ({ matches: false, addEventListener() {} })
  globalThis.window = window
  try {
    const install = loadSource('src/pwa/installPrompt.ts')
    install.watchInstallPrompt(); install.watchInstallPrompt()
    let calls = 0
    const event = new Event('beforeinstallprompt', { cancelable: true })
    event.prompt = async () => { calls++ }
    event.userChoice = Promise.resolve({ outcome: 'accepted' })
    window.dispatchEvent(event)
    assert(event.defaultPrevented)
    assert.equal(install.getInstallStatus(), 'ready')
    let notifications = 0
    const unsubscribe = install.subscribeInstall(() => { notifications++ })
    await Promise.all([install.installDapp(), install.installDapp()])
    assert.equal(calls, 1)
    assert.equal(install.getInstallStatus(), 'unavailable')
    window.dispatchEvent(new Event('appinstalled'))
    assert.equal(install.getInstallStatus(), 'installed')
    assert.equal(notifications, 2)
    unsubscribe()
  } finally { globalThis.window = previousWindow }
})

async function serviceWorker() {
  const handlers = {}, cached = [], removed = []
  const context = {
    URL, Response,
    self: { location: { href: 'https://example.com/xArtists/service-worker.js' }, clients: { claim: async () => {} }, addEventListener: (name, handler) => { handlers[name] = handler } },
    caches: { open: async () => ({ addAll: async () => {}, put: async (request) => { cached.push(request.url) } }), keys: async () => ['xartists-shell-v10', 'unrelated-app-cache'], delete: async key => { removed.push(key) }, match: async () => undefined },
    fetch: async () => { throw Error('offline') },
  }
  vm.runInNewContext(await fs.readFile(path.join(frontend, 'public/service-worker.js'), 'utf8'), context)
  const request = (pathname, extra = {}) => ({ url: 'https://example.com' + pathname, method: 'GET', mode: 'cors', destination: '', ...extra })
  const send = async request => {
    let response
    const pending = []
    handlers.fetch({ request, respondWith: promise => { response = promise }, waitUntil: promise => pending.push(promise) })
    const result = await response
    await Promise.all(pending)
    return result
  }
  return { handlers, context, cached, removed, request, send }
}

test('service worker leaves wallets, payments, prices and other apps on the network', async () => {
  const sw = await serviceWorker()
  for (const path of ['/xArtists/api/paybox/orders', '/xArtists/data/prices.json', '/xArtists/build-info.json', '/xArtists/dapp-release.json', '/another-app/assets/main.js']) {
    assert.equal(await sw.send(sw.request(path)), undefined, path)
  }
  assert.equal(await sw.send(sw.request('/xArtists/api/orders', { method: 'POST' })), undefined)
  assert.deepEqual(sw.cached, [])
  const pending = []
  sw.handlers.activate({ waitUntil: promise => pending.push(promise) })
  await Promise.all(pending)
  assert.deepEqual(sw.removed, ['xartists-shell-v10'])
})

test('missing JS never receives HTML, offline navigation is explicit, and failed responses are not cached', async () => {
  const sw = await serviceWorker()
  const response = await sw.send(sw.request('/xArtists/assets/missing.js', { destination: 'script' }))
  assert.equal(response.type, 'error')
  sw.context.caches.match = async key => String(key).endsWith('/offline.html') ? new Response('Explicit offline page') : undefined
  assert.equal(await (await sw.send(sw.request('/xArtists/app/', { mode: 'navigate' }))).text(), 'Explicit offline page')
  sw.context.fetch = async () => new Response('Not found', { status: 404 })
  assert.equal((await sw.send(sw.request('/xArtists/assets/missing.js', { destination: 'script' }))).status, 404)
  assert.deepEqual(sw.cached, [])
  sw.context.fetch = async () => {
    const result = new Response('javascript')
    Object.defineProperty(result, 'type', { value: 'basic' })
    return result
  }
  await sw.send(sw.request('/xArtists/assets/app-hashed.js', { destination: 'script' }))
  assert.deepEqual(sw.cached, ['https://example.com/xArtists/assets/app-hashed.js'])
})
