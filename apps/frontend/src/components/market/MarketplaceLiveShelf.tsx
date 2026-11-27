import {useCallback,useEffect,useRef,useState} from 'react'
import {useWallet} from '../../context/WalletContext'
import {useI18n} from '../../i18n/I18nContext'
import {useSendTransaction} from '../../hooks/useSendTransaction'
import {getXPortalSession} from '../../lib/xportalWc'
import {requestOpenConnect} from '../../lib/walletEvents'
import {addressHex,listingIdHex,readLiveMarketplaceListings,readVerifiedListing,type VerifiedMarketplaceQuote} from '../../lib/verifiedMarketplaceBuy.mjs'
import {verifyLiveListingReceipt} from '../../lib/marketplacePurchaseReceipt.mjs'

/** One explicit wallet-signed purchase at a time; no automatic orders or custody. */
export default function MarketplaceLiveShelf({onList}:{onList:()=>void}){
 const {lang}=useI18n(),fr=lang==='fr'
 const {address,connected,method,canAttemptSign,isLiaAddress}=useWallet(),{send}=useSendTransaction()
 const [rows,setRows]=useState<VerifiedMarketplaceQuote[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(false),[limited,setLimited]=useState(false)
 const [nextFrom,setNextFrom]=useState<number|null>(null)
 const [pending,setPending]=useState<number|null>(null),[status,setStatus]=useState(''),[receipt,setReceipt]=useState<{quote:VerifiedMarketplaceQuote;address:string;hash:string}|null>(null)
 const [hash,setHash]=useState(''),[checking,setChecking]=useState(false)
 const current=useRef({address,connected,method,canAttemptSign,isLiaAddress,generation:0,mounted:false})
 const now=current.current
 if(now.address!==address||now.connected!==connected||now.method!==method||now.canAttemptSign!==canAttemptSign||now.isLiaAddress!==isLiaAddress)
   current.current={address,connected,method,canAttemptSign,isLiaAddress,generation:now.generation+1,mounted:now.mounted}
 const attempt=useRef<symbol|null>(null),readSequence=useRef(0),receiptSequence=useRef(0)
 const controller=useRef<AbortController|null>(null)
 const refresh=useCallback(async(from=0)=>{
   const seq=++readSequence.current
   controller.current?.abort()
   const ctl=new AbortController();controller.current=ctl
   setLoading(true);setError(false);if(from===0){setRows([]);setLimited(false);setNextFrom(null)}
   const request:typeof fetch=(url,options)=>fetch(url,{...options,signal:options?.signal?AbortSignal.any([ctl.signal,options.signal]):ctl.signal})
   try{const result=await readLiveMarketplaceListings({request,from});if(!ctl.signal.aborted&&seq===readSequence.current){setRows(previous=>from===0?result.listings:[...new Map([...previous,...result.listings].map(row=>[row.listingId,row])).values()]);setLimited(result.limited);setNextFrom(result.nextFrom)}}
   catch{if(!ctl.signal.aborted&&seq===readSequence.current)setError(true)}
   finally{if(!ctl.signal.aborted&&seq===readSequence.current)setLoading(false)}
 },[])
 useEffect(()=>{current.current.mounted=true;void refresh();return()=>{current.current.mounted=false;controller.current?.abort();readSequence.current++;receiptSequence.current++;current.current.generation++;attempt.current=null}},[refresh])
 useEffect(()=>{receiptSequence.current++;setReceipt(null);setHash('');setChecking(false);setStatus('')},[address,connected,method,canAttemptSign])
 useEffect(()=>{const onConfirmed=()=>{if(!attempt.current)void refresh()};window.addEventListener('xa-market-listing-confirmed',onConfirmed);return()=>window.removeEventListener('xa-market-listing-confirmed',onConfirmed)},[refresh])
 const walletHex=addressHex(address)
 const buy=async(quote:VerifiedMarketplaceQuote)=>{
   if(attempt.current||!connected||!canAttemptSign||isLiaAddress||!walletHex||quote.sellerHex===walletHex)return
   const token=Symbol(),generation=current.current.generation
   attempt.current=token;setPending(quote.listingId);setStatus('');setReceipt(null);setHash('')
   const stillCurrent=()=>current.current.mounted&&current.current.generation===generation&&attempt.current===token
   try{
     const fresh=await readVerifiedListing(quote.listingId)
     if(!stillCurrent())throw Error('wallet_changed')
     if(fresh.identifier!==quote.identifier||fresh.receiver!==quote.receiver||fresh.priceAtomic!==quote.priceAtomic||
       fresh.sellerHex!==quote.sellerHex||fresh.feeBps!==quote.feeBps||fresh.royaltyBps!==quote.royaltyBps||fresh.sellerHex===walletHex)
       throw Error('quote_changed')
     if(method==='xportal'&&getXPortalSession()?.address?.toLowerCase()!==address.toLowerCase())throw Error('wallet_changed')
     if(!stillCurrent())throw Error('wallet_changed')
     const result=await send([{receiver:fresh.receiver,value:fresh.priceAtomic,gasLimit:25_000_000,data:'buyNft@'+listingIdHex(fresh.listingId),chainID:'1'}],{
       processingMessage:'NFT · wallet signature',successMessage:'Transaction submitted — confirmation required',errorMessage:'Transaction refused'})
     if(result.error||!stillCurrent())throw Error('purchase_unconfirmed')
     const txHash=result.sessionId&&/^[a-f0-9]{64}$/i.test(result.sessionId)?result.sessionId:''
     setReceipt({quote:fresh,address,hash:txHash});setHash(txHash)
     setRows(previous=>previous.filter(row=>row.listingId!==fresh.listingId))
     setStatus(fr?'Demande soumise. Vérifie le transfert NFT avant de déclarer l’achat confirmé.':'Request submitted. Verify the NFT transfer before claiming purchase confirmation.')
   }catch{
     if(stillCurrent()){setStatus(fr?'Achat non confirmé. Revérifie le prix, le contrat et ton wallet.':'Purchase not confirmed. Recheck price, contract and wallet.');void refresh()}
   }finally{if(attempt.current===token){attempt.current=null;if(current.current.mounted)setPending(null)}}
 }
 const check=async()=>{
   if(!receipt||receipt.address!==address||!hash||checking)return
   const seq=++receiptSequence.current;setChecking(true)
   try{const result=await verifyLiveListingReceipt({hash,address,quote:receipt.quote})
     if(seq!==receiptSequence.current)return
     setStatus(result.status==='verified'?(fr?'Achat et transfert NFT vérifiés sur la blockchain.':'Purchase and NFT transfer verified on-chain.'):(fr?'Livraison non encore attestée : ':'Delivery not yet verified: ')+result.status)
   }catch{if(seq===receiptSequence.current)setStatus(fr?'Reçu indisponible.':'Receipt unavailable.')}
   finally{if(seq===receiptSequence.current)setChecking(false)}
 }
 return <section className="xa-market-live-shelf" aria-label={fr?'NFT en vente':'NFTs for sale'} data-testid="market-live-shelf">
   <div className="xa-market-live-heading"><div><p>MultiversX · Mainnet</p><h2>{fr?'En vente maintenant':'Available now'}</h2></div><button type="button" className="xa-button secondary" disabled={loading||pending!==null} onClick={()=>void refresh()}>{fr?'Actualiser':'Refresh'}</button></div>
   {loading?<p role="status">{fr?'Vérification des dépôts et annonces…':'Checking escrow and listings…'}</p>:error?<p role="status">{fr?'Marché momentanément non vérifiable. Aucun achat autorisé.':'Market unavailable. No purchase authorized.'}</p>:rows.length===0?<p role="status">{fr?'Aucune annonce vérifiée disponible pour le moment.':'No verified listing is currently available.'}</p>:
   <div className="xa-market-live-items">{rows.map(row=><article key={row.listingId}>{row.image&&<img src={row.image} alt={row.title||row.identifier} loading="lazy" onError={e=>{e.currentTarget.hidden=true}}/>}<h3>{row.title||row.identifier}</h3><a target="_blank" rel="noopener noreferrer" href={'https://explorer.multiversx.com/nfts/'+row.identifier}>{row.identifier} ↗</a><strong>{row.priceEgld} EGLD</strong><small>#{row.listingId} · {fr?'Frais réseau en sus':'Network fees extra'}</small>
   {!connected?<button type="button" className="xa-button primary" onClick={requestOpenConnect}>{fr?'Connecter pour acheter':'Connect to buy'}</button>:<button type="button" className="xa-button primary" disabled={pending!==null||!canAttemptSign||isLiaAddress||!walletHex||row.sellerHex===walletHex} onClick={()=>void buy(row)}>{pending===row.listingId?(fr?'Vérification…':'Checking…'):row.sellerHex===walletHex?(fr?'Ton annonce':'Your listing'):(fr?'Acheter ':'Buy ')+row.priceEgld+' EGLD'}</button>}</article>)}</div>}
   {limited&&<small>{fr?'Inventaire partiel : certaines annonces peuvent nécessiter une nouvelle lecture.':'Partial inventory: some listings may require another read.'}</small>}
   {nextFrom!==null&&<button type="button" className="xa-button secondary" disabled={loading||pending!==null} onClick={()=>void refresh(nextFrom)}>{fr?'Voir les annonces précédentes':'Load earlier listings'}</button>}
   {status&&<p role="status">{status}</p>}
   {receipt&&receipt.address===address&&<div className="xa-market-live-receipt"><label htmlFor="xa-live-sale-hash">{fr?'Hash de la transaction':'Transaction hash'}</label><input id="xa-live-sale-hash" value={hash} maxLength={64} onChange={e=>{receiptSequence.current++;setChecking(false);setHash(e.target.value.trim())}}/><button type="button" className="xa-button secondary" disabled={!hash||checking} onClick={()=>void check()}>{fr?'Vérifier la réception NFT':'Verify NFT receipt'}</button></div>}
   <button type="button" onClick={onList} className="xa-button primary">{fr?'Mettre un NFT en vente':'List an NFT'} →</button>
 </section>
}
