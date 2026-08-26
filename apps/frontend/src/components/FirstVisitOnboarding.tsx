/**
 * One-shot onboarding modal — localStorage, dismissible, honest paper-first.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { requestOpenConnect } from '../lib/walletEvents'

const KEY = 'xartists_onboard_v1_done'

export default function FirstVisitOnboarding() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) === '1') return
      setOpen(true)
    } catch {
      /* private mode */
    }
  }, [])

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, '1')
    } catch {
      /* ignore */
    }
    setOpen(false)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboard-title"
    >
      <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-purple-500/30 bg-[#0c0c14] shadow-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
        <p className="text-[10px] uppercase tracking-widest text-purple-300 mb-2">Bienvenue · xArtists</p>
        <h2 id="onboard-title" className="text-xl font-black text-white mb-2">
          4 idées avant de cliquer
        </h2>
        <ol className="space-y-3 text-sm text-zinc-300 mb-5 list-decimal list-inside">
          <li>
            <strong className="text-white">Ton wallet</strong> ≠ wallet protocole LIA. Connecte le tien
            seulement.
          </li>
          <li>
            <strong className="text-white">Trading / Portfolio</strong> = board LIA en{' '}
            <span className="text-amber-300">paper</span> — pas tes fonds.
          </li>
          <li>
            <strong className="text-white">Packs agents</strong> = accès écosystème, pas un fonds géré.
          </li>
          <li>
            <strong className="text-white">List / Buy NFT</strong> = après deploy SC + codeHash vérifié.
          </li>
        </ol>
        <div className="flex flex-wrap gap-2 mb-4">
          <button type="button" onClick={() => { requestOpenConnect(); dismiss() }} className="btn-primary text-sm">
            Connecter
          </button>
          <Link to="/agents" onClick={dismiss} className="btn-secondary text-sm inline-flex items-center">
            Voir les packs
          </Link>
          <Link to="/trading" onClick={dismiss} className="btn-secondary text-sm inline-flex items-center">
            Board LIA
          </Link>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="w-full text-center text-xs text-zinc-500 hover:text-zinc-300 py-2"
        >
          Continuer sans guide — ne plus afficher
        </button>
      </div>
    </div>
  )
}
