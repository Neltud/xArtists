/**
 * Gatekeeper sync — owns hasAgentAccess in empireStore.
 * Source: admin whitelist · on-chain NFTs · paper device packs.
 */
import { useEffect } from 'react'
import { useWallet } from '../context/WalletContext'
import { useUserAccount } from '../hooks/useUserAccount'
import {
  matchOnChainPacks,
  ownedPackIdsFromChain,
  loadOwnedPacks,
} from '../lib/nftPacks'
import { setAgentAccess } from '../store/empireStore'
import type { PackId } from '../config/agentPacks'
import { isAdminAddress } from '../config/accessControl'

const ALL_PACKS: Array<'pulse' | 'yield' | 'sentinel'> = ['pulse', 'yield', 'sentinel']

export default function AgentAccessSync() {
  const { connected, address } = useWallet()
  const account = useUserAccount(connected ? address : null)

  useEffect(() => {
    if (!connected || !address) {
      setAgentAccess({ hasAgentAccess: false, packs: [], source: 'none' })
      return
    }

    // Phase 7 — CEO / admin = full IA + all rooms
    if (isAdminAddress(address)) {
      setAgentAccess({
        hasAgentAccess: true,
        packs: ALL_PACKS,
        source: 'chain',
      })
      return
    }

    const chainHits = matchOnChainPacks(account.nfts || [])
    const chainPacks = ownedPackIdsFromChain(chainHits) as PackId[]
    const paper = loadOwnedPacks()

    const merged = [...new Set([...chainPacks, ...paper])] as Array<
      'pulse' | 'yield' | 'sentinel'
    >
    const has = merged.length > 0
    const source = chainPacks.length > 0 ? 'chain' : paper.length > 0 ? 'paper' : 'none'

    setAgentAccess({
      hasAgentAccess: has,
      packs: merged,
      source,
    })
  }, [connected, address, account.nfts, account.refreshedAt])

  return null
}
