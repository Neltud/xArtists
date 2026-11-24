/** Read-only token identity. No bridge quote, deposit, mint or direct sale. */
import {Link} from 'react-router-dom'
import {TRO_TOKEN_ID} from '../config/troPools'
import {NetworkLogo} from '../components/NetworkSelector'
import {useNetworkCopy} from '../experience/networkCopy'
const EXPLORER='https://explorer.multiversx.com/tokens/'+TRO_TOKEN_ID

export default function TroCrosschainPage(){
 const n=useNetworkCopy()
 return <div className="tro-portal xa-task-page" id="tro-main">
  <header className="xa-task-header tro-portal__lead"><div><p className="xa-task-kicker">xArtists</p><h1 id="tro-hero-title">$TRO</h1><p>{n('tokenInfo')}</p></div><Link to="/dao" className="xa-button secondary">{n('governance')} →</Link></header>
  <p className="xa-task-status tro-portal__availability" role="status">{n('bridgeClosed')}</p>
  <section className="xa-token-networks" aria-labelledby="tro-options-title">
   <h2 id="tro-options-title" className="sr-only">{n('tokenNetworks')}</h2>
   <article className="xa-task-surface xa-token-network"><NetworkLogo network="multiversx"/><h2>MultiversX</h2><span className="xa-token-state">{n('supported')}</span><code>{TRO_TOKEN_ID}</code><a href={EXPLORER} className="xa-button primary" target="_blank" rel="noopener noreferrer">{n('explorer')} →</a></article>
   <article className="xa-task-surface xa-token-network"><NetworkLogo network="solana"/><h2>Solana</h2><span className="xa-token-state pending">{n('solUnverified')}</span><p>{n('cryptoOnly')}</p><Link className="xa-button secondary" to="/wallet?network=solana">{n('continue')} wallet →</Link></article>
  </section>
  <details className="xa-task-details" id="tro-roadmap-details-trigger"><summary>{n('details')}</summary><div id="tro-transparency"><p>{n('cryptoOnly')}</p><a href={EXPLORER} target="_blank" rel="noopener noreferrer" className="xa-text-link">{n('verifiedSource')} · MultiversX →</a><Link to="/tro#token-details" className="xa-text-link">{n('sourceArchive')} →</Link></div></details>
 </div>
}
