/** Offline-only MultiversX Ed25519 public-key address binding.
 * Bech32 encoding here is independently implemented for test vectors.
 * This does NOT implement wallet signing protocols, sessions, or authorization.
 */
import {createPublicKey,verify} from 'node:crypto'
import {parseAndValidateAdminAuthMessage} from './adminAuthMessage.mjs'

const HRP='erd'
const CHARSET='qpzry9x8gf2tvdw0s3jn54khce6mua7l'
function polymod(values) {
  let chk=1
  for (const v of values) {
    const top=chk>>>25
    chk=((chk&0x1ffffff)<<5)^v
    for (let i=0;i<5;i++) if ((top>>>i)&1) chk^=[0x3b6a57b2,0x26508e6d,0x1ea119fa,0x3d4233dd,0x2a1462b3][i]
  }
  return chk>>>0
}
function hrpExpand(hrp) {return [...hrp].map(x=>x.charCodeAt(0)>>>5).concat([0],[...hrp].map(x=>x.charCodeAt(0)&31))}
function convertBits(data,from,to,pad) {
  let acc=0,bits=0
  const ret=[],max=(1<<to)-1
  for(const value of data) {
    if(value<0 || value>>from) return null
    acc=(acc<<from)|value
    bits+=from
    while(bits>=to) {bits-=to;ret.push((acc>>bits)&max)}
  }
  if(pad) {if(bits) ret.push((acc<<(to-bits))&max)}
  else if(bits>=from || ((acc<<(to-bits))&max)) return null
  return ret
}
export function multiversxAddressFromPublicKey(rawKey) {
  if(!Buffer.isBuffer(rawKey) || rawKey.length!==32) throw Error('invalid_public_key')
  const data=convertBits(rawKey,8,5,true)
  const values=hrpExpand(HRP).concat(data,[0,0,0,0,0,0])
  const mod=polymod(values)^1
  const checksum=Array.from({length:6},(_,i)=>(mod>>>(5*(5-i)))&31)
  return HRP+'1'+data.concat(checksum).map(x=>CHARSET[x]).join('')
}
export function publicKeyFromMultiversxAddress(address) {
  if(typeof address!=='string'||address!==address.toLowerCase()||!/^erd1[023456789acdefghjklmnpqrstuvwxyz]{58}$/.test(address)) return null
  const symbols=[...address.slice(4)].map(x=>CHARSET.indexOf(x))
  if(symbols.includes(-1)||polymod(hrpExpand(HRP).concat(symbols))!==1) return null
  const bytes=convertBits(symbols.slice(0,-6),5,8,false)
  return bytes?.length===32?Buffer.from(bytes):null
}
export function verifyBoundAdminSignatureOffline({message,signature,publicKeyRaw,expectedAdminBech32,nowMs}={}) {
  const parsed=parseAndValidateAdminAuthMessage(message,{expectedAdminBech32,nowMs})
  if(!parsed.ok) return {ok:false,error:parsed.error}
  const addressKey=publicKeyFromMultiversxAddress(parsed.admin)
  if(!addressKey || !Buffer.isBuffer(publicKeyRaw)||publicKeyRaw.length!==32 ||
      !addressKey.equals(publicKeyRaw)) return {ok:false,error:'address_key_mismatch'}
  if(!Buffer.isBuffer(signature)||signature.length!==64) return {ok:false,error:'bad_signature'}
  try {
    const der=Buffer.concat([Buffer.from('302a300506032b6570032100','hex'),publicKeyRaw])
    const key=createPublicKey({key:der,format:'der',type:'spki'})
    if(!verify(null,Buffer.from(message,'utf8'),key,signature)) return {ok:false,error:'invalid_signature'}
    return {ok:true,mode:'offline_bound_test_only',parsed}
  } catch {return {ok:false,error:'invalid_signature'}}
}
