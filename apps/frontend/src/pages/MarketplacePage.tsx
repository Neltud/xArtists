/**
 * xArtists marketplace: separate artist originals, physical art and Agent Packs.
 * The existing API is only a listings discovery source; buying remains gated
 * on fresh on-chain codehash / reconciled contract status.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { requestOpenConnect } from '../lib/walletEvents'
import { canListBuyNft } from '../config/scStatus'
import RwaPhysicalPanel from '../components/market/RwaPhysicalPanel'
import DigitalPacksPanel from '../components/market/DigitalPacksPanel'

type Shelf='art'|'rwa'|'packs'
type Listing={
  listing_id?:string|number; identifier?:string;token?:string
  name?:string;price?:string|number;price_egld?:string|number
  creator?:string;collection?:string;media?:Array<{url?:string}>|string
  url?:string;thumbnail?:string
}
const SHELVES:{id:Shelf;name:string;summary:string}[]=[
  {id:'art',name:'Art numérique',summary:'NFT JPG, images et vidéos MP4 de créateurs'},
  {id:'rwa',name:'Œuvres physiques',summary:'Provenance, livraison et certificats phygitaux'},
  {id:'packs',name:'Packs IA',summary:'Pulse, Yield et Sentinel — droits d’accès distincts'},
]
function asText(value:unknown,max=120):string{
  return typeof value==='string'?value.slice(0,max):value==null?'':String(value).slice(0,max)
}
function priceEgld(l:Listing):number|null{
  const raw=l.price_egld??l.price
  if(raw===undefined||raw===null||String(raw)==='')return null
  const value=Number(raw)
  return Number.isFinite(value)&&value>0?value:null
}
function safeArtworkImage(l:Listing):string|null{
  const source=typeof l.media==='string'?l.media:Array.isArray(l.media)?l.media[0]?.url:undefined
  const url=String(l.thumbnail||source||l.url||'')
  if(/^ipfs:\/\/(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z2-7]{20,})(\/[A-Za-z0-9._~/-]+)?$/i.test(url))
    return 'https://ipfs.io/ipfs/'+url.slice(7)
  try{
    const parsed=new URL(url)
    return parsed.protocol==='https:'&&parsed.username===''&&parsed.password===''?url:null
  }catch{return null}
}
function isPackListing(l:Listing):boolean{
  const tag=String(l.collection||l.token||l.identifier||'').toUpperCase()
  return ['XAIPLS','XAIYLD','XAISNT'].some(prefix=>tag.startsWith(prefix+'-'))
}
function isNftId(v:string):boolean{
  return /^[A-Z0-9]{3,10}-[a-f0-9]{6}-[a-f0-9]+$/i.test(v)
}
export default function MarketplacePage(){
  const {connected}=useWallet()
  const live=canListBuyNft()
  const [params,setParams]=useSearchParams()
  const param=params.get('tab')
  const selected:Shelf=param==='rwa'||param==='packs'?'rwa'===param?'rwa':'packs':'art'
  const [listings,setListings]=useState<Listing[]>([])
  const [loading,setLoading]=useState(false)
  const [sourceReady,setSourceReady]=useState(false)
  const [query,setQuery]=useState('')
  const [sort,setSort]=useState<'recent'|'price_asc'|'price_desc'>('recent')

  const refresh=useCallback(async()=>{
    setLoading(true)
    try{
      const base=(import.meta.env.VITE_API_BASE as string|undefined)||''
      if(!/^https:\/\//.test(base)){setListings([]);setSourceReady(false);return}
      const r=await fetch(base.replace(/\/$/,'')+'/marketplace/listings',
        {cache:'no-store',signal:AbortSignal.timeout(10000)})
      if(!r.ok)throw new Error('market_index_unavailable')
      const json=await r.json() as {listings?:unknown;items?:unknown}|unknown[]
      const rows=Array.isArray(json)?json:Array.isArray(json.listings)?json.listings:json.items
      if(!Array.isArray(rows))throw new Error('market_index_invalid')
      setListings(rows.filter((item):item is Listing=>Boolean(item)&&typeof item==='object').slice(0,200))
      setSourceReady(true)
    }catch{setListings([]);setSourceReady(false)}
    finally{setLoading(false)}
  },[])
  useEffect(()=>{if(selected==='art')void refresh()},[selected,refresh])
  const items=useMemo(()=>{
    const needle=query.trim().toLowerCase()
    const filtered=listings.filter(l=>!isPackListing(l)).filter(l=>
      !needle||[l.name,l.identifier,l.collection,l.creator].some(v=>
        String(v||'').toLowerCase().includes(needle)))
    if(sort==='price_asc')filtered.sort((a,b)=>(priceEgld(a)??Infinity)-(priceEgld(b)??Infinity))
    else if(sort==='price_desc')filtered.sort((a,b)=>(priceEgld(b)??-1)-(priceEgld(a)??-1))
    return filtered.slice(0,48)
  },[listings,query,sort])

  const navigate=(next:Shelf)=>{
    const v=new URLSearchParams(params)
    if(next==='art')v.delete('tab')
    else v.set('tab',next)
    setParams(v)
  }
  return <div className="xa-page animate-fade-in space-y-6 pb-24 max-w-6xl mx-auto">
    <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-950 via-slate-950 to-violet-950 px-5 py-8 sm:px-8 sm:py-10 space-y-4">
      <p className="section-label">xArtists · Creator Marketplace</p>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl text-white">
        L’art physique rencontre le Web3
      </h1>
      <p className="max-w-2xl text-sm leading-relaxed text-zinc-300">
        Découvrez les créations numériques, les œuvres tangibles et les produits IA.
        Trois univers, des droits différents, des statuts de vente transparents.
      </p>
      <div className="flex flex-wrap gap-2">
        <Link to="/studio" className="btn-primary inline-flex min-h-[44px] items-center px-4 text-sm">
          Créer et minter mon NFT
        </Link>
        <Link to="/rwa" className="btn-secondary inline-flex min-h-[44px] items-center px-4 text-sm">
          Certifier une œuvre physique
        </Link>
        {!connected&&<button type="button" className="btn-secondary min-h-[44px] px-4 text-sm"
          onClick={requestOpenConnect}>Connecter xPortal</button>}
      </div>
      <p className="text-[11px] text-zinc-500">
        Marketplace NFT : {live?'contrat compatible détecté — vérifier chaque transaction':'transactions désactivées tant que le contrat et son codehash ne sont pas validés'}.
        Les certificats ne sont pas automatiquement des titres de propriété.
      </p>
    </header>

    <nav aria-label="Catégories d’œuvres" className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {SHELVES.map(s=><button key={s.id} type="button" onClick={()=>navigate(s.id)}
        aria-current={selected===s.id?'page':undefined}
        className={'min-h-[78px] rounded-2xl border px-4 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 '+
          (selected===s.id?'border-cyan-400/50 bg-cyan-500/10 text-white':'border-white/10 bg-white/[0.025] text-zinc-300 hover:bg-white/5')}>
        <span className="block text-sm font-semibold">{s.name}</span>
        <span className="block mt-1 text-[11px] text-zinc-400 leading-relaxed">{s.summary}</span>
      </button>)}
    </nav>

    {selected==='art'&&<section className="space-y-4" aria-label="Art numérique">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Art numérique · créations originales</h2>
          <p className="text-xs text-zinc-400 mt-1">
            JPG, PNG, WebP et MP4 · liens IPFS · vente seulement quand un listing on-chain est vérifié.
          </p>
        </div>
        <button type="button" className="btn-secondary text-xs min-h-[40px] px-3"
          disabled={loading} onClick={()=>void refresh()}>
          {loading?'Actualisation…':'Actualiser le catalogue'}
        </button>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <label className="flex-1 text-xs text-zinc-400">Rechercher un artiste, titre ou NFT
          <input value={query} onChange={e=>setQuery(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-white"
            placeholder="Titre, collection, artiste…" />
        </label>
        <label className="text-xs text-zinc-400">Trier
          <select value={sort} onChange={e=>setSort(e.target.value as typeof sort)}
            className="mt-1 block w-full rounded-xl border border-white/10 bg-zinc-950 p-3 text-white">
            <option value="recent">Par défaut</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
          </select>
        </label>
      </div>
      {!sourceReady&&!loading&&<div className="rounded-2xl border border-amber-500/20 p-5 text-sm text-zinc-300 space-y-2">
        <p className="font-semibold text-white">Catalogue de ventes vérifiées non disponible</p>
        <p>Nous n’inventons ni NFT en vente, ni prix, ni bouton d’achat. La connexion à l’index des listings
          et au contrat marketplace doit être validée.</p>
        <Link to="/studio" className="inline-block text-cyan-300 underline">Publier d’abord mon œuvre depuis Studio</Link>
      </div>}
      {sourceReady&&!loading&&items.length===0&&<div className="rounded-2xl border border-white/10 p-5 text-sm text-zinc-400 space-y-2">
        <p>Aucune œuvre numérique indexée pour ce filtre.</p>
        <Link to="/studio" className="text-cyan-200 underline">Créer mon premier NFT</Link>
      </div>}
      {items.length>0&&<ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((l,i)=>{
          const id=asText(l.identifier||l.token)
          const url=safeArtworkImage(l)
          const price=priceEgld(l)
          return <li key={asText(l.listing_id??id??i)} className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
            <div className="aspect-[4/3] bg-slate-900/60 flex items-center justify-center">
              {url?<img src={url} alt={asText(l.name)||'Œuvre numérique'} loading="lazy"
                className="h-full w-full object-cover"/>:<span className="text-sm text-zinc-500">NFT · aperçu indisponible</span>}
            </div>
            <div className="p-4 space-y-2">
              <p className="font-semibold text-white line-clamp-2">{asText(l.name||id||'Œuvre')}</p>
              <p className="text-xs text-zinc-400 truncate">{asText(l.creator||l.collection||id)}</p>
              <p className="text-sm font-mono text-cyan-200">{price!==null?price.toFixed(4)+' EGLD':'Prix non confirmé'}</p>
              <div className="flex flex-wrap gap-2">
                {isNftId(id)&&<a href={'https://explorer.multiversx.com/nfts/'+encodeURIComponent(id)}
                  target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs min-h-[40px] inline-flex items-center px-3">Vérifier sur Explorer</a>}
                {!live&&<span className="text-xs text-zinc-500 self-center">Achat désactivé · contrat non validé</span>}
                {live&&<span className="text-xs text-zinc-400 self-center">Vérifiez le listing avant toute signature</span>}
              </div>
            </div>
          </li>
        })}
      </ul>}
    </section>}

    {selected==='rwa'&&<section className="space-y-4" aria-label="Œuvres physiques">
      <div>
        <h2 className="text-lg font-semibold text-white">Art physique · provenance & livraison</h2>
        <p className="mt-1 text-xs text-zinc-400">La certification, la vente et la réception sont trois étapes distinctes.</p>
      </div>
      <RwaPhysicalPanel />
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ['01','Certifier','Photo originale, technique, dimensions, empreinte et certificat.'],
          ['02','Vendre','Une seule commande active par œuvre. Offre Shopify à activer et vérifier.'],
          ['03','Livrer','Suivi, réception signée par l’acheteur, litige et revue de l’état.'],
        ].map(step=><div key={step[0]} className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
          <p className="text-xs font-mono text-amber-300">{step[0]}</p>
          <p className="mt-2 font-semibold text-white text-sm">{step[1]}</p>
          <p className="mt-1 text-xs text-zinc-400">{step[2]}</p>
        </div>)}
      </div>
      <p className="rounded-xl border border-amber-500/20 p-3 text-xs text-amber-100">
        Vente d’œuvres physiques sur Etsy : possible sous les règles de l’art original du vendeur ;
        la vente de NFT sur Etsy est interdite. Ne pas diriger un paiement Etsy vers xArtists.
        Les NFT et la propriété matérielle restent juridiquement distincts.
      </p>
      <Link to="/rwa" className="btn-primary inline-flex min-h-[44px] items-center px-4 text-sm">
        Enregistrer ou suivre mon œuvre
      </Link>
    </section>}

    {selected==='packs'&&<section className="space-y-4" aria-label="Packs IA">
      <div>
        <h2 className="text-lg font-semibold text-white">Packs IA · accès distincts de l’art</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Pulse, Yield et Sentinel ne sont pas des tableaux, et leurs droits d’accès ne sont pas
          transférés par un NFT d’artiste.
        </p>
      </div>
      <DigitalPacksPanel />
    </section>}

    <footer className="flex flex-wrap gap-3 border-t border-white/10 pt-5 text-xs text-zinc-400">
      <Link to="/studio" className="hover:text-cyan-200">Creator Studio</Link>
      <Link to="/rwa" className="hover:text-cyan-200">Provenance RWA</Link>
      <Link to="/museum" className="hover:text-cyan-200">Musée</Link>
      <Link to="/agents" className="hover:text-cyan-200">Agents IA</Link>
      <span className="text-zinc-600">xArtists · Aucun achat sans contrôle wallet/contrat</span>
    </footer>
  </div>
}
