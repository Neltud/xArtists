/** Explicit, user-signed purchase of the only mainnet listing verified for this pilot. */
import {useCallback,useEffect,useRef,useState} from 'react'
import {useWallet} from '../../context/WalletContext'
import {useSendTransaction} from '../../hooks/useSendTransaction'
import {requestOpenConnect} from '../../lib/walletEvents'
import {getXPortalSession} from '../../lib/xportalWc'
import {verifyMarketplacePurchaseReceipt,type MarketplaceReceiptStatus} from '../../lib/marketplacePurchaseReceipt.mjs'
import {
  addressHex,readVerifiedSale,VERIFIED_MARKET_SALE,
  type VerifiedMarketplaceQuote,
} from '../../lib/verifiedMarketplaceBuy.mjs'

export default function MarketplaceVerifiedBuy({onQuoteStatus}:{onQuoteStatus?:(value:'pending'|'verified'|'unavailable')=>void}) {
  const {address,connected,method,canAttemptSign,isLiaAddress,disconnect}=useWallet()
  const {send}=useSendTransaction()
  const [quote,setQuote]=useState<VerifiedMarketplaceQuote|null>(null)
  const [loading,setLoading]=useState(true)
  const [pending,setPending]=useState(false)
  const [status,setStatus]=useState('')
  const [unavailable,setUnavailable]=useState(false)
  const [txHash,setTxHash]=useState('')
  const [checking,setChecking]=useState(false)
  const [receiptStatus,setReceiptStatus]=useState<MarketplaceReceiptStatus|null>(null)
  const receiptSequence=useRef(0)
  // A receipt attested for one buyer must never be presented for a new wallet.
  useEffect(()=>{
    receiptSequence.current+=1
    setReceiptStatus(null)
    setTxHash('')
  },[address])

  const refresh=useCallback(async()=>{
    setLoading(true);setUnavailable(false);setQuote(null);setStatus('')
    onQuoteStatus?.('pending')
    try {const fresh=await readVerifiedSale();setQuote(fresh);onQuoteStatus?.('verified')}
    catch {setUnavailable(true);onQuoteStatus?.('unavailable')}
    finally {setLoading(false)}
  },[onQuoteStatus])
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
      // Reject a WC identity switch during the asynchronous VM preflight.
      if(method==='xportal'&&getXPortalSession()?.address?.toLowerCase()!==address.toLowerCase()) {
        throw Error('Session xPortal modifiée. Reconnecte ton wallet acheteur.')
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
      setReceiptStatus(null)
      if(result.sessionId&&/^[a-f0-9]{64}$/i.test(result.sessionId)) {
        setTxHash(result.sessionId)
        setStatus('Transaction diffusée. Vérifie son hash sur MultiversX avant de déclarer le NFT reçu.')
      } else {
        setStatus('Demande envoyée au wallet, mais aucun hash blockchain confirmé. Récupère le hash de l’achat dans xPortal et vérifie-le ci-dessous.')
      }
    } catch(e) {
      setQuote(null);setUnavailable(true);onQuoteStatus?.('unavailable')
      setStatus(e instanceof Error&&e.message==='Annonce modifiée ou wallet vendeur. Achat bloqué.'?
        e.message:'Achat non confirmé. Vérifie ton wallet et revérifie le listing avant tout nouvel essai.')
    } finally {setPending(false)}
  }

  const verifyReceipt=async()=>{
    if(checking||!connected||!txHash.trim())return
    const sequence=++receiptSequence.current
    setChecking(true);setReceiptStatus(null)
    try {
      const result=await verifyMarketplacePurchaseReceipt({hash:txHash.trim(),address})
      if(sequence===receiptSequence.current)setReceiptStatus(result.status)
    } catch {
      if(sequence===receiptSequence.current)setReceiptStatus('unavailable')
    } finally {setChecking(false)}
  }
  const receiptMessage:Record<MarketplaceReceiptStatus,string>={
    invalid:'Hash ou wallet invalide. Colle uniquement le hash public de la transaction.',
    unavailable:'Preuve non accessible actuellement. Réessaie la vérification plus tard.',
    pending:'Transaction encore en attente : aucune réception NFT attestée.',
    failed:'Transaction échouée : aucun achat confirmé.',
    mismatch:'Cette transaction ne correspond pas à TON achat du NFT #2 à 0,25 EGLD.',
    delivery_unverified:'Transaction réussie, mais NFT non attesté dans ton wallet.',
    verified:'Achat confirmé : transaction réussie et NFT retrouvé dans ton wallet !',
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
      {seller?'Ce wallet est vendeur : impossible de racheter sa propre annonce. Déconnecte-le et utilise un autre wallet personnel comme acheteur.':'Wallet signataire requis : connecte xPortal ou un wallet compatible.'}
    </p>}
    {quote&&!loading&&seller&&<button type="button" className="xa-live-buy__refresh" onClick={disconnect}>
      Déconnecter le wallet vendeur
    </button>}
    {quote&&!loading&&signerReady&&<button type="button" className="xa-live-buy__button" onClick={()=>void buy()} disabled={pending}>
      {pending?'Vérification…':'Acheter '+quote.priceEgld+' EGLD'}
    </button>}
    {unavailable&&!loading&&!pending&&<button type="button" className="xa-live-buy__refresh" onClick={()=>void refresh()}>Revérifier le listing</button>}
    {status&&<p role="status" className="xa-live-buy__description">{status}</p>}
    {connected&&!seller&&<div className="xa-live-buy__receipt">
      <label htmlFor="xa-market-receipt-hash">Vérifier la livraison NFT avec le hash de l’achat</label>
      <input id="xa-market-receipt-hash" type="text" value={txHash}
        inputMode="text" autoComplete="off" spellCheck={false}
        placeholder="Hash de transaction (64 caractères)"
        maxLength={64} onChange={e=>{receiptSequence.current+=1;setTxHash(e.target.value.trim());setReceiptStatus(null)}} />
      <button type="button" className="xa-live-buy__refresh" disabled={checking||!txHash.trim()}
        onClick={()=>void verifyReceipt()}>{checking?'Vérification blockchain…':'Vérifier ma réception NFT'}</button>
      {receiptStatus&&<p role="status" className="xa-live-buy__description">{receiptMessage[receiptStatus]}</p>}
      {receiptStatus==='verified'&&<a target="_blank" rel="noopener noreferrer"
        href={'https://explorer.multiversx.com/transactions/'+txHash.toLowerCase()}>
        Ouvrir le reçu sur Explorer
      </a>}
    </div>}
    <p className="xa-live-buy__description">Signature uniquement dans ton wallet. Ne transfère pas d’EGLD manuellement.</p>
  </div>
}
