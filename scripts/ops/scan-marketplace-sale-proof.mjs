/**
 * Read-only reconciliation for the historical xArtists listing #2.
 * A buyer's verbal confirmation is not a chain receipt.
 */
import {verifyMarketplacePurchaseReceipt} from '../../apps/frontend/src/lib/marketplacePurchaseReceipt.mjs'
import {VERIFIED_MARKET_SALE} from '../../apps/frontend/src/lib/verifiedMarketplaceBuy.mjs'

const API='https://api.multiversx.com'
const HASH=/^[a-f0-9]{64}$/i
const ADDR=/^erd1[a-z0-9]{58}$/
const RAW='buyNft@02'
const B64='YnV5TmZ0QDAy'

export async function scanPilotBuyerReceipt({request=fetch,limit=100}={}) {
  if(!Number.isSafeInteger(limit)||limit<1||limit>100) throw Error('invalid_scan_limit')
  let response
  try {
    response=await request(API+'/accounts/'+VERIFIED_MARKET_SALE.marketplace+
      '/transactions?size='+limit+'&order=desc',
      {cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000)})
  } catch {return {status:'api_unavailable',scanned:0}}
  if(!response?.ok)return {status:'api_unavailable',scanned:0}
  let rows
  try {rows=await response.json()}catch{return {status:'api_invalid',scanned:0}}
  if(!Array.isArray(rows))return {status:'api_invalid',scanned:0}
  let eligible=0
  for(const tx of rows.slice(0,limit)) {
    if(!tx||tx.status!=='success'||tx.receiver!==VERIFIED_MARKET_SALE.marketplace||
       typeof tx.txHash!=='string'||!HASH.test(tx.txHash)||
       typeof tx.sender!=='string'||!ADDR.test(tx.sender)||
       String(tx.value)!==VERIFIED_MARKET_SALE.maxPriceAtomic||
       tx.data!==RAW&&tx.data!==B64)continue
    eligible++
    const result=await verifyMarketplacePurchaseReceipt({hash:tx.txHash,address:tx.sender,request})
    if(result.status==='verified')return {
      status:'verified',txHash:tx.txHash.toLowerCase(),
      nftIdentifier:VERIFIED_MARKET_SALE.identifier,listingId:VERIFIED_MARKET_SALE.listingId,
      scanned:Math.min(rows.length,limit),eligible,
      checkedAt:new Date().toISOString(),
      note:'Successful buyNft, exact payment and NFT currently at buyer address independently checked'
    }
  }
  return {status:'not_verified',scanned:Math.min(rows.length,limit),eligible,
    note:'No matching buyer inventory receipt found. No sale/delivery is claimed.'}
}
if(process.argv[1]&&process.argv[1]===new URL(import.meta.url).pathname){
  const result=await scanPilotBuyerReceipt()
  console.log(JSON.stringify(result))
}
