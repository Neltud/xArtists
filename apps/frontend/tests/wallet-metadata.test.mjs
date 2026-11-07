import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const source = readFileSync(new URL('../src/lib/xportalWc.ts', import.meta.url), 'utf8')
const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const pngSignature = Buffer.from('89504e470d0a1a0a', 'hex')

test('WalletConnect uses real bundled xArtists assets and absolute HTTPS URLs', () => {
  assert.match(source, /new URL\('icons\/icon-192\.png',appUrl\)\.href/)
  assert.match(source, /new URL\('xartists-logo\.png',appUrl\)\.href/)
  assert.match(source, /url:appUrl,icons:walletIcons/)
  assert.match(source, /new URL\(import\.meta\.env\.BASE_URL,origin\)/)
  for (const name of ['icons/icon-192.png', 'xartists-logo.png']) {
    const bytes = readFileSync(new URL('../public/' + name, import.meta.url))
    assert.ok(bytes.length > 100, name + ' is not empty')
    assert.ok(bytes.subarray(0, 8).equals(pngSignature), name + ' is not a valid PNG')
  }
  const appUrl = new URL('/xArtists/', 'https://neltud.github.io').href
  for (const name of ['icons/icon-192.png', 'xartists-logo.png']) {
    const iconUrl = new URL(name, appUrl)
    assert.equal(iconUrl.protocol, 'https:')
    assert.ok(iconUrl.pathname.startsWith('/xArtists/'))
  }
})

test('Browser favicon references an existing official icon rather than a placeholder', () => {
  assert.match(index, /rel="icon"[^>]+href="\/xArtists\/icons\/icon-192\.png"/)
})
