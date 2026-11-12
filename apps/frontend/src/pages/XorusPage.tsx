import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
/**
 * xOrus — Control Room 3D + Cockpit LIVE intents xPortal (v0.110).
 */
import { useCallback, useEffect, useState } from 'react'
import LiaHubControlRoomLazy from '../components/lia/LiaHubControlRoomLazy'
import { Link } from 'react-router-dom'
import IntelligencePath from '../components/intelligence/IntelligencePath'
import { useI18n } from '../i18n/I18nContext'
import { usePulse } from '../hooks/usePulse'
import { useLIAInterpreter } from '../hooks/useLIAInterpreter'
import { fetchEgldPrice } from '../lia/priceTick'
import { persistShadowExport } from '../lia/shadowExport'
import { fetchVellumLastRun, type VellumLastRun } from '../lia/vellumStatus'
import { fetchLiaHubStatus, type LiaHubStatus } from '../lia/hubStatus'
import { fetchLiaStatus, type LiaStatusV1 } from '../lia/liaStatus'
import { assessTelemetrySource } from '../lia/telemetryTruth.mjs'
import { fetchMarketAura } from '../lia/marketAura'
import LiaCommandTerminal from '../components/LiaCommandTerminal'
import DailySignalWidget from '../components/DailySignalWidget'
import EconomicPulse from '../components/lia/EconomicPulse'
import IntentFeedTerminal from '../components/lia/IntentFeedTerminal'
import HolderTerminal from '../components/lia/HolderTerminal'
import LiveAssetTape from '../components/LiveAssetTape'
import RceStrip from '../components/RceStrip'
import LiaAgentControl from '../components/LiaAgentControl'
import Pack3DCockpit from '../components/packs/Pack3DCockpit'
import { LIA_LIVE_TRADING, LIA_BADGE } from '../config/liaConfig'

const API = 'https://api.multiversx.com'
const LIA_WALLET = 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6'

type ExplorerTx = {
  txHash?: string
  function?: string
  status?: string
  value?: string
}

async function fetchRecentTx(size = 8): Promise<ExplorerTx[]> {
  try {
    const r = await fetch(`${API}/accounts/${LIA_WALLET}/transactions?size=${size}&order=desc`, {
      cache: 'no-store',
    })
    if (!r.ok) return []
    const j = await r.json()
    return Array.isArray(j) ? j : []
  } catch {
    return []
  }
}

export default function XorusPage() {
  const { lang } = useI18n()
  const fr = lang === 'fr'
  const { env } = usePulse()
  const lia = useLIAInterpreter(env)
  const [vellum, setVellum] = useState<VellumLastRun | null>(null)
  const [hub, setHub] = useState<LiaHubStatus | null>(null)
  const [agg, setAgg] = useState<LiaStatusV1 | null>(null)
  const [txs, setTxs] = useState<ExplorerTx[]>([])
  const [loading, setLoading] = useState(true)
  const [mAura, setMAura] = useState<string>('stable')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const producerFreshness = assessTelemetrySource({
    source_ts: agg?.mindset?.vellum_ts ?? null,
    published_at: agg?.ts ?? null,
    provider: 'Retired legacy producer', data_mode: 'paper',
  })
  const hubFreshness = assessTelemetrySource({
    source_ts: hub?.ts ?? null, published_at: hub?.ts ?? null,
    provider: 'Legacy hub snapshot', data_mode: 'paper',
  })

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [v, px, txList, hubSt, st] = await Promise.all([
        fetchVellumLastRun(),
        fetchEgldPrice(true),
        fetchRecentTx(8),
        fetchLiaHubStatus(),
        fetchLiaStatus(),
      ])
      setVellum(v)
      setTxs(txList)
      setHub(hubSt)
      setAgg(st)
      try {
        const ma = await fetchMarketAura()
        setMAura(ma.mood)
      } catch {
        /* offline */
      }
      persistShadowExport(px.priceUsd || 0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!advancedOpen) return
    void refresh()
    const id = window.setInterval(() => void refresh(), 60_000)
    return () => window.clearInterval(id)
  }, [refresh, advancedOpen])

  return (
    <div className="xa-intelligence-layout animate-fade-in min-w-0 space-y-6">
      <IntelligencePath />
      <header className="xa-intelligence-hero">
        <p className="xa-intelligence-eyebrow">{fr ? '01 · Comprendre' : '01 · Understand'}</p>
        <h1>{fr ? 'xOrus, l’intelligence expliquée simplement' : 'xOrus intelligence, made clear'}</h1>
        <p>{fr
          ? 'xOrus rassemble des informations et des signaux à examiner. Ici, vous pouvez découvrir ce qu’un agent observe, quand sa source a été publiée et ce qui reste incertain, sans wallet.'
          : 'xOrus brings together information and signals to examine. Learn what an agent observes, when its source was published and what is still uncertain, without a wallet.'}</p>
        <p className="xa-intelligence-status" role="status">
          {LIA_LIVE_TRADING
            ? 'Trading flag reported: enabled. This page does not independently verify execution readiness.'
            : 'PAPER / SHADOW · Automated live trading is disabled. Simulated P&L is not realized profit.'}
        </p>
        <p className="mt-3 text-xs">{fr
          ? 'Une observation n’est pas un conseil d’investissement. La date de publication d’une source diffère de la date de consultation.'
          : 'Observations are not investment advice. The source publication date is different from the date you open this page.'}</p>
      </header>
      <section className="xa-intelligence-cards" aria-label={fr ? 'Trois actions simples' : 'Three simple actions'}>
        <article className="xa-intelligence-card">
          <p className="xa-intelligence-eyebrow">01 · {fr ? 'Identifier' : 'Identify'}</p>
          <h2>{fr ? 'À quoi servent les agents ?' : 'What do agents do?'}</h2>
          <p>{fr ? 'Découvrez les rôles de Pulse, Yield et Sentinel, sans mélanger signaux et packs NFT.' : 'Understand Pulse, Yield and Sentinel without mixing signals with NFT packs.'}</p>
          <Link to="/intelligence/agents">{fr ? 'Découvrir les agents' : 'Meet the agents'}</Link>
        </article>
        <article className="xa-intelligence-card">
          <p className="xa-intelligence-eyebrow">02 · {fr ? 'Expérimenter' : 'Experiment'}</p>
          <h2>{fr ? 'Tester sans payer' : 'Try it without paying'}</h2>
          <p>{fr ? 'Manipulez un exemple pédagogique, sans flux de trading et sans rendement affiché comme réel.' : 'Explore a teaching example without a trading feed or claimed real returns.'}</p>
          <Link to="/intelligence/lab">{fr ? 'Ouvrir le Lab' : 'Open the Lab'}</Link>
        </article>
        <article className="xa-intelligence-card">
          <p className="xa-intelligence-eyebrow">03 · {fr ? 'Découvrir' : 'Explore'}</p>
          <h2>{fr ? 'Voir les œuvres NFT' : 'Browse NFT artworks'}</h2>
          <p>{fr ? 'La Marketplace est séparée des signaux xOrus. La découverte ne nécessite aucun achat.' : 'The Marketplace is separate from xOrus signals. Browsing does not require a purchase.'}</p>
          <Link to="/explore/market">{fr ? 'Explorer la Marketplace' : 'Explore Marketplace'}</Link>
        </article>
      </section>


      <nav aria-label="Explore xArtists" className="flex flex-wrap gap-2">
        <Link to="/intelligence/agents" className="min-h-[44px] rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-100">
          Explore Pulse, Yield &amp; Sentinel
        </Link>
        <Link to="/explore/market" className="min-h-[44px] rounded-xl border border-white/20 px-4 py-3 text-sm text-zinc-200">
          Marketplace
        </Link>
        <Link to="/explore/auction" className="min-h-[44px] rounded-xl border border-white/20 px-4 py-3 text-sm text-zinc-200">
          Auctions
        </Link>
      </nav>

      <section aria-labelledby="xorus-advanced" className="min-w-0 space-y-4 rounded-2xl border border-white/10 bg-black/30 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="max-w-xl">
            <h2 id="xorus-advanced" className="text-lg font-semibold text-[color:var(--xa-text)]">{fr ? 'Outils avancés et diagnostics' : 'Advanced intelligence & diagnostics'}</h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">
              Optional technical dashboards, asset tickers, intent logs and simulations.
              These are not confirmations of trades, NFT deliveries or real-time xOrus execution.
            </p>
          </div>
          <button type="button" onClick={() => setAdvancedOpen(open => !open)} aria-expanded={advancedOpen}
            aria-controls="xorus-advanced-content"
            className="min-h-[44px] rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">
            {advancedOpen
              ? (fr ? 'Masquer les outils avancés' : 'Hide advanced dashboards')
              : (fr ? 'Afficher les outils avancés' : 'Show advanced dashboards')}
          </button>
        </div>
        {advancedOpen && (
          <div id="xorus-advanced-content" className="min-w-0 space-y-5">
            <p className="xa-intelligence-note">{fr
              ? 'Espace technique pour utilisateurs avancés. Les métriques et snapshots ne prouvent ni exécution réelle ni livraison NFT.'
              : 'Technical workspace for advanced visitors. Metrics and snapshots are not proof of real execution or NFT delivery.'}</p>
            <LiaHubControlRoomLazy />
      <section aria-labelledby="xorus-paybox-wallet" className="min-w-0 rounded-2xl border border-amber-400/20 bg-black/30 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <h2 id="xorus-paybox-wallet" className="text-base font-semibold text-zinc-100">xOrus wallet · PayBox.sh</h2>
            <p className="max-w-2xl text-sm text-zinc-300">
              Owner PayBox wallet: read-only preparation. Wallet control and network are not yet verified.
              The xOrus MultiversX wallet has not been provisioned, and no funding has been sent.
            </p>
            <p className="text-xs text-amber-200">
              Pending owner proof · No auto-funding · No bridge · No trading or signing authorization.
            </p>
          </div>
          <span className="rounded-full border border-amber-400/30 px-3 py-1 text-xs text-amber-200">Not linked</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          <a href="https://paybox.sh/" target="_blank" rel="noopener noreferrer"
             className="underline underline-offset-4 hover:text-white">Verify my PayBox wallet</a>
          <a href="https://github.com/Neltud/xArtists/blob/main/docs/XORUS_PAYBOX_WALLET_LINK.md"
             target="_blank" rel="noopener noreferrer"
             className="underline underline-offset-4 hover:text-white">Wallet verification &amp; funding policy</a>
        </div>
      </section>


            <div className="grid min-w-0 gap-4 lg:grid-cols-2">
              <div className="min-w-0 space-y-4">
                <LiaAgentControl />
                <HolderTerminal />
                <DailySignalWidget />
                <EconomicPulse />
              </div>
              <div className="min-w-0 space-y-4">
                <LiveAssetTape />
                <RceStrip compact />
                <IntentFeedTerminal />
              </div>
            </div>
            <div className="min-w-0 overflow-x-auto"><Pack3DCockpit showIntents /></div>
            <section className="min-w-0 space-y-2 rounded-xl border border-white/10 p-4">
              <h3 className="text-sm font-semibold text-zinc-100">Sources &amp; operator telemetry</h3>
              <p className="text-xs text-zinc-400">
                Legacy producer retired: archived or delayed snapshots only; no verified autonomous trading
                {' · '}Model aura: {mAura}
                {loading ? ' · synchronizing snapshots' : ''}
              </p>
              <p className="break-words text-xs text-zinc-400">Hub mirror: {hubFreshness.source_ts || 'unavailable'} · {hubFreshness.source_health} · no LIVE claim</p>
              {!producerFreshness.is_stale && agg?.paper === true && agg?.mindset?.strategy
                ? <p className="text-xs text-zinc-400">Paper strategy (producer fresh): {agg.mindset.strategy}</p>
                : <p className="break-words text-xs text-amber-200">Archived strategy withheld — producer {producerFreshness.source_health}; source {producerFreshness.source_ts || 'unavailable'}</p>}
              {txs.length > 0 && (
                <div className="text-xs text-zinc-500">
                  <p>Recent public wallet transactions (not proof of autonomous agent trading):</p>
                  <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto">
                    {txs.slice(0, 5).map((tx, i) => (
                      <li key={tx.txHash || i} className="break-all">{tx.function || 'transaction'} · {tx.status || 'status unknown'}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
            <LiaCommandTerminal
              phrase={lia.phrase}
              mood={lia.uniforms?.mood ?? 'stable'}
              confidence={lia.confidence ?? 0.5}
              source={lia.source}
              pending={lia.shadow?.liaPending}
              fallback={lia.shadow?.fallbackActive}
              onAsk={ctx => lia.requestComment(ctx)}
              contextHint="lia-hub"
              defaultOpen={false}
            />
            <p className="text-xs text-zinc-500">{LIA_BADGE} · On-chain actions require user authorization through xPortal.</p>
            <nav className="flex flex-wrap gap-3 text-xs text-zinc-400" aria-label="Additional tools">
              <Link to="/command-center" className="underline underline-offset-4 hover:text-white">Command Center (access restricted)</Link>
              <Link to="/studio" className="underline underline-offset-4 hover:text-white">Creative Studio</Link>
              <Link to="/agents" className="underline underline-offset-4 hover:text-white">Agent packs</Link>
            </nav>
          </div>
        )}
      </section>
    </div>
  )
}
