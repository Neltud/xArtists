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

/** Session and portfolio share one address-scoped snapshot, with URL-backed views. */
export default function WalletPage(){
 const c=useCopy(),{connected,address,method,sessionLive,canAttemptSign,disconnect}=useWallet()
 const account=useUserAccount(connected?address:null),{push}=useToast(),[params,setParams]=useSearchParams()
 const assets=params.get('view')==='assets'||params.get('tab')==='nft'
 const known=account.refreshedAt!==null&&!account.error
 const view=(next:string)=>setParams(p=>{const n=new URLSearchParams(p);n.delete('tab');next==='assets'?n.set('view','assets'):n.delete('view');return n})
 useEffect(()=>{
  if(params.get('moonpay')==='done'){
   push('Retour MoonPay — vérifie ton solde EGLD (quelques minutes).','ok')
   const next=new URLSearchParams(params);next.delete('moonpay');setParams(next,{replace:true})
  }
 },[params,setParams,push])
 return <div className="xa-wallet-workspace">
  <header className="xa-wallet-heading"><div><p className="xa-eyebrow">MultiversX</p><h1>{c('wallet')}</h1><p>{c('walletIntro')}</p></div><Icon name="wallet" size={32}/></header>
  <nav className="xa-wallet-views" aria-label={c('wallet')}><button type="button" aria-current={!assets?'page':undefined} onClick={()=>view('overview')}>{c('walletOverview')}</button><button type="button" aria-current={assets?'page':undefined} onClick={()=>view('assets')}>{c('walletAssets')}</button><Link to="/workspace/account">{c('account')}</Link></nav>
  {!connected?<section className="xa-wallet-card xa-wallet-connect"><Icon name="wallet" size={32}/><h2>{c('connect')}</h2><p>{xaRender('Connecte ton wallet pour consulter tes soldes, tokens et NFT.')}</p><button type="button" className="xa-button primary" onClick={requestOpenConnect}>{c('connect')}</button><Link className="xa-text-link" to="/marketplace">{c('welcomeExplore')}<Icon name="arrow" size={16}/></Link></section>:<>
   <section className="xa-wallet-card xa-wallet-session"><div><p className="xa-wallet-address">{address}</p><p>{xaRender(method==='paste_readonly'?'Lecture seule — pas de signature':method==='xportal'?(sessionLive?'xPortal · session active':'xPortal · reconnexion nécessaire'):method||'wallet')}</p>{!canAttemptSign&&method!=='paste_readonly'&&<button type="button" className="xa-button secondary" onClick={requestOpenConnect}>{c('connect')}</button>}</div><button type="button" className="xa-button secondary" onClick={()=>{clearXPortalSession();disconnect();push('Déconnecté','info')}}>{xaRender('Déconnecter')}</button></section>
   <div className="xa-wallet-toolbar"><span>{account.loading?c('commonLoading'):account.error?c('walletUnavailable'):known?new Date(account.refreshedAt!).toLocaleTimeString():c('unavailable')}</span><button type="button" className="xa-button secondary" onClick={account.refresh} disabled={account.loading}><Icon name="refresh" size={16}/>{c('refresh')}</button></div>
   {!assets?<><section className="xa-wallet-summary" aria-label={c('walletOverview')}><div className="xa-wallet-card"><span>EGLD</span><strong>{account.loading?'…':known?formatWalletBalance(account.balanceEgld):'—'}</strong><MoonPayBuyButton amountEur={30}/></div><button className="xa-wallet-card" type="button" onClick={()=>view('assets')}><span>Tokens</span><strong>{known?account.tokens.length:'—'}</strong><span>{c('walletAssets')} →</span></button><button className="xa-wallet-card" type="button" onClick={()=>view('assets')}><span>NFT</span><strong>{known?account.nfts.length:'—'}</strong><span>{c('walletAssets')} →</span></button></section><div className="xa-wallet-next"><Link to="/marketplace#xa-market-sell" className="xa-button secondary">{c('market')}<Icon name="arrow" size={16}/></Link><Link to="/create/gallery" className="xa-button secondary">{c('navExhibitionBuilder')}<Icon name="arrow" size={16}/></Link><Link to="/workspace/agents" className="xa-button secondary">{c('navMyAccess')}<Icon name="arrow" size={16}/></Link></div></>:<WalletAssets key={address} account={account}/>}
  </>}
 </div>
}
