import {localizeChild as xaLocalize, renderChild as xaRender, usePhraseLocale as xaUsePhraseLocale} from '../../i18n/phraseRuntime'
import { memo } from 'react'
import { useLiaFastPath } from '../../hooks/useLiaFastPath'
import { useLiaSlowPath } from '../../hooks/useLiaSlowPath'
import GuardianKillBadge from './GuardianKillBadge'
import BrainActivityFeed from './BrainActivityFeed'
import RiskMetricsPanel from './RiskMetricsPanel'
import RiskLockBanner from '../RiskLockBanner'

function CommanderStrip() {
  xaUsePhraseLocale()

  const fast = useLiaFastPath()
  const slow = useLiaSlowPath()

  return (
    <section className="mb-6" aria-label={xaLocalize("LIA Commander")}>
      {xaRender(fast.killAlert && (
        <div
          className="mb-3 rounded-lg border border-red-500 bg-red-500/20 px-3 py-2 text-sm text-red-100"
          role="alert"
          aria-live="assertive"
        >
          {xaRender("Guardian state → ")}<strong>{xaRender(fast.killAlert)}</strong>
          <button type="button" className="ml-3 text-xs underline opacity-80" onClick={fast.clearKillAlert}>
            {xaRender("dismiss ")}</button>
        </div>
      ))}

      <RiskLockBanner />

      <GuardianKillBadge
        killState={fast.killState}
        allow={fast.guardian?.allow !== false}
        reason={fast.guardian?.reason || '—'}
        live={fast.live}
        guardian={fast.guardian}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BrainActivityFeed
          desk={slow.desk}
          agentAction={fast.agentAction}
          mode={fast.mode}
          err={slow.err}
        />
        <RiskMetricsPanel
          guardian={fast.guardian}
          equityUsd={fast.equityUsd}
          drawdown={fast.drawdown}
          mode={fast.mode}
        />
      </div>

      {xaRender(fast.err && !fast.doc && (
        <p className="text-xs text-amber-400/90 mt-2">
          {xaRender("Fast path offline — ")}{xaRender(fast.err)}{xaRender(". Publish : ")}<code>python -m lia.vellum.production_run</code>
        </p>
      ))}
    </section>
  )
}

export default memo(CommanderStrip)
