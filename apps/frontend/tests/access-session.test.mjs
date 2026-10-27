import assert from 'node:assert/strict'
import { test } from 'node:test'
import { build } from 'esbuild'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { frontend } from './load-source.mjs'

const require = createRequire(import.meta.url)
const BUYER = 'erd1' + 'a'.repeat(58)
const OTHER = 'erd1' + 'c'.repeat(58)
const API = 'https://payments.example'
const expiresAt = Math.floor(Date.now() / 1000) + 900
const jwt = (sub = BUYER, exp = expiresAt) => 'header.' + Buffer.from(JSON.stringify({ sub, exp, access_level: 'SAMPLE' })).toString('base64url') + '.fixture_signature'

async function withSession(run, signer = async () => ({ ok: true, signature: 'fixture_signature' })) {
  const storage = new Map(), previous = { fetch: globalThis.fetch, storage: globalThis.sessionStorage, signer: globalThis.__accessSessionSigner }
  globalThis.sessionStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: key => storage.delete(key) }
  globalThis.__accessSessionSigner = signer
  try { return await run(storage) } finally {
    globalThis.fetch = previous.fetch
    globalThis.sessionStorage = previous.storage
    globalThis.__accessSessionSigner = previous.signer
  }
}

async function loadSessionModule() {
  const entry = resolve(frontend, 'src/lib/accessSession.ts')
  const result = await build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'browser',
    target: 'es2020',
    logLevel: 'silent',
    external: [],
    plugins: [{
      name: 'stub-deps',
      setup(build) {
        build.onResolve({ filter: /^\.\/stripe$/ }, () => ({ path: 'stripe-stub', namespace: 'stub' }))
        build.onResolve({ filter: /^\.\/signAccessMessage$/ }, () => ({ path: 'sign-stub', namespace: 'stub' }))
        build.onLoad({ filter: /.*/, namespace: 'stub' }, (args) => {
          if (args.path === 'stripe-stub') return { contents: `export function getAccessApiBase() { return '${API}' }`, loader: 'js' }
          return { contents: `export async function signAccessMessage(message) {
  if (typeof globalThis.__accessSessionSigner === 'function') return globalThis.__accessSessionSigner(message)
  return { ok: true, signature: 'fixture_signature' }
}`, loader: 'js' }
        })
      },
    }],
  })
  const code = result.outputFiles[0].text
  const module = { exports: {} }
  const fn = new Function('module', 'exports', 'require', code + '\n;module.exports = exports;')
  fn(module, module.exports, require)
  return module.exports
}

test('ensureAccessToken challenges, signs, and binds JWT to wallet', async () => {
  await withSession(async () => {
    const calls = []
    globalThis.fetch = async (url, init = {}) => {
      calls.push({ url: String(url), method: init.method || 'GET', body: init.body })
      if (String(url).endsWith('/v1/access/challenge')) {
        return { ok: true, status: 200, json: async () => ({ message: 'sign-me', nonce: 'n1' }) }
      }
      if (String(url).endsWith('/v1/verify-access')) {
        return { ok: true, status: 200, json: async () => ({ ok: true, token: jwt() }) }
      }
      return { ok: false, status: 500, json: async () => ({}) }
    }
    const mod = await loadSessionModule()
    const token = await mod.ensureAccessToken({ address: BUYER })
    assert.equal(token, jwt())
    assert.equal(mod.getAccessToken(BUYER), jwt())
    assert.equal(mod.getAccessToken(OTHER), null)
    assert.equal(calls[0].url, API + '/v1/access/challenge')
    assert.equal(calls[1].url, API + '/v1/verify-access')
    const body = JSON.parse(calls[1].body)
    assert.equal(body.signature, 'fixture_signature')
    assert.equal(body.message, 'sign-me')
    assert.equal(body.nonce, 'n1')
  })
})

test('ensureAccessToken fails closed when challenge or verify fails', async () => {
  await withSession(async (storage) => {
    storage.set('xartists_access_jwt', jwt())
    storage.set('xartists_access_jwt_addr', BUYER)
    globalThis.fetch = async () => ({ ok: false, status: 503, json: async () => ({}) })
    const mod = await loadSessionModule()
    // existing valid token short-circuits before fetch
    assert.equal(await mod.ensureAccessToken({ address: BUYER }), jwt())
    mod.clearAccessSession()
    assert.equal(await mod.ensureAccessToken({ address: BUYER }), null)
    assert.equal(mod.getAccessToken(BUYER), null)
  })
})

test('partial proof is rejected without calling verify', async () => {
  await withSession(async () => {
    let called = false
    globalThis.fetch = async () => { called = true; return { ok: false, status: 500, json: async () => ({}) } }
    const mod = await loadSessionModule()
    assert.equal(await mod.ensureAccessToken({ address: BUYER, signature: 'only-sig' }), null)
    assert.equal(called, false)
  })
})
