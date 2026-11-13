/**
 * Browser-only Neon OTP bridge. No token persistence, provider secrets, wallets,
 * NFT claims or payment requests. Server-side Neon signature verification remains
 * mandatory. Calling code must check the server's walletless capability first.
 */
const emailRe=/^[^\s@]{1,64}@[^\s@]{1,185}\.[^\s@]{2,32}$/
const jwtRe=/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/
export const PUBLIC_ACCESS_API='https://xartists-access-api.onrender.com'

export function verifiedNeonAuthBase(input){
  if(typeof input!=='string'||!input||input.length>600)return null
  try {
    const u=new URL(input)
    if(u.protocol!=='https:'||u.username||u.password||u.port||u.search||u.hash||
       !u.hostname.endsWith('.neon.tech')||!u.hostname.includes('.neonauth.')||
       !/^\/[A-Za-z0-9_-]+\/auth\/?$/.test(u.pathname))return null
    return u.href.replace(/\/$/,'')
  }catch{return null}
}
export function verifiedXartistsApiBase(input){
  if(typeof input!=='string'||input.length>512)return null
  try{
    const u=new URL(input)
    if(u.protocol!=='https:'||u.username||u.password||u.port||u.search||u.hash||
       !['xartists-access-api.onrender.com','api.xartists.art'].includes(u.hostname)||
       !['','/'].includes(u.pathname))return null
    return u.origin
  }catch{return null}
}
const validatedEmail=email=>typeof email==='string'&&email.length<=254&&emailRe.test(email)
const validatedOtp=code=>typeof code==='string'&&/^\d{4,10}$/.test(code)
const fail=code=>{throw new Error(code)}
const checkConfig=(auth,api)=>{
  const neon=verifiedNeonAuthBase(auth),access=verifiedXartistsApiBase(api)
  if(!neon||!access)fail('account_login_not_configured')
  return {neon,access}
}
const isJwt=jwt=>typeof jwt==='string'&&jwt.length>=64&&jwt.length<=8192&&jwtRe.test(jwt)

export async function requestWalletlessOtp({email,authBase,apiBase=PUBLIC_ACCESS_API,fetchImpl=fetch}){
  const {neon}=checkConfig(authBase,apiBase)
  if(!validatedEmail(email))fail('invalid_email')
  if(typeof fetchImpl!=='function')fail('invalid_fetch')
  let response
  try{
    response=await fetchImpl(neon+'/email-otp/send-verification-otp',{
      method:'POST',mode:'cors',cache:'no-store',redirect:'error',credentials:'include',
      headers:{'Content-Type':'application/json',Accept:'application/json'},
      body:JSON.stringify({email,type:'sign-in'}),signal:AbortSignal.timeout(10000),
    })
  }catch{fail('otp_provider_unavailable')}
  if(!response?.ok)fail('otp_request_not_accepted')
  return {accepted:true}
}

/**
 * Complete Neon OTP -> short-lived signed JWT -> xArtists account session +
 * self profile. The raw JWT is never returned, stored or embedded in a URL.
 */
export async function completeWalletlessOtp({email,otp,authBase,apiBase=PUBLIC_ACCESS_API,fetchImpl=fetch}){
  const {neon,access}=checkConfig(authBase,apiBase)
  if(!validatedEmail(email)||!validatedOtp(otp))fail('invalid_otp_request')
  if(typeof fetchImpl!=='function')fail('invalid_fetch')
  try{
    const signin=await fetchImpl(neon+'/sign-in/email-otp',{
      method:'POST',mode:'cors',cache:'no-store',redirect:'error',credentials:'include',
      headers:{'Content-Type':'application/json',Accept:'application/json'},
      body:JSON.stringify({email,otp}),signal:AbortSignal.timeout(10000),
    })
    if(!signin?.ok)fail('otp_not_verified')
    const current=await fetchImpl(neon+'/get-session',{
      method:'GET',mode:'cors',cache:'no-store',redirect:'error',credentials:'include',
      headers:{Accept:'application/json'},signal:AbortSignal.timeout(10000),
    })
    if(!current?.ok)fail('verified_session_unavailable')
    // Neon documentation: session.token or the set-auth-jwt response header.
    // Never use an opaque browser session cookie as a Bearer JWT.
    const raw=await current.json()
    const hdr=current.headers?.get('set-auth-jwt')
    const jwt=[hdr,raw?.session?.token,raw?.session?.access_token,raw?.data?.session?.token]
      .find(isJwt)
    if(!jwt)fail('verified_session_unavailable')
    const exchange=await fetchImpl(access+'/v1/account/session',{
      method:'POST',mode:'cors',cache:'no-store',redirect:'error',credentials:'omit',
      headers:{Accept:'application/json',Authorization:'Bearer '+jwt},
      signal:AbortSignal.timeout(10000),
    })
    if(!exchange?.ok)fail('account_bridge_unavailable')
    const returned=await exchange.json()
    if(returned?.ok!==true||!returned?.account?.id||
       returned?.checkoutAuthorized!==false||returned?.nftEntitlement!==false)
      fail('account_bridge_unavailable')
    const me=await fetchImpl(access+'/v1/account/me',{
      method:'GET',mode:'cors',cache:'no-store',redirect:'error',credentials:'omit',
      headers:{Accept:'application/json',Authorization:'Bearer '+jwt},
      signal:AbortSignal.timeout(10000),
    })
    if(!me?.ok)fail('account_profile_unavailable')
    const profile=await me.json()
    if(profile?.ok!==true||profile.account?.id!==returned.account.id||
       !['walletless','wallet_linked'].includes(profile.account?.type)||
       !Number.isSafeInteger(profile.account?.linkedWalletCount)||
       profile.account.linkedWalletCount<0||
       profile.checkoutAuthorized!==false||profile.mintAuthorized!==false||
       profile.nftEntitlement!==false||
       profile.subscriptionAccess!=='not_checked'||
       profile.xorusPrivateAccess!=='not_checked')
      fail('account_profile_unavailable')
    return Object.freeze({
      id:profile.account.id,type:profile.account.type,
      linkedWalletCount:profile.account.linkedWalletCount,
      subscriptionAccess:'not_checked',xorusPrivateAccess:'not_checked',
    })
  }catch(e){
    if(e instanceof Error&&/^(otp_not_verified|verified_session_unavailable|account_bridge_unavailable|account_profile_unavailable)$/.test(e.message))
      throw e
    fail('account_provider_unavailable')
  }
}
