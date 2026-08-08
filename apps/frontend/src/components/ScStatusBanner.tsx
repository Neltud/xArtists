import { Link } from 'react-router-dom'
import {
  AGENTS_LIVE,
  MARKETPLACE_LIVE,
  canBuyAgent,
  canListBuyNft,
} from '../config/scStatus'

/**
 * Honest SC banner — hides when both markets live (codeHash OK at build time).
 */
export default function ScStatusBanner() {
  if (canListBuyNft() && canBuyAgent()) return null

  const mkt = MARKETPLACE_LIVE ? 'live' : 'pas live (codeHash null)'
  const ag = AGENTS_LIVE ? 'live' : 'pas live (null)'

  return (
    <div
      className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-100/95 leading-relaxed"
      role="status"
    >
      <strong className="text-amber-200">On-chain market :</strong> NFT marketplace{' '}
      <span className="text-amber-300/90">{mkt}</span> · agents{' '}
      <span className="text-amber-300/90">{ag}</span>.{' '}
      {!canListBuyNft() && (
        <>
          List / Buy / Bid bloqués jusqu’au deploy +{' '}
          <code className="text-[10px]">verify_marketplace_codehash</code>.{' '}
        </>
      )}
      <Link to="/studio" className="underline text-purple-300">
        Studio
      </Link>{' '}
      ·{' '}
      <Link to="/gallery" className="underline text-purple-300">
        Galerie
      </Link>{' '}
      consultables. Deploy : <code className="text-[10px]">docs/SC_DEPLOY_OPTIMIZED.md</code>
    </div>
  )
}
