import { Link } from 'react-router-dom'
import { AGENT_PACKS, PACK_VISUAL, PACK_EDITION } from '../../config/agentPacks'
import { useCopy } from '../../experience/state'
import { localizeChild as xaLocalize, renderChild as xaRender } from '../../i18n/phraseRuntime'
import GenesisCard3D from './GenesisCard3D'

/**
 * Genesis shelf — 1 pack = 1 siège SFT = 1 œuvre d’édition limitée.
 * Cartes 3D : recto peinture · verso HUD (rotation Y).
 */

export default function GenesisPackShelf() {
  const c = useCopy()

  return (
    <section className="xa-section xa-genesis" aria-labelledby="genesis-title">
      <div className="xa-section-head">
        <div>
          <div className="xa-eyebrow">Genesis</div>
          <h2 id="genesis-title">{c('agents')}</h2>
          <p>
            {xaLocalize(
              '1 achat = 1 œuvre SFT unique d’édition · recto peinture · verso données · prix catalogue €',
            )}
          </p>
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
              <div className="p-3 pb-0">
                <GenesisCard3D
                  id={pack.id}
                  sampleEdition={pack.id === 'pulse' ? 47 : pack.id === 'yield' ? 112 : 3}
                />
              </div>
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
                  <span className="text-[12px] text-zinc-500">≈ {pack.priceEgld.list} EGLD</span>
                </div>
                <p className="xa-genesis-cap text-[12px]" style={{ color: visual.accent }}>
                  <strong className="tabular-nums">{edition.maxSupply}</strong>
                  {' '}
                  {xaLocalize('max')} · {xaRender(edition.scarcity)}
                </p>
                <Link
                  to={`/packs/${pack.id}`}
                  className="mt-auto inline-flex min-h-[44px] items-center justify-center rounded-xl border text-[13px] font-medium"
                  style={{
                    borderColor: visual.border,
                    color: visual.accent,
                    background: visual.accentSoft,
                  }}
                >
                  {xaLocalize('Voir le pack')}
                </Link>
              </div>
            </article>
          )
        })}
      </div>

      <p className="mt-3 text-[11px] text-zinc-600">
        {xaLocalize(
          'Hover pause la rotation. Recto = œuvre · verso = HUD droits. Mint SFT post-paiement. 110 / 75 / 50 €.',
        )}
      </p>
    </section>
  )
}
