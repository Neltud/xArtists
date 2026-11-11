/**
 * xArtists marketplace: separate artist originals, physical art and Agent Packs.
 * The existing API is only a listings discovery source; buying remains gated
 * on fresh on-chain codehash / reconciled contract status.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { canListBuyNft } from '../config/scStatus'
import RwaPhysicalPanel from '../components/market/RwaPhysicalPanel'
import DigitalPacksPanel from '../components/market/DigitalPacksPanel'
import OpenSeaCollectionPanel from '../components/market/OpenSeaCollectionPanel'
import ArtpriceOfficialPanel from '../components/market/ArtpriceOfficialPanel'
import ExistingNftReadiness from '../components/market/ExistingNftReadiness'
import LiaAndEscrowNfts from '../components/market/LiaAndEscrowNfts'
import MarketplaceDiscoveryGrid from '../components/market/MarketplaceDiscoveryGrid'
import MainnetJourney from '../components/MainnetJourney'
import {useCopy} from '../experience/state'

type Shelf='art'|'rwa'|'packs'|'opensea'
type Listing={
  listing_id?:string|number; identifier?:string;token?:string
  name?:string;price?:string|number;price_egld?:string|number
  creator?:string;collection?:string;media?:Array<{url?:string}>|string
  url?:string;thumbnail?:string
}
const SHELVES:{id:Shelf;name:string;summary:string}[]=[
  {id:'art',name:'marketShelfArtName',summary:'marketShelfArtSummary'},
  {id:'rwa',name:'marketShelfRwaName',summary:'marketShelfRwaSummary'},
  {id:'packs',name:'marketShelfPacksName',summary:'marketShelfPacksSummary'},
  {id:'opensea',name:'marketShelfOpenSeaName',summary:'marketShelfOpenSeaSummary'},
]
function priceEgld(l:Listing):number|null{
  const raw=l.price_egld // Never infer EGLD from a currency-less index price.
  if(raw===undefined||raw===null||String(raw)==='')return null
  const value=Number(raw)
  return Number.isFinite(value)&&value>0?value:null
}
function isPackListing(l:Listing):boolean{
  const tag=String(l.collection||l.token||l.identifier||'').toUpperCase()
  return ['XAIPLS','XAIYLD','XAISNT'].some(prefix=>tag.startsWith(prefix+'-'))
}
export default function MarketplacePage(){
  const c=useCopy()
  const live=canListBuyNft()
  const [params,setParams]=useSearchParams()
  const param=params.get('tab')
  const selected:Shelf=param==='rwa'||param==='packs'||param==='opensea'?param:'art'
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
  return <div className={"xa-page xa-marketplace animate-fade-in space-y-6 pb-24 max-w-6xl mx-auto"+(selected==='art'?" xa-marketplace--art":"")}>
    <header className="xa-marketplace-hero">
      <div className="xa-marketplace-hero__copy">
        <p className="xa-marketplace-hero__eyebrow">{c('marketHeroEyebrow')}</p>
        <h1>{c('marketHeroTitleA')}<span>{c('marketHeroTitleB')}</span></h1>
        <p className="xa-marketplace-hero__lead">{c('marketHeroLead')}</p>
        <div className="xa-marketplace-hero__actions">
          <a href="#xa-market-grid" className="xa-marketplace-hero__primary">
            {c('marketPrimaryCta')} <span aria-hidden="true">↓</span>
          </a>
          <Link to="/studio" className="xa-marketplace-hero__secondary">
            {c('marketStudioCta')} <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <nav className="xa-marketplace-hero__links" aria-label={c('marketSecondaryLabel')}>
          <Link to="/rwa">{c('marketPhysicalLink')}</Link>
          <Link to="/auction">{c('marketAuctionPreview')}</Link>
        </nav>
      </div>
      <div className="xa-marketplace-hero__index" aria-hidden="true">
        <span className="xa-marketplace-hero__index-label">{c('marketIndexLabel')}</span>
        <div><span>01</span><strong>{c('marketIndexDigital')}</strong></div>
        <div><span>02</span><strong>{c('marketIndexPhysical')}</strong></div>
        <div><span>03</span><strong>{c('marketIndexCreative')}</strong></div>
      </div>
    </header>



    <section className="xa-marketplace-categories" id="xa-market-categories" aria-labelledby="xa-market-categories-title">
      <div className="xa-marketplace-categories__heading">
        <h2 id="xa-market-categories-title">{c('marketExploreTitle')}</h2>
        <p>{c('marketExploreIntro')}</p>
      </div>
      <nav aria-label={c('marketCategoriesLabel')} className="xa-marketplace-categories__grid">
        {SHELVES.map((s,i)=><button key={s.id} type="button" onClick={()=>navigate(s.id)}
          aria-current={selected===s.id?'page':undefined}
          className={'xa-marketplace-category'+(selected===s.id?' is-active':'')}>
          <span className="xa-marketplace-category__number">{String(i+1).padStart(2,'0')}</span>
          <strong>{c(s.name)}</strong>
          <span className="xa-marketplace-category__summary">{c(s.summary)}</span>
        </button>)}
      </nav>
    </section>

    {selected==='art'&&<MarketplaceDiscoveryGrid
      listings={items} sourceReady={sourceReady} loading={loading} query={query} sort={sort}
      onQuery={setQuery} onSort={setSort} onRefresh={()=>void refresh()}
    />}

    {selected==='art'&&<details className="xa-market-tech">
      <summary>{c('marketGridTechTitle')}</summary>
      <div><LiaAndEscrowNfts /><ExistingNftReadiness /></div>
    </details>}

    <p className="xa-marketplace-status" role="note">
      <span className="xa-marketplace-status__dot" aria-hidden="true" />
      <span>
        {c('marketStatusPrefix')}: {c(live?'marketStatusLive':'marketStatusOff')}.
        {c('marketStatusOwnership')}
      </span>
    </p>

    {selected==='opensea'&&<OpenSeaCollectionPanel />}

    {(selected==='art'||selected==='rwa')&&<ArtpriceOfficialPanel />}

    {selected==='rwa'&&<section className="space-y-4" aria-label="Œuvres physiques">
      <div>
        <h2 className="text-lg font-semibold text-white">Art physique · provenance & livraison</h2>
        <p className="mt-1 text-xs text-zinc-400">La certification, la vente et la réception sont trois étapes distinctes.</p>
      </div>
      <RwaPhysicalPanel />
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ['01','Certifier','Photo originale, technique, dimensions, empreinte et certificat.'],
          ['02','Documenter','Dossier de provenance et prix de vente distincts de l’analyse du marché. Aucune vente directe active.'],
          ['03','Attester','Transport et réception nécessitent des preuves indépendantes ; service logistique indisponible.'],
        ].map(step=><div key={step[0]} className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
          <p className="text-xs font-mono text-amber-300">{step[0]}</p>
          <p className="mt-2 font-semibold text-white text-sm">{step[1]}</p>
          <p className="mt-1 text-xs text-zinc-400">{step[2]}</p>
        </div>)}
      </div>
      <p className="rounded-xl border border-amber-500/20 p-3 text-xs text-amber-100">
        Aucun marchand tiers ni paiement externe n’est connecté à ce catalogue.
        Les archives de ventes et les prix du marché nécessitent une source et une licence vérifiées.
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

    <MainnetJourney current="market" />

    <footer className="flex flex-wrap gap-3 border-t border-white/10 pt-5 text-xs text-zinc-400">
      <Link to="/studio" className="hover:text-cyan-200">Creator Studio</Link>
      <Link to="/marketplace?tab=opensea" className="hover:text-cyan-200">OpenSea · Solana / Polygon</Link>
      <Link to="/rwa" className="hover:text-cyan-200">Provenance RWA</Link>
      <Link to="/museum" className="hover:text-cyan-200">Musée</Link>
      <Link to="/auction" className="hover:text-cyan-200">Enchères</Link>
      <Link to="/agents" className="hover:text-cyan-200">Agents IA</Link>
      <span className="text-zinc-600">xArtists · Aucun achat sans contrôle wallet/contrat</span>
    </footer>
  </div>
}
