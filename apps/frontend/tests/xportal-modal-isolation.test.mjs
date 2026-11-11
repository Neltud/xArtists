import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const read = p => readFileSync(new URL(p,import.meta.url), 'utf8')
const modal = read('../src/components/LoginModal.tsx')
const panel = read('../src/components/WalletConnectPanel.tsx')
const wc = read('../src/lib/xportalWc.ts')

test('WalletConnect pairing URI is not broadcast across unrelated UI owners', () => {
  assert.doesNotMatch(modal, /addEventListener\('xartists-wc-uri'/)
  assert.doesNotMatch(wc, /dispatchEvent\(new CustomEvent\('xartists-wc-uri'/)
  assert.match(modal, /if \(p\.uri\) setWcUri\(p\.uri\)/)
  assert.match(wc, /onProgress\?\.\(\{\s*phase: 'uri',\s*uri,/)
})

test('modal closes only its own in-flight connection', () => {
  assert.match(modal, /const activeAttempt=useRef<number\|null>\(null\)/)
  assert.match(modal, /if \(activeAttempt\.current !== null\) \{\s*activeAttempt\.current = null\s*cancelXPortalLogin\(\)/)
  assert.match(modal, /activeAttempt\.current=id/)
  assert.match(modal, /if\(activeAttempt\.current===id\)activeAttempt\.current=null/)
})

test('stale QR is cleared on both failure and completion; fallback never promises a signature', () => {
  assert.match(panel, /wcProgress\?\.phase === 'done' \|\| wcProgress\?\.phase === 'error'/)
  assert.match(panel, /setWcUri\(null\)/)
  assert.match(modal, /if \(!res\.ok\) \{\s*setWcUri\(null\)/)
  assert.match(modal, /Web Wallet officiel \(sans connexion automatique\)/)
  assert.match(modal, /sans signature ni achat/)
  assert.match(modal, /Aucun checkout Fiat, droit NFT ou mint n'est activé/)
})

test('production Pages build allows an operator-approved Reown project variable', () => {
  const deploy = read('../../.github/workflows/static.yml')
  const example = read('../.env.example')
  assert.match(deploy, /VITE_WALLETCONNECT_PROJECT_ID: \$\\{\\{ vars\\.VITE_WALLETCONNECT_PROJECT_ID \\}\\}/)
  assert.match(example, /https:\/\/xartists\\.art/)
  assert.match(example, /https:\/\/www\\.xartists\\.art/)
  assert.doesNotMatch(example, /project already allowlisted/)
})
