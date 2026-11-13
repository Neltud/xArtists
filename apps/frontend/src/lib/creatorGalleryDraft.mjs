/**
 * xArtists 3D exhibitions: private local DRAFT only.
 * No publish, listing, title transfer, wallet signing, mint, escrow or payment.
 */
export const GALLERY_KEY='xartists_gallery_draft_v1'
export const MAX_ART=16
const ROLES=new Set(['artist','gallery','seller'])
const KINDS=new Set(['painting','sculpture','nft','mixed'])
const text=(value,max=180)=>typeof value==='string'?value.trim().slice(0,max):''
const secureImage=value=>{
  if(typeof value!=='string'||value.length>1500)return ''
  try{
    const u=new URL(value)
    if(u.protocol!=='https:'||u.username||u.password||!u.hostname.includes('.'))return ''
    return u.href
  }catch{return ''}
}
const normalizedArtwork=(input,i)=>{
  if(!input||typeof input!=='object'||Array.isArray(input))return null
  const title=text(input.title,100)
  if(!title)return null
  const price=Number(input.priceEgld)
  return {
    id:text(input.id,110)||'local-'+(i+1),
    title,artist:text(input.artist,100),image:secureImage(input.image),
    description:text(input.description,500),
    kind:KINDS.has(input.kind)?input.kind:'painting',
    priceEgld:Number.isFinite(price)&&price>0&&price<=1_000_000
      ?Math.round(price*10000)/10000:null,
    // seller ownership, public listing and availability are NEVER inferred.
    listing_verified:false,
  }
}
export function newGalleryDraft(){
  return {schema:'xartists.gallery-draft.v1',role:'artist',name:'',
    description:'',works:[],publish_status:'local_only',sale_enabled:false}
}
export function validateGalleryDraft(input){
  if(!input||typeof input!=='object'||Array.isArray(input))return null
  if(input.schema!=='xartists.gallery-draft.v1')return null
  if(!ROLES.has(input.role)||!Array.isArray(input.works)||input.works.length>MAX_ART)return null
  const works=input.works.map(normalizedArtwork).filter(Boolean)
  if(works.length!==input.works.length)return null
  const ids=new Set(works.map(w=>w.id))
  if(ids.size!==works.length)return null
  return {
    schema:'xartists.gallery-draft.v1',role:input.role,
    name:text(input.name,110),description:text(input.description,800),
    works,publish_status:'local_only',sale_enabled:false,
  }
}
export function addArtworkToDraft(draft,work){
  const prev=validateGalleryDraft(draft)
  if(!prev||prev.works.length>=MAX_ART)return null
  const item=normalizedArtwork({...work,id:'local-'+Date.now()+'-'+prev.works.length},
    prev.works.length)
  if(!item)return null
  return validateGalleryDraft({...prev,works:[...prev.works,item]})
}
export function galleryFrames(draft){
  const safe=validateGalleryDraft(draft)
  return safe?.works.map(w=>({
    id:w.id,title:w.title,artist:w.artist,
    description:w.description,image:w.image||undefined,kind:w.kind,
    medium:w.kind==='nft'?'digital':w.kind==='mixed'?'hybrid':'physical',
    priceLabel:w.priceEgld==null?'Prix non renseigné':w.priceEgld+' EGLD · proposition',
    onSale:false,provenance:'Exposition locale — propriété et listing non vérifiés',
    license:'Droits à vérifier auprès du créateur',
  }))||[]
}
export function loadGalleryDraft(storage){
  try{
    const value=storage?.getItem(GALLERY_KEY)
    if(!value)return newGalleryDraft()
    if(value.length>40000)return newGalleryDraft()
    return validateGalleryDraft(JSON.parse(value))||newGalleryDraft()
  }catch{return newGalleryDraft()}
}
export function saveGalleryDraft(draft,storage){
  const value=validateGalleryDraft(draft)
  if(!value)return false
  try{storage?.setItem(GALLERY_KEY,JSON.stringify(value));return Boolean(storage)}
  catch{return false}
}
