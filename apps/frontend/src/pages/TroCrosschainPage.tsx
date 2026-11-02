/**
 * Public TRO explorer + prospective Solana bridge page.
 * Read-only by design: no wallet connection, quote, deposit instruction, swap
 * execution or fabricated Solana SPL mint. Every trading link leaves xArtists.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAccessApiBase } from '../lib/stripe'
import { TRO_TOKEN_ID, TRO_YIELD_POOLS } from '../config/troPools'
import './troCrosschain.css'

const EXPLORER = 'https://explorer.multiversx.com/tokens/' + TRO_TOKEN_ID
const DEX = TRO_YIELD_POOLS.find(p => p.dex === 'xexchange')
const API = 'https://xartists-access-api.onrender.com'

type BridgeStatus = {
  ok?: boolean
  bridge?: { status?: string; transferAvailable?: boolean; quoteAvailable?: boolean }
  sale?: { directSaleLive?: boolean; price?: number | null; paymentAddress?: string | null }
  destination?: { mintAddress?: string | null }
  source?: { tokenIdentifier?: string }
}

const preparation = [
  {
    number: '01', name: 'Vérifier le jeton',
    text: 'Vérification indépendante de l’identifiant, du contrat émetteur, de la supply et des décimales $TRO sur MultiversX.',
  },
  {
    number: '02', name: 'Sécuriser l’interopérabilité',
    text: 'Conception du verrouillage ou de la combustion contrôlée, validation des messages, anti-rejeu, finalité et circuit d’urgence.',
  },
  {
    number: '03', name: 'Auditer la représentation Solana',
    text: 'Adresse du mint SPL publiquement attestée, autorité multisignature, politique de liquidité et preuve de couverture.',
  },
  {
    number: '04', name: 'Activer après validation',
    text: 'Essais réseau de test, audit indépendant, surveillance de la supply et autorisations explicites pour chaque transfert.',
  },
]

export default function TroCrosschainPage() {
  const [remote, setRemote] = useState<BridgeStatus | null>(null)
  const [apiState, setApiState] = useState<'loading' | 'ok' | 'offline'>('loading')
  useEffect(() => {
    const abort = new AbortController()
    const base = getAccessApiBase() || API
    fetch(base + '/v1/tro/bridge/status', {
      signal: abort.signal, cache: 'no-store',
    }).then(async r => {
      if (!r.ok) throw new Error('bridge_status_unavailable')
      return r.json() as Promise<BridgeStatus>
    }).then(data => {
      if (abort.signal.aborted) return
      if (data?.source?.tokenIdentifier !== TRO_TOKEN_ID) {
        setApiState('offline')
        return
      }
      setRemote(data)
      setApiState('ok')
    }).catch(() => {
      if (!abort.signal.aborted) setApiState('offline')
    })
    return () => abort.abort()
  }, [])

  const bridgeReady =
    remote?.bridge?.status === 'active' &&
    remote?.bridge?.transferAvailable === true &&
    Boolean(remote?.destination?.mintAddress)
  const saleReady =
    remote?.sale?.directSaleLive === true &&
    Boolean(remote?.sale?.paymentAddress) &&
    typeof remote?.sale?.price === 'number'
  // Backend intentionally guarantees false. Future implementations must
  // introduce audited, verified quote/payment flows before changing this UI.
  const launchReady = false && bridgeReady && saleReady

  return (
    <main className="tro-portal" id="tro-main">
      <div className="tro-portal__aura" aria-hidden="true" />
      <nav className="tro-portal__crumb" aria-label="Navigation">
        <Link to="/finance">Finance</Link>
        <span aria-hidden="true">/</span>
        <Link to="/tro">Token $TRO</Link>
        <span aria-hidden="true">/</span>
        <span>Solana & acquisition</span>
      </nav>

      <section className="tro-portal__hero" aria-labelledby="tro-hero-title">
        <div className="tro-portal__lead">
          <p className="tro-portal__eyebrow"><span aria-hidden="true">✳</span> XARTISTS · TOKEN & INTEROPÉRABILITÉ</p>
          <h1 id="tro-hero-title">One token.<br/><em>New horizons.</em></h1>
          <p className="tro-portal__intro">
            Découvrez $TRO sur MultiversX. Suivez les étapes qui permettront,
            après audit, une représentation vérifiée sur Solana. Aucun dépôt ni
            vente directe n’est encore ouvert sur cette page.
          </p>
          <div className="tro-portal__actions">
            <a href={EXPLORER} target="_blank" rel="noopener noreferrer"
              className="tro-portal__btn tro-portal__btn--primary">
              Consulter $TRO sur Explorer <span aria-hidden="true">↗</span>
            </a>
            <Link to="/studio" className="tro-portal__btn tro-portal__btn--outline">
              Créer un NFT artiste <span aria-hidden="true">→</span>
            </Link>
          </div>
          <p className="tro-portal__micro">
            Une page d’information, non une offre de placement ni une promesse
            de rendement. Les prix et liquidités changent sur les marchés tiers.
          </p>
        </div>
        <div className="tro-portal__visual" aria-hidden="true">
          <div className="tro-portal__ring tro-portal__ring--outer" />
          <div className="tro-portal__ring tro-portal__ring--inner" />
          <div className="tro-portal__sphere"><span>TR<span className="tro-portal__o">O</span></span></div>
          <span className="tro-portal__orbitlabel tro-portal__orbitlabel--a">MULTIVERSX</span>
          <span className="tro-portal__orbitlabel tro-portal__orbitlabel--b">SOLANA · EN PRÉPARATION</span>
        </div>
      </section>

      <div className="tro-portal__statusline" role="status" aria-live="polite">
        <span className="tro-portal__status-indicator" aria-hidden="true"/>
        <strong>Bridge Solana : désactivé</strong>
        <span className="tro-portal__status-separator" aria-hidden="true"/>
        <span>Vente directe : non activée</span>
        <span className="tro-portal__status-separator" aria-hidden="true"/>
        <span>API : {apiState === 'loading' ? 'vérification…' : apiState === 'ok' ? 'statut consulté' : 'indisponible, sécurité conservée'}</span>
      </div>

      <section className="tro-portal__offers" aria-labelledby="tro-options-title">
        <div className="tro-portal__sectionhead">
          <p className="tro-portal__eyebrow">01 / ACCÈS AU TOKEN</p>
          <h2 id="tro-options-title">Choisissez le bon parcours.</h2>
          <p>Deux réseaux, deux étapes de maturité. Aucune conversion automatique entre les deux.</p>
        </div>
        <div className="tro-portal__cards">
          <article className="tro-portal__card">
            <div className="tro-portal__cardtop">
              <span className="tro-portal__tag tro-portal__tag--known">MULTIVERSX · TOKEN DE RÉFÉRENCE</span>
              <span aria-hidden="true">↗</span>
            </div>
            <h3>$TRO / MultiversX</h3>
            <p className="tro-portal__tokenid">{TRO_TOKEN_ID}</p>
            <p>Vérifiez l’émetteur, la liquidité et les frais depuis les sources externes avant d’acheter.</p>
            <div className="tro-portal__cardactions">
              {DEX && <a href={DEX.swapUrl} target="_blank" rel="noopener noreferrer"
                className="tro-portal__btn tro-portal__btn--primary">
                Voir l’échange sur xExchange <span aria-hidden="true">↗</span>
              </a>}
              <a href={EXPLORER} target="_blank" rel="noopener noreferrer"
                className="tro-portal__textlink">Contrôler le token sur Explorer ↗</a>
            </div>
            <small>Marché tiers : xArtists ne garantit ni cours, ni cotation, ni contrepartie.</small>
          </article>

          <article className="tro-portal__card tro-portal__card--solana">
            <div className="tro-portal__cardtop">
              <span className="tro-portal__tag">SOLANA · EN PRÉPARATION</span>
              <span aria-hidden="true">◎</span>
            </div>
            <h3>$TRO / Solana</h3>
            <p className="tro-portal__tokenid">Mint SPL officiel : non attesté</p>
            <p>Une représentation Solana nécessite une gouvernance et une preuve de couverture entre les deux chaînes.</p>
            <div className="tro-portal__cardactions">
              <button type="button" disabled aria-disabled="true"
                className="tro-portal__btn tro-portal__btn--disabled">
                Bridge non disponible
              </button>
              <p className="tro-portal__cardnote">Aucune adresse de dépôt ou transaction à signer.</p>
            </div>
            <small>Ne faites confiance à aucun « $TRO Solana » non identifié officiellement par xArtists.</small>
          </article>
        </div>
      </section>

      <section className="tro-portal__process" aria-labelledby="tro-roadmap-title">
        <div className="tro-portal__sectionhead">
          <p className="tro-portal__eyebrow">02 / CONSTRUCTION DU BRIDGE</p>
          <h2 id="tro-roadmap-title">La confiance avant la vitesse.</h2>
          <p>Un pont entre deux blockchains se déploie après preuves de sécurité, pas à partir d’un simple formulaire.</p>
        </div>
        <ol className="tro-portal__steps">
          {preparation.map(item => (
            <li key={item.number}>
              <span className="tro-portal__stepno">{item.number}</span>
              <div><h3>{item.name}</h3><p>{item.text}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <section className="tro-portal__bottom" aria-label="Transparence et liens">
        <div>
          <p className="tro-portal__eyebrow">03 / TRANSPARENCE</p>
          <h2>Jamais de fausse liquidité.</h2>
          <p>Le bridge et le checkout direct restent fermés. {launchReady ? 'En revue.' : 'Aucun prix public de vente directe, taux de conversion ou mint Solana ne sont affirmés.'} 
            Les œuvres physiques et leurs ventes Shopify/Etsy restent distinctes de $TRO et des NFTs.</p>
        </div>
        <div className="tro-portal__bottomlinks">
          <Link to="/marketplace">Marketplace d’art ↗</Link>
          <Link to="/studio">Studio NFT ↗</Link>
          <Link to="/legal">Mentions légales ↗</Link>
          <a href="https://github.com/Neltud/xArtists" target="_blank" rel="noopener noreferrer">Code public ↗</a>
        </div>
      </section>
    </main>
  )
}
