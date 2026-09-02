/**
 * Wallet utilisateur — soldes + NFTs on-chain (API MultiversX).
 */
import { Link } from 'react-router-dom'
import PageGuide from '../components/PageGuide'
import InfoTip from '../components/InfoTip'
import WalletConnectPanel from '../components/WalletConnectPanel'
import MyNftPacksStrip from '../components/MyNftPacksStrip'
import BridgeUsdtCard from '../components/BridgeUsdtCard'
import { useWallet } from '../context/WalletContext'
import { useUserAccount, type UserNft } from '../hooks/useUserAccount'
import { requestOpenConnect } from '../lib/walletEvents'
import { LINKS } from '../config/links'

function nftThumb(n: UserNft): string | undefined {
  if (n.url && /^https?:\/\//i.test(n.url)) return n.url
  const m = n.media?.[0]?.url
  if (m && /^https?:\/\//i.test(m)) return m
  return undefined
}

export default function Wallet() {
  const { connected, address, shortAddress, method, canAttemptSign } = useWallet()
  const account = useUserAccount(connected ? address : null)

  const egldLabel =
    account.loading || !connected
      ? null
      : Number.isFinite(account.balanceEgld)
        ? account.balanceEgld.toLocaleString('en-US', { maximumFractionDigits: 6 })
        : '—'

  return (
    <div className="animate-fade-in space-y-5 pb-10 max-w-xl">
      <PageGuide page="wallet" />

      <header className="space-y-2 mb-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Compte</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Wallet</h1>
        <p className="text-sm text-zinc-400 inline-flex flex-wrap items-center gap-1">
          Votre portefeuille MultiversX
          <InfoTip>
            <strong className="text-white block mb-1">Sécurité</strong>
            <span className="text-zinc-400">
              Utilisez uniquement votre adresse. Ne jamais coller une adresse protocole ou ops.
            </span>
          </InfoTip>
        </p>
      </header>

      <BridgeUsdtCard />

      {!connected ? (
        <div className="rounded-2xl border border-white/10 bg-zinc-950/50 p-5 space-y-4">
          <p className="text-sm text-zinc-400">
            Connectez Web Wallet, xPortal ou l’extension pour voir vos soldes et NFT.
          </p>
          <button type="button" className="btn-primary" onClick={() => requestOpenConnect()}>
            Connecter
          </button>
          <WalletConnectPanel />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-zinc-950/50 p-4 space-y-2">
            <p className="text-[11px] text-zinc-500">Adresse</p>
            <p className="font-mono text-xs text-zinc-300 break-all">{address}</p>
            <p className="text-[11px] text-zinc-600">
              {shortAddress}
              {method ? ` · ${method}` : ''}
              {!canAttemptSign ? ' · lecture seule' : ''}
            </p>
            {egldLabel != null && (
              <p className="text-lg font-semibold text-white pt-1">
                {egldLabel}{' '}
                <span className="text-sm font-normal text-zinc-500">EGLD</span>
              </p>
            )}
            {account.loading && <p className="text-xs text-zinc-500">Mise à jour…</p>}
          </div>

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">NFT</h2>
              <Link to="/museum?tab=mine" className="text-[11px] text-zinc-400 hover:text-white">
                Voir en galerie →
              </Link>
            </div>
            {account.loading && !(account.nfts || []).length ? (
              <p className="text-xs text-zinc-500">Lecture…</p>
            ) : !(account.nfts || []).length ? (
              <p className="text-xs text-zinc-500 rounded-xl border border-white/5 px-3 py-4">
                Aucun NFT sur cette adresse.
              </p>
            ) : (
              <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {(account.nfts || []).slice(0, 24).map(n => (
                  <li
                    key={n.identifier}
                    className="rounded-xl border border-white/10 overflow-hidden bg-black/40 aspect-square"
                  >
                    {nftThumb(n) ? (
                      <img
                        src={nftThumb(n)}
                        alt={n.name || n.identifier}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-[10px] text-zinc-600 p-1 text-center">
                        {n.name || n.identifier.slice(0, 12)}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <MyNftPacksStrip />

          <p className="text-[11px] text-zinc-600">
            <a
              href={address ? LINKS.explorerAccount(address) : LINKS.explorer}
              target="_blank"
              rel="noreferrer"
              className="hover:text-zinc-400"
            >
              Explorer MultiversX
            </a>
            {' · '}
            <Link to="/my-packs" className="hover:text-zinc-400">
              My Packs
            </Link>
          </p>
        </div>
      )}
    </div>
  )
}
