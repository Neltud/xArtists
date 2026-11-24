import {useState} from 'react'
import {Link} from 'react-router-dom'
import {useSolanaWallet} from '../context/SolanaWalletContext'
import {useSolanaPortfolio,type SolanaPortfolio} from '../hooks/useSolanaPortfolio'
import {formatSolanaUnits} from '../lib/solanaAccount.mjs'
import NetworkSelector from './NetworkSelector'
import {useCopy} from '../experience/state'
import {useNetworkCopy} from '../experience/networkCopy'
import Icon from '../experience/Icon'

export function SolanaAssetRows({data,kind}:{data:SolanaPortfolio;kind:'tokens'|'nft'}){
 const n=useNetworkCopy(),items=kind==='nft'?data.nfts:data.tokens.filter(t=>!t.nft)
 return <div className="xa-solana-assets">
  {items.length===0?<p className="xa-cockpit-notice">{n('emptyAssets')}</p>:items.map(asset=><a key={asset.mint} href={'https://explorer.solana.com/address/'+asset.mint} rel="noopener noreferrer" target="_blank" className="xa-solana-asset">
   <Icon name={asset.nft?'image':'coin'} size={24}/><span><strong>{asset.nft?'NFT SPL':'SPL'}</strong><small>{asset.mint.slice(0,8)}…{asset.mint.slice(-8)}</small></span><b>{formatSolanaUnits(asset.amount,asset.decimals)}</b><Icon name="external" size={16}/>
  </a>)}
  {data.limited&&<p className="xa-network-note">{n('readLimit')}</p>}
 </div>
}
export default function SolanaWalletWorkspace(){
 const c=useCopy(),n=useNetworkCopy(),wallet=useSolanaWallet(),[view,setView]=useState<'tokens'|'nft'>('tokens')
 const address=wallet.session?.account.address??null,portfolio=useSolanaPortfolio(address),{data}=portfolio
 return <div className="xa-wallet-workspace xa-wallet-cockpit xa-solana-wallet">
  <header className="xa-cockpit-title-row"><h1>{c('wallet')}</h1><NetworkSelector/></header>
  <div className="xa-cockpit-overview-grid">
   <div className="xa-cockpit-main-column">
    <section className="xa-cockpit-hero" aria-labelledby="xa-solana-hero-title">
     <Icon name="wallet" size={42}/><h2 id="xa-solana-hero-title">{n('walletTitle')}</h2><p>{n('walletSubtitle')}</p>
     {address?<div className="xa-cockpit-connection"><p className="xa-wallet-address">{address}</p><small>{wallet.session?.wallet.name} · {n('mainnet')}</small><div className="xa-cockpit-connection-actions"><button type="button" className="xa-button secondary" onClick={wallet.disconnect}>{n('disconnect')}</button><a className="xa-button secondary" href={'https://explorer.solana.com/address/'+address} rel="noopener noreferrer" target="_blank">{n('explorer')}</a></div></div>:<div className="xa-solana-connect">
      <h3>{n('chooseWallet')}</h3>
      {wallet.wallets.length===0?<><p>{n('noWallet')}</p><div><a className="xa-button primary" href="https://phantom.com/download" target="_blank" rel="noopener noreferrer">Phantom</a><a className="xa-button secondary" href="https://solflare.com/download" target="_blank" rel="noopener noreferrer">Solflare</a></div></>:wallet.wallets.map(w=><button key={w.name} type="button" className="xa-button primary" disabled={wallet.busy} onClick={()=>void wallet.connect(w)}>{wallet.busy?n('loading'):w.name}</button>)}
      <small>{n('connectOnly')}</small>
     </div>}
     {wallet.failed&&<p role="alert">{n('connectionError')}</p>}
    </section>
    <section className="xa-cockpit-metrics" aria-label={c('walletOverview')}>
     <div><span>SOL</span><strong>{data?formatSolanaUnits(data.lamports):'—'}</strong></div>
     <button type="button" onClick={()=>setView('tokens')}><span>Tokens</span><strong>{data?data.tokens.filter(t=>!t.nft).length:'—'}</strong></button>
     <button type="button" onClick={()=>setView('nft')}><span>NFT</span><strong>{data?data.nfts.length:'—'}</strong></button>
    </section>
   </div>
   <aside className="xa-cockpit-ai"><h2>{n('actions')}</h2>
    {[['/marketplace?network=solana','market',c('navArt')],['/finance/governance?network=solana','network',n('governance')],['/intelligence/agents','agents',c('navAgents')]].map(([to,icon,label])=><Link className="xa-cockpit-agent" to={to} key={to}><span className="xa-cockpit-agent-icon"><Icon name={icon} size={24}/></span><span className="xa-cockpit-agent-text"><strong>{label}</strong></span><Icon name="arrow" size={18}/></Link>)}
   </aside>
  </div>
  <div className="xa-cockpit-tabs-block"><nav className="xa-wallet-views" aria-label={n('owned')}>{(['tokens','nft'] as const).map(v=><button key={v} type="button" aria-current={view===v?'page':undefined} onClick={()=>setView(v)}>{v==='tokens'?'Tokens':'NFT'}</button>)}</nav>
   {!address?<p className="xa-cockpit-notice">{n('walletEmpty')}</p>:<><div className="xa-wallet-toolbar"><span role="status">{portfolio.loading?n('loading'):portfolio.error?n('unavailable'):data?new Date(data.checkedAt).toLocaleTimeString():'—'}</span><button type="button" className="xa-button secondary" disabled={portfolio.loading} onClick={portfolio.refresh}>{n('refresh')}</button></div>{data&&<SolanaAssetRows data={data} kind={view}/>}</>}
  </div>
  <p className="xa-network-note">{n('networkSeparate')}</p>
 </div>
}
