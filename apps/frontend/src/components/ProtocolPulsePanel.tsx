import { renderChild as xaRender } from '../i18n/phraseRuntime'
/**
 * Read-only protocol pulse. Does not sign and does not enable live trading.
 */
import { useEffect, useState } from 'react'
import {
  fetchProtocolPulse,
  formatCompact,
  formatEgld,
  formatUsd,
  upbitPosture,
  type ProtocolPulse,
} from '../lib/protocolPulse'

export default function ProtocolPulsePanel() {
  const posture = upbitPosture()
  const [pulse, setPulse] = useState<ProtocolPulse | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancel = false
    fetchProtocolPulse()
      .then(p => {
        if (!cancel) setPulse(p)
      })
      .catch(() => {
        if (!cancel) setErr('API publique indisponible')
      })
    return () => {
      cancel = true
    }
  }, [])

  const tone =
    posture.phase === 'extended' || posture.phase === 'window' || posture.phase === 'after'
      ? 'border-amber-500/40 bg-amber-500/[0.07]'
      : 'border-white/10 bg-black/30'

  return (
    <section className={`card space-y-3 border ${tone}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-white">{xaRender('Veille · pulse public')}</h2>
        <span className="rounded-full border border-amber-500/40 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
          {xaRender('LIA PAPER')}
        </span>
      </div>
      <p className="text-[12px] leading-relaxed text-zinc-300">{xaRender(posture.label)}</p>
      {err ? <p className="text-[11px] text-zinc-500">{xaRender(err)}</p> : null}
      {!pulse && !err ? (
        <p className="text-[11px] text-zinc-500 animate-pulse">{xaRender('Lecture API MultiversX…')}</p>
      ) : null}
      {pulse ? (
        <ul className="grid sm:grid-cols-2 gap-2 text-[12px]">
          <Li k="Epoch" v={`${pulse.epoch} · ${pulse.refreshRate} ms`} />
          <Li k="EGLD" v={`${formatUsd(pulse.egldPrice)} · mcap ${formatUsd(pulse.marketCap)}`} />
          <Li k="Staké / APR" v={`${formatCompact(pulse.staked)} · ${(pulse.apr * 100).toFixed(2)} %`} />
          <Li k="LIA Ops" v={`${formatEgld(pulse.liaEgld, 6)} EGLD · nonce ${pulse.liaNonce}`} />
          <Li k="Agents" v={`${formatEgld(pulse.agentsEgld)} EGLD`} />
          <Li k="Market" v={`${formatEgld(pulse.marketEgld)} EGLD`} />
          <Li k="Slot" v={`${formatEgld(pulse.slotEgld)} EGLD`} />
          <Li
            k="$TRO"
            v={
              pulse.troCirc == null
                ? '—'
                : `${formatCompact(pulse.troCirc)} · ${pulse.troAccounts ?? '—'} comptes · ${formatUsd(pulse.troMcap)}`
            }
          />
        </ul>
      ) : null}
      <p className="text-[11px] text-zinc-500">
        {xaRender(
          'Lecture seule. Un prix ou un nonce ne débloque pas un trade. Caps inchangés : 15 USD / trade, 40 USD / jour — après un maintien publié seulement.',
        )}
      </p>
    </section>
  )
}

function Li({ k, v }: { k: string; v: string }) {
  return (
    <li className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 flex justify-between gap-2">
      <span className="text-zinc-400">{xaRender(k)}</span>
      <span className="mono text-zinc-200 tabular-nums text-right">{xaRender(v)}</span>
    </li>
  )
}
