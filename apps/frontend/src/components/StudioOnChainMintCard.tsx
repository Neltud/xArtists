import {localizeChild as xaLocalize, renderChild as xaRender, usePhraseLocale as xaUsePhraseLocale} from '../i18n/phraseRuntime'
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
  xaUsePhraseLocale()

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
          <h2 className="font-bold text-violet-100">{xaRender("Mint on-chain (ton wallet)")}</h2>
          <p className="text-xs text-zinc-500 mt-1">
            {xaRender("ESDT système MultiversX · 3 signatures · ~0.05 EGLD issue + gas ")}</p>
        </div>
        <span className="text-[10px] rounded-full border border-violet-400/30 px-2 py-0.5 text-violet-200">
          {xaRender("Creator Studio ")}</span>
      </div>

      {xaRender(!connected && (
        <button type="button" className="btn-primary text-sm w-full" onClick={requestOpenConnect}>
          {xaRender("Connect wallet artiste ")}</button>
      ))}

      {xaRender(connected && !canSign && (
        <p className="text-xs text-amber-200 border border-amber-500/30 rounded-lg p-2">
          {xaRender("Lecture seule — Disconnect puis xPortal / Web Wallet pour signer. ")}</p>
      ))}

      <ol className="space-y-4 text-sm">
        <li className="rounded-xl border border-white/10 bg-black/30 p-3 space-y-2">
          <p className="font-semibold text-zinc-200">{xaRender("1 · Issue collection NFT")}</p>
          <p className="text-[11px] text-zinc-500">
            {xaRender("Nom « ")}{xaRender(props.collectionName || '…')} {xaRender(" » · ticker")}{xaRender(' ')}
            <span className="mono text-zinc-300">{xaRender(props.ticker || '—')}</span> {xaRender(" · coût 0.05 EGLD ")}</p>
          <button
            type="button"
            className="btn-primary text-xs"
            disabled={!props.ready || !canSign || pending || props.ticker.length < 3}
            onClick={onIssue}
          >
            {xaRender(pending ? '…' : 'Signer issueNonFungible')}
          </button>
        </li>

        <li className="rounded-xl border border-white/10 bg-black/30 p-3 space-y-2">
          <p className="font-semibold text-zinc-200">{xaRender("2 · Rôle ESDTNFTCreate")}</p>
          <label className="block text-[11px] text-zinc-500">
            {xaRender("Token identifier (après issue, sur Explorer) ")}<input
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs mono text-white"
              placeholder={xaLocalize("XART-abc123")}
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
            {xaRender(pending ? '…' : 'Signer setSpecialRole')}
          </button>
        </li>

        <li className="rounded-xl border border-white/10 bg-black/30 p-3 space-y-2">
          <p className="font-semibold text-zinc-200">{xaRender("3 · Créer le NFT")}</p>
          <p className="text-[11px] text-zinc-500">
            {xaRender("Titre « ")}{xaRender(props.title || '…')} {xaRender(" » · royalties ")}{xaRender(props.royalty)}{xaRender("% · URI média ")}</p>
          <button
            type="button"
            className="btn-primary text-xs"
            disabled={!props.ready || !canSign || pending}
            onClick={onMint}
          >
            {xaRender(pending ? '…' : 'Signer ESDTNFTCreate')}
          </button>
        </li>
      </ol>

      {xaRender(error && <p className="text-xs text-rose-300">{xaRender(error)}</p>)}
      {xaRender(stepMsg && <p className="text-xs text-emerald-300">{xaRender(stepMsg)}</p>)}
      {xaRender(lastTx && (
        <p className="text-[11px] mono text-zinc-500 break-all">{xaRender("TX / session : ")}{xaRender(lastTx)}</p>
      ))}

      <p className="text-[10px] text-zinc-600 leading-relaxed">
        {xaRender("Après mint : list sur ")}<strong className="text-zinc-400">{xaRender("/marketplace")}</strong> {xaRender(" si CODEHASH market OK. Collection déjà existante ? Passe direct étape 2–3 avec ton token id. ")}</p>
    </div>
  )
}
