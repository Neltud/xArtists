/**
 * Accès salle holder — paper packs (device) + NFT on-chain.
 * Pas un droit on-chain tant que SC mint est OFF.
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

/** Salle Pulse : pack Pulse paper ou on-chain. */
export function canEnterPulseRoom(status: HolderStatus): boolean {
  return status.pulse || status.any
}
