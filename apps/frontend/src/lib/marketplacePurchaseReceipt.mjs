/**
 * Read-only receipt verifier for one explicitly approved Marketplace mainnet sale.
 * Never signs, sends, stores keys or equates a wallet prompt with settlement.
 */
import {VERIFIED_MARKET_SALE,addressHex,listingIdHex,listingIdsFromEvents,readVerifiedListing} from './verifiedMarketplaceBuy.mjs'

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

/** Verify this exact purchase and its actual NFT transfer, not just a wallet balance. */
export async function verifyLiveListingReceipt({hash,address,quote,request=fetch}={}){
 if(typeof hash!=='string'||!TX_HASH.test(hash)||!addressHex(address)||
    !quote||quote.receiver!==VERIFIED_MARKET_SALE.marketplace||
    !Number.isSafeInteger(quote.listingId)||quote.listingId<1||
    typeof quote.identifier!=='string'||!/^([A-Za-z0-9]{3,20}-[a-f0-9]{6})-[a-f0-9]{2,16}$/.test(quote.identifier)||
    !/^[1-9][0-9]*$/.test(quote.priceAtomic))return {status:'invalid'}
 const normalized=hash.toLowerCase(),raw='buyNft@'+listingIdHex(quote.listingId)
 const tx=await getJson(request,API+'/transactions/'+normalized+'?withResults=true&withOperations=true')
 if(!tx)return {status:'unavailable',hash:normalized}
 if(tx.status!=='success')return {status:['fail','failed','invalid','rejected'].includes(tx.status)?'failed':'pending',hash:normalized}
 if(tx.txHash!==normalized||tx.sender!==address||tx.receiver!==quote.receiver||String(tx.value)!==quote.priceAtomic||
    (tx.data!==raw&&tx.data!==btoa(raw))||(tx.chainID!==undefined&&String(tx.chainID)!=='1'))
   return {status:'mismatch',hash:normalized}
 const delivered=Array.isArray(tx.operations)&&tx.operations.some(op=>op?.type==='nft'&&op.action==='transfer'&&
   op.sender===quote.receiver&&op.receiver===address&&op.identifier===quote.identifier&&String(op.value)==='1')
 if(!delivered)return {status:'delivery_unverified',hash:normalized}
 const nft=await getJson(request,API+'/accounts/'+encodeURIComponent(address)+'/nfts/'+encodeURIComponent(quote.identifier))
 if(!nft||nft.identifier!==quote.identifier||!/^[1-9][0-9]*$/.test(String(nft.balance)))return {status:'delivery_unverified',hash:normalized}
 return {status:'verified',hash:normalized}
}

/** A successful deposit alone is not proof of an active public listing. */
export async function verifySellerListingReceipt({hash,address,identifier,priceAtomic,request=fetch}={}){
 const seller=addressHex(address)
 if(typeof hash!=='string'||!TX_HASH.test(hash)||!seller||
    typeof identifier!=='string'||!/^([A-Za-z0-9]{3,20}-[a-f0-9]{6})-[a-f0-9]{2,16}$/.test(identifier)||
    typeof priceAtomic!=='string'||! /^[1-9][0-9]*$/.test(priceAtomic))return {status:'invalid'}
 const normalized=hash.toLowerCase(),tx=await getJson(request,API+'/transactions/'+normalized+'?withLogs=true&withResults=true')
 if(!tx)return {status:'unavailable',hash:normalized}
 if(tx.status!=='success')return {status:['fail','failed','invalid','rejected'].includes(tx.status)?'failed':'pending',hash:normalized}
 const action=tx.action?.arguments
 if(tx.txHash!==normalized||tx.sender!==address||tx.receiver!==address||String(tx.value)!=='0'||
    tx.function!=='listNft'||action?.receiver!==VERIFIED_MARKET_SALE.marketplace||
    action.functionName!=='listNft'||!Array.isArray(action.transfers)||action.transfers.length!==1||
    action.transfers[0]?.identifier!==identifier||String(action.transfers[0]?.value)!=='1')
   return {status:'mismatch',hash:normalized}
 const ids=listingIdsFromEvents([tx])
 if(ids.length!==1)return {status:'delivery_unverified',hash:normalized}
 try{
   const quote=await readVerifiedListing(ids[0],{request})
   if(quote.identifier!==identifier||quote.sellerHex!==seller||quote.priceAtomic!==priceAtomic)
     return {status:'mismatch',hash:normalized}
   return {status:'verified',hash:normalized,listingId:ids[0]}
 }catch{return {status:'delivery_unverified',hash:normalized}}
}
