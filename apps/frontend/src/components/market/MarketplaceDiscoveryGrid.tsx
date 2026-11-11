/**
 * Real marketplace browsing surface: actual curated public art assets and
 * read-only NFT inventory from MultiversX. Never infer a sale from ownership,
 * escrow custody, an API index record or a displayed price.
 */
import {useEffect,useMemo,useState} from 'react'
import {Link} from 'react-router-dom'
import {DRIVE_EXHIBITION} from '../../experience/DriveArtShowcase'
import {useCopy} from '../../experience/state'
import {LIA_OPS,MAINNET_ADDRESSES} from '../../config/contracts'

type ChainNft={identifier?:string;name?:string;collection?:string;balance?:number|string;url?:string;media?:Array<{url?:string;thumbnailUrl?:string}>}
type IndexListing={
  listing_id?:string|number;identifier?:string;token?:string;name?:string;
  price?:string|number;price_egld?:string|number;creator?:string;collection?:string;
  media?:Array<{url?:string}>|string;url?:string;thumbnail?:string
}
type Source='studio'|'owned'|'escrow'|'index'
type GalleryCard={key:string;title:string;sub:string;image:string|null;source:Source;href:string|null;price:number|null}
type Filter='all'|'studio'|'chain'|'index'
type Sort='recent'|'price_asc'|'price_desc'
const NFT=/^[A-Za-z0-9]{3,12}-[a-f0-9]{6}-[a-f0-9]{2,16}$/i
const API='https://api.multiversx.com'
const explorer=(identifier:string)=>NFT.test(identifier)
  ?'https://explorer.multiversx.com/nfts/'+encodeURIComponent(identifier):null
function imageUrl(raw:unknown):string|null{
  if(typeof raw!=='string'||raw.length>2048)return null
  if(/^ipfs:\/\/(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z2-7]{20,})(\/[A-Za-z0-9._~/-]+)?$/i.test(raw))
    return 'https://ipfs.io/ipfs/'+raw.slice(7)
  try{
    const url=new URL(raw)
    return url.protocol==='https:'&&!url.username&&!url.password?url.href:null
  }catch{return null}
}
function indexedEgld(value:unknown):number|null{
  if(value===undefined||value===null||String(value).trim()==='')return null
  const n=Number(value)
  return Number.isFinite(n)&&n>0?n:null
}
const fromNft=(n:ChainNft,source:'owned'|'escrow'):GalleryCard=>{
  const id=String(n.identifier||'')
  return {key:source+':'+id,title:String(n.name||id).slice(0,120),sub:String(n.collection||id).slice(0,80),
    image:imageUrl(n.media?.[0]?.thumbnailUrl||n.media?.[0]?.url||n.url),
    href:explorer(id),price:null,source}
}
export default function MarketplaceDiscoveryGrid({
  listings,sourceReady,loading,query,sort,onQuery,onSort,onRefresh,
}:{
  listings:IndexListing[];sourceReady:boolean;loading:boolean;query:string;sort:Sort;
  onQuery:(value:string)=>void;onSort:(value:Sort)=>void;onRefresh:()=>void;
}){
  const c=useCopy()
  const [filter,setFilter]=useState<Filter>('all')
  const [owned,setOwned]=useState<ChainNft[]>([])
  const [escrow,setEscrow]=useState<ChainNft[]>([])
  const [chainLoading,setChainLoading]=useState(true)
  const [chainError,setChainError]=useState(false)
  useEffect(()=>{
    const controller=new AbortController()
    const read=async(address:string):Promise<ChainNft[]>=>{
      const response=await fetch(API+'/accounts/'+encodeURIComponent(address)+'/nfts?size=60',
        {signal:controller.signal,cache:'no-store'})
      if(!response.ok)throw Error('nft_api_unavailable')
      const data:unknown=await response.json()
      if(!Array.isArray(data))throw Error('nft_api_invalid')
      return data.filter((item):item is ChainNft=>Boolean(item)&&typeof item==='object'&&
        NFT.test(String((item as ChainNft).identifier||''))&&
        Number((item as ChainNft).balance??1)>0).slice(0,24)
    }
    Promise.allSettled([read(LIA_OPS),read(MAINNET_ADDRESSES.nft_marketplace)])
      .then(([ownerResult,escrowResult])=>{
        if(controller.signal.aborted)return
        if(ownerResult.status==='fulfilled')setOwned(ownerResult.value)
        if(escrowResult.status==='fulfilled')setEscrow(escrowResult.value)
        setChainError(ownerResult.status==='rejected'||escrowResult.status==='rejected')
      }).finally(()=>{if(!controller.signal.aborted)setChainLoading(false)})
    return()=>controller.abort()
  },[])
  const all=useMemo<GalleryCard[]>(()=>{
    // The four works are actual public xArtists media, not fake NFT listings.
    const studio:GalleryCard[]=DRIVE_EXHIBITION.map(w=>({
      key:'studio:'+w.id,title:w.id,sub:'xArtists · Atelier',
      image:import.meta.env.BASE_URL+'art/drive/'+w.file,href:'/museum',price:null,source:'studio',
    }))
    const seen=new Set<string>()
    const onChain=[...escrow.map(n=>fromNft(n,'escrow')),...owned.map(n=>fromNft(n,'owned'))]
      .filter(card=>{const id=card.key.split(':')[1];if(seen.has(id))return false;seen.add(id);return true})
      .slice(0,24)
    const indexed:GalleryCard[]=sourceReady?listings.filter(l=>{
      const id=String(l.identifier||l.token||'')
      return !id||!seen.has(id)
    }).slice(0,24).map((l,i)=>{
      const identifier=String(l.identifier||l.token||'')
      const media=typeof l.media==='string'?l.media:Array.isArray(l.media)?l.media[0]?.url:undefined
      return {key:'index:'+String(l.listing_id??identifier??i)+':'+i,
        title:String(l.name||identifier||'NFT').slice(0,120),
        sub:String(l.creator||l.collection||identifier||'').slice(0,80),
        image:imageUrl(l.thumbnail||media),
        href:explorer(identifier),price:indexedEgld(l.price_egld),source:'index'}
    }):[]
    return [...studio,...onChain,...indexed]
  },[escrow,owned,listings,sourceReady])
  const cards=useMemo(()=>{
    const needle=query.trim().toLocaleLowerCase()
    const matches=all.filter(card=>
      (filter==='all'||filter==='studio'&&card.source==='studio'||
       filter==='chain'&&(card.source==='owned'||card.source==='escrow')||
       filter==='index'&&card.source==='index') &&
      (!needle||[card.title,card.sub,card.key].some(text=>text.toLocaleLowerCase().includes(needle))))
    if(sort==='price_asc')matches.sort((a,b)=>(a.price??Infinity)-(b.price??Infinity))
    if(sort==='price_desc')matches.sort((a,b)=>(b.price??-1)-(a.price??-1))
    return matches.slice(0,48)
  },[all,filter,query,sort])
  const filters:Filter[]=['all','studio','chain','index']
  const filterText:Record<Filter,string>={
    all:c('marketGridAll'),studio:c('marketGridStudio'),chain:c('marketGridChain'),index:c('marketGridIndex'),
  }
  return <section className="xa-market-grid" id="xa-market-grid" aria-labelledby="xa-market-grid-title">
    <div className="xa-market-grid__heading">
      <div>
        <p className="xa-market-grid__eyebrow">xArtists / NFT / ART</p>
        <h2 id="xa-market-grid-title">{c('marketGridTitle')}</h2>
        <p>{c('marketGridDescription')}</p>
      </div>
      <span className="xa-market-grid__count" aria-live="polite">{cards.length} {c('marketGridResults')}</span>
    </div>
    <div className="xa-market-grid__toolbar">
      <label className="xa-market-grid__search">
        <span className="sr-only">{c('marketGridSearch')}</span>
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></svg>
        <input value={query} onChange={e=>onQuery(e.target.value)}
          placeholder={c('marketGridSearch')} type="search" />
      </label>
      <label className="xa-market-grid__sort">
        <span>{c('marketGridSort')}</span>
        <select value={sort} onChange={e=>onSort(e.target.value as Sort)}>
          <option value="recent">{c('marketGridRecent')}</option>
          <option value="price_asc">{c('marketGridLow')}</option>
          <option value="price_desc">{c('marketGridHigh')}</option>
        </select>
      </label>
    </div>
    <div className="xa-market-grid__filters" role="group" aria-label={c('marketGridFilters')}>
      {filters.map(f=><button type="button" key={f} aria-pressed={filter===f}
        className={filter===f?'is-active':''} onClick={()=>setFilter(f)}>{filterText[f]}</button>)}
      <button type="button" className="xa-market-grid__refresh" onClick={onRefresh} disabled={loading}>
        {loading?'…':c('refresh')}
      </button>
    </div>
    <p className="xa-market-grid__notice" role="note">{c('marketGridNotice')}</p>
    {sourceReady&&listings.length>0&&<p className="xa-market-grid__source-note" role="note">{c('marketIndexDataDisclaimer')}</p>}
    {cards.length>0?<ul className="xa-market-grid__cards" aria-label={c('marketGridTitle')}>
      {cards.map((card,i)=>{
        const badge=card.source==='studio'?'marketGridExhibit':card.source==='owned'?
          'marketGridHeld':card.source==='escrow'?'marketGridDeposit':'marketGridIndexed'
        const details=card.source==='index'?card.price!==null?
          card.price.toFixed(4)+' EGLD · '+c('marketGridUnverified'):
          c('marketPriceUnknown'):card.source==='studio'?
          c('marketGridNotListed'):c('marketGridSaleUnverified')
        return <li key={card.key} className="xa-market-grid__card">
          <div className="xa-market-grid__media">
            <span className="xa-market-grid__placeholder" aria-hidden="true">xA</span>
            {card.image&&<img src={card.image} alt={card.title} loading={i<4?'eager':'lazy'}
              decoding="async" onError={e=>{e.currentTarget.style.display='none'}} />}
            <span className="xa-market-grid__badge">{c(badge)}</span>
          </div>
          <div className="xa-market-grid__card-body">
            <p className="xa-market-grid__collection">{card.sub}</p>
            <h3 title={card.title}>{card.title}</h3>
            <p className="xa-market-grid__price"
              title={card.source==='index'?c('marketIndexPriceDisclaimer'):undefined}>{details}</p>
            {card.href?(card.source==='studio'
              ?<Link to={card.href} className="xa-market-grid__card-action">
                {c('marketGridViewArt')} <span aria-hidden="true">↗</span></Link>
              :<a href={card.href} target="_blank" rel="noopener noreferrer" className="xa-market-grid__card-action">
                {c('marketGridVerify')} <span aria-hidden="true">↗</span></a>)
              :<span className="xa-market-grid__card-inactive">{c('marketGridNoLink')}</span>}
          </div>
        </li>
      })}
    </ul>:<div className="xa-market-grid__empty" role="status">
      {chainLoading?c('marketGridLoading'):c('marketGridEmpty')}
      {(filter!=='all'||query)&&<button type="button" onClick={()=>{setFilter('all');onQuery('')}}>{c('marketGridReset')}</button>}
    </div>}
    {chainError&&<p className="xa-market-grid__source-note">{c('marketGridChainUnavailable')}</p>}
    {!sourceReady&&!loading&&<p className="xa-market-grid__source-note">{c('marketGridIndexUnavailable')}</p>}
  </section>
}
