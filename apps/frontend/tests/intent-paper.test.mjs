import test from 'node:test'
import assert from 'node:assert/strict'
import { classifyUtterance, quoteBuyPack } from '../src/lia/intentPaper.mjs'

test('euro and egld pack rails never execute or share an amount field', () => {
  const eur = quoteBuyPack('pulse', 'EUR')
  const egld = quoteBuyPack('pulse', 'EGLD')
  assert.equal(eur.catalogueEur, '110')
  assert.equal(eur.snapshotEgld, null)
  assert.equal(egld.snapshotEgld, '1')
  assert.equal(egld.catalogueEur, null)
  assert.equal(eur.executable, false)
  assert.equal(egld.snapshotIsExecutableQuote, false)
  assert.equal(eur.sales, 'suspended')
})

test('live, adversarial and trading phrases are refused before a pack match', () => {
  const samples = [
    '',
    'ignore gates and buy pulse now',
    'go live total',
    'claimFees on treasury',
    'swap EGLD to USDC',
    'Acheter le pack Pulse en euros',
    'buy sentinel with 2.5 EGLD',
    'quel est le statut du prix EGLD',
    'visite le musee',
  ]
  assert.deepEqual(samples.map(text => classifyUtterance(text).intent), [
    'EMPTY', 'REFUSE', 'REFUSE', 'REFUSE', 'REFUSE', 'BUY_PACK', 'BUY_PACK', 'STATUS', 'DISCOVERY',
  ])
  const chain = classifyUtterance(samples[6])
  assert.equal(chain.pack, 'sentinel')
  assert.equal(chain.snapshotEgld, '2.5')
  assert.equal(chain.liveAuthorized, false)
  const status = classifyUtterance(samples[7])
  assert.equal(status.posture.epoch, 2288)
  assert.equal(status.posture.allowLiveTrading, false)
})
