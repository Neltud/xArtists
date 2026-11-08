/**
 * Transactional, OFFLINE ONLY MultiversX admin wallet challenge redemption.
 *
 * A valid proof is NOT an authorization to call RWA escrow, send EGLD, issue
 * cookies, connect sessions or broadcast. This function is not an HTTP route.
 *
 * Holding a PostgreSQL FOR UPDATE row lock during SDK signature verification
 * prevents concurrent successful redemptions (including across API replicas).
 * On error, rollback preserves an unconsumed challenge for a later valid proof.
 */
import { verifySdkAdminWalletProof } from './adminAuthWalletVerifier.mjs'

const ACTIONS=new Set([
  'resolveDispute','setAttestor','setPaused','refund','cancelByOwner','transferOwnership',
])
const HEX_NONCE=/^[A-Za-z0-9_-]{8,128}$/
const ADDRESS=/^erd1[a-z0-9]{58}$/

function fail(error) {
  return {ok:false,error,mode:'postgres_wallet_proof_only',authorizesActions:false}
}

/**
 * Pool must come from the trusted server application (not request input).
 * Exactly one pool client with BEGIN/COMMIT/ROLLBACK is used per proof.
 */
export function createAdminProofRedemption(pool,{nowMs=()=>Date.now(),allowlistedAdmins=[]}={}) {
  if(!pool||typeof pool.connect!=='function')throw Error('trusted_postgres_pool_required')
  const allowlist=new Set(Array.isArray(allowlistedAdmins)?allowlistedAdmins:[])
  return {
    mode:'postgres_wallet_proof_only',
    async redeem({nonce,adminBech32,action,signatureHex}={}) {
      if(!HEX_NONCE.test(nonce||'')||!ADDRESS.test(adminBech32||'')||
          !ACTIONS.has(action))return fail('invalid_proof_request')
      if(!allowlist.size||!allowlist.has(adminBech32))return fail('admin_not_allowlisted')
      // Missing/invalid signature must never spend a nonce.
      if(typeof signatureHex!=='string'||!/^[a-f0-9]{128}$/.test(signatureHex))
        return fail('signature_encoding_invalid')
      const now=nowMs()
      if(!Number.isSafeInteger(now)||now<1)return fail('invalid_server_clock')
      let client,started=false,committed=false
      try {
        client=await pool.connect()
        await client.query('BEGIN')
        started=true
        const selected=await client.query(
          `SELECT * FROM admin_auth_challenges_v1
            WHERE nonce=$1 AND admin_bech32=$2 AND action=$3 FOR UPDATE`,
          [nonce,adminBech32,action]
        )
        if(selected.rowCount!==1)return fail('challenge_missing_or_mismatched')
        const row=selected.rows[0]
        // Built from database row only: NEVER verify a user-supplied message.
        const proof=await verifySdkAdminWalletProof({
          challengeRow:row,signatureHex,adminBech32,nowMs:now,
          allowlistedAdmins:[...allowlist],
        })
        if(!proof.ok)return fail(proof.error||'signature_invalid')

        const used=await client.query(
          `UPDATE admin_auth_challenges_v1 SET consumed_at_ms=$4
            WHERE nonce=$1 AND admin_bech32=$2 AND action=$3
              AND consumed_at_ms IS NULL AND expires_at_ms>$4
            RETURNING nonce,admin_bech32,action,consumed_at_ms`,
          [nonce,adminBech32,action,now]
        )
        if(used.rowCount!==1)return fail('challenge_already_consumed')
        await client.query('COMMIT')
        committed=true
        return {
          ok:true,admin:used.rows[0].admin_bech32,action:used.rows[0].action,
          nonce:used.rows[0].nonce,consumedAtMs:Number(used.rows[0].consumed_at_ms),
          mode:'postgres_wallet_proof_only',authorizesActions:false,
        }
      }catch{
        return fail('db_or_protocol_error')
      }finally{
        if(client){
          if(started&&!committed){
            try{await client.query('ROLLBACK')}catch{/* fail closed */}
          }
          client.release()
        }
      }
    }
  }
}
