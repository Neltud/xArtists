/** Artist-controlled image/video/audio and separately gated GLB → IPFS pin → metadata → NFT mint URI.
 * No browser token for Pinata; uploads only through signed backend with daily quota.
 */
import { useEffect, useRef, useState } from 'react'
import { useWallet } from '../context/WalletContext'
import { signAccessMessage } from '../lib/signAccessMessage'
import { getAccessApiBase } from '../lib/stripe'
import StudioGlbPreview from './StudioGlbPreview'

type Pinned={mediaUri:string;metadataUri:string;attributes:string;title:string}
type Props={title:string;onReady:(pin:Pinned|null)=>void}
const allowed:Record<string,number>={
  'image/jpeg':16*1024*1024,'image/png':16*1024*1024,
  'image/webp':16*1024*1024,'video/mp4':48*1024*1024,
  'audio/mpeg':24*1024*1024,'audio/wav':48*1024*1024,'audio/flac':48*1024*1024,
  'model/gltf-binary':32*1024*1024,
}
async function postJson(base:string,path:string,body:unknown,token?:string){
  const r=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',
    ...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)})
  const j=await r.json().catch(()=>({error:'server_response_invalid'}))
  if(!r.ok)throw new Error(String(j.error||'HTTP '+r.status))
  return j
}
const studioMediaErrors:Record<string,string>={
  metadata_immutable_request_mismatch:'Les métadonnées déjà publiées sont immuables. Sélectionnez à nouveau votre fichier pour créer une nouvelle publication.',
  metadata_pinning_in_progress:'Une publication des métadonnées est déjà en cours. Réessayez après vérification de son état.',
  metadata_pinning_in_progress_or_complete:'La publication est en cours ou déjà terminée. Vérifiez son état avant de recommencer.',
  metadata_pin_result_unknown_reconcile:'Réponse IPFS incertaine : les métadonnées peuvent déjà être publiques. Ne recommencez pas l’upload avant une vérification de l’opérateur.',
  daily_upload_quota_exhausted:'Quota de huit publications sur 24 heures atteint pour ce wallet.',
  pinata_service_unavailable:'Pinata ne répond pas actuellement. Aucun mint n’a été créé.',
  kubo_service_unavailable:'Le nœud IPFS privé ne répond pas. Aucun mint n’a été créé.',
  kubo_add_failed:'Le nœud IPFS a refusé la publication du fichier.',
  kubo_result_invalid:'Le nœud IPFS a renvoyé un CID ou une réponse invalide.',
  kubo_readback_unverified:'Le fichier publié ne correspond pas à la copie relue sur le nœud IPFS. Publication interrompue.',
  studio_upload_not_configured:'Le service IPFS sécurisé n’est pas encore activé sur le serveur.',
  studio_glb_upload_disabled:'L’upload GLB nécessite une validation opérateur supplémentaire. Il reste désactivé.',
  glb_external_resource_forbidden:'Le GLB doit contenir ses données et textures sans URI externes.',
  glb_header_invalid:'GLB invalide : en-tête ou longueur incorrects.',
  glb_chunk_invalid:'GLB invalide : données internes incohérentes.',
  glb_json_chunk_invalid:'GLB invalide : description glTF non lisible.',
  glb_structure_invalid:'GLB invalide : maillage glTF 2.0 incomplet.',
  glb_preview_required_or_not_owned:'Modèle 3D : une image de couverture préalablement épinglée et liée au même wallet est obligatoire.' ,
}
const explainStudioMediaError=(error:unknown)=>{
  const code=error instanceof Error?error.message:'media_upload_unavailable'
  return studioMediaErrors[code]||code
}
export default function CreatorMediaUpload({title,onReady}:Props){
  const {connected,address,method}=useWallet()
  const base=getAccessApiBase()
  const [enabled,setEnabled]=useState<boolean|null>(null)
  const [statusRetry,setStatusRetry]=useState(0)
  const [modelEnabled,setModelEnabled]=useState(false)
  const [provider,setProvider]=useState<'pinata_ipfs'|'kubo_ipfs'|null>(null)
  const [file,setFile]=useState<File|null>(null)
  const [preview,setPreview]=useState('')
  const [posterFile,setPosterFile]=useState<File|null>(null)
  const [posterPreview,setPosterPreview]=useState('')
  const [description,setDescription]=useState('')
  const [rights,setRights]=useState(false)
  const [pending,setPending]=useState(false)
  const [needsReconciliation,setNeedsReconciliation]=useState(false)
  const [error,setError]=useState('')
  const [pinned,setPinned]=useState<Pinned|null>(null)
  // Ignore completion of a previous upload after a wallet/file/rights/title change.
  const revision=useRef(0)
  useEffect(()=>{
    revision.current+=1
    setPinned(null)
    onReady(null)
    // A request already sent may still finish server-side. On leaving the
    // page or changing signer, never open the next prompt or publish metadata.
    return ()=>{revision.current+=1}
  },[title,address,connected,method])
  useEffect(()=>{
    if(!file){setPreview('');return}
    const url=URL.createObjectURL(file);setPreview(url)
    return ()=>{URL.revokeObjectURL(url)}
  },[file])
  useEffect(()=>{
    if(!posterFile){setPosterPreview('');return}
    const url=URL.createObjectURL(posterFile)
    setPosterPreview(url)
    return ()=>URL.revokeObjectURL(url)
  },[posterFile])
  useEffect(()=>{
    if(!base){setEnabled(false);setModelEnabled(false);setProvider(null);return}
    const c=new AbortController()
    let active=true
    // Retry service readiness without forcing an app reload.
    // A retry only re-reads public config: it never authorizes an upload.
    const timeout=window.setTimeout(()=>c.abort(),12000)
    setEnabled(null)
    setModelEnabled(false)
    setProvider(null)
    fetch(base+'/v1/studio/media/config',{signal:c.signal,cache:'no-store'})
      .then(async r=>r.ok?r.json():null)
      .then(j=>{if(!c.signal.aborted){setEnabled(j?.enabled===true);setModelEnabled(j?.modelEnabled===true);setProvider(j?.enabled===true&&['pinata_ipfs','kubo_ipfs'].includes(j?.provider)?j.provider:null)}})
      .catch(()=>{if(!c.signal.aborted){setEnabled(false);setModelEnabled(false)}})
      .finally(()=>{window.clearTimeout(timeout);if(active && c.signal.aborted)setEnabled(false)})
    return ()=>{active=false;window.clearTimeout(timeout);c.abort()}
  },[base,statusRetry])
  const pick=(next:File|null)=>{
    // File providers may return an empty/generic MIME. The server still verifies file bytes.
    const inferred = next && (next.type==='' || next.type==='application/octet-stream')
      ? (/\.glb$/i.test(next.name) ? 'model/gltf-binary'
        : /\.mp3$/i.test(next.name) ? 'audio/mpeg'
        : /\.wav$/i.test(next.name) ? 'audio/wav'
        : /\.flac$/i.test(next.name) ? 'audio/flac' : '')
      : next?.type==='audio/x-wav' || next?.type==='audio/wave' ? 'audio/wav' : ''
    const chosen = next && inferred
      ? new File([next],next.name,{type:inferred,lastModified:next.lastModified})
      : next
    revision.current+=1
    setError('');setFile(chosen);setPosterFile(null);setPinned(null);onReady(null)
    setNeedsReconciliation(false)
    if(chosen && (!allowed[chosen.type]||chosen.size<=0||chosen.size>allowed[chosen.type])){
      setFile(null)
      setError('Formats : images JPG/PNG/WebP, vidéo MP4, musique MP3/WAV/FLAC ou modèle 3D GLB.')
    }
  }
  const pin=async()=>{
    if(pending||needsReconciliation)return
    setError('')
    if(!file||!allowed[file.type]){setError('Choisissez une image, une vidéo ou une musique (ou un modèle 3D GLB).');return}
    if(file.type==='model/gltf-binary' && (!posterFile || !['image/jpeg','image/png','image/webp'].includes(posterFile.type) || posterFile.size<1 || posterFile.size>16*1024*1024)) {
      setError('Choisissez une image de couverture JPG, PNG ou WebP de 16 Mio maximum pour ce GLB.');return
    }
    if(!base||!enabled){setError('Upload non activé côté serveur : stockage IPFS et PostgreSQL vérifiés requis.');return}
    if(file.type==='model/gltf-binary'&&!modelEnabled){setError('Upload GLB désactivé côté serveur : contrôle opérateur requis.');return}
    if(!connected||!address||method!=='xportal'){setError('Connexion xPortal et signature requises.');return}
    if(title.trim().length<2||title.trim().length>50){setError('Titre de 2 à 50 caractères requis.');return}
    if(!rights){setError("Confirmez que vous détenez les droits de publier ce média.");return}
    const attempt=++revision.current
    const chosenFile=file,chosenPoster=posterFile,chosenTitle=title.trim(),chosenDescription=description.trim()
    const stillCurrent=()=>revision.current===attempt
    setPending(true)
    try{
      const ch=await postJson(base,'/v1/studio/media/challenge',{address})
      if(!stillCurrent())return
      if(!ch.message||!ch.nonce)throw new Error('Challenge de connexion indisponible.')
      const signed=await signAccessMessage(ch.message)
      if(!stillCurrent())return
      if(!signed.ok)throw new Error('Signature xPortal requise : '+signed.error)
      const session=await postJson(base,'/v1/studio/media/session',
        {address,message:ch.message,nonce:ch.nonce,signature:signed.signature})
      if(!stillCurrent())return
      if(!session.token)throw new Error('Session artiste non créée.')
      const uploadResponse=await fetch(base+'/v1/studio/media/upload',{
        method:'POST',headers:{Authorization:'Bearer '+session.token,'Content-Type':chosenFile.type},
        body:chosenFile,
      })
      const data=await uploadResponse.json().catch(()=>({error:'upload_response_invalid'}))
      if(!stillCurrent())return
      if(!uploadResponse.ok)throw new Error(data.error||'Erreur upload IPFS.')
      if(!data.uploadId||!data.uri)throw new Error('Upload non confirmé par le serveur.')
      let previewUploadId: string | undefined
      if(chosenFile.type==='model/gltf-binary') {
        if(!chosenPoster)throw new Error('Image de couverture manquante.')
        const posterResponse=await fetch(base+'/v1/studio/media/upload',{
          method:'POST',headers:{Authorization:'Bearer '+session.token,'Content-Type':chosenPoster.type},
          body:chosenPoster,
        })
        const poster=await posterResponse.json().catch(()=>({error:'upload_response_invalid'}))
        if(!stillCurrent())return
        if(!posterResponse.ok)throw new Error(poster.error||'Échec de publication de la couverture IPFS.')
        if(!poster.uploadId||!poster.uri)throw new Error('Épinglage de la couverture non confirmé.')
        previewUploadId=poster.uploadId
      }
      const meta=await postJson(base,'/v1/studio/media/metadata',{
        uploadId:data.uploadId,previewUploadId,title:chosenTitle,description:chosenDescription,rightsAccepted:true,
      },session.token)
      if(!stillCurrent())return
      if(!meta.mediaUri||!meta.metadataUri||!meta.attributes)
        throw new Error('Métadonnées IPFS non confirmées.')
      const result={mediaUri:meta.mediaUri as string,metadataUri:meta.metadataUri as string,
        attributes:meta.attributes as string,title:chosenTitle}
      setPinned(result);onReady(result)
    }catch(e){
      if(stillCurrent()){
        const code=e instanceof Error?e.message:''
        if(code==='metadata_pin_result_unknown_reconcile')
          setNeedsReconciliation(true)
        setError(explainStudioMediaError(e))
      }
    }
    finally{setPending(false)}
  }
  const stale=!!pinned&&pinned.title!==title.trim()
  return (
    <div className="space-y-3 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.04] p-3 sm:p-4">
      <div>
        <h3 className="font-semibold text-white text-sm">Choisir mon fichier</h3>
        <p className="text-xs text-zinc-400 mt-1">Image JPG/PNG/WebP (16 Mio), vidéo MP4 (48 Mio), musique MP3 (24 Mio), WAV/FLAC (48 Mio) ou 3D GLB (32 Mio).
          Les fichiers sont publiés sur IPFS uniquement après signature de connexion et confirmation.</p>
      </div>
      {enabled===null&&<p role="status" className="rounded-lg border border-white/15 p-3 text-xs text-zinc-300">
        Vérification du service d’upload… Aucun fichier n’est transmis pendant cette étape.
      </p>}
      {enabled===false&&<p role="status" className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs leading-relaxed text-amber-100">
        Publication IPFS indisponible : le fichier sélectionné reste uniquement sur votre appareil.
        L’aperçu local n’est pas un fichier publié, une transaction ou un NFT minté.
        <button type="button" className="mt-2 inline-flex min-h-[44px] items-center rounded-lg border border-amber-400/40 px-3 py-2 text-xs font-semibold"
          onClick={()=>setStatusRetry(n=>n+1)}>Retester la connexion IPFS</button>
        Pour préparer une œuvre, utilisez une URI IPFS/HTTPS que vous hébergez vous-même ;
        ne signez aucune transaction avant d’avoir vérifié le média, les droits et la collection.
      </p>}
      <label className="block text-xs text-zinc-300">
        Image, vidéo ou musique (ou fichier 3D)
        <input type="file" accept=".jpg,.jpeg,.png,.webp,.mp4,.mp3,.wav,.flac,.glb,image/jpeg,image/png,image/webp,video/mp4,audio/mpeg,audio/wav,audio/flac,model/gltf-binary"
          className="mt-1 block w-full rounded-lg border border-white/10 p-2 text-xs text-white"
          onChange={e=>pick(e.target.files?.[0]||null)}/>
      </label>
      {file&&<div className="space-y-2">
        {file.type.startsWith('audio/')
          ? <audio src={preview} controls preload="metadata" className="w-full" aria-label="Écouter le fichier audio sélectionné"/>
          : file.type==='video/mp4'
          ? <video src={preview} controls playsInline preload="metadata" className="w-full max-h-64 rounded-lg bg-black"/>
          : file.type==='model/gltf-binary'
          ? <>
              <StudioGlbPreview file={file}/>
              <label className="block text-xs text-zinc-300">Image de couverture obligatoire pour le NFT 3D (JPG, PNG, WebP ; 16 Mio max)
                <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  className="mt-1 block w-full rounded-lg border border-white/10 p-2 text-xs text-white"
                  onChange={e=>{
                    const next=e.target.files?.[0]||null
                    revision.current+=1;setPinned(null);onReady(null)
                    if(next && (!['image/jpeg','image/png','image/webp'].includes(next.type)||next.size<1||next.size>16*1024*1024)){
                      setPosterFile(null);setError('Couverture JPG/PNG/WebP jusqu’à 16 Mio uniquement.')
                    }else{setPosterFile(next);setError('')}
                  }} />
              </label>
              {posterPreview&&<img src={posterPreview} alt="Aperçu local de la couverture du modèle 3D" className="max-h-48 w-full rounded-lg object-contain bg-black" />}
              <p className="text-xs text-zinc-400">Le modèle GLB et son image de couverture seront deux fichiers épinglés séparément sur IPFS, puis liés dans un seul JSON de métadonnées. Deux uploads décomptés du quota journalier.</p>
            </>
          : <img src={preview} alt="Aperçu local avant publication IPFS" className="max-h-64 w-full rounded-lg object-contain bg-black"/>}
        <p className="break-all text-xs text-zinc-400">{file.name} · {(file.size/1048576).toFixed(2)} Mo</p>
        <p className="text-xs text-zinc-400">Aperçu local uniquement : aucune publication IPFS ni création de NFT.</p>
      </div>}
      <label className="block text-xs text-zinc-300">
        Description publique du NFT (facultative)
        <textarea value={description} rows={2} maxLength={800}
          onChange={e=>{revision.current+=1;setDescription(e.target.value);setPinned(null);onReady(null)}}
          className="mt-1 block w-full rounded-lg border border-white/10 bg-zinc-950 p-2 text-sm text-white"
          placeholder="Technique, histoire, contexte et droits de l'œuvre"/>
      </label>
      <label className="flex items-start gap-2 text-xs leading-relaxed text-zinc-300">
        <input type="checkbox" checked={rights} onChange={e=>{revision.current+=1;setRights(e.target.checked);setPinned(null);onReady(null)}}
          className="mt-0.5" />
        Je possède les droits de reproduire et publier ce média. Je comprends qu'une publication
        IPFS et un NFT ne sont pas automatiquement supprimables.
      </label>
      <button type="button" className="btn-primary text-sm min-h-[44px] disabled:opacity-50"
        disabled={!enabled||pending||needsReconciliation||!file||!rights||!connected||method!=='xportal'||(file.type==='model/gltf-binary'&&(!modelEnabled||!posterFile))}
        onClick={()=>void pin()}>
        {pending?'Publication média + métadonnées IPFS…':'Publier sur IPFS et préparer le mint'}
      </button>
      {file?.type==='model/gltf-binary'&&!modelEnabled&&<p role="status" className="text-xs text-amber-200">Publication du GLB verrouillée : le backend exige le drapeau séparé STUDIO_GLB_UPLOAD_ENABLED=1. Le média n’est pas envoyé.</p>}
      {pinned&&!stale&&<div role="status" className="space-y-1 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2 text-xs text-amber-100">
        <p className="font-semibold">{provider==='kubo_ipfs'?'Le nœud IPFS xArtists a annoncé l’épinglage du média et des métadonnées.':'Pinata a annoncé l’épinglage du média et des métadonnées.'} Le NFT n'est PAS encore minté.</p>
        <p className="break-all">Média : {pinned.mediaUri}</p>
        <p className="break-all">Métadonnées : {pinned.metadataUri}</p>
        <p>Preuve de conservation non certifiée : la réponse IPFS ne prouve ni récupération indépendante des octets, ni seconde copie chez un autre nœud IPFS, ni archivage.</p>
        <p>Avant une signature mainnet, vérifier les fichiers et leurs empreintes SHA-256 sur des passerelles indépendantes ainsi que la collection, le destinataire et les frais. Un mint reste une action distincte signée dans votre wallet.</p>
      </div>}
      {needsReconciliation&&<p role="status" className="text-xs text-amber-200">
        Publication suspendue pour ce fichier : une réponse du nœud IPFS est incertaine.
        Une vérification de l’opérateur est requise avant tout nouvel essai.
      </p>}
      {stale&&<p className="text-xs text-amber-200">Le titre a changé depuis l'upload. Republiez les métadonnées avant de minter.</p>}
      {error&&<p role="alert" className="text-xs text-rose-200">{error}</p>}
    </div>
  )
}
