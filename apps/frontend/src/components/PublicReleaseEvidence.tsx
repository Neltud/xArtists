/** Public API evidence, not a GO-LIVE switch or a transaction widget. */
import {useCallback,useEffect,useRef,useState} from 'react'
import {PUBLIC_ACCESS_API,verifiedXartistsApiBase} from '../lib/walletlessOtp.mjs'
import {fetchPublicReleaseEvidence,type EvidenceResult} from '../lib/releaseEvidence.mjs'

const API=verifiedXartistsApiBase(
  (import.meta.env.VITE_ACCESS_API_BASE as string|undefined)||PUBLIC_ACCESS_API
)||PUBLIC_ACCESS_API

export default function PublicReleaseEvidence(){
  const [evidence,setEvidence]=useState<EvidenceResult|null>(null)
  const [checking,setChecking]=useState(false)
  const sequence=useRef(0)
  const refresh=useCallback(async()=>{
    const id=++sequence.current
    setChecking(true)
    try{
      const data=await fetchPublicReleaseEvidence({
        siteBase:new URL(import.meta.env.BASE_URL||'/',window.location.origin).href,
        apiBase:API,
      })
      if(sequence.current===id)setEvidence(data)
    }catch{
      if(sequence.current===id)setEvidence(null)
    }finally{
      if(sequence.current===id)setChecking(false)
    }
  },[])
  useEffect(()=>{void refresh();return()=>{sequence.current++}},[refresh])
  return <section className="space-y-4 rounded-2xl border border-[var(--xa-border)] bg-[var(--xa-panel)] p-4 sm:p-6"
    aria-labelledby="xa-public-evidence-title" data-testid="public-release-evidence">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 space-y-1">
        <h2 id="xa-public-evidence-title" className="text-lg font-semibold text-[var(--xa-text)]">
          Preuves publiques par module
        </h2>
        <p className="max-w-2xl text-xs leading-6 text-[var(--xa-muted)]">
          Contrôle en lecture seule du site et de l’API. Une réponse serveur ne prouve ni
          une vente, ni une connexion wallet, ni une réception de courriel. Aucun achat,
          paiement, mint, ordre ou signature n’est déclenché.
        </p>
      </div>
      <button type="button" className="btn-secondary min-h-[44px] text-sm"
        onClick={()=>void refresh()} disabled={checking}>
        {checking?'Vérification…':'Vérifier maintenant'}
      </button>
    </div>
    {evidence?.unsafeFlagReported&&<p role="alert" className="rounded-lg border border-amber-400/40 p-3 text-sm text-amber-300">
      Une configuration financière ou trading est annoncée par une sonde :
      activation NON homologuée, intervention opérateur requise.
    </p>}
    <div className="grid gap-3 sm:grid-cols-2">
      {(evidence?.rows||[]).map(row=><article key={row.key}
        className="rounded-xl border border-[var(--xa-border)] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-sm text-[var(--xa-text)]">{row.title}</h3>
          <span className="text-xs text-[var(--xa-muted)]">
            {row.state==='observed'?'Sonde observée':
              row.state==='partial'?'Technique partiel':
              row.state==='blocked'?'GO non certifié':'Non vérifié'}
          </span>
        </div>
        <p className="mt-2 text-xs leading-6 text-[var(--xa-muted)]">{row.detail}</p>
        {row.issue&&<a target="_blank" rel="noopener noreferrer"
          className="mt-2 inline-flex min-h-[36px] items-center text-xs underline underline-offset-4"
          href={`https://github.com/Neltud/xArtists/issues/${row.issue}`}>
          Suivre la preuve #{row.issue}
        </a>}
      </article>)}
    </div>
    {!checking&&!evidence&&<p role="status" className="text-sm text-[var(--xa-muted)]">
      Impossible de lire les sondes publiques. Aucun état LIVE déduit de cet échec.
    </p>}
    <p className="text-xs leading-6 text-[var(--xa-muted)]" aria-live="polite">
      {evidence?.observedAt? 'Consultation locale : '+new Date(evidence.observedAt).toLocaleString('fr-FR'):''}
      {' · '}
      Les autorisations financières et les preuves de livraison restent indépendantes.
    </p>
  </section>
}
