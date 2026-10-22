import {localizeChild as xaLocalize, renderChild as xaRender} from '../../i18n/phraseRuntime'
/**
 * Onglet Digital — packs agents NFT/SFT (XAIPLS · XAIYLD · XAISNT).
 * Floor / supply via API MultiversX (pas Frameit comme source produit).
 */
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AGENT_PACKS, type PackId } from '../../config/agentPacks'
import { PACK_COLLECTIONS } from '../../config/packNftMetadata'
import {
  fetchAllPackMarkets,
  formatFloor,
  type CollectionMarketSnapshot,
} from '../../services/frameitApi'
import { useI18n } from '../../i18n/I18nContext'
import { canBuyAgent } from '../../config/scStatus'

export default function DigitalPacksPanel() {
  const { t } = useI18n()
  const [snaps, setSnaps] = useState<CollectionMarketSnapshot[]>([])
  const [loading, setLoading] = useState(true)
  const mintLive = canBuyAgent()

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await fetchAllPackMarkets(true)
      setSnaps(rows)
    } catch {
      setSnaps([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const byId = (id: PackId) => snaps.find(s => s.packId === id)

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-white">
            {xaRender(t('market.digital.packs') || 'Passes Agents · NFT / SFT')}
          </h2>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {xaRender("Collections mainnet · mint ")}{xaRender(mintLive ? 'SC live' : 'bientôt')} {xaRender(" · secondaire Xoxno ")}</p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="text-[11px] text-cyan-300 min-h-[40px] px-2"
        >
          {xaRender(loading ? '…' : t('market.refresh') || 'Rafraîchir')}
        </button>
      </div>

      <ul className="grid gap-3 sm:grid-cols-3">
        {xaRender(AGENT_PACKS.map(p => {
          const col = PACK_COLLECTIONS[p.id]
          const snap = byId(p.id)
          return (
            <li
              key={p.id}
              className={`rounded-2xl border bg-black/50 p-4 space-y-2 ${p.borderClass || 'border-white/10'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-white">
                  {xaRender(p.icon)} {xaRender(p.name)}
                </p>
                <span className="text-[9px] font-bold uppercase tracking-wide rounded-full border border-white/15 px-1.5 py-0.5 text-zinc-400">
                  {xaRender(p.tierLabel)}
                </span>
              </div>
              <p className="text-[10px] mono text-cyan-300/90">{xaRender(col.ticker)}</p>
              <p className="text-[11px] text-zinc-500 leading-snug">{xaRender(p.tagline)}</p>

              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div className="rounded-lg border border-white/10 bg-black/40 px-2 py-1.5">
                  <p className="text-[9px] uppercase text-zinc-600">{xaRender("Mint list")}</p>
                  <p className="tabular-nums text-cyan-100 font-medium">{xaRender(p.priceEgld.list)} {xaRender(" EGLD")}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/40 px-2 py-1.5">
                  <p className="text-[9px] uppercase text-zinc-600">{xaRender("Floor")}</p>
                  <p className="tabular-nums text-zinc-200">
                    {xaRender(loading ? '…' : formatFloor(snap?.floorEgld ?? null))}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/40 px-2 py-1.5">
                  <p className="text-[9px] uppercase text-zinc-600">{xaRender("NFTs")}</p>
                  <p className="tabular-nums text-zinc-200">{xaRender(snap?.nftsCount ?? '—')}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/40 px-2 py-1.5">
                  <p className="text-[9px] uppercase text-zinc-600">{xaRender("Holders")}</p>
                  <p className="tabular-nums text-zinc-200">{xaRender(snap?.holderCount ?? '—')}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Link
                  to={`/agents`}
                  className="btn-primary text-[11px] min-h-[40px] inline-flex items-center px-3"
                >
                  {xaRender("Acheter pack ")}</Link>
                {xaRender(snap?.xoxnoUrl && (
                  <a
                    href={snap.xoxnoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary text-[11px] min-h-[40px] inline-flex items-center px-3"
                  >
                    {xaRender("Marché 2nd ↗ ")}</a>
                ))}
              </div>
            </li>
          )
        }))}
      </ul>

      <p className="text-[11px] text-zinc-600 leading-relaxed">
        {xaRender("Entitlements d&apos;accès (signaux / salles) — pas un fonds, pas d&apos;APY promis. Prix mint officiels : 10 / 5 / 2.5 EGLD. Données collection via api.multiversx.com. ")}</p>
    </section>
  )
}
