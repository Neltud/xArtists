import {useMemo,useState} from 'react'
import {Link} from 'react-router-dom'
import MuseumHall from '../components/museum/MuseumHall'
import {builtinBlueprintForMuseum} from '../lib/builtinBlueprints'
import {useWallet} from '../context/WalletContext'
import {useUserAccount} from '../hooks/useUserAccount'
import {addArtworkToDraft,galleryFrames,loadGalleryDraft,saveGalleryDraft,
  validateGalleryDraft,MAX_ART,newGalleryDraft,
  type GalleryDraft,type GalleryRole,type GalleryKind} from '../lib/creatorGalleryDraft.mjs'

const roles:{id:GalleryRole;label:string}[]=[
  {id:'artist',label:'Artiste'},{id:'gallery',label:'Galerie'},{id:'seller',label:'Vendeur'}]
const kinds:{id:GalleryKind;label:string}[]=[
  {id:'painting',label:'Peinture / image'},{id:'sculpture',label:'Sculpture'},
  {id:'nft',label:'NFT'},{id:'mixed',label:'Mixte / physique + NFT'}]
type Entry={title:string;artist:string;image:string;description:string;
  kind:GalleryKind;priceEgld:string}
const initial:Entry={title:'',artist:'',image:'',description:'',kind:'painting',priceEgld:''}
const inputClass='w-full rounded-lg border border-[color:var(--xa-border)] bg-[color:var(--xa-panel)] px-3 py-2 text-sm'

export default function CreatorGalleryPage(){
  const [draft,setDraft]=useState<GalleryDraft>(()=>loadGalleryDraft(window.localStorage))
  const [form,setForm]=useState<Entry>(initial)
  const [notice,setNotice]=useState('')
  const {connected,address}=useWallet()
  const account=useUserAccount(connected?address:null)
  const frames=useMemo(()=>galleryFrames(draft),[draft])
  const blueprint=useMemo(()=>builtinBlueprintForMuseum('xartists'),[])
  const update=(next:unknown)=>{
    const valid=validateGalleryDraft(next)
    if(!valid){setNotice('Brouillon invalide : modification refusée.');return}
    setDraft(valid)
    setNotice(saveGalleryDraft(valid,window.localStorage)
      ?'Sauvegardé sur cet appareil uniquement.':'Aperçu local : stockage indisponible.')
  }
  const add=()=>{
    if(!form.title.trim()){setNotice('Indique un titre.');return}
    const next=addArtworkToDraft(draft,{...form,
      priceEgld:form.priceEgld===''?null:Number(form.priceEgld)})
    if(!next){setNotice('Œuvre invalide ou 16 emplacements atteints.');return}
    update(next);setForm(initial)
  }
  const importWallet=()=>{
    if(!connected||account.loading||!account.nfts.length){setNotice('Aucun NFT chargé.');return}
    let next:GalleryDraft|null=draft
    let count=0
    for(const nft of account.nfts){
      if(!next||next.works.length>=MAX_ART)break
      if(next.works.some(w=>w.title===nft.identifier))continue
      next=addArtworkToDraft(next,{title:nft.name||nft.identifier,
        artist:address||'',image:nft.url||nft.media?.[0]?.url||'',
        kind:'nft',description:'NFT observé pour ce wallet ; vente non certifiée.'})
      if(next)count++
    }
    if(next&&count)update(next)
    setNotice(count+' NFT(s) ajoutés au brouillon, sans listing ni signature.')
  }
  const exportDraft=()=>{
    const safe=validateGalleryDraft(draft)
    if(!safe)return
    const url=URL.createObjectURL(new Blob([JSON.stringify(safe,null,2)],
      {type:'application/json'}))
    const a=document.createElement('a')
    a.href=url;a.download='xartists-exposition-brouillon.json';a.click()
    URL.revokeObjectURL(url)
    setNotice('Brouillon exporté, non publié.')
  }
  const field=(key:keyof Entry,value:string)=>setForm(v=>({...v,[key]:value}))
  return <main className="mx-auto max-w-6xl px-3 pb-20 pt-6 space-y-6"
    data-testid="creator-gallery">
    <header className="space-y-3">
      <p className="text-xs uppercase tracking-widest text-amber-500">xArtists · Expositions</p>
      <h1 className="text-3xl font-semibold">Créer ma galerie 3D</h1>
      <p className="max-w-3xl text-sm">
        Artistes, galeries et vendeurs : composez une salle immersive, accrochez
        vos œuvres et préparez vos fiches de vente. Visite WebGL ou mode mobile compatible.
      </p>
      <p className="rounded-xl border border-amber-500/50 px-4 py-3 text-sm"
        data-testid="gallery-readiness">
        Brouillon local — non publié, sans vente active. Prix indicatifs ;
        aucun paiement, NFT, droit ni propriété certifiés.
      </p>
    </header>
    <div className="grid gap-6 lg:grid-cols-[minmax(320px,2fr)_minmax(270px,1fr)]">
      <section className="min-w-0 space-y-4" aria-label="Salle immersive 3D">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">{draft.name||'Mon exposition'}</h2>
          <span>{frames.length} / {MAX_ART} œuvres</span>
        </div>
        <MuseumHall blueprint={blueprint} frames={frames} room="white" allowBuy={false}
          emptyLabel="Ajoutez une première œuvre pour aménager la salle."
          roomTitle={draft.name||'Exposition en préparation'}/>
        <div className="grid gap-2 sm:grid-cols-2" data-testid="gallery-work-grid">
          {draft.works.map(w=><article key={w.id} className="rounded-xl border p-3 space-y-2">
            <p className="font-semibold">{w.title}</p>
            <p className="text-sm">{w.artist||'Artiste non renseigné'} · {w.kind}</p>
            <p className="text-sm">{w.priceEgld===null?'Prix non indiqué':String(w.priceEgld)+' EGLD indicatifs'}</p>
            <p className="text-xs">Propriété, droits et listing : non vérifiés.</p>
            <button type="button" className="xa-button secondary"
              onClick={()=>update({...draft,works:draft.works.filter(x=>x.id!==w.id)})}>
              Retirer du brouillon
            </button>
          </article>)}
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link to="/explore/museum" className="xa-button secondary">Visiter le musée public</Link>
          <Link to="/explore/market" className="xa-button secondary">Consulter la marketplace</Link>
        </div>
      </section>
      <section className="space-y-4" aria-label="Éditeur de galerie">
        <div className="rounded-xl border p-4 space-y-3">
          <h2 className="text-lg font-semibold">1. Mon exposition</h2>
          <label className="block text-sm space-y-1">Profil
            <select className={inputClass} value={draft.role}
              onChange={e=>update({...draft,role:e.target.value})}>
              {roles.map(r=><option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </label>
          <label className="block text-sm space-y-1">Titre
            <input className={inputClass} maxLength={110} value={draft.name}
              onChange={e=>update({...draft,name:e.target.value})}/>
          </label>
          <label className="block text-sm space-y-1">Texte de présentation
            <textarea className={inputClass} maxLength={800} rows={3}
              value={draft.description}
              onChange={e=>update({...draft,description:e.target.value})}/>
          </label>
        </div>
        <div className="rounded-xl border p-4 space-y-3">
          <h2 className="text-lg font-semibold">2. Accrocher une œuvre</h2>
          <label className="block text-sm space-y-1">Titre *
            <input className={inputClass} maxLength={100} value={form.title}
              onChange={e=>field('title',e.target.value)}/>
          </label>
          <label className="block text-sm space-y-1">Artiste
            <input className={inputClass} maxLength={100} value={form.artist}
              onChange={e=>field('artist',e.target.value)}/>
          </label>
          <label className="block text-sm space-y-1">Support
            <select className={inputClass} value={form.kind}
              onChange={e=>field('kind',e.target.value)}>
              {kinds.map(k=><option key={k.id} value={k.id}>{k.label}</option>)}
            </select>
          </label>
          <label className="block text-sm space-y-1">Image HTTPS
            <input className={inputClass} type="url" value={form.image}
              onChange={e=>field('image',e.target.value)} placeholder="https://…"/>
          </label>
          <label className="block text-sm space-y-1">Prix envisagé (EGLD)
            <input className={inputClass} type="number" min="0" step="0.0001"
              value={form.priceEgld} onChange={e=>field('priceEgld',e.target.value)}/>
          </label>
          <label className="block text-sm space-y-1">Description et technique
            <textarea className={inputClass} maxLength={500} rows={2}
              value={form.description} onChange={e=>field('description',e.target.value)}/>
          </label>
          <button type="button" className="xa-button primary"
            disabled={draft.works.length>=MAX_ART} onClick={add}>Accrocher dans la salle</button>
        </div>
        <div className="rounded-xl border p-4 space-y-3">
          <h2 className="text-lg font-semibold">3. Mes NFT</h2>
          <p className="text-sm">Importer les NFT visibles dans votre wallet, sans mise en vente.</p>
          <button type="button" className="xa-button secondary"
            disabled={!connected||account.loading||!account.nfts.length||
              draft.works.length>=MAX_ART} onClick={importWallet}>
            {connected?'Importer mes NFT ('+account.nfts.length+')':'Wallet nécessaire pour importer'}
          </button>
        </div>
        <div className="rounded-xl border p-4 space-y-3">
          <h2 className="text-lg font-semibold">4. Préparer la publication</h2>
          <p className="text-sm">
            Ce brouillon est sauvegardé dans ce navigateur. Une galerie publique
            avec ventes nécessitera un compte vérifié, les droits sur les œuvres,
            un listing signé et une livraison vérifiée.
          </p>
          <div className="flex gap-2 flex-wrap">
            <button type="button" className="xa-button secondary" onClick={exportDraft}>
              Exporter le brouillon
            </button>
            <button type="button" className="xa-button secondary"
              onClick={()=>{update(newGalleryDraft());setNotice('Brouillon local réinitialisé.') }}>
              Effacer
            </button>
          </div>
          <p role="status" aria-live="polite" className="text-sm">{notice}</p>
          <p className="font-semibold text-sm">
            Publication, achat et vente : indisponibles dans cet éditeur.
          </p>
        </div>
      </section>
    </div>
  </main>
}
