import React, { useCallback, useState } from 'react'
import { useMvxAccount } from '../services/mvx'
import { useAgentsMarketplace } from '../hooks/useAgentsMarketplace'
import TxStatusBanner from '../components/TxStatusBanner'
import { CONTRACTS, shortAddr, explorerAccount } from '../config/contracts'
import './pages.css'

const DEMO_LISTINGS = [
  {
    id: 1,
    agentId: 'LIA-v6-circuit-1pct',
    priceEgld: '0.05',
    active: true,
    blurb: 'Signal package compound +1% / guards G01–G17',
  },
  {
    id: 2,
    agentId: 'GreenSmoke-Macro',
    priceEgld: '0.02',
    active: true,
    blurb: 'Régime RISK_ON / RISK_OFF bias feed',
  },
]

const MarketplacePage: React.FC = () => {
  const { address, isLoggedIn, account } = useMvxAccount()
  const {
    contractAddress,
    isConfigured,
    pending,
    lastError,
    txState,
    listAgent,
    buyAgent,
    cancelListing,
    resetTx,
  } = useAgentsMarketplace()

  const [agentId, setAgentId] = useState('LIA-v6-circuit-1pct')
  const [priceEgld, setPriceEgld] = useState('0.05')
  const [buyId, setBuyId] = useState('1')
  const [buyPrice, setBuyPrice] = useState('0.05')
  const [txPreview, setTxPreview] = useState<string | null>(null)
  const [status, setStatus] = useState('')
  const [autoSend, setAutoSend] = useState(false)

  const nonce = account?.nonce ?? 0
  const balance = account?.balance || '0'

  const onList = useCallback(async () => {
    setStatus('')
    const built = await listAgent(
      address || '',
      nonce,
      { agentId, priceEgld },
      { isLoggedIn, autoSend }
    )
    if (!built) {
      setStatus(lastError?.message || 'List échoué')
      return
    }
    setTxPreview(JSON.stringify(built.plain, null, 2))
    if (built.result?.ok) {
      setStatus(`List OK — ${built.result.hash}`)
    } else if (autoSend && built.result && !built.result.ok) {
      setStatus(built.result.error.message)
    } else {
      setStatus('TX listAgentAction prête — active auto-send ou signe via wallet')
    }
  }, [address, nonce, agentId, priceEgld, isLoggedIn, autoSend, listAgent, lastError])

  const onBuy = useCallback(async () => {
    setStatus('')
    const built = await buyAgent(
      address || '',
      nonce,
      { listingId: parseInt(buyId, 10) || 1, priceEgld: buyPrice },
      { isLoggedIn, balanceAtomic: balance, autoSend }
    )
    if (!built) {
      setStatus(lastError?.message || 'Buy échoué')
      return
    }
    setTxPreview(JSON.stringify(built.plain, null, 2))
    if (built.result?.ok) setStatus(`Buy OK — ${built.result.hash}`)
    else if (autoSend && built.result && !built.result.ok) setStatus(built.result.error.message)
    else setStatus('TX buyAgentAction prête')
  }, [address, nonce, buyId, buyPrice, isLoggedIn, balance, autoSend, buyAgent, lastError])

  const onCancel = useCallback(async () => {
    setStatus('')
    const built = await cancelListing(address || '', nonce, parseInt(buyId, 10) || 1, {
      isLoggedIn,
      autoSend,
    })
    if (!built) {
      setStatus(lastError?.message || 'Cancel échoué')
      return
    }
    setTxPreview(JSON.stringify(built.plain, null, 2))
    if (built.result?.ok) setStatus(`Cancel OK — ${built.result.hash}`)
    else setStatus('TX cancelListing prête')
  }, [address, nonce, buyId, isLoggedIn, autoSend, cancelListing, lastError])

  return (
    <div className="page">
      <header className="page-head">
        <h1>Marketplace · Agents</h1>
        <p className="muted">List / Buy / Cancel — erreurs TX classifiées + suivi confirmation.</p>
      </header>

      <TxStatusBanner
        state={
          lastError && txState.phase === 'idle'
            ? { phase: 'failed', error: lastError, message: lastError.message }
            : txState
        }
        onDismiss={resetTx}
      />

      <section className="grid-2">
        <div className="card">
          <h2>Agents Marketplace SC</h2>
          {isConfigured ? (
            <a href={explorerAccount(contractAddress)} target="_blank" rel="noreferrer">
              {contractAddress}
            </a>
          ) : (
            <span className="badge warn">Adresse TBD — VITE_AGENTS_MARKETPLACE_ADDRESS</span>
          )}
          <p className="muted mt">
            <code>listAgentAction</code> · <code>buyAgentAction</code> · <code>cancelListing</code>
          </p>
        </div>
        <div className="card">
          <h2>NFT Marketplace</h2>
          <a href={explorerAccount(CONTRACTS.marketplace)} target="_blank" rel="noreferrer">
            {shortAddr(CONTRACTS.marketplace)}
          </a>
        </div>
      </section>

      <section className="card mt">
        <h2>Catalogue</h2>
        <table className="tbl">
          <thead>
            <tr>
              <th>ID</th>
              <th>Agent</th>
              <th>Prix</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_LISTINGS.map((l) => (
              <tr key={l.id}>
                <td>{l.id}</td>
                <td>
                  <strong>{l.agentId}</strong>
                  <div className="sub">{l.blurb}</div>
                </td>
                <td>{l.priceEgld} EGLD</td>
                <td>{l.active ? 'active' : 'sold'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card mt">
        <label className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={autoSend}
            onChange={(e) => setAutoSend(e.target.checked)}
          />
          Auto-send via sdk-dapp (signature wallet + poll confirmation)
        </label>
      </section>

      <section className="grid-2 mt">
        <div className="card">
          <h2>List</h2>
          <label className="field">
            Agent ID
            <input value={agentId} onChange={(e) => setAgentId(e.target.value)} />
          </label>
          <label className="field">
            Prix (EGLD)
            <input value={priceEgld} onChange={(e) => setPriceEgld(e.target.value)} />
          </label>
          <button className="btn" type="button" disabled={pending || !isConfigured} onClick={onList}>
            {autoSend ? 'List & send' : 'Préparer list'}
          </button>
        </div>
        <div className="card">
          <h2>Buy / Cancel</h2>
          <label className="field">
            Listing ID
            <input value={buyId} onChange={(e) => setBuyId(e.target.value)} />
          </label>
          <label className="field">
            Paiement EGLD
            <input value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} />
          </label>
          <div className="row-actions">
            <button className="btn" type="button" disabled={pending || !isConfigured} onClick={onBuy}>
              {autoSend ? 'Buy & send' : 'Préparer buy'}
            </button>
            <button
              className="btn ghost"
              type="button"
              disabled={pending || !isConfigured}
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      </section>

      {(status || lastError) && (
        <section className="card mt">
          <h2>Status</h2>
          <p>{lastError ? `${lastError.code}: ${lastError.message}` : status}</p>
          {txPreview && <pre className="pre">{txPreview}</pre>}
        </section>
      )}
    </div>
  )
}

export default MarketplacePage
