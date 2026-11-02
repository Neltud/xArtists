/**
 * Artist-owned, mobile-first physical artwork custody and receipt.
 * This UI NEVER uploads a photo silently or marks a buyer receipt from carrier events.
 * Server routes are enabled only after merchant-side Shopify/Postgres configuration.
 */
import { useEffect, useState } from 'react'
import { useWallet } from '../context/WalletContext'
import { getAccessApiBase } from '../lib/stripe'
import { signAccessMessage } from '../lib/signAccessMessage'

type Event = {
  type: string; actor: string; at: string; hash: string; prev: string
}
type PhysicalWork = {
  id: string; sku: string; title: string; artist: string; medium: string
  status: string; buyerBound: boolean
  nftIdentifier: string | null; nftLinkVerified: boolean
  shipment?: { trackingNumber?: string; trackingCompany?: string; trackingUrl?: string | null;
    carrierStatus?: string } | null
  receipt?: { decision: string; confirmedAt: string } | null
  assessment?: { reason: string; reviewStatus: string;
    advisory: { risk: string; actions: string[] } } | null
  events: Event[]
}
const STAGES = [
  { id:'REGISTERED', label:'Œuvre enregistrée' },
  { id:'ORDER_PAID', label:'Commande payée' },
  { id:'SHIPPED', label:'En transport' },
  { id:'CARRIER_DELIVERED', label:'Livré par le transporteur' },
  { id:'BUYER_ACCEPTED', label:'Réception confirmée par l’acheteur' },
]
const REASONS = [
  { value:'damaged', label:'Œuvre endommagée' },
  { value:'missing', label:'Œuvre manquante' },
  { value:'condition_changed', label:'État à réévaluer' },
  { value:'provenance_question', label:'Question de provenance' },
] as const

async function hashFile(file: File | null): Promise<string> {
  if (!file) throw new Error('Sélectionne une photo pour créer une empreinte de preuve.')
  if (!file.type.startsWith('image/') || file.size <= 0 || file.size > 25_000_000)
    throw new Error('Photo image valide obligatoire (25 Mo maximum).')
  const bytes = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
  return Array.from(new Uint8Array(bytes)).map(b=>b.toString(16).padStart(2,'0')).join('')
}

async function jsonApi(base:string,path:string,body?:unknown,token?:string) {
  const response=await fetch(base+path,{
    method:body===undefined?'GET':'POST',
    headers:{ ...(body===undefined?{}:{'Content-Type':'application/json'}),
      ...(token?{Authorization:'Bearer '+token}:{}) },
    body:body===undefined?undefined:JSON.stringify(body),
    cache:'no-store',
  })
  const payload=await response.json().catch(()=>({ok:false,error:'api_response_invalid'})) as
    {ok?:boolean;error?:string;token?:string;message?:string;nonce?:string;
      work?:PhysicalWork;enabled?:boolean}
  if (!response.ok) throw new Error(payload.error || 'API HTTP '+response.status)
  return payload
}

export default function PhysicalWorkFlowPanel() {
  const {connected,address,method}=useWallet()
  const base=getAccessApiBase()
  const [configured,setConfigured]=useState<boolean|null>(null)
  const [auth,setAuth]=useState('')
  const [busy,setBusy]=useState(false)
  const [notice,setNotice]=useState('')
  const [work,setWork]=useState<PhysicalWork|null>(null)
  const [workId,setWorkId]=useState('')
  const [title,setTitle]=useState('')
  const [artist,setArtist]=useState('')
  const [medium,setMedium]=useState('')
  const [nftId,setNftId]=useState('')
  const [originPhoto,setOriginPhoto]=useState<File|null>(null)
  const [receiptPhoto,setReceiptPhoto]=useState<File|null>(null)
  const [reason,setReason]=useState<typeof REASONS[number]['value']>('condition_changed')

  useEffect(()=>{setAuth('');setWork(null)},[address])
  useEffect(()=>{
    if (!base) {setConfigured(false);return}
    const controller=new AbortController()
    fetch(base+'/v1/physical/config',{signal:controller.signal,cache:'no-store'})
      .then(r=>r.ok?r.json():Promise.reject(new Error('configuration_unavailable')))
      .then(j=>setConfigured(j.enabled===true))
      .catch(()=>{if(!controller.signal.aborted)setConfigured(false)})
    return ()=>controller.abort()
  },[base])

  async function run(fn:()=>Promise<void>) {
    if(busy)return
    setBusy(true);setNotice('')
    try{await fn()}catch(e){setNotice(e instanceof Error?e.message:'Échec — réessaie plus tard.')}
    finally{setBusy(false)}
  }

  async function getAuth():Promise<string> {
    if(auth)return auth
    if(!base || !configured)throw new Error('Service logistique désactivé sur le serveur.')
    if(!connected || !address || method!=='xportal')
      throw new Error('Connecte un wallet xPortal actif pour signer la session de provenance.')
    const challenge=await jsonApi(base,'/v1/physical/challenge',{address})
    if(!challenge.message || !challenge.nonce)throw new Error('Challenge serveur absent.')
    const signed=await signAccessMessage(challenge.message)
    if(!signed.ok)throw new Error('Signature refusée ou indisponible : '+signed.error)
    const login=await jsonApi(base,'/v1/physical/session',{
      address,message:challenge.message,nonce:challenge.nonce,signature:signed.signature,
    })
    if(!login.token)throw new Error('Session signée indisponible.')
    setAuth(login.token)
    return login.token
  }

  const create=()=>run(async()=>{
    const proof=await hashFile(originPhoto)
    const token=await getAuth()
    const result=await jsonApi(base,'/v1/physical/works',{
      title,artist,medium,photoSha256:proof,nftIdentifier:nftId.trim(),
    },token)
    if(!result.work)throw new Error('Enregistrement non confirmé par le serveur.')
    setWork(result.work);setWorkId(result.work.id)
    setNotice('Œuvre enregistrée. Copie le SKU ci-dessous dans le produit Shopify correspondant. Aucun NFT ni achat créé automatiquement.')
  })

  const refresh=()=>run(async()=>{
    if(!/^xa_phy_[a-f0-9]{18}$/i.test(workId.trim()))throw new Error('Identifiant œuvre invalide.')
    const token=await getAuth()
    const result=await jsonApi(base,'/v1/physical/works/'+encodeURIComponent(workId.trim()),undefined,token)
    if(!result.work)throw new Error('Œuvre introuvable.')
    setWork(result.work)
    setNotice('Statut relu depuis le registre authentifié.')
  })

  const receipt=(decision:'accepted'|'damaged'|'missing')=>run(async()=>{
    if(!work)throw new Error('Ouvre ton dossier de suivi.')
    if(!window.confirm(decision==='accepted'
      ? 'Confirmer la réception physique de cette œuvre ? Cette action sera journalisée.'
      : 'Déclarer un incident de livraison nécessitant une revue humaine ?'))return
    const digest=await hashFile(receiptPhoto)
    const token=await getAuth()
    const result=await jsonApi(base,
      '/v1/physical/works/'+encodeURIComponent(work.id)+'/receipt',
      {decision,evidenceSha256:digest},token)
    if(!result.work)throw new Error('Statut non confirmé.')
    setWork(result.work)
    setNotice(decision==='accepted'
      ? 'Réception enregistrée avec empreinte. Cela ne transfère pas les droits ou l’EGLD.'
      : 'Litige ouvert. Pas de paiement, transfert NFT ou remboursement automatique.')
  })

  const reassess=()=>run(async()=>{
    if(!work)throw new Error('Ouvre ton dossier de suivi.')
    const digest=await hashFile(receiptPhoto)
    const token=await getAuth()
    const result=await jsonApi(base,
      '/v1/physical/works/'+encodeURIComponent(work.id)+'/reassess',
      {reason,evidenceSha256:digest},token)
    if(!result.work)throw new Error('Réexamen non enregistré.')
    setWork(result.work)
    setNotice('Demande enregistrée. Le triage détermine uniquement des contrôles proposés ; un expert humain doit conclure.')
  })

  const currentIndex=STAGES.findIndex(s=>s.id===work?.status)

  return (
    <section className="space-y-5 rounded-2xl border border-cyan-500/20 bg-white/[0.025] p-4 sm:p-6"
      aria-label="Suivi sécurisé des œuvres physiques">
      <div className="space-y-2">
        <p className="section-label">xArtists × Shopify · Physical Art</p>
        <h2 className="text-xl font-semibold text-white">Suivi de l'œuvre physique</h2>
        <p className="text-sm text-zinc-400">
          Création d'une fiche artiste, référence NFT déclarative, expédition du transporteur,
          réception confirmée par l'acheteur et réévaluation sur preuve. Aucun transfert NFT
          ni déblocage de fonds automatique.
        </p>
        {configured===false && <p role="status" className="rounded-lg border border-amber-500/30 p-3 text-sm text-amber-200">
          Service logistique non activé sur le serveur. Les certificats paper restent disponibles ;
          pas de suivi de commande réel tant que Shopify, PostgreSQL et les webhooks ne sont pas configurés.
        </p>}
        {configured===null && <p className="text-xs text-zinc-500">Vérification du service…</p>}
        {configured===true && <p className="text-xs text-emerald-300">Serveur logistique configuré.
          Une configuration n'atteste pas à elle seule qu'un transporteur a livré.</p>}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-3">
          <h3 className="text-sm font-semibold">Artiste · enregistrer une œuvre</h3>
          <div className="grid grid-cols-1 gap-2">
            <label className="text-xs text-zinc-400">Titre de l'œuvre
              <input value={title} onChange={e=>setTitle(e.target.value)}
                className="mt-1 w-full rounded-lg bg-zinc-950 border border-white/10 p-2 text-sm text-white" maxLength={120} />
            </label>
            <label className="text-xs text-zinc-400">Nom d'artiste
              <input value={artist} onChange={e=>setArtist(e.target.value)}
                className="mt-1 w-full rounded-lg bg-zinc-950 border border-white/10 p-2 text-sm text-white" maxLength={100} />
            </label>
            <label className="text-xs text-zinc-400">Technique / matériau
              <input value={medium} onChange={e=>setMedium(e.target.value)}
                className="mt-1 w-full rounded-lg bg-zinc-950 border border-white/10 p-2 text-sm text-white" maxLength={80} />
            </label>
            <label className="text-xs text-zinc-400">Identifiant NFT MultiversX (optionnel, non vérifié à cette étape)
              <input value={nftId} onChange={e=>setNftId(e.target.value)}
                placeholder="COLLECT-abcdef-01"
                className="mt-1 w-full rounded-lg bg-zinc-950 border border-white/10 p-2 text-sm text-white" />
            </label>
            <label className="text-xs text-zinc-400">Photo d'origine pour empreinte SHA-256
              <input type="file" accept="image/*" onChange={e=>setOriginPhoto(e.target.files?.[0]||null)}
                className="mt-1 w-full text-xs text-zinc-200" />
            </label>
          </div>
          <button type="button" className="btn-primary text-sm" onClick={create}
            disabled={busy || !configured || !connected || method!=='xportal' || !originPhoto}>
            Créer la fiche de provenance
          </button>
          <p className="text-[11px] text-zinc-500">
            Seule l'empreinte de la photo est envoyée. Conserve l'original : une empreinte seule
            n'est pas une preuve photographique vérifiable sans le fichier correspondant.
          </p>
        </div>
        <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-3">
          <h3 className="text-sm font-semibold">Acheteur / artiste · consulter le suivi</h3>
          <label className="block text-xs text-zinc-400">Identifiant de suivi xArtists
            <input value={workId} onChange={e=>setWorkId(e.target.value)} placeholder="xa_phy_..."
              className="mt-1 w-full rounded-lg bg-zinc-950 border border-white/10 p-2 text-sm text-white mono" />
          </label>
          <button type="button" className="btn-secondary text-sm"
            disabled={busy || !configured || !connected || method!=='xportal'}
            onClick={refresh}>Consulter / actualiser la fiche</button>
          <p className="text-[11px] text-zinc-500">
            L'accès exige une signature xPortal et le wallet de l'artiste ou de l'acheteur.
            Un marchand doit associer le wallet de l'acheteur à la commande vérifiée côté serveur.
          </p>
          {work && <>
            <div className="space-y-1 text-xs">
              <p className="font-semibold text-white">{work.title}</p>
              <p className="text-zinc-400">Artiste : {work.artist} · {work.medium}</p>
              <p className="break-all font-mono text-cyan-300">SKU Shopify : {work.sku}</p>
              <p className="break-all font-mono text-zinc-400">Dossier : {work.id}</p>
              {work.nftIdentifier && <p className="break-all text-amber-200">
                NFT déclaré : {work.nftIdentifier} · lien blockchain non vérifié
              </p>}
            </div>
            {work.shipment?.trackingUrl && <a className="text-sm text-cyan-300 underline"
              href={work.shipment.trackingUrl} target="_blank" rel="noopener noreferrer">
              Suivre auprès du transporteur</a>}
          </>}
        </div>
      </div>

      {work?.nftIdentifier && <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className={work.nftLinkVerified ? 'text-emerald-300' : 'text-amber-300'}>
          {work.nftLinkVerified ? 'NFT du créateur vérifié via MultiversX API' : 'Lien NFT déclaré, non vérifié'}
        </span>
        {!work.nftLinkVerified && <button type="button" className="btn-secondary text-xs"
          disabled={!configured || busy || !auth}
          onClick={()=>run(async()=>{
            const token=await getAuth()
            const r=await jsonApi(base,'/v1/physical/works/'+encodeURIComponent(work.id)+'/verify-nft',{},token)
            if(!r.work)throw new Error('Vérification blockchain impossible.')
            setWork(r.work)
            setNotice('L’API confirme que le créateur possède ce NFT qu’il a créé. Aucun transfert de propriété physique implicite.')
          })}>Vérifier le NFT sur mainnet</button>}
      </div>}
      {work && <div className="space-y-4">
        <h3 className="text-sm font-semibold">Chaîne de garde · {work.status}</h3>
        {work.status==='DISPUTED' && <p role="alert" className="text-rose-300 text-sm">
          Litige en cours — aucun règlement ou transfert automatique.</p>}
        <ol className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          {STAGES.map((step,i)=><li key={step.id} className={
            'rounded-lg border p-2 text-xs '+(currentIndex>=i
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100'
              : 'border-white/10 bg-black/25 text-zinc-500')}>
            {step.label}
          </li>)}
        </ol>
        <p className="text-xs text-zinc-400">
          Statut transporteur : {work.shipment?.carrierStatus || 'inconnu'}.
          Une livraison « delivered » n'est jamais une réception « accepted ».
        </p>
        <div className="space-y-3 border-t border-white/10 pt-4">
          <h3 className="text-sm font-semibold">Réception & réévaluation</h3>
          <label className="block text-xs text-zinc-400">
            Photo de réception / dommage (empreinte uniquement ; conserver l'original)
            <input type="file" accept="image/*" onChange={e=>setReceiptPhoto(e.target.files?.[0]||null)}
              className="mt-1 block w-full text-xs text-zinc-200" />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-primary text-xs" onClick={()=>receipt('accepted')}
              disabled={busy || !configured || !receiptPhoto || work.status!=='CARRIER_DELIVERED' || !work.buyerBound}>
              Confirmer ma réception
            </button>
            <button type="button" className="btn-secondary text-xs" onClick={()=>receipt('damaged')}
              disabled={busy || !configured || !receiptPhoto || !['SHIPPED','CARRIER_DELIVERED'].includes(work.status) || !work.buyerBound}>
              Déclarer un dommage
            </button>
            <button type="button" className="btn-secondary text-xs" onClick={()=>receipt('missing')}
              disabled={busy || !configured || !receiptPhoto || !['SHIPPED','CARRIER_DELIVERED'].includes(work.status) || !work.buyerBound}>
              Déclarer non reçu
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-2">
            <label className="text-xs text-zinc-400 flex-1">Motif de réexamen
              <select value={reason} onChange={e=>setReason(e.target.value as typeof reason)}
                className="mt-1 block w-full rounded-lg border border-white/10 bg-zinc-950 p-2 text-sm text-white">
                {REASONS.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </label>
            <button type="button" className="btn-secondary text-xs"
              disabled={busy || !configured || !receiptPhoto || work.assessment?.reviewStatus==='pending_human'}
              onClick={reassess}>Demander une réévaluation</button>
          </div>
          {work.assessment && <p className="rounded-lg border border-violet-500/20 p-2 text-xs text-violet-200">
            Réexamen {work.assessment.reviewStatus} · risque préliminaire {work.assessment.advisory.risk}.
            Vérifications proposées : {work.assessment.advisory.actions.join(' · ')}.
            Ce triage déterministe n'est pas une expertise IA, une estimation marchande ni une expertise d'assurance.
          </p>}
        </div>
        <details className="text-xs text-zinc-400">
          <summary className="cursor-pointer text-cyan-200">Historique signé et chaîné ({work.events.length} événements)</summary>
          <ol className="mt-2 space-y-1 max-h-56 overflow-y-auto">
            {work.events.map((e,i)=><li key={e.hash} className="break-all border-l border-white/10 pl-2">
              {i+1}. {e.type} · {new Date(e.at).toLocaleString()} · {e.actor}
              <span className="block text-[10px] text-zinc-600 font-mono">{e.hash.slice(0,24)}…</span>
            </li>)}
          </ol>
          <p className="mt-2">L'empreinte chaînée atteste la cohérence du journal interne ;
            elle n'est pas une notarisation blockchain indépendante.</p>
        </details>
      </div>}
      {notice && <p role="status" className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 text-sm text-cyan-100">{notice}</p>}
      {busy && <p className="text-xs text-zinc-400" role="status">Traitement en cours…</p>}
    </section>
  )
}
