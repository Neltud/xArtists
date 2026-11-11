import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8')
const hook = read('../src/hooks/useMxLogin.ts')
const panel = read('../src/components/WalletConnectPanel.tsx')
const wc = read('../src/lib/xportalWc.ts')

test('wallet panel provides an explicit cancel action while xPortal is pending', () => {
  assert.match(panel, /\{busy && <button/)
  assert.match(panel, /Annuler la connexion xPortal/)
  assert.match(panel, /attempt\.current\+\+/)
  assert.match(panel, /cancelXPortal\(\)/)
  assert.match(panel, /setWcUri\(null\)/)
  assert.match(panel, /if \(id === attempt\.current\) setBusy\(false\)/)
})

test('stale or cancelled xPortal login must never be attached to wallet state', () => {
  assert.match(hook, /const attempt = useRef\(0\)/)
  assert.match(hook, /const cancelXPortal = useCallback\(\(\) => \{/)
  assert.match(hook, /cancelXPortalLogin\(\)/)
  assert.match(hook, /if \(attempt\.current === id\) setWcProgress\(p\)/)
  assert.match(hook, /if \(attempt\.current !== id\) return \{ ok: false as const, error: 'Connexion annulée\.' \}/)
  assert.match(hook, /wallet\.connect\(res\.address, 'xportal'\)/)
  assert.match(wc, /export function cancelXPortalLogin\(\)\{loginAbort\?\.abort\(\)\}/)
  assert.doesNotMatch(panel, /addEventListener\('xartists-wc-uri'/)
})

test('xPortal publicly separates relay initialization from QR pairing without leaking URI', () => {
  assert.match(wc, /phase: 'init' \| 'pairing' \| 'uri'/)
  assert.match(wc, /relayPhase:'init'\|'pairing'='init'/)
  assert.match(wc, /relayPhase='pairing'/)
  assert.match(wc, /Génération du QR xPortal/)
  assert.match(wc, /WalletConnect bloqué avant QR/)
  assert.match(wc, /if\(signal\.aborted\)throw new Error\('Connexion annulée\.'\)/)
})
