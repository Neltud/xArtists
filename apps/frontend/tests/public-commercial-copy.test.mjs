import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const source = path => readFileSync(new URL(path, import.meta.url), 'utf8')

test('Genesis products do not describe Whop subscriptions as a Genesis one-time checkout', () => {
  const s = source('../src/pages/PackLandingPage.tsx')
  assert.doesNotMatch(s, /whop\.com\/checkout\//i)
  assert.doesNotMatch(s, /Même prix one-time/)
  assert.match(s, /Whop · abonnement TCA distinct/)
  assert.match(s, /ne comprennent pas ce NFT/)
})

test('Public footer points to the official GitBook and dashboard avoids a false live label', () => {
  assert.match(source('../src/experience/Shell.tsx'), /https:\/\/xartists\.gitbook\.io\/xartists\//)
  assert.doesNotMatch(source('../src/command-center/DashboardSource.tsx'), /LIVE · Command/)
})

test('CSP allows the verified HTTPS Akash catalog without unsupported meta frame-ancestors', () => {
  const html = source('../index.html')
  assert.match(html, /connect-src[^"]+https:\/\/kc7hfr7tb9aqreaqtst0834c2c\.ingress\.hurricane\.akash\.pub/)
  assert.doesNotMatch(html, /frame-ancestors/)
})
