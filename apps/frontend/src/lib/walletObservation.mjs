/**
 * An erd1 address from URL or localStorage is a public observation, NEVER a
 * signing session. Only a fresh wallet-provider handshake can confer signing
 * eligibility. Safe for both browser and offline Node regression tests.
 */
const ADDRESS=/^erd1[a-z0-9]{58}$/i
const SAVED_METHODS=new Set(['paste_readonly','web_wallet','defi_wallet','wallet_connect'])
export function readonlyWalletObservation(address, protocolWallet) {
  if(typeof address!=='string'||typeof protocolWallet!=='string')return null
  const value=address.trim().toLowerCase()
  if(!ADDRESS.test(value)||value===protocolWallet.toLowerCase())return null
  return Object.freeze({connected:true,address:value,method:'paste_readonly',sessionLive:false})
}
export function restoreWalletObservation(raw,protocolWallet) {
  if(typeof raw!=='string'||raw.length>2048)return null
  try{
    const obj=JSON.parse(raw)
    if(!obj||typeof obj!=='object'||!SAVED_METHODS.has(obj.method))return null
    return readonlyWalletObservation(obj.address,protocolWallet)
  }catch{return null}
}
/** An unsigned redirect/address hint is categorically not signer evidence. */
export function walletSignEligibility({connected,address,method,sessionLive,pairedAddress}={}) {
  if(connected!==true||typeof address!=='string'||!ADDRESS.test(address))return false
  if(method==='xportal')return sessionLive===true&&typeof pairedAddress==='string'&&
    pairedAddress.toLowerCase()===address.toLowerCase()
  // Extension is eligible only when connected in the current runtime through
  // the extension provider; restored storage always becomes paste_readonly.
  return method==='defi_wallet'&&sessionLive===true
}
