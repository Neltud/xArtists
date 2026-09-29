/**
 * Mint NFT on-chain — 3 étapes ESDT système (issue → rôle → create).
 * Signature wallet utilisateur uniquement.
 */
import { useState } from 'react'
import { useStudioMintTx } from '../hooks/useStudioMintTx'
import { requestOpenConnect } from '../lib/walletEvents'
import { useWallet } from '../context/WalletContext'

type Props = {
  ready: boolean
  collectionName: string
  ticker: string
  title: string
  description: string
  royalty: number
  ipfsUri: string
  youtubeUrl: string
  metadataJson: string
}

export default function StudioOnChainMintCard(props: Props) {
  const { connected } = useWallet()
  const { issueCollection, setCreateRole, createNft, pending, error, lastTx, collection, canSign } =
    useStudioMintTx()
  const [tokenId, setTokenId] = useState(collection?.tokenIdentifier || '')
  const [stepMsg, setStepMsg] = useState('')

  const onIssue = async () => {
    setStepMsg('')
    const r = await issueCollection(props.collectionName, props.ticker)
    if (r.ok) {
      setStepMsg(
        'Collection demandée. Sur Explorer → ton compte → Tokens : copie l’id (ex XART-abc123) puis étape 2.',
      )
    }
  }

  const onRole = async () => {
    setStepMsg('')
    const id = tokenId.trim()
    const r = await setCreateRole(id)
    if (r.ok) setStepMsg('Rôle NFTCreate OK — tu peux mint (étape 3).')
  }

  const onMint = async () => {
    setStepMsg('')
    const id = (tokenId || collection?.tokenIdentifier || '').trim()
    if (!id) {
      setStepMsg('Renseigne le token identifier (TICKER-xxxxxx).')
      return
    }
    const uris = [props.ipfsUri, props.youtubeUrl].filter(Boolean)
    const r = await createNft({
      tokenIdentifier: id,
      name: props.title || props.collectionName || 'Untitled',
      royaltiesPct: props.royalty,
      attributes: `description:${(props.description || '').slice(0, 120)};tags:xartists,studio`,
      uris,
    })
    if (r.ok) setStepMsg('NFT minté — vérifie ton wallet / Explorer.')
  }

  return (
    <div className="card space-y-4 mb-4 border border-violet-500/25 bg-violet-500/[0.05]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-bold text-violet-100">Mint on-chain (ton wallet)</h2>
          <p className="text-xs text-zinc-500 mt-1">
            ESDT système MultiversX · 3 signatures · ~0.05 EGLD issue + gas
          </p>
        </div>
        <span className="text-[10px] rounded-full border border-violet-400/30 px-2 py-0.5 text-violet-200">
          Creator Studio
        </span>
      </div>

      {!connected && (
        <button type="button" className="btn-primary text-sm w-full" onClick={requestOpenConnect}>
          Connect wallet artiste
        </button>
      )}

      {connected && !canSign && (
        <p className="text-xs text-amber-200 border border-amber-500/30 rounded-lg p-2">
          Lecture seule — Disconnect puis xPortal / Web Wallet pour signer.
        </p>
      )}

      <ol className="space-y-4 text-sm">
        <li className="rounded-xl border border-white/10 bg-black/30 p-3 space-y-2">
          <p className="font-semibold text-zinc-200">1 · Issue collection NFT</p>
          <p className="text-[11px] text-zinc-500">
            Nom « {props.collectionName || '…'} » · ticker{' '}
            <span className="mono text-zinc-300">{props.ticker || '—'}</span> · coût 0.05 EGLD
          </p>
          <button
            type="button"
            className="btn-primary text-xs"
            disabled={!props.ready || !canSign || pending || props.ticker.length < 3}
            onClick={onIssue}
          >
            {pending ? '…' : 'Signer issueNonFungible'}
          </button>
        </li>

        <li className="rounded-xl border border-white/10 bg-black/30 p-3 space-y-2">
          <p className="font-semibold text-zinc-200">2 · Rôle ESDTNFTCreate</p>
          <label className="block text-[11px] text-zinc-500">
            Token identifier (après issue, sur Explorer)
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs mono text-white"
              placeholder="XART-abc123"
              value={tokenId}
              onChange={e => setTokenId(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="btn-secondary text-xs"
            disabled={!canSign || pending || tokenId.length < 8}
            onClick={onRole}
          >
            {pending ? '…' : 'Signer setSpecialRole'}
          </button>
        </li>

        <li className="rounded-xl border border-white/10 bg-black/30 p-3 space-y-2">
          <p className="font-semibold text-zinc-200">3 · Créer le NFT</p>
          <p className="text-[11px] text-zinc-500">
            Titre « {props.title || '…'} » · royalties {props.royalty}% · URI média
          </p>
          <button
            type="button"
            className="btn-primary text-xs"
            disabled={!props.ready || !canSign || pending}
            onClick={onMint}
          >
            {pending ? '…' : 'Signer ESDTNFTCreate'}
          </button>
        </li>
      </ol>

      {error && <p className="text-xs text-rose-300">{error}</p>}
      {stepMsg && <p className="text-xs text-emerald-300">{stepMsg}</p>}
      {lastTx && (
        <p className="text-[11px] mono text-zinc-500 break-all">TX / session : {lastTx}</p>
      )}

      <p className="text-[10px] text-zinc-600 leading-relaxed">
        Après mint : list sur <strong className="text-zinc-400">/marketplace</strong> si CODEHASH market
        OK. Collection déjà existante ? Passe direct étape 2–3 avec ton token id.
      </p>
    </div>
  )
}
