import {Suspense,useCallback,useEffect,useMemo,useState} from 'react'
import {Link,useLocation,useParams,useSearchParams} from 'react-router-dom'
import {modules,groups,type Group,type Module} from './modules'
import { isCoreModule } from './softLaunch'
import {useCopy} from './state'
import {useI18n} from '../i18n/I18nContext'
import Icon from './Icon'
import RouteErrorBoundary from '../components/RouteErrorBoundary'
import GenesisPackShelf from '../components/packs/GenesisPackShelf'
import HomeHeroSculpture from './HomeHeroSculpture'
import { MultiversXProvider } from '../context/MultiversXContext'
const API='https://api.multiversx.com'

export function Loader(){const c=useCopy();return <div className="xa-loading" role="status"><span className="xa-loader"/><span>{c('commonLoading')}</span></div>}
export function ModuleCard({module:m,index=0}:{module:Module;index?:number}){const c=useCopy();return <Link className="xa-module-card" to={m.path}><div className="xa-card-top"><span className="xa-module-icon"><Icon name={m.icon} size={23}/></span><span className="xa-card-number">{String(index+1).padStart(2,'0')}</span><Icon name="diagonal" size={17}/></div><h3>{c(m.label)}</h3><div className="xa-card-tags"><span>{c(m.group)}</span>{!isCoreModule(m)&&<span>{c('demoLabel')}</span>}</div></Link>}
export function NetworkStrip(){
 const c=useCopy(),{lang}=useI18n(),[data,setData]=useState<any>(null),[loading,setLoading]=useState(true),[error,setError]=useState(false)
 const load=useCallback(()=>{const abort=new AbortController();setLoading(true);setError(false);const timer=setTimeout(()=>abort.abort(),10000);Promise.all([fetch(`${API}/economics`,{signal:abort.signal}).then(r=>{if(!r.ok)throw Error();return r.json()}),fetch(`${API}/stats`,{signal:abort.signal}).then(r=>{if(!r.ok)throw Error();return r.json()})]).then(([e,s])=>setData({...e,epoch:s.epoch})).catch(()=>setError(true)).finally(()=>{setLoading(false);clearTimeout(timer)});return()=>{abort.abort();clearTimeout(timer)}},[])
 useEffect(load,[load])
 const nf=new Intl.NumberFormat(lang,{maximumFractionDigits:2}),valid=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)
 return <section className="xa-network-strip" aria-label={c('liveData')}><div className="xa-network-brand"><span className="xa-network-glyph">✳</span><div><b>MultiversX</b><small>{c('liveData')}</small></div></div><div><span>{c('price')}</span><b>{valid(data?.price)?new Intl.NumberFormat(lang,{style:'currency',currency:'USD',maximumFractionDigits:2}).format(data.price):loading?'···':'—'}</b></div><div><span>{c('supply')}</span><b>{valid(data?.circulatingSupply)?nf.format(data.circulatingSupply):loading?'···':'—'}<small>EGLD</small></b></div><div><span>{c('block')}</span><b>{valid(data?.epoch)?nf.format(data.epoch):loading?'···':'—'}</b></div><button className="xa-icon-button" onClick={load} disabled={loading} aria-label={c('refresh')} title={error?c('unavailable'):c('refresh')}><Icon name="refresh" size={17}/></button>{error&&<small className="xa-data-status" role="status">{c('unavailable')}</small>}</section>
}
export function Home(){
 const c=useCopy()
 const journeys=[
  {id:'visit',to:'/museum',label:c('welcomeExplore'),desc:c('welcomeExploreDesc'),icon:'museum'},
  {id:'create',to:'/studio',label:c('welcomeCreate'),desc:c('welcomeCreateDesc'),icon:'create'},
  {id:'market',to:'/marketplace',label:c('welcomeMarket'),desc:c('welcomeMarketDesc'),icon:'market'},
  {id:'dao',to:'/dao',label:c('welcomeDao'),desc:c('welcomeDaoDesc'),icon:'network'},
 ]
 return <div className="xa-container xa-first-visit">
  <section className="xa-first-hero" aria-labelledby="xa-first-title">
   <div>
    <p className="xa-eyebrow">{c('welcomeEyebrow')}</p>
    <h1 id="xa-first-title">{c('welcomeTitle')}</h1>
    <p className="xa-first-lead">{c('welcomeIntro')}</p>
    <div className="xa-first-actions">
     <Link className="xa-button primary" to="/museum">{c('welcomeExplore')}<Icon name="arrow" size={17}/></Link>
     <Link className="xa-button secondary" to="/directory">{c('directory')}<Icon name="arrow" size={17}/></Link>
    </div>
    <p className="xa-first-privacy">{c('optional')}</p>
   </div>
   <div className="xa-first-art" aria-hidden="true"><span>✳</span><i/><i/><i/></div>
  </section>
  <section className="xa-first-journeys" aria-labelledby="xa-first-what">
   <div className="xa-first-heading">
    <div><p className="xa-eyebrow">xArtists</p><h2 id="xa-first-what">{c('welcomeAsk')}</h2></div>
    <div className="xa-first-quicklinks"><Link to="/auction" className="xa-text-link">{c('auction')}<Icon name="arrow" size={16}/></Link><Link to="/guide" className="xa-text-link">{c('help')}<Icon name="arrow" size={16}/></Link></div>
   </div>
   <ul className="xa-first-tiles">
    {journeys.map((a,i)=><li key={a.id}>
      <Link className="xa-first-tile" to={a.to}>
       <span className="xa-first-tile-top"><Icon name={a.icon} size={24}/><span>0{i+1}</span></span>
       <strong>{a.label}</strong>
       <span className="xa-first-tile-desc">{a.desc}</span>
       <span className="xa-first-tile-bottom">{c('open')}<Icon name="arrow" size={17}/></span>
      </Link>
    </li>)}
   </ul>
  </section>
  <section className="xa-first-access" aria-labelledby="xa-first-networks">
   <div>
    <p className="xa-eyebrow">xArtists · Multi-chain</p>
    <h2 id="xa-first-networks">{c('welcomeNetworks')}</h2>
    <p>{c('welcomeNetworksDesc')}</p>
    <p className="xa-first-access-warning">{c('welcomeNoBridge')}</p>
   </div>
   <div className="xa-first-network-list">
    <Link to="/marketplace" className="xa-first-network"><span>{c('welcomeMx')}</span><Icon name="arrow" size={16}/></Link>
    <Link to="/marketplace?tab=opensea" className="xa-first-network"><span>{c('welcomeOpenSea')}</span><Icon name="arrow" size={16}/></Link>
    <Link to="/offres" className="xa-first-network"><span>{c('welcomeEuros')}</span><Icon name="arrow" size={16}/></Link>
   </div>
  </section>
  <section className="xa-first-tools" aria-labelledby="xa-first-tools">
   <div><h2 id="xa-first-tools">{c('welcomeSeeAll')}</h2><p>{c('welcomeToolsLead')}</p></div>
   <Link to="/directory" className="xa-button secondary">{c('directory')}<Icon name="arrow" size={16}/></Link>
  </section>
  <details className="xa-first-details">
   <summary>{c('welcomeAdvanced')}</summary>
   <p>{c('welcomeMx')}. {c('welcomeOpenSea')}. {c('welcomeEuros')}. {c('welcomeNoBridge')}</p>
   <Link to="/lia" className="xa-first-context-link">{c('lia')}<Icon name="arrow" size={14}/></Link> <Link to="/go-live" className="xa-first-context-link">{c('status')}<Icon name="arrow" size={14}/></Link>
  </details>
 </div>
}

export function GroupPage({group}:{group:Group}){
 const c=useCopy()
 const [q,setQ]=useState('')
 const needle=q.trim().toLowerCase()
 const list=modules.filter(m=>m.group===group&&
  [c(m.label),c(m.group),...m.tags].join(' ').toLowerCase().includes(needle))
 return <div className={`xa-container xa-group-page group-${group}`}>
  <div className="xa-page-intro">
   <div><div className="xa-breadcrumb"><Link to="/">xArtists</Link><Icon name="chevron" size={12}/><span>{c(group)}</span></div>
    <div className="xa-eyebrow">{c('welcomeSeeAll')}</div>
    <h1>{c(group)}<span>↗</span></h1>
    <p>{c('welcomeToolsLead')}</p>
   </div>
  </div>
  <div className="xa-directory-head">
   <h2>{c('modules')}<span>{list.length}</span></h2>
   <label className="xa-filter-search"><Icon name="search" size={17}/>
    <input value={q} onChange={e=>setQ(e.target.value)} placeholder={c('search')} aria-label={c('search')}/>
   </label>
  </div>
  <div className="xa-module-grid">{list.map((m,k)=><ModuleCard key={m.id} module={m} index={k}/>)}</div>
  {!list.length&&<p className="xa-empty" role="status">{c('noResults')}</p>}
  <p className="mt-8 text-sm text-[color:var(--xa-muted)]">
   <Link className="xa-text-link" to={`/directory?group=${group}`}>{c('directory')}<Icon name="arrow" size={17}/></Link>
  </p>
  {group==='explore'&&<details className="xa-first-details">
   <summary>{c('discoverArt')}</summary><ArtworkGrid/>
  </details>}
 </div>
}
export function Directory(){const c=useCopy();const [params,setParams]=useSearchParams();const group=params.get('group')||'all',q=params.get('q')||'';const set=(key:string,val:string)=>setParams(p=>{const next=new URLSearchParams(p);val&&val!=='all'?next.set(key,val):next.delete(key);return next},{replace:true});const list=modules.filter(m=>(group==='all'||m.group===group)&&[c(m.label),c(m.group),...m.tags,m.path,...m.aliases].join(' ').toLowerCase().includes(q.toLowerCase()));return <div className="xa-container xa-directory-page"><div className="xa-page-intro"><div><div className="xa-eyebrow">xArtists / {c('modules')}</div><h1>{c('directory')}<span>↗</span></h1><p>{c('welcomeToolsLead')}</p></div><span className="xa-directory-count">{list.length.toString().padStart(2,'0')}<small>{c('modules')}</small></span></div><div className="xa-directory-controls"><div className="xa-filter-tabs" role="group" aria-label={c('filter')}>{['all',...groups].map(g=><button key={g} className={group===g?'active':''} onClick={()=>set('group',g)} aria-pressed={group===g}>{c(g)}</button>)}</div><label className="xa-filter-search"><Icon name="search" size={17}/><input value={q} onChange={e=>set('q',e.target.value)} placeholder={c('search')} aria-label={c('search')}/></label></div><div className="xa-module-grid">{list.map((m,i)=><ModuleCard module={m} index={i} key={m.id}/>)}</div>{!list.length&&<p className="xa-empty" role="status">{c('noResults')}</p>}</div>}
export function ModulePage({module:m}:{module:Module}){const c=useCopy(),Page=m.page;const [navOpen,setNavOpen]=useState(false);const related=modules.filter(x=>x.group===m.group&&x.id!==m.id);return <div className="xa-container xa-module-page"><div className="xa-breadcrumb"><Link to="/">xArtists</Link><Icon name="chevron" size={12}/><Link to={'/'+m.group}>{c(m.group)}</Link><Icon name="chevron" size={12}/><span>{c(m.label)}</span></div><div className="xa-module-layout"><aside className={`xa-module-sidebar ${navOpen?'is-open':''}`}><button className="xa-sidebar-toggle" onClick={()=>setNavOpen(!navOpen)} aria-expanded={navOpen}><Icon name="layers" size={18}/>{c(m.group)}<Icon name="chevron" size={14}/></button><nav aria-label={c(m.group)}><Link to={'/'+m.group} className="xa-sidebar-back"><Icon name="arrow" size={15}/>{c(m.group)}</Link>{modules.filter(x=>x.group===m.group).map(x=><Link to={x.path} key={x.id} className={m.id===x.id?'active':''} aria-current={m.id===x.id?'page':undefined} onClick={()=>setNavOpen(false)}><Icon name={x.icon} size={17}/>{c(x.label)}</Link>)}<div className="xa-sidebar-bottom"><Link to={'/directory?group='+m.group}><Icon name="search" size={17}/>{c('directory')}</Link></div></nav></aside><div className="xa-module-content">{m.id!=='tro-crosschain'&&m.id!=='rwa'&&<><header className="xa-module-heading"><div><div className="xa-eyebrow">{c(m.group)}</div><h1>{c(m.label)}</h1></div><span className="xa-module-icon"><Icon name={m.icon} size={26}/></span></header><p className="xa-module-intro">{m.id==='market'?c('welcomeMarketDesc'):m.id==='studio'?c('welcomeCreateDesc'):m.id==='dao'?c('daoIntroPlain'):c(m.group+'Desc')}</p>{!isCoreModule(m)&&<p className="xa-module-preview">{c('demoLabel')} · {c('welcomeToolsLead')}</p>}<details className="xa-module-technical"><summary>{c('welcomeAdvanced')}</summary><div className="xa-module-tags">{m.tags.map(tag=><span key={tag}>{tag}</span>)}</div></details></>}<section className="xa-module-body" aria-label={c(m.label)}><Suspense fallback={<Loader/>}><RouteErrorBoundary key={m.id} label={c(m.label)}>{(m.id==='hatom'||m.id==='tip')?<MultiversXProvider><Page/></MultiversXProvider>:<Page/>}</RouteErrorBoundary></Suspense></section><div className="xa-related"><h2>{c('related')}</h2><div>{related.slice(0,3).map(x=><Link key={x.id} to={x.path}><Icon name={x.icon} size={18}/><span>{c(x.label)}</span><Icon name="diagonal" size={15}/></Link>)}</div></div></div></div></div>}

type Artwork={identifier:string;name?:string;collection?:string;url?:string;thumbnailUrl?:string;media?:{url?:string;thumbnailUrl?:string}[];attributes?:any;metadata?:any;creator?:string;owner?:string}
const imageOf=(n:Artwork)=>n.media?.[0]?.thumbnailUrl||n.thumbnailUrl||n.media?.[0]?.url||n.url
export function ArtworkGrid(){const c=useCopy(),[list,setList]=useState<Artwork[]>([]),[state,setState]=useState('loading'),[attempt,setAttempt]=useState(0);useEffect(()=>{const a=new AbortController(),timer=setTimeout(()=>a.abort(),10000);setState('loading');fetch(`${API}/collections/NFTUDURI-2990b6/nfts?size=4`,{signal:a.signal}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(j=>{if(!Array.isArray(j))throw Error();setList(j);setState('ready')}).catch(()=>{if(!a.signal.aborted)setState('error');else setState('error')}).finally(()=>clearTimeout(timer));return()=>{a.abort();clearTimeout(timer)}},[attempt]);return <section className="xa-artwork-section"><div className="xa-section-head"><div><div className="xa-eyebrow">NFTUDURI—2990B6</div><h2>{c('galleryLive')}</h2></div><Link to="/explore/museum" className="xa-text-link">{c('museum')}<Icon name="diagonal" size={16}/></Link></div>{state==='loading'?<div className="xa-artwork-grid" aria-busy="true">{[0,1,2,3].map(i=><div key={i} className="xa-artwork-skeleton"/>)}</div>:list.length?<div className="xa-artwork-grid">{list.map(n=><Link key={n.identifier} to={'/explore/artwork/'+encodeURIComponent(n.identifier)} className="xa-artwork-card"><div className="xa-artwork-image">{imageOf(n)?<img src={imageOf(n)} alt={n.name||n.identifier} loading="lazy" onError={e=>{e.currentTarget.style.display='none'}}/>:<Icon name="cube" size={50}/>}<span>{c('details')}<Icon name="diagonal" size={15}/></span></div><div className="xa-artwork-caption"><h3>{n.name||n.identifier}</h3><Icon name="diagonal" size={16}/><small>{n.identifier}</small></div></Link>)}</div>:<div className="xa-gallery-empty"><Icon name="museum" size={38}/><p>{c('collectionUnavailable')}</p><button className="xa-button secondary" onClick={()=>setAttempt(i=>i+1)}>{c('refresh')}<Icon name="refresh" size={16}/></button></div>}</section>}
export function ArtworkDetail(){const {identifier=''}=useParams(),c=useCopy(),[n,setN]=useState<Artwork|null>(null),[state,setState]=useState('loading'),[attempt,setAttempt]=useState(0);useEffect(()=>{const a=new AbortController(),timer=setTimeout(()=>a.abort(),12000);setState('loading');setN(null);if(!/^[a-zA-Z0-9-]+$/.test(identifier)){setState('error');return()=>clearTimeout(timer)}fetch(`${API}/nfts/${encodeURIComponent(identifier)}`,{signal:a.signal}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(j=>{setN(j);setState('ready')}).catch(()=>setState('error')).finally(()=>clearTimeout(timer));return()=>{a.abort();clearTimeout(timer)}},[identifier,attempt]);return <div className="xa-container xa-artwork-detail"><Link to="/explore" className="xa-text-link"><Icon name="arrow" size={16}/>{c('back')}</Link>{state==='loading'?<Loader/>:n?<div className="xa-artwork-detail-grid"><div className="xa-artwork-detail-image">{imageOf(n)?<img src={imageOf(n)} alt={n.name||identifier}/>:<Icon name="cube" size={100}/>}</div><div><div className="xa-eyebrow">{n.collection||'NFT'}</div><h1>{n.name||identifier}</h1><p className="xa-detail-id">{identifier}</p>{typeof n.metadata?.description==='string'&&<p className="xa-detail-description">{n.metadata.description}</p>}<a className="xa-button primary" href={`https://explorer.multiversx.com/nfts/${encodeURIComponent(identifier)}`} target="_blank" rel="noreferrer">{c('source')}<Icon name="external" size={17}/></a><Link to="/explore/market?tab=digital" className="xa-button secondary">{c('market')}<Icon name="arrow" size={17}/></Link>{n.creator&&<div className="xa-provenance"><b>{c('creator')}</b><a href={`https://explorer.multiversx.com/accounts/${n.creator}`} target="_blank" rel="noreferrer">{n.creator}<Icon name="external" size={13}/></a></div>}<div className="xa-detail-traits">{Array.isArray(n.metadata?.attributes)&&n.metadata.attributes.filter((a:any)=>a.trait_type&&a.value!=null).map((a:any,i:number)=><div key={i}><span>{a.trait_type}</span><b>{String(a.value)}</b></div>)}</div></div></div>:<div className="xa-empty"><h1>{c('unavailable')}</h1><p>{c('collectionUnavailable')}</p><button onClick={()=>setAttempt(i=>i+1)} className="xa-button secondary">{c('refresh')}</button></div>}</div>}
export function NotFound(){const c=useCopy();return <div className="xa-container xa-not-found"><div className="xa-error-number">404<span>↗</span></div><h1>{c('notFound')}</h1><p>{c('notFoundLead')}</p><Link to="/directory" className="xa-button primary">{c('directory')}<Icon name="arrow" size={18}/></Link><Link to="/" className="xa-button quiet">{c('home')}</Link></div>}
