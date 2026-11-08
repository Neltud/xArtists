import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (s) => readFileSync(new URL(`../src/${s}`, import.meta.url), 'utf8')

test('all public pack discovery surfaces avoid legacy EGLD catalog anchors as transaction prices', () => {
  const agents = read('pages/Agents.tsx')
  const landing = read('pages/PackLandingPage.tsx')
  const digital = read('components/market/DigitalPacksPanel.tsx')
  const roster = read('command-center/AgentRoster.tsx')

  assert.doesNotMatch(agents, /33 \/ 22,5 \/ 15 EGLD/)
  assert.doesNotMatch(agents, /p\.priceEgld\.list/)
  assert.doesNotMatch(landing, /pack\.priceEgld\.list/)
  assert.doesNotMatch(digital, /p\.priceEgld\.list|Prix mint officiels : 10/)
  assert.doesNotMatch(roster, /p\.priceEgld\.(min|list)/)
  for (const source of [agents, landing, digital, roster]) {
    assert.match(source, /AGENT_PACK_SC_SNAPSHOT\.pricesEgld/)
  }
  assert.match(digital, /Découvrir pack/)
  assert.match(agents, /vente fermée/)
})

test('pack checkout release remains fail-closed regardless of discovery pricing changes', () => {
  const status = read('config/scStatus.ts')
  assert.match(status, /AGENT_PACK_PUBLIC_MINT_RELEASED = false/)
  assert.match(status, /AGENT_PACK_PUBLIC_COMMERCE_RELEASED = false/)
})
