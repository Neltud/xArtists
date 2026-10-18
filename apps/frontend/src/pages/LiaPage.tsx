/**
 * LIA Hub — Control Room + cockpit intents — protocol UI.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import LiaHubControlRoomLazy from '../components/lia/LiaHubControlRoomLazy'
import { Link } from 'react-router-dom'
import { usePulse } from '../hooks/usePulse'
import { useLIAInterpreter } from '../hooks/useLIAInterpreter'
import { toAmbientSnapshot } from '../lib/ambientAura'
import { fetchProtocolProfile } from '../lia/protocolProfile'
import { fetchEgldPrice } from '../lia/priceTick'
import { persistShadowExport } from '../lia/shadowExport'
import { matrixFromPulse } from '../lia/decisionCycle'
import { fetchVellumLastRun, type VellumLastRun } from '../lia/vellumStatus'
import { fetchLiaHubStatus, type LiaHubStatus } from '../lia/hubStatus'
import { fetchLiaStatus, type LiaStatusV1 } from '../lia/liaStatus'
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
import { useI18n } from '../i18n/I18nContext'

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

export default function LiaPage() {
  const { t, lang } = useI18n()
  const { env } = usePulse()
  const lia = useLIAInterpreter(env)
  const ambient = useMemo(
    () => toAmbientSnapshot(lia?.uniforms, lia?.confidence ?? 0.5, false),
    [lia?.uniforms, lia?.confidence],
  )

  const [vellum, setVellum] = useState<VellumLastRun | null>(null)
  const [hub, setHub] = useState<LiaHubStatus | null>(null)
  const [agg, setAgg] = useState<LiaStatusV1 | null>(null)
  const [txs, setTxs] = useState<ExplorerTx[]>([])
  const [loading, setLoading] = useState(true)
  const [mAura, setMAura] = useState<string>('stable')

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [p, v, px, txList, hubSt, st] = await Promise.all([
        fetchProtocolProfile(),
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
      matrixFromPulse({
        assetId: 'EGLD',
        price: px.priceUsd,
        sentiment: typeof env?.sentiment === 'number' ? env.sentiment : 0,
        volatility: 0.35,
        confidence: lia.confidence ?? 0.5,
        rce: p.egldUsd || 0,
      })
    } finally {
      setLoading(false)
    }
  }, [env, lia.confidence])

  useEffect(() => {
    void refresh()
    const id = window.setInterval(() => void refresh(), 60_000)
    return () => window.clearInterval(id)
  }, [refresh])

  void ambient
  const isFr = lang === 'fr'

  return (
    <div className="xa-page animate-fade-in space-y-6 pb-20 max-w-3xl mx-auto">
      <header className="xa-hero" style={{ paddingTop: '1.25rem', maxWidth: '100%' }}>
        <p className="xa-hero__kicker">{t('lia.title')}</p>
        <h1 className="xa-hero__title">{t('lia.subtitle')}</h1>
        <p className="text-xs text-[var(--xa-text-muted)] mb-2">{LIA_BADGE}</p>
        <p className="xa-hero__lead">
          {isFr
            ? 'Multi-IA · wallet agent en lecture ·'
            : 'Multi-AI · agent wallet read-only ·'}{' '}
          <strong className="text-[var(--xa-accent)]">
            {LIA_LIVE_TRADING
              ? isFr
                ? 'LIVE user-sign xPortal'
                : 'LIVE user-sign xPortal'
              : isFr
                ? 'paper first'
                : 'paper first'}
          </strong>
          . Aura: <span className="text-[var(--xa-text)]">{mAura}</span>
          {loading ? (isFr ? ' · sync…' : ' · sync…') : ''}
        </p>
        <p className="xa-disclaimer">
          {isFr
            ? 'Aucune TX autonome sans signature — actions on-chain via xPortal uniquement.'
            : 'No autonomous TX without signature — on-chain actions via xPortal only.'}
        </p>
      </header>

      <LiaHubControlRoomLazy />

      <Pack3DCockpit showIntents />

      <LiaAgentControl />
      <HolderTerminal />
      <LiveAssetTape />
      <RceStrip compact />
      <DailySignalWidget />
      <EconomicPulse />
      <IntentFeedTerminal />

      <section className="xa-card space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--xa-text-muted)]">
          Vellum & hub
        </p>
        <p className="text-sm text-[var(--xa-text-secondary)]">
          Vellum · {vellum?.live ? 'LIVE' : 'paper'}{' '}
          {vellum?.summary?.mode ? `· ${vellum.summary.mode}` : ''}
        </p>
        <p className="text-sm text-[var(--xa-text-secondary)]">
          Hub · {hub?.strategy || hub?.note || '—'} · shadow PnL {hub?.shadow_pnl_usd ?? '—'}
        </p>
        {agg?.mindset?.strategy && (
          <p className="text-xs mono text-[var(--xa-text-muted)]">strategy · {agg.mindset.strategy}</p>
        )}
        {txs.length > 0 && (
          <ul className="text-xs mono text-[var(--xa-text-muted)] space-y-1 max-h-28 overflow-y-auto">
            {txs.slice(0, 5).map((tx, i) => (
              <li key={tx.txHash || i}>
                {tx.function || 'tx'} · {tx.status || '—'}
              </li>
            ))}
          </ul>
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

      <div className="flex flex-wrap gap-4 text-sm">
        <Link to="/command-center" className="text-[var(--xa-text-secondary)] hover:text-[var(--xa-text)]">
          {t('cc.title')}
        </Link>
        <Link to="/agents" className="text-[var(--xa-text-secondary)] hover:text-[var(--xa-text)]">
          {t('nav.packs')}
        </Link>
        <Link to="/" className="text-[var(--xa-text-secondary)] hover:text-[var(--xa-text)]">
          {t('nav.home')}
        </Link>
      </div>
    </div>
  )
}
