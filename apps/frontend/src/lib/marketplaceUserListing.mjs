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

export function isOwnedNftListCandidate(nft) {
  if (!nft || typeof nft !== 'object' || typeof nft.identifier !== 'string') return false
  const match = NFT_ID.exec(nft.identifier)
  if (!match || nft.collection !== match[1] || PACKS.has(match[1])) return false
  const nonce = Number.parseInt(match[2], 16)
  if (!Number.isSafeInteger(nonce) || nonce <= 0 || Number(nft.nonce) !== nonce) return false
  if (nft.type !== 'NonFungibleESDT' && nft.type !== 'SemiFungibleESDT') return false
  if (!/^[1-9][0-9]*$/.test(String(nft.balance ?? '')) || BigInt(nft.balance) < 1n) return false
  return Array.isArray(nft.uris) && nft.uris.some(uri =>
    typeof uri === 'string' && uri.length <= 2048 &&
    (/^ipfs:\/\/(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z2-7]{20,})(?:[/?#]|$)/i.test(uri) ||
     /^https:\/\/[^\s/?#]+/i.test(uri)))
}
async function read(request,url,options={}) {
  let response
  try {
    response=await request(url,{...options,cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000)})
  } catch { fail('Lecture MultiversX impossible. Aucune transaction préparée.') }
  if (!response?.ok) fail('API MultiversX indisponible. Réessaie ultérieurement.')
  try { return await response.json() } catch { fail('Réponse MultiversX invalide.') }
}
function integerFromView(value) {
  if (typeof value!=='string' || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) fail('Vue du contrat invalide.')
  const bytes=atob(value)
  if (bytes.length > 2) fail('Vue du contrat invalide.')
  let n=0
  for (const byte of bytes) n=n*256+byte.charCodeAt(0)
  return n
}
async function view(request,fn) {
  const result=await read(request,API+'/query',{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({scAddress:MARKETPLACE_MAINNET,funcName:fn,args:[]})})
  if (result?.returnCode!=='ok' || !Array.isArray(result.returnData) ||
      result.returnData.length!==1) fail('Contrat marketplace non vérifiable.')
  return integerFromView(result.returnData[0])
}
/** An advisory eligibility check, not a token transfer or a settled listing. */
export async function verifyUserNftListPreflight({
  address,identifier,collection,nonce,royaltyBps=500,request=fetch,
}={}) {
  if (typeof address!=='string'||!ACCOUNT.test(address)||
      typeof identifier!=='string'||!NFT_ID.test(identifier)||
      typeof collection!=='string'||!Number.isSafeInteger(nonce)||nonce<=0 ||
      typeof royaltyBps!=='number'||!Number.isInteger(royaltyBps)||
      royaltyBps<0||royaltyBps>750) fail('Paramètres NFT / wallet invalides.')
  const [nft,market,paused,fee]=await Promise.all([
    read(request,API+'/accounts/'+encodeURIComponent(address)+'/nfts/'+encodeURIComponent(identifier)),
    read(request,API+'/accounts/'+MARKETPLACE_MAINNET),
    view(request,'isPaused'),view(request,'getFeeBps'),
  ])
  if (!nft||nft.identifier!==identifier||nft.collection!==collection||
      Number(nft.nonce)!==nonce||!isOwnedNftListCandidate(nft))
    fail('NFT non détenu, média absent ou collection de packs exclue. Listing refusé.')
  if (market?.address!==MARKETPLACE_MAINNET || market?.codeHash!==MARKETPLACE_CODEHASH ||
      market?.isPayable!==true || typeof market.code!=='string'||!market.code)
    fail('Contrat mainnet non validé (codeHash / payable). Listing bloqué.')
  if (paused!==0 || !Number.isInteger(fee)||fee<0||fee>1000||fee+royaltyBps>1000)
    fail('Marketplace pausée ou frais et royalties incompatibles.')
  return Object.freeze({owner:address,identifier,collection,nonce,feeBps:fee,
    royaltyBps,checkedAt:Date.now(),escrowReceiver:MARKETPLACE_MAINNET})
}
