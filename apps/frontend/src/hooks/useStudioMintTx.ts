/**
 * Creator Studio signed by the visitor's own wallet (never the agent wallet).
 * Each operation belongs to one mounted wallet session, including its reads,
 * signature request, confirmation and local draft. Submission is not delivery.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSendTransaction } from './useSendTransaction'
import { useWallet } from '../context/WalletContext'
import {
  buildIssueNftCollectionTx, buildSetNftCreateRoleTx, buildEsdtNftCreateTx,
  isValidTicker, isValidCollectionId, fetchArtistCollectionProof,
  verifyArtistTransaction, saveStudioCollection, loadStudioCollection,
  loadStudioMintReceipt,saveStudioMintReceipt,
  type StudioCollectionRecord,type StudioMintReceipt,
} from '../lib/studioOnChainMint'

type StudioSession = {
  key: string; active: boolean; busy: boolean; collection: StudioCollectionRecord | null; mintReceipt:StudioMintReceipt|null
}
type StudioState = {
  session: StudioSession; pending: boolean; error: string | null;
  lastTx: string | null; collection: StudioCollectionRecord | null; mintReceipt:StudioMintReceipt|null
}
const initialState = (session: StudioSession): StudioState => ({
  session, pending: false, error: null, lastTx: null, collection: session.collection,mintReceipt:session.mintReceipt,
})
const SESSION_CHANGED = 'La session wallet a changé ou le Studio a été fermé. Opération interrompue ; si une transaction a déjà été signée, vérifie son état sur Explorer.'

export function useStudioMintTx() {
  const { send } = useSendTransaction()
  const { connected, address, method, canAttemptSign } = useWallet()
  const key = JSON.stringify([connected, address, method, canAttemptSign])
  const live = useRef<StudioSession | null>(null)
  // Invalidate before effect cleanup so no render can expose the previous
  // account. A -> B -> A creates a new object; old A attempts never revive.
  if (!live.current || live.current.key !== key) live.current = {
    key, active: true, busy: false,
    collection: connected && address ? loadStudioCollection(address) : null,
    mintReceipt:connected&&address?loadStudioMintReceipt(address):null,
  }
  const session = live.current
  const [state, setState] = useState(() => initialState(session))
  useEffect(() => {
    session.active = true
    return () => { session.active = false }
  }, [session])
  const current = useCallback((owner: StudioSession) => live.current === owner && owner.active, [])
  const update = useCallback((owner: StudioSession, patch: Partial<StudioState>) => {
    if (!current(owner)) return
    setState(previous => current(owner)
      ? {...(previous.session === owner ? previous : initialState(owner)), ...patch}
      : previous)
  }, [current])

  type Attempt = {
    wallet: string; ensureCurrent: () => void;
    submit: (transaction: unknown, display: Parameters<typeof send>[1], onSubmitted?:(reference:string)=>void) => ReturnType<typeof send>;
    remember: (record: StudioCollectionRecord) => void;
    showTransaction: (id: string | null) => void;
  }
  const execute = useCallback(async <T extends object>(operation: (attempt: Attempt) => Promise<T>) => {
    if (!current(session)) return {ok:false as const, error:SESSION_CHANGED, sessionId:null}
    const problem = !connected || !address ? 'Connecte ton wallet artiste.' :
      !canAttemptSign || method === 'paste_readonly' || method === 'pem'
        ? 'Wallet lecture seule : connecte xPortal ou Web Wallet.' : null
    if (problem) {
      update(session, {error:problem})
      return {ok:false as const, error:problem, sessionId:null}
    }
    if (session.busy) return {ok:false as const, error:'Une opération Studio est déjà en cours.', sessionId:null}
    // Ref lock, not rendered state: two clicks in the same frame cannot both send.
    session.busy = true
    update(session, {pending:true, error:null})
    let submitted: string | null = null
    const ensureCurrent = () => { if (!current(session)) throw new Error(SESSION_CHANGED) }
    try {
      const result = await operation({
        wallet:address!, ensureCurrent,
        submit:async (transaction, display,onSubmitted) => {
          ensureCurrent()
          const result = await send([transaction], display)
          submitted = result.sessionId
          if(submitted)onSubmitted?.(submitted)
          ensureCurrent()
          if (result.error) throw new Error(result.error)
          return result
        },
        remember:record => {
          ensureCurrent()
          saveStudioCollection(record)
          update(session, {collection:record})
        },
        showTransaction:id => { ensureCurrent(); update(session, {lastTx:id}) },
      })
      ensureCurrent()
      return {ok:true as const, ...result}
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Opération Studio indisponible.'
      update(session, {error})
      // Preserve the submitted reference for reconciliation. A session change
      // cannot undo a transaction the user may already have approved.
      return {ok:false as const, error, sessionId:submitted}
    } finally {
      session.busy = false
      update(session, {pending:false})
    }
  }, [session, connected, address, method, canAttemptSign, current, update, send])

  const issueCollection = useCallback((name: string, tickerRaw: string) => execute(async attempt => {
    const ticker = tickerRaw.trim().toUpperCase()
    if (!isValidTicker(ticker)) throw new Error('Ticker invalide (3–10 A-Z / 0-9).')
    const res = await attempt.submit(buildIssueNftCollectionTx({name,ticker}), {
      processingMessage:'Émission collection · '+ticker,
      successMessage:'Transaction soumise : vérifie la création sur Explorer.',
      errorMessage:'Erreur émission collection',
    })
    const state = await verifyArtistTransaction(res.sessionId, attempt.wallet)
    attempt.ensureCurrent()
    if (state === 'failed') throw new Error('La transaction a échoué sur MultiversX.')
    attempt.remember({ticker,name,walletAddress:attempt.wallet,at:Date.now()})
    attempt.showTransaction(res.sessionId)
    return {confirmed:state==='confirmed',sessionId:res.sessionId,ticker}
  }), [execute])

  const setCreateRole = useCallback((tokenIdentifier: string) => execute(async attempt => {
    const id = tokenIdentifier.trim()
    if (!isValidCollectionId(id)) throw new Error('Identifiant de collection invalide (ex : ART-abcdef).')
    const proof = await fetchArtistCollectionProof(id, attempt.wallet)
    attempt.ensureCurrent()
    if (proof.owner.toLowerCase() !== attempt.wallet.toLowerCase())
      throw new Error('Seul le propriétaire de cette collection peut attribuer le rôle NFTCreate.')
    if (proof.hasCreateRole) {
      attempt.remember({ticker:id.split('-')[0],name:id,tokenIdentifier:id,
        walletAddress:attempt.wallet,roleSet:true,at:Date.now()})
      return {alreadySet:true,confirmed:true,sessionId:null}
    }
    const res = await attempt.submit(buildSetNftCreateRoleTx({tokenIdentifier:id,ownerAddress:attempt.wallet}), {
      processingMessage:'Attribution rôle NFTCreate · '+id,
      successMessage:'Rôle demandé ; vérifie les droits sur Explorer.',
      errorMessage:'Échec setSpecialRole',
    })
    const state = await verifyArtistTransaction(res.sessionId, attempt.wallet)
    attempt.ensureCurrent()
    if (state === 'failed') throw new Error('Attribution de rôle rejetée.')
    // Re-read the role on chain before minting; submission does not grant it.
    attempt.remember({ticker:id.split('-')[0],name:id,tokenIdentifier:id,
      walletAddress:attempt.wallet,roleSet:false,at:Date.now()})
    attempt.showTransaction(res.sessionId)
    return {alreadySet:false,confirmed:state==='confirmed',sessionId:res.sessionId}
  }), [execute])

  const createNft = useCallback((opts: {
    tokenIdentifier:string; name:string; royaltiesPct:number; attributes:string; uris:string[]
  }) => execute(async attempt => {
    if(loadStudioMintReceipt(attempt.wallet))throw new Error('Une création NFT est déjà consignée. Vérifie son état avant une nouvelle création.')
    const proof = await fetchArtistCollectionProof(opts.tokenIdentifier.trim(), attempt.wallet)
    attempt.ensureCurrent()
    if (!proof.hasCreateRole) throw new Error(
      'Le rôle ESDTRoleNFTCreate n’est pas confirmé pour ce wallet. Attends ou attribue le rôle avant de minter.')
    const draft = buildEsdtNftCreateTx(opts)
    const at=Date.now()
    const record=(reference:string,status:StudioMintReceipt['status']):StudioMintReceipt=>({wallet:attempt.wallet,reference,data:draft.data,at,status})
    const res = await attempt.submit({...draft,receiver:attempt.wallet}, {
      processingMessage:'Mint NFT · '+opts.name,
      successMessage:'Mint soumis. Confirme la réussite sur Explorer.',
      errorMessage:'Échec ESDTNFTCreate',
    },reference=>{
      const receipt=record(reference,'pending')
      saveStudioMintReceipt(attempt.wallet,receipt)
      update(session,{mintReceipt:receipt})
    })
    const state = await verifyArtistTransaction(res.sessionId, attempt.wallet,6,{data:draft.data,at})
    attempt.ensureCurrent()
    if(state==='failed'){
      saveStudioMintReceipt(attempt.wallet,null);update(session,{mintReceipt:null})
      throw new Error('Le mint a échoué sur MultiversX.')
    }
    if(state==='confirmed'&&res.sessionId){
      const receipt=record(res.sessionId,'confirmed')
      saveStudioMintReceipt(attempt.wallet,receipt);update(session,{mintReceipt:receipt})
    }
    attempt.showTransaction(res.sessionId)
    return {confirmed:state==='confirmed',sessionId:res.sessionId}
  }), [execute,session,update])

  // An entered hash must match this wallet and exact mint. No write/sign call.
  const recheckMint=useCallback((hash?:string)=>execute(async attempt=>{
    const receipt=loadStudioMintReceipt(attempt.wallet)
    if(!receipt||receipt.status!=='pending')throw new Error('Aucun mint en attente de vérification.')
    const reference=hash?.trim()||receipt.reference
    if(!/^[a-f0-9]{64}$/i.test(reference))throw new Error('Copie le hash de 64 caractères depuis ton historique xPortal ou Explorer.')
    const state=await verifyArtistTransaction(reference,attempt.wallet,1,{data:receipt.data,at:receipt.at})
    attempt.ensureCurrent()
    if(state==='pending')throw new Error('Transaction non confirmée ou différente de cette création. Aucun nouvel envoi.')
    if(state==='failed'){
      saveStudioMintReceipt(attempt.wallet,null);update(session,{mintReceipt:null})
      attempt.showTransaction(reference)
      return {confirmed:false,failed:true}
    }
    const next={...receipt,reference,status:'confirmed' as const}
    saveStudioMintReceipt(attempt.wallet,next);update(session,{mintReceipt:next})
    attempt.showTransaction(reference)
    return {confirmed:true,failed:false}
  }),[execute,session,update])
  const startAnotherMint=useCallback(()=>{
    if(!address||!current(session)||session.busy)return false
    const receipt=loadStudioMintReceipt(address)
    if(!receipt||receipt.status!=='confirmed')return false
    saveStudioMintReceipt(address,null)
    update(session,{mintReceipt:null,lastTx:null,error:null})
    return true
  },[address,session,current,update])

  const setCollection = useCallback((record: StudioCollectionRecord | null) => {
    if (!connected || (record && record.walletAddress !== address)) return
    update(session, {collection:record})
  }, [session, connected, address, update])
  const view = state.session === session ? state : initialState(session)
  return {
    issueCollection, setCreateRole, createNft, setCollection,recheckMint,startAnotherMint,mintReceipt:view.mintReceipt,
    pending:view.pending, error:view.error, lastTx:view.lastTx, collection:view.collection,
    canSign:connected&&canAttemptSign&&method!=='paste_readonly'&&method!=='pem',
  }
}
