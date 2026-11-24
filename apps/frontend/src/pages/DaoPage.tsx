import {useState} from 'react'
import {Link} from 'react-router-dom'
import DaoGovernance from '../components/DaoGovernance'
import NetworkSelector,{NetworkLogo} from '../components/NetworkSelector'
import {useWalletNetwork} from '../context/NetworkContext'
import {useNetworkCopy} from '../experience/networkCopy'
import {useCopy} from '../experience/state'
import Icon from '../experience/Icon'

export default function DaoPage(){
 const n=useNetworkCopy(),c=useCopy(),{network}=useWalletNetwork(),[view,setView]=useState<'proposals'|'treasury'|'rules'>('proposals')
 const code=network==='solana'?'solana/programs/governance':'tro-governance'
 return <div className="xa-task-page xa-dao-page">
  <header className="xa-task-header"><div><p className="xa-task-kicker">xArtists</p><h1>DAO</h1></div><NetworkSelector/></header>
  <nav className="xa-task-tabs" aria-label={n('governance')}>{(['proposals','treasury','rules'] as const).map(v=><button type="button" key={v} aria-current={view===v?'page':undefined} onClick={()=>setView(v)}>{n(v)}</button>)}</nav>
  <p className="xa-task-status" role="status">{c('daoGovernanceUnavailable')}</p>
  {view==='proposals'&&<section className="xa-task-surface xa-task-empty"><Icon name="network" size={46}/><h2>{n('noProposals')}</h2><p>{n('registeredOnly')}</p><Link className="xa-button primary" to={'/wallet?network='+network}>{n('connect')}</Link></section>}
  {view==='treasury'&&<section className="xa-task-surface xa-task-empty"><Icon name="wallet" size={46}/><h2>{n('noTreasury')}</h2><Link className="xa-button secondary" to="/finance/support">{n('supportDetails')}</Link></section>}
  {view==='rules'&&<section className="xa-task-surface xa-task-rules"><h2>{n('method')}</h2><p>{c('daoIntroPlain')}</p><p>{n('programStage')}</p><a className="xa-button secondary" href={'https://github.com/Neltud/xArtists/tree/main/contracts/'+code} target="_blank" rel="noopener noreferrer">{n('viewCode')}</a>
   {network==='multiversx'&&<details className="xa-task-details xa-dao-practice"><summary>{n('practice')}</summary><p>{c('daoDemoWarning')}</p><DaoGovernance/></details>}
  </section>}
  <div className="xa-task-footer"><span><NetworkLogo network={network}/>{network==='solana'?'Solana':'MultiversX'}</span><Link to="/tro">{n('token')} →</Link></div>
 </div>
}
