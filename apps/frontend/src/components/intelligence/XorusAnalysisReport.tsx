import { useI18n } from '../../i18n/I18nContext'
import type { XorusAnalysisReadout } from '../../lib/xorusAnalysisReadout.mjs'

const NAMES={scout:'Scout',tape:'Tape',crowd:'Crowd',curator:'Curator',sentinel:'Sentinel',macro:'Macro',chair:'Chair',scribe:'Scribe'}
const STATUS={
  fr:{recorded:'Synthèse consignée',veto:'Veto : abstention',advisory_unverified:'Avis consultatif non vérifié',paper_unverified:'Interprétation paper non vérifiée',context_only:'Contexte uniquement',no_input:'Analyse indisponible'},
  en:{recorded:'Synthesis recorded',veto:'Veto: abstain',advisory_unverified:'Unverified advisory input',paper_unverified:'Unverified paper interpretation',context_only:'Context only',no_input:'Analysis unavailable'},
}
const READING={
  fr:{no_input:'entrée absente',context_only:'contexte seulement',positive:'lecture positive',negative:'lecture négative',mixed:'indicateurs contradictoires',balanced:'indicateurs équilibrés'},
  en:{no_input:'no input',context_only:'context only',positive:'positive reading',negative:'negative reading',mixed:'conflicting indicators',balanced:'balanced indicators'},
}

export default function XorusAnalysisReport({report}:{report:XorusAnalysisReadout|null}){
  const {lang}=useI18n()
  const fr=lang==='fr'
  const locale=fr?'fr':'en'
  return <section className="xa-intelligence-card space-y-4" aria-label={fr?'Rapport d’analyse xOrus':'xOrus analysis report'} data-testid="xorus-analysis-report">
    <div>
      <p className="xa-intelligence-eyebrow">{fr?'Le produit xOrus':'The xOrus product'}</p>
      <h3>{fr?'Nos analyses : synthèse, scénarios et risques':'Our analysis: synthesis, scenarios and risks'}</h3>
      <p>{fr
        ? 'Les abonnements et packs d’accès portent sur les analyses produites par xArtists. Les données collectées servent d’entrées internes et ne sont pas revendues.'
        : 'Subscriptions and access packs cover analysis produced by xArtists. Collected data are internal inputs and are not resold.'}</p>
    </div>
    <p role="status" className="xa-intelligence-note">{!report
      ? (fr?'Rapport indisponible ou non conforme. Aucune conclusion de remplacement.':'Report unavailable or invalid. No substitute conclusion.')
      : report.signalsAnalyzed===0
        ? (fr?'Aucune entrée exploitable : la synthèse reste en attente de preuves.':'No usable inputs: the synthesis is awaiting evidence.')
        : (fr?'Hypothèses paper uniquement : les entrées ne sont pas attestées indépendamment.':'Paper hypotheses only: the inputs have not been independently verified.')}</p>
    {report&&<>
      <p className="xa-intelligence-note">{fr?'Rapport généré':'Report generated'} · {new Date(report.generatedAt).toLocaleString(fr?'fr-FR':'en-GB')}
        {report.stale?' · '+(fr?'HISTORIQUE':'HISTORICAL'):''}
        {' · '}{fr?'Date des observations indisponible. La génération ne prouve pas la fraîcheur des sources.':'Observation time unavailable. Generation does not prove source freshness.'}
      </p>
      <details className="xa-intelligence-advanced">
        <summary>{fr?'Voir les analyses par agent (8)':'View analysis by agent (8)'}</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {report.agents.map(agent=><article key={agent.agent} className="min-w-0 rounded-xl border border-[color:var(--xa-border)] p-3">
            <h4 className="font-semibold">{NAMES[agent.agent]}</h4>
            <p className="text-sm">{STATUS[locale][agent.status]}</p>
            {agent.families.length>0&&<ul className="xa-intelligence-note mt-2 space-y-1">
              {agent.families.map(f=><li key={f.family}>{f.family} · {READING[locale][f.reading]}</li>)}
            </ul>}
          </article>)}
        </div>
        <p className="xa-intelligence-note mt-3">{fr
          ? 'Rapport paper fondé sur les entrées disponibles. La présence d’un rôle ne prouve pas que ses sources sont alimentées.'
          : 'Paper report based on available inputs. A listed role does not establish that its sources are populated.'}</p>
      </details>
      <div className="text-sm">
        <h4 className="font-semibold">{fr?'Conditions de réévaluation':'Reassessment conditions'}</h4>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>{fr?'Réexaminer la synthèse après revue des sources et obtention d’au moins 12 signaux vérifiés dans 3 familles.':'Reassess after source review and at least 12 verified signals across 3 families.'}</li>
          <li>{fr?'Maintenir l’abstention en cas de veto Sentinel ou d’arrêt opérateur.':'Maintain abstention if Sentinel vetoes or the operator halts.'}</li>
        </ul>
      </div>
    </>}
  </section>
}
