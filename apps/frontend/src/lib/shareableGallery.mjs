import {inspectLocalGalleryImage,validateGalleryDraft} from './creatorGalleryDraft.mjs'

export const MAX_SHAREABLE_IMAGE_BYTES=20*1024*1024
const escapeHtml=value=>String(value||'').replace(/[&<>"']/g,char=>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))
const toBase64=buffer=>{
  const bytes=new Uint8Array(buffer)
  const parts=[]
  for(let i=0;i<bytes.length;i+=32768)
    parts.push(String.fromCharCode(...bytes.subarray(i,i+32768)))
  return btoa(parts.join(''))
}

/** Deliberate download, not an upload/publication. Images must be the selected,
 * hash-bound local files; never fetch an NFT URL or embed a remote tracker. */
export async function buildShareableGallery(draft,files,{includeImages=false}={}){
  const safe=validateGalleryDraft(draft)
  if(!safe||!safe.works.length)throw new TypeError('gallery_has_no_artworks')
  if(includeImages!==true)throw new TypeError('gallery_export_consent_required')
  let total=0
  const selected=safe.works.map(work=>{
    const file=files&&Object.hasOwn(files,work.id)?files[work.id]:null
    if(!work.sourceSha256||!file||typeof file.arrayBuffer!=='function')
      throw new TypeError('gallery_local_images_required')
    if(!Number.isSafeInteger(file.size)||file.size<12||file.size>16*1024*1024)
      throw new TypeError('gallery_invalid_image_size')
    total+=file.size
    if(total>MAX_SHAREABLE_IMAGE_BYTES)throw new TypeError('gallery_export_too_large')
    return {work,file}
  })
  const cards=[]
  for(const {work,file} of selected){
    const bytes=await file.arrayBuffer()
    const info=await inspectLocalGalleryImage({name:file.name,type:file.type,size:file.size,
      arrayBuffer:async()=>bytes})
    if(info.sourceSha256!==work.sourceSha256)throw new TypeError('gallery_image_changed')
    const image='data:'+info.mime+';base64,'+toBase64(bytes)
    cards.push(`<figure><div class="image"><img src="${image}" alt="${escapeHtml(work.title)}" decoding="async"></div><figcaption><h2>${escapeHtml(work.title)}</h2>${work.artist?'<p class="artist">'+escapeHtml(work.artist)+'</p>':''}${work.description?'<p class="description">'+escapeHtml(work.description)+'</p>':''}</figcaption></figure>`)
  }
  const title=escapeHtml(safe.name||'Mon exposition')
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<meta name="referrer" content="no-referrer"><title>${title}</title>
<style>
*{box-sizing:border-box}html{color-scheme:light}body{margin:0;background:#f5f5f7;color:#18181b;font:16px/1.65 system-ui,-apple-system,sans-serif}main{max-width:1160px;margin:auto;padding:64px 24px}header{max-width:800px;margin-bottom:48px}.eyebrow{font-size:14px;letter-spacing:.16em;text-transform:uppercase;color:#52525b}h1{font:clamp(2.5rem,7vw,5rem)/1.12 Georgia,serif;margin:16px 0 24px;overflow-wrap:anywhere}header .description{font-size:18px}.description{white-space:pre-wrap;overflow-wrap:anywhere}.gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:32px}figure{margin:0;border:1px solid #d4d4d8;border-radius:18px;background:white;overflow:hidden}.image{padding:24px;background:#e4e4e7;display:flex;align-items:center;justify-content:center;min-height:240px}img{display:block;max-width:100%;max-height:540px;width:auto;height:auto;object-fit:contain;box-shadow:0 10px 26px #0002}figcaption{padding:24px}h2{font:1.5rem/1.3 Georgia,serif;margin:0;overflow-wrap:anywhere}.artist{color:#52525b;margin:8px 0}footer{margin-top:56px;border-top:1px solid #d4d4d8;padding-top:24px;font-size:14px;color:#52525b}footer a{color:inherit;text-underline-offset:4px}@media(max-width:640px){main{padding:32px 16px}.gallery{grid-template-columns:1fr;gap:24px}.image,figcaption{padding:18px}}@media print{body{background:white}main{padding:0}figure{break-inside:avoid}footer a{color:#18181b}}
</style></head><body><main><header><p class="eyebrow">Exposition · ${cards.length} œuvre${cards.length>1?'s':''}</p><h1>${title}</h1>${safe.description?'<p class="description">'+escapeHtml(safe.description)+'</p>':''}</header><section class="gallery" aria-label="Œuvres exposées">${cards.join('')}</section><footer>Exposition préparée avec <a href="https://xartists.art/create/gallery/" rel="noreferrer">xArtists</a>. Présentation des œuvres ; aucun achat, NFT ou certificat associé à ce fichier.</footer></main></body></html>`
}

export function shareableGalleryFileName(name){
  const slug=String(name||'exposition').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70)
  return 'xartists-'+(slug||'exposition')+'.html'
}
