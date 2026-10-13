/**
 * Programmation régime trading NFT Agent — Command Center.
 * Persistance localStorage par tokenId · option hint signature xPortal.
 */
import { useEffect, useMemo, useState } from 'react'
import {
  defaultStrategy,
  getStrategy,
  REGIME_META,
  saveStrategy,
  type AgentRegime,
  type AgentStrategyConfig,
} from '../../lib/agentStrategyStore'
import { useWallet } from '../../context/WalletContext'
import { useUserAccount } from '../../hooks/useUserAccount'
import { holderStatus } from '../../lib/holderAccess'
import { requestOpenConnect } from '../../lib/walletEvents'
import { LIA_LIVE_TRADING } from '../../config/liaConfig'

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
  const { connected, address } = useWallet()
  const account = useUserAccount(connected ? address : null)
  const status = useMemo(() => holderStatus(account.nfts || []), [account.nfts])
  const hasPack = status.any

  const tokenId = useMemo(
    () => pickAgentToken(account.nfts || []),
    [account.nfts],
  )

  const [cfg, setCfg] = useState<AgentStrategyConfig>(() =>
    defaultStrategy('local-paper-agent'),
  )
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const existing = getStrategy(tokenId)
    setCfg(existing || defaultStrategy(tokenId, status.packs[0]))
  }, [tokenId, status.packs])

  const onSave = () => {
    if (!connected) {
      requestOpenConnect()
      return
    }
    const next = saveStrategy({
      ...cfg,
      tokenId,
      packId: status.packs[0],
      userSigHint: connected ? `xportal:${address?.slice(0, 10)}` : undefined,
    })
    setCfg(next)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2000)
  }

  return (
    <section className="rounded-2xl border border-amber-500/30 bg-black/50 backdrop-blur-md p-4 space-y-4 shadow-2xl">
      <div>
        <p className="text-[10px] uppercase tracking-[0.18em] text-amber-200/90 font-tech">
          NFT Agent · Strategy Programmer
        </p>
        <h3 className="text-sm font-semibold text-white">Régime de trading (paper)</h3>
        <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
          Configuration liée au token{' '}
          <span className="mono text-zinc-400">{tokenId.slice(0, 18)}…</span>
          {' · '}LIVE_TRADING={LIA_LIVE_TRADING ? 1 : 0}. Aucune exécution autonome.
        </p>
      </div>

      {!connected && (
        <p className="text-[12px] text-amber-100/90">
          Connecte xPortal pour lier la config à ton wallet / NFT.
        </p>
      )}
      {connected && !hasPack && (
        <p className="text-[12px] text-zinc-500">
          Aucun Pack Agent détecté — tu peux quand même pré-régler en paper local.
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-3">
        {REGIMES.map(r => {
          const meta = REGIME_META[r]
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
                {meta.emoji} {meta.label}
              </p>
              <p className="text-[10px] mt-1 opacity-80 leading-snug">{meta.blurb}</p>
            </button>
          )
        })}
      </div>

      <label className="block space-y-1.5">
        <span className="text-[11px] text-zinc-400">
          Cadence d’arbitrage (signaux / h) · {cfg.cadencePerHour}
        </span>
        <input
          type="range"
          min={1}
          max={12}
          value={cfg.cadencePerHour}
          onChange={e =>
            setCfg(c => ({ ...c, cadencePerHour: Number(e.target.value) }))
          }
          className="w-full accent-amber-400"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-[11px] text-zinc-400">
          Seuil Blue Ribbon (conviction min) · {(cfg.blueRibbonThreshold * 100).toFixed(0)}%
        </span>
        <input
          type="range"
          min={20}
          max={90}
          value={Math.round(cfg.blueRibbonThreshold * 100)}
          onChange={e =>
            setCfg(c => ({
              ...c,
              blueRibbonThreshold: Number(e.target.value) / 100,
            }))
          }
          className="w-full accent-cyan-400"
        />
      </label>

      <button
        type="button"
        className="btn-primary text-sm min-h-[44px] w-full sm:w-auto"
        onClick={onSave}
      >
        {saved ? '✓ Config enregistrée' : 'Enregistrer (local + hint xPortal)'}
      </button>

      <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 space-y-1.5 text-[11px] text-zinc-400 leading-relaxed">
        <p>
          <strong className="text-zinc-300">Aucun dépôt requis.</strong> Acquisition unique du Pack
          NFT — aucun dépôt de trésorerie de votre part.
        </p>
        <p>
          <strong className="text-zinc-300">Financement LIA.</strong> Une fraction du mint alimente
          le fonds d’arbitrage de LIA.
        </p>
        <p>
          <strong className="text-zinc-300">Rewards discrétionnaires.</strong> Distribution calculée
          selon le PnL global de LIA et pondérée par le nombre de Packs actifs dans votre wallet —
          non garantie.
        </p>
      </div>
    </section>
  )
}
