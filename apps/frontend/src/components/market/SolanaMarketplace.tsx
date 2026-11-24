import {useState} from 'react'
import {Link} from 'react-router-dom'
import NetworkSelector from '../NetworkSelector'
import {useSolanaWallet} from '../../context/SolanaWalletContext'
import {useSolanaPortfolio} from '../../hooks/useSolanaPortfolio'
import {SolanaAssetRows} from '../SolanaWalletWorkspace'
import {useNetworkCopy} from '../../experience/networkCopy'
import OpenSeaCollectionPanel from './OpenSeaCollectionPanel'
import Icon from '../../experience/Icon'
export default function SolanaMarketplace(){
 const n=useNetworkCopy(),wallet=useSolanaWallet(),portfolio=useSolanaPortfolio(wallet.session?.account.address??null),[view,setView]=useState<'nft'|'collections'>('nft')
 return <div className="xa-task-page xa-solana-market">
  <header className="xa-task-header"><div><p className="xa-task-kicker">Marketplace</p><h1>{n('solMarket')}</h1></div><NetworkSelector/></header>
  <nav className="xa-task-tabs" aria-label="Marketplace">{(['nft','collections'] as const).map(v=><button key={v} type="button" aria-current={view===v?'page':undefined} onClick={()=>setView(v)}>{n(v==='nft'?'myNfts':'collections')}</button>)}</nav>
  <p className="xa-task-status" role="status">{n('marketClosed')}</p>
  {view==='collections'?<OpenSeaCollectionPanel/>:<section className="xa-task-surface">
   {!wallet.session?<div className="xa-task-empty"><Icon name="image" size={42}/><h2>{n('myNfts')}</h2><p>{n('walletEmpty')}</p><Link to="/wallet?network=solana" className="xa-button primary">{n('connect')}</Link></div>:<><header className="xa-task-toolbar"><h2>{n('myNfts')}</h2><button type="button" className="xa-button secondary" disabled={portfolio.loading} onClick={portfolio.refresh}>{n('refresh')}</button></header>{portfolio.loading?<p role="status">{n('loading')}</p>:portfolio.error?<p role="alert">{n('unavailable')}</p>:portfolio.data?<SolanaAssetRows data={portfolio.data} kind="nft"/>:null}</>}
  </section>}
  <details className="xa-task-details"><summary>{n('contracts')}</summary><div><p>{n('programStage')}</p><p>{n('unsupportedMint')}</p><a className="xa-text-link" href="https://github.com/Neltud/xArtists/tree/main/contracts/solana/programs/marketplace" target="_blank" rel="noopener noreferrer">{n('viewCode')} →</a></div></details>
 </div>
}
