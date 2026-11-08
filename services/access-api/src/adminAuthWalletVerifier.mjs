/**
 * Isolated MultiversX wallet signature primitive for ADMIN CHALLENGE EVIDENCE.
 * Never issues sessions, JWTs, privileged transactions or on-chain approvals.
 * Caller must separately validate bound authenticated session, atomically
 * consume nonce in Postgres and enforce independently approved admin policy.
 */
import { Address, Message, MessageComputer, UserVerifier } from '@multiversx/sdk-core'
import { buildMessage } from './adminAuthChallengeStore.mjs'

const ADMIN_ACTIONS=new Set([
  'resolveDispute','setAttestor','setPaused','refund','cancelByOwner','transferOwnership',
])
const WINDOW_MS=600_000
const DOMAIN='xArtists.admin.v1'

function deny(error) { return {ok:false,error,mode:'wallet_proof_offline_only'} }
const timestamp=x=>Number.isSafeInteger(x)&&x>0
const isChallenge=row=>row&&typeof row==='object'&&!Array.isArray(row)

/**
 * challengeRow is the EXACT row returned by trusted Postgres, never a browser
 * submitted object. No network/API routes are provided by this module.
 *
 * @returns {Promise<{ok:boolean,error?:string,admin?:string,action?:string,nonce?:string,
 *    mode:string,authorizesActions?:boolean}>}
 */
export async function verifySdkAdminWalletProof({
  challengeRow, signatureHex, adminBech32, nowMs, allowlistedAdmins,
}={}) {
  if(!isChallenge(challengeRow))return deny('challenge_required')
  const row=challengeRow
  if(row.domain!==DOMAIN||String(row.chain_id)!=='1'||
      !ADMIN_ACTIONS.has(row.action)||!(/^[A-Za-z0-9_-]{8,128}$/.test(row.nonce||'')))
    return deny('challenge_fields_invalid')
  if(row.consumed_at_ms!=null)return deny('challenge_already_consumed')
  const issued=Number(row.issued_at_ms),expires=Number(row.expires_at_ms)
  const now=nowMs==null?Date.now():nowMs
  if(!timestamp(issued)||!timestamp(expires)||!timestamp(now)||
    expires-issued<30_000||expires-issued>WINDOW_MS||issued>now||now>=expires)
    return deny('challenge_expired_or_invalid')
  const admin=String(row.admin_bech32||'')
  if(admin!==String(adminBech32||''))return deny('challenge_admin_mismatch')
  if(!Array.isArray(allowlistedAdmins)||!allowlistedAdmins.includes(admin))
    return deny('admin_not_allowlisted')
  if(typeof signatureHex!=='string'||!(/^[a-f0-9]{128}$/.test(signatureHex)))
    return deny('signature_encoding_invalid')
  try {
    const address=Address.fromBech32(admin)
    if(address.toBech32()!==admin)return deny('admin_address_invalid')
    const signature=Buffer.from(signatureHex,'hex')
    const msg=new Message({
      data:new TextEncoder().encode(buildMessage(row)),address,signature
    })
    const computer=new MessageComputer()
    const ok=await UserVerifier.fromAddress(address).verify(
      computer.computeBytesForVerifying(msg), signature
    )
    if(!ok)return deny('wallet_signature_invalid')
    return {
      ok:true,admin,action:row.action,nonce:row.nonce,
      mode:'wallet_proof_offline_only',authorizesActions:false
    }
  } catch {return deny('wallet_signature_invalid')}
}
