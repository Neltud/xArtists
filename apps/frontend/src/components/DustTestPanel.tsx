/**
 * Phase 5 Dust Test checklist — ops visibility (not a public marketing page).
 */
import { useEffect, useState } from 'react'
import { getAppMode, getEnvLiveCapable, clearForcePaperMode, getForcePaperReason, isSessionForcedPaper } from '../lib/appMode'
import { readTxLog, clearTxLog, type TxLogEntry } from '../lib/txLog'
import {
  canStakeTro,
  canListBuyNft,
  canSpinSlot,
  canRentVenueOnChain,
  TRO_STAKING_ADDRESS,
  SLOT_CASINO_ADDRESS,
  MARKETPLACE_ADDRESS,
} from '../config/scStatus'

function short(addr: string) {
  if (!addr || addr.length < 16) return addr || '—'
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`
}

export default function DustTestPanel() {
  const [mode, setMode] = useState(getAppMode())
  const [log, setLog] = useState<TxLogEntry[]>([])

  useEffect(() => {
    setLog(readTxLog())
    const onMode = () => setMode(getAppMode())
    const onLog = () => setLog(readTxLog())
    window.addEventListener('xartists:mode', onMode)
    window.addEventListener('xartists:tx-log', onLog)
    return () => {
      window.removeEventListener('xartists:mode', onMode)
      window.removeEventListener('xartists:tx-log', onLog)
    }
  }, [])

  const gates = [
    { id: 'stake', ok: canStakeTro(), label: 'TRO stake', addr: TRO_STAKING_ADDRESS },
    { id: 'market', ok: canListBuyNft(), label: 'Marketplace', addr: MARKETPLACE_ADDRESS },
    { id: 'slot', ok: canSpinSlot(), label: 'Slot spin', addr: SLOT_CASINO_ADDRESS },
    { id: 'venue', ok: canRentVenueOnChain(), label: 'Venue rent', addr: '' },
  ]

  return (
    <div className="card space-y-3 border-amber-500/20">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-amber-100 font-tech">Dust Test · Phase 5</h2>
        <span
          className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${
            mode === 'live'
              ? 'border-emerald-500/40 text-emerald-300'
              : 'border-amber-500/40 text-amber-200'
          }`}
        >
          {mode}
          {isSessionForcedPaper() ? ' (safety)' : getEnvLiveCapable() ? '' : ' (env)'}
        </span>
      </div>

      {isSessionForcedPaper() && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-100 space-y-2">
          <p>Safety Switch actif — paper forcé après échec TX.</p>
          {getForcePaperReason() && (
            <p className="text-amber-200/80 mono text-[11px]">{getForcePaperReason()}</p>
          )}
          <button type="button" className="btn-secondary text-[11px]" onClick={() => { clearForcePaperMode(); setMode(getAppMode()) }}>
            Revenir live (cette session)
          </button>
        </div>
      )}

      <ul className="space-y-1.5 text-[12px]">
        {gates.map(g => (
          <li key={g.id} className="flex flex-wrap gap-2 items-center">
            <span className={g.ok ? 'text-emerald-400' : 'text-zinc-500'}>{g.ok ? '●' : '○'}</span>
            <span className="text-zinc-300">{g.label}</span>
            {g.addr && <span className="mono text-[10px] text-zinc-500">{short(g.addr)}</span>}
          </li>
        ))}
      </ul>

      <div className="text-[11px] text-zinc-500 space-y-1">
        <p>Cycle dust conseillé :</p>
        <ol className="list-decimal list-inside text-zinc-400 space-y-0.5">
          <li>Stake TRO dust → explorer getTotalStaked</li>
          <li>Slot spinEgld dust (gate CODEHASH + fund house)</li>
          <li>Treasury receiveAndSplit (owner)</li>
          <li>Market list/buy après Studio mint</li>
        </ol>
      </div>

      {log.length > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">TX failures</p>
            <button type="button" className="text-[10px] text-zinc-500 hover:text-zinc-300" onClick={() => { clearTxLog(); setLog([]) }}>
              clear
            </button>
          </div>
          <ul className="max-h-32 overflow-y-auto space-y-1">
            {log.slice(0, 8).map(e => (
              <li key={e.id} className="text-[11px] mono text-zinc-400 border-l-2 border-rose-500/40 pl-2">
                <span className="text-rose-300/90">{e.kind}</span> · {e.action}
                <br />
                <span className="text-zinc-500">{e.message.slice(0, 120)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
