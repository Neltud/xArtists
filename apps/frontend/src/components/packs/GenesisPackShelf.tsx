import { Link } from 'react-router-dom'
import { AGENT_PACKS, PACK_VISUAL, PACK_EDITION, type PackId } from '../../config/agentPacks'
import { useCopy } from '../../experience/state'
import { localizeChild as xaLocalize, renderChild as xaRender } from '../../i18n/phraseRuntime'

/**
 * Genesis shelf — 1 pack = 1 siège SFT = 1 œuvre d’édition limitée.
 * Plaques génératives déterministes, vocabulaire visuel inspiré de l’univers
 * artistique Nelson Tuduri (sfumato, lattice, voile).
 */

function PackPlate({ id }: { id: PackId }) {
  const v = PACK_VISUAL[id]

  const layers =
    id === 'pulse'
      ? {
          base: 'linear-gradient(155deg, #0e120a 0%, #1a2210 38%, #0a0c08 100%)',
          veil: 'radial-gradient(ellipse 80% 60% at 28% 32%, rgba(232,245,168,.5), transparent 62%)',
          stroke: 'radial-gradient(circle at 72% 78%, rgba(205,245,139,.22), transparent 45%)',
        }
      : id === 'yield'
        ? {
            base: 'linear-gradient(165deg, #0c0d0c 0%, #171917 42%, #0a0b0a 100%)',
            veil: 'radial-gradient(ellipse 70% 55% at 68% 24%, rgba(200,204,196,.38), transparent 58%)',
            stroke: 'radial-gradient(circle at 30% 70%, rgba(180,184,176,.18), transparent 50%)',
          }
        : {
            base: 'linear-gradient(148deg, #0c0a12 0%, #16101c 40%, #09080e 100%)',
            veil: 'radial-gradient(ellipse 75% 65% at 50% 85%, rgba(167,139,250,.42), transparent 58%)',
            stroke: 'radial-gradient(circle at 22% 28%, rgba(196,181,253,.2), transparent 48%)',
          }

  const rings =
    id === 'pulse' ? [20, 34, 52] : id === 'yield' ? [24, 38, 54] : [18, 30, 46]

  return (
    <div
      className="xa-pack-plate relative aspect-square w-full overflow-hidden rounded-2xl border"
      style={{ borderColor: v.border, boxShadow: v.glow, background: layers.base }}
      aria-hidden
    >
      <div className="absolute inset-0" style={{ background: layers.veil }} />
      <div className="absolute inset-0" style={{ background: layers.stroke }} />
      <div
        className="absolute inset-0 opacity-[0.35] mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=%270 0 200 200%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%273%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27 opacity=%270.45%27/%3E%3C/svg%3E")',
        }}
      />
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />
      {rings.map((r, i) => (
        <div
          key={r}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
          style={{
            width: `${r * 2}%`,
            height: `${r * 2}%`,
            borderColor: v.border,
            opacity: 0.28 + i * 0.14,
          }}
        />
      ))}
      <div
        className="absolute left-1/2 top-1/2 flex h-[4.25rem] w-[4.25rem] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[1.15rem] border backdrop-blur-[2px]"
        style={{
          borderColor: v.border,
          color: v.accent,
          background: 'rgba(0,0,0,.35)',
          boxShadow: `inset 0 1px 0 rgba(255,255,255,.12), ${v.glow}`,
        }}
      >
        <span className="text-[11px] font-semibold tracking-[0.2em] uppercase opacity-90">
          {id === 'pulse' ? 'P' : id === 'yield' ? 'Y' : 'S'}
        </span>
      </div>
      <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-2">
        <span
          className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{ borderColor: v.border, color: v.accent, background: 'rgba(0,0,0,.5)' }}
        >
          {v.badge}
        </span>
        <span className="text-[10px] tabular-nums text-zinc-400">
          {PACK_EDITION[id].mintedMode.toUpperCase()} · œuvre
        </span>
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
          <p>
            {xaLocalize(
              '1 achat = 1 œuvre SFT unique d’édition · prix catalogue € · équivalent EGLD au taux',
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
                  <span className="text-[12px] text-zinc-500">≈ {pack.priceEgld.list} EGLD</span>
                </div>
                <p className="xa-genesis-cap text-[12px]" style={{ color: visual.accent }}>
                  <strong className="tabular-nums">{edition.maxSupply}</strong>
                  {' '}
                  {xaLocalize('max')} · {xaRender(edition.scarcity)}
                </p>
                <Link
                  to={`/intelligence/agents?pack=${pack.id}`}
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
          'Œuvres Genesis — série inspirée Nelson Tuduri. Mint SFT post-paiement. Catalogue 110 / 75 / 50 € · EGLD au taux (ref. 100 € ≈ 30 EGLD).',
        )}
      </p>
    </section>
  )
}
