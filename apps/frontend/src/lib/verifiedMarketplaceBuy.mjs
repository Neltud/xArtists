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
