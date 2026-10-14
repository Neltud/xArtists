/**
 * Gatekeeper sync — owns hasAgentAccess in empireStore.
 * Source of truth: admin whitelist OR on-chain agent-pack NFTs only.
 * localStorage paper packs do NOT grant access (audit S-02).
 */
import { useEffect } from 'react'
import { useWallet } from '../context/WalletContext'
import { useUserAccount } from '../hooks/useUserAccount'
import { matchOnChainPacks, ownedPackIdsFromChain } from '../lib/nftPacks'
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

    // Admin whitelist — full suite (ops / CEO). No localStorage write.
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

    setAgentAccess({
      hasAgentAccess: chainPacks.length > 0,
      packs: chainPacks as Array<'pulse' | 'yield' | 'sentinel'>,
      source: chainPacks.length > 0 ? 'chain' : 'none',
    })
  }, [connected, address, account.nfts, account.refreshedAt])

  return null
}
