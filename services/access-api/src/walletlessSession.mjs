/**
 * Verified Neon identity -> opaque xArtists account UUID.
 * This does not issue a wallet JWT, subscription entitlement, NFT or payment.
 * Caller must supply the server-controlled token verifier/account repository.
 */
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i
const deny=(status,error)=>Object.freeze({status,body:{ok:false,error}})

export function createWalletlessSessionService({
  enabled=false, originAllowed=()=>false, resolveVerifiedAccount,
}={}){
  return Object.freeze({
    async exchange({authorization,origin,contentLength,transferEncoding}={}){
      if(enabled!==true) return deny(503,'account_session_not_enabled')
      if(origin && (typeof origin!=='string'||!originAllowed(origin)))
        return deny(403,'origin_not_allowed')
      // No body, GET-side effects, session cookies or unsafe browser metadata.
      if(transferEncoding || (contentLength!==undefined && contentLength!=='0'))
        return deny(400,'body_not_supported')
      if(typeof authorization!=='string'||authorization.length>8300||
         !authorization.startsWith('Bearer '))
        return deny(401,'neon_token_required')
      const token=authorization.slice(7)
      if(token.length<64||token.length>8192||/\s/.test(token))
        return deny(401,'neon_token_required')
      if(typeof resolveVerifiedAccount!=='function')
        return deny(503,'account_store_unavailable')
      let account
      try{
        // This callback MUST verify Ed25519 Neon JWT + confirmed email before
        // creating/finding the account in the transactionally protected DB.
        account=await resolveVerifiedAccount(token)
      }catch(error){
        if(error?.message==='neon_auth_identity_unverified')
          return deny(401,'identity_not_verified')
        if(error?.message==='identity_account_disabled')
          return deny(403,'account_disabled')
        return deny(503,'account_store_unavailable')
      }
      const id=account?.user_id
      if(typeof id!=='string'||!UUID.test(id))
        return deny(503,'invalid_account_mapping')
      return Object.freeze({
        status:200,
        body:{
          ok:true,
          account:{id,type:'email_verified',created:account.created===true},
          walletLink:'not_checked',
          subscriptionAccess:'not_checked',
          nftEntitlement:false,
          checkoutAuthorized:false,
        },
      })
    },
  })
}
