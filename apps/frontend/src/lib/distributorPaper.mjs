/**
 * xArtists collection distributor PAPER preview.
 * No transfers, roles, deployments, payments, mint calls or stored user data.
 * This is NOT a deployed SC and this preview draw is NOT a fairness proof.
 */
const COLLECTION = /^[A-Z0-9]{3,20}-[a-f0-9]{6}$/
const MAX_SUPPLY = 5000
const MAX_PRICE_WEI = 10000n * 10n ** 18n
const MAX_WALLET_CAP = 100
const fail = reason => { throw new Error(reason) }

export function egldPriceToWei(value) {
  if (typeof value !== 'string' || !/^(?:0|[1-9][0-9]{0,4})(?:\.[0-9]{1,18})?$/.test(value))
    fail('invalid_fixed_price_egld')
  const [whole, fraction = ''] = value.split('.')
  const amount = BigInt(whole) * 10n ** 18n + BigInt((fraction + '0'.repeat(18)).slice(0, 18))
  if (amount <= 0n || amount > MAX_PRICE_WEI) fail('price_out_of_safe_range')
  return amount.toString()
}

export function normalizeCollectionId(value) {
  if (typeof value !== 'string') fail('invalid_collection_id')
  const token = value.trim()
  if (!COLLECTION.test(token)) fail('invalid_collection_id')
  return token
}

export function normalizeNftInventory(collection, entries) {
  if (!Array.isArray(entries) || entries.length < 1 || entries.length > MAX_SUPPLY)
    fail('invalid_inventory_supply')
  const seen = new Set()
  return entries.map(item => {
    const nft = typeof item === 'string' ? item.trim() : ''
    const match = new RegExp('^' + collection + '-([a-f0-9]{2,16})$', 'i').exec(nft)
    if (!match || BigInt('0x' + match[1]) === 0n || match[1].length % 2 !== 0)
      fail('inventory_nft_identifier_invalid')
    const canonical = collection + '-' + match[1].toLowerCase()
    if (seen.has(canonical)) fail('inventory_duplicate_nft')
    seen.add(canonical)
    return canonical
  })
}

export function preparePaperDistributor({
  title = '', collectionId, mode, fixedPriceEgld, inventory = [],
  plannedSupply = 0, metadataUris = [], artistAddress = '',
  rightsConfirmed = false, perWalletLimit = 1,
} = {}) {
  const collection = normalizeCollectionId(collectionId)
  if (!['escrow_inventory', 'lazy_mint'].includes(mode)) fail('unsupported_distributor_mode')
  const priceWei = egldPriceToWei(fixedPriceEgld)
  if (!Number.isSafeInteger(perWalletLimit) || perWalletLimit < 1 || perWalletLimit > MAX_WALLET_CAP)
    fail('invalid_per_wallet_limit')
  const name = String(title || '').trim()
  if (name.length < 3 || name.length > 80) fail('invalid_distributor_title')
  if (typeof artistAddress !== 'string' ||
      (artistAddress !== '' && !/^erd1[a-z0-9]{58}$/.test(artistAddress))) fail('invalid_artist_address')
  const blockers = ['contract_unverified_and_not_deployed', 'collection_owner_not_verified', 'randomness_and_refund_protocol_not_audited', 'wallet_signature_required']
  if (rightsConfirmed !== true) blockers.push('artwork_rights_declaration_missing')
  let total
  let stock = []
  if (mode === 'escrow_inventory') {
    if (!Array.isArray(metadataUris) || metadataUris.length) fail('escrow_does_not_accept_lazy_metadata')
    stock = normalizeNftInventory(collection, inventory)
    total = stock.length
    blockers.push('inventory_custody_not_verified')
  } else {
    if (!Array.isArray(inventory) || inventory.length) fail('lazy_mint_does_not_accept_preminted_inventory')
    if (!Number.isSafeInteger(plannedSupply) || plannedSupply < 1 || plannedSupply > MAX_SUPPLY)
      fail('invalid_planned_supply')
    if (!Array.isArray(metadataUris) || metadataUris.length > plannedSupply)
      fail('invalid_metadata_manifest')
    if (metadataUris.some(uri => typeof uri !== 'string' || !/^ipfs:\/\/(?:bafy[a-z2-7]{20,}|Qm[1-9A-HJ-NP-Za-km-z]{44})(?:\/[A-Za-z0-9._-]{1,140})?$/.test(uri)))
      fail('invalid_ipfs_metadata_uri')
    if (new Set(metadataUris).size !== metadataUris.length) fail('duplicate_metadata_uri')
    total = plannedSupply
    blockers.push('nft_create_role_not_verified')
    if (metadataUris.length !== plannedSupply) blockers.push('metadata_supply_not_complete_or_pinned')
  }
  return Object.freeze({
    schemaVersion: 1,
    title: name,
    artistAddress: artistAddress || null,
    collectionId: collection,
    mode,
    currency: 'EGLD',
    fixedPriceEgld,
    fixedPriceWei: priceWei,
    supplyCap: total,
    perWalletLimit,
    nftInventory: Object.freeze([...stock]),
    metadataUris: Object.freeze([...(mode === 'lazy_mint' ? metadataUris : [])]),
    rightsDeclared: rightsConfirmed === true,
    kind: 'creator_artwork_not_genesis_pack',
    status: 'PAPER_PREVIEW_ONLY',
    deployment: Object.freeze({
      kind: 'dedicated_contract_per_creator',
      contractAddress: null,
      deployed: false,
      codeHashVerified: false,
      creatorWalletSignatureRequired: true,
    }),
    randomnessProofVerified: false,
    paymentEnabled: false,
    mintEnabled: false,
    inventoryDepositsEnabled: false,
    deliveryVerified: false,
    blockers: Object.freeze(blockers),
  })
}

const toHex = data => [...new Uint8Array(data)].map(b => b.toString(16).padStart(2, '0')).join('')

/**
 * Deterministic NON-PAYABLE simulation. Caller controls seed, so this MUST NOT
 * be treated as safe purchasable randomness or as an on-chain receipt.
 */
export async function simulatePaperDraw({ collectionId, inventory, soldIds = [], seed, drawNumber = 0 } = {}) {
  const collection = normalizeCollectionId(collectionId)
  const stock = normalizeNftInventory(collection, inventory)
  if (!Array.isArray(soldIds)) fail('invalid_sold_inventory')
  const sold = new Set(soldIds)
  if (sold.size !== soldIds.length || soldIds.some(id => !stock.includes(id)))
    fail('invalid_sold_inventory')
  const available = stock.filter(id => !sold.has(id))
  if (available.length === 0) fail('inventory_exhausted')
  if (typeof seed !== 'string' || seed.length < 8 || seed.length > 128 ||
      !/^[\x20-\x7e]+$/.test(seed)) fail('invalid_paper_seed')
  if (!Number.isSafeInteger(drawNumber) || drawNumber < 0 || drawNumber > 1000000000)
    fail('invalid_draw_number')
  const subtle = globalThis.crypto?.subtle
  if (!subtle) fail('secure_digest_unavailable')
  const n = BigInt(available.length)
  const max = 1n << 256n
  const unbiased = max - max % n
  let choice
  let digest
  for (let counter = 0; counter < 32; counter++) {
    const canonical = 'xartists-paper-draw-v1\n' + collection + '\n' +
      stock.join(',') + '\n' + [...sold].sort().join(',') + '\n' +
      seed + '\n' + drawNumber + '\n' + counter
    digest = toHex(await subtle.digest('SHA-256', new TextEncoder().encode(canonical)))
    const value = BigInt('0x' + digest)
    if (value < unbiased) { choice = Number(value % n); break }
  }
  if (choice === undefined) fail('paper_draw_unavailable')
  return {
    paperOnly: true,
    onChainRandomnessVerified: false,
    selectedNftId: available[choice],
    drawDigest: digest,
    itemsRemainingAfter: available.length - 1,
    currency: null,
    paymentExecuted: false,
    nftTransferred: false,
    disclaimer: 'Simulated user-seeded choice. Not proof of fair paid randomness or NFT custody.',
  }
}
