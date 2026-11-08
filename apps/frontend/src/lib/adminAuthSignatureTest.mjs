/** Offline Ed25519 signature primitive for TEST PUBLIC KEYS ONLY.
 * Does not decode/bind MultiversX addresses, validate sessions or authorize actions.
 */
import {createPublicKey, verify} from 'node:crypto'
import {parseAndValidateAdminAuthMessage} from './adminAuthMessage.mjs'

export function verifyAdminAuthTestSignature({message, signature, publicKeyDer, expectedAdminBech32, nowMs} = {}) {
  const parsed = parseAndValidateAdminAuthMessage(message, {expectedAdminBech32, nowMs})
  if (!parsed.ok) return {ok:false,error:parsed.error}
  if (!Buffer.isBuffer(signature) || signature.length !== 64 ||
      !Buffer.isBuffer(publicKeyDer) || publicKeyDer.length > 256) {
    return {ok:false,error:'bad_test_key_or_signature'}
  }
  try {
    const key = createPublicKey({key:publicKeyDer,format:'der',type:'spki'})
    if (key.asymmetricKeyType !== 'ed25519') return {ok:false,error:'not_ed25519'}
    if (!verify(null,Buffer.from(message,'utf8'),key,signature)) return {ok:false,error:'invalid_signature'}
    return {ok:true,mode:'offline_test_only',parsed}
  } catch {
    return {ok:false,error:'invalid_test_public_key'}
  }
}
