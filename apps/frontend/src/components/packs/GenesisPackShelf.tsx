import { Link } from 'react-router-dom'
import { AGENT_PACKS, PACK_VISUAL } from '../../config/agentPacks'
import { useCopy } from '../../experience/state'
import { renderChild as xaRender } from '../../i18n/phraseRuntime'

export default function GenesisPackShelf() {
  const c = useCopy()

  return (
    <section className="xa-section xa-genesis" aria-labelledby="genesis-title">
      <div className="xa-section-head">
        <div>
          <div className="xa-eyebrow">Genesis</div>
          <h2 id="genesis-title">{c('agents')}</h2>
          <p>{xaRender('1 achat = 1 siège SFT')}</p>
        </div>
        <Link to="/intelligence/agents" className="xa-text-link">
          {c('open')} <span aria-hidden="true">↗</span>
        </Link>
      </div>
      <div className="xa-genesis-grid">
        {AGENT_PACKS.map(pack => {
          const visual = PACK_VISUAL[pack.id]
          return (
            <article key={pack.id} className="xa-genesis-card" style={{ borderColor: visual.border }}>
              <div className="xa-genesis-card-head">
                <h3 style={{ color: visual.accent }}>{pack.name}</h3>
                <span style={{ color: visual.accent, background: visual.accentSoft }}>{pack.tierLabel}</span>
              </div>
              <p className="xa-genesis-series">{pack.seriesName}</p>
              <div className="xa-genesis-price">
                <strong>{pack.priceEur.list} €</strong>
                <span>{xaRender('Ancre EGLD')} {pack.priceEgld.list}</span>
              </div>
              <p className="xa-genesis-cap" style={{ color: visual.accent }}>
                <strong>{pack.maxSupply}</strong> max
              </p>
            </article>
          )
        })}
      </div>
    </section>
  )
}
