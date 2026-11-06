/** Artist-controlled JPG/PNG/WebP/MP4 → IPFS pin → metadata → NFT mint URI.
 * No browser token for Pinata; uploads only through signed backend with daily quota.
 */
import { useEffect, useRef, useState } from 'react'
import { useWallet } from '../context/WalletContext'
import { signAccessMessage } from '../lib/signAccessMessage'
import { getAccessApiBase } from '../lib/stripe'

type Pinned={mediaUri:string;metadataUri:string;attributes:string;title:string}
type Props={title:string;onReady:(pin:Pinned|null)=>void}
const allowed:Record<string,number>={
  'image/jpeg':16*1024*1024,'image/png':16*1024*1024,
  'image/webp':16*1024*1024,'video/mp4':48*1024*1024,
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
  daily_upload_quota_exhausted:'Quota de huit publications sur 24 heures atteint pour ce wallet.',
  pinata_service_unavailable:'Pinata ne répond pas actuellement. Aucun mint n’a été créé.',
  studio_upload_not_configured:'Le service IPFS sécurisé n’est pas encore activé sur le serveur.',
}
const explainStudioMediaError=(error:unknown)=>{
  const code=error instanceof Error?error.message:'media_upload_unavailable'
  return studioMediaErrors[code]||code
}
export default function CreatorMediaUpload({title,onReady}:Props){
  const {connected,address,method}=useWallet()
  const base=getAccessApiBase()
  const [enabled,setEnabled]=useState<boolean|null>(null)
  const [file,setFile]=useState<File|null>(null)
  const [preview,setPreview]=useState('')
  const [description,setDescription]=useState('')
  const [rights,setRights]=useState(false)
  const [pending,setPending]=useState(false)
  const [error,setError]=useState('')
  const [pinned,setPinned]=useState<Pinned|null>(null)
  // Ignore completion of a previous upload after a wallet/file/rights/title change.
  const revision=useRef(0)
  useEffect(()=>{
    revision.current+=1
    setPinned(null)
    onReady(null)
  },[title,address])
  useEffect(()=>{
    if(!file){setPreview('');return}
    const url=URL.createObjectURL(file);setPreview(url)
    return ()=>{URL.revokeObjectURL(url)}
  },[file])
  useEffect(()=>{
    if(!base){setEnabled(false);return}
    const c=new AbortController()
    fetch(base+'/v1/studio/media/config',{signal:c.signal,cache:'no-store'})
      .then(async r=>r.ok?r.json():null)
      .then(j=>{if(!c.signal.aborted)setEnabled(j?.enabled===true)})
      .catch(()=>{if(!c.signal.aborted)setEnabled(false)})
    return ()=>c.abort()
  },[base])
  const pick=(next:File|null)=>{
    revision.current+=1
    setError('');setFile(next);setPinned(null);onReady(null)
    if(next && (!allowed[next.type]||next.size<=0||next.size>allowed[next.type])){
      setFile(null)
      setError('Format attendu : JPG, PNG, WebP (max 16 Mo) ou MP4 (max 48 Mo).')
    }
  }
  const pin=async()=>{
    if(pending)return
    setError('')
    if(!file||!allowed[file.type]){setError('Choisissez un fichier JPG, PNG, WebP ou MP4.');return}
    if(!base||!enabled){setError('Upload non activé côté serveur : configuration Pinata et PostgreSQL requise.');return}
    if(!connected||!address||method!=='xportal'){setError('Connexion xPortal et signature requises.');return}
    if(title.trim().length<2||title.trim().length>50){setError('Titre de 2 à 50 caractères requis.');return}
    if(!rights){setError("Confirmez que vous détenez les droits de publier ce média.");return}
    const attempt=++revision.current
    const chosenFile=file,chosenTitle=title.trim(),chosenDescription=description.trim()
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
      const meta=await postJson(base,'/v1/studio/media/metadata',{
        uploadId:data.uploadId,title:chosenTitle,description:chosenDescription,rightsAccepted:true,
      },session.token)
      if(!stillCurrent())return
      if(!meta.mediaUri||!meta.metadataUri||!meta.attributes)
        throw new Error('Métadonnées IPFS non confirmées.')
      const result={mediaUri:meta.mediaUri as string,metadataUri:meta.metadataUri as string,
        attributes:meta.attributes as string,title:chosenTitle}
      setPinned(result);onReady(result)
    }catch(e){if(stillCurrent())setError(explainStudioMediaError(e))}
    finally{setPending(false)}
  }
  const stale=!!pinned&&pinned.title!==title.trim()
  return (
    <div className="space-y-3 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.04] p-3 sm:p-4">
      <div>
        <h3 className="font-semibold text-white text-sm">1. Prévisualiser l’œuvre puis préparer sa publication</h3>
        <p className="text-xs text-zinc-400 mt-1">JPG · PNG · WebP (16 Mo max), MP4 (48 Mo max).
          Les fichiers sont publiés sur IPFS uniquement après signature de connexion et confirmation.</p>
      </div>
      {enabled===null&&<p role="status" className="rounded-lg border border-white/15 p-3 text-xs text-zinc-300">
        Vérification du service d’upload… Aucun fichier n’est transmis pendant cette étape.
      </p>}
      {enabled===false&&<p role="status" className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs leading-relaxed text-amber-100">
        Upload IPFS indisponible : la photo ou vidéo sélectionnée reste uniquement sur votre appareil.
        L’aperçu local n’est pas un fichier publié, une transaction ou un NFT minté.
        Pour préparer une œuvre, utilisez une URI IPFS/HTTPS que vous hébergez vous-même ;
        ne signez aucune transaction avant d’avoir vérifié le média, les droits et la collection.
      </p>}
      <label className="block text-xs text-zinc-300">
        Photo ou vidéo originale
        <input type="file" accept=".jpg,.jpeg,.png,.webp,.mp4,image/jpeg,image/png,image/webp,video/mp4"
          className="mt-1 block w-full rounded-lg border border-white/10 p-2 text-xs text-white"
          onChange={e=>pick(e.target.files?.[0]||null)}/>
      </label>
      {file&&<div className="space-y-2">
        {file.type==='video/mp4'
          ? <video src={preview} controls playsInline preload="metadata" className="w-full max-h-64 rounded-lg bg-black"/>
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
        disabled={!enabled||pending||!file||!rights||!connected||method!=='xportal'}
        onClick={()=>void pin()}>
        {pending?'Publication média + métadonnées IPFS…':'Publier sur IPFS et préparer le mint'}
      </button>
      {pinned&&!stale&&<div role="status" className="space-y-1 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2 text-xs text-emerald-100">
        <p className="font-semibold">Média et métadonnées épinglés sur IPFS. Le NFT n'est PAS encore minté.</p>
        <p className="break-all">Média : {pinned.mediaUri}</p>
        <p className="break-all">Métadonnées : {pinned.metadataUri}</p>
        <p>Étape suivante : vérifier la collection et signer le mint dans votre wallet.</p>
      </div>}
      {stale&&<p className="text-xs text-amber-200">Le titre a changé depuis l'upload. Republiez les métadonnées avant de minter.</p>}
      {error&&<p role="alert" className="text-xs text-rose-200">{error}</p>}
    </div>
  )
}
