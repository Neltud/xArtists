import {useCallback,useEffect,useMemo,useRef,useState,type ReactNode} from 'react'
import {Link,useLocation} from 'react-router-dom'
import {useWallet} from '../context/WalletContext'
import {useI18n} from '../i18n/I18nContext'
import {LANGS,type Lang} from '../i18n/types'
import LoginModal from '../components/LoginModal'
import {openPlaylistModal} from '../config/playlist'
import {groups,modules,findModule,type Group} from './modules'
import {isSoftLaunchVisible,showLabModules} from './softLaunch'
import {PRIMARY_AREAS,MOBILE_AREAS,MODULE_PLACEMENT,areaFor,areaDefinition,moduleLabel,navigationRank,contextualModules} from './informationArchitecture'
import Icon from './Icon'
import {packNameForPublicPath} from '../lib/publicRoutes'
import Dialog from './Dialog'
import {useCopy,useExperience} from './state'
import {matchesModuleSearch} from './moduleSearch'
import {currentPrimarySection} from './navigation'
import {COMMUNITY_CONTACTS} from '../config/communityLinks'
import './beginner-navigation.css'

function Logo(){return <Link to="/" className="xa-logo" aria-label="xArtists"><svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true"><path d="m8 7 12 13L32 7M8 33l12-13 12 13" stroke="currentColor" strokeWidth="6" fill="none"/><path d="m8 7 24 26" stroke="var(--xa-accent)" strokeWidth="6"/></svg><span>xArtists<span className="xa-logo-dot">®</span></span></Link>}

export function Search({onClose}:{onClose:()=>void}){
 const c=useCopy(),{lang}=useI18n(),[q,setQ]=useState(''),[selected,setSelected]=useState(0)
 const lab=showLabModules()
 const results=useMemo(()=>modules.filter(m=>isSoftLaunchVisible(m,lab)&&matchesModuleSearch(q,[c(moduleLabel(m)),c(m.label),c(areaDefinition(areaFor(m.id)).label),m.path,...m.aliases,...m.tags],lang))
  .sort((a,b)=>navigationRank(a.id)-navigationRank(b.id)).slice(0,q.trim()?12:6),[q,lang,lab])
 useEffect(()=>setSelected(0),[q])
 useEffect(()=>{if(results[selected])document.getElementById('search-'+results[selected].id)?.scrollIntoView({block:'nearest'})},[selected,results])
 return <Dialog title={c('searchLabel')} onClose={onClose} className="xa-search-dialog">
  <div className="xa-search-input"><Icon name="search"/><input autoFocus value={q} placeholder={c('search')} aria-label={c('searchLabel')} role="combobox" aria-autocomplete="list" aria-expanded="true" aria-controls="xa-search-results" aria-activedescendant={results[selected]?`search-${results[selected].id}`:undefined} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{
   if(e.key==='ArrowDown'){e.preventDefault();setSelected(i=>Math.min(i+1,Math.max(0,results.length-1)))}
   if(e.key==='ArrowUp'){e.preventDefault();setSelected(i=>Math.max(i-1,0))}
   if(e.key==='Enter'&&results[selected]){e.preventDefault();document.getElementById('search-'+results[selected].id)?.click()}
  }}/><kbd>ESC</kbd></div>
  <div className="xa-search-results" id="xa-search-results" role="listbox">{results.length?results.map((m,i)=><Link key={m.id} id={`search-${m.id}`} role="option" aria-selected={selected===i} to={m.path} onClick={onClose} className={selected===i?'selected':''} onMouseEnter={()=>setSelected(i)}><span className="xa-search-symbol"><Icon name={m.icon}/></span><span><b>{c(moduleLabel(m))}</b><small>{c(areaDefinition(areaFor(m.id)).label)}</small></span><Icon name="diagonal" size={16}/></Link>):<p className="xa-empty">{c('noResults')}</p>}</div>
  <div className="xa-dialog-foot"><span>{results.length} {c('modules')} · ↑ ↓ ↵</span><Link to="/directory" onClick={onClose} className="xa-search-all">{c('directory')} <Icon name="arrow" size={15}/></Link></div>
 </Dialog>
}
function Header(){
 const c=useCopy(),{lang,setLang}=useI18n(),{connected,shortAddress}=useWallet(),{motion,setMotion,theme,setTheme}=useExperience(),location=useLocation()
 const primarySection=currentPrimarySection(location.pathname,modules)
 const [searchOpen,setSearchOpen]=useState(false),[mobileOpen,setMobileOpen]=useState(false),[settingsOpen,setSettingsOpen]=useState(false)
 const closeSearch=useCallback(()=>setSearchOpen(false),[]),closeMobile=useCallback(()=>setMobileOpen(false),[])
 const settingsRef=useRef<HTMLDivElement>(null)
 useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setSearchOpen(v=>!v)}};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[])
 useEffect(()=>{setMobileOpen(false);setSettingsOpen(false)},[location.pathname])
 useEffect(()=>{if(!settingsOpen)return;const click=(e:MouseEvent)=>{if(!settingsRef.current?.contains(e.target as Node))setSettingsOpen(false)};const key=(e:KeyboardEvent)=>{if(e.key==='Escape')setSettingsOpen(false)};document.addEventListener('mousedown',click);document.addEventListener('keydown',key);return()=>{document.removeEventListener('mousedown',click);document.removeEventListener('keydown',key)}},[settingsOpen])
 const languages=<select value={lang} onChange={e=>setLang(e.target.value as Lang)} aria-label={c('language')}>{LANGS.map(l=><option key={l.id} value={l.id}>{l.native}</option>)}</select>
 return <>
  <a className="xa-skip" href="#xa-main" onClick={e=>{e.preventDefault();document.getElementById('xa-main')?.focus()}}>{c('skip')}</a>
  <header className="xa-header"><div className="xa-header-inner"><Logo/>
   <nav className="xa-desktop-nav" aria-label={c('modules')}>{PRIMARY_AREAS.map(({id,to,label})=><Link to={to} key={id} className={primarySection===id?'active':''} aria-current={primarySection===id?'page':undefined}>{c(label)}</Link>)}</nav>
   <div className="xa-header-actions">
    <button className="xa-icon-button xa-search-trigger" onClick={()=>setSearchOpen(true)} aria-label={c('searchLabel')}><Icon name="search"/><kbd>⌘ K</kbd></button>
    <label className="xa-lang"><Icon name="globe" size={15}/><span className="sr-only">{c('language')}</span>{languages}</label>
    <button type="button" className="xa-icon-button xa-theme-toggle" onClick={()=>setTheme(theme==='dark'?'light':'dark')} aria-label={lang==='fr'?(theme==='dark'?'Activer le mode clair':'Activer le mode sombre'):(theme==='dark'?'Switch to light mode':'Switch to dark mode')} aria-pressed={theme==='dark'}><Icon name={theme==='dark'?'sun':'moon'} size={18}/></button>
    <div className="xa-preferences" ref={settingsRef}><button className="xa-icon-button" aria-expanded={settingsOpen} aria-label={c('settings')} onClick={()=>setSettingsOpen(v=>!v)}><Icon name="settings" size={18}/></button>{settingsOpen&&<div className="xa-preferences-panel"><h3>{c('settings')}</h3><button onClick={()=>setMotion(!motion)} aria-pressed={motion}><Icon name={motion?'pause':'play'} size={17}/>{c(motion?'pause':'play')}</button><Link to="/workspace/account">{c('account')}</Link><Link to="/guide">{c('help')}</Link></div>}</div>
    <Link className="xa-connect" to="/wallet" aria-current={primarySection==='wallet'?'page':undefined} aria-label={c('navWallet')}><Icon name="wallet" size={17}/><span>{connected?shortAddress:c('navWallet')}</span></Link>
    <button className="xa-icon-button xa-mobile-trigger" aria-label={c('menu')} onClick={()=>setMobileOpen(true)}><Icon name="menu"/></button>
   </div>
  </div></header>
  {searchOpen&&<Search onClose={closeSearch}/>}
  {mobileOpen&&<Dialog title={c('modules')} onClose={closeMobile} className="xa-mobile-menu">
   <div className="xa-mobile-utilities xa-mobile-utilities-top"><label className="xa-mobile-lang"><Icon name="globe" size={18}/><span>{c('language')}</span>{languages}</label></div>
   <div className="xa-mobile-menu-group xa-mobile-start"><Link to="/" onClick={closeMobile}><Icon name="orb" size={17}/>{c('home')}</Link>{MOBILE_AREAS.map(area=><Link to={area.to} key={area.id} onClick={closeMobile} aria-current={primarySection===area.id?'page':undefined}><Icon name={area.icon} size={17}/>{c(area.label)}<Icon name="arrow"/></Link>)}</div>
   <details className="xa-mobile-advanced"><summary>{c('navContext')}<Icon name="chevron" size={16}/></summary>{MOBILE_AREAS.map(area=><div key={area.id} className="xa-mobile-menu-group"><p className="xa-nav-group-caption">{c(area.label)}</p>{contextualModules(modules,modules.find(m=>areaFor(m.id)===area.id)!.id,true).filter(m=>MODULE_PLACEMENT[m.id].level!=='roadmap').map(m=><Link to={m.path} key={m.id} onClick={closeMobile}>{c(moduleLabel(m))}<Icon name="arrow"/></Link>)}</div>)}</details>
   <div className="xa-mobile-menu-group"><p className="xa-nav-group-caption">{c('navHelpProject')}</p><Link to="/guide" onClick={closeMobile}>{c('help')}</Link><Link to="/directory" onClick={closeMobile}>{c('directory')}</Link><Link to="/roadmap" onClick={closeMobile}>{c('roadmapLabel')}</Link><Link to="/app" onClick={closeMobile}>{c('appAccess')}</Link><Link to="/legal" onClick={closeMobile}>{c('legal')}</Link></div>
   <div className="xa-mobile-utilities"><button className="xa-mobile-music" type="button" onClick={()=>{closeMobile();openPlaylistModal()}}><Icon name="play" size={18}/>{c('musicLabel')}</button></div>
   <div className="xa-mobile-preferences"><button className="xa-button secondary" onClick={()=>setTheme(theme==='dark'?'light':'dark')}><Icon name={theme==='dark'?'sun':'moon'} size={16}/>{c(theme==='dark'?'light':'dark')}</button><button className="xa-button secondary" onClick={()=>setMotion(!motion)}><Icon name={motion?'pause':'play'} size={16}/>{c(motion?'pause':'play')}</button></div>
  </Dialog>}
  <LoginModal/>
 </>
}
export function Footer(){
 const c=useCopy()
 return <footer className="xa-footer"><div className="xa-footer-top"><div><Logo/><p>{c('footer')}</p><span className="xa-built"><i/>{c('built')}</span></div><div className="xa-footer-links">{PRIMARY_AREAS.map(area=><div key={area.id}><Link to={area.to}>{c(area.label)}</Link>{modules.filter(m=>areaFor(m.id)===area.id&&MODULE_PLACEMENT[m.id].level==='core').sort((a,b)=>navigationRank(a.id)-navigationRank(b.id)).map(m=><Link to={m.path} key={m.id}>{c(moduleLabel(m))}</Link>)}</div>)}</div></div>
  <div className="xa-footer-bottom"><span>© {new Date().getFullYear()} xArtists</span><div><Link to="/maison">{c('house')}</Link><Link to="/guide">{c('help')}</Link><Link to="/directory">{c('directory')}</Link><Link to="/roadmap">{c('roadmapLabel')}</Link><Link to="/app">{c('appAccess')}</Link><Link to="/legal">{c('legal')}</Link><a href="https://xartists.gitbook.io/xartists/" target="_blank" rel="noreferrer">{c('docs')}<Icon name="external" size={12}/></a><a href="https://github.com/Neltud/xArtists" target="_blank" rel="noreferrer">GitHub<Icon name="external" size={12}/></a>{COMMUNITY_CONTACTS.discord&&<a href={COMMUNITY_CONTACTS.discord} target="_blank" rel="noopener noreferrer">Discord</a>}{COMMUNITY_CONTACTS.telegram&&<a href={COMMUNITY_CONTACTS.telegram} target="_blank" rel="noopener noreferrer">Telegram</a>}</div></div>
 </footer>
}
function MobileDock(){
 const c=useCopy(),location=useLocation(),section=currentPrimarySection(location.pathname,modules)
 return <nav className="xa-mobile-dock" aria-label={c('modules')}>{MOBILE_AREAS.map(item=>{
  const active=section===item.id
  return <Link to={item.to} key={item.id} className={active?'active':''} aria-current={active?'page':undefined} aria-label={c(item.label)}><Icon name={item.icon} size={18}/><span>{c(item.label)}</span></Link>
 })}</nav>
}
export default function Shell({children}:{children:ReactNode}){
 const {pathname}=useLocation(),{lang}=useI18n(),c=useCopy()
 useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});const m=findModule(pathname);const key=pathname.split('/').filter(Boolean).join('/');const isOffers=key==='offres'||key==='offers';const isRoadmap=key==='roadmap'||key==='feuille-de-route';const packName=packNameForPublicPath(pathname);const title=isOffers?(lang==='fr'?'Offres · Packs IA et présentations':'Offers · AI packs and introductions'):isRoadmap?c('roadmapLabel'):packName?`${packName} · Genesis`:m?c(moduleLabel(m)):key===''?c('home'):key==='maison'||key==='manifesto'?c('house'):groups.includes(key as Group)||key==='directory'?c(key):c('notFound');document.title=`${title} — xArtists`;const meta=document.querySelector('meta[name="description"]');const offersDescription=lang==='fr'?'Découvrez les packs IA Pulse, Yield et Sentinel. Demandes de présentation ouvertes, paiements et mint NFT encore fermés.':'Explore the Pulse, Yield and Sentinel AI packs. Enquiries open, public checkout and NFT minting are not yet live.';meta?.setAttribute('content',isRoadmap?c('roadmapIntro'):isOffers?offersDescription:m?`${c(m.label)}. ${c(m.group+'Desc')}`:c('heroLead'));document.querySelector('meta[property="og:title"]')?.setAttribute('content',document.title);document.querySelector('meta[property="og:description"]')?.setAttribute('content',meta?.getAttribute('content')||c('heroLead'));const locale={fr:'fr_FR',en:'en_US',es:'es_ES',de:'de_DE',ru:'ru_RU',uk:'uk_UA',zh:'zh_CN',ar:'ar_AE'}[lang];document.querySelector('meta[property="og:locale"]')?.setAttribute('content',locale);const localizedUrl=(code:string)=>{const url=new URL(import.meta.env.BASE_URL,window.location.origin);url.pathname+=pathname.replace(/^\//,'');url.searchParams.set('lang',code);return url.href};const canonical=isOffers?new URL('offres/',new URL(import.meta.env.BASE_URL,window.location.origin)).href:localizedUrl(lang);document.querySelector('link[rel="canonical"]')?.setAttribute('href',canonical);document.querySelector('meta[property="og:url"]')?.setAttribute('content',canonical);for(const l of LANGS){let node=document.querySelector(`link[data-xa-locale="${l.id}"]`) as HTMLLinkElement|null;if(!node){node=document.createElement('link');node.rel='alternate';node.hreflang=l.id;node.dataset.xaLocale=l.id;document.head.append(node)}node.href=localizedUrl(l.id)}},[pathname,lang])
 return <div className="xa-app"><Header/><main id="xa-main" tabIndex={-1}>{children}</main><Footer/><MobileDock/></div>
}
