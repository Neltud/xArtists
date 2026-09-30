/** Grand Switch: live only if env + CODEHASH; else paper fail-closed */
import { getAppMode, getEnvLiveCapable, isSessionForcedPaper } from './appMode'
import { canSpinSlot, canStakeTro, canListBuyNft } from '../config/scStatus'

export type GrandSwitchReport = {
  liveModeEnv: boolean
  forcedPaper: boolean
  appMode: 'paper' | 'live'
  gates: { stake: boolean; market: boolean; slot: boolean }
  canUseMainnetTx: boolean
  reason: string
}

export function evaluateGrandSwitch(): GrandSwitchReport {
  const liveModeEnv = getEnvLiveCapable()
  const forcedPaper = isSessionForcedPaper()
  const appMode = getAppMode()
  const gates = { stake: canStakeTro(), market: canListBuyNft(), slot: canSpinSlot() }

  if (forcedPaper) {
    return {
      liveModeEnv,
      forcedPaper,
      appMode: 'paper',
      gates,
      canUseMainnetTx: false,
      reason: 'Safety Switch — paper forcé',
    }
  }
  if (!liveModeEnv || appMode !== 'live') {
    return {
      liveModeEnv,
      forcedPaper,
      appMode: 'paper',
      gates,
      canUseMainnetTx: false,
      reason: 'VITE_LIVE_MODE / CODEHASH inactifs → paper',
    }
  }
  const anyGate = gates.stake || gates.market || gates.slot
  return {
    liveModeEnv,
    forcedPaper,
    appMode: 'live',
    gates,
    canUseMainnetTx: anyGate,
    reason: anyGate ? 'Live + CODEHASH OK' : 'Live env sans CODEHASH — fail-closed',
  }
}
