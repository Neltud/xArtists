export type GalleryRole='artist'|'gallery'|'seller'
export type GalleryKind='painting'|'sculpture'|'nft'|'mixed'
export type GalleryArtwork={
  id:string;title:string;artist:string;image:string;description:string;
  kind:GalleryKind;priceEgld:number|null;listing_verified:false
}
export type GalleryDraft={
  schema:'xartists.gallery-draft.v1';role:GalleryRole;name:string;description:string;
  works:GalleryArtwork[];publish_status:'local_only';sale_enabled:false
}
export const GALLERY_KEY:string
export const MAX_ART:number
export function newGalleryDraft():GalleryDraft
export function validateGalleryDraft(draft:unknown):GalleryDraft|null
export function addArtworkToDraft(draft:unknown,work:{
  title:string;artist?:string;image?:string;description?:string;kind?:GalleryKind;
  priceEgld?:number|string|null
}):GalleryDraft|null
export function galleryFrames(draft:unknown):Array<{
  id:string;title:string;artist:string;image:string|undefined;description:string;
  kind:GalleryKind;medium:'digital'|'physical'|'hybrid';priceLabel:string;
  onSale:false;provenance:string;license:string
}>
export function loadGalleryDraft(storage?:Storage):GalleryDraft
export function saveGalleryDraft(draft:unknown,storage?:Storage):boolean
