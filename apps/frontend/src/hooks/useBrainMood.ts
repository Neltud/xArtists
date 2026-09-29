/**
 * Hook Corps — écoute le flux Cerveau (Grok/LIA/local/WS).
 */
import { useEffect, useState } from 'react'
import {
  getBrainPulse,
  subscribeBrain,
  startLocalBrainSimulator,
  connectBrainWebSocket,
  fetchBrainHttp,
  type BrainPulse,
} from '../lib/brainStream'

export function useBrainMood(): BrainPulse {
  const [pulse, setPulse] = useState<BrainPulse>(() => getBrainPulse())

  useEffect(() => {
    const unsub = subscribeBrain(setPulse)

    const wsUrl = (import.meta.env.VITE_BRAIN_WS as string | undefined)?.trim()
    const httpUrl = (import.meta.env.VITE_BRAIN_HTTP as string | undefined)?.trim()

    let stopWs: (() => void) | undefined
    let stopLocal: (() => void) | undefined
    let httpTimer: number | undefined

    if (wsUrl) {
      stopWs = connectBrainWebSocket(wsUrl)
    } else if (httpUrl) {
      void fetchBrainHttp(httpUrl)
      httpTimer = window.setInterval(() => void fetchBrainHttp(httpUrl), 20_000)
    } else {
      stopLocal = startLocalBrainSimulator(16_000)
    }

    return () => {
      unsub()
      stopWs?.()
      stopLocal?.()
      if (httpTimer) window.clearInterval(httpTimer)
    }
  }, [])

  return pulse
}
