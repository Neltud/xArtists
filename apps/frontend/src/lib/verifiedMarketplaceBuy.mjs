/**
 * Read-only preflight for the only xArtists NFT sale verified in this release.
 * Does not enable global Marketplace checkout, agents, packs, PayBox or LIA.
 */
export const VERIFIED_MARKET_SALE = Object.freeze({
  marketplace: 'erd1qqqqqqqqqqqqqpgqx0araa285cdepdsfe8s23mer30r3dh9lvhxqq8txmm',
  codeHash: '8TTszCmNyPZXjrzQ/fSKXX8+QzW7wFtCfdmiKsZBgFc=',
  listingId: 2, token: 'ASFT-a6273a', nonce: 1, identifier: 'ASFT-a6273a-01',
  maxPriceAtomic: '250000000000000000',
})
const API = 'https://api.multiversx.com'
const VM = 'https://gateway.multiversx.com/vm-values/query'
const fail = () => { throw Error('marketplace_live_listing_unavailable') }
function bytes(value) {
  if (typeof value !== 'string' || value.length > 8192 || value.length % 4 !== 0 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) fail()
  try {
    const raw = atob(value), out = Uint8Array.from(raw, c => c.charCodeAt(0))
    if (btoa(raw) !== value) fail()
    return out
  } catch { fail() }
}
const hex = b => Array.from(b, n => n.toString(16).padStart(2,'0')).join('')
export function decodeMarketplaceListing(data,id) {
  try {
    if (!Number.isSafeInteger(id) || id <= 0) return null
    const b = bytes(data); let i = 0
    const take = n => {
      if (!Number.isSafeInteger(n) || n < 0 || i+n > b.length) fail()
      const part=b.slice(i,i+n); i+=n; return part
    }
    const small = n => take(n).reduce((v,x)=>v*256+x,0)
    const sellerHex=hex(take(32)), len=small(4)
    if (len<3 || len>32) return null
    const token=new TextDecoder('utf-8',{fatal:true}).decode(take(len))
    const nonceBig=take(8).reduce((v,x)=>(v<<8n)+BigInt(x),0n)
    if (nonceBig>BigInt(Number.MAX_SAFE_INTEGER)) return null
    const priceLen=small(4)
    if (priceLen<1 || priceLen>32) return null
    const priceAtomic=take(priceLen).reduce((v,x)=>(v<<8n)+BigInt(x),0n).toString()
    const royaltyBps=small(2); take(32)
    const active=small(1)
    if (i!==b.length || royaltyBps>1000 || active>1 || priceAtomic==='0') return null
    return {id,token,nonce:Number(nonceBig),priceAtomic,royaltyBps,active:active===1,sellerHex}
  } catch { return null }
}
async function readJson(request,url,opts) {
  let r
  try { r=await request(url,{...opts,redirect:'error',cache:'no-store',signal:AbortSignal.timeout(9000)}) }
  catch { fail() }
  if (!r?.ok) fail()
  try { return await r.json() } catch { fail() }
}
async function view(request,funcName,args=[]) {
  const opts={method:'POST',headers:{'content-type':'application/json','accept':'application/json'},
    body:JSON.stringify({scAddress:VERIFIED_MARKET_SALE.marketplace,funcName,args})}
  let vmData
  try {
    const res=await readJson(request,VM,opts), vm=res?.data?.data
    const code=vm?.ReturnCode??vm?.returnCode, message=vm?.ReturnMessage??vm?.returnMessage??''
    const data=vm?.ReturnData??vm?.returnData
    if (res?.code==='successful'&&(code===0||code==='ok')&&message===''&&Array.isArray(data)) vmData=data
  } catch { /* fallback to the equivalent CORS-compatible mainnet API read */ }
  if (!vmData) {
    const res=await readJson(request,API+'/query',opts)
    const code=res?.returnCode??res?.ReturnCode, message=res?.returnMessage??res?.ReturnMessage??''
    if ((code!==0&&code!=='ok')||message!==''||!Array.isArray(res?.returnData)) fail()
    vmData=res.returnData
  }
  if (vmData.some(x=>typeof x!=='string'||x.length>8192)) fail()
  return vmData
}
function smallUint(encoded,limit) {
  const b=bytes(encoded)
  if (b.length>2) fail()
  const n=b.reduce((v,x)=>v*256+x,0)
  if (n>limit) fail()
  return n
}
function verifiedEscrow(nfts) {
  return Array.isArray(nfts) && nfts.some(n=>
    n && n.identifier===VERIFIED_MARKET_SALE.identifier &&
    n.collection===VERIFIED_MARKET_SALE.token &&
    (n.nonce===undefined||Number(n.nonce)===VERIFIED_MARKET_SALE.nonce) &&
    /^[1-9][0-9]*$/.test(String(n.balance)) && BigInt(n.balance)>=1n)
}
/** Reads fresh chain state every call; MUST be re-run on the user's buy click. */
export async function readVerifiedSale({request=fetch}={}) {
  const market=VERIFIED_MARKET_SALE.marketplace
  const account=await readJson(request,API+'/accounts/'+market)
  if (account?.address!==market||account?.codeHash!==VERIFIED_MARKET_SALE.codeHash||
      account?.isPayable!==true||typeof account.code!=='string'||!account.code) fail()
  const [paused,fee,raw,nfts]=await Promise.all([
    view(request,'isPaused'),view(request,'getFeeBps'),view(request,'getListing',['02']),
    readJson(request,API+'/accounts/'+market+'/nfts?size=100'),
  ])
  if (paused.length!==1||smallUint(paused[0],1)!==0||fee.length!==1||raw.length!==1) fail()
  const feeBps=smallUint(fee[0],1000)
  const listing=decodeMarketplaceListing(raw[0],VERIFIED_MARKET_SALE.listingId)
  if (!listing||!listing.active||listing.token!==VERIFIED_MARKET_SALE.token||
      listing.nonce!==VERIFIED_MARKET_SALE.nonce||
      listing.priceAtomic!==VERIFIED_MARKET_SALE.maxPriceAtomic||
      feeBps+listing.royaltyBps>1000||!verifiedEscrow(nfts)) fail()
  return Object.freeze({
    listingId:listing.id,identifier:VERIFIED_MARKET_SALE.identifier,
    priceAtomic:listing.priceAtomic,priceEgld:'0.25',receiver:market,
    sellerHex:listing.sellerHex,royaltyBps:listing.royaltyBps,feeBps,
    checkedAt:Date.now(),
  })
}
/** Only compare authentic wallet addresses; pasted or malformed data is blocked. */
export function addressHex(address) {
  if (typeof address!=='string'||!/^erd1[a-z0-9]{58}$/.test(address)) return null
  const alphabet='qpzry9x8gf2tvdw0s3jn54khce6mua7l'
  const digits=address.slice(4).split('').map(c=>alphabet.indexOf(c))
  if (digits.some(x=>x<0)) return null
  let buffer=0,bits=0; const out=[]
  for (const v of digits.slice(0,-6)) {
    buffer=(buffer<<5)|v;bits+=5
    if(bits>=8){bits-=8;out.push((buffer>>>bits)&255)}
  }
  return out.length===32?hex(out):null
}

/** General art sale read: exact contract, active ID, current escrow, exact atomic price.
 * A listing index or local wallet record never authorizes payment.
 */
export function listingIdHex(id){
 if(!Number.isSafeInteger(id)||id<1)fail()
 const hex=id.toString(16)
 return hex.length%2?'0'+hex:hex
}
const ART_TOKEN=/^[A-Za-z0-9]{3,20}-[a-f0-9]{6}$/
const EXCLUDED=/^(?:XMEX|XAIPLS|XAIYLD|XAISNT)-/i
function quoteFromListing(listing,nfts,feeBps){
 if(!listing?.active||!ART_TOKEN.test(listing.token)||EXCLUDED.test(listing.token)||
    !Number.isSafeInteger(listing.nonce)||listing.nonce<=0||feeBps+listing.royaltyBps>1000)return null
 const identifier=listing.token+'-'+listingIdHex(listing.nonce)
 const nft=nfts.find(n=>n?.identifier===identifier&&n.collection===listing.token&&
   (n.nonce===undefined||Number(n.nonce)===listing.nonce)&&
   /^[1-9][0-9]*$/.test(String(n.balance))&&BigInt(n.balance)>=1n)
 if(!nft)return null
 const amount=BigInt(listing.priceAtomic)
 if(amount<=0n)return null
 const fraction=(amount%1000000000000000000n).toString().padStart(18,'0').replace(/0+$/,'')
 const priceEgld=(amount/1000000000000000000n).toString()+(fraction?'.'+fraction:'')
 return Object.freeze({listingId:listing.id,identifier,priceAtomic:listing.priceAtomic,priceEgld,
   receiver:VERIFIED_MARKET_SALE.marketplace,sellerHex:listing.sellerHex,royaltyBps:listing.royaltyBps,feeBps,checkedAt:Date.now()})
}
async function liveMarketContext(request){
 const market=VERIFIED_MARKET_SALE.marketplace
 const account=await readJson(request,API+'/accounts/'+market)
 if(account?.address!==market||account.codeHash!==VERIFIED_MARKET_SALE.codeHash||account.isPayable!==true||
    typeof account.code!=='string'||!account.code)fail()
 const [paused,fee,nfts]=await Promise.all([view(request,'isPaused'),view(request,'getFeeBps'),
   readJson(request,API+'/accounts/'+market+'/nfts?size=100')])
 if(paused.length!==1||smallUint(paused[0],1)!==0||fee.length!==1||!Array.isArray(nfts))fail()
 return {feeBps:smallUint(fee[0],1000),nfts}
}
export async function readVerifiedListing(id,{request=fetch}={}){
 const arg=listingIdHex(id)
 const context=await liveMarketContext(request)
 const raw=await view(request,'getListing',[arg])
 const quote=raw.length===1?quoteFromListing(decodeMarketplaceListing(raw[0],id),context.nfts,context.feeBps):null
 if(!quote)fail()
 return quote
}
/** Bounded discovery: only query explicit IDs, never guess from NFT order.
 * An empty escrow ends discovery immediately; unscanned IDs remain unknown.
 */
export async function readLiveMarketplaceListings({request=fetch}={}){
 const context=await liveMarketContext(request)
 if(!context.nfts.length)return {listings:[],limited:false}
 const listings=[]
 let limited=false
 for(let id=1;id<=12;id++){
   let raw
   try{raw=await view(request,'getListing',[listingIdHex(id)])}catch{limited=true;break}
   const listing=raw.length===1?decodeMarketplaceListing(raw[0],id):null
   if(!listing){limited=true;break}
   const quote=quoteFromListing(listing,context.nfts,context.feeBps)
   if(quote)listings.push(quote)
   if(id===12)limited=true
 }
 return {listings,limited}
}
