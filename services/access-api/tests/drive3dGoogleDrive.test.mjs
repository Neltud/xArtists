import test from 'node:test'
import assert from 'node:assert/strict'
import { readPrivateDriveCardInventory } from '../src/drive3dGoogleDrive.mjs'

const token = 'test_scoped_oauth_token_long_enough'
const files = Array.from({ length: 291 }, (_, i) => ({
  id: 'drive_identifier_' + (i + 1),
  name: 'xArtists' + String(i + 1).padStart(4, '0') + '.png',
  mimeType: 'image/png',
}))
test('read-only authenticated Drive inventory supports pagination', async () => {
  let requests = 0
  const inventory = await readPrivateDriveCardInventory({ accessToken: token,
    fetchImpl: async (url, init) => {
      requests++
      assert.match(url, /^https:\/\/www\.googleapis\.com\/drive\/v3\/files\?/)
      assert.equal(init.headers.Authorization, 'Bearer ' + token)
      assert.equal(init.redirect, 'error')
      return { ok: true, json: async () => requests === 1
        ? { files: files.slice(0, 200), nextPageToken: 'page2' }
        : { files: files.slice(200) } }
    },
  })
  assert.equal(requests, 2)
  assert.equal(inventory.count, 291)
  assert.equal(inventory.mint_enabled, false)
})
test('missing token and wrong folder are rejected', async () => {
  await assert.rejects(readPrivateDriveCardInventory(), /drive_token_required/)
  await assert.rejects(readPrivateDriveCardInventory({ accessToken: token, folderId: 'other' }), /unapproved_drive_folder/)
})
test('duplicate pages fail closed', async () => {
  await assert.rejects(readPrivateDriveCardInventory({ accessToken: token,
    fetchImpl: async () => ({ ok: true, json: async () => ({ files: [], nextPageToken: 'same' }) }),
  }), /drive_inventory_page_loop/)
})
test('incomplete inventory cannot pass verification', async () => {
  await assert.rejects(readPrivateDriveCardInventory({ accessToken: token,
    fetchImpl: async () => ({ ok: true, json: async () => ({ files: files.slice(0, 290) }) }),
  }), /collection_count_mismatch/)
})
