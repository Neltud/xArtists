/**
 * xOrus public analysis desk: actual published paper decision + independent
 * read-only MultiversX network context. Not a simulated trading screen.
 * Never fetch legacy market_snapshot.json: it contains illustrative prices.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext'
import { interpretXorusSnapshot, parseMultiversxEconomics } from '../../lib/xorusDecisionReadout.mjs'
import XorusSignalCatalog from './XorusSignalCatalog'

const MVX_ECONOMICS='https://api.multiversx.com/economics?fields=price,marketCap,volume24h'
const AGENTS=[
  {name:'Tape',fr:'Prix, volumes, volatilité, liquidité, funding',en:'Prices, volume, volatility, liquidity, funding'},
  {name:'Scout',fr:'Chaîne MultiversX et écarts DEX',en:'MultiversX on-chain and DEX spreads'},
  {name:'Crowd',fr:'Contexte social et informations',en:'Social and news context'},
  {name:'Curator',fr:'Art, collections et NFT',en:'Art, collections and NFTs'},
  {name:'Sentinel',fr:'Risques, veto et arrêt opérateur',en:'Risk, veto and operator halt'},
  {name:'Macro',fr:'Contexte macroéconomique',en:'Macroeconomic context'},
  {name:'Chair',fr:'Avis consultatif IA, pondération ≤ 15 %',en:'Advisory AI input, max weight 15%'},
  {name:'Scribe',fr:'Journal des décisions, sans signature',en:'Decision record, no signature'},
] as const

async function readJson(url:string,signal:AbortSignal):Promise<unknown>{
  const res=await fetch(url,{signal,cache:'no-store'})
  if(!res.ok)throw new Error('unavailable')
  return await res.json() as unknown
}

const fmtUsd=(v:number)=>new Intl.NumberFormat('fr-FR',{style:'currency',currency:'USD',maximumFractionDigits:3}).format(v)

export default function XorusDecisionDesk(){
  const {lang}=useI18n()
  const fr=lang==='fr'
  const [board,setBoard]=useState<unknown>(null)
  const [economics,setEconomics]=useState<unknown>(null)
  const [checkedAt,setCheckedAt]=useState<number>(Date.now())
  const [busy,setBusy]=useState(true)
  const [revision,setRevision]=useState(0)
  const source=`${import.meta.env.BASE_URL || '/'}data/xorus_board.json`
  const refresh=useCallback(()=>setRevision(v=>v+1),[])
  useEffect(()=>{
    const ctl=new AbortController()
    setBusy(true)
    setBoard(null)
    setEconomics(null)
    const timer=window.setTimeout(()=>{ctl.abort();setCheckedAt(Date.now());setBusy(false)},10000)
    void Promise.allSettled([readJson(source,ctl.signal),readJson(MVX_ECONOMICS,ctl.signal)])
      .then(([paper,market])=>{
        if(ctl.signal.aborted)return
        setBoard(paper.status==='fulfilled'?paper.value:null)
        setEconomics(market.status==='fulfilled'?market.value:null)
        setCheckedAt(Date.now())
      }).finally(()=>{window.clearTimeout(timer);if(!ctl.signal.aborted)setBusy(false)})
    return ()=>{window.clearTimeout(timer);ctl.abort()}
  },[source,revision])

  const status=useMemo(()=>interpretXorusSnapshot(board,checkedAt),[board,checkedAt])
  const market=useMemo(()=>parseMultiversxEconomics(economics),[economics])
  const fromSource=status.sourceTs
    ? new Date(status.sourceTs).toLocaleString(fr?'fr-FR':'en-GB',{dateStyle:'medium',timeStyle:'short'})
    : null
  const reason=fr
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
        <p className="mt-1">{busy
          ? (fr?'Lecture des sources…':'Reading sources…')
          : reason}</p>
        <p className="mt-2 text-xs">{fr?'Décision issue d’un instantané paper — pas une recommandation financière.':'Decision derived from a paper snapshot — not investment advice.'}</p>
      </div>
      <p className="xa-intelligence-note mt-3">{fromSource
        ? (fr?`Source publiée : ${fromSource}`:`Published source: ${fromSource}`)
        : (fr?'Date de source indisponible':'Source date unavailable')}
        {status.ageMinutes!==null?` · ${status.ageMinutes} min`:''}
        {status.isStale?' · '+(fr?'PÉRIMÉ':'STALE'):''}
      </p>
    </div>

    <div className="xa-intelligence-cards" aria-label={fr?'Couverture et preuves':'Coverage and evidence'}>
      <article className="xa-intelligence-card">
        <h3>{fr?'Catalogue':'Catalogue'}</h3>
        <p className="text-2xl font-bold tabular-nums">{status.signalsDefined}</p>
        <p>{fr?'Signaux définis, pas tous alimentés':'Defined signals, not all populated'}</p>
      </article>
      <article className="xa-intelligence-card">
        <h3>{fr?'Historique déclaré':'Reported historical feed'}</h3>
        <p className="text-2xl font-bold tabular-nums">{status.signalsReported??'—'} / 12</p>
        <p>{fr?'Seuil minimal de signaux. Instantané non temps réel.':'Minimum scored-signal threshold. Historical, not real-time.'}</p>
      </article>
      <article className="xa-intelligence-card">
        <h3>{fr?'Preuves vérifiées':'Independently verified'}</h3>
        <p className="text-2xl font-bold tabular-nums">0</p>
        <p>{fr?'Aucune attestation indépendante dans ce fichier public.':'No independent provider attestations in this public file.'}</p>
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
        <p className="xa-intelligence-note mt-2">{fr?'Consulté':'Checked'} · {new Date(checkedAt).toLocaleString(fr?'fr-FR':'en-GB')}</p>
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
        <a href={source} target="_blank" rel="noopener noreferrer">{fr?'Consulter le rapport source':'Inspect published report'}</a>
      </article>
    </div>

    <details className="xa-intelligence-advanced">
      <summary>{fr?'Huit rôles du moteur hérité de LIA':'Eight roles preserved from the LIA engine'}</summary>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {AGENTS.map(a=><div key={a.name} className="rounded-xl border border-[color:var(--xa-border)] p-3">
          <strong>{a.name}</strong><p className="xa-intelligence-note">{fr?a.fr:a.en}</p>
        </div>)}
      </div>
      <p className="xa-intelligence-note mt-3">{fr
        ? 'Ces rôles décrivent le moteur. Leur présence ne prouve pas qu’un collecteur produit des données actuellement.'
        : 'These roles describe the engine. Their listing does not prove a live data collector is active.'}</p>
    </details>
    <XorusSignalCatalog />
    <nav className="flex flex-wrap gap-3" aria-label={fr?'Poursuivre l’analyse':'More analysis'}>
      <Link to="/market" className="xa-button secondary">{fr?'Analyse des marchés':'Market analysis'}</Link>
      <Link to="/intelligence/agents" className="xa-button secondary">{fr?'Comprendre les agents':'Understand agents'}</Link>
      <Link to="/intelligence/lab" className="xa-button secondary">{fr?'Étudier les scénarios':'Study scenarios'}</Link>
    </nav>
  </section>
}
