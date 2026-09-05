/**
 * Mentions légales · CGU démo · Confidentialité · Risques.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageGuide from '../components/PageGuide'
import { LINKS, LIA_WALLET } from '../config/links'
import { LEGAL_ENTITY } from '../config/legalEntity'

type Tab = 'mentions' | 'cgu' | 'privacy' | 'risk'

const TABS: { id: Tab; label: string }[] = [
  { id: 'mentions', label: 'Mentions' },
  { id: 'cgu', label: 'Conditions' },
  { id: 'privacy', label: 'Confidentialité' },
  { id: 'risk', label: 'Risques' },
]

export default function LegalPage() {
  const [tab, setTab] = useState<Tab>('mentions')
  const year = useMemo(() => new Date().getFullYear(), [])

  return (
    <div className="animate-fade-in space-y-5 pb-12 max-w-2xl">
      <PageGuide page="home" />

      <header className="space-y-1">
        <p className="section-label text-zinc-400">Juridique</p>
        <h1 className="page-title">Mentions légales</h1>
        <p className="page-sub">Éditeur · démo paper · MultiversX</p>
      </header>

      <div className="flex flex-wrap gap-1.5">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
              tab === t.id
                ? 'border-white/25 bg-white/10 text-white'
                : 'border-white/10 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <article className="card text-sm text-zinc-400 space-y-3 leading-relaxed">
        {tab === 'mentions' && (
          <>
            <h2 className="text-base font-semibold text-white">Éditeur</h2>
            <p>
              <strong className="text-zinc-200">{LEGAL_ENTITY.productName}</strong> — projet édité
              par <strong className="text-zinc-200">{LEGAL_ENTITY.publisherName}</strong>.
            </p>
            <p>
              SIRET :{' '}
              <span className="text-zinc-300 font-mono text-[13px]">{LEGAL_ENTITY.siret}</span>
            </p>
            <p>
              Pays : {LEGAL_ENTITY.country}. Dépôt open source :{' '}
              <a className="text-cyan-300/90 hover:underline" href={LINKS.github} target="_blank" rel="noreferrer">
                Neltud/xArtists
              </a>
              . Site démo :{' '}
              <a className="text-cyan-300/90 hover:underline" href={LINKS.dapp} target="_blank" rel="noreferrer">
                neltud.github.io/xArtists
              </a>
              .
            </p>
            <p>
              Soft launch / mode paper : mint agents et marketplace selon statut des smart contracts
              (fail-closed si non vérifiés).
            </p>
            <h2 className="text-base font-semibold text-white pt-2">Hébergement</h2>
            <p>Front statique GitHub Pages. Lectures de chaîne via API publiques MultiversX.</p>
            <h2 className="text-base font-semibold text-white pt-2">Contact</h2>
            <p>
              {LEGAL_ENTITY.contact}. Wallet protocole LIA (ops, ≠ wallet utilisateur) :{' '}
              <code className="text-[11px] text-zinc-500 break-all">{LIA_WALLET}</code>
            </p>
            <p className="text-[11px] text-zinc-600">
              © {year} {LEGAL_ENTITY.publisherName} / {LEGAL_ENTITY.productName}.
            </p>
          </>
        )}

        {tab === 'cgu' && (
          <>
            <h2 className="text-base font-semibold text-white">Conditions (démo)</h2>
            <p>
              Accès à la dApp = acceptation. Service « en l’état », démonstration et test produit.
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong className="text-zinc-300">Packs</strong> Pulse · Yield · Sentinel uniquement
                — pas un fonds ni une promesse de rendement.
              </li>
              <li>
                <strong className="text-zinc-300">Tours / Musée</strong> : culture, hors packs agents.
              </li>
              <li>
                <strong className="text-zinc-300">Trading LIA</strong> : paper par défaut sur la démo.
              </li>
              <li>Signature TX = wallet utilisateur uniquement.</li>
            </ul>
          </>
        )}

        {tab === 'privacy' && (
          <>
            <h2 className="text-base font-semibold text-white">Confidentialité</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Pas de compte e-mail obligatoire pour parcourir la démo.</li>
              <li>Adresses wallet : usage local + API MultiversX publiques.</li>
              <li>localStorage : préférences / intentions paper — effaçable navigateur.</li>
              <li>Paiements carte : Stripe / Paybox si configurés — politiques des prestataires.</li>
            </ul>
          </>
        )}

        {tab === 'risk' && (
          <>
            <h2 className="text-base font-semibold text-white">Avertissements</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Crypto / NFT : risque de perte en capital. Pas un conseil en investissement.</li>
              <li>Boards paper ≠ performance de portefeuille.</li>
              <li>Visites 3D : interprétation numérique, pas un jumeau BIM des musées physiques.</li>
              <li>Vérifiez adresses et TX avant signature.</li>
            </ul>
          </>
        )}
      </article>

      <p className="text-[11px] text-zinc-600">
        <Link to="/" className="text-cyan-300/90 hover:underline">
          Accueil
        </Link>
        {' · '}
        <Link to="/agents" className="text-cyan-300/90 hover:underline">
          Packs
        </Link>
        {' · '}
        <Link to="/museum" className="text-cyan-300/90 hover:underline">
          Musée
        </Link>
      </p>
    </div>
  )
}
