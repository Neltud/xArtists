/**
 * xOrus educational simulator. All inputs and outputs are fictional browser
 * examples. No feeds, automatic ticks, wallet, account or network requests.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'

type Scenario = 'calme' | 'variable' | 'stress'
const SCENARIOS: Record<Scenario,{move:number; fr:string;en:string;frNote:string;enNote:string}> = {
  calme:{move:2,fr:'Marché calme',en:'Calm market',
    frNote:'Exemple pédagogique : variation modérée de +2 %.',enNote:'Illustration: moderate +2% move.'},
  variable:{move:-5,fr:'Marché variable',en:'Changing market',
    frNote:'Exemple pédagogique : variation défavorable de −5 %.',enNote:'Illustration: unfavorable −5% move.'},
  stress:{move:-15,fr:'Marché sous tension',en:'Stressed market',
    frNote:'Exemple pédagogique : baisse de −15 %, sans protection garantie.',enNote:'Illustration: −15% drop, with no guaranteed protection.'},
}
const fmt=(value:number)=>Number.isFinite(value)?value.toFixed(2):'0.00'

export default function SimulationLab() {
  const { lang } = useI18n()
  const fr=lang==='fr'
  const [scenario,setScenario]=useState<Scenario>('variable')
  const [amount,setAmount]=useState(100)
  const model=SCENARIOS[scenario]
  const gross=amount*model.move/100
  const fees=amount*0.0025+0.08
  const net=gross-fees
  return <section className="space-y-5" aria-labelledby="xa-sim-heading">
    <div className="xa-intelligence-hero">
      <p className="xa-intelligence-eyebrow">{fr?'Exercice interactif · 100 % fictif':'Interactive exercise · 100% fictional'}</p>
      <h2 id="xa-sim-heading" className="!text-2xl">{fr?'Comprendre le risque en 3 étapes':'Understand risk in three steps'}</h2>
      <p>{fr
        ? 'Changez le scénario et le montant fictif pour voir comment un résultat peut varier. Les nombres ne sont ni des prix de marché, ni une prévision, ni une performance réelle d’agent.'
        : 'Change the fictional scenario and amount to see how an outcome can vary. These numbers are not market prices, forecasts or actual agent performance.'}</p>
    </div>

    <fieldset className="xa-intelligence-card">
      <legend className="text-base font-semibold">{fr?'1. Choisir une situation imaginaire':'1. Pick an imaginary situation'}</legend>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {(Object.keys(SCENARIOS) as Scenario[]).map(key=><label key={key}
          className="flex min-h-[52px] cursor-pointer items-center gap-2 rounded-xl border border-[color:var(--xa-border)] p-3">
          <input type="radio" name="xorus-example" value={key} checked={scenario===key}
            onChange={()=>setScenario(key)}/>
          <span className="text-sm font-medium">{fr?SCENARIOS[key].fr:SCENARIOS[key].en}</span>
        </label>)}
      </div>
    </fieldset>

    <div className="xa-intelligence-card">
      <label htmlFor="xorus-demo-amount" className="block text-base font-semibold">
        {fr?'2. Choisir un montant fictif':'2. Choose an imaginary amount'}
      </label>
      <p className="xa-intelligence-note mt-2">{fr?'Il ne sera ni débité ni investi.':'Nothing is charged or invested.'}</p>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <input id="xorus-demo-amount" type="range" min="100" max="1000" step="50"
          value={amount} onChange={event=>setAmount(Number(event.target.value))}
          className="min-w-[180px] flex-1" />
        <output htmlFor="xorus-demo-amount" className="min-w-[90px] text-right text-lg font-bold tabular-nums">{amount} €</output>
      </div>
    </div>

    <section className="xa-intelligence-card" aria-label={fr?'Résultat simulé':'Simulated result'}>
      <h3>{fr?'3. Voir ce qui peut changer':'3. See what can change'}</h3>
      <p>{fr?model.frNote:model.enNote}</p>
      <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div><dt className="text-xs text-[color:var(--xa-text-secondary)]">{fr?'Variation inventée':'Invented change'}</dt>
          <dd className="mt-1 font-bold tabular-nums">{model.move>0?'+':''}{model.move} %</dd></div>
        <div><dt className="text-xs text-[color:var(--xa-text-secondary)]">{fr?'Gain/perte théorique':'Hypothetical P/L'}</dt>
          <dd className="mt-1 font-bold tabular-nums">{fmt(gross)} €</dd></div>
        <div><dt className="text-xs text-[color:var(--xa-text-secondary)]">{fr?'Frais fictifs':'Fictional fees'}</dt>
          <dd className="mt-1 font-bold tabular-nums">{fmt(fees)} €</dd></div>
        <div><dt className="text-xs text-[color:var(--xa-text-secondary)]">{fr?'Résultat fictif net':'Fictional net'}</dt>
          <dd className="mt-1 font-bold tabular-nums">{fmt(net)} €</dd></div>
      </dl>
      <p role="status" className="xa-intelligence-status">{fr
        ? 'Simulation locale uniquement. Aucune transaction envoyée, aucun rendement promis, aucun agent actif.'
        : 'Local simulation only. No transaction sent, no promised return, no active agent.'}</p>
    </section>

    <details className="xa-intelligence-advanced">
      <summary>{fr?'Comment sont calculés ces exemples ?':'How are these examples calculated?'}</summary>
      <p className="xa-intelligence-note mt-3">{fr
        ? 'Gain/perte = montant × variation fictive. Frais fictifs = montant × 0,25 % + 0,08 €. Résultat net = gain/perte − frais. Ceci est une démonstration mathématique ; les frais réels et l’exécution varieraient.'
        : 'P/L = amount × imaginary change. Example fees = amount × 0.25% + €0.08. Net = P/L − fees. This is a mathematical illustration; real costs and execution would differ.'}</p>
    </details>
    <div className="flex flex-wrap gap-3 text-sm">
      <Link to="/xorus" className="xa-button secondary">{fr?'Comprendre xOrus':'Understand xOrus'}</Link>
      <Link to="/agents" className="xa-button secondary">{fr?'Explorer les agents':'Explore agents'}</Link>
    </div>
  </section>
}
