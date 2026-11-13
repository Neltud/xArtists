/**
 * xOrus public analysis desk: server analysis when configured, otherwise the
 * explicitly offline preview. Separate read-only MultiversX network context.
 * No illustrative or cached fallback market prices are used in this desk.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext'
import { interpretXorusSnapshot, parseMultiversxEconomics } from '../../lib/xorusDecisionReadout.mjs'
import { interpretXorusAnalysisReport } from '../../lib/xorusAnalysisReadout.mjs'
import XorusAnalysisReport from './XorusAnalysisReport'
import XorusSignalCatalog from './XorusSignalCatalog'

const MVX_ECONOMICS='https://api.multiversx.com/economics?fields=price,marketCap,volume24h'

async function readJson(url:string,signal:AbortSignal):Promise<unknown>{
  const res=await fetch(url,{signal,cache:'no-store'})
  if(!res.ok)throw new Error('unavailable')
  return await res.json() as unknown
}

/** One bounded retry for a temporarily waking API; never retry 4xx, including
 * 429, and never substitute the static preview for a configured server.
 * Refresh remains a human action; no uncontrolled polling or background loop.
 */
const TRANSIENT_HTTP=new Set([502,503,504])
function shortRetryDelay(signal:AbortSignal):Promise<void>{
  return new Promise((resolve,reject)=>{
    if(signal.aborted){reject(new Error('aborted'));return}
    const onAbort=()=>{window.clearTimeout(timer);reject(new Error('aborted'))}
    const timer=window.setTimeout(()=>{signal.removeEventListener('abort',onAbort);resolve()},750)
    signal.addEventListener('abort',onAbort,{once:true})
  })
}
async function readServerAnalysis(url:string,signal:AbortSignal):Promise<unknown>{
  let response:Response|undefined
  try{response=await fetch(url,{signal,cache:'no-store'})}
  catch(error){if(signal.aborted)throw error}
  if(response?.ok)return await response.json() as unknown
  if(response&&!TRANSIENT_HTTP.has(response.status))throw new Error('unavailable')
  await shortRetryDelay(signal)
  const retry=await fetch(url,{signal,cache:'no-store'})
  if(!retry.ok)throw new Error('unavailable')
  return await retry.json() as unknown
}

const fmtUsd=(v:number)=>new Intl.NumberFormat('fr-FR',{style:'currency',currency:'USD',maximumFractionDigits:3}).format(v)

export default function XorusDecisionDesk(){
  const {lang}=useI18n()
  const fr=lang==='fr'
  const [board,setBoard]=useState<unknown>(null)
  const [economics,setEconomics]=useState<unknown>(null)
  const [analysis,setAnalysis]=useState<unknown>(null)
  const [checkedAt,setCheckedAt]=useState<number>(Date.now())
  const [clockNow,setClockNow]=useState<number>(Date.now)
  const [busy,setBusy]=useState(true)
  const [revision,setRevision]=useState(0)
  const source=`${import.meta.env.BASE_URL || '/'}data/xorus_board.json`
  const apiBase=((import.meta.env.VITE_ACCESS_API_BASE as string|undefined)||'').trim().replace(/\/+$/,'')
  const analysisSource=apiBase?`${apiBase}/v1/xorus/analysis`:`${import.meta.env.BASE_URL || '/'}data/xorus_analysis_preview.json`
  const refresh=useCallback(()=>setRevision(v=>v+1),[])
  useEffect(()=>{
    const ctl=new AbortController()
    setClockNow(Date.now())
    setBusy(true)
    setBoard(null)
    setEconomics(null)
    setAnalysis(null)
    const timer=window.setTimeout(()=>{ctl.abort();setCheckedAt(Date.now());setBusy(false)},apiBase?20000:10000)
    // An optional quote provider must not hold back an available analysis.
    void Promise.allSettled([
      readJson(source,ctl.signal).then(value=>{if(!ctl.signal.aborted)setBoard(value)}),
      readJson(MVX_ECONOMICS,ctl.signal).then(value=>{if(!ctl.signal.aborted)setEconomics(value)}),
      (apiBase?readServerAnalysis(analysisSource,ctl.signal):readJson(analysisSource,ctl.signal)).then(value=>{
        if(ctl.signal.aborted)return
        if(apiBase){
          const envelope=value as {ok?:unknown;report?:{schema?:unknown}}|null
          setAnalysis(envelope?.ok===true&&envelope.report?.schema==='xorus_analysis/v2'?envelope.report:null)
        }else setAnalysis(value)
      }),
    ]).finally(()=>{
      window.clearTimeout(timer)
      if(!ctl.signal.aborted){setCheckedAt(Date.now());setBusy(false)}
    })
    return ()=>{window.clearTimeout(timer);ctl.abort()}
  },[source,analysisSource,apiBase,revision])
  useEffect(()=>{
    const timer=window.setInterval(()=>setClockNow(Date.now()),30000)
    return ()=>window.clearInterval(timer)
  },[])

  const status=useMemo(()=>interpretXorusSnapshot(board,clockNow),[board,clockNow])
  const market=useMemo(()=>parseMultiversxEconomics(economics),[economics])
  const report=useMemo(()=>interpretXorusAnalysisReport(analysis,clockNow),[analysis,clockNow])
  const sourceTs=apiBase?report?.sourceTs:status.sourceTs
  const fromSource=sourceTs
    ? new Date(sourceTs).toLocaleString(fr?'fr-FR':'en-GB',{dateStyle:'medium',timeStyle:'short'})
    : null
  const offlineReason=fr
    ? (status.reason==='stale_snapshot'
        ? 'Source trop ancienne pour décider. Une nouvelle consultation ne la rend pas récente.'
        : status.reason==='thin_tape'
          ? 'Pas assez de signaux pour statuer : minimum 12 et 3 familles distinctes.'
          : status.state==='unavailable'
            ? 'Aucune preuve exploitable : instantané absent ou non conforme.'
            : 'Aucune attestation indépendante des données : abstention obligatoire.')
    : (status.reason==='stale_snapshot'
        ? 'Source is too old to decide. Refreshing the page does not refresh the producer.'
        : status.reason==='thin_tape'
          ? 'Insufficient inputs: at least 12 signals and 3 independent families required.'
          : status.state==='unavailable'
            ? 'No usable evidence: missing or invalid snapshot.'
            : 'No independently verified input provenance: abstention is required.')

  const reason=apiBase
    ? !report?.collection||report.collection.state!=='observed'
      ? (fr?'Source serveur indisponible ou inexploitable. Aucune ancienne conclusion réutilisée.':'Server source unavailable or unusable. Previous findings are not reused.')
      : report.stale
        ? (fr?'Observations trop anciennes : actualisez l’analyse.':'Observations are too old: refresh the analysis.')
        : (fr?`Analyse calculée sur ${report.signalsAnalyzed} indicateurs de bougies horaires clôturées. Source unique, non attestée indépendamment : abstention.`
          : `Analysis calculated from ${report.signalsAnalyzed} closed-hourly-candle indicators. Single source, not independently attested: abstain.`)
    : offlineReason
  return <section aria-label={fr?'Analyse décisionnelle xOrus':'xOrus decision analysis'}
      className="space-y-4" data-testid="xorus-decision-desk">
    <div className="xa-intelligence-hero">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="xa-intelligence-eyebrow">{fr?'Moteur d’analyse et de décision':'Analysis and decision engine'}</p>
          <h2 className="mt-2 text-xl font-bold sm:text-2xl">{fr?'Décision xOrus':'xOrus decision'}</h2>
          <p>{fr
            ? 'Le résultat repose sur les observations et leurs preuves, pas sur une animation ou un agent fictif.'
            : 'The result depends on observations and evidence, not on animations or fictional agents.'}</p>
        </div>
        <button type="button" className="xa-button secondary min-h-[44px]" disabled={busy} onClick={refresh}>
          {fr?'Actualiser les sources':'Check sources'}
        </button>
      </div>
      <div className="xa-intelligence-status" role="status" aria-live="polite">
        <strong className="block text-lg">{fr?'S’ABSTENIR':'ABSTAIN'} · {fr?'aucun ordre autorisé':'no order authorized'}</strong>
        <p className="mt-1">{busy&&!report
          ? (fr?'Lecture des sources…':'Reading sources…')
          : reason}</p>
        <p className="mt-2 text-xs">{apiBase
          ? (fr?'Analyse serveur en mode paper. Pas une recommandation financière.':'Server analysis in paper mode. Not investment advice.')
          : (fr?'Décision issue d’un instantané paper — pas une recommandation financière.':'Decision derived from a paper snapshot — not investment advice.')}</p>
      </div>
      <p className="xa-intelligence-note mt-3">{fromSource
        ? (fr?`Source publiée : ${fromSource}`:`Published source: ${fromSource}`)
        : (fr?'Date de source indisponible':'Source date unavailable')}
        {(apiBase?report?.collection?.sourceAgeMinutes:status.ageMinutes)!=null?` · ${apiBase?report?.collection?.sourceAgeMinutes:status.ageMinutes} min`:''}
        {(apiBase?report?.stale:status.isStale)?' · '+(fr?'PÉRIMÉ':'STALE'):''}
      </p>
    </div>

    <div className="xa-intelligence-cards" aria-label={fr?'Couverture et preuves':'Coverage and evidence'}>
      <article className="xa-intelligence-card">
        <h3>{fr?'Catalogue':'Catalogue'}</h3>
        <p className="text-2xl font-bold tabular-nums">{status.signalsDefined}</p>
        <p>{fr?'Signaux définis, pas tous alimentés':'Defined signals, not all populated'}</p>
      </article>
      <article className="xa-intelligence-card">
        <h3>{apiBase?(fr?'Indicateurs analysés':'Analyzed indicators'):(fr?'Historique déclaré':'Reported historical feed')}</h3>
        <p className="text-2xl font-bold tabular-nums">{(apiBase?report?.signalsAnalyzed:status.signalsReported)??'—'} / 12</p>
        <p>{apiBase
          ? (fr?'Indicateurs calculés ; ils ne constituent pas des preuves indépendantes.':'Calculated indicators; these are not independent evidence.')
          : (fr?'Seuil minimal de signaux. Instantané non temps réel.':'Minimum scored-signal threshold. Historical, not real-time.')}</p>
      </article>
      <article className="xa-intelligence-card">
        <h3>{fr?'Preuves vérifiées':'Independently verified'}</h3>
        <p className="text-2xl font-bold tabular-nums">0</p>
        <p>{fr?'Aucune attestation indépendante des entrées analysées.':'No independent attestation of the analyzed inputs.'}</p>
      </article>
    </div>

    <div className="grid gap-4 md:grid-cols-2">
      <article className="xa-intelligence-card">
        <h3>{fr?'Marché MultiversX (lecture seule)':'MultiversX market (read-only)'}</h3>
        {market
          ? <>
            <p className="mt-2 text-2xl font-bold tabular-nums">EGLD · {fmtUsd(market.priceUsd)}</p>
            {market.marketCapUsd!==null&&<p>{fr?'Capitalisation':'Market cap'} · {fmtUsd(market.marketCapUsd)}</p>}
            <p className="xa-intelligence-note">{fr
              ? 'Valeur lue sur l’API publique MultiversX. Heure de consultation seulement ; la date de production de ce prix n’est pas attestée. Exclue de toute décision xOrus.'
              : 'Value read from the public MultiversX API. This is the check time, not a verified price-source timestamp. Excluded from xOrus decisions.'}</p>
          </>
          : <p>{fr?'Prix indisponible : aucune valeur de remplacement inventée.':'Price unavailable: no invented fallback quote.'}</p>}
        <p className="xa-intelligence-note mt-2" data-testid="xorus-quote-checked-at">{fr?'Consulté':'Checked'} · {new Date(checkedAt).toLocaleString(fr?'fr-FR':'en-GB')}</p>
        <a href="https://api.multiversx.com/economics" rel="noopener noreferrer" target="_blank">{fr?'Source : API MultiversX':'Source: MultiversX API'}</a>
      </article>
      <article className="xa-intelligence-card">
        <h3>{fr?'Pourquoi ce verdict ?':'Why this decision?'}</h3>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
          <li>{fr?'Minimum 12 signaux reçus et 3 familles indépendantes.':'Minimum 12 scored signals from 3 independent families.'}</li>
          <li>{fr?'Horodatage, fraîcheur, provenance et droits de données obligatoires.':'Source timestamp, freshness, provenance and data rights are required.'}</li>
          <li>{fr?'Sentinel conserve son veto même si les autres agents sont positifs.':'Sentinel keeps its veto even if other agents are positive.'}</li>
          <li>{fr?'L’avis IA ne dépasse jamais 15 %, et ne remplace pas une preuve.':'AI advice is capped at 15% and never replaces evidence.'}</li>
        </ol>
        <a href={apiBase?analysisSource:source} target="_blank" rel="noopener noreferrer">{fr?'Consulter le rapport source':'Inspect published report'}</a>
      </article>
    </div>

    <XorusAnalysisReport report={report} />
    <XorusSignalCatalog />
    <nav className="flex flex-wrap gap-3" aria-label={fr?'Poursuivre l’analyse':'More analysis'}>
      <Link to="/explore/analytics" className="xa-button secondary">{fr?'Analyse des marchés':'Market analysis'}</Link>
      <Link to="/intelligence/agents" className="xa-button secondary">{fr?'Comprendre les agents':'Understand agents'}</Link>
      <Link to="/intelligence/lab" className="xa-button secondary">{fr?'Étudier les scénarios':'Study scenarios'}</Link>
    </nav>
  </section>
}
