import { Link } from 'react-router-dom'
import { AGENT_PACKS, PACK_VISUAL, PACK_EDITION, type PackId } from '../../config/agentPacks'
import { useCopy } from '../../experience/state'
import { localizeChild as xaLocalize, renderChild as xaRender } from '../../i18n/phraseRuntime'

/**
 * Genesis shelf — preview « NFT » des packs (identité visuelle + caps + Rule1 prix).
 * Pas de média on-chain ici : plaque générative déterministe par pack.
 */

function PackPlate({ id }: { id: PackId }) {
  const v = PACK_VISUAL[id]
  const motif =
    id === 'pulse'
      ? 'radial-gradient(circle at 30% 30%, rgba(232,245,168,.55), transparent 55%), linear-gradient(145deg, #1a1f12 0%, #0c0e0a 50%, #12180e 100%)'
      : id === 'yield'
        ? 'radial-gradient(circle at 70% 20%, rgba(200,204,196,.4), transparent 50%), linear-gradient(160deg, #141614 0%, #0b0c0b 60%, #161816 100%)'
        : 'radial-gradient(circle at 50% 80%, rgba(167,139,250,.45), transparent 55%), linear-gradient(150deg, #120f1a 0%, #0a0910 55%, #15101c 100%)'

  const rings =
    id === 'pulse'
      ? [18, 32, 48]
      : id === 'yield'
        ? [22, 36, 50]
        : [16, 28, 44]

  return (
    <div
      className="xa-pack-plate relative aspect-square w-full overflow-hidden rounded-2xl border"
      style={{ borderColor: v.border, boxShadow: v.glow, background: motif }}
      aria-hidden
    >
      <div className="absolute inset-0 opacity-40" style={{
        backgroundImage:
          'linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />
      {rings.map((r, i) => (
        <div
          key={r}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
          style={{
            width: `${r * 2}%`,
            height: `${r * 2}%`,
            borderColor: v.border,
            opacity: 0.35 + i * 0.12,
          }}
        />
      ))}
      <div
        className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border text-2xl font-semibold"
        style={{ borderColor: v.border, color: v.accent, background: v.accentSoft }}
      >
        {id === 'pulse' ? '⚡' : id === 'yield' ? '◎' : '◈'}
      </div>
      <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-2">
        <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{ borderColor: v.border, color: v.accent, background: 'rgba(0,0,0,.45)' }}>
          {v.badge}
        </span>
        <span className="text-[10px] tabular-nums text-zinc-400">{PACK_EDITION[id].mintedMode.toUpperCase()}</span>
      </div>
    </div>
  )
}

export default function GenesisPackShelf() {
  const c = useCopy()

  return (
    <section className="xa-section xa-genesis" aria-labelledby="genesis-title">
      <div className="xa-section-head">
        <div>
          <div className="xa-eyebrow">Genesis</div>
          <h2 id="genesis-title">{c('agents')}</h2>
          <p>{xaLocalize('1 achat = 1 siège SFT · prix ancre Rule1 (fiat ≡ crypto)')}</p>
        </div>
        <Link to="/intelligence/agents" className="xa-text-link">
          {c('open')} <span aria-hidden="true">↗</span>
        </Link>
      </div>

      <div className="xa-genesis-grid grid gap-4 sm:grid-cols-3">
        {AGENT_PACKS.map(pack => {
          const visual = PACK_VISUAL[pack.id]
          const edition = PACK_EDITION[pack.id]
          return (
            <article
              key={pack.id}
              className="xa-genesis-card flex flex-col overflow-hidden rounded-2xl border bg-black/30"
              style={{ borderColor: visual.border, boxShadow: visual.glow }}
            >
              <PackPlate id={pack.id} />
              <div className="flex flex-1 flex-col gap-2 p-3">
                <div className="xa-genesis-card-head flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold" style={{ color: visual.accent }}>
                    {pack.name}
                  </h3>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: visual.accent, background: visual.accentSoft }}
                  >
                    {pack.tierLabel}
                  </span>
                </div>
                <p className="xa-genesis-series text-[12px] text-zinc-400">{edition.seriesName}</p>
                <p className="text-[11px] text-zinc-500">{xaRender(visual.mediaMotif)}</p>
                <div className="xa-genesis-price mt-1 flex items-baseline gap-2">
                  <strong className="text-lg tabular-nums text-white">{pack.priceEur.list} €</strong>
                  <span className="text-[12px] text-zinc-500">
                    {xaLocalize('Ancre')} {pack.priceEgld.list} EGLD
                  </span>
                </div>
                <p className="xa-genesis-cap text-[12px]" style={{ color: visual.accent }}>
                  <strong className="tabular-nums">{edition.maxSupply}</strong>
                  {' '}{xaLocalize('max')} · {xaRender(edition.scarcity)}
                </p>
                <Link
                  to={`/intelligence/agents?pack=${pack.id}`}
                  className="mt-auto inline-flex min-h-[44px] items-center justify-center rounded-xl border text-[13px] font-medium"
                  style={{ borderColor: visual.border, color: visual.accent, background: visual.accentSoft }}
                >
                  {xaLocalize('Voir le pack')}
                </Link>
              </div>
            </article>
          )
        })}
      </div>

      <p className="mt-3 text-[11px] text-zinc-600">
        {xaLocalize('Prévisualisation identité Genesis — mint SFT à la livraison post-paiement serveur. Rule1 : 110 / 75 / 50 €.')}
      </p>
    </section>
  )
}
