/**
 * On-Ramp Euro — EUR → EGLD / USDC (MoonPay) + simulateur $TRO (swap paper).
 * Guest: conversion dynamique + CTA xPortal.
 * Connecté: widget MoonPay avec wallet erd1 prérempli.
 */
import { useEffect, useMemo, useState } from 'react'
import { useWallet } from '../context/WalletContext'
import { isMoonPayConfigured, openMoonPayBuy, moonpayStatusHint } from '../lib/moonpay'
import { requestOpenConnect } from '../lib/walletEvents'
import { useToast } from './ui/Toast'

type TargetAsset = 'EGLD' | 'USDC' | 'TRO'

const RATES_FALLBACK: Record<TargetAsset, number> = {
  EGLD: 12.5,
  USDC: 0.92,
  TRO: 0.05,
}

type Props = {
  compact?: boolean
  defaultEur?: number
  className?: string
}

export default function OnRampModule({ compact = false, defaultEur = 50, className = '' }: Props) {
  const { address, connected } = useWallet()
  const { push } = useToast()
  const [eur, setEur] = useState(defaultEur)
  const [target, setTarget] = useState<TargetAsset>('EGLD')
  const [rates, setRates] = useState(RATES_FALLBACK)
  const [busy, setBusy] = useState(false)
  const moonOn = isMoonPayConfigured()

  useEffect(() => {
    let c = false
    const run = async () => {
      try {
        const r = await fetch('https://api.multiversx.com/economics', { cache: 'no-store' })
        if (r.ok) {
          const j = await r.json()
          const usd = Number(j.price)
          if (Number.isFinite(usd) && usd > 0) {
            if (!c) setRates(prev => ({ ...prev, EGLD: usd * 0.92 }))
          }
        }
      } catch {
        /* keep fallback */
      }
      try {
        const r = await fetch('https://api.multiversx.com/tokens/TRO-94c925', { cache: 'no-store' })
        if (r.ok) {
          const j = await r.json()
          const usd = Number(j.price)
          if (Number.isFinite(usd) && usd > 0 && !c) {
            setRates(prev => ({ ...prev, TRO: usd * 0.92 }))
          }
        }
      } catch {
        /* */
      }
    }
    void run()
    const id = window.setInterval(() => void run(), 60_000)
    return () => {
      c = true
      window.clearInterval(id)
    }
  }, [])

  const received = useMemo(() => {
    const rate = rates[target] || 1
    return rate > 0 ? eur / rate : 0
  }, [eur, rates, target])

  const moonCurrency = target === 'USDC' ? 'usdc' : 'egld'

  const buy = async () => {
    if (!connected || !address?.startsWith('erd1')) {
      requestOpenConnect()
      push('Connecte xPortal pour acheter en Euro', 'info')
      return
    }
    if (target === 'TRO') {
      push('$TRO : achète EGLD puis swap sur xExchange / OneDex (paper guide)', 'info')
      return
    }
    if (!moonOn) {
      push(moonpayStatusHint(), 'err')
      return
    }
    setBusy(true)
    try {
      const r = await openMoonPayBuy({
        walletAddress: address,
        baseCurrencyAmount: eur,
        baseCurrencyCode: 'eur',
        currencyCode: moonCurrency,
        redirectURL:
          typeof window !== 'undefined'
            ? `${window.location.origin}${window.location.pathname}#/wallet?onramp=done`
            : undefined,
      })
      if (!r.ok) push(r.error || 'On-Ramp indisponible', 'err')
      else push(`MoonPay ouvert — EUR → ${target}`, 'info')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className={`rounded-2xl border border-emerald-400/20 bg-emerald-950/20 p-4 space-y-3 ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-300/90 font-tech">
            On-Ramp Euro
          </p>
          <h3 className="text-base font-semibold text-white">Fiat → Crypto · MultiversX</h3>
          {!compact && (
            <p className="text-[12px] text-zinc-400 mt-1 leading-relaxed">
              EUR → EGLD / USDC via MoonPay. $TRO via swap après EGLD.
            </p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${
            connected
              ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100'
              : 'border-amber-400/35 bg-amber-500/10 text-amber-100'
          }`}
        >
          {connected ? 'Wallet lié' : 'Guest'}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(['EGLD', 'USDC', 'TRO'] as TargetAsset[]).map(a => (
          <button
            key={a}
            type="button"
            onClick={() => setTarget(a)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition ${
              target === a
                ? 'border-emerald-400/45 bg-emerald-500/20 text-emerald-50'
                : 'border-white/10 text-zinc-500 hover:text-white'
            }`}
          >
            EUR → {a === 'TRO' ? '$TRO' : a}
          </button>
        ))}
      </div>

      <label className="block text-[11px] text-zinc-500 space-y-1">
        Montant EUR
        <input
          type="number"
          min={20}
          max={5000}
          step={10}
          value={eur}
          onChange={e => setEur(Math.max(20, Number(e.target.value) || 20))}
          className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white tabular-nums"
        />
      </label>

      <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Tu reçois (approx.)</p>
          <p className="text-lg font-semibold text-white tabular-nums">
            {received.toLocaleString(undefined, { maximumFractionDigits: target === 'TRO' ? 0 : 4 })}{' '}
            <span className="text-sm text-emerald-200/90">{target === 'TRO' ? '$TRO' : target}</span>
          </p>
        </div>
        <p className="text-[10px] text-zinc-600 text-right max-w-[9rem]">
          ~{rates[target].toFixed(target === 'EGLD' ? 2 : 4)} EUR / unité
        </p>
      </div>

      {target === 'TRO' && (
        <p className="text-[11px] text-amber-200/85 leading-relaxed">
          $TRO n'est pas listé en fiat direct. Achete EGLD puis swap sur xExchange / OneDex.
        </p>
      )}

      {!connected ? (
        <div className="space-y-2">
          <p className="text-[11px] text-zinc-400">
            Mode Guest — simulateur actif. Connecte xPortal pour l'achat sécurisé.
          </p>
          <button type="button" className="btn-primary w-full text-sm" onClick={() => requestOpenConnect()}>
            Connecter xPortal pour acheter
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="btn-primary w-full text-sm disabled:opacity-40"
          disabled={busy || (target !== 'TRO' && !moonOn)}
          onClick={() => void buy()}
        >
          {busy
            ? 'Ouverture…'
            : target === 'TRO'
              ? 'Guide swap → $TRO'
              : moonOn
                ? `Acheter ${target} · ${eur} €`
                : 'MoonPay non configuré'}
        </button>
      )}

      {connected && address && (
        <p className="text-[10px] mono text-zinc-600 truncate" title={address}>
          Destination · {address.slice(0, 12)}…{address.slice(-6)}
        </p>
      )}

      {!moonOn && (
        <p className="text-[10px] text-zinc-600">
          Configure <code className="text-[9px]">VITE_MOONPAY_API_KEY</code> (GitHub Secrets / Pages).
        </p>
      )}
    </div>
  )
}
