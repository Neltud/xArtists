import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  egldPriceToWei, preparePaperDistributor, normalizeNftInventory,
  simulatePaperDraw,
} from '../src/lib/distributorPaper.mjs'

const collection = 'XART-abcdef'
const inventory = ['XART-abcdef-01', 'XART-abcdef-02', 'XART-abcdef-03']
const base = {
  title: 'Studio 1 · Edition originale', collectionId: collection,
  mode: 'escrow_inventory', fixedPriceEgld: '0.25', inventory,
  rightsConfirmed: true, perWalletLimit: 2,
}

test('fixed price per collection is exact BigInt wei; never JS float', () => {
  assert.equal(egldPriceToWei('0.25'), '250000000000000000')
  assert.equal(egldPriceToWei('0.000000000000000001'), '1')
  assert.equal(egldPriceToWei('10000'), '10000000000000000000000')
  for (const value of ['0', '0.0', '0.000000000000000000', '0.0000000000000000001', '-1', '2e4', '10001', '01', 'Infinity', 'NaN', '1,2', '1.']) {
    assert.throws(() => egldPriceToWei(value), 'reject price ' + value)
  }
})

test('escrow draft has immutable fixed price, unique inventory and zero live capabilities', () => {
  const draft = preparePaperDistributor(base)
  assert.equal(draft.supplyCap, 3)
  assert.equal(draft.fixedPriceWei, '250000000000000000')
  assert.equal(draft.deployment.contractAddress, null)
  assert.equal(draft.status, 'PAPER_PREVIEW_ONLY')
  assert.equal(draft.kind, 'creator_artwork_not_genesis_pack')
  assert.equal(draft.paymentEnabled, false)
  assert.equal(draft.mintEnabled, false)
  assert.equal(draft.inventoryDepositsEnabled, false)
  assert.equal(draft.deliveryVerified, false)
  assert.equal(draft.randomnessProofVerified, false)
  assert.ok(draft.blockers.includes('contract_unverified_and_not_deployed'))
  assert.ok(draft.blockers.includes('inventory_custody_not_verified'))
  assert.ok(Object.isFrozen(draft) && Object.isFrozen(draft.nftInventory))
  assert.deepEqual(draft.nftInventory, inventory)
  assert.throws(() => preparePaperDistributor({ ...base, inventory: [...inventory, inventory[0]] }), /inventory_duplicate_nft/)
})

test('lazy mint only accepts metadata IPFS; never assumes SC NFTCreate role', () => {
  const lazy = {
    title: 'Collection PAPIER', collectionId: collection,
    mode: 'lazy_mint', fixedPriceEgld: '1.5',
    plannedSupply: 2, metadataUris: ['ipfs://bafy' + 'a'.repeat(20)],
    rightsConfirmed: true,
  }
  const draft = preparePaperDistributor(lazy)
  assert.equal(draft.supplyCap, 2)
  assert.equal(draft.mintEnabled, false)
  assert.ok(draft.blockers.includes('nft_create_role_not_verified'))
  assert.ok(draft.blockers.includes('metadata_supply_not_complete_or_pinned'))
  assert.throws(() => preparePaperDistributor({ ...lazy, inventory }), /lazy_mint_does_not_accept/)
  assert.throws(() => preparePaperDistributor({ ...lazy, metadataUris: ['https://ipfs.io/ipfs/fake'] }), /invalid_ipfs_metadata_uri/)
  assert.throws(() => preparePaperDistributor({ ...lazy, plannedSupply: 0 }), /invalid_planned_supply/)
  assert.throws(() => preparePaperDistributor({ ...lazy, plannedSupply: 1, metadataUris: Array(2).fill('ipfs://bafy'+'a'.repeat(20)) }), /invalid_metadata_manifest/)
})

test('wallet and rights are required before any real authorization, never inferred by preview', () => {
  const draft = preparePaperDistributor({ ...base, rightsConfirmed: false, artistAddress: '' })
  assert.ok(draft.blockers.includes('artwork_rights_declaration_missing'))
  assert.ok(draft.blockers.includes('collection_owner_not_verified'))
  assert.equal(draft.deployment.creatorWalletSignatureRequired, true)
  for (const artistAddress of ['erd1bad', '0x123']) {
    assert.throws(() => preparePaperDistributor({ ...base, artistAddress }), /invalid_artist_address/)
  }
  for (const mode of ['genesis_pack', 'unchecked', '']) {
    assert.throws(() => preparePaperDistributor({ ...base, mode }), /unsupported_distributor_mode/)
  }
  assert.throws(() => preparePaperDistributor({ ...base, collectionId: 'TRO-94c925' .toLowerCase() }), /invalid_collection_id/)
})

test('reject mixed collection, duplicate, zero nonce and invalid amounts', () => {
  assert.deepEqual(normalizeNftInventory(collection, inventory), inventory)
  for (const entries of [
    [], ['OTH-abcdef-01'], ['XART-abcdef-00'],
    ['XART-abcdef-1'], ['XART-abcdef-gg'], [inventory[0], inventory[0]],
  ]) {
    assert.throws(() => normalizeNftInventory(collection, entries))
  }
  assert.throws(() => preparePaperDistributor({ ...base, perWalletLimit: 0 }), /invalid_per_wallet_limit/)
  assert.throws(() => preparePaperDistributor({ ...base, metadataUris: ['ipfs://bafyaaaaa'] }), /escrow_does_not_accept/)
})

test('non-payable preview chooses each NFT at most once, persisting no delivery claims', async () => {
  const sold = []
  let last
  for (let i = 0; i < inventory.length; i++) {
    const result = await simulatePaperDraw({ collectionId: collection, inventory, soldIds: sold,
      seed: 'preview-user-seed-abcdef', drawNumber: i })
    assert.ok(inventory.includes(result.selectedNftId))
    assert.equal(sold.includes(result.selectedNftId), false)
    assert.equal(result.paperOnly, true)
    assert.equal(result.paymentExecuted, false)
    assert.equal(result.nftTransferred, false)
    assert.equal(result.onChainRandomnessVerified, false)
    assert.equal(result.itemsRemainingAfter, inventory.length - i - 1)
    sold.push(result.selectedNftId)
    last = result
  }
  assert.equal(new Set(sold).size, 3)
  assert.equal(last.itemsRemainingAfter, 0)
  await assert.rejects(simulatePaperDraw({ collectionId: collection, inventory,
    soldIds: sold, seed: 'preview-user-seed-abcdef' }), /inventory_exhausted/)
  const first = await simulatePaperDraw({ collectionId: collection, inventory,
    seed: 'preview-user-seed-abcdef', drawNumber: 0 })
  const repeated = await simulatePaperDraw({ collectionId: collection, inventory,
    seed: 'preview-user-seed-abcdef', drawNumber: 0 })
  assert.deepEqual(first, repeated, 'reproducible paper draw; not a fairness proof')
})

test('reject buyer-selected winner manipulation attempts and duplicate sold IDs', async () => {
  await assert.rejects(simulatePaperDraw({ collectionId: collection, inventory,
    soldIds: [inventory[0], inventory[0]], seed: 'preview-user-seed-abcdef' }), /invalid_sold_inventory/)
  await assert.rejects(simulatePaperDraw({ collectionId: collection, inventory,
    soldIds: ['XART-abcdef-04'], seed: 'preview-user-seed-abcdef' }), /invalid_sold_inventory/)
  await assert.rejects(simulatePaperDraw({ collectionId: collection, inventory,
    seed: 'tiny' }), /invalid_paper_seed/)
  await assert.rejects(simulatePaperDraw({ collectionId: collection, inventory,
    seed: 'preview-user-seed-abcdef', drawNumber: -1 }), /invalid_draw_number/)
})
