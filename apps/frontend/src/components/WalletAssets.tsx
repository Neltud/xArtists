import {useState} from 'react'
import type {UserAccount} from '../hooks/useUserAccount'
import {renderChild as xaRender} from '../i18n/phraseRuntime'
import {useCopy} from '../experience/state'
import Icon from '../experience/Icon'
import ListNftSheet,{type ListTarget} from './ListNftSheet'
import {isOwnedNftListCandidate} from '../lib/marketplaceUserListing.mjs'
export function formatWalletBalance(value:number):string {
 if(!Number.isFinite(value))return '—'
 if(value===0)return '0'
 return value>=1000?value.toFixed(2):value>=1?value.toFixed(4):value.toPrecision(3)
}
/** Presentation only: the parent owns the single address-scoped account read. */
export default function WalletAssets({account,section='all'}:{account:UserAccount;section?:'all'|'tokens'|'nfts'}){
 const c=useCopy(),[nftVisible,setNftVisible]=useState(12),[tokenVisible,setTokenVisible]=useState(20)
 const [listTarget,setListTarget]=useState<ListTarget|null>(null)
 if(account.loading)return <p role="status">{c('commonLoading')}</p>
 if(account.error||account.refreshedAt===null)return <p role="status">{c('walletUnavailable')}</p>
 return <div className="xa-wallet-assets">
  {(section==='all'||section==='tokens')&&<section className="xa-wallet-card"><h2>Tokens <span>{account.tokens.length}</span></h2>{!account.tokens.length?<p>{xaRender('Aucun token ESDT.')}</p>:<ul className="xa-wallet-token-list">{account.tokens.slice(0,tokenVisible).map(token=><li key={token.identifier}><span><strong>{token.ticker||token.name||token.identifier}</strong><small>{token.identifier}</small></span><b>{formatWalletBalance(token.balance)}</b></li>)}</ul>}{tokenVisible<account.tokens.length&&<button className="xa-button secondary" onClick={()=>setTokenVisible(n=>n+20)}>{xaRender('Voir plus')}</button>}</section>}
  {(section==='all'||section==='nfts')&&<section className="xa-wallet-card"><h2>NFT <span>{account.nfts.length}</span></h2>{!account.nfts.length?<p>{xaRender('Aucun NFT trouvé pour cette adresse.')}</p>:<div className="xa-wallet-nfts">{account.nfts.slice(0,nftVisible).map(nft=>{
   const media=nft.media?.[0] as {thumbnailUrl?:string;url?:string}|undefined
   const src=media?.thumbnailUrl||nft.url||media?.url
   return <article key={nft.identifier}>{src?<img src={src} alt={nft.name||nft.identifier} loading="lazy" onError={e=>{e.currentTarget.hidden=true}}/>:<Icon name="cube" size={28}/>}<h3>{nft.name||nft.identifier}</h3><small>{nft.identifier}</small><button type="button" className="xa-button secondary" disabled={!isOwnedNftListCandidate(nft)} onClick={()=>setListTarget({identifier:nft.identifier,collection:nft.collection,nonce:nft.nonce,name:nft.name||nft.identifier,imageUrl:src})}>{xaRender('Mettre en vente')}</button></article>
  })}</div>}{nftVisible<account.nfts.length&&<button className="xa-button secondary" onClick={()=>setNftVisible(n=>n+12)}>{xaRender('Voir plus')}</button>}</section>}
  <ListNftSheet target={listTarget} onClose={()=>setListTarget(null)}/>
 </div>
}
