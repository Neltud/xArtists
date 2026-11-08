/**
 * Local, byte-bound creator handoff. This never uploads/pins, signs, mints,
 * authenticates rights or authorizes a trailer. Header detection is only an
 * early browser filter: the Creator Studio server must revalidate all bytes.
 */
const MAX_BYTES=Object.freeze({
  'image/jpeg':16*1024*1024,
  'image/png':16*1024*1024,
  'image/webp':16*1024*1024,
  'video/mp4':48*1024*1024,
  'model/gltf-binary':32*1024*1024,
})
const HEX=/^[a-f0-9]{64}$/
const fail=(code)=>{throw new Error(code)}
const hex=(bytes)=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('')

async function hash(bytes){
  if(!globalThis.crypto?.subtle)fail('secure_sha256_unavailable')
  return hex(await globalThis.crypto.subtle.digest('SHA-256',bytes))
}

function verifiedHeader(mime,bytes){
  if(mime==='image/png')
    return bytes.length>=8&&[137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b)
  if(mime==='image/jpeg')
    return bytes.length>=3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255
  if(mime==='image/webp')
    return bytes.length>=12&&String.fromCharCode(...bytes.subarray(0,4))==='RIFF'&&
      String.fromCharCode(...bytes.subarray(8,12))==='WEBP'
  if(mime==='video/mp4')
    return bytes.length>=12&&String.fromCharCode(...bytes.subarray(4,8))==='ftyp'
  if(mime==='model/gltf-binary')
    return bytes.length>=12&&String.fromCharCode(...bytes.subarray(0,4))==='glTF'&&
      new DataView(bytes.buffer,bytes.byteOffset,12).getUint32(4,true)===2&&
      new DataView(bytes.buffer,bytes.byteOffset,12).getUint32(8,true)===bytes.length
  return false
}

export async function prepareLocalCreatorEvidence({
  file, art, edition, creativeBrief, rightsDeclared=false,
  promotionPermissionDeclared=false,
}={}){
  if(!art||art.status!=='PAPER_METADATA_DRAFT'||!HEX.test(art.planDigest)||
    !Number.isSafeInteger(edition)||edition<1||edition>art.editions?.length)
    fail('invalid_paper_edition')
  const meta=art.editions[edition-1]
  if(meta?.edition!==edition||meta?.xartists?.plan_digest!==art.planDigest||
      meta.image!==null||meta.animation_url!==null||meta.xartists.mint_state!=='not_minted')
    fail('edition_must_be_unminted_paper_metadata')
  if(typeof creativeBrief!=='string'||creativeBrief.trim().length<10||
    creativeBrief.length>1200)fail('invalid_creative_brief')
  if(typeof rightsDeclared!=='boolean'||typeof promotionPermissionDeclared!=='boolean'||
    meta.xartists.rights_confirmed_by_creator!==rightsDeclared)
    fail('rights_declaration_out_of_sync')
  if(!file||typeof file.arrayBuffer!=='function'||!Number.isSafeInteger(file.size))
    fail('file_required')
  const mime=typeof file.type==='string'&&
    (file.type===''||file.type==='application/octet-stream')&&
    typeof file.name==='string'&&/\.glb$/i.test(file.name)
      ? 'model/gltf-binary':file.type
  const limit=MAX_BYTES[mime]
  if(!limit||file.size<12||file.size>limit)fail('unsupported_media_type_or_size')
  const bytes=new Uint8Array(await file.arrayBuffer())
  if(bytes.length!==file.size||!verifiedHeader(mime,bytes))
    fail('media_bytes_or_signature_invalid')
  const fileSha256=await hash(bytes)
  const dossierDigest=await hash(new TextEncoder().encode(
    'xartists-creator-evidence-v1\n'+JSON.stringify({
      fileSha256,planDigest:art.planDigest,edition,
      metadata:meta,creativeBrief:creativeBrief.trim(),
      rightsDeclared,promotionPermissionDeclared,
    })
  ))
  const stamp=new Date().toISOString()
  const ref=(kind)=>kind+'_'+dossierDigest.slice(0,24)
  const evidence=(kind)=>({
    kind,referenceId:ref(kind),observedAt:stamp,
    assetDigest:fileSha256,verification:'unverified',
  })
  const packet=(destination,items,blockers)=>({
    schema:'xa-handoff/1',
    taskId:(destination==='creation'?'creation_':'trailer_')+dossierDigest.slice(0,30),
    assetDigest:fileSha256,
    destination,evidence:items,blockers,
  })
  const creationBlockers=[
    ...(!rightsDeclared?['creator_rights_declaration_missing']:[]),
    'independent_rights_and_provenance_review_required',
    'real_media_ipfs_cid_and_gateway_bytes_unverified',
    'ipfs_metadata_and_edition_binding_unverified',
    'collection_owner_role_and_wallet_signature_unverified',
    ...(mime==='model/gltf-binary'?['3d_cover_and_operator_upload_gate_unverified']:[]),
    ...(art.creatorType==='ai_agent'?['scoped_signed_agent_mandate_required']:[]),
  ]
  const trailerBlockers=[
    ...(!promotionPermissionDeclared?['promotion_permission_declaration_missing']:[]),
    'independent_promotion_rights_and_source_review_required',
    'real_walkthrough_footage_not_verified',
    'final_trailer_and_publication_approval_missing',
  ]
  return {
    schema:'xartists-local-creator-evidence/1',
    status:'LOCAL_BYTES_HASHED_PAPER_ONLY',
    edition,editionName:meta.name,planDigest:art.planDigest,
    fileSha256,dossierDigest,mime,sizeBytes:bytes.length,
    observedAt:stamp,rightsDeclared,promotionPermissionDeclared,
    mediaUri:null,metadataUri:null,ipfsPinned:false,mintEnabled:false,
    paymentExecuted:false,contractDeployed:false,trailerPublished:false,
    creatorHandoff:packet('creation',[
      evidence('creative_brief'),
      ...(rightsDeclared?[evidence('rights_declaration')]:[]),
    ],creationBlockers),
    trailerHandoff:packet('trailer',[
      evidence('source'),
      ...(promotionPermissionDeclared?[evidence('promotion_permission')]:[]),
    ],trailerBlockers),
  }
}
