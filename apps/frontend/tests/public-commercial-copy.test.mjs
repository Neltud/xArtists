import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const source = path => readFileSync(new URL(path, import.meta.url), 'utf8')

test('Genesis product pages reject mixed Whop/EUR checkout and show separate Stripe services', () => {
  const s = source('../src/pages/PackLandingPage.tsx')
  assert.doesNotMatch(s, /whop\.com\/checkout\//i)
  assert.doesNotMatch(s, /Whop|PackCheckout|PackOpenTheater|pack\.priceEur\.list/)
  assert.match(s, /Abonnements mainstream · services seulement/)
  assert.match(s, /ne contiennent aucun NFT/)
  assert.match(s, /GENESIS_TARGETS_BY_ID/)
  assert.match(s, /33 \/ 22 \/ 11 EGLD/)
  assert.match(s, /Relevé contrat du 08\/11/)
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
