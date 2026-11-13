/**
 * Public xOrus analysis desk for the Agents journey, not the NFT packs.
 * Reads only the verified public analysis PROJECTION from the access API;
 * never polls, forwards provider raw data, signs, mints or starts payment.
 */
import {useCallback,useEffect,useMemo,useState} from 'react'
import {Link} from 'react-router-dom'
import {useI18n} from '../../i18n/I18nContext'
import {interpretXorusAnalysisReport} from '../../lib/xorusAnalysisReadout.mjs'
import type {XorusAnalysisReadout,AnalysisAgent,AnalysisReading} from '../../lib/xorusAnalysisReadout.mjs'

type GroupId='pulse'|'yield'|'sentinel'
const TRACKS:{id:GroupId;name:string;fr:string;en:string;families:readonly string[]}[]=[
  {id:'pulse',name:'Pulse',fr:'Marchés et volumes',en:'Markets and volume',
    families:['price','volume','volatility','liquidity']},
  {id:'yield',name:'Yield',fr:'Liquidité et scénarios DeFi',en:'Liquidity and DeFi scenarios',
    families:['onchain','dex','funding']},
  {id:'sentinel',name:'Sentinel',fr:'Risques et contexte',en:'Risks and context',
    families:['risk','macro']},
]
const ROLE_NAME:Record<AnalysisAgent['agent'],string>={
  scout:'Scout',tape:'Tape',crowd:'Crowd',curator:'Curator',
  sentinel:'Sentinel',macro:'Macro',chair:'Chair',scribe:'Scribe',
}
const ROLE_INFO:Record<AnalysisAgent['agent'],{fr:string;en:string}>={
  scout:{fr:'Chaîne et échanges décentralisés',en:'On-chain and DEX'},
  tape:{fr:'Prix, volume et profondeur',en:'Price, volume and depth'},
  crowd:{fr:'Contexte social',en:'Social context'},
  curator:{fr:'Marché de l’art',en:'Art market'},
  sentinel:{fr:'Veto et risques',en:'Veto and risk'},
  macro:{fr:'Contexte macroéconomique',en:'Macroeconomic context'},
  chair:{fr:'Avis externe plafonné à 15 %',en:'External advice capped at 15%'},
  scribe:{fr:'Synthèse sans ordre',en:'No-order summary'},
}
const READINGS:Record<AnalysisReading,{fr:string;en:string}>={
  no_input:{fr:'aucune donnée',en:'no input'},
  context_only:{fr:'contexte seul',en:'context only'},
  positive:{fr:'tendance positive non vérifiée',en:'unverified positive reading'},
  negative:{fr:'tendance négative non vérifiée',en:'unverified negative reading'},
  mixed:{fr:'observations contradictoires',en:'conflicting observations'},
  balanced:{fr:'observations équilibrées',en:'balanced observations'},
}
const STANCE_REASONS:Record<string,{fr:string;en:string}>={
  thin_tape:{fr:'Pas assez de signaux exploitables pour statuer.',
    en:'Insufficient usable signals for a conclusion.'},
  unverified_tape:{fr:'Les indicateurs ne sont pas corroborés indépendamment.',
    en:'The indicators lack independent corroboration.'},
  sentinel_veto:{fr:'Sentinel oppose un veto ; toute conclusion est suspendue.',
    en:'Sentinel vetoes the decision; conclusions remain suspended.'},
  invalid_market:{fr:'Données de marché refusées par les contrôles.',
    en:'Market inputs rejected by validation.'},
  chair_weight_violation:{fr:'Le poids de l’avis externe dépasse la limite.',
    en:'The external advisory contribution exceeds its limit.'},
}
const API_TIMEOUT_MS=11000

export default function XorusAgentEvidence(){
  const {lang}=useI18n()
  const fr=lang==='fr'
  const apiBase=((import.meta.env.VITE_ACCESS_API_BASE as string|undefined)||'')
    .trim().replace(/\/+$/,'')
  const [report,setReport]=useState<XorusAnalysisReadout|null>(null)
  const [state,setState]=useState<'checking'|'unavailable'|'validated'>('checking')
  const [requested,setRequested]=useState(0)
  const [checkedAt,setCheckedAt]=useState<number|null>(null)
  const load=useCallback(async(signal:AbortSignal)=>{
    setState('checking');setReport(null)
    if(!apiBase){if(!signal.aborted)setState('unavailable');return}
    try{
      const res=await fetch(apiBase+'/v1/xorus/analysis',{
        cache:'no-store',signal,headers:{Accept:'application/json'},
      })
      if(!res.ok)throw Error('api_unavailable')
      const json=await res.json() as unknown
      const payload=json&&typeof json==='object'&&!Array.isArray(json)
        ? json as {ok?:unknown;report?:unknown}:null
      const readout=payload?.ok===true
        ? interpretXorusAnalysisReport(payload.report,Date.now()):null
      if(!readout)throw Error('contract_invalid')
      if(!signal.aborted){
        setReport(readout);setCheckedAt(Date.now());setState('validated')
      }
    }catch{
      if(!signal.aborted){setReport(null);setState('unavailable')}
    }
  },[apiBase])
  useEffect(()=>{
    const controller=new AbortController()
    const timeout=window.setTimeout(()=>{
      // An unreachable API must never leave a permanently spinning report.
      // Timeout is authoritative even when fetch never settles after abort.
      setReport(null)
      setState('unavailable')
      controller.abort()
    },API_TIMEOUT_MS)
    void load(controller.signal).finally(()=>window.clearTimeout(timeout))
    return ()=>{window.clearTimeout(timeout);controller.abort()}
  },[load,requested])
  const coverage=useMemo(()=>TRACKS.map(track=>({
    ...track,
    scored:report?.agents.reduce((sum,agent)=>sum+agent.families.reduce(
      (acc,f)=>acc+(track.families.includes(f.family)?f.count:0),0),0)??0,
  })),[report])
  const reason=report?(STANCE_REASONS[report.reason]||
    {fr:'Prudence : réévaluation humaine nécessaire.',en:'Human reassessment required.'}):null
  return <section className="space-y-4" data-testid="xorus-agent-evidence"
    aria-label={fr?'Résultats des agents xOrus':'xOrus agent findings'}>
    <header className="xa-intelligence-card space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="xa-intelligence-eyebrow">{fr?'Résultat du moteur, pas une démonstration':'Engine result, not a demo'}</p>
          <h2 className="text-xl font-semibold">{fr?'Que disent vraiment les agents ?':'What are agents actually reporting?'}</h2>
        </div>
        <button type="button" className="xa-button secondary min-h-[44px]"
          disabled={state==='checking'} onClick={()=>setRequested(v=>v+1)}>
          {fr?'Vérifier à nouveau':'Check again'}
        </button>
      </div>
      <p role="status" aria-live="polite" data-testid="xorus-agent-state">
        {state==='checking'
          ? (fr?'Consultation de l’API xOrus…':'Checking xOrus API…')
          : state==='unavailable'
            ? (fr?'Analyse serveur indisponible ou non conforme. Aucun signal de remplacement n’est affiché.'
                :'Server analysis unavailable or invalid. No substitute signals are displayed.')
            : (fr?'Rapport serveur validé dans son format. Observations non vérifiées indépendamment.'
                :'Server report format validated. Observations are not independently verified.')}
      </p>
      {report&&<div className="space-y-3">
        <p className="text-base font-semibold" data-testid="xorus-agent-verdict">
          ABSTAIN · {reason?(fr?reason.fr:reason.en):''}
        </p>
        {report.stale&&<p className="xa-intelligence-note" role="note">
          {fr?'Rapport historique : les observations sont trop anciennes pour une lecture actuelle.'
            :'Historical report: observations are too old for a current reading.'}
        </p>}
        <dl className="grid gap-3 sm:grid-cols-3">
          <div><dt className="text-xs uppercase">{fr?'Indicateurs calculés':'Calculated indicators'}</dt>
            <dd className="text-2xl font-semibold tabular-nums">{report.signalsAnalyzed} / 12</dd></div>
          <div><dt className="text-xs uppercase">{fr?'Familles analysées':'Families analyzed'}</dt>
            <dd className="text-2xl font-semibold tabular-nums">{report.familiesAnalyzed} / 3</dd></div>
          <div><dt className="text-xs uppercase">{fr?'Signaux vérifiés indépendamment':'Independently verified signals'}</dt>
            <dd className="text-2xl font-semibold tabular-nums" data-testid="xorus-verified">0</dd></div>
        </dl>
        <p className="xa-intelligence-note">
          {fr?'Rapport généré : ':'Generated: '}{new Date(report.generatedAt).toLocaleString(fr?'fr-FR':'en-GB')}
          {' · '}{report.sourceTs
            ? (fr?'Source datée : ':'Source dated: ')+new Date(report.sourceTs).toLocaleString(fr?'fr-FR':'en-GB')
            : (fr?'Aucun horodatage fournisseur':'No provider timestamp')}
        </p>
        <p className="xa-intelligence-note">{report.collection?.state==='observed'
          ? (fr?'Binance Spot EGLD/USDT, source unique paper ; les droits commerciaux de cette source ne sont pas certifiés.'
            :'Binance Spot EGLD/USDT, single paper source; its commercial usage rights are not certified.')
          : (fr?'Aucune observation fournisseur actuelle exploitable.':'No usable current provider observation.')}</p>
      </div>}
      <p className="xa-intelligence-note">{fr
        ? 'Décision lecture seule : aucune signature, transaction, recommandation d’achat ou vente de données brutes. Les abonnements premium ne sont pas ouverts.'
        : 'Read-only assessment: no signing, transaction, buy instruction or raw feed resale. Premium subscriptions remain closed.'}</p>
    </header>
    <div className="xa-intelligence-cards" aria-label={fr?'Trois domaines d’analyse':'Three analysis areas'}>
      {coverage.map(track=><article className="xa-intelligence-card space-y-2" key={track.id}
        data-testid={'xorus-track-'+track.id}>
        <p className="xa-intelligence-eyebrow">{track.name}</p>
        <h3>{fr?track.fr:track.en}</h3>
        <p>{state==='validated'&&!report?.stale
          ? track.scored>0
            ? (fr?String(track.scored)+' indicateur(s) paper calculé(s) — pas de vérification indépendante.'
              :String(track.scored)+' paper indicator(s) calculated — not independently verified.')
            : (fr?'Aucun indicateur exploitable dans ce domaine.':'No usable indicator in this area.')
          : (fr?'Couverture indisponible ou historique ; aucun signal actuel présumé.'
              :'Coverage unavailable or historical; no current signals assumed.')}</p>
        <p className="xa-intelligence-note">{fr?'Rapport commercial : non disponible':'Commercial report: unavailable'}</p>
      </article>)}
    </div>
    {report&&<details className="xa-intelligence-advanced">
      <summary>{fr?'Détails des huit rôles et de leurs preuves':'Eight agent roles and evidence details'}</summary>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {report.agents.map(agent=><article key={agent.agent} className="xa-intelligence-card space-y-2"
          data-testid={'xorus-role-'+agent.agent}>
          <h3 className="font-semibold">{ROLE_NAME[agent.agent]}</h3>
          <p>{fr?ROLE_INFO[agent.agent].fr:ROLE_INFO[agent.agent].en}</p>
          <p className="xa-intelligence-note">{agent.status==='veto'
            ? (fr?'Veto Sentinel : abstention':'Sentinel veto: abstain')
            : agent.status==='paper_unverified'
              ? (fr?'Analyse paper, non vérifiée':'Unverified paper analysis')
              : (fr?'Aucune donnée vérifiée pour ce rôle':'No verified input for this role')}</p>
          <ul className="space-y-1 text-sm">
            {agent.families.map(f=><li key={f.family}>
              {f.family} · {fr?READINGS[f.reading].fr:READINGS[f.reading].en}
              {f.count>0?' ('+f.count+')':''}
            </li>)}
          </ul>
        </article>)}
      </div>
    </details>}
    <div className="flex flex-wrap gap-3">
      <Link className="xa-button secondary" to="/intelligence/xorus">
        {fr?'Voir la décision complète':'View full decision'}</Link>
      <Link className="xa-button secondary" to="/intelligence/lab">
        {fr?'Examiner le Lab':'Explore Lab'}</Link>
      <Link className="xa-button secondary" to="/offres">
        {fr?'Découvrir les offres prévues':'View planned services'}</Link>
    </div>
    {checkedAt!==null&&<p className="xa-intelligence-note text-xs">
      {fr?'API consultée : ':'API checked: '}{new Date(checkedAt).toLocaleString(fr?'fr-FR':'en-GB')}
      {' · '}{fr?'Cette heure ne constitue pas la date de la source.':'This is not the source timestamp.'}
    </p>}
  </section>
}
