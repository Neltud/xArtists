import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const data = JSON.parse(readFileSync(new URL('../public/data/ads_active.json', import.meta.url), 'utf8'))
const adUi = readFileSync(new URL('../src/components/AdSlot.tsx', import.meta.url), 'utf8')
const museumUi = readFileSync(new URL('../src/pages/MuseumPage.tsx', import.meta.url), 'utf8')

test('internal sponsor previews contain no fake IPFS CIDs or outdated hash routes', () => {
  for (const slot of Object.values(data.slots)) {
    if (slot.advertiser !== 'xArtists Ops') continue
    assert.equal(slot.imageCid, '')
    assert.ok(!slot.href?.includes('/#/'), slot.slot + ' has an obsolete URL')
    assert.ok(slot.href?.startsWith('https://neltud.github.io/xArtists/'))
    assert.ok(slot.imageUrl?.startsWith('https://neltud.github.io/xArtists/'))
    assert.match(slot.label, /NON VENDU/)
  }
})

test('unsold sponsor slots are explicitly non-transactional', () => {
  assert.match(adUi, /aucune réservation ouverte/)
  assert.match(adUi, /emplacement témoin, non vendu/)
  assert.doesNotMatch(adUi, /Enchères · réserver un slot/)
})

test('museum artwork previews keep full image visible and describe images', () => {
  assert.match(museumUi, /alt=\{f\.title\}/)
  assert.match(museumUi, /object-contain/)
  assert.match(museumUi, /href=\{f\.href \|\| undefined\}/)
  assert.doesNotMatch(museumUi, /href=\{f\.href \|\| '#'/)
})
