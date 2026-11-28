/** Public indicative quotes. Never admitted as xOrus trading signals. */
import {useEffect,useState} from 'react'
import {useI18n} from '../i18n/I18nContext'

export type AssetQuote={id:string;symbol:string;usd:number|null;change24h?:number|null;at?:number;group:'crypto'|'fx'|'metal'}
const CRYPTO=[['bitcoin','BTC'],['ethereum','ETH'],['solana','SOL'],['elrond-erd-2','EGLD'],['bittensor','TAO'],['ripple','XRP'],['pax-gold','PAXG']]
const FX=['EUR','GBP','CHF','JPY']
const METALS=['XAU','XAG','XPT','XPD']
const positive=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v)&&v>0
const fresh=(at:number,age:number,now=Date.now())=>Number.isFinite(at)&&at<=now+60000&&now-at<=age
const blank=():AssetQuote[]=>[
 ...CRYPTO.map(([id,symbol])=>({id,symbol,usd:null,group:'crypto' as const})),
 ...FX.map(id=>({id,symbol:'USD/'+id,usd:null,group:'fx' as const})),
 ...METALS.map(id=>({id,symbol:id,usd:null,group:'metal' as const}))
]
async function json(url:string,signal:AbortSignal){
 const r=await fetch(url,{signal,cache:'no-store',redirect:'error'})
 if(!r.ok)throw Error('unavailable')
 return r.json()
}
export default function LiveAssetTape({compact}:{compact?:boolean}){
 const {lang}=useI18n(),fr=lang==='fr'
 const [rows,setRows]=useState<AssetQuote[]>(blank)
 const [busy,setBusy]=useState(true)
 const [ts,setTs]=useState<number|null>(null)
 const [revision,setRevision]=useState(0)
 useEffect(()=>{
  let stopped=false,active:AbortController|null=null
  const run=async()=>{
   if(stopped||active)return
   const c=new AbortController();active=c
   const timer=window.setTimeout(()=>c.abort(),12000)
   setBusy(true)
   const next=blank()
   const publish=()=>{if(!stopped){setRows(next.map(row=>({...row})));setTs(Date.now())}}
   const crypto=json('https://api.coingecko.com/api/v3/simple/price?ids='+CRYPTO.map(([id])=>id).join(',')+'&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true',c.signal).then(j=>{
    for(const row of next.filter(v=>v.group==='crypto')){
     const q=j?.[row.id],at=typeof q?.last_updated_at==='number'?q.last_updated_at*1000:NaN
     if(positive(q?.usd)&&fresh(at,15*60000)){row.usd=q.usd;row.at=at;row.change24h=typeof q.usd_24h_change==='number'&&Number.isFinite(q.usd_24h_change)?q.usd_24h_change:null}
    }
    publish()
   }).catch(()=>{})
   const fx=json('https://api.frankfurter.dev/v1/latest?base=USD&symbols='+FX.join(','),c.signal).then(j=>{
    const at=typeof j?.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(j.date)?Date.parse(j.date):NaN
    if(j?.base==='USD'&&fresh(at,7*86400000))for(const row of next.filter(v=>v.group==='fx')){
     if(positive(j.rates?.[row.id])){row.usd=j.rates[row.id];row.at=at}
    }
    publish()
   }).catch(()=>{})
   const metals=METALS.map(id=>json('https://api.gold-api.com/price/'+id,c.signal).then(j=>{
    const row=next.find(v=>v.id===id),at=typeof j?.updatedAt==='string'?Date.parse(j.updatedAt):NaN
    if(row&&j?.symbol===id&&positive(j.price)&&fresh(at,5*86400000)){row.usd=j.price;row.at=at}
    publish()
   }).catch(()=>{}))
   try{await Promise.allSettled([crypto,fx,...metals]);publish()}finally{window.clearTimeout(timer);active=null;if(!stopped)setBusy(false)}
  }
  void run()
  const interval=window.setInterval(()=>{if(!document.hidden)void run()},60000)
  return()=>{stopped=true;active?.abort();window.clearInterval(interval)}
 },[revision])
 const hasMarketPrices = rows.some(q=>q.usd!==null)
 const names:Record<string,string>={XAU:fr?'Or':'Gold',XAG:fr?'Argent':'Silver',XPT:fr?'Platine':'Platinum',XPD:fr?'Palladium':'Palladium'}
 const groups=[['crypto',fr?'Cryptomonnaies':'Crypto'],['fx',fr?'Devises · référence quotidienne':'FX · daily reference'],['metal',fr?'Métaux précieux · USD/once troy':'Precious metals · USD/troy oz']] as const
 const format=(row:AssetQuote)=>row.usd===null?'—':new Intl.NumberFormat(fr?'fr-FR':'en-US',row.group==='fx'?{maximumFractionDigits:4,minimumFractionDigits:2}:{style:'currency',currency:'USD',maximumFractionDigits:row.usd<1?5:2}).format(row.usd)
 return <section aria-label={fr?'Cours des marchés':'Market prices'} data-testid="market-quotes-first" className={'min-w-0 space-y-3 rounded-2xl border border-[color:var(--xa-border)] bg-[color:var(--xa-bg-elevated)] '+(compact?'p-2':'p-4')}>
  <div className="flex flex-wrap items-center justify-between gap-2">
   <h2 className="text-xl font-semibold text-[color:var(--xa-text)]">{fr?'Cours des marchés':'Market prices'}</h2>
   <button type="button" className="xa-button secondary min-h-[44px]" disabled={busy} onClick={()=>setRevision(n=>n+1)}>{fr?'Actualiser':'Refresh'}</button>
  </div>
  <p role="status" className="text-xs text-[color:var(--xa-text-secondary)]">{busy?(fr?'Actualisation…':'Refreshing…'):hasMarketPrices?(fr?'Cotations indicatives · actualisation toutes les 60 s':'Indicative quotes · refreshed every 60s'):(fr?'SOURCES INDISPONIBLES':'SOURCES UNAVAILABLE')}{hasMarketPrices && ts ? ' · '+(fr?'Consulté à ':'Checked at ')+new Date(ts).toLocaleTimeString():''}</p>
  {groups.map(([group,label])=><section key={group} className="space-y-2">
   <h3 className="text-sm font-semibold text-[color:var(--xa-text)]">{label}</h3>
   <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
    {rows.filter(row=>row.group===group).map(row=><article key={row.id} className="min-w-0 rounded-xl border border-[color:var(--xa-border)] p-2.5">
     <p className="text-xs font-semibold text-[color:var(--xa-text-secondary)]">{names[row.id]?names[row.id]+' · ':''}{row.symbol}</p>
     <p className="text-base font-bold tabular-nums text-[color:var(--xa-text)]">{format(row)}</p>
     {row.change24h!=null&&<p className={'text-xs tabular-nums '+(row.change24h>=0?'text-emerald-700 dark:text-emerald-300':'text-rose-700 dark:text-rose-300')}>{row.change24h>=0?'+':''}{row.change24h.toFixed(2)} % · 24h</p>}
     <p className="text-xs text-[color:var(--xa-text-secondary)]">{row.at?new Date(row.at).toLocaleString(fr?'fr-FR':'en-GB',group==='fx'?{dateStyle:'short',timeZone:'UTC'}:{dateStyle:'short',timeStyle:'short'}):(fr?'Indisponible':'Unavailable')}</p>
    </article>)}
   </div>
  </section>)}
  <p className="text-xs text-[color:var(--xa-text-secondary)]"><a href="https://www.coingecko.com/en/api" target="_blank" rel="noreferrer">Data provided by CoinGecko</a> · <a href="https://frankfurter.dev/" target="_blank" rel="noreferrer">Frankfurter</a> · <a href="https://gold-api.com/" target="_blank" rel="noreferrer">Gold API</a>. {fr?'PAXG est un jeton, pas le cours spot de l’or. Les métaux peuvent être en différé ou hors séance. Aucun ordre automatique.':'PAXG is a token, not spot gold. Metals may be delayed or outside trading hours. No automated orders.'}</p>
 </section>
}
