/**
 * Mentions legales · CGU demo · Confidentialite · Risques · Processus.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageGuide from '../components/PageGuide'
import { LINKS, LIA_WALLET } from '../config/links'
import { LEGAL_ENTITY, siretLabel } from '../config/legalEntity'

type Tab = 'mentions' | 'cgu' | 'privacy' | 'risk' | 'process'

const TABS: { id: Tab; label: string }[] = [
  { id: 'mentions', label: 'Mentions' },
  { id: 'cgu', label: 'Conditions' },
  { id: 'privacy', label: 'Confidentialite' },
  { id: 'risk', label: 'Risques' },
  { id: 'process', label: 'Processus' },
]

export default function LegalPage() {
  const [tab, setTab] = useState<Tab>('mentions')
  const year = useMemo(() => new Date().getFullYear(), [])
  const siret = siretLabel()
  const siretMissing = LEGAL_ENTITY.siretStatus !== 'ok'

  return (
    <div className="animate-fade-in space-y-5 pb-12 max-w-2xl">
      <PageGuide page="home" />

      <header className="space-y-1">
        <p className="section-label text-zinc-400">Juridique</p>
        <h1 className="page-title">Mentions legales</h1>
        <p className="page-sub">Editeur · demo · MultiversX mainnet</p>
      </header>

      {siretMissing && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-[12px] text-amber-100/90">
          SIRET editeur non renseigne dans la config. Les mentions resteront marquees « a
          completer » jusqu a saisie du numero officiel (14 chiffres).
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
        {tab === 'mentions' && (
          <>
            <h2 className="text-base font-semibold text-white">Editeur du site</h2>
            <p>
              <strong className="text-zinc-200">{LEGAL_ENTITY.productName}</strong> — projet edite
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
              Pays : {LEGAL_ENTITY.country}. Siege : {LEGAL_ENTITY.addressLine}.
            </p>
            <p>
              Depot open source :{' '}
              <a className="text-cyan-300/90 hover:underline" href={LINKS.github} target="_blank" rel="noreferrer">
                Neltud/xArtists
              </a>
              . Site demo :{' '}
              <a className="text-cyan-300/90 hover:underline" href={LINKS.dapp} target="_blank" rel="noreferrer">
                neltud.github.io/xArtists
              </a>
              .
            </p>
            <h2 className="text-base font-semibold text-white pt-2">Hebergement</h2>
            <p>{LEGAL_ENTITY.hoster}. Lectures de chaine via API publiques MultiversX ({LEGAL_ENTITY.chain}).</p>
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
            <h2 className="text-base font-semibold text-white">Conditions d utilisation (demo)</h2>
            <p>
              L acces a la dApp vaut acceptation des presentes. Service fourni « en l etat », a des
              fins de demonstration, test produit et exploration MultiversX.
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong className="text-zinc-300">Packs</strong> Pulse · Yield · Sentinel — pas un
                fond d'investissement, pas une promesse de rendement.
              </li>
              <li>
                <strong className="text-zinc-300">Tours / Musee</strong> : contenu culturel, hors
                packs agents.
              </li>
              <li>
                <strong className="text-zinc-300">Trading LIA</strong> : mode simulation par defaut
                sur la demo publique.
              </li>
              <li>
                Signature de transactions : uniquement via le wallet de l utilisateur (xPortal, Web
                Wallet, extension). Aucune cle privee n est stockee par la dApp.
              </li>
              <li>
                Certaines actions on-chain s'activent progressivement apres verification des
                contrats ; en attendant, un mode simulation reste disponible.
              </li>
              <li>
                Interdiction d utiliser le wallet protocole LIA comme session utilisateur.
              </li>
            </ul>
            <p className="text-[12px] text-zinc-500">
              Les regles on-chain des contrats (frais, pause) prevalent sur l interface.
            </p>
          </>
        )}

        {tab === 'privacy' && (
          <>
            <h2 className="text-base font-semibold text-white">Confidentialite</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Pas de compte e-mail obligatoire pour parcourir la demo.</li>
              <li>
                Adresses wallet : affichage local (localStorage) + requetes vers les API publiques
                MultiversX.
              </li>
              <li>
                localStorage : preferences UI, session wallet — effacable dans le navigateur
                (deconnexion / purge site).
              </li>
              <li>
                WalletConnect / xPortal : traitement par les prestataires de wallet ; la dApp ne
                recoit que l adresse apres approbation.
              </li>
              <li>
                Paiements carte (si configures) : Stripe / Paybox — politiques des prestataires.
              </li>
              <li>
                Pas de revente de listes d adresses. Donnees on-chain = publiques par nature.
              </li>
            </ul>
          </>
        )}

        {tab === 'risk' && (
          <>
            <h2 className="text-base font-semibold text-white">Avertissements</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Crypto / NFT : risque de perte en capital. Pas un conseil en investissement.</li>
              <li>Simulation ≠ performance reelle de portefeuille.</li>
              <li>
                Visites 3D : interpretation numerique, pas un jumeau BIM des musees physiques.
              </li>
              <li>Verifiez toujours adresses, montants et details avant signature.</li>
              <li>
                Slot / jeux (si actifs) : divertissement, age legal, pas un produit de jeu regule
                hors cadre applicable.
              </li>
              <li>Bugs logiciels et congestions reseau possibles — montants non garantis.</li>
            </ul>
          </>
        )}

        {tab === 'process' && (
          <>
            <h2 className="text-base font-semibold text-white">Processus produit (resume)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                <strong className="text-zinc-300">Connexion</strong> — Web Wallet, xPortal
                (QR desktop), ou extension. Coller une adresse = lecture seule.
              </li>
              <li>
                <strong className="text-zinc-300">Activation progressive</strong> — stake, marche
                et salles s'ouvrent au fur et a mesure des verifications contrats.
              </li>
              <li>
                <strong className="text-zinc-300">Stake $TRO</strong> — transfert signe dans votre
                wallet. Aucune cle stockee par la dApp.
              </li>
              <li>
                <strong className="text-zinc-300">Marketplace / salles</strong> — chaque action
                on-chain demande une signature explicite dans votre portefeuille.
              </li>
              <li>
                <strong className="text-zinc-300">Documentation</strong> — details techniques sur le
                depot GitHub (dossier docs/), hors interface grand public.
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
        {' · '}
        <Link to="/museum" className="text-cyan-300/90 hover:underline">
          Musee
        </Link>
      </p>
    </div>
  )
}
