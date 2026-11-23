import {architecture as a,catalogue,navigation as n} from './architecture-catalogue.mjs'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = path => readFileSync(new URL('../src/' + path, import.meta.url), 'utf8')
const docs = path => readFileSync(new URL('../../../docs/' + path, import.meta.url), 'utf8')

test('Art discovery leads with marketplace and contextual exhibitions and provenance',()=>{
  assert.equal(a.PRIMARY_AREAS[0].id,'art')
  assert.equal(a.PRIMARY_AREAS[0].to,'/marketplace')
  assert.deepEqual(a.contextualModules(catalogue,'market').map(x=>x.id),['market','museum','maison','rwa'])
  assert.equal(a.isNavigationVisible('auction'),false)
  assert.equal(a.isNavigationVisible('auction',true),true)
  assert.equal(n.currentPrimarySection('/rwa',catalogue),'art')
})

test('Maison is a real public route and GitBook page, not a placeholder', () => {
  assert.match(src('App.tsx'), /path="\/maison"/)
  assert.match(src('App.tsx'), /path="\/manifesto"/)
  const house = src('pages/HousePage.tsx')
  assert.match(house, /TUDURI_WORKS/)
  assert.match(house, /ATELIER_EXPLORER/)
  assert.match(house, /NFT is not automatically legal title/)
  assert.match(house, /No real bids, awards or settlements/)
  assert.match(docs('SUMMARY.md'), /presentation\/maison-manifeste\.md/)
  assert.match(docs('presentation/maison-manifeste.md'), /NO-GO/)
})

test('Auction witness cannot masquerade as a paid or available listing', () => {
  const auction = src('pages/AuctionPage.tsx')
  assert.match(auction, /TUDURI_WORKS\[0\]/)
  assert.match(auction, /Non proposé à la vente/)
  assert.match(auction, /aucune enchère, prix, garde ni adjudication attestés/)
  assert.doesNotMatch(auction, /placeBid\(/)
})
