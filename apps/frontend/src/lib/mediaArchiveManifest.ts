/**
 * Portable creator-owned preservation receipt, not an upload, receipt of payment,
 * independent readback certificate, transaction or promise of perpetual hosting.
 */
export type ReportedPin = {
 mediaUri:string
 metadataUri:string
 sha256:string
 bytes:number
 mime:string
}

const CID=/^(?:Qm[1-9A-HJ-NP-Za-km-z]{44}|baf[a-z2-7]{20,})$/
export function makePreservationManifest(pin:ReportedPin){
 const parts=pin.mediaUri.startsWith('ipfs://')?pin.mediaUri.slice(7).split('/'):[]
 const meta=pin.metadataUri.startsWith('ipfs://')?pin.metadataUri.slice(7).split('/'):[]
 if(parts.length!==2||!CID.test(parts[0])||!/^artwork-[a-f0-9]{24}\\.(?:jpg|png|webp|mp4)$/.test(parts[1])||
    meta.length!==1||!CID.test(meta[0])||
    !/^[a-f0-9]{64}$/.test(pin.sha256)||!Number.isSafeInteger(pin.bytes)||pin.bytes<=0||
    !['image/jpeg','image/png','image/webp','video/mp4'].includes(pin.mime))
  throw new Error('Preuve média incomplète : le manifeste ne peut pas être produit.')
 return {
  schema_version:1,
  kind:'xartists_artist_media_preservation_receipt',
  generated_at:new Date().toISOString(),
  media:{uri:pin.mediaUri,sha256:pin.sha256,bytes:pin.bytes,mime:pin.mime},
  metadata:{uri:pin.metadataUri},
  copies:[
   {provider:'pinata',status:'provider_reported',uri:pin.mediaUri},
   {provider:'independent_ipfs',status:'planned',uri:null},
   {provider:'arweave',status:'planned',uri:null},
   {provider:'offline_backup',status:'planned',uri:null}
  ],
  readback_status:'not_independently_verified',
  permanence:'NOT_GUARANTEED',
  on_chain_mint:'NOT_VERIFIED'
 }
}
