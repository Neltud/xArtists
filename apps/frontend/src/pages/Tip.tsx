import {Link} from 'react-router-dom'
import {useNetworkCopy} from '../experience/networkCopy'
import {LIA_MULTICHAIN} from '../config/multichain'
import {LINKS} from '../config/links'
import Icon from '../experience/Icon'
import {NetworkLogo} from '../components/NetworkSelector'

export default function Tip(){
 const n=useNetworkCopy()
 return <div className="xa-task-page xa-support-page">
  <header className="xa-task-header"><div><p className="xa-task-kicker">xArtists</p><h1>{n('support')}</h1><p>{n('supportIntro')}</p></div></header>
  <div className="xa-task-actions">
   {[
    {to:'/studio',icon:'create',label:'create'},
    {to:'/intelligence/agents',icon:'agents',label:'agents'},
    {to:'/dao',icon:'network',label:'governance'},
   ].map(a=><Link key={a.to} to={a.to} className="xa-task-action"><Icon name={a.icon} size={32}/><strong>{n(a.label)}</strong><Icon name="arrow" size={20}/></Link>)}
  </div>
  <details className="xa-task-details"><summary>{n('supportDetails')}</summary><div className="xa-support-addresses"><p>{n('sourceOnly')}</p>
   {([['multiversx',LIA_MULTICHAIN.egld],['solana',LIA_MULTICHAIN.sol]] as const).map(([chain,account])=><a key={chain} href={account.explorer} target="_blank" rel="noopener noreferrer" className="xa-support-account"><NetworkLogo network={chain}/><span><strong>{chain==='solana'?'Solana':'MultiversX'}</strong><small>{account.address.slice(0,12)}…{account.address.slice(-8)}</small></span><Icon name="external" size={18}/></a>)}
   <a href={LINKS.treasuryPolicy} target="_blank" rel="noopener noreferrer" className="xa-text-link">{n('rules')} →</a>
  </div></details>
 </div>
}
