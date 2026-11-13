import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
/**
 * Mes NFT (wallet) → « Mettre en vente » → ListNftSheet.
 * Miniatures via ImageWithFallback (pas de carré blanc si média offline).
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { useUserAccount } from '../hooks/useUserAccount'
import ListNftSheet, { type ListTarget } from './ListNftSheet'
import { requestOpenConnect } from '../lib/walletEvents'
import { OWNED_GLOW } from '../lib/ownershipMap'
import {useMarketplaceReadiness} from '../hooks/useMarketplaceReadiness'
import {isOwnedNftListCandidate} from '../lib/marketplaceUserListing.mjs'
import { ImageWithFallback } from './ui/ImageWithFallback'

export default function MyOwnedNftsPanel() {
  const { connected, address, canAttemptSign } = useWallet()
  const location = useLocation()
  const openedFor=useRef<string | null>(null)
  const account = useUserAccount(connected ? address : null)
  const [listTarget, setListTarget] = useState<ListTarget | null>(null)
  const [search,setSearch] = useState('')
  const live = useMarketplaceReadiness('seller')

  // The first account API page contains up to 100 assets. Search its FULL
  // contents before slicing, rather than making NFTs #49–#100 impossible
  // to select. Put verifiable listing candidates ahead of ineligible assets.
  const matching = useMemo(()=>{
    const query=search.trim().toLocaleLowerCase()
    return account.nfts
      .filter(n=>!query||[n.name,n.identifier,n.collection].some(v=>
        String(v||'').toLocaleLowerCase().includes(query)))
      .sort((a,b)=>Number(isOwnedNftListCandidate(b))-Number(isOwnedNftListCandidate(a)))
  },[account.nfts,search])
  const items=matching.slice(0,48)
  // Studio links to /marketplace?list=<NFT-ID>. This only opens the
  // human-reviewed dialog; it cannot initiate a wallet transaction.
  useEffect(()=>{
    openedFor.current=null
    setListTarget(null)
    setSearch('')
  },[address])
  useEffect(()=>{
    const id=new URLSearchParams(location.search).get('list')
    if(!id || !connected || !address || account.loading || account.error)return
    const key=address+':'+id
    if(openedFor.current===key)return
    const nft=account.nfts.find(n=>n.identifier===id && isOwnedNftListCandidate(n))
    if(!nft)return
    openedFor.current=key
    const nonce=typeof nft.nonce==='number'?nft.nonce:parseInt(id.split('-').pop()||'',16)
    if(!Number.isSafeInteger(nonce)||nonce<=0)return
    setListTarget({collection:nft.collection||'',nonce,
      name:nft.name||nft.identifier,identifier:nft.identifier,
      imageUrl:nft.url||nft.media?.[0]?.url})
  },[account.loading,account.error,connected,address,account.nfts,location.search])

  if (!connected) {
    return (
      <div className="card space-y-3">
        <h2 className="font-semibold">{xaRender("Mes NFT · mise en vente")}</h2>
        <p className="text-sm text-zinc-500">{xaRender("Connecte ton wallet pour lister tes actifs.")}</p>
        <button type="button" className="btn-primary text-sm min-h-[44px]" onClick={requestOpenConnect}>
          {xaRender("Connecter ")}</button>
      </div>
    )
  }

  return (
    <>
      <div className="card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold">{xaRender("Mes NFT · mise en vente")}</h2>
            <p className="text-[11px] text-zinc-500">
              {xaRender(account.loading
                ? 'Chargement…'
                : `${items.length} affichés / ${account.nfts.length} NFT chargés · première page de 100 maximum`)}
            </p>
          </div>
        </div>

        {account.error && <p role="alert" className="text-xs text-amber-200">Impossible de vérifier les NFT du wallet : {account.error}</p>}
        <label htmlFor="xa-owned-nft-search" className="block space-y-1 text-xs text-zinc-300">
          <span>Rechercher un NFT par nom, collection ou identifiant</span>
          <input id="xa-owned-nft-search" type="search" value={search}
            onChange={e=>setSearch(e.target.value)} disabled={account.loading||!!account.error}
            placeholder="Collection / NFT ID"
            className="w-full min-h-[44px] rounded-lg border border-white/15 bg-zinc-950 px-3 text-white" />
        </label>
        {matching.length>48 && <p className="text-xs text-zinc-400">
          {matching.length-48} autre(s) résultat(s) chargé(s). Affine la recherche pour les retrouver.
        </p>}
        {xaRender(account.loading && items.length === 0 ? (
          <p className="text-sm text-zinc-500">{xaRender("Chargement des NFT…")}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-zinc-500">{search.trim()
            ? 'Aucun NFT correspondant parmi les actifs chargés.'
            : 'Aucun NFT détecté parmi les actifs chargés.'}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {xaRender(items.map(n => {
              const img = n.url || n.media?.[0]?.url
              const nonce =
                typeof n.nonce === 'number'
                  ? n.nonce
                  : parseInt(String(n.identifier || '').split('-').pop() || '',16) || 0
              const eligible = isOwnedNftListCandidate(n)
              return (
                <div
                  key={n.identifier}
                  className={`rounded-xl border border-white/10 overflow-hidden bg-black/40 ${OWNED_GLOW}`}
                >
                  <div className="aspect-square bg-zinc-950">
                    <ImageWithFallback
                      src={img}
                      alt={n.name || n.identifier || 'NFT'}
                      className="h-full w-full object-cover"
                      wrapperClassName="h-full w-full"
                    />
                  </div>
                  <div className="p-2 space-y-1.5">
                    <p className="text-xs font-semibold text-white truncate">
                      {xaRender(n.name || n.identifier)}
                    </p>
                    <p className="text-[9px] mono text-zinc-500 truncate">{xaRender(n.collection)}</p>
                    <button
                      type="button"
                      className="btn-primary w-full text-[11px] py-1.5 min-h-[36px]"
                      disabled={!eligible || account.loading || !!account.error}
                      onClick={() =>
                        setListTarget({
                          collection: n.collection || '',
                          nonce,
                          name: n.name || n.identifier,
                          identifier: n.identifier,
                          imageUrl: img,
                        })
                      }
                    >
                      {xaRender(!eligible ? 'NFT non éligible au listing' : live&&canAttemptSign ? 'Mettre en vente' : 'Préparer la mise en vente')}</button>
                  </div>
                </div>
              )
            }))}
          </div>
        ))}

        {canAttemptSign===false && <p className="text-xs text-amber-200">Wallet lecture seule ou session expirée : préparation consultable, mais aucune signature possible.</p>}
        {xaRender(!live && (
          <p className="text-[11px] text-amber-200">
            {xaRender("La préparation reste consultable, mais la signature est bloquée : codeHash, payable ou accès réseau non certifié.")}</p>
        ))}
        <p className="text-xs text-zinc-400">
          Inventaire partiel : jusqu’à 100 NFT chargés depuis l’API MultiversX. Aucun actif non lu n’est réputé absent.
          La mise en vente ne peut être soumise que par ton wallet signataire après vérification fraîche du contrat et de la propriété.
        </p>
      </div>

      <ListNftSheet
        target={listTarget}
        onClose={() => setListTarget(null)}
      />
    </>
  )
}
