import {localizeChild as xaLocalize, renderChild as xaRender, usePhraseLocale as xaUsePhraseLocale} from '../i18n/phraseRuntime'
/**
 * Overlay listing — prix → listNft → TxShell overlay.
 */
import { useEffect, useRef, useState } from 'react'
import { useMarketplaceTx } from '../hooks/useMarketplaceTx'
import {useMarketplaceReadiness} from '../hooks/useMarketplaceReadiness'
import {verifyUserNftListPreflight, type UserNftListProof} from '../lib/marketplaceUserListing.mjs'
import { requestOpenConnect } from '../lib/walletEvents'
import { useWallet } from '../context/WalletContext'
import { egldTextToWei } from '../lib/egldExactAmount.mjs'

export type ListTarget = {
  collection: string
  nonce: number
  name: string
  identifier: string
  imageUrl?: string
}

type Props = {
  target: ListTarget | null
  onClose: () => void
}

export default function ListNftSheet({ target, onClose }: Props) {
  xaUsePhraseLocale()

  const { connected, address, canAttemptSign } = useWallet()
  const latestAddress = useRef(address)
  latestAddress.current = address
  const [checking, setChecking] = useState(false)
  const { listNft, pending, error, lastTx, marketplaceListLive } = useMarketplaceTx()
  const [price, setPrice] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [quote, setQuote] = useState<(UserNftListProof & {price:string}) | null>(null)
  const ready = useMarketplaceReadiness('seller')
  const live = ready && marketplaceListLive
  // A different NFT must never inherit the previous NFT's price, confirmed
  // fee quote, error or pending explanation.
  useEffect(()=>{
    setPrice('')
    setQuote(null)
    setMsg(null)
  },[target?.identifier])

  if (!target) return null
  const currentQuote=quote && quote.identifier===target.identifier &&
    quote.owner===address && quote.price===price ? quote : null

  const onSubmit = async () => {
    setMsg(null)
    try { egldTextToWei(price) } catch {
      setMsg('Prix EGLD invalide (18 décimales maximum, supérieur à zéro).')
      return
    }
    if (!connected) {
      requestOpenConnect()
      return
    }
    if (!canAttemptSign) {
      setMsg('Reconnecte xPortal / Web Wallet pour signer')
      return
    }
    if (!live) {
      setMsg('Marketplace non live (CODEHASH)')
      return
    }
    setChecking(true)
    try {
      const fresh=await verifyUserNftListPreflight({
        address, identifier: target.identifier, collection: target.collection, nonce: target.nonce,
      })
      if (latestAddress.current !== address || !address) throw new Error('Le wallet a changé : recommence la vérification.')
      if (!currentQuote) {
        setQuote({...fresh, price})
        setMsg('Contrôles validés. Relis les frais et la rémunération du créateur avant de signer.')
        return
      }
      if (fresh.feeBps!==currentQuote.feeBps ||
          fresh.royaltyBps!==currentQuote.royaltyBps ||
          fresh.royaltyReceiver!==currentQuote.royaltyReceiver ||
          fresh.escrowReceiver!==currentQuote.escrowReceiver)
        throw new Error('Les frais ou royalties ont changé. Recommence la vérification.')
      await listNft({
        tokenId: target.collection, nonce: target.nonce, priceEgld: price,
        royaltyBps:fresh.royaltyBps, royaltyReceiver:fresh.royaltyReceiver,
      })
      setQuote(null)
      setMsg('Transaction soumise — vérifier la confirmation et la garde NFT sur Explorer')
      // Submission is not confirmed custody. Refresh only after independent Explorer proof.
    } catch (e) {
      setQuote(null)
      setMsg(e instanceof Error ? e.message : 'Échec list')
    } finally { setChecking(false) }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-3">
      <button type="button" className="absolute inset-0 bg-black/70" onClick={onClose} aria-label={xaLocalize("Fermer")} />
      <div role="dialog" aria-modal="true" aria-labelledby="xa-list-nft-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-violet-500/30 bg-[#12121a] p-5 space-y-4 shadow-2xl">
        <div className="flex gap-3">
          <div className="h-16 w-16 rounded-xl bg-black/40 overflow-hidden shrink-0">
            {xaRender(target.imageUrl ? (
              <img src={target.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-2xl">🖼</div>
            ))}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-violet-300/80">{xaRender("Mettre en vente")}</p>
            <h3 id="xa-list-nft-title" className="font-bold text-white truncate">{xaRender(target.name)}</h3>
            <p className="text-[10px] mono text-zinc-500 truncate">{xaRender(target.identifier)}</p>
          </div>
        </div>

        <label className="block text-xs text-zinc-400">
          {xaRender("Prix (EGLD) ")}<input
            type="text"
            inputMode="decimal"
            value={price}
            placeholder="Saisir un prix en EGLD"
            onChange={e => {setPrice(e.target.value);setQuote(null)}}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-white"
          />
        </label>

        {xaRender(!live && (
          <p role="status" className="text-xs text-amber-200">
            {xaRender("Préparation seulement : le contrat ou la connexion n’est pas certifié. Aucune transaction ne peut être signée ni envoyée.")}
          </p>
        ))}

        <p className="text-[11px] text-zinc-400">Prix en EGLD. Les frais marketplace et les royalties du créateur sont lus sur la chaîne. Un NFT mis en vente est déposé en garde dans le contrat, pas vendu immédiatement.</p>
        {currentQuote && <section className="rounded-lg border border-amber-400/30 p-3 text-xs text-zinc-200" aria-label="Frais et royalties vérifiés">
          <p className="font-semibold">Relire et confirmer avant signature</p>
          <p>Frais marketplace : {currentQuote.feeBps / 100} %</p>
          <p>Royalties créateur : {currentQuote.royaltyBps / 100} %</p>
          <p>Montant vendeur théorique : {(10000-currentQuote.feeBps-currentQuote.royaltyBps)/100} % du prix</p>
          <p className="break-all">Destinataire des royalties : {currentQuote.royaltyReceiver}</p>
          <p>Escrow : {currentQuote.escrowReceiver}</p>
        </section>}
        <div className="flex gap-2">
          <button type="button" className="btn-secondary flex-1 text-sm" onClick={onClose}>
            {xaRender("Annuler ")}</button>
          <button
            type="button"
            className="btn-primary flex-1 text-sm"
            disabled={pending || checking || !live || !connected || !canAttemptSign}
            onClick={() => void onSubmit()}
          >
            {xaRender(pending || checking ? 'Vérification…' : currentQuote ? 'Signer listNft' : 'Vérifier frais et royalties')}
          </button>
        </div>

        {xaRender((msg || error) && (
          <p className={`text-xs ${error ? 'text-rose-300' : 'text-emerald-300'}`}>{xaRender(msg || error)}</p>
        ))}
        {xaRender(lastTx && (
          <p className="text-[10px] mono text-zinc-500 break-all">TX {xaRender(lastTx)}</p>
        ))}
      </div>
    </div>
  )
}
