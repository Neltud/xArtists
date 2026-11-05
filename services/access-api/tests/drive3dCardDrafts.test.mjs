import test from 'node:test'
import assert from 'node:assert/strict'
import { prepareCardDrafts, XARTISTS_DRIVE_COLLECTION_SIZE } from '../src/drive3dCardDrafts.mjs'

const files = () => Array.from({ length: XARTISTS_DRIVE_COLLECTION_SIZE }, (_, i) => ({
  id: 'drive_file_identifier_' + (i + 1),
  name: 'xArtists' + String(i + 1).padStart(4, '0') + '.png',
  mimeType: 'image/png',
}))

test('prepares 291 sorted off-chain drafts without minted media', () => {
  const drafts = prepareCardDrafts(files().reverse())
  assert.equal(drafts.length, 291)
  assert.equal(drafts[0].edition, 1)
  assert.equal(drafts[290].edition, 291)
  assert.ok(drafts.every(d => d.status === 'draft_unminted' && d.image === null && d.metadata_cid === null && !d.rights_approved))
})
test('rejects missing edition', () => {
  const input = files()
  input[290].name = 'xArtists0290.png'
  assert.throws(() => prepareCardDrafts(input), /invalid_or_duplicate_edition/)
})
test('rejects unexpected media and duplicate IDs', () => {
  const input = files()
  input[0].mimeType = 'image/jpeg'
  assert.throws(() => prepareCardDrafts(input), /unsupported_media_type/)
  input[0].mimeType = 'image/png'
  input[0].id = input[1].id
  assert.throws(() => prepareCardDrafts(input), /duplicate_drive_file_id/)
})
test('rejects partial inventory', () => {
  assert.throws(() => prepareCardDrafts(files().slice(1)), /collection_count_mismatch/)
})
