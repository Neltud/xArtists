/**
 * Mentions légales · CGU · Privacy · Risques · Processus · Terms (MiCA-style shield).
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PageGuide from '../components/PageGuide'
import { LINKS, LIA_WALLET } from '../config/links'
import { LEGAL_ENTITY, siretLabel } from '../config/legalEntity'
import { LEGAL_FOOTER_DISCLAIMER } from '../components/FooterLegal'

type Tab = 'mentions' | 'cgu' | 'privacy' | 'risk' | 'process' | 'terms'

const TABS: { id: Tab; label: string }[] = [
  { id: 'mentions', label: 'Mentions' },
  { id: 'terms', label: 'Terms' },
  { id: 'cgu', label: 'Conditions' },
  { id: 'privacy', label: 'Confidentialité' },
  { id: 'risk', label: 'Risques' },
  { id: 'process', label: 'Processus' },
]

export default function LegalPage() {
  const [params] = useSearchParams()
  const [tab, setTab] = useState<Tab>('mentions')
  const year = useMemo(() => new Date().getFullYear(), [])
  const siret = siretLabel()
  const siretMissing = LEGAL_ENTITY.siretStatus !== 'ok'

  useEffect(() => {
    const t = params.get('tab') as Tab | null
    if (t && TABS.some(x => x.id === t)) setTab(t)
    if (typeof window !== 'undefined' && window.location.pathname.includes('/legal/terms')) {
      setTab('terms')
    }
  }, [params])

  return (
    <div className="animate-fade-in space-y-5 pb-12 max-w-2xl">
      <PageGuide page="home" />

      <header className="space-y-1">
        <p className="section-label text-zinc-400">Juridique</p>
        <h1 className="page-title">Mentions légales</h1>
        <p className="page-sub">Éditeur · interface non-custodiale · MultiversX mainnet</p>
      </header>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] text-zinc-400 leading-relaxed">
        {LEGAL_FOOTER_DISCLAIMER}
      </div>

      {siretMissing && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-[12px] text-amber-100/90">
          SIRET éditeur non renseigné dans la config. Les mentions resteront marquées « à
          compléter » jusqu’à saisie du numéro officiel (14 chiffres).
        </div>
      )}

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
        {tab === 'terms' && (
          <>
            <h2 className="text-base font-semibold text-white">1 · Nature logicielle</h2>
            <p>
              xArtists est une <strong className="text-zinc-200">interface logicielle</strong>{' '}
              décentralisée, open source et à vocation communautaire. Elle permet d’interagir avec
              des contrats intelligents MultiversX et d’afficher des contenus culturels / éducatifs.
              Ce n’est <strong className="text-zinc-200">pas une plateforme de courtage</strong>, ni
              un établissement de monnaie électronique, ni un prestataire de services sur crypto-actifs
              (CASP) au sens MiCA pour le compte d’autrui, sauf mention contraire d’un prestataire
              tiers clairement identifié (paiement fiat).
            </p>
            <h2 className="text-base font-semibold text-white pt-2">2 · Marchés & exonération</h2>
            <p>
              Les prix et variations de <strong className="text-zinc-200">$TRO</strong>,{' '}
              <strong className="text-zinc-200">EGLD</strong> et de tout autre actif affiché sont
              fournis à titre informatif. L’éditeur n’est pas responsable des pertes liées à la
              volatilité, aux bugs logiciels, à la congestion réseau ou aux décisions de trading de
              l’utilisateur. <strong className="text-zinc-200">Aucun conseil financier</strong> n’est
              fourni.
            </p>
            <h2 className="text-base font-semibold text-white pt-2">3 · Token $TRO</h2>
            <p>
              $TRO est présenté comme un jeton d’<strong className="text-zinc-200">utilité et de
              gouvernance / participation</strong> au sein de l’écosystème xArtists (staking,
              accès fonctionnalités, droits de pool selon contrats). Il n’est pas commercialisé ici
              comme un produit d’investissement garantissant un rendement. Toute offre publique
              éventuelle relève des règles applicables et de documentations séparées.
            </p>
            <h2 className="text-base font-semibold text-white pt-2">4 · Fiat & tiers</h2>
            <p>
              Les paiements carte / SEPA, s’ils sont activés, sont traités par des{' '}
              <strong className="text-zinc-200">entités tiers régulées</strong> (ex. Stripe, Paybox,
              partenaire FC). xArtists ne conserve pas les données de carte. Le mint on-chain après
              paiement dépend d’un webhook ops — l’utilisateur doit pouvoir prouver le paiement et
              un <span className="mono text-zinc-300">erd1</span> de destination.
            </p>
            <h2 className="text-base font-semibold text-white pt-2">5 · LIA & paper</h2>
            <p>
              LIA est un agent <strong className="text-zinc-200">analytique</strong> ; le mode public
              par défaut est le <strong className="text-zinc-200">paper trading</strong> éducatif.
              Aucun mandat de gestion de portefeuille utilisateur n’est confié à LIA via cette
              interface.
            </p>
          </>
        )}

        {tab === 'mentions' && (
          <>
            <h2 className="text-base font-semibold text-white">Éditeur du site</h2>
            <p>
              <strong className="text-zinc-200">{LEGAL_ENTITY.productName}</strong> — projet édité
              par <strong className="text-zinc-200">{LEGAL_ENTITY.publisherName}</strong>.
            </p>
            <p>
              Forme : <span className="text-zinc-300">{LEGAL_ENTITY.legalForm}</span>
            </p>
            <p>
              SIRET :{' '}
              <span className={`font-mono text-[13px] ${siretMissing ? 'text-amber-300' : 'text-zinc-300'}`}>
                {siret}
              </span>
            </p>
            <p>
              Pays : {LEGAL_ENTITY.country}. Siège : {LEGAL_ENTITY.addressLine}.
            </p>
            <p>
              Dépôt open source :{' '}
              <a className="text-cyan-300/90 hover:underline" href={LINKS.github} target="_blank" rel="noreferrer">
                Neltud/xArtists
              </a>
              .
            </p>
            <h2 className="text-base font-semibold text-white pt-2">Hébergement</h2>
            <p>{LEGAL_ENTITY.hoster}. Lectures de chaîne via API publiques MultiversX ({LEGAL_ENTITY.chain}).</p>
            <h2 className="text-base font-semibold text-white pt-2">Contact</h2>
            <p>
              {LEGAL_ENTITY.contact}
              {LEGAL_ENTITY.contactEmail ? ` · ${LEGAL_ENTITY.contactEmail}` : ''}.
            </p>
            <p>
              Wallet protocole LIA (ops, ≠ wallet utilisateur) :{' '}
              <code className="text-[11px] text-zinc-500 break-all">{LIA_WALLET}</code>
            </p>
            <p className="text-[11px] text-zinc-600">
              © {year} {LEGAL_ENTITY.publisherName} / {LEGAL_ENTITY.productName}.
            </p>
          </>
        )}

        {tab === 'cgu' && (
          <>
            <h2 className="text-base font-semibold text-white">Conditions d’utilisation</h2>
            <p>
              L’accès à la dApp vaut acceptation des présentes. Service fourni « en l’état ».
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong className="text-zinc-300">Packs</strong> — pas un fond d’investissement, pas
                une promesse de rendement.
              </li>
              <li>
                <strong className="text-zinc-300">Trading LIA</strong> — simulation / paper par défaut.
              </li>
              <li>
                Signature TX uniquement via le wallet utilisateur. Aucune clé privée stockée.
              </li>
              <li>Interdiction d’utiliser le wallet protocole LIA comme session utilisateur.</li>
            </ul>
          </>
        )}

        {tab === 'privacy' && (
          <>
            <h2 className="text-base font-semibold text-white">Confidentialité</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Pas de compte e-mail obligatoire pour parcourir la dApp.</li>
              <li>Adresses wallet : localStorage + API publiques MultiversX.</li>
              <li>Paiements carte : politiques Stripe / Paybox / tiers.</li>
              <li>ID invité fiat : local, lié au claim erd1 ultérieur.</li>
            </ul>
          </>
        )}

        {tab === 'risk' && (
          <>
            <h2 className="text-base font-semibold text-white">Avertissements</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Crypto / NFT : risque de perte en capital. Pas un conseil en investissement.</li>
              <li>Simulation ≠ performance réelle.</li>
              <li>Vérifiez adresses et montants avant toute signature.</li>
              <li>Bugs et congestions réseau possibles.</li>
            </ul>
          </>
        )}

        {tab === 'process' && (
          <>
            <h2 className="text-base font-semibold text-white">Processus produit</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                <strong className="text-zinc-300">Connexion</strong> — xPortal, extension, Web Wallet,
                ou ID temporaire fiat.
              </li>
              <li>
                <strong className="text-zinc-300">Checkout</strong> — crypto on-chain ou fiat tiers +
                webhook mint.
              </li>
              <li>
                <strong className="text-zinc-300">Stake / market</strong> — chaque action exige une
                signature explicite.
              </li>
            </ol>
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
      </p>
    </div>
  )
}
