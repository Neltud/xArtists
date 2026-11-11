import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8')
const source = read('src/config/communityLinks.ts')
  .replace('import.meta.env.VITE_XARTISTS_DISCORD_INVITE_URL', 'undefined')
  .replace('import.meta.env.VITE_XARTISTS_TELEGRAM_URL', 'undefined')
const js = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020,
}}).outputText
const { approvedCommunityUrl, COMMUNITY_CONTACTS } =
  await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'))

test('neither social contact is published by default', () => {
  assert.equal(COMMUNITY_CONTACTS.discord, null)
  assert.equal(COMMUNITY_CONTACTS.telegram, null)
})

test('valid HTTPS community invite formats can be configured by the operator', () => {
  assert.equal(approvedCommunityUrl('discord', 'https://discord.gg/AbC1234'), 'https://discord.gg/AbC1234')
  assert.equal(approvedCommunityUrl('discord', 'https://discord.com/invite/AbC1234'), 'https://discord.com/invite/AbC1234')
  assert.equal(approvedCommunityUrl('telegram', 'https://t.me/xArtistsOfficial'), 'https://t.me/xArtistsOfficial')
  assert.equal(approvedCommunityUrl('telegram', 'https://t.me/+1234567890ABC'), 'https://t.me/+1234567890ABC')
})

test('malicious redirects, lookalike domains and protocol downgrade are rejected', () => {
  for (const input of [
    'http://discord.gg/AbC1234',
    'https://discord.gg.evil.example/AbC1234',
    'https://discord.gg/AbC1234?next=evil',
    'https://user:pass@discord.gg/AbC1234',
    'javascript:alert(1)',
    'https://discord.com/oauth2/authorize',
  ]) assert.equal(approvedCommunityUrl('discord', input), null, input)
  for (const input of [
    'http://t.me/xArtistsOfficial',
    'https://t.me.evil.example/xArtistsOfficial',
    'https://t.me/xArtistsOfficial?start=secret',
    'https://t.me/xArtistsOfficial/55',
    'https://discord.gg/AbC1234',
  ]) assert.equal(approvedCommunityUrl('telegram', input), null, input)
})

test('community contacts appear on offers and shared footer, pending is not clickable', () => {
  const page = read('src/pages/CommercialLaunchPage.tsx')
  const footer = read('src/experience/Shell.tsx')
  assert.match(page, /communityPending: 'Lien officiel à confirmer'/)
  assert.match(page, /communityPending: 'Official link awaiting confirmation'/)
  assert.match(page, /COMMUNITY_CONTACTS\[network\]\s*\?\s*<a/)
  assert.match(page, /COMMUNITY_CONTACTS\[network\]!/)
  assert.match(footer, /COMMUNITY_CONTACTS\.discord&&<a/)
  assert.match(footer, /COMMUNITY_CONTACTS\.telegram&&<a/)
  assert.doesNotMatch(page, /discord\.gg\/QkJgzeyWG|t\.me\/xartists|TELEGRAM_BOT_TOKEN/)
  assert.doesNotMatch(source, /DISCORD_WEBHOOK_URL\s*=/)
})
