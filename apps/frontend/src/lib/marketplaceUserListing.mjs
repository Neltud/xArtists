/**
 * Fresh seller/NFT + marketplace contract preflight, BEFORE an ESDTNFTTransfer
 * is handed to the user's wallet. Never treats local portfolio as ownership proof.
 */
export const MARKETPLACE_MAINNET = 'erd1qqqqqqqqqqqqqpgqx0araa285cdepdsfe8s23mer30r3dh9lvhxqq8txmm'
export const MARKETPLACE_CODEHASH = '8TTszCmNyPZXjrzQ/fSKXX8+QzW7wFtCfdmiKsZBgFc='
const API = 'https://api.multiversx.com'
const ACCOUNT = /^erd1[a-z0-9]{58}$/
const NFT_ID = /^([A-Za-z0-9]{3,20}-[a-z0-9]{6})-([a-f0-9]{2,16})$/
const PACKS = new Set(['XAIPLS-2cf72b','XAIYLD-987e24','XAISNT-3d8a6b'])
const fail = reason => { throw new Error(reason) }

/** MultiversX identifiers use a whole number of hex bytes, including leading zero. */
export function nftIdentifier(collection, nonce) {
  if (!Number.isSafeInteger(nonce) || nonce <= 0) fail('Nonce NFT invalide.')
  const hex = nonce.toString(16)
  return collection + '-' + hex.padStart(hex.length + hex.length % 2, '0')
}

/** API URIs are base64; accept decoded URLs too, without fetching any media. */
export function hasNftMediaUri(uris) {
  if (!Array.isArray(uris)) return false
  return uris.some(value => {
    if (typeof value !== 'string' || !value || value.length > 2732) return false
    let uri = value
    if (!/^(?:https|ipfs):\/\//i.test(uri)) {
      if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(uri)) return false
      try { uri = atob(uri) } catch { return false }
    }
    if (uri.length > 2048 || /[\s\x00-\x1f\x7f]/.test(uri)) return false
    if (/^ipfs:\/\/(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z2-7]{20,})(?:[/?#]|$)/.test(uri)) return true
    try {
      const url = new URL(uri)
      return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password
    } catch { return false }
  })
}

// api.multiversx.com exposes percentages, while listNft takes basis points.
function apiRoyaltiesToBps(value) {
  if (typeof value !== 'number' && typeof value !== 'string') return NaN
  const match = /^(0|[1-9][0-9]{0,2})(?:\.([0-9]{1,2}))?$/.exec(String(value))
  if (!match) return NaN
  const bps = Number(match[1]) * 100 + Number((match[2] || '').padEnd(2, '0'))
  return bps <= 10000 ? bps : NaN
}

export function isOwnedNftListCandidate(nft) {
  if (!nft || typeof nft !== 'object' || typeof nft.identifier !== 'string') return false
  const match = NFT_ID.exec(nft.identifier)
  if (!match || nft.collection !== match[1] || PACKS.has(match[1])) return false
  const nonce = Number.parseInt(match[2], 16)
  if (!Number.isSafeInteger(nonce) || nonce <= 0 || Number(nft.nonce) !== nonce) return false
  if (nft.type !== 'NonFungibleESDT' && nft.type !== 'SemiFungibleESDT') return false
  if (!/^[1-9][0-9]*$/.test(String(nft.balance ?? '')) || BigInt(nft.balance) < 1n) return false
  return hasNftMediaUri(nft.uris)
}
async function read(request,url,options={},signal) {
  if(signal?.aborted)fail('Vérification de mise en vente annulée.')
  // AbortController works on older iOS/WebViews without AbortSignal.any/timeout.
  const controller=new AbortController()
  const abort=()=>controller.abort()
  signal?.addEventListener('abort',abort,{once:true})
  const timeout=setTimeout(abort,10000)
  try {
    let response
    try {
      response=await request(url,{...options,cache:'no-store',redirect:'error',signal:controller.signal})
    } catch {
      if(signal?.aborted)fail('Vérification de mise en vente annulée.')
      fail('Lecture MultiversX impossible ou expirée. Aucune transaction préparée.')
    }
    if (!response?.ok) {
      if(response?.status===404&&url.includes('/accounts/')&&url.includes('/nfts/'))
        fail('Ce NFT est introuvable dans le wallet connecté. Vérifie son identifiant et le compte.')
      fail('API MultiversX indisponible. Réessaie ultérieurement.')
    }
    try { return await response.json() } catch { fail('Réponse MultiversX invalide.') }
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort',abort)
  }
}
function integerFromView(value) {
  if (typeof value!=='string' || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) fail('Vue du contrat invalide.')
  const bytes=atob(value)
  if (bytes.length > 2) fail('Vue du contrat invalide.')
  let n=0
  for (const byte of bytes) n=n*256+byte.charCodeAt(0)
  return n
}
async function view(request,fn,signal) {
  const options={method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({scAddress:MARKETPLACE_MAINNET,funcName:fn,args:[]})}
  const decode=vm=>{
    const code=vm?.ReturnCode??vm?.returnCode
    const message=vm?.ReturnMessage??vm?.returnMessage??''
    const data=vm?.ReturnData??vm?.returnData
    if((code!==0&&code!=='ok')||message!==''||!Array.isArray(data)||data.length!==1)
      fail('Contrat marketplace non vérifiable.')
    return integerFromView(data[0])
  }
  try {
    return decode(await read(request,API+'/query',options,signal))
  } catch {
    // Same mainnet read-only VM query, already used by the independent inspector.
    if(signal?.aborted)fail('Vérification de mise en vente annulée.')
    const result=await read(request,'https://gateway.multiversx.com/vm-values/query',options,signal)
    if(result?.code!=='successful')fail('Contrat marketplace non vérifiable.')
    return decode(result?.data?.data)
  }
}
/** An advisory eligibility check, not a token transfer or a settled listing. */
export async function verifyUserNftListPreflight({
  address,identifier,collection,nonce,request=fetch,signal,
}={}) {
  if (typeof address!=='string'||!ACCOUNT.test(address)||
      typeof identifier!=='string'||!NFT_ID.test(identifier)||
      typeof collection!=='string'||!Number.isSafeInteger(nonce)||nonce<=0 ||
      identifier!==nftIdentifier(collection,nonce))
    fail('Paramètres NFT / wallet invalides.')
  const [nft,authoritativeNft,market,paused,fee]=await Promise.all([
    read(request,API+'/accounts/'+encodeURIComponent(address)+'/nfts/'+encodeURIComponent(identifier),{},signal),
    // Independent public metadata, not wallet-supplied royalty fields.
    read(request,API+'/nfts/'+encodeURIComponent(identifier),{},signal),
    read(request,API+'/accounts/'+MARKETPLACE_MAINNET,{},signal),
    view(request,'isPaused',signal),view(request,'getFeeBps',signal),
  ])
  if(signal?.aborted)fail('Vérification de mise en vente annulée.')
  if (!nft||nft.identifier!==identifier||nft.collection!==collection||
      Number(nft.nonce)!==nonce||!isOwnedNftListCandidate(nft))
    fail('NFT non détenu, média absent ou collection de packs exclue. Listing refusé.')
  if (market?.address!==MARKETPLACE_MAINNET || market?.codeHash!==MARKETPLACE_CODEHASH ||
      market?.isPayable!==true || typeof market.code!=='string'||!market.code)
    fail('Contrat mainnet non validé (codeHash / payable). Listing bloqué.')
  // Do not interpret REST percentages as the raw on-chain basis-point value.
  const royaltyBps=apiRoyaltiesToBps(authoritativeNft?.royalties)
  const royaltyReceiver=authoritativeNft?.creator
  if (!authoritativeNft||authoritativeNft.identifier!==identifier||
      authoritativeNft.collection!==collection||
      Number(authoritativeNft.nonce)!==nonce||
      !Number.isSafeInteger(royaltyBps)||royaltyBps<0||royaltyBps>10000||
      typeof royaltyReceiver!=='string'||!ACCOUNT.test(royaltyReceiver))
    fail('Royalties ou identité du créateur non vérifiables sur la chaîne.')
  if (paused!==0) fail('Marketplace en pause. Aucune mise en vente possible.')
  if (!Number.isInteger(fee)||fee<0||fee>1000)
    fail('Frais marketplace non valides. Mise en vente bloquée.')
  if (fee+royaltyBps>1000)
    fail(`Royalties du NFT : ${royaltyBps/100} % + frais marketplace : ${fee/100} % = ${(fee+royaltyBps)/100} %. Le contrat limite le total à 10 %. Choisis un NFT dont les royalties ne dépassent pas ${(1000-fee)/100} %. Aucune transaction préparée.`)
  return Object.freeze({owner:address,identifier,collection,nonce,feeBps:fee,
    royaltyBps,royaltyReceiver,checkedAt:Date.now(),escrowReceiver:MARKETPLACE_MAINNET})
}
