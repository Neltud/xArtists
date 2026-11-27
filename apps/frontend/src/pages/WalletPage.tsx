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
import {useCopy} from '../experience/state'
import Icon from '../experience/Icon'
import NetworkSelector from '../components/NetworkSelector'
import SolanaWalletWorkspace from '../components/SolanaWalletWorkspace'
import {useWalletNetwork} from '../context/NetworkContext'

type WalletView='overview'|'tokens'|'nft'|'assets'
/** Address-scoped wallet overview. No promotional catalogue or agent claims. */
export default function WalletPage(){
 const {network}=useWalletNetwork()
 return network==='solana'?<SolanaWalletWorkspace/>:<MultiversxWalletWorkspace/>
}
function MultiversxWalletWorkspace(){
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
   <NetworkSelector/>
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
  <nav className="xa-wallet-quick-links" aria-label={c('navMyAccess')}><Link className="xa-button secondary" to="/marketplace?network=multiversx&list=1#xa-market-sell">{c('simpleMarketSellTitle')} →</Link><Link className="xa-button secondary" to="/workspace/agents">{c('navMyAccess')} →</Link></nav>
 </div>
}
