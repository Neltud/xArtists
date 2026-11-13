/**
 * xArtists email account profile (read-only self). It is NOT a login/signup,
 * token issuer, payment verifier, subscription grant or wallet ownership proof.
 * Only a verified JWT mapped to an existing, active account is accepted.
 */
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i
const JWT=/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/
const deny=(status,error)=>Object.freeze({status,body:{ok:false,error}})

export function createWalletlessAccountProfileService({
  enabled=false,originAllowed=()=>false,lookupVerifiedProfile,
}={}){
  return Object.freeze({
    async read({authorization,origin}={}){
      if(enabled!==true)return deny(503,'account_profile_not_enabled')
      if(origin&&(typeof origin!=='string'||!originAllowed(origin)))
        return deny(403,'origin_not_allowed')
      if(typeof authorization!=='string'||authorization.length>8300||
        !authorization.startsWith('Bearer '))return deny(401,'neon_token_required')
      const jwt=authorization.slice(7)
      if(jwt.length<64||jwt.length>8192||!JWT.test(jwt)||
        typeof lookupVerifiedProfile!=='function')return deny(401,'neon_token_required')
      let profile
      try{
        profile=await lookupVerifiedProfile(jwt)
      }catch(error){
        if(error?.message==='neon_auth_identity_unverified')
          return deny(401,'identity_not_verified')
        if(error?.message==='identity_account_disabled')
          return deny(403,'account_disabled')
        return deny(503,'account_profile_store_unavailable')
      }
      if(profile===null)return deny(404,'account_not_found')
      if(!profile||!UUID.test(profile.user_id||'')||
        !['walletless','wallet_linked'].includes(profile.account_type)||
        !Number.isSafeInteger(profile.wallet_count)||profile.wallet_count<0||
        (profile.wallet_count===0)!==(profile.account_type==='walletless'))
        return deny(503,'account_profile_store_unavailable')
      return Object.freeze({status:200,body:{
        ok:true,
        account:{id:profile.user_id,type:profile.account_type,
          linkedWalletCount:profile.wallet_count},
        walletOwnership:'not_reverified',
        subscriptionAccess:'not_checked',
        xorusPrivateAccess:'not_checked',
        nftEntitlement:false,
        checkoutAuthorized:false,
        mintAuthorized:false,
      }})
    },
  })
}
