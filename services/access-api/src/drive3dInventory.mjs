import { prepareCardDrafts, XARTISTS_DRIVE_COLLECTION_SIZE } from './drive3dCardDrafts.mjs'

/**
 * Normalize a PRIVATE, authenticated Google Drive list response.
 * Call only from a server with scoped Drive credentials; never bundle OAuth tokens
 * or raw Drive IDs in the public frontend. This module makes no network calls.
 */
export function prepareDriveCollectionInventory(googleFiles) {
  if (!Array.isArray(googleFiles)) throw new Error('invalid_drive_inventory')
  const normalized = googleFiles.map(f => ({
    id: f.id,
    name: f.name ?? f.title,
    mimeType: f.mimeType ?? f.mime_type,
  }))
  const drafts = prepareCardDrafts(normalized, { expectedCount: XARTISTS_DRIVE_COLLECTION_SIZE })
  return {
    count: drafts.length,
    collection: 'xArtists Galerie NFT collection',
    editions: drafts,
    mint_enabled: false,
    payments_enabled: false,
    public_media_ready: false,
  }
}

/** Safe public catalog projection. Deliberately omits Drive IDs and media URLs. */
export function publicCardCatalog(inventory) {
  if (inventory?.count !== XARTISTS_DRIVE_COLLECTION_SIZE ||
      !Array.isArray(inventory.editions) || inventory.editions.length !== XARTISTS_DRIVE_COLLECTION_SIZE) {
    throw new Error('inventory_not_verified')
  }
  return inventory.editions.map(({ edition, source_name, status }) => ({
    edition, title: source_name.replace(/\.png$/i, ''), status,
    image: null, animation_url: null, sale_enabled: false,
  }))
}
