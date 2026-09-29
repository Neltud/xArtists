/**
 * Studio on-chain mint steps — user wallet only (xPortal / Web Wallet).
 */
import { useCallback, useState } from 'react'
import { useSendTransaction } from './useSendTransaction'
import { useWallet } from '../context/WalletContext'
import {
  buildIssueNftCollectionTx,
  buildSetNftCreateRoleTx,
  buildEsdtNftCreateTx,
  sanitizeTicker,
  isValidTicker,
  saveStudioCollection,
  loadStudioCollection,
} from '../lib/studioOnChainMint'

export function useStudioMintTx() {
  const { send } = useSendTransaction()
  const { connected, address, method, canAttemptSign } = useWallet()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastTx, setLastTx] = useState<string | null>(null)
  const [collection, setCollection] = useState(() => loadStudioCollection())

  const guard = useCallback(() => {
    if (!connected) return 'Connecte ton wallet artiste.'
    if (!canAttemptSign || method === 'paste_readonly') {
      return 'Mode lecture seule — reconnecte xPortal ou Web Wallet.'
    }
    return null
  }, [connected, canAttemptSign, method])

  const issueCollection = useCallback(
    async (name: string, tickerRaw: string) => {
      const g = guard()
      if (g) {
        setError(g)
        return { ok: false as const, error: g }
      }
      const ticker = sanitizeTicker(tickerRaw)
      if (!isValidTicker(ticker)) {
        const msg = 'Ticker invalide (3–10 A-Z / 0-9)'
        setError(msg)
        return { ok: false as const, error: msg }
      }
      setPending(true)
      setError(null)
      try {
        const tx = buildIssueNftCollectionTx({ name, ticker })
        const res = await send([tx], {
          processingMessage: `Issue collection ${ticker}…`,
          successMessage: 'Collection émise — note le token id explorer (TICKER-xxxxxx)',
          errorMessage: 'Échec issue collection',
        })
        if (res.error) {
          setError(res.error)
          return { ok: false as const, error: res.error }
        }
        const rec = { ticker, name, at: Date.now() }
        saveStudioCollection(rec)
        setCollection(rec)
        setLastTx(res.sessionId)
        return { ok: true as const, sessionId: res.sessionId, ticker }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'issue failed'
        setError(msg)
        return { ok: false as const, error: msg }
      } finally {
        setPending(false)
      }
    },
    [guard, send],
  )

  const setCreateRole = useCallback(
    async (tokenIdentifier: string) => {
      const g = guard()
      if (g) {
        setError(g)
        return { ok: false as const, error: g }
      }
      if (!address) {
        setError('Adresse manquante')
        return { ok: false as const, error: 'Adresse manquante' }
      }
      const id = tokenIdentifier.trim()
      if (!/^[A-Z0-9]+-[a-f0-9]{6}$/i.test(id)) {
        const msg = 'Token id invalide (ex: XART-abc123)'
        setError(msg)
        return { ok: false as const, error: msg }
      }
      setPending(true)
      setError(null)
      try {
        const tx = buildSetNftCreateRoleTx({ tokenIdentifier: id, ownerAddress: address })
        const res = await send([tx], {
          processingMessage: `Rôle NFTCreate · ${id}`,
          successMessage: 'Rôle ESDTNFTCreate accordé',
          errorMessage: 'Échec setSpecialRole',
        })
        if (res.error) {
          setError(res.error)
          return { ok: false as const, error: res.error }
        }
        const prev = loadStudioCollection() || { ticker: id.split('-')[0], name: id, at: Date.now() }
        const rec = { ...prev, tokenIdentifier: id, roleSet: true, at: Date.now() }
        saveStudioCollection(rec)
        setCollection(rec)
        setLastTx(res.sessionId)
        return { ok: true as const, sessionId: res.sessionId }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'role failed'
        setError(msg)
        return { ok: false as const, error: msg }
      } finally {
        setPending(false)
      }
    },
    [guard, send, address],
  )

  const createNft = useCallback(
    async (opts: {
      tokenIdentifier: string
      name: string
      royaltiesPct: number
      attributes: string
      uris: string[]
    }) => {
      const g = guard()
      if (g) {
        setError(g)
        return { ok: false as const, error: g }
      }
      if (!address) {
        setError('Adresse manquante')
        return { ok: false as const, error: 'Adresse manquante' }
      }
      setPending(true)
      setError(null)
      try {
        const raw = buildEsdtNftCreateTx(opts)
        // ESDTNFTCreate: receiver = creator address
        const tx = { ...raw, receiver: address }
        const res = await send([tx], {
          processingMessage: `Mint NFT · ${opts.name}`,
          successMessage: 'NFT créé on-chain',
          errorMessage: 'Échec ESDTNFTCreate',
        })
        if (res.error) {
          setError(res.error)
          return { ok: false as const, error: res.error }
        }
        setLastTx(res.sessionId)
        return { ok: true as const, sessionId: res.sessionId }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'mint failed'
        setError(msg)
        return { ok: false as const, error: msg }
      } finally {
        setPending(false)
      }
    },
    [guard, send, address],
  )

  return {
    issueCollection,
    setCreateRole,
    createNft,
    pending,
    error,
    lastTx,
    collection,
    setCollection,
    canSign: canAttemptSign && method !== 'paste_readonly',
  }
}
