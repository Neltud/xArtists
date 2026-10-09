/**
 * Accès holder — paper + on-chain.
 * 1 pack = 1 salle. Pulse = full suite features (voir agentPacks.mergePackFeatures).
 */
import { loadOwnedPacks, matchOnChainPacks, type PackId } from './nftPacks'
import { mergePackFeatures, type PackFeatures, isFullPack } from '../config/agentPacks'

export type HolderStatus = {
  paper: PackId[]
  onchain: PackId[]
  packs: PackId[]
  pulse: boolean
  yield: boolean
  sentinel: boolean
  any: boolean
  /** Features agrégées (Pulse débloque le max) */
  features: PackFeatures
  isFull: boolean
}

export function holderStatus(
  nfts: Array<{ identifier: string; collection?: string; name?: string }> = [],
): HolderStatus {
  const paper = loadOwnedPacks()
  const onchain = matchOnChainPacks(nfts).map(h => h.packId as PackId)
  const packs = Array.from(new Set([...paper, ...onchain])) as PackId[]
  return {
    paper,
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
    accent: 'from-sky-500/20 to-indigo-500/10',
    museeLabel: 'Musée Sentinel',
    blurb: 'Limité guard — alertes · risk sleeve',
  },
}
