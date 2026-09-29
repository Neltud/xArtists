/**
 * Acces salle holder — paper packs (device) + NFT on-chain.
 * 1 pack = 1 salle (Pulse / Yield / Sentinel). Pas de cross-access.
 * SC mint OFF jusqu a GO_LIVE — paper device compte pour l acces UI.
 */
import { loadOwnedPacks, matchOnChainPacks, type PackId } from './nftPacks'

export type HolderStatus = {
  paper: PackId[]
  onchain: PackId[]
  packs: PackId[]
  pulse: boolean
  yield: boolean
  sentinel: boolean
  any: boolean
}

export function holderStatus(
  nfts: Array<{ identifier: string; collection?: string; name?: string }> = [],
): HolderStatus {
  const paper = loadOwnedPacks()
  const onchain = matchOnChainPacks(nfts).map(h => h.packId as PackId)
  const packs = Array.from(new Set([...paper, ...onchain]))
  return {
    paper,
    onchain,
    packs,
    pulse: packs.includes('pulse'),
    yield: packs.includes('yield'),
    sentinel: packs.includes('sentinel'),
    any: packs.length > 0,
  }
}

/** Une salle par NFT pack — pas de passe-partout. */
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

export const ROOM_META: Record<
  PackId,
  { path: string; title: string; emoji: string; accent: string; museeLabel: string }
> = {
  pulse: {
    path: '/room/pulse',
    title: 'Salle Pulse',
    emoji: '⚡',
    accent: 'from-emerald-500/20 to-cyan-500/10',
    museeLabel: 'Musee Pulse',
  },
  yield: {
    path: '/room/yield',
    title: 'Salle Yield',
    emoji: '🌾',
    accent: 'from-teal-500/20 to-emerald-500/10',
    museeLabel: 'Musee Yield',
  },
  sentinel: {
    path: '/room/sentinel',
    title: 'Salle Sentinel',
    emoji: '🛡️',
    accent: 'from-sky-500/20 to-indigo-500/10',
    museeLabel: 'Musee Sentinel',
  },
}
