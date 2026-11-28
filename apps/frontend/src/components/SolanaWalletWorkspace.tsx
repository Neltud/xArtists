import {useState} from 'react'
import {Link} from 'react-router-dom'
import {useSolanaWallet} from '../context/SolanaWalletContext'
import {useSolanaPortfolio,type SolanaPortfolio} from '../hooks/useSolanaPortfolio'
import {decodePublicKey,formatSolanaUnits} from '../lib/solanaAccount.mjs'
import NetworkSelector from './NetworkSelector'
import {useCopy} from '../experience/state'
import {useNetworkCopy} from '../experience/networkCopy'
import Icon from '../experience/Icon'
import {useI18n} from '../i18n/I18nContext'

export function SolanaAssetRows({data,kind}:{data:SolanaPortfolio;kind:'tokens'|'nft'}){
 const n=useNetworkCopy(),[query,setQuery]=useState(''),items=kind==='nft'?data.nfts:data.tokens.filter(t=>!t.nft)
 const q=query.trim(),visible=items.filter(asset=>!q||asset.mint.includes(q))
 return <div className="xa-solana-assets">
  <div className="xa-solana-filter"><label>{n('mint')}<input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder={n('search')} autoComplete="off" spellCheck={false} maxLength={44}/></label><span aria-live="polite">{visible.length} / {items.length}</span></div>
  <p className="xa-network-note">{n('classicSplScope')}</p>
  {visible.length===0?<p className="xa-cockpit-notice">{items.length===0?n('emptyAssets'):n('noResults')}</p>:visible.map(asset=><a key={asset.mint} href={'https://explorer.solana.com/address/'+asset.mint} rel="noopener noreferrer" target="_blank" className="xa-solana-asset">
   <Icon name={asset.nft?'image':'coin'} size={24}/><span><strong>{asset.nft?'SPL 1/1':'SPL'}</strong><small>{asset.mint.slice(0,8)}…{asset.mint.slice(-8)}</small></span><b>{formatSolanaUnits(asset.amount,asset.decimals)}</b><Icon name="external" size={16}/>
  </a>)}
  {data.limited&&<p role="status" className="xa-network-note">{n('readLimit')}</p>}
 </div>
}
export default function SolanaWalletWorkspace(){
 const c=useCopy(),n=useNetworkCopy(),wallet=useSolanaWallet(),[view,setView]=useState<'tokens'|'nft'>('tokens')
 const {lang}=useI18n(),fr=lang==='fr'
 const [draft,setDraft]=useState(''),[watch,setWatch]=useState<string|null>(null),[invalid,setInvalid]=useState(false)
 const connectedAddress=wallet.session?.account.address??null
 const address=connectedAddress??watch,portfolio=useSolanaPortfolio(address),{data}=portfolio
 return <div className="xa-wallet-workspace xa-wallet-cockpit xa-solana-wallet">
  <header className="xa-cockpit-title-row"><h1>{c('wallet')}</h1><NetworkSelector/></header>
  <div className="xa-cockpit-overview-grid">
   <div className="xa-cockpit-main-column">
    <section className="xa-cockpit-hero" aria-labelledby="xa-solana-hero-title">
     <Icon name="wallet" size={42}/><h2 id="xa-solana-hero-title">{n('walletTitle')}</h2><p>{n('walletSubtitle')}</p>
     {connectedAddress?<div className="xa-cockpit-connection"><p className="xa-wallet-address">{address}</p><small>{wallet.session?.wallet.name} · {n('mainnet')}</small><div className="xa-cockpit-connection-actions"><button type="button" className="xa-button secondary" onClick={wallet.disconnect}>{n('disconnect')}</button><a className="xa-button secondary" href={'https://explorer.solana.com/address/'+address} rel="noopener noreferrer" target="_blank">{n('explorer')}</a></div></div>:<div className="xa-solana-connect">
      <h3>{n('chooseWallet')}</h3>
      {wallet.wallets.length===0?<><p>{n('noWallet')}</p><div><a className="xa-button primary" href="https://phantom.com/download" target="_blank" rel="noopener noreferrer">Phantom</a><a className="xa-button secondary" href="https://solflare.com/download" target="_blank" rel="noopener noreferrer">Solflare</a></div></>:wallet.wallets.map(w=><button key={w.name} type="button" className="xa-button primary" disabled={wallet.busy} onClick={()=>void wallet.connect(w)}>{wallet.busy?n('loading'):w.name}</button>)}
      <small>{n('connectOnly')}</small>
      <form className="xa-solana-watch" onSubmit={e=>{e.preventDefault();const key=draft.trim();if(!decodePublicKey(key)){setInvalid(true);setWatch(null);return}setInvalid(false);setWatch(key)}}>
       <label htmlFor="xa-solana-public-address">{fr?'Lire une adresse Solana publique (xPortal ou autre wallet)':'Read a public Solana address (xPortal or another wallet)'}</label>
       <input id="xa-solana-public-address" value={draft} maxLength={44} autoComplete="off" spellCheck={false} onChange={e=>{setDraft(e.target.value);setInvalid(false);setWatch(null)}} aria-invalid={invalid}/>
       <button className="xa-button secondary" type="submit">{fr?'Afficher les actifs':'View assets'}</button>
       {watch&&<button type="button" className="xa-button secondary" onClick={()=>{setWatch(null);setDraft('')}}>{fr?'Effacer':'Clear'}</button>}
       {invalid&&<p role="alert">{fr?'Adresse Solana invalide.':'Invalid Solana address.'}</p>}
       <small>{fr?'Lecture seule. Aucun lien de propriété avec le compte MultiversX n’est présumé.':'Read only. No ownership link to the MultiversX account is assumed.'}</small>
      </form>
     </div>}
     {wallet.failed&&<p role="alert">{n('connectionError')}</p>}
    </section>
    <section className="xa-cockpit-metrics" aria-label={c('walletOverview')}>
     <div><span>SOL</span><strong>{data?formatSolanaUnits(data.lamports):'—'}</strong></div>
     <button type="button" onClick={()=>setView('tokens')}><span>Tokens</span><strong>{data?data.tokens.filter(t=>!t.nft).length:'—'}</strong></button>
     <button type="button" onClick={()=>setView('nft')}><span>NFT</span><strong>{data?data.nfts.length:'—'}</strong></button>
    </section>
   </div>
  </div>
  <div className="xa-cockpit-tabs-block"><nav className="xa-wallet-views" aria-label={n('owned')}>{(['tokens','nft'] as const).map(v=><button key={v} type="button" aria-current={view===v?'page':undefined} onClick={()=>setView(v)}>{v==='tokens'?'Tokens':'NFT'}</button>)}</nav>
   {!address?<p className="xa-cockpit-notice">{n('walletEmpty')}</p>:<>{!connectedAddress&&watch&&<p role="status" className="xa-cockpit-notice">{fr?'Adresse publique observée · aucune signature':'Watched public address · no signing'} · {watch}</p>}<div className="xa-wallet-toolbar"><span role="status">{portfolio.loading?n('loading'):portfolio.error?n('unavailable'):data?new Date(data.checkedAt).toLocaleTimeString():'—'}</span><button type="button" className="xa-button secondary" disabled={portfolio.loading} onClick={portfolio.refresh}>{n('refresh')}</button></div>{data&&<SolanaAssetRows data={data} kind={view}/>}</>}
  </div>
  <nav className="xa-wallet-quick-links" aria-label={n('actions')}><Link className="xa-button secondary" to="/marketplace?network=solana">{c('navArt')} →</Link><Link className="xa-button secondary" to="/finance/governance?network=solana">{n('governance')} →</Link></nav>
  <p className="xa-network-note">{n('networkSeparate')}</p>
 </div>
}
