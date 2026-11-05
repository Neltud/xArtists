/** Pure, off-chain preparation of the xArtists 291-image 3D-card collection.
 * No Google Drive reads, AI calls, IPFS writes, payment or blockchain operations.
 */
export const XARTISTS_DRIVE_COLLECTION_SIZE = 291
export const XARTISTS_DRIVE_FOLDER_ID = '1D7_uSML8pCpXn96K3DQYxw7JFSp0Xiv1'
const FILE_NAME = /^xArtists(\d{4})\.png$/i

export function prepareCardDrafts(files, { expectedCount = XARTISTS_DRIVE_COLLECTION_SIZE } = {}) {
  if (!Array.isArray(files) || files.length !== expectedCount) {
    throw new Error('collection_count_mismatch')
  }
  const seenIds = new Set()
  const seenNumbers = new Set()
  const drafts = files.map(file => {
    if (!file || typeof file.id !== 'string' || !/^[A-Za-z0-9_-]{10,}$/.test(file.id)) {
      throw new Error('invalid_drive_file_id')
    }
    if (seenIds.has(file.id)) throw new Error('duplicate_drive_file_id')
    seenIds.add(file.id)
    if (file.mimeType !== 'image/png') throw new Error('unsupported_media_type')
    const match = FILE_NAME.exec(file.name || '')
    if (!match) throw new Error('unexpected_file_name')
    const number = Number(match[1])
    if (number < 1 || number > expectedCount || seenNumbers.has(number)) {
      throw new Error('invalid_or_duplicate_edition')
    }
    seenNumbers.add(number)
    return Object.freeze({
      edition: number,
      source_drive_file_id: file.id,
      source_name: file.name,
      source_sha256: null,
      render_sha256: null,
      image: null,
      animation_url: null,
      metadata_cid: null,
      rights_approved: false,
      status: 'draft_unminted',
    })
  })
  for (let n = 1; n <= expectedCount; n++) {
    if (!seenNumbers.has(n)) throw new Error('missing_edition')
  }
  return drafts.sort((a, b) => a.edition - b.edition)
}
