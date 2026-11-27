import { useState } from 'react'
import { useI18n } from '../../i18n/I18nContext'
import { applyPaperCommand, createPaperState, paperLedgerView,
  type PaperState, type PaperNetwork } from '../../../../../packages/core/src/paper-ledger.mjs'

const KEY = 'xartists-xorus-paper-ledger-v1'
const USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const money = (cents: number) => (cents / 100).toFixed(2) + ' USD'
function cents(value: string) {
  const match = value.trim().replace(',', '.').match(/^(\d{1,6})(?:\.(\d{1,2}))?$/)
  return match ? Number(match[1]) * 100 + Number((match[2] || '').padEnd(2, '0')) : NaN
}
function load(): {state: PaperState | null; error: string} {
  try {
    const raw = localStorage.getItem(KEY)
    const state: PaperState = raw ? JSON.parse(raw) : createPaperState()
    paperLedgerView(state)
    return {state, error: ''}
  } catch { return {state: null, error: 'paper_local_state_unavailable'} }
}

export default function PaperTradingPanel() {
  const { lang } = useI18n(), fr = lang === 'fr'
  const [initial] = useState(load)
  const [state, setState] = useState<PaperState | null>(initial.state)
  const [error, setError] = useState(initial.error)
  const [network, setNetwork] = useState<PaperNetwork>('solana')
  const [tokenIn, setTokenIn] = useState('native'), [tokenOut, setTokenOut] = useState(USDC)
  const [amount, setAmount] = useState('5.00'), [fee, setFee] = useState('0.01')
  const [values, setValues] = useState<Record<string,string>>({})
  const view = state ? paperLedgerView(state) : null
  const update = (command: Record<string, unknown>) => {
    if (!state) return
    const now = Date.now()
    const outcome = applyPaperCommand(state, {...command, idempotency_key: crypto.randomUUID(), reference_at_ms: now}, now)
    if (!outcome.ok) { setError(outcome.error); return }
    try {
      localStorage.setItem(KEY, JSON.stringify(outcome.state))
      setState(outcome.state); setError('')
    } catch { setError('paper_local_storage_failed') }
  }
  const reset = () => {
    const fresh = createPaperState()
    try { localStorage.setItem(KEY, JSON.stringify(fresh)); setState(fresh); setError(''); setValues({}) }
    catch { setError('paper_local_storage_failed') }
  }
  const inputClass = 'mt-1 min-h-11 w-full min-w-0 rounded-lg border border-zinc-300 bg-white px-3 text-zinc-950 dark:border-zinc-600 dark:bg-zinc-950 dark:text-white'
  const buttonClass = 'min-h-11 rounded-lg border border-zinc-300 px-4 text-sm dark:border-zinc-600'
  return <section data-testid="xorus-paper-terminal" className="space-y-4 rounded-2xl border border-zinc-300 bg-white/70 p-4 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100">
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide">{fr ? 'Bêta · simulation locale' : 'Beta · local simulation'}</p>
      <h2 className="text-xl font-semibold">{fr ? 'Essayer une opération xOrus' : 'Try an xOrus operation'}</h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">{fr
        ? '100 USD virtuels : 40 MultiversX, 40 Solana, 20 en réserve. Valeurs et frais saisis manuellement. Aucun prix de marché, connexion wallet ou ordre réel.'
        : '100 virtual USD: 40 MultiversX, 40 Solana, 20 in reserve. Values and fees are entered manually. No market price, wallet connection or real order.'}</p>
    </div>
    {view && <>
      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div><dt>{fr ? 'Exposition simulée' : 'Simulated exposure'}</dt><dd className="font-semibold">{money(view.risk.global.open_notional_cents)}</dd></div>
        <div><dt>{fr ? 'Pertes + frais / 24 h' : 'Losses + fees / 24h'}</dt><dd>{money(view.risk.global.loss_24h_cents)} / 2.00 USD</dd></div>
        <div><dt>{fr ? 'Pertes du pilote' : 'Pilot losses'}</dt><dd>{money(view.risk.global.loss_pilot_cents)} / 5.00 USD</dd></div>
        <div><dt>{fr ? 'Résultat fictif' : 'Hypothetical P&L'}</dt><dd>{money(view.risk.paper_net_pnl_cents)}</dd></div>
      </dl>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={event => {event.preventDefault(); update({type:'propose',network,token_in:tokenIn,token_out:tokenOut,notional_cents:cents(amount),fee_cents:cents(fee),slippage_bps:50})}}>
        <label className="text-sm">{fr ? 'Réseau simulé' : 'Simulated network'}<select className={inputClass} value={network} onChange={e=>{const n=e.target.value as PaperNetwork;setNetwork(n);setTokenIn(n==='solana'?'native':'EGLD');setTokenOut(n==='solana'?USDC:'')}}><option value="solana">Solana</option><option value="multiversx">MultiversX</option></select></label>
        <label className="text-sm">{fr ? 'Montant virtuel (USD, max. 5)' : 'Virtual amount (USD, max 5)'}<input className={inputClass} inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)} required/></label>
        <label className="min-w-0 text-sm">{fr ? 'Actif source : identifiant exact' : 'Source asset: exact identifier'}<input className={inputClass} value={tokenIn} onChange={e=>setTokenIn(e.target.value)} maxLength={80} required/></label>
        <label className="min-w-0 text-sm">{fr ? 'Actif cible : identifiant exact' : 'Target asset: exact identifier'}<input className={inputClass} value={tokenOut} placeholder={network==='multiversx'?'TICKER-abcdef':USDC} onChange={e=>setTokenOut(e.target.value)} maxLength={80} required/></label>
        <label className="text-sm">{fr ? 'Frais fictifs à l’entrée (USD)' : 'Hypothetical entry fees (USD)'}<input className={inputClass} inputMode="decimal" value={fee} onChange={e=>setFee(e.target.value)} required/></label>
        <button className={buttonClass + ' self-end bg-zinc-900 text-white dark:bg-white dark:text-zinc-950'} type="submit">{fr ? 'Simuler une entrée' : 'Simulate an entry'}</button>
      </form>
      <p className="text-xs text-zinc-600 dark:text-zinc-400">{fr ? 'Une position par réseau. Les seuils arrêtent les nouvelles entrées ; ils ne garantissent pas une perte maximale. Les identifiants ne sont pas vérifiés sur la chaîne.' : 'One position per network. Stops block new entries; they do not guarantee a maximum loss. Token identifiers are not verified on-chain.'}</p>
      {view.proposals.length>0 && <ul className="space-y-3">{view.proposals.slice().reverse().map(p=><li key={p.id} className="min-w-0 space-y-2 rounded-xl border border-zinc-200 p-3 text-sm dark:border-zinc-700">
        <p className="break-all font-medium">{p.network} · {p.token_in} → {p.token_out}</p>
        {p.status==='closed_simulation' ? <p>{fr ? 'Simulation clôturée · résultat fictif : ' : 'Closed simulation · hypothetical P&L: '}{money(p.paper_net_pnl_cents || 0)}</p> : <>
          <p>{fr ? 'Entrée virtuelle : ' : 'Virtual entry: '}{money(p.notional_cents)} · {fr ? 'dernière valeur manuelle : ' : 'last manual value: '}{money(p.mark_value_cents)}</p>
          <label className="block">{fr ? 'Valeur fictive actuelle (USD)' : 'Current hypothetical value (USD)'}<input className={inputClass} inputMode="decimal" value={values[p.id] ?? (p.mark_value_cents/100).toFixed(2)} onChange={e=>setValues({...values,[p.id]:e.target.value})}/></label>
          <div className="flex flex-wrap gap-2"><button className={buttonClass} type="button" onClick={()=>update({type:'mark',proposal_id:p.id,value_cents:cents(values[p.id] ?? (p.mark_value_cents/100).toFixed(2))})}>{fr ? 'Simuler la valeur' : 'Simulate value'}</button><button className={buttonClass} type="button" onClick={()=>update({type:'close',proposal_id:p.id,value_cents:cents(values[p.id] ?? (p.mark_value_cents/100).toFixed(2)),fee_cents:cents(fee)})}>{fr ? 'Clôturer la simulation' : 'Close simulation'}</button></div>
        </>}
      </li>)}</ul>}
      {(view.halts.pilot || Date.now()<view.halts.daily_until_ms || Object.values(view.halts.networks).some(h=>h.pilot||Date.now()<h.daily_until_ms)) && <p role="status" className="font-medium text-amber-800 dark:text-amber-300">{fr ? 'Un seuil d’arrêt est atteint. Les nouvelles entrées du réseau concerné sont bloquées ; les simulations ouvertes peuvent être clôturées.' : 'A stop threshold was reached. New entries on the affected network are blocked; open simulations can still be closed.'}</p>}
      <p className="text-xs">{fr ? 'Journal conservé sur cet appareil uniquement. Résultats fictifs, sans inférence IA.' : 'Journal saved on this device only. Hypothetical results, no AI inference.'}</p>
    </>}
    {error && <p role="alert" className="break-words text-sm text-red-700 dark:text-red-300">{({position_limit:fr?'Une simulation est déjà ouverte sur ce réseau.':'A simulation is already open on this network.',order_cap_exceeded:fr?'Le montant dépasse le plafond de 5 USD.':'Amount exceeds the 5 USD cap.',daily_loss_stop:fr?'Seuil de pertes sur 24 h atteint.':'24-hour loss stop reached.',pilot_loss_stop:fr?'Seuil de pertes cumulées atteint.':'Pilot loss stop reached.',exact_asset_identifier_required:fr?'Utilisez les identifiants exacts de deux actifs distincts.':'Use exact identifiers for two distinct assets.',fees_exhaust_loss_allowance:fr?'Les frais dépasseraient le seuil de pertes autorisé.':'Fees would exhaust the loss allowance.',paper_local_state_unavailable:fr?'Le journal local est indisponible ou incompatible. Vous pouvez réinitialiser cette simulation.':'The local journal is unavailable or incompatible. You can reset this simulation.',paper_local_storage_failed:fr?'Enregistrement local impossible. La simulation précédente est conservée.':'Local saving failed. The previous simulation is preserved.'} as Record<string,string>)[error] || (fr?'Simulation refusée. Vérifiez les montants, frais et identifiants.':'Simulation refused. Check amounts, fees and identifiers.')}</p>}
    <button type="button" className={buttonClass+' text-xs'} onClick={reset}>{fr ? 'Réinitialiser le journal fictif local' : 'Reset the local hypothetical journal'}</button>
  </section>
}
