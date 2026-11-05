import test from 'node:test'
import assert from 'node:assert/strict'
import { prepareDriveCollectionInventory, publicCardCatalog } from '../src/drive3dInventory.mjs'

const files = () => Array.from({ length: 291 }, (_, i) => ({
  id: 'drive_identifier_' + (i + 1),
  name: 'xArtists' + String(i + 1).padStart(4, '0') + '.png',
  mimeType: 'image/png',
}))

test('Drive metadata maps to 291 off-chain editions without public IDs', () => {
  const inventory = prepareDriveCollectionInventory(files().reverse())
  assert.equal(inventory.count, 291)
  assert.equal(inventory.mint_enabled, false)
  const catalog = publicCardCatalog(inventory)
  assert.equal(catalog[0].edition, 1)
  assert.equal(catalog[290].edition, 291)
  assert.ok(catalog.every(c => c.image === null && c.sale_enabled === false))
  assert.ok(!JSON.stringify(catalog).includes('drive_identifier_'))
})
test('incomplete or unexpected Drive inventory fails closed', () => {
  assert.throws(() => prepareDriveCollectionInventory(files().slice(1)), /collection_count_mismatch/)
  const wrong = files()
  wrong[0].mimeType = 'image/jpeg'
  assert.throws(() => prepareDriveCollectionInventory(wrong), /unsupported_media_type/)
})
