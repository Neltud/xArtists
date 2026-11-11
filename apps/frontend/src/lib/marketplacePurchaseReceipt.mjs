/**
 * Read-only receipt verifier for one explicitly approved Marketplace mainnet sale.
 * Never signs, sends, stores keys or equates a wallet prompt with settlement.
 */
import {VERIFIED_MARKET_SALE,addressHex} from './verifiedMarketplaceBuy.mjs'

const API='https://api.multiversx.com'
const TX_HASH=/^[a-f0-9]{64}$/i
const RAW_BUY='buyNft@02'
const ENCODED_BUY='YnV5TmZ0QDAy'

async function getJson(request,url) {
  try {
    const r=await request(url,{method:'GET',redirect:'error',cache:'no-store',
      signal:AbortSignal.timeout(10000)})
    if (!r?.ok) return null
    const d=await r.json()
    if(!d||typeof d!=='object'||Array.isArray(d))return null
    return d
  } catch { return null }
}

/**
 * Verified requires a successful buyNft transaction matching sender,
 * contract receiver, amount AND independently observed buyer NFT inventory.
 * Unknown, missing, delayed or malformed results never produce proof.
 */
export async function verifyMarketplacePurchaseReceipt({
  hash,address,request=fetch,
}={}) {
  if(typeof hash!=='string'||!TX_HASH.test(hash)||
      typeof address!=='string'||!addressHex(address))return {status:'invalid'}
  const normalized=hash.toLowerCase()
  const tx=await getJson(request,API+'/transactions/'+normalized+'?withResults=true')
  if(!tx)return {status:'unavailable',hash:normalized}
  const s=String(tx.status||'').toLowerCase()
  if(s!=='success') {
    if(['failed','invalid','rejected'].includes(s))return {status:'failed',hash:normalized}
    return {status:'pending',hash:normalized}
  }
  if(tx.sender!==address||tx.receiver!==VERIFIED_MARKET_SALE.marketplace||
      String(tx.value)!==VERIFIED_MARKET_SALE.maxPriceAtomic||
      (tx.data!==RAW_BUY&&tx.data!==ENCODED_BUY)||
      (tx.chainID!==undefined&&String(tx.chainID)!=='1')) {
    return {status:'mismatch',hash:normalized}
  }
  const nft=await getJson(request,API+'/accounts/'+encodeURIComponent(address)+
    '/nfts/'+VERIFIED_MARKET_SALE.identifier)
  if(!nft||nft.identifier!==VERIFIED_MARKET_SALE.identifier||
      nft.collection!==VERIFIED_MARKET_SALE.token||
      (nft.nonce!==undefined&&Number(nft.nonce)!==VERIFIED_MARKET_SALE.nonce)||
      !/^[1-9]\d*$/.test(String(nft.balance))||
      BigInt(nft.balance)<1n) return {status:'delivery_unverified',hash:normalized}
  return {status:'verified',hash:normalized}
}
