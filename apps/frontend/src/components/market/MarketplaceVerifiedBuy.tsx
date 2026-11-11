/** Explicit, user-signed purchase of the only mainnet listing verified for this pilot. */
import {useCallback,useEffect,useState} from 'react'
import {useWallet} from '../../context/WalletContext'
import {useSendTransaction} from '../../hooks/useSendTransaction'
import {requestOpenConnect} from '../../lib/walletEvents'
import {
  addressHex,readVerifiedSale,VERIFIED_MARKET_SALE,
  type VerifiedMarketplaceQuote,
} from '../../lib/verifiedMarketplaceBuy.mjs'

export default function MarketplaceVerifiedBuy() {
  const {address,connected,canAttemptSign,isLiaAddress}=useWallet()
  const {send}=useSendTransaction()
  const [quote,setQuote]=useState<VerifiedMarketplaceQuote|null>(null)
  const [loading,setLoading]=useState(true)
  const [pending,setPending]=useState(false)
  const [status,setStatus]=useState('')
  const [unavailable,setUnavailable]=useState(false)

  const refresh=useCallback(async()=>{
    setLoading(true);setUnavailable(false);setQuote(null);setStatus('')
    try {const fresh=await readVerifiedSale();setQuote(fresh)}
    catch {setUnavailable(true)}
    finally {setLoading(false)}
  },[])
  useEffect(()=>{void refresh()},[refresh])
  const walletHex=addressHex(address)
  const seller=!!(quote&&walletHex===quote.sellerHex)
  const signerReady=connected&&canAttemptSign&&!isLiaAddress&&!seller&&!!walletHex

  const buy=async()=>{
    if(pending||!signerReady||!quote)return
    setPending(true);setStatus('Nouvelle vérification sur MultiversX…')
    try {
      const fresh=await readVerifiedSale()
      if(fresh.priceAtomic!==quote.priceAtomic||fresh.listingId!==quote.listingId||
          fresh.identifier!==quote.identifier||fresh.receiver!==quote.receiver||
          !walletHex||walletHex===fresh.sellerHex) {
        throw Error('Annonce modifiée ou wallet vendeur. Achat bloqué.')
      }
      // No PayBox, Stripe or LIA. A genuine user click is required to sign.
      const result=await send([{
        receiver:VERIFIED_MARKET_SALE.marketplace,
        value:fresh.priceAtomic,
        gasLimit:25_000_000,
        data:'buyNft@02',
        chainID:'1',
      }],{
        processingMessage:'Achat NFT xArtists — signature wallet',
        successMessage:'Transaction soumise, confirmation on-chain requise',
        errorMessage:'Signature ou transaction refusée',
      })
      if(result.error) throw Error(result.error)
      setQuote(null)
      setStatus('Transaction soumise dans le wallet. Vérifie sa finalisation et la réception du NFT avant de considérer l’achat terminé.')
    } catch(e) {
      setQuote(null);setUnavailable(true)
      setStatus(e instanceof Error&&e.message==='Annonce modifiée ou wallet vendeur. Achat bloqué.'?
        e.message:'Achat non confirmé. Vérifie ton wallet et revérifie le listing avant tout nouvel essai.')
    } finally {setPending(false)}
  }

  return <div id="xa-market-buy-2" className="xa-live-buy" aria-label="Achat NFT MultiversX vérifié">
    <p className="xa-live-buy__eyebrow">Marketplace xArtists · MultiversX mainnet</p>
    {quote&&!loading&&<>
      <p className="xa-live-buy__price"><strong>{quote.priceEgld} EGLD</strong><span> · listing #{quote.listingId}</span></p>
      <p className="xa-live-buy__description">Annonce active, code du contrat et NFT en dépôt vérifiés sur la blockchain. Frais réseau supplémentaires.</p>
    </>}
    {loading&&<p role="status" className="xa-live-buy__description">Vérification du prix et de la disponibilité…</p>}
    {unavailable&&!loading&&<p role="status" className="xa-live-buy__description">Achat temporairement indisponible : annonce non vérifiée en direct.</p>}
    {quote&&!loading&&!connected&&<button type="button" className="xa-live-buy__button" onClick={requestOpenConnect}>Connecter mon wallet pour acheter</button>}
    {quote&&!loading&&connected&&!signerReady&&<p role="status" className="xa-live-buy__description">
      {seller?'Ce wallet est vendeur : utilise un wallet acheteur.':'Wallet signataire requis : connecte xPortal ou un wallet compatible.'}
    </p>}
    {quote&&!loading&&signerReady&&<button type="button" className="xa-live-buy__button" onClick={()=>void buy()} disabled={pending}>
      {pending?'Vérification…':'Acheter '+quote.priceEgld+' EGLD'}
    </button>}
    {unavailable&&!loading&&!pending&&<button type="button" className="xa-live-buy__refresh" onClick={()=>void refresh()}>Revérifier le listing</button>}
    {status&&<p role="status" className="xa-live-buy__description">{status}</p>}
    <p className="xa-live-buy__description">Signature uniquement dans ton wallet. Ne transfère pas d’EGLD manuellement.</p>
  </div>
}
