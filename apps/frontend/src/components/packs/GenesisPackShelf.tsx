import { Link } from 'react-router-dom'
import { AGENT_PACKS, PACK_VISUAL, PACK_EDITION } from '../../config/agentPacks'
import { GENESIS_TARGETS_BY_ID } from '../../config/commercialTargets'
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
              'Pulse, Yield et Sentinel · aperçu artistique statique · informations de catalogue. Aucun achat ou mint live ici.',
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
              className="xa-genesis-card flex flex-col overflow-hidden rounded-2xl border bg-white dark:bg-zinc-900"
              style={{ borderColor: visual.border, boxShadow: visual.glow }}
            >
              <div className="p-3 pb-0">
                <GenesisCard3D
                  autoRotate={false}
                  id={pack.id}
                  sampleEdition={1}
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
                  <strong className="text-lg tabular-nums text-zinc-900 dark:text-white">{GENESIS_TARGETS_BY_ID[pack.id].targetEgld} EGLD</strong>
                  <span className="text-[12px] text-zinc-600 dark:text-zinc-400">Plafond cible · non payable</span>
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
          'Aperçus visuels et numéros d’édition illustratifs, non mintés. Plafonds commerciaux 33 / 22 / 11 EGLD, pas des devis ni des prix de contrat. Paiements et mint SFT publics désactivés ; politique de devis EUR/EGLD non opérationnelle.',
        )}
      </p>
    </section>
  )
}
