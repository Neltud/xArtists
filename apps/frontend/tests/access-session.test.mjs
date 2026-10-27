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
const jwt = (sub = BUYER, exp = expiresAt) =>
  'header.' + Buffer.from(JSON.stringify({ sub, exp, access_level: 'SAMPLE' })).toString('base64url') + '.fixture_signature'

async function withSession(run, signer = async () => ({ ok: true, signature: 'fixture_signature' })) {
  const storage = new Map()
  const previous = {
    fetch: globalThis.fetch,
    storage: globalThis.sessionStorage,
    signer: globalThis.__accessSessionSigner,
  }
  globalThis.sessionStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: key => storage.delete(key),
  }
  globalThis.__accessSessionSigner = signer
  const built = await build({
    entryPoints: [resolve(frontend, 'src/lib/accessSession.ts')],
    bundle: true,
    write: false,
    platform: 'node',
    format: 'cjs',
    define: { 'import.meta.env': JSON.stringify({ VITE_ACCESS_API_BASE: API }) },
    logLevel: 'silent',
    plugins: [
      {
        name: 'wallet-fixture',
        setup(buildApi) {
          buildApi.onResolve({ filter: /signAccessMessage$/ }, () => ({
            path: 'signer',
            namespace: 'fixture',
          }))
          buildApi.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({
            contents:
              'export const signAccessMessage = message => globalThis.__accessSessionSigner(message)',
            loader: 'js',
          }))
        },
      },
    ],
  })
  const module = { exports: {} }
  new Function('require', 'module', 'exports', built.outputFiles[0].text)(
    require,
    module,
    module.exports,
  )
  try {
    await run(module.exports, storage)
  } finally {
    globalThis.fetch = previous.fetch
    globalThis.sessionStorage = previous.storage
    globalThis.__accessSessionSigner = previous.signer
  }
}

const reply = (body, ok = true) => ({ ok, json: async () => body })

test('checkout session obtains one signed server challenge and stores the wallet-bound SAMPLE JWT', () => {
  const signed = []
  return withSession(async session => {
    const calls = []
    globalThis.fetch = async (url, options) => {
      calls.push({ url, body: JSON.parse(options.body) })
      return String(url).endsWith('/challenge')
        ? reply({ message: 'challenge', nonce: 'nonce' })
        : reply({ ok: true, token: jwt() })
    }
    assert.equal(await session.ensureAccessToken({ address: BUYER }), jwt())
    assert.equal(session.getAccessToken(BUYER), jwt())
    assert.equal(session.getAccessToken(OTHER), null)
    assert.deepEqual(calls, [
      { url: API + '/v1/access/challenge', body: { address: BUYER } },
      {
        url: API + '/v1/verify-access',
        body: {
          address: BUYER,
          signature: 'fixture_signature',
          message: 'challenge',
          nonce: 'nonce',
        },
      },
    ])
    assert.deepEqual(signed, ['challenge'])
  }, async message => {
    signed.push(message)
    return { ok: true, signature: 'fixture_signature' }
  })
})

test('challenge or signing failure fails closed without a session', () => {
  let signatures = 0
  return withSession(
    async session => {
      const calls = []
      globalThis.fetch = async url => {
        calls.push(String(url))
        return String(url).endsWith('/challenge')
          ? reply({}, false)
          : reply({ ok: true, token: jwt() })
      }
      assert.equal(await session.ensureAccessToken({ address: BUYER }), null)
      assert.deepEqual(calls, [API + '/v1/access/challenge'])
      assert.equal(signatures, 0)
    },
    async () => {
      signatures++
      return { ok: false, error: 'unexpected_signing' }
    },
  )
})

test('wrong-wallet, expired and unsuccessful verification responses never yield an access session', () =>
  withSession(async session => {
    for (const result of [
      { ok: true, token: jwt(OTHER) },
      { ok: true, token: jwt(BUYER, 1) },
      { ok: false, token: jwt() },
    ]) {
      globalThis.fetch = async url =>
        String(url).endsWith('/challenge')
          ? reply({ message: 'challenge', nonce: 'nonce' })
          : reply(result)
      assert.equal(await session.ensureAccessToken({ address: BUYER }), null)
      assert.equal(session.getAccessToken(BUYER), null)
    }
  }),
)

test('cached session avoids network and signing while remaining bound to its wallet', () => {
  let signatures = 0
  let requests = 0
  return withSession(
    async session => {
      const token = jwt()
      session.storeAccessSession(token, BUYER)
      globalThis.fetch = async () => {
        requests++
        return reply({}, false)
      }
      assert.equal(await session.ensureAccessToken({ address: BUYER }), token)
      assert.equal(session.getAccessToken(OTHER), null)
      assert.equal(requests, 0)
      assert.equal(signatures, 0)
    },
    async () => {
      signatures++
      return { ok: false, error: 'unexpected_signing' }
    },
  )
})

test('partial supplied proof fails closed without signing or making requests', () => {
  let signatures = 0
  let requests = 0
  return withSession(
    async session => {
      globalThis.fetch = async () => {
        requests++
        return reply({}, false)
      }
      assert.equal(
        await session.ensureAccessToken({
          address: BUYER,
          message: 'partial',
          nonce: 'nonce',
        }),
        null,
      )
      assert.equal(requests, 0)
      assert.equal(signatures, 0)
    },
    async () => {
      signatures++
      return { ok: false, error: 'unexpected_signing' }
    },
  )
})

test('complete supplied proof is verified once without requesting or signing another challenge', () =>
  withSession(
    async session => {
      const calls = []
      globalThis.fetch = async (url, options) => {
        calls.push({ url, body: JSON.parse(options.body) })
        return reply({ ok: true, token: jwt() })
      }
      assert.equal(
        await session.ensureAccessToken({
          address: BUYER,
          signature: 'supplied',
          message: 'original',
          nonce: 'nonce_once',
        }),
        jwt(),
      )
      assert.deepEqual(calls, [
        {
          url: API + '/v1/verify-access',
          body: {
            address: BUYER,
            signature: 'supplied',
            message: 'original',
            nonce: 'nonce_once',
          },
        },
      ])
    },
    async () => {
      assert.fail('supplied proof must not trigger another signature')
    },
  ),
)
