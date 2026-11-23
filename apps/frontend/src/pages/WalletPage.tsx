import {renderChild as xaRender} from '../i18n/phraseRuntime'
import {Link,useSearchParams} from 'react-router-dom'
import {useEffect} from 'react'
import {useWallet} from '../context/WalletContext'
import {useUserAccount} from '../hooks/useUserAccount'
import {requestOpenConnect} from '../lib/walletEvents'
import {clearXPortalSession} from '../lib/xportalWc'
import {useToast} from '../components/ui/Toast'
import MoonPayBuyButton from '../components/MoonPayBuyButton'
import WalletAssets,{formatWalletBalance} from '../components/WalletAssets'
import {ArtworkGrid} from '../experience/Pages'
import {useCopy} from '../experience/state'
import Icon from '../experience/Icon'

type WalletView='overview'|'tokens'|'nft'|'assets'
const AGENT_PREVIEWS=[
 {id:'pulse',name:'Pulse',icon:'chart',description:'cockpitPulse'},
 {id:'yield',name:'Yield',icon:'layers',description:'cockpitYield'},
 {id:'sentinel',name:'Sentinel',icon:'shield',description:'cockpitSentinel'},
] as const

/** Reference #2: wallet-first cockpit. All account values come from one verified,
 * address-scoped read; agent previews are links, NOT entitlement claims.
 */
export default function WalletPage(){
 const c=useCopy(),{connected,address,method,sessionLive,canAttemptSign,disconnect}=useWallet()
 const account=useUserAccount(connected?address:null),{push}=useToast(),[params,setParams]=useSearchParams()
 const known=connected&&!account.loading&&account.refreshedAt!==null&&!account.error
 const selection:WalletView=params.get('view')==='assets'?'assets':params.get('tab')==='nft'?'nft':params.get('tab')==='tokens'?'tokens':'overview'
 const setView=(next:WalletView)=>setParams(p=>{
  const n=new URLSearchParams(p);n.delete('tab');n.delete('view')
  if(next==='assets')n.set('view','assets')
  else if(next!=='overview')n.set('tab',next)
  return n
 })
 useEffect(()=>{
  if(params.get('moonpay')==='done'){
   push('Retour MoonPay — vérifie ton solde EGLD (quelques minutes).','ok')
   const next=new URLSearchParams(params);next.delete('moonpay');setParams(next,{replace:true})
  }
 },[params,setParams,push])
 const figure=(value:number|string)=>account.loading&&connected?'…':known?String(value):'—'
 return <div className="xa-wallet-workspace xa-wallet-cockpit">
  <header className="xa-cockpit-title-row">
   <h1>{c('wallet')}</h1>
   <div className="xa-cockpit-network" aria-label={c('cockpitNetworkLabel')}>
    <span className="xa-cockpit-network-symbol" aria-hidden="true">✳</span>MultiversX
   </div>
  </header>
  <div className="xa-cockpit-overview-grid">
   <div className="xa-cockpit-main-column">
    <section className="xa-cockpit-hero" aria-labelledby="xa-cockpit-hero-title">
     <Icon name="wallet" size={42}/>
     <h2 id="xa-cockpit-hero-title">{c('cockpitHeroTitle')}</h2>
     <p>{c('cockpitHeroSubtitle')}</p>
     {!connected?<button type="button" className="xa-button primary" onClick={requestOpenConnect}>{c('connect')}</button>:
      <div className="xa-cockpit-connection">
       <p className="xa-wallet-address">{address}</p>
       <small>{xaRender(method==='paste_readonly'?'Lecture seule — pas de signature':method==='xportal'?(sessionLive?'xPortal · session active':'xPortal · reconnexion nécessaire'):method||'wallet')}</small>
       <div className="xa-cockpit-connection-actions">
        {!canAttemptSign&&method!=='paste_readonly'&&<button type="button" className="xa-button secondary" onClick={requestOpenConnect}>{c('connect')}</button>}
        <button type="button" className="xa-button secondary" onClick={()=>{clearXPortalSession();disconnect();push('Déconnecté','info')}}>{xaRender('Déconnecter')}</button>
       </div>
      </div>}
    </section>
    <section className="xa-cockpit-metrics" aria-label={c('walletOverview')}>
     <div><span>EGLD</span><strong>{figure(known?formatWalletBalance(account.balanceEgld):'—')}</strong></div>
     <button type="button" onClick={()=>setView('tokens')}><span>Tokens</span><strong>{figure(account.tokens.length)}</strong></button>
     <button type="button" onClick={()=>setView('nft')}><span>NFT</span><strong>{figure(account.nfts.length)}</strong></button>
    </section>
   </div>
   <aside className="xa-cockpit-ai" aria-labelledby="xa-cockpit-ai-heading">
    <h2 id="xa-cockpit-ai-heading">{c('navAgents')}</h2>
    <p className="xa-cockpit-ai-caption">{c('cockpitAiPreview')}</p>
    {AGENT_PREVIEWS.map(agent=><Link className="xa-cockpit-agent" key={agent.id} to={`/intelligence/agents?pack=${agent.id}`}>
     <span className="xa-cockpit-agent-icon"><Icon name={agent.icon} size={23}/></span>
     <span className="xa-cockpit-agent-text"><strong>{agent.name}</strong><small>{c(agent.description)}</small></span>
     <Icon name="arrow" size={18}/>
    </Link>)}
    <Link to="/workspace/agents" className="xa-cockpit-access-link">{c('navMyAccess')}<Icon name="arrow" size={16}/></Link>
   </aside>
  </div>
  <div className="xa-cockpit-tabs-block">
   <nav className="xa-wallet-views" aria-label={c('wallet')}>
    <button type="button" aria-current={selection==='overview'?'page':undefined} onClick={()=>setView('overview')}>{c('walletOverview')}</button>
    <button type="button" aria-current={selection==='tokens'||selection==='assets'?'page':undefined} onClick={()=>setView('tokens')}>Tokens</button>
    <button type="button" aria-current={selection==='nft'?'page':undefined} onClick={()=>setView('nft')}>NFT</button>
   </nav>
   {!connected?<div className="xa-cockpit-notice" role="status"><Icon name="info" size={20}/>{c('cockpitEmptyState')}</div>:<>
    <div className="xa-wallet-toolbar"><span role="status">{account.loading?c('commonLoading'):account.error?c('walletUnavailable'):known?new Date(account.refreshedAt!).toLocaleTimeString():c('unavailable')}</span><button type="button" className="xa-button secondary" onClick={account.refresh} disabled={account.loading}><Icon name="refresh" size={16}/>{c('refresh')}</button></div>
    {selection==='overview'?<div className="xa-cockpit-action-row">
     <p>{account.error?c('walletUnavailable'):c('walletIntro')}</p>
     <div><Link to="/workspace/account" className="xa-button secondary">{c('account')}</Link><MoonPayBuyButton amountEur={30}/></div>
    </div>:<WalletAssets account={account} section={selection==='tokens'?'tokens':selection==='nft'?'nfts':'all'} />}
   </>}
  </div>
  <div className="xa-cockpit-discover"><ArtworkGrid/></div>
 </div>
}
