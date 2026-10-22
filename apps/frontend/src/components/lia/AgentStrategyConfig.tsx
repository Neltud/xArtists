import {localizeChild as xaLocalize, renderChild as xaRender} from '../../i18n/phraseRuntime'
/**
 * Programmation régime NFT Agent + modale de confirmation i18n.
 */
import { useEffect, useMemo, useState } from 'react'
import {
  defaultStrategy,
  getStrategy,
  saveStrategy,
  type AgentRegime,
  type AgentStrategyConfig,
} from '../../lib/agentStrategyStore'
import { useWallet } from '../../context/WalletContext'
import { useUserAccount } from '../../hooks/useUserAccount'
import { holderStatus } from '../../lib/holderAccess'
import { requestOpenConnect } from '../../lib/walletEvents'
import { LIA_LIVE_TRADING } from '../../config/liaConfig'
import { useI18n } from '../../i18n/I18nContext'

const REGIMES: AgentRegime[] = ['soft', 'balanced', 'aggressive']

function pickAgentToken(
  nfts: Array<{ identifier?: string; collection?: string; name?: string }>,
): string {
  const hit = nfts.find(
    n =>
      /pulse|yield|sentinel|agent|pack/i.test(n.name || '') ||
      /pulse|yield|sentinel|agent|pack/i.test(n.collection || '') ||
      /pulse|yield|sentinel/i.test(n.identifier || ''),
  )
  return hit?.identifier || nfts[0]?.identifier || 'local-paper-agent'
}

export default function AgentStrategyConfigPanel() {
  const { t } = useI18n()
  const { connected, address } = useWallet()
  const account = useUserAccount(connected ? address : null)
  const status = useMemo(() => holderStatus(account.nfts || []), [account.nfts])
  const hasPack = status.any

  const tokenId = useMemo(() => pickAgentToken(account.nfts || []), [account.nfts])

  const [cfg, setCfg] = useState<AgentStrategyConfig>(() => defaultStrategy('local-paper-agent'))
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const existing = getStrategy(tokenId)
    setCfg(existing || defaultStrategy(tokenId, status.packs[0]))
  }, [tokenId, status.packs])

  const regimeLabel = (r: AgentRegime) => {
    if (r === 'soft') return t('cc.strategy.soft')
    if (r === 'aggressive') return t('cc.strategy.aggressive')
    return t('cc.strategy.balanced')
  }
  const regimeBlurb = (r: AgentRegime) => {
    if (r === 'soft') return t('cc.strategy.soft.blurb')
    if (r === 'aggressive') return t('cc.strategy.aggressive.blurb')
    return t('cc.strategy.balanced.blurb')
  }
  const regimeEmoji = (r: AgentRegime) => (r === 'soft' ? '🛡️' : r === 'aggressive' ? '⚡' : '⚖️')

  const requestSave = () => {
    if (!connected) {
      requestOpenConnect()
      return
    }
    setConfirmOpen(true)
  }

  const confirmSave = () => {
    const next = saveStrategy({
      ...cfg,
      tokenId,
      packId: status.packs[0],
      userSigHint: connected ? `xportal:${address?.slice(0, 10)}` : undefined,
    })
    setCfg(next)
    setConfirmOpen(false)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2000)
  }

  return (
    <section className="rounded-2xl border border-amber-500/30 bg-black/50 backdrop-blur-md p-4 space-y-4 shadow-2xl">
      <div>
        <p className="text-[10px] uppercase tracking-[0.18em] text-amber-200/90 font-tech">
          {xaRender(t('cc.strategy.kicker'))}
        </p>
        <h3 className="text-sm font-semibold text-white">{xaRender(t('cc.strategy.title'))}</h3>
        <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
          {xaRender(t('cc.strategy.token'))}{xaRender(' ')}
          <span className="mono text-zinc-400">{xaRender(tokenId.slice(0, 18))}…</span>
          {xaRender(' · ')}{xaRender("LIVE_TRADING=")}{xaRender(LIA_LIVE_TRADING ? 1 : 0)}
        </p>
      </div>

      {xaRender(connected && !hasPack && (
        <p className="text-[12px] text-zinc-500">{xaRender("Aucun Pack Agent détecté — pré-réglage paper local.")}</p>
      ))}

      <div className="grid gap-2 sm:grid-cols-3">
        {xaRender(REGIMES.map(r => {
          const on = cfg.regime === r
          return (
            <button
              key={r}
              type="button"
              onClick={() => setCfg(c => ({ ...c, regime: r }))}
              className={`rounded-xl border px-3 py-2.5 text-left min-h-[44px] transition ${
                on
                  ? 'border-amber-400/50 bg-amber-500/15 text-amber-50'
                  : 'border-white/10 bg-black/40 text-zinc-400'
              }`}
            >
              <p className="text-[12px] font-semibold">
                {xaRender(regimeEmoji(r))} {xaRender(regimeLabel(r))}
              </p>
              <p className="text-[10px] mt-1 opacity-80 leading-snug">{xaRender(regimeBlurb(r))}</p>
            </button>
          )
        }))}
      </div>

      <label className="block space-y-1.5">
        <span className="text-[11px] text-zinc-400">
          {xaRender(t('cc.strategy.cadence'))} · {xaRender(cfg.cadencePerHour)}
        </span>
        <input
          type="range"
          min={1}
          max={12}
          value={cfg.cadencePerHour}
          onChange={e => setCfg(c => ({ ...c, cadencePerHour: Number(e.target.value) }))}
          className="w-full accent-amber-400"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-[11px] text-zinc-400">
          {xaRender(t('cc.strategy.ribbon'))} · {xaRender((cfg.blueRibbonThreshold * 100).toFixed(0))}%
        </span>
        <input
          type="range"
          min={20}
          max={90}
          value={Math.round(cfg.blueRibbonThreshold * 100)}
          onChange={e =>
            setCfg(c => ({ ...c, blueRibbonThreshold: Number(e.target.value) / 100 }))
          }
          className="w-full accent-cyan-400"
        />
      </label>

      <button
        type="button"
        className="btn-primary text-sm min-h-[44px] w-full sm:w-auto"
        onClick={requestSave}
      >
        {xaRender(saved ? `✓ ${t('cc.strategy.saved')}` : t('cc.strategy.save'))}
      </button>

      <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 space-y-1.5 text-[11px] text-zinc-400 leading-relaxed">
        <p>{xaRender(t('cc.econ.noDeposit'))}</p>
        <p>{xaRender(t('cc.econ.treasury'))}</p>
        <p>{xaRender(t('cc.econ.rewards'))}</p>
      </div>

      {xaRender(confirmOpen && (
        <div
          className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          role="dialog"
          aria-modal
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-purple-500/30 bg-black/90 shadow-2xl p-5 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <h4 className="text-base font-semibold text-white">{xaRender(t('cc.strategy.confirm.title'))}</h4>
            <p className="text-[13px] text-zinc-400 leading-relaxed">{xaRender(t('cc.strategy.confirm.body'))}</p>
            <p className="text-[12px] text-amber-100/90">
              {xaRender(regimeEmoji(cfg.regime))} {xaRender(regimeLabel(cfg.regime))} · {xaRender(cfg.cadencePerHour)}{xaRender("/h · ribbon")}{xaRender(' ')}
              {xaRender((cfg.blueRibbonThreshold * 100).toFixed(0))}%
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                className="btn-primary text-sm min-h-[44px] flex-1"
                onClick={confirmSave}
              >
                {xaRender(t('cc.strategy.confirm.ok'))}
              </button>
              <button
                type="button"
                className="btn-secondary text-sm min-h-[44px] flex-1"
                onClick={() => setConfirmOpen(false)}
              >
                {xaRender(t('cc.strategy.confirm.cancel'))}
              </button>
            </div>
          </div>
        </div>
      ))}
    </section>
  )
}
