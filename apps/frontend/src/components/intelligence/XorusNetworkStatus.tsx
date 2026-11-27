import { useEffect, useState } from 'react'
import { useI18n } from '../../i18n/I18nContext'

const ENDPOINT='https://br-steep-sun-bab7l93p-xorushub.compute.c-8.eu-central-1.aws.neon.tech/v1/xorus/network-status'
const MAX_AGE=30*60_000
type Observation={network:'multiversx'|'solana';status:'observed'|'unavailable';source_data_at:string|null;finalized_height:number|null}
type Receipt={checked_at:string;receipt_source_sha:string;agents:Observation[]}

function parseReceipt(value:unknown,now:number):Receipt|null{
  if(!value||typeof value!=='object')return null
  const p=value as Record<string,unknown>
  if(p.ok!==true||p.schema!=='xorus_network_status/v1'||p.mode!=='read_only'||p.executable!==false||
     p.execution_authorized!==false||p.trading_enabled!==false||p.signing_authorized!==false||
     p.independently_verified_market_signals!==0||typeof p.checked_at!=='string'||
     typeof p.receipt_source_sha!=='string'||!/^[a-f0-9]{40}$/.test(p.receipt_source_sha)||
     !Array.isArray(p.agents)||p.agents.length!==2)return null
  const checked=Date.parse(p.checked_at)
  if(!Number.isFinite(checked)||checked>now||now-checked>MAX_AGE)return null
  const agents:Observation[]=[]
  for(const network of ['multiversx','solana'] as const){
    const matches=p.agents.filter(a=>a&&a.network===network)
    if(matches.length!==1)return null
    const a=matches[0]
    const observed=typeof a.source_data_at==='string'?Date.parse(a.source_data_at):NaN
    if(a.status==='observed'&&Number.isSafeInteger(a.finalized_height)&&a.finalized_height>0&&
       Number.isFinite(observed)&&observed<=checked+5000&&checked-observed<=150000){
      agents.push({network,status:'observed',source_data_at:a.source_data_at,finalized_height:a.finalized_height})
    }else if(a.status==='unavailable'){
      agents.push({network,status:'unavailable',source_data_at:null,finalized_height:null})
    }else return null
  }
  return {checked_at:p.checked_at,receipt_source_sha:p.receipt_source_sha,agents}
}

export default function XorusNetworkStatus(){
  const {lang}=useI18n(),fr=lang==='fr'
  const [receipt,setReceipt]=useState<Receipt|null>(null)
  const [busy,setBusy]=useState(true)
  const [revision,setRevision]=useState(0)
  const [now,setNow]=useState(Date.now)
  useEffect(()=>{
    const controller=new AbortController()
    setBusy(true);setReceipt(null);setNow(Date.now())
    const timeout=window.setTimeout(()=>controller.abort(),8000)
    fetch(ENDPOINT,{signal:controller.signal,cache:'no-store',credentials:'omit',redirect:'error'})
      .then(async res=>{if(!res.ok)throw Error('unavailable');return res.json() as Promise<unknown>})
      .then(value=>{if(!controller.signal.aborted){const checked=Date.now();setNow(checked);setReceipt(parseReceipt(value,checked))}})
      .catch(()=>{})
      .finally(()=>{window.clearTimeout(timeout);if(!disposed)setBusy(false)})
    let disposed=false
    return ()=>{disposed=true;window.clearTimeout(timeout);controller.abort()}
  },[revision])
  useEffect(()=>{const timer=window.setInterval(()=>setNow(Date.now()),30000);return()=>window.clearInterval(timer)},[])
  const current=receipt&&now-Date.parse(receipt.checked_at)<=MAX_AGE&&now>=Date.parse(receipt.checked_at)?receipt:null
  const fmt=new Intl.NumberFormat(fr?'fr-FR':'en-GB')
  const date=(v:string)=>new Date(v).toLocaleString(fr?'fr-FR':'en-GB',{dateStyle:'short',timeStyle:'short'})
  return <section className="xa-xorus-network-status" aria-label={fr?'Observations réseau mainnet':'Mainnet network observations'} data-testid="xorus-network-status">
    <div className="xa-xorus-network-head"><div><h2>{fr?'Réseaux mainnet':'Mainnet networks'}</h2><p>{fr?'Observations finalisées · lecture seule':'Finalized observations · read only'}</p></div>
      <button type="button" className="xa-button secondary" disabled={busy} onClick={()=>setRevision(v=>v+1)}>{fr?'Actualiser les réseaux':'Refresh networks'}</button></div>
    <div className="xa-xorus-network-grid">
      {(['multiversx','solana'] as const).map(network=>{
        const agent=current?.agents.find(a=>a.network===network)
        return <article key={network} className="xa-xorus-network-card">
          <h3>{network==='multiversx'?'MultiversX':'Solana'}</h3>
          {agent?.status==='observed'&&agent.finalized_height!==null&&agent.source_data_at?<><p>{network==='multiversx'?(fr?'Nonce finalisé · métachaîne':'Finalized metachain nonce'):(fr?'Slot finalisé':'Finalized slot')}</p>
            <strong>{fmt.format(agent.finalized_height)}</strong><small>{date(agent.source_data_at)}</small></>:<p>{busy?(fr?'Lecture…':'Loading…'):(fr?'Observation indisponible':'Observation unavailable')}</p>}
        </article>
      })}
    </div>
    <p role="status">{current?(fr?`Dernier cycle : ${date(current.checked_at)} · cadence 15 min.`:`Last cycle: ${date(current.checked_at)} · 15 min cadence.`):(busy?(fr?'Lecture du dernier reçu…':'Reading latest receipt…'):(fr?'Aucun reçu récent disponible.':'No recent receipt available.'))} {fr?'Aucun signal de marché attesté par ces observations.':'These observations do not attest market signals.'}</p>
  </section>
}
