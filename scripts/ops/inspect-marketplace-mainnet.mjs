/**
 * Phase A: read-only MultiversX Marketplace inspection.
 * Never constructs, signs, submits or sends a value transfer.
 * This is evidence for a gated future list -> buy -> NFT receipt test,
 * NOT permission to enable public checkout.
 */
import {readFile} from 'node:fs/promises'
import {fileURLToPath} from 'node:url'

const API='https://api.multiversx.com'
const GATEWAY='https://gateway.multiversx.com'
const BECH32=/^erd1[a-z0-9]{58}$/
const TOKEN=/^[A-Za-z0-9]{3,12}-[a-f0-9]{6}$/i
const HEX=/^[a-f0-9]{2,64}$/i
const KNOWN_EMPTY='erd1qqqqqqqqqqqqqpgqjzn7zjyevwez8n0zfevpvnrwyp2ln879yj7sj8354t'

function fail(code){throw new Error(code)}
function isValidHexArg(arg){return typeof arg==='string' && arg.length%2===0 && HEX.test(arg)}
export function decodeListing(payload,id){
  if(typeof payload!=='string'||payload.length>8192||!/^[A-Za-z0-9+/]*={0,2}$/.test(payload)) return null
  let b;try{b=Buffer.from(payload,'base64')}catch{return null}
  if(b.toString('base64')!==payload||b.length<32+4+1+8+4+1+2+32+1)return null
  let i=0
  const take=n=>{if(!Number.isInteger(n)||n<0||i+n>b.length)fail('truncated_listing');const out=b.subarray(i,i+n);i+=n;return out}
  const number=n=>Number(BigInt('0x'+(take(n).toString('hex')||'0')))
  try{
    const sellerHex=take(32).toString('hex')
    const len=number(4)
    if(len<3||len>32)return null
    const token=take(len).toString('utf8')
    if(!TOKEN.test(token))return null
    const nonce=Number(BigInt('0x'+take(8).toString('hex')))
    if(!Number.isSafeInteger(nonce)||nonce<1)return null
    const priceLen=number(4)
    if(priceLen<1||priceLen>32)return null
    const atomic=BigInt('0x'+take(priceLen).toString('hex'))
    if(atomic<=0n)return null
    const royaltyBps=number(2)
    const royaltyReceiverHex=take(32).toString('hex')
    const activeByte=number(1)
    if(i!==b.length||royaltyBps>1000||(activeByte!==0&&activeByte!==1))return null
    return {id,token,nonce,sellerHex,royaltyReceiverHex,
      priceAtomic:atomic.toString(),royaltyBps,active:activeByte===1}
  }catch{return null}
}
export async function queryView(fetchImpl,address,funcName,args=[]){
  if(!BECH32.test(address)||!/^([a-zA-Z][A-Za-z0-9]{2,40})$/.test(funcName)||!Array.isArray(args)||!args.every(isValidHexArg))fail('invalid_vm_query')
  const res=await fetchImpl(`${GATEWAY}/vm-values/query`,{
    method:'POST',headers:{'content-type':'application/json','accept':'application/json'},
    body:JSON.stringify({scAddress:address,funcName,args}),redirect:'error',signal:AbortSignal.timeout(10000),
  })
  if(!res.ok)fail('vm_http_error')
  const body=await res.json()
  const vm=body?.data?.data
  if(body?.code!=='successful'||vm?.ReturnCode!==0||!Array.isArray(vm?.ReturnData))fail('vm_query_failed')
  if(vm.ReturnData.some(v=>typeof v!=='string'||v.length>8192))fail('vm_data_invalid')
  return vm.ReturnData
}
export async function inspectMarketplace({fetchImpl=fetch,registry,maxListings=8}={}){
  if(!registry||registry.chain_id!=='1')fail('wrong_chain')
  const address=registry.addresses?.nft_marketplace
  const expectedHash=registry.codeHash?.nft_marketplace
  if(!BECH32.test(address||'')||address===KNOWN_EMPTY||typeof expectedHash!=='string'||!expectedHash)fail('untrusted_registry')
  if(!Number.isSafeInteger(maxListings)||maxListings<1||maxListings>30)fail('invalid_query_budget')
  const response=await fetchImpl(`${API}/accounts/${address}`,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000)})
  if(!response.ok)fail('account_read_failed')
  const account=await response.json()
  if(account.address!==address||account.codeHash!==expectedHash||!account.code||account.isPayable!==true)fail('codehash_or_payable_mismatch')
  const pausedData=await queryView(fetchImpl,address,'isPaused')
  const feeData=await queryView(fetchImpl,address,'getFeeBps')
  if(pausedData.length!==1||feeData.length!==1)fail('invalid_status_views')
  const paused=Buffer.from(pausedData[0],'base64')
  const fee=Buffer.from(feeData[0],'base64')
  if(paused.length!==1||(paused[0]!==0&&paused[0]!==1)||fee.length!==2)fail('invalid_status_encoding')
  const feeBps=fee.readUInt16BE(0)
  if(feeBps>1000)fail('unsafe_market_fee')
  const listings=[]
  for(let id=1;id<=maxListings;id++){
    let data
    try{data=await queryView(fetchImpl,address,'getListing',[id.toString(16).padStart(2,'0')])}
    catch{break} // missing storage or unavailable view cannot make a buyable listing
    if(data.length!==1)break
    const item=decodeListing(data[0],id)
    if(!item)break
    listings.push(item)
  }
  return {
    network:'mainnet',chainId:'1',address,codeHash:account.codeHash,codehashMatchesRegistry:true,
    payable:account.isPayable,paused:paused[0]===1,feeBps,
    listings,activeListings:listings.filter(x=>x.active).map(x=>({id:x.id,token:x.token,nonce:x.nonce,priceAtomic:x.priceAtomic})),
    publicPurchaseReleased:false,ownerSignedProofComplete:false,
    note:'Read-only observation; requires a separate owner-signed listing, exact-price wallet buy and independent buyer NFT receipt before any sale claim.'
  }
}
if(process.argv[1]&&process.argv[1]===fileURLToPath(import.meta.url)){
  const registryPath=new URL('../../data/contracts.json',import.meta.url)
  const registry=JSON.parse(await readFile(registryPath,'utf8'))
  try{
    const result=await inspectMarketplace({registry})
    console.log(JSON.stringify(result,null,2))
    if(result.paused||result.activeListings.length===0)process.exitCode=2
  }catch(e){console.error(String(e?.message||e));process.exitCode=1}
}
