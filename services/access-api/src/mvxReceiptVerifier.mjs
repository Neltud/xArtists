/**
 * P0 S2 preparation — read-only MultiversX MAINNET NFT/SFT transfer attestation.
 *
 * No order updates, PayBox callbacks, wallet signing, GitHub dispatch or mint.
 * Only a successful chain tx, matching ESDTNFTTransfer event (collection,
 * nonce, quantity, issuer and buyer), plus buyer's current NFT balance qualify.
 *
 * IMPORTANT: This is a verifier building block, NOT a payment-to-mint GO.
 * Order->PSP->tx anti-replay, finality policy and operator approval still apply.
 */
const GATEWAY = 'https://gateway.multiversx.com'
const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'
const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]
const HASH_RE = /^[a-f0-9]{64}$/i
const COLLECTION_RE = /^[A-Z0-9]{3,20}-[0-9a-f]{6}$/i

function polymod(values) {
  let chk = 1
  for (const value of values) {
    const top = chk >>> 25
    chk = ((chk & 0x1ffffff) << 5) ^ value
    for (let i = 0; i < 5; i++) if ((top >>> i) & 1) chk ^= GEN[i]
  }
  return chk >>> 0
}

/** Strict Bech32 (erd HRP, checksum and zero-padding) → 32 address bytes. */
export function decodeErdAddress(address) {
  if (typeof address !== 'string' || !/^erd1[a-z0-9]{58}$/.test(address)) return null
  const raw = address.slice(4)
  const data = [...raw].map(ch => CHARSET.indexOf(ch))
  if (data.includes(-1)) return null
  const hrp = [...'erd'].map(ch => ch.charCodeAt(0))
  const expanded = [...hrp.map(c => c >>> 5), 0, ...hrp.map(c => c & 31)]
  if (polymod([...expanded, ...data]) !== 1) return null
  const bytes = []
  let acc = 0, bits = 0
  for (const value of data.slice(0, -6)) {
    acc = (acc << 5) | value
    bits += 5
    if (bits >= 8) {
      bits -= 8
      bytes.push((acc >>> bits) & 255)
    }
  }
  if (bits >= 5 || (acc & ((1 << bits) - 1)) !== 0 || bytes.length !== 32) return null
  return Buffer.from(bytes)
}

function positiveUint(value) {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) return BigInt(value)
  if (typeof value === 'string' && /^[1-9][0-9]*$/.test(value)) return BigInt(value)
  return null
}

function encodedUint(bytes) {
  if (!bytes || bytes.length === 0) return 0n
  return BigInt('0x' + bytes.toString('hex'))
}

function strictB64(s) {
  if (typeof s !== 'string' || !s.length || !/^[A-Za-z0-9+/]+={0,2}$/.test(s)) return null
  const bytes = Buffer.from(s, 'base64')
  return bytes.toString('base64') === s ? bytes : null
}

/** Validate one unambiguous transfer event and exact buyer recipient bytes. */
export function matchingTransferEvent(transaction, { buyerBytes, issuer, collection, nonce, amount }) {
  const events = transaction?.logs?.events
  if (!Array.isArray(events)) return false
  let matches = 0
  for (const event of events) {
    if (event?.identifier !== 'ESDTNFTTransfer' ||
        event?.address !== issuer || !Array.isArray(event?.topics) ||
        event.topics.length !== 4) continue
    const [token, rawNonce, rawAmount, rawBuyer] = event.topics.map(strictB64)
    if (!token || !rawNonce || !rawAmount || !rawBuyer || rawBuyer.length !== 32) continue
    if (token.toString('utf8') !== collection) continue
    if (encodedUint(rawNonce) !== nonce || encodedUint(rawAmount) !== amount) continue
    if (!rawBuyer.equals(buyerBytes)) continue
    matches++
  }
  // A repeated matching event needs manual reconciliation, not double delivery.
  return matches === 1
}

async function getJsonReadOnly(path, fetchImpl) {
  const response = await fetchImpl(GATEWAY + path, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!response?.ok || response.status !== 200) throw Error('gateway_unavailable')
  return response.json()
}

/**
 * A read-only *candidate* S2 chain proof. The issuer and collection MUST come
 * from reviewed operator configuration, not an untrusted buyer request.
 * This method never mutates orders, mint jobs or delivery_verified.
 */
export async function verifyMainnetNftReceipt(
  { txHash, buyer, issuer, collection, nonce, amount = 1 },
  fetchImpl = fetch,
) {
  if (typeof txHash !== 'string' || !HASH_RE.test(txHash) ||
      typeof collection !== 'string' || !COLLECTION_RE.test(collection)) {
    return { verified: false, reason: 'invalid_hash_or_collection' }
  }
  const buyerBytes = decodeErdAddress(buyer)
  if (!buyerBytes || !decodeErdAddress(issuer) || buyer === issuer) {
    return { verified: false, reason: 'invalid_buyer_or_issuer' }
  }
  const targetNonce = positiveUint(nonce)
  const targetAmount = positiveUint(amount)
  if (!targetNonce || !targetAmount) return { verified: false, reason: 'invalid_nonce_or_amount' }

  try {
    const txDoc = await getJsonReadOnly('/transaction/' + txHash + '?withResults=true', fetchImpl)
    const transaction = txDoc?.data?.transaction
    if (txDoc?.code !== 'successful' || !transaction ||
        !['executed', 'success'].includes(transaction.status)) {
      return { verified: false, reason: 'transaction_not_executed' }
    }
    if (transaction.hash && String(transaction.hash).toLowerCase() !== txHash.toLowerCase()) {
      return { verified: false, reason: 'transaction_hash_mismatch' }
    }

    const processDoc = await getJsonReadOnly('/transaction/' + txHash + '/process-status', fetchImpl)
    if (processDoc?.code !== 'successful' || processDoc?.data?.status !== 'success') {
      return { verified: false, reason: 'transaction_not_successful' }
    }
    if (!matchingTransferEvent(transaction, {
      buyerBytes, issuer, collection, nonce: targetNonce, amount: targetAmount,
    })) {
      return { verified: false, reason: 'transfer_event_missing_or_ambiguous' }
    }

    const ownership = await getJsonReadOnly(
      '/address/' + buyer + '/nft/' + collection + '/nonce/' + targetNonce.toString(),
      fetchImpl,
    )
    const asset = ownership?.data?.tokenData
    if (ownership?.code !== 'successful' || !asset ||
        asset.tokenIdentifier !== collection ||
        String(asset.nonce) !== targetNonce.toString() ||
        !/^[0-9]+$/.test(String(asset.balance ?? '')) ||
        BigInt(asset.balance) < targetAmount) {
      return { verified: false, reason: 'buyer_nft_balance_not_verified' }
    }

    return {
      verified: true,
      source: 'multiversx-mainnet-gateway-read-only',
      chain_tx_hash: txHash.toLowerCase(),
      nft_collection: collection,
      nft_nonce: targetNonce.toString(),
      buyer,
      issuer,
    }
  } catch {
    // No remote errors, token balances or account details leave the verifier.
    return { verified: false, reason: 'mainnet_gateway_unavailable_or_invalid' }
  }
}
