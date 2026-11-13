/** 120 canonical xOrus definitions, never confused with 120 live feeds. */
import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../../i18n/I18nContext'

type SignalDef={id:string;family:string;axis:string;n:number;status:'defined_not_verified'}
const FAMILIES=['price','volume','volatility','liquidity','onchain','dex','funding','social','art','risk','macro','external'] as const
function safeCatalog(v:unknown):SignalDef[] | null {
  if(!v||typeof v!=='object'||Array.isArray(v))return null
  const data=v as Record<string,unknown>
  if(data.schema!=='xorus_signal_catalog/v1'||data.source!=='lia/chorus/catalog.py'||
    data.kind!=='signal_definitions_not_observations'||data.total_defined!==120||
    !Array.isArray(data.signals)||data.signals.length!==120)return null
  const seen=new Set<string>(),familyCounts=new Map<string,number>()
  for(const raw of data.signals){
    if(!raw||typeof raw!=='object')return null
    const s=raw as Record<string,unknown>
    if(typeof s.family!=='string'||!FAMILIES.includes(s.family as typeof FAMILIES[number])
      ||typeof s.axis!=='string'||!/^[-_a-z0-9]{2,48}$/.test(s.axis)
      ||s.id!==s.family+'.'+s.axis||!Number.isInteger(s.n)
      ||(s.n as number)<1||(s.n as number)>10
      ||s.status!=='defined_not_verified'||seen.has(s.id))return null
    seen.add(s.id)
    familyCounts.set(s.family,(familyCounts.get(s.family)||0)+1)
  }
  if(FAMILIES.some(f=>familyCounts.get(f)!==10))return null
  return data.signals as SignalDef[]
}
export default function XorusSignalCatalog(){
  const {lang}=useI18n()
  const fr=lang==='fr'
  const [defs,setDefs]=useState<SignalDef[]|null>(null)
  const [error,setError]=useState(false)
  const [family,setFamily]=useState('all')
  const [query,setQuery]=useState('')
  const [opened,setOpened]=useState(false)
  useEffect(()=>{
    if(!opened||defs!==null||error)return
    const ctl=new AbortController()
    const url=`${import.meta.env.BASE_URL||'/'}data/xorus_signal_catalog.json`
    void fetch(url,{signal:ctl.signal,cache:'no-store'}).then(async r=>{
      if(!r.ok)throw Error('not found')
      return (await r.json()) as unknown
    }).then(data=>{
      if(ctl.signal.aborted)return
      const valid=safeCatalog(data)
      if(valid)setDefs(valid)
      else setError(true)
    }).catch(()=>{if(!ctl.signal.aborted)setError(true)})
    return ()=>ctl.abort()
  },[opened,defs,error])
  const visible=useMemo(()=>defs?.filter(x=>
    (family==='all'||x.family===family)&&x.id.includes(query.toLowerCase().trim())
  )||[],[defs,family,query])
  return <details className="xa-intelligence-advanced" onToggle={event=>setOpened(event.currentTarget.open)}>
    <summary>{fr?'Catalogue technique des 120 signaux':'Technical catalog of 120 signals'}</summary>
    <p className="xa-intelligence-note mt-2">{fr
      ? 'Définitions du moteur historique LIA/Chorus. « Défini » ne veut pas dire disponible, validé, autorisé à la revente ni utilisé pour décider.'
      : 'Definitions from the historical LIA/Chorus engine. Defined does not mean fed, verified, licensed for resale or used for decisions.'}</p>
    {error&&<p role="status">{fr?'Catalogue indisponible ou non conforme.':'Catalog unavailable or invalid.'}</p>}
    {!error&&!defs&&<p role="status">{fr?'Chargement des définitions…':'Loading definitions…'}</p>}
    {defs&&<>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm">{fr?'Famille':'Family'}
          <select value={family} onChange={e=>setFamily(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-[color:var(--xa-border)] bg-[color:var(--xa-bg)] p-3 text-[color:var(--xa-text)]">
            <option value="all">{fr?'Toutes (12)':'All (12)'}</option>
            {FAMILIES.map(f=><option value={f} key={f}>{f}</option>)}
          </select>
        </label>
        <label className="text-sm">{fr?'Rechercher un identifiant':'Search signal ID'}
          <input type="search" value={query} onChange={e=>setQuery(e.target.value)}
            placeholder="risk.drawdown" className="mt-1 block w-full rounded-lg border border-[color:var(--xa-border)] bg-[color:var(--xa-bg)] p-3 text-[color:var(--xa-text)]"/>
        </label>
      </div>
      <p role="status" className="xa-intelligence-note mt-3">{visible.length} / {defs.length} · {fr?'données non attestées':'unverified definitions'}</p>
      <ul className="mt-3 grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2">
        {visible.map(s=><li key={s.id} className="rounded-lg border border-[color:var(--xa-border)] px-3 py-2">
          <code className="break-words text-sm">{s.id}</code>
          <span className="block text-xs text-[color:var(--xa-text-secondary)]">{fr?'Non attesté':'Unverified'}</span>
        </li>)}
      </ul>
    </>}
  </details>
}
