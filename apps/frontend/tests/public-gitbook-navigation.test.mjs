import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const docs = new URL('../../../docs/', import.meta.url)
const summary = readFileSync(new URL('SUMMARY.md', docs), 'utf8')
const entries = summary.split(/\r?\n/).filter(line => /^\s*\* \[/.test(line))
const links = entries.map(line => {
  const match = line.match(/\]\(([^)]+)\)/)
  assert.ok(match, 'all navigation entries must be markdown links')
  return match[1]
})

test('GitBook visitor navigation is curated and has working relative documents', () => {
  assert.ok(entries.length <= 30, 'the public nav must not list hundreds of operator documents')
  assert.ok(entries.length >= 15, 'the public navigation must still be useful')
  for (const link of links) {
    assert.ok(!/^https?:\/\//.test(link), 'navigation must use repository-relative docs')
    assert.ok(existsSync(new URL(link, docs)), 'missing GitBook navigation document: ' + link)
  }
})

test('visitor nav prioritizes art, marketplace, auctions, LIA and transparent status', () => {
  for (const path of [
    'README.md',
    'presentation/README.md',
    'presentation/maison-manifeste.md',
    'presentation/mobile-marketplace-auctions.md',
    'presentation/lia-control-room-public.md',
    'presentation/etat-du-produit.md',
    'security/guide-public-packs-whop.md',
  ]) {
    assert.ok(links.includes(path), 'missing public guide: ' + path)
  }
})

test('operator and historical handoffs do not appear in public nav', () => {
  for (const link of links) {
    assert.doesNotMatch(link, /^ops\//)
    assert.doesNotMatch(link, /(?:grok|prompt|handoff|claim_pack|mint_jobs|deploy|runbook|audit|internal)/i)
  }
})
