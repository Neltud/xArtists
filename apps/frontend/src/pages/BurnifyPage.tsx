import { useState } from 'react'
import { Link } from 'react-router-dom'
import PreMainnetBanner from '../components/PreMainnetBanner'
import { PRE_MAINNET_MODULES } from '../config/preMainnet'
import { useBurnTro } from '../hooks/useBurnTro'
import { LINKS, LIA_WALLET } from '../config/links'
import { quoteBurnReward } from '../lib/troBurnQuote'

const mod = PRE_MAINNET_MODULES.find((m) => m.id === 'burnify')
const BFY = 'BFY-8344ff'
const STAKING =
  'erd1qqqqqqqqqqqqqpgqm2mkm02pam4tvtykfs7e8w508vzfvjqrp4ssfrts0f'
const CLAIM_AFTER = 5

/** Protocol Burnify (LIA) + optional xArtists tro-burn SC */
export default function BurnifyPage() {
  const {
    burnTro,
    fundRewards,
    pending,
    error,
    lastTx,
    live,
    scAddress,
    tokenId,
    decimals,
    egldPerTroHint,
  } = useBurnTro()
  const [amount, setAmount] = useState('10')
  const [fundEgld, setFundEgld] = useState('0.1')
  const [localErr, setLocalErr] = useState<string | null>(null)
  const [showFund, setShowFund] = useState(false)
  const [showUserSc, setShowUserSc] = useState(false)

  const hint = Number(egldPerTroHint) || 0.001
  const q = quoteBurnReward(Number(amount) || 0, { egldPerWholeTro: hint, protocolFeeBps: 1000 })

  const onBurn = async () => {
    setLocalErr(null)
    const n = Number(amount)
    if (!Number.isFinite(n) || n <= 0) {
      setLocalErr('Montant invalide')
      return
    }
    try {
      await burnTro(n)
    } catch (e: unknown) {
      setLocalErr(e instanceof Error ? e.message : 'Erreur')
    }
  }

  const onFund = async () => {
    setLocalErr(null)
    const n = Number(fundEgld)
    if (!Number.isFinite(n) || n <= 0) {
      setLocalErr('EGLD invalide')
      return
    }
    try {
      await fundRewards(n)
    } catch (e: unknown) {
      setLocalErr(e instanceof Error ? e.message : 'Erreur')
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <header>
        <h1 className="text-2xl font-bold">🔥 Burnify · LIA + $TRO</h1>
        <p className="text-sm text-zinc-400 mt-2">
          Protocole <strong className="text-zinc-200">Burnify</strong> pour le wallet LIA : stake BFY,
          batches TRO, claim EGLD après {CLAIM_AFTER} batches. Pas le wallet utilisateur.
        </p>
      </header>

      <section className="rounded-xl border border-orange-500/30 bg-orange-950/20 p-4 space-y-3">
        <h2 className="font-semibold text-orange-100">A · Protocole Burnify (wallet LIA)</h2>
        <ol className="text-sm text-zinc-300 space-y-2 list-decimal list-inside">
          <li>
            BFY libre → <code className="text-xs">deposit</code> sur SC staking (rester staké).
          </li>
          <li>
            Batches <strong>TRO</strong> (≈0,015 EGLD + equiv. token) → fin de cycle : TRO brûlé.
          </li>
          <li>
            Après <strong>{CLAIM_AFTER} batches</strong> → <code className="text-xs">claimRewards</code>{' '}
            EGLD vers LIA. Claim <em>obligatoire</em> au seuil.
          </li>
        </ol>
        <div className="text-xs text-zinc-500 space-y-1 font-mono break-all">
          <div>BFY {BFY}</div>
          <div>Staking {STAKING}</div>
          <div>
            LIA {LIA_WALLET.slice(0, 14)}…{LIA_WALLET.slice(-8)}
          </div>
        </div>
        <p className="text-[11px] text-zinc-500 leading-relaxed">
          Agent <code>python -m lia.burnify.agent</code> · <code>data/burnify_lia_state.json</code> · live
          si <code>LIA_LIVE_TRADING=1</code> + <code>LIA_BURNIFY_LIVE=1</code>
        </p>
        <div className="flex flex-wrap gap-3 text-sm">
          <a href="https://burnify.app" target="_blank" rel="noreferrer" className="text-orange-300 hover:underline">
            burnify.app ↗
          </a>
          <a
            href={`https://explorer.multiversx.com/accounts/${STAKING}`}
            target="_blank"
            rel="noreferrer"
            className="text-zinc-400 hover:underline"
          >
            Explorer staking ↗
          </a>
          <a href={LINKS.explorerAccount(LIA_WALLET)} target="_blank" rel="noreferrer" className="text-zinc-400 hover:underline">
            Wallet LIA ↗
          </a>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-800 p-4 space-y-3">
        <button
          type="button"
          className="text-sm text-zinc-300 hover:text-white w-full text-left"
          onClick={() => setShowUserSc((s) => !s)}
        >
          {showUserSc ? '▾' : '▸'} B · SC xArtists tro-burn (users)
        </button>
        {showUserSc && (
          <div className="space-y-4">
            {!live && <PreMainnetBanner module={mod} />}
            <p className="text-xs text-zinc-500">
              Produit optionnel : burn {tokenId} + reward EGLD pool xArtists. ≠ Burnify.app
            </p>
            <div className="text-xs flex justify-between">
              <span className="text-zinc-500">Statut</span>
              <span className={live ? 'text-emerald-400' : 'text-amber-300'}>
                {live ? 'SC live' : 'pre-mainnet'}
              </span>
            </div>
            <label className="block text-sm text-zinc-400">
              Montant ($TRO)
              <input
                type="number"
                min={0}
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={!live || pending}
                className="mt-1 w-full rounded-lg bg-[#111118] border border-[#2a2a3a] px-3 py-2 text-white disabled:opacity-60"
              />
            </label>
            <div className="text-xs text-zinc-400 space-y-1">
              <div className="flex justify-between">
                <span>Estimate</span>
                <span className="font-mono">{q.rewardTotalEgld.toFixed(6)} EGLD</span>
              </div>
              <div className="flex justify-between">
                <span>→ user / LIA</span>
                <span className="font-mono">
                  {q.toUserEgld.toFixed(6)} / {q.toProtocolEgld.toFixed(6)}
                </span>
              </div>
            </div>
            {(error || localErr) && (
              <p className="text-sm text-red-400 p-2 border border-red-500/30 rounded">{localErr || error}</p>
            )}
            {lastTx && <p className="text-xs text-emerald-400">TX {lastTx}</p>}
            <button
              type="button"
              onClick={onBurn}
              disabled={!live || pending}
              className={`w-full rounded-lg py-2.5 text-sm font-medium ${
                live ? 'bg-orange-600 text-white' : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              {pending ? '…' : live ? `Burn ${amount} $TRO` : 'Burn disabled'}
            </button>
            <button type="button" className="text-xs text-zinc-500" onClick={() => setShowFund((s) => !s)}>
              {showFund ? '▾' : '▸'} fundRewards
            </button>
            {showFund && (
              <div className="space-y-2">
                <input
                  type="number"
                  value={fundEgld}
                  onChange={(e) => setFundEgld(e.target.value)}
                  disabled={!live || pending}
                  className="w-full rounded-lg bg-[#111118] border border-[#2a2a3a] px-3 py-2 text-sm text-white"
                />
                <button
                  type="button"
                  onClick={onFund}
                  disabled={!live || pending}
                  className="w-full rounded-lg py-2 text-sm bg-violet-700 disabled:bg-zinc-800"
                >
                  fundRewards
                </button>
              </div>
            )}
            <p className="text-[10px] text-zinc-600">
              {scAddress || 'VITE_TRO_BURN_ADDRESS'} · dec={decimals}
            </p>
          </div>
        )}
      </section>

      <div className="flex gap-4 text-sm">
        <Link to="/tro" className="text-violet-400 hover:underline">
          ← $TRO
        </Link>
        <Link to="/portfolio" className="text-zinc-400 hover:underline">
          Portfolio LIA
        </Link>
      </div>
    </div>
  )
}
