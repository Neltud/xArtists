/**
 * DeFi Hub — Hatom / AshSwap / Soul · feedback Copié !
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  HATOM,
  ASHSWAP,
  SOUL,
  buildHatomSupplyEgld,
  buildHatomSupplyEsdt,
  buildHatomBorrow,
  buildHatomWithdraw,
  buildAshAddLiquidityUsdc,
  buildSoulPlaceholder,
  computeHealthFactor,
  hfLabel,
  HF_MIN_SAFE,
  type PreparedTx,
} from '../../services/defi'
import { useWallet } from '../../context/WalletContext'
import TroLiquidityPanel from './TroLiquidityPanel'

type Proto = 'hatom' | 'ashswap' | 'soul'

const CARDS: {
  id: Proto
  title: string
  blurb: string
  apyHint: string
  href: string
  risk: string
}[] = [
  {
    id: 'hatom',
    title: 'Hatom',
    blurb: 'Lending / borrow MultiversX (HEGLD, USDC…)',
    apyHint: 'APY marchés variables · TVL public',
    href: HATOM.dapp,
    risk: `HF min ${HF_MIN_SAFE} recommandé`,
  },
  {
    id: 'ashswap',
    title: 'AshSwap',
    blurb: 'Stable-swap USDC/USDT + LP stake',
    apyHint: 'Frais stables · farms ASH',
    href: ASHSWAP.dapp,
    risk: 'Slippage + IL limité sur stables',
  },
  {
    id: 'soul',
    title: 'Soul Protocol',
    blurb: 'Couche liquidité cross-chain (MVX en cours)',
    apyHint: 'Aave / Morpho / Hatom unifiés',
    href: SOUL.site,
    risk: 'SC MVX non branché — deep-link only',
  },
]

export default function DeFiCommandPanel({ hideTroLiquidity = false }: { hideTroLiquidity?: boolean } = {}) {
  const { address, connected } = useWallet()
  const [proto, setProto] = useState<Proto>('hatom')
  const [amount, setAmount] = useState('0.1')
  const [prepared, setPrepared] = useState<PreparedTx | null>(null)
  const [collateralUsd, setCollateralUsd] = useState('100')
  const [borrowUsd, setBorrowUsd] = useState('0')
  const [copied, setCopied] = useState(false)

  const hf = useMemo(
    () =>
      computeHealthFactor({
        collateralUsd: Number(collateralUsd) || 0,
        borrowUsd: Number(borrowUsd) || 0,
      }),
    [collateralUsd, borrowUsd],
  )
  const hfUi = hfLabel(hf)

  const prepare = (kind: string) => {
    const n = Number(amount)
    if (!Number.isFinite(n) || n <= 0) {
      setPrepared(null)
      return
    }
    let tx: PreparedTx | null = null
    if (proto === 'hatom') {
      if (kind === 'supply_egld') tx = buildHatomSupplyEgld(n)
      if (kind === 'supply_usdc') tx = buildHatomSupplyEsdt('USDC', n)
      if (kind === 'borrow_usdc')
        tx = buildHatomBorrow('USDC', n, {
          collateralUsd: Number(collateralUsd) || 0,
          borrowUsd: Number(borrowUsd) || 0,
        })
      if (kind === 'withdraw') tx = buildHatomWithdraw('EGLD', n)
    }
    if (proto === 'ashswap' && kind === 'add_lp') tx = buildAshAddLiquidityUsdc(n)
    if (proto === 'soul') tx = buildSoulPlaceholder('supply')
    setPrepared(tx)
    setCopied(false)
  }

  const copyData = async () => {
    if (!prepared) return
    const payload = JSON.stringify(
      {
        receiver: prepared.receiver,
        value: prepared.value,
        data: prepared.data,
        gasLimit: prepared.gasLimit,
        chainId: prepared.chainId,
        slippage: prepared.slippage,
        deadline: prepared.deadline,
      },
      null,
      2,
    )
    try {
      await navigator.clipboard.writeText(payload)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="glass-hud p-4 space-y-4">
      {!hideTroLiquidity && <TroLiquidityPanel />}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-tech uppercase tracking-[0.2em] text-cyan-300/90">
            DeFi Hub
          </p>
          <h2 className="text-lg font-bold text-white">Hatom · AshSwap · Soul</h2>
        </div>
        <Link to="/hatom" className="btn-secondary text-xs">
          Positions Hatom →
        </Link>
      </div>

      <p className="text-[11px] text-zinc-500">
        Prépare une transaction MultiversX. Signature uniquement via{' '}
        <strong className="text-zinc-300">xPortal</strong> (non-custodial). Pas un conseil
        financier.
      </p>

      <div className="grid sm:grid-cols-3 gap-2">
        {CARDS.map(c => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              setProto(c.id)
              setPrepared(null)
              setCopied(false)
            }}
            className={`text-left rounded-xl border p-3 transition ${
              proto === c.id
                ? 'border-cyan-400/40 bg-cyan-500/10'
                : 'border-white/10 bg-black/30 hover:border-white/20'
            }`}
          >
            <p className="font-semibold text-sm text-white">{c.title}</p>
            <p className="text-[11px] text-zinc-400 mt-1">{c.blurb}</p>
            <p className="text-[10px] text-violet-300/80 mt-2">{c.apyHint}</p>
            <p className="text-[10px] text-amber-200/70 mt-1">{c.risk}</p>
          </button>
        ))}
      </div>

      {proto === 'hatom' && (
        <div className="grid sm:grid-cols-3 gap-2 text-[11px]">
          <label className="space-y-1">
            <span className="text-zinc-500">Collateral USD (estim.)</span>
            <input
              className="w-full rounded-lg bg-black/50 border border-white/10 px-2 py-1.5 mono tabular-nums"
              value={collateralUsd}
              onChange={e => setCollateralUsd(e.target.value)}
            />
          </label>
          <label className="space-y-1">
            <span className="text-zinc-500">Borrow USD (estim.)</span>
            <input
              className="w-full rounded-lg bg-black/50 border border-white/10 px-2 py-1.5 mono tabular-nums"
              value={borrowUsd}
              onChange={e => setBorrowUsd(e.target.value)}
            />
          </label>
          <div className="flex flex-col justify-end">
            <span className="text-zinc-500">Health Factor</span>
            <span
              className={`font-tech mono tabular-nums text-sm ${
                hfUi.tone === 'safe'
                  ? 'text-emerald-400'
                  : hfUi.tone === 'warn'
                    ? 'text-amber-300'
                    : hfUi.tone === 'crit'
                      ? 'text-rose-400'
                      : 'text-zinc-400'
              }`}
            >
              {hfUi.label}
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <label className="space-y-1 text-[11px]">
          <span className="text-zinc-500">Montant</span>
          <input
            className="w-28 rounded-lg bg-black/50 border border-white/10 px-2 py-1.5 text-sm mono tabular-nums"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
        </label>
        {proto === 'hatom' && (
          <>
            <button type="button" className="btn-secondary text-xs" onClick={() => prepare('supply_egld')}>
              Supply EGLD
            </button>
            <button type="button" className="btn-secondary text-xs" onClick={() => prepare('supply_usdc')}>
              Supply USDC
            </button>
            <button type="button" className="btn-secondary text-xs" onClick={() => prepare('borrow_usdc')}>
              Borrow USDC
            </button>
            <button type="button" className="btn-secondary text-xs" onClick={() => prepare('withdraw')}>
              Withdraw HEGLD
            </button>
          </>
        )}
        {proto === 'ashswap' && (
          <button type="button" className="btn-secondary text-xs" onClick={() => prepare('add_lp')}>
            Add LP USDC
          </button>
        )}
        {proto === 'soul' && (
          <button type="button" className="btn-secondary text-xs" onClick={() => prepare('soul')}>
            Info Soul
          </button>
        )}
        <a
          href={CARDS.find(c => c.id === proto)?.href}
          target="_blank"
          rel="noreferrer"
          className="btn-primary text-xs"
        >
          Ouvrir dApp officielle
        </a>
      </div>

      {prepared && (
        <div className="rounded-xl border border-violet-400/25 bg-black/40 p-3 space-y-2 text-[11px]">
          <p className="font-semibold text-violet-200">{prepared.summary}</p>
          {prepared.riskNote && <p className="text-amber-200/80">{prepared.riskNote}</p>}
          {prepared.receiver ? (
            <>
              <p className="mono tabular-nums text-zinc-500 break-all">→ {prepared.receiver}</p>
              <p className="mono text-zinc-400 break-all">data: {prepared.data.slice(0, 80)}…</p>
              <p className="mono tabular-nums text-zinc-500">
                value={prepared.value} · gas={prepared.gasLimit}
                {prepared.slippage != null ? ` · slip=${(prepared.slippage * 100).toFixed(1)}%` : ''}
                {connected && address ? ` · from ${address.slice(0, 8)}…` : ' · connecte xPortal'}
              </p>
              <div className="flex flex-wrap gap-2 pt-1 items-center">
                <button type="button" className="btn-secondary text-xs min-w-[7rem]" onClick={copyData}>
                  {copied ? '✓ Copié !' : 'Copier payload JSON'}
                </button>
                <span className="text-zinc-600">
                  Colle dans xPortal / sdk-dapp signTransactions
                </span>
              </div>
            </>
          ) : (
            <a href={SOUL.site} target="_blank" rel="noreferrer" className="btn-primary text-xs inline-flex">
              Continuer sur Soul
            </a>
          )}
        </div>
      )}
    </div>
  )
}
