/**
 * Client-only collection ART / metadata generator plan.
 * Seeded trait assignment is a PREVIEW; no AI inference, image, IPFS object,
 * real credit debit, rights verification, sale, NFT or agent authorization.
 * Never pass user/agent-provided actor identity as an authorization credential.
 */
const fail = code => { throw new Error(code) }
const TRAIT_KEY = /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9 _-]{1,39}$/
const CLEAN = /^[\p{L}\p{N} .,:;'!?+()\-_/#&@]{1,180}$/u
const MAX_EDITION = 100
export const ART_TEMPLATES = Object.freeze({
  chromatic: Object.freeze({
    label: 'Chromatic Geometry',
    layers: Object.freeze([
      { name: 'Background', variants: [{ value: 'Midnight', weight: 5 }, { value: 'Iris', weight: 3 }, { value: 'Copper', weight: 1 }] },
      { name: 'Geometry', variants: [{ value: 'Circles', weight: 5 }, { value: 'Triangles', weight: 4 }, { value: 'Orbit', weight: 1 }] },
      { name: 'Accent', variants: [{ value: 'Silver', weight: 4 }, { value: 'Electric', weight: 2 }, { value: 'Gold', weight: 1 }] },
    ]),
  }),
  botanical: Object.freeze({
    label: 'Botanical Dreams',
    layers: Object.freeze([
      { name: 'Atmosphere', variants: [{ value: 'Dawn', weight: 3 }, { value: 'Dusk', weight: 2 }] },
      { name: 'Flora', variants: [{ value: 'Iris Flower', weight: 4 }, { value: 'Fern', weight: 3 }, { value: 'Lotus', weight: 1 }] },
      { name: 'Texture', variants: [{ value: 'Paper', weight: 3 }, { value: 'Oil Paint', weight: 2 }] },
    ]),
  }),
  monochrome: Object.freeze({
    label: 'Monochrome Museum',
    layers: Object.freeze([
      { name: 'Surface', variants: [{ value: 'Graphite', weight: 2 }, { value: 'Chalk', weight: 2 }] },
      { name: 'Gesture', variants: [{ value: 'Contour', weight: 5 }, { value: 'Brushstroke', weight: 3 }] },
      { name: 'Mood', variants: [{ value: 'Quiet', weight: 5 }, { value: 'Bold', weight: 1 }] },
    ]),
  }),
})

function cleanText(input, min, max, code) {
  if (typeof input !== 'string' || input.trim().length < min ||
      input.trim().length > max || /[<>\u0000-\u001f]/u.test(input)) fail(code)
  return input.trim()
}

export function validateArtLayers(layers) {
  if (!Array.isArray(layers) || layers.length < 1 || layers.length > 8) fail('invalid_layer_count')
  const keys = new Set()
  return layers.map(layer => {
    const name = cleanText(layer?.name, 2, 40, 'invalid_layer_name')
    if (!TRAIT_KEY.test(name) || keys.has(name.toLowerCase())) fail('duplicate_or_invalid_layer_name')
    keys.add(name.toLowerCase())
    if (!Array.isArray(layer.variants) || layer.variants.length < 1 ||
        layer.variants.length > 12) fail('invalid_variant_count')
    const variantSet = new Set()
    return {
      name,
      variants: layer.variants.map(variant => {
        const value = cleanText(variant?.value, 1, 64, 'invalid_variant_name')
        if (!CLEAN.test(value) || variantSet.has(value.toLowerCase())) fail('invalid_or_duplicate_variant')
        variantSet.add(value.toLowerCase())
        const weight = variant.weight
        if (!Number.isSafeInteger(weight) || weight < 1 || weight > 1000)
          fail('invalid_variant_weight')
        return { value, weight }
      }),
    }
  })
}

export function validateEditionOverrides(overrides, quantity, layerNames) {
  if (overrides === undefined || overrides === null) return {}
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides))
    fail('invalid_metadata_overrides')
  if (Object.keys(overrides).length > quantity) fail('too_many_metadata_overrides')
  const byIndex = {}
  for (const [index, patch] of Object.entries(overrides)) {
    const serial = Number(index)
    if (!/^[1-9][0-9]*$/.test(index) || !Number.isSafeInteger(serial) ||
        serial < 1 || serial > quantity) fail('metadata_index_out_of_range')
    if (!patch || typeof patch !== 'object' || Array.isArray(patch) ||
        Object.keys(patch).some(k => !['name', 'description', 'extraAttributes'].includes(k)))
      fail('invalid_metadata_patch_fields')
    const clean = {}
    if (Object.hasOwn(patch, 'name'))
      clean.name = cleanText(patch.name, 2, 80, 'invalid_nft_name')
    if (Object.hasOwn(patch, 'description'))
      clean.description = cleanText(patch.description, 1, 600, 'invalid_nft_description')
    if (Object.hasOwn(patch, 'extraAttributes')) {
      const items = patch.extraAttributes
      if (!Array.isArray(items) || items.length > 8) fail('invalid_extra_attributes')
      const keys = new Set(layerNames.map(x => x.toLowerCase()).concat(['edition']))
      clean.extraAttributes = items.map(item => {
        const trait_type = cleanText(item?.trait_type, 2, 40, 'invalid_attribute')
        const value = cleanText(item?.value, 1, 64, 'invalid_attribute')
        if (!TRAIT_KEY.test(trait_type) || !CLEAN.test(value) || keys.has(trait_type.toLowerCase()))
          fail('duplicate_or_reserved_attribute')
        keys.add(trait_type.toLowerCase())
        return { trait_type, value }
      })
    }
    byIndex[index] = clean
  }
  return byIndex
}

const toHex = data => [...new Uint8Array(data)].map(x => x.toString(16).padStart(2, '0')).join('')
async function sha256(str) {
  if (!globalThis.crypto?.subtle) fail('secure_digest_unavailable')
  return toHex(await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)))
}
const pick = (digest, variants) => {
  const total = variants.reduce((a, x) => a + x.weight, 0)
  let pos = Number(BigInt('0x' + digest) % BigInt(total))
  for (const variant of variants) {
    if (pos < variant.weight) return variant.value
    pos -= variant.weight
  }
  fail('invalid_layer_distribution')
}

export async function prepareArtCollection({
  title, description, quantity, seed, mode, template = 'chromatic',
  layers = [], creatorType = 'human_artist', artistAddress = '',
  agentId = '', rightsConfirmed = false, overrides = {},
} = {}) {
  const name = cleanText(title, 3, 80, 'invalid_collection_title')
  const desc = cleanText(description, 5, 600, 'invalid_collection_description')
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > MAX_EDITION)
    fail('invalid_collection_size')
  if (typeof seed !== 'string' || seed.length < 8 || seed.length > 128 ||
      /[^\x20-\x7e]/.test(seed)) fail('invalid_generation_seed')
  if (!['template', 'layers'].includes(mode)) fail('invalid_generator_mode')
  if (!['human_artist', 'ai_agent'].includes(creatorType)) fail('invalid_creator_type')
  if (artistAddress && (typeof artistAddress !== 'string' ||
      !/^erd1[a-z0-9]{58}$/.test(artistAddress))) fail('invalid_creator_wallet')
  if (creatorType === 'ai_agent' &&
      (typeof agentId !== 'string' || !/^[a-zA-Z0-9_.:-]{3,100}$/.test(agentId)))
    fail('invalid_agent_reference')
  if (creatorType === 'human_artist' && agentId) fail('agent_reference_without_agent')
  const preparedLayers = validateArtLayers(mode === 'template' ? ART_TEMPLATES[template]?.layers : layers)
  const edits = validateEditionOverrides(overrides, quantity, preparedLayers.map(x => x.name))
  const canonical = JSON.stringify({
    schemaVersion: 1, title: name, description: desc, quantity, seed, mode,
    template: mode === 'template' ? template : null, layers: preparedLayers,
  })
  const planDigest = await sha256('xartists-metadata-plan-v1\n' + canonical)
  const editions = []
  for (let serial = 1; serial <= quantity; serial++) {
    const attributes = []
    for (let index = 0; index < preparedLayers.length; index++) {
      const layer = preparedLayers[index]
      const digest = await sha256('trait-v1\n' + planDigest + '\n' + serial + '\n' + index)
      attributes.push({ trait_type: layer.name, value: pick(digest, layer.variants) })
    }
    attributes.push({ trait_type: 'Edition', value: String(serial) })
    const patch = edits[serial] || {}
    editions.push({
      edition: serial,
      name: patch.name || name + ' #' + String(serial).padStart(4, '0'),
      description: patch.description || desc,
      image: null,
      animation_url: null,
      attributes: attributes.concat(patch.extraAttributes || []),
      xartists: {
        collection_type: 'creator_artwork',
        generator_schema: 1,
        plan_digest: planDigest,
        media_state: 'not_generated_or_uploaded',
        mint_state: 'not_minted',
        rights_confirmed_by_creator: rightsConfirmed === true,
      },
    })
  }
  return {
    schemaVersion: 1,
    mode,
    template: mode === 'template' ? template : null,
    creatorType, agentId: creatorType === 'ai_agent' ? agentId : null,
    artistAddress: artistAddress || null,
    title: name,
    quantity,
    layers: preparedLayers,
    planDigest,
    editions,
    generationProvider: null,
    aiImagesGenerated: 0,
    imageOutputReady: false,
    artworkRightsVerified: false,
    paymentStatus: 'disabled',
    priceQuote: null,
    paperCreditsPerImage: 3,
    paperCreditsTotal: 3 * quantity,
    paperCreditQuoteVersion: 'paper-1',
    creditsDebited: false,
    moneyCharged: false,
    storageReady: false,
    mintEnabled: false,
    distributorDeployEnabled: false,
    status: 'PAPER_METADATA_DRAFT',
    blockers: [
      ...(rightsConfirmed === true ? [] : ['creator_rights_confirmation_missing']),
      ...(creatorType === 'ai_agent' ? ['signed_agent_mandate_and_wallet_authorization_required'] : ['artist_wallet_signature_required']),
      'ai_generation_provider_not_connected',
      'provider_quote_and_real_credit_ledger_not_ready',
      'images_not_rendered_or_pinned',
      'metadata_and_collection_owner_not_verified',
      'nft_mint_and_distributor_contract_unapproved',
    ],
  }
}
