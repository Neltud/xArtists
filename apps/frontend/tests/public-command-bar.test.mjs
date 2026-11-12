import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { loadSource } from './load-source.mjs'

const { classifyPublicCommand, publicOpsBroadcastAllowed } = loadSource('src/lia/publicCommand.ts')
const panel = readFileSync(new URL('../src/command-center/IntentXPortalPanel.tsx', import.meta.url), 'utf8')
const page = readFileSync(new URL('../src/pages/GoLivePage.tsx', import.meta.url), 'utf8')

test('public ops broadcast stays closed regardless of the live trading flag', () => {
  assert.equal(publicOpsBroadcastAllowed(), false)
  assert.match(panel, /publicOpsBroadcastAllowed\(\)/)
  assert.doesNotMatch(panel, /useSendTransaction/)
  assert.doesNotMatch(panel, /await send\(/)
  assert.doesNotMatch(panel, /Signer xPortal/)
})

test('command bar blocks capital verbs and routes discovery without a transaction', () => {
  const now = Date.parse('2026-11-12T06:30:00Z')
  for (const phrase of ['achète Pulse', 'swap EGLD', 'mint nft', 'claim fees', 'bridge solana', 'payer en carte']) {
    const blocked = classifyPublicCommand(phrase, now)
    assert.equal(blocked.lane, 'blocked', phrase)
    assert.equal(blocked.href, '/go-live')
  }
  assert.equal(classifyPublicCommand('ouvre le musée', now).href, '/museum')
  assert.equal(classifyPublicCommand('montre le marché', now).lane, 'read')
  assert.equal(classifyPublicCommand('lis les packs LIA', now).lane, 'paper')
  assert.match(classifyPublicCommand('studio', now).detail, /4 j avant le 16 nov/)
})

test('go-live page mounts the command bar and keeps operator diagnostics collapsed', () => {
  assert.match(page, /import PublicCommandBar from '\.\.\/components\/PublicCommandBar'/)
  assert.match(page, /<PublicCommandBar \/>/)
  assert.match(page, /Disponibilité des services/)
  assert.match(page, /showDiagnostics, setShowDiagnostics.*useState\(false\)/)
})
