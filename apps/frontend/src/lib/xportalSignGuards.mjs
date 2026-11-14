/**
 * Fail-closed guards for xPortal transaction signing.
 *
 * A nonce cannot be guessed from an unavailable API, and a partial signature
 * result cannot be presented as approval of a multi-transaction batch.
 * Pure functions: no wallet, network, browser or signing side effects.
 */
const ADDRESS=/^erd1[a-z0-9]{58}$/i
const DECIMAL=/^(0|[1-9][0-9]*)$/
const MAINNET='1'
const MAX_BATCH=20

export function parseXPortalAccountNonce(account){
  if(!account||typeof account!=='object'||Array.isArray(account))
    throw new TypeError('xportal_nonce_unavailable')
  const raw=account.nonce
  if(!(typeof raw==='number'||typeof raw==='string')||
    (typeof raw==='string'&&!DECIMAL.test(raw)))
    throw new TypeError('xportal_nonce_unavailable')
  const value=Number(raw)
  if(!Number.isSafeInteger(value)||value<0)
    throw new TypeError('xportal_nonce_unavailable')
  return value
}

export function validateXPortalSignBatch(txs,address,startingNonce){
  if(!ADDRESS.test(address||'')||
    !Array.isArray(txs)||txs.length===0||txs.length>MAX_BATCH||
    !Number.isSafeInteger(startingNonce)||startingNonce<0||
    !Number.isSafeInteger(startingNonce+txs.length-1))
    throw new TypeError('xportal_invalid_sign_batch')
  return txs.map((tx,index)=>{
    if(!tx||typeof tx!=='object'||Array.isArray(tx)||
      typeof tx.receiver!=='string'||!ADDRESS.test(tx.receiver)||
      (tx.sender!==undefined&&(typeof tx.sender!=='string'||
        tx.sender.toLowerCase()!==address.toLowerCase()))||
      (tx.chainID!==undefined&&tx.chainID!==MAINNET)||
      (tx.nonce!==undefined&&tx.nonce!==startingNonce+index)||
      (tx.value!==undefined&&(typeof tx.value!=='string'||!DECIMAL.test(tx.value)))||
      (tx.data!==undefined&&(typeof tx.data!=='string'||tx.data.length>20000)))
      throw new TypeError('xportal_invalid_sign_batch')
    const gas=tx.gasLimit===undefined?12000000:Number(tx.gasLimit)
    if(!Number.isSafeInteger(gas)||gas<=0||
      (typeof tx.gasLimit==='string'&&!DECIMAL.test(tx.gasLimit)))
      throw new TypeError('xportal_invalid_sign_batch')
    return tx
  })
}

export function validateXPortalSignedBatch(signed,expectedCount){
  if(!Number.isSafeInteger(expectedCount)||expectedCount<1||expectedCount>MAX_BATCH||
    !Array.isArray(signed)||signed.length!==expectedCount||
    signed.some(tx=>tx===null||tx===undefined||typeof tx!=='object'))
    throw new TypeError('xportal_partial_signature_batch')
  return signed
}

export function safeXPortalSignError(reason){
  const message=reason instanceof Error?reason.message:''
  if(/reject|denied|declin|refus|cancel/i.test(message))
    return 'Signature refusée dans xPortal. Aucune transaction diffusée.'
  if(/xportal_nonce_unavailable/.test(message))
    return 'Nonce blockchain indisponible : signature bloquée. Vérifie le réseau et réessaie.'
  if(/xportal_invalid_sign_batch/.test(message))
    return 'Transaction invalide, réseau ou nonce incohérent : signature bloquée.'
  if(/xportal_partial_signature_batch/.test(message))
    return 'Le wallet n’a pas signé toutes les transactions : diffusion bloquée.'
  return 'Signature xPortal indisponible. Reconnecte ton wallet et réessaie.'
}
