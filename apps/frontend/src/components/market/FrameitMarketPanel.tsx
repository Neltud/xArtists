/**
 * RWA Physical Art panel — certificats de provenance (pas d'agrégateur Frameit).
 */
import { Link } from 'react-router-dom'

export default function FrameitMarketPanel() {
  return (
    <section className="rounded-xl border border-amber-500/20 bg-black/40 p-4 backdrop-blur-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold tracking-tight text-white">RWA Physical Art</h2>
        <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-100">
          Provenance on-chain
        </span>
      </div>
      <div className="space-y-2 text-sm text-white/75">
        <p>
          Oeuvres physiques liees : dimensions, medium, chip NFC optionnel, certificat NFT MultiversX.
          Schema machine-readable dans <code className="text-amber-200/90">rwaMetadata.ts</code>.
        </p>
        <ul className="list-inside list-disc space-y-1 text-white/60">
          <li>Record de provenance vers metadata IPFS + NFT certificat</li>
          <li>NFC chip ID pour verification phygitale</li>
          <li>Escrow / livraison : bridge P2 (rwa_escrow)</li>
        </ul>
        <p className="text-xs text-white/40">
          Les packs IA (Pulse / Yield / Sentinel) sont des entitlements d acces — distincts des RWA
          physiques Studio.
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Link
            to="/studio"
            className="rounded-md bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-100 hover:bg-amber-500/30"
          >
            Studio Phygital
          </Link>
          <Link
            to="/agents"
            className="rounded-md border border-white/15 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5"
          >
            Packs Agents
          </Link>
        </div>
      </div>
    </section>
  )
}
