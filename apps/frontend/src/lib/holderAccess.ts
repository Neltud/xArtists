/**
 * Accès holder — on-chain only (audit S-02).
 * 1 pack = 1 salle. Pulse = full suite features (voir agentPacks.mergePackFeatures).
 * localStorage paper packs never grant rights.
 */
import { matchOnChainPacks, type PackId } from './nftPacks'
import { mergePackFeatures, type PackFeatures, isFullPack } from '../config/agentPacks'
import { isAdminAddress } from '../config/accessControl'

export type HolderStatus = {
  /** Always empty in production — kept for type compat */
  paper: PackId[]
  onchain: PackId[]
  packs: PackId[]
  pulse: boolean
  yield: boolean
  sentinel: boolean
  any: boolean
  features: PackFeatures
  isFull: boolean
}

export function holderStatus(
  nfts: Array<{ identifier: string; collection?: string; name?: string }> = [],
  address?: string | null,
): HolderStatus {
  // Admin / whitelist test : full suite
  if (isAdminAddress(address)) {
    const packs: PackId[] = ['pulse', 'yield', 'sentinel']
    return {
      paper: [],
      onchain: packs,
      packs,
      pulse: true,
      yield: true,
      sentinel: true,
      any: true,
      features: mergePackFeatures(packs),
      isFull: true,
    }
  }

  const onchain = [
    ...new Set(matchOnChainPacks(nfts).map(h => h.packId as PackId)),
  ] as PackId[]
  const packs = onchain
  return {
    paper: [],
    onchain,
    packs,
    pulse: packs.includes('pulse'),
    yield: packs.includes('yield'),
    sentinel: packs.includes('sentinel'),
    any: packs.length > 0,
    features: mergePackFeatures(packs),
    isFull: packs.some(isFullPack),
  }
}

export function canEnterRoom(status: HolderStatus, packId: PackId): boolean {
  return status.packs.includes(packId)
}

export function canEnterPulseRoom(status: HolderStatus): boolean {
  return canEnterRoom(status, 'pulse')
}

export function canEnterYieldRoom(status: HolderStatus): boolean {
  return canEnterRoom(status, 'yield')
}

export function canEnterSentinelRoom(status: HolderStatus): boolean {
  return canEnterRoom(status, 'sentinel')
}

export function canUseCommandHub(status: HolderStatus): boolean {
  return status.features.commandHub
}

export function canUseTca(status: HolderStatus): boolean {
  return status.features.tca
}

export function canUseLiaFull(status: HolderStatus): boolean {
  return status.features.liaFull
}

export const ROOM_META: Record<
  PackId,
  { path: string; title: string; emoji: string; accent: string; museeLabel: string; blurb: string }
> = {
  pulse: {
    path: '/room/pulse',
    title: 'Salle Pulse',
    emoji: '⚡',
    accent: 'from-emerald-500/20 to-cyan-500/10',
    museeLabel: 'Musée Pulse',
    blurb: 'Pack complet — CC · TCA · LIA · signaux HF',
  },
  yield: {
    path: '/room/yield',
    title: 'Salle Yield',
    emoji: '🌾',
    accent: 'from-teal-500/20 to-emerald-500/10',
    museeLabel: 'Musée Yield',
    blurb: 'Limité DeFi — LP · Hatom · compound',
  },
  sentinel: {
    path: '/room/sentinel',
    title: 'Salle Sentinel',
    emoji: '🛡️',
    accent: 'from-violet-500/20 to-indigo-500/10',
    museeLabel: 'Musée Sentinel',
    blurb: 'Alertes & garde-fous',
  },
}
