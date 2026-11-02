/**
 * Wallet-owned creator collection and NFT transactions on MultiversX mainnet.
 * NOT the PayBox/Genesis pack mint dispatcher.
 */
import { Address } from '@multiversx/sdk-core'

export const ESDT_SYSTEM_SC = 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u'
export const ISSUE_COST_WEI = '50000000000000000'
const API = 'https://api.multiversx.com'
const COLLECTION_ID = /^[A-Z0-9]{3,10}-[a-f0-9]{6}$/i

const hex = (s: string) => Array.from(new TextEncoder().encode(s))
  .map(byte => byte.toString(16).padStart(2, '0')).join('')
const integerHex = (n: number) => {
  const str = n.toString(16)
  return str.length % 2 ? '0' + str : str
}

export function sanitizeTicker(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0,10)
}
export function isValidTicker(t: string): boolean {
  return /^[A-Z0-9]{3,10}$/.test(t)
}
export function isValidCollectionId(id: string): boolean {
  return COLLECTION_ID.test(id)
}
export function isValidMintMediaUri(value: string): boolean {
  const v = value.trim()
  if (v.length > 500 || v.length < 8 || /[\s<>"']/.test(v)) return false
  if (/^ipfs:\/\/(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z2-7]{20,})(\/[A-Za-z0-9._~/-]+)?$/i.test(v)) return true
  try {
    const u = new URL(v)
    return u.protocol === 'https:' && u.hostname.includes('.') &&
      !/^(localhost|127\.|10\.|0\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(u.hostname)
  } catch { return false }
}

/** setSpecialRole expects raw 32-byte public key hex, never UTF-8 text of erd1… */
export function walletAddressToHex(bech32: string): string {
  const addr = Address.newFromBech32(bech32)
  const raw = addr.getPublicKey()
  if (addr.getHrp() !== 'erd' || raw.length !== 32) throw new Error('Adresse artiste invalide.')
  return Array.from(raw).map(n => Number(n).toString(16).padStart(2,'0')).join('')
}

export function buildIssueNftCollectionTx(opts: {name: string; ticker: string; gasLimit?: number}) {
  const name = opts.name.trim()
  const ticker = opts.ticker.trim().toUpperCase()
  if (name.length < 3 || name.length > 20) throw new Error('Nom collection : 3–20 caractères.')
  if (!isValidTicker(ticker)) throw new Error('Ticker : 3–10 caractères A-Z ou 0-9.')
  return {receiver: ESDT_SYSTEM_SC, value: ISSUE_COST_WEI,
    data: ['issueNonFungible',hex(name),hex(ticker)].join('@'),
    gasLimit:opts.gasLimit ?? 60_000_000,chainID:'1'}
}

export function buildSetNftCreateRoleTx(opts: {
 tokenIdentifier: string; ownerAddress: string; gasLimit?: number
}) {
  if (!isValidCollectionId(opts.tokenIdentifier.trim())) throw new Error('Token ID invalide.')
  return {receiver:ESDT_SYSTEM_SC,value:'0',
    data:['setSpecialRole',hex(opts.tokenIdentifier.trim()),
      walletAddressToHex(opts.ownerAddress),hex('ESDTRoleNFTCreate')].join('@'),
    gasLimit:opts.gasLimit ?? 60_000_000,chainID:'1'}
}

export function buildEsdtNftCreateTx(opts: {
 tokenIdentifier: string;name: string;royaltiesPct: number;
 attributes: string;uris: string[];quantity?: number;gasLimit?: number
}) {
  if (!isValidCollectionId(opts.tokenIdentifier.trim())) throw new Error('Collection NFT invalide.')
  if ((opts.quantity ?? 1) !== 1) throw new Error('Édition NFT : quantité 1 uniquement.')
  const name=opts.name.trim()
  if (!name || name.length>50) throw new Error('Titre NFT requis (50 caractères maximum).')
  if (!Number.isFinite(opts.royaltiesPct)||opts.royaltiesPct<0||opts.royaltiesPct>10)
    throw new Error('Royalties Studio : 0–10 %.')
  const uris=opts.uris.map(x=>x.trim()).filter(Boolean)
  if (uris.length<1 || uris.length>5 || uris.some(u=>!isValidMintMediaUri(u))) {
    throw new Error('URI média publique IPFS ou HTTPS obligatoire. Le fichier local ne suffit pas.')
  }
  const attrs=opts.attributes || 'tags:xartists,studio'
  if (new TextEncoder().encode(attrs).length>512) throw new Error('Métadonnées trop longues.')
  const data=['ESDTNFTCreate',hex(opts.tokenIdentifier.trim()),integerHex(1),hex(name),
    integerHex(Math.round(opts.royaltiesPct*100)),'',hex(attrs),...uris.map(hex)].join('@')
  return {receiver:'__SENDER__',value:'0',data,gasLimit:opts.gasLimit??20_000_000,chainID:'1'}
}

export type ArtistCollectionProof = {
  owner: string; collection: string; hasCreateRole: boolean
}
/** Fail closed if owner, collection type or role cannot be verified on mainnet. */
export async function fetchArtistCollectionProof(id:string, wallet:string):Promise<ArtistCollectionProof> {
  if (!isValidCollectionId(id)) throw new Error('Collection ID invalide.')
  walletAddressToHex(wallet)
  const response=await fetch(API+'/collections/'+encodeURIComponent(id),{cache:'no-store'})
  if (!response.ok) throw new Error('Collection non vérifiable sur MultiversX : HTTP '+response.status)
  const j=await response.json() as {collection?:string;owner?:string;type?:string;
    roles?:Array<{address?:string;roles?:string[]}>}
  if (j.collection?.toLowerCase()!==id.toLowerCase() || j.type!=='NonFungibleESDT')
    throw new Error('La collection NFT demandée ne correspond pas au réseau.')
  return {owner:String(j.owner||''),collection:id,
    hasCreateRole:Array.isArray(j.roles)&&j.roles.some(r=>
      r.address?.toLowerCase()===wallet.toLowerCase() &&
      r.roles?.includes('ESDTRoleNFTCreate')===true)}
}

/** A broadcast or wallet hook redirect is NEVER proof of a minted NFT. */
export async function verifyArtistTransaction(
  hash:string|null, wallet:string, attempts=6
):Promise<'confirmed'|'pending'|'failed'> {
  if (!hash || !/^[a-f0-9]{64}$/i.test(hash)) return 'pending'
  for(let i=0;i<attempts;i++){
    try{
      const response=await fetch(API+'/transactions/'+hash,{cache:'no-store'})
      if(response.ok){
        const j=await response.json() as {sender?:string;status?:string}
        if(j.sender?.toLowerCase()!==wallet.toLowerCase()) return 'failed'
        if(j.status==='success') return 'confirmed'
        if(['fail','failed','invalid'].includes(String(j.status)))return 'failed'
      }
    }catch{/* network uncertainty: do not claim success */}
    if(i<attempts-1)await new Promise(done=>setTimeout(done,1750))
  }
  return 'pending'
}

const STORAGE='xartists_studio_collection'
export type StudioCollectionRecord={
  ticker:string;name:string;walletAddress?:string;
  tokenIdentifier?:string;roleSet?:boolean;at:number
}
export function saveStudioCollection(record:StudioCollectionRecord) {
  try{localStorage.setItem(STORAGE,JSON.stringify(record))}catch{/* no storage */}
}
export function loadStudioCollection(wallet?:string):StudioCollectionRecord|null{
  try{
    const r=JSON.parse(localStorage.getItem(STORAGE)||'null') as StudioCollectionRecord|null
    if(!r||(wallet&&r.walletAddress?.toLowerCase()!==wallet.toLowerCase()))return null
    return r
  }catch{return null}
}
