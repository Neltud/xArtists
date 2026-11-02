/**
 * Creator Studio signed by the visitor's own wallet (never LIA or PayBox).
 * The UI distinguishes submission, network confirmation and on-chain rights.
 */
import { useCallback, useEffect, useState } from 'react'
import { useSendTransaction } from './useSendTransaction'
import { useWallet } from '../context/WalletContext'
import {
  buildIssueNftCollectionTx, buildSetNftCreateRoleTx, buildEsdtNftCreateTx,
  isValidTicker, isValidCollectionId, fetchArtistCollectionProof,
  verifyArtistTransaction, saveStudioCollection, loadStudioCollection,
} from '../lib/studioOnChainMint'

export function useStudioMintTx() {
  const { send } = useSendTransaction()
  const { connected, address, method, canAttemptSign } = useWallet()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastTx, setLastTx] = useState<string | null>(null)
  const [collection, setCollection] = useState(() => loadStudioCollection(address))
  useEffect(() => { setCollection(loadStudioCollection(address)) }, [address])

  const guard = useCallback((): string | null => {
    if (!connected || !address) return 'Connecte ton wallet artiste.'
    if (!canAttemptSign || method === 'paste_readonly' || method === 'pem')
      return 'Wallet lecture seule : connecte xPortal ou Web Wallet.'
    return null
  }, [connected, address, canAttemptSign, method])

  const issueCollection = useCallback(async (name: string, tickerRaw: string) => {
    const problem = guard()
    if (problem) { setError(problem); return {ok:false as const,error:problem} }
    const ticker=tickerRaw.trim().toUpperCase()
    if (!isValidTicker(ticker)) {
      const msg='Ticker invalide (3–10 A-Z / 0-9).'
      setError(msg);return {ok:false as const,error:msg}
    }
    setPending(true);setError(null)
    try {
      const transaction=buildIssueNftCollectionTx({name,ticker})
      const res=await send([transaction],{
        processingMessage:'Émission collection · '+ticker,
        successMessage:'Transaction soumise : vérifie la création sur Explorer.',
        errorMessage:'Erreur émission collection',
      })
      if(res.error)throw new Error(res.error)
      const state=await verifyArtistTransaction(res.sessionId,address)
      if(state==='failed')throw new Error('La transaction a échoué sur MultiversX.')
      const record={ticker,name,walletAddress:address,at:Date.now()}
      saveStudioCollection(record);setCollection(record);setLastTx(res.sessionId)
      return {ok:true as const,confirmed:state==='confirmed',sessionId:res.sessionId,ticker}
    }catch(e){
      const msg=e instanceof Error?e.message:'Échec émission de la collection.'
      setError(msg);return {ok:false as const,error:msg}
    }finally{setPending(false)}
  },[guard,send,address])

  const setCreateRole = useCallback(async (tokenIdentifier: string) => {
    const problem=guard()
    if(problem){setError(problem);return {ok:false as const,error:problem}}
    if(!address){return {ok:false as const,error:'Adresse absente.'}}
    const id=tokenIdentifier.trim()
    if(!isValidCollectionId(id)){
      const msg='Identifiant de collection invalide (ex : ART-abcdef).'
      setError(msg);return {ok:false as const,error:msg}
    }
    setPending(true);setError(null)
    try {
      const proof=await fetchArtistCollectionProof(id,address)
      if(proof.owner.toLowerCase()!==address.toLowerCase())
        throw new Error('Seul le propriétaire de cette collection peut attribuer le rôle NFTCreate.')
      if(proof.hasCreateRole){
        const record={ticker:id.split('-')[0],name:id,tokenIdentifier:id,
          walletAddress:address,roleSet:true,at:Date.now()}
        saveStudioCollection(record);setCollection(record)
        return {ok:true as const,alreadySet:true as const,confirmed:true as const}
      }
      const tx=buildSetNftCreateRoleTx({tokenIdentifier:id,ownerAddress:address})
      const res=await send([tx],{
        processingMessage:'Attribution rôle NFTCreate · '+id,
        successMessage:'Rôle demandé ; vérifie les droits sur Explorer.',
        errorMessage:'Échec setSpecialRole',
      })
      if(res.error)throw new Error(res.error)
      const state=await verifyArtistTransaction(res.sessionId,address)
      if(state==='failed')throw new Error('Attribution de rôle rejetée.')
      // The role itself must be checked again from chain before any mint.
      const record={ticker:id.split('-')[0],name:id,tokenIdentifier:id,
        walletAddress:address,roleSet:false,at:Date.now()}
      saveStudioCollection(record);setCollection(record);setLastTx(res.sessionId)
      return {ok:true as const,alreadySet:false as const,confirmed:state==='confirmed',sessionId:res.sessionId}
    }catch(e){
      const msg=e instanceof Error?e.message:'Échec attribution de rôle.'
      setError(msg);return {ok:false as const,error:msg}
    }finally{setPending(false)}
  },[guard,send,address])

  const createNft = useCallback(async (opts: {
    tokenIdentifier:string;name:string;royaltiesPct:number;attributes:string;uris:string[]
  }) => {
    const problem=guard()
    if(problem){setError(problem);return {ok:false as const,error:problem}}
    if(!address)return {ok:false as const,error:'Adresse absente.'}
    setPending(true);setError(null)
    try{
      const proof=await fetchArtistCollectionProof(opts.tokenIdentifier.trim(),address)
      if(!proof.hasCreateRole)throw new Error(
        'Le rôle ESDTRoleNFTCreate n’est pas confirmé pour ce wallet. Attends ou attribue le rôle avant de minter.')
      const draft=buildEsdtNftCreateTx(opts)
      const tx={...draft,receiver:address}
      const res=await send([tx],{
        processingMessage:'Mint NFT · '+opts.name,
        successMessage:'Mint soumis. Confirme la réussite sur Explorer.',
        errorMessage:'Échec ESDTNFTCreate',
      })
      if(res.error)throw new Error(res.error)
      const state=await verifyArtistTransaction(res.sessionId,address)
      if(state==='failed')throw new Error('Le mint a échoué sur MultiversX.')
      setLastTx(res.sessionId)
      return {ok:true as const,confirmed:state==='confirmed',sessionId:res.sessionId}
    }catch(e){
      const msg=e instanceof Error?e.message:'Échec mint NFT.'
      setError(msg);return {ok:false as const,error:msg}
    }finally{setPending(false)}
  },[guard,send,address])

  return {
    issueCollection,setCreateRole,createNft,pending,error,lastTx,collection,setCollection,
    canSign:connected&&canAttemptSign&&method!=='paste_readonly'&&method!=='pem',
  }
}
