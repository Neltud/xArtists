/**
 * Read-only VM quote for the deployed agents-marketplace getPackPrice endpoint.
 * No transaction, payment, pinning, signer, fee estimation or storage mutation.
 *
 * The marketing catalogue EGLD list is not the chain quote. Never send wallet
 * EGLD from a stale catalogue amount; fail closed on mismatch.
 */
import {egldTextToWei} from './egldExactAmount.mjs'

const RPC='https://gateway.multiversx.com/vm-values/query'
const MAX_ATOMIC=1000n*10n**18n
const ADDRESS=/^erd1[a-z0-9]{58}$/

function decodeBigUintBase64(value){
  if(typeof value!=='string'||!value||value.length>88||
      value.length%4!==0||!/^[A-Za-z0-9+/]+={0,2}$/.test(value))
    throw Error('bad_vm_quote_encoding')
  let bytes
  try{bytes=atob(value)}catch{throw Error('bad_vm_quote_encoding')}
  if(!bytes||bytes.length>32||btoa(bytes)!==value)
    throw Error('bad_vm_quote_encoding')
  let amount=0n
  for(let i=0;i<bytes.length;i++)
    amount=(amount<<8n)+BigInt(bytes.charCodeAt(i))
  if(amount<=0n||amount>MAX_ATOMIC)
    throw Error('vm_quote_out_of_supported_range')
  return amount.toString()
}

export async function getFreshPackPriceAtomic(scAddress,packEnum,request=fetch){
  if(typeof scAddress!=='string'||!ADDRESS.test(scAddress)||
      !Number.isSafeInteger(packEnum)||packEnum<1||packEnum>3)
    throw Error('pack_quote_invalid_request')
  const controller=new AbortController()
  const deadline=setTimeout(()=>controller.abort(),8000)
  try{
    const response=await request(RPC,{
      method:'POST',
      headers:{'Content-Type':'application/json',Accept:'application/json'},
      body:JSON.stringify({
        scAddress,funcName:'getPackPrice',
        args:[packEnum.toString(16).padStart(2,'0')],
      }),
      cache:'no-store',
      redirect:'error',
      signal:controller.signal,
    })
    if(!response?.ok)throw Error('vm_quote_http_error')
    const output=await response.json()
    const result=output?.data?.data
    const returnCode=result?.ReturnCode??result?.returnCode
    const returnMessage=result?.ReturnMessage??result?.returnMessage??''
    const data=result?.ReturnData??result?.returnData
    if(output?.code!=='successful'||
        !(returnCode===0||returnCode==='ok')||
        returnMessage!==''||!Array.isArray(data)||data.length!==1)
      throw Error('vm_quote_not_successful')
    return decodeBigUintBase64(data[0])
  }catch{
    // Never include gateway response bodies or other untrusted text in UI/logs.
    throw Error('pack_onchain_quote_unavailable')
  }finally{
    clearTimeout(deadline)
  }
}

/** Return only the fresh chain quote when it exactly matches a ratified
 * catalogue display price. If not, no wallet transaction may be prepared. */
export function requireExactPackQuoteAgreement(chainAtomic,catalogEgldText){
  const expected=egldTextToWei(catalogEgldText)
  if(typeof chainAtomic!=='string'||!/^[1-9][0-9]*$/.test(chainAtomic)||
      BigInt(chainAtomic)>MAX_ATOMIC||chainAtomic!==expected)
    throw Error('pack_onchain_price_disagrees_with_catalog')
  return chainAtomic
}
