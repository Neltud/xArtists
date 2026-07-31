import React, { useCallback, useState } from 'react'
import { useMvxAccount } from '../services/mvx'
import { useAgentsMarketplace } from '../hooks/useAgentsMarketplace'
import { CONTRACTS, shortAddr, explorerAccount } from '../config/contracts'
import './pages.css'

/** Demo catalog until on-chain indexing is wired */
const DEMO_LISTINGS = [
  {
    id: 1,
    agentId: 'LIA-v6-circuit-1pct',
    seller: 'erd1…lia',
    priceEgld: '0.05',
    active: true,
    blurb: 'Signal package compound +1% / guards G01–G17',
  },
  {
    id: 2,
    agentId: 'GreenSmoke-Macro',
    seller: 'erd1…gs',
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
    listAgent,
    buyAgent,
    cancelListing,
  } = useAgentsMarketplace()

  const [agentId, setAgentId] = useState('LIA-v6-circuit-1pct')
  const [priceEgld, setPriceEgld] = useState('0.05')
  const [buyId, setBuyId] = useState('1')
  const [buyPrice, setBuyPrice] = useState('0.05')
  const [txPreview, setTxPreview] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  const nonce = account?.nonce ?? 0

  const onList = useCallback(async () => {
    if (!isLoggedIn || !address) {
      setStatus('Connecte le wallet d’abord')
      return
    }
    const built = await listAgent(address, nonce, { agentId, priceEgld })
    if (!built) {
      setStatus(lastError || 'List failed')
      return
    }
    setTxPreview(JSON.stringify(built.plain, null, 2))
    setStatus(
      'TX listAgentAction prête — signer via sdk-dapp sendTransactions (Extension / xPortal)'
    )
    // Integration point: pass built.tx to useSendTransaction().sendTransactions([built.tx])
  }, [isLoggedIn, address, nonce, agentId, priceEgld, listAgent, lastError])

  const onBuy = useCallback(async () => {
    if (!isLoggedIn || !address) {
      setStatus('Connecte le wallet d’abord')
      return
    }
    const built = await buyAgent(address, nonce, {
      listingId: parseInt(buyId, 10) || 1,
      priceEgld: buyPrice,
    })
    if (!built) {
      setStatus(lastError || 'Buy failed')
      return
    }
    setTxPreview(JSON.stringify(built.plain, null, 2))
    setStatus('TX buyAgentAction prête (EGLD payable) — signer via sdk-dapp')
  }, [isLoggedIn, address, nonce, buyId, buyPrice, buyAgent, lastError])

  const onCancel = useCallback(async () => {
    if (!isLoggedIn || !address) {
      setStatus('Connecte le wallet d’abord')
      return
    }
    const built = await cancelListing(address, nonce, parseInt(buyId, 10) || 1)
    if (!built) {
      setStatus(lastError || 'Cancel failed')
      return
    }
    setTxPreview(JSON.stringify(built.plain, null, 2))
    setStatus('TX cancelListing prête — signer via sdk-dapp')
  }, [isLoggedIn, address, nonce, buyId, cancelListing, lastError])

  return (
    <div className="page">
      <header className="page-head">
        <h1>Marketplace · Agents</h1>
        <p className="muted">
          List / Buy / Cancel on-chain — SC Agents Marketplace + NFT marketplace existant.
        </p>
      </header>

      <section className="grid-2">
        <div className="card">
          <h2>Agents Marketplace SC</h2>
          {isConfigured ? (
            <a href={explorerAccount(contractAddress)} target="_blank" rel="noreferrer">
              {contractAddress}
            </a>
          ) : (
            <span className="badge warn">Adresse TBD — déployer puis VITE_AGENTS_MARKETPLACE_ADDRESS</span>
          )}
          <p className="muted mt">
            Endpoints: <code>listAgentAction</code> · <code>buyAgentAction</code> (EGLD) ·{' '}
            <code>cancelListing</code>
          </p>
          <p className="muted">Fee init typique 250 bps (2,5%)</p>
        </div>
        <div className="card">
          <h2>NFT Marketplace (existant)</h2>
          <a href={explorerAccount(CONTRACTS.marketplace)} target="_blank" rel="noreferrer">
            {shortAddr(CONTRACTS.marketplace)}
          </a>
          <p className="muted mt">listNft / buyNft — collections xArtists</p>
        </div>
      </section>

      <section className="card mt">
        <h2>Catalogue (aperçu)</h2>
        <table className="tbl">
          <thead>
            <tr>
              <th>ID</th>
              <th>Agent</th>
              <th>Prix EGLD</th>
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
                <td>{l.priceEgld}</td>
                <td>{l.active ? 'active' : 'sold'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted">Index on-chain: query getListing(1..listingCount) après deploy.</p>
      </section>

      <section className="grid-2 mt">
        <div className="card">
          <h2>List agent action</h2>
          <label className="field">
            Agent ID
            <input value={agentId} onChange={(e) => setAgentId(e.target.value)} />
          </label>
          <label className="field">
            Prix (EGLD)
            <input value={priceEgld} onChange={(e) => setPriceEgld(e.target.value)} />
          </label>
          <button className="btn" type="button" disabled={pending || !isConfigured} onClick={onList}>
            Préparer listAgentAction
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
              Préparer buy
            </button>
            <button className="btn ghost" type="button" disabled={pending || !isConfigured} onClick={onCancel}>
              Cancel listing
            </button>
          </div>
        </div>
      </section>

      {(status || lastError) && (
        <section className="card mt">
          <h2>Status</h2>
          <p>{lastError || status}</p>
          {txPreview && <pre className="pre">{txPreview}</pre>}
        </section>
      )}

      <section className="card mt">
        <h2>Deploy</h2>
        <pre className="pre">{`# contracts/agents-marketplace
mxpy contract deploy --bytecode output/agents-marketplace.wasm \\
  --arguments 250 --project . --pem wallet.pem --recall-nonce --send
# puis:
export VITE_AGENTS_MARKETPLACE_ADDRESS=erd1...
# maj data/contracts.json + src/config/contracts.ts`}</pre>
      </section>
    </div>
  )
}

export default MarketplacePage
