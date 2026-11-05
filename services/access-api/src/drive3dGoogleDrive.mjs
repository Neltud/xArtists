import { prepareDriveCollectionInventory } from './drive3dInventory.mjs'

const DRIVE_API = 'https://www.googleapis.com/drive/v3/files'
const FOLDER_ID = '1D7_uSML8pCpXn96K3DQYxw7JFSp0Xiv1'
const fail = (code) => { throw new Error(code) }

/** Private server-side read-only inventory. Requires an explicitly supplied scoped OAuth token.
 * This function does not store credentials, download artwork, or expose Drive IDs publicly.
 */
export async function readPrivateDriveCardInventory({
  accessToken, fetchImpl = fetch, signal, folderId = FOLDER_ID,
} = {}) {
  if (typeof accessToken !== 'string' || !/^[\x21-\x7e]{20,4096}$/.test(accessToken)) fail('drive_token_required')
  if (folderId !== FOLDER_ID) fail('unapproved_drive_folder')
  const all = []
  const seenPages = new Set()
  let pageToken
  do {
    const url = new URL(DRIVE_API)
    url.searchParams.set('q', `'${folderId}' in parents and trashed = false`)
    url.searchParams.set('fields', 'nextPageToken,files(id,name,mimeType,size,md5Checksum)')
    url.searchParams.set('pageSize', '1000')
    if (pageToken) url.searchParams.set('pageToken', pageToken)
    let response
    try {
      response = await fetchImpl(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
        redirect: 'error', signal,
      })
    } catch { fail('drive_inventory_unavailable') }
    if (!response?.ok) fail('drive_inventory_unavailable')
    let payload
    try { payload = await response.json() } catch { fail('drive_inventory_invalid_response') }
    if (!Array.isArray(payload?.files)) fail('drive_inventory_invalid_response')
    for (const f of payload.files) {
      if (!f || typeof f.id !== 'string' || typeof f.name !== 'string') fail('drive_inventory_invalid_response')
      all.push(f)
      if (all.length > 291) fail('drive_inventory_exceeds_limit')
    }
    const next = payload.nextPageToken
    if (next !== undefined && (typeof next !== 'string' || !next || next.length > 2048)) {
      fail('drive_inventory_invalid_page_token')
    }
    if (next && seenPages.has(next)) fail('drive_inventory_page_loop')
    if (next) seenPages.add(next)
    pageToken = next
  } while (pageToken)
  return prepareDriveCollectionInventory(all)
}
